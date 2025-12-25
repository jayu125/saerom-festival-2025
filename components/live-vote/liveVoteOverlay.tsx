"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import type { LiveVoteState } from "@/components/live-vote/useLiveVote";
import { Loader2, CheckCircle2 } from "lucide-react";

export function LiveVoteOverlay({ vote }: { vote: LiveVoteState }) {
  const { user } = useAuth();

  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);

  // ✅ 마지막으로 서버에 기록된 선택값(중복 write 방지)
  const lastWrittenRef = useRef<number | null>(null);

  // ✅ 디바운스 타이머
  const debounceRef = useRef<number | null>(null);

  // ✅ 안전: 현재 라운드에서 쓸 내 문서 ref (기존 경로 유지!)
  const myVoteDocRef = useMemo(() => {
    if (!user) return null;
    return doc(db, "liveVote", "current", "votes", user.uid);
  }, [user]);

  const progressPct = useMemo(() => {
    const totalMs = vote.duration * 1000;
    const elapsed = totalMs - vote.remainMs;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalMs) * 100)));
  }, [vote.duration, vote.remainMs]);

  const canVote = Boolean(user) && vote.remainMs > 0 && vote.active;

  const writeNow = async (choice: number) => {
    if (!user || !myVoteDocRef) return;
    if (!vote.active) return;
    if (vote.remainMs <= 0) return;

    // 같은 값이면 굳이 write 안함
    if (lastWrittenRef.current === choice) return;

    setSubmitting(true);
    try {
      await setDoc(
        myVoteDocRef,
        {
          uid: user.uid,
          choiceIndex: choice, // ✅ 관리자 집계 코드와 동일 키 사용
          choiceName: vote.candidates[choice] ?? "",
          round: vote.round,
          votedAt: serverTimestamp(),
        },
        { merge: true }
      );
      lastWrittenRef.current = choice;
      setSubmittedAt(Date.now());
    } catch (e) {
      console.error("[LiveVote] write failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ 선택 변경 → UI 즉시 반영 + 0.5초 뒤 write
  const onSelect = (idx: number) => {
    if (!canVote) return;
    setSelected(idx);

    // 디바운스 타이머 리셋
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      void writeNow(idx);
    }, 500);
  };

  // ✅ 라운드/후보 바뀌면 초기화 (이전 라운드 선택값 끌고오지 않기)
  useEffect(() => {
    setSelected(null);
    setSubmittedAt(null);
    lastWrittenRef.current = null;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, [vote.round, vote.candidates?.join("|")]);

  // ✅ 투표가 끝나거나(active false / remainMs<=0) 페이지에 남아있으면:
  //    디바운스 중이던 마지막 선택을 "즉시 한 번 flush"해서 저장 시도
  useEffect(() => {
    const ended = !vote.active || vote.remainMs <= 0;
    if (!ended) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (selected !== null && lastWrittenRef.current !== selected) {
      void writeNow(selected);
    }
  }, [vote.active, vote.remainMs]);

  // (선택) 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  // overlay 자체는 vote.active일 때만
  if (!vote.active) return null;

  return (
    <Backdrop>
      <Sheet>
        <Top>
          <Round>복면가왕 새롬 · Round {vote.round}</Round>
          <Timer>
            남은 시간 <b>{vote.remainSec}</b>s
          </Timer>
        </Top>

        <BarWrap>
          <Bar style={{ width: `${progressPct}%` }} />
        </BarWrap>

        <Title>새롬고등학교의 가왕을 뽑아주세요!</Title>
        <Desc>선택하면 자동 저장됩니다.</Desc>

        <Candidates>
          {vote.candidates.map((name, idx) => {
            const isActive = selected === idx;
            return (
              <CandidateButton
                key={idx}
                $active={isActive}
                onClick={() => onSelect(idx)}
                disabled={!canVote || submitting}
              >
                <CandidateName>{name}</CandidateName>
                <CandidateMeta>
                  {isActive ? "선택됨 ✓" : "탭해서 선택"}
                </CandidateMeta>
              </CandidateButton>
            );
          })}
        </Candidates>

        <Bottom>
          {!user ? (
            <Hint>로그인 후 투표할 수 있어요.</Hint>
          ) : (
            <Hint>
              {submittedAt ? (
                <Submitted>
                  <CheckCircle2 size={16} />
                  저장됨! (선택 변경하면 자동 갱신돼요)
                </Submitted>
              ) : (
                "선택하면 자동 저장됩니다."
              )}
            </Hint>
          )}
        </Bottom>
      </Sheet>
    </Backdrop>
  );
}

/* styled-components */

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Sheet = styled.div`
  width: 100%;
  max-width: 520px;
  border-radius: 20px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 18px 70px rgba(0, 0, 0, 0.35);
`;

const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Round = styled.div`
  font-weight: 800;
  font-size: 14px;
`;

const Timer = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);

  b {
    font-weight: 900;
    color: rgba(0, 0, 0, 0.9);
  }
`;

const BarWrap = styled.div`
  margin-top: 10px;
  height: 10px;
  width: 100%;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const Bar = styled.div`
  height: 100%;
  background: #111;
  transition: width 180ms linear;
`;

const Title = styled.h2`
  margin-top: 14px;
  font-size: 20px;
  font-weight: 900;
`;

const Desc = styled.p`
  margin-top: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
`;

const Candidates = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 10px;
`;

const CandidateButton = styled.button<{ $active: boolean }>`
  width: 100%;
  border-radius: 16px;
  padding: 14px 14px;
  text-align: left;
  border: 2px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  transition: 160ms ease;
  cursor: pointer;

  ${({ $active }) =>
    $active &&
    css`
      border-color: rgba(0, 0, 0, 0.9);
      background: rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CandidateName = styled.div`
  font-size: 18px;
  font-weight: 900;
`;

const CandidateMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
`;

const Bottom = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 10px;
`;

const Hint = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
`;

const Submitted = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.8);
`;

const SubmitButton = styled.button`
  width: 100%;
  border-radius: 14px;
  padding: 14px 14px;
  border: 0;
  background: #111;
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
