"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LiveCurrent = {
  active: boolean;
  round: number;
  candidates: string[];
  startedAt?: any;
  duration?: number;
  ended?: boolean;
};

type RoundResultDoc = {
  round: number;
  candidates: string[];
  totalVotes: number;
  counts: number[]; // [0,1]
  winnerIndex: number;
  winnerName: string;
  startedAt: any | null;
  endedAt: any;
};

type Counts = Record<number, number>;

function clampCandidates(a: string, b: string) {
  const c0 = (a ?? "").trim();
  const c1 = (b ?? "").trim();
  if (!c0 || !c1) return null;
  return [c0, c1] as string[];
}

export default function AdminLiveVotePage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");

  const [current, setCurrent] = useState<LiveCurrent | null>(null);
  const [liveCounts, setLiveCounts] = useState<Counts>({});

  const [r1, setR1] = useState<RoundResultDoc | null>(null);
  const [r2, setR2] = useState<RoundResultDoc | null>(null);
  const [r3, setR3] = useState<RoundResultDoc | null>(null);

  // liveVote/current 구독
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "liveVote", "current"), (snap) => {
      setCurrent(snap.exists() ? (snap.data() as LiveCurrent) : null);
    });
    return () => unsub();
  }, []);

  // 현재 라운드 votes 실시간 집계(진행중 차트용)
  useEffect(() => {
    const votesRef = collection(db, "liveVote", "current", "votes");
    const unsub = onSnapshot(votesRef, (snap) => {
      const ccc: Counts = {};
      snap.forEach((d) => {
        const idx = (d.data() as any).choiceIndex as number | undefined;
        if (idx === 0 || idx === 1) ccc[idx] = (ccc[idx] || 0) + 1;
      });
      setLiveCounts(ccc);
    });
    return () => unsub();
  }, []);

  // 라운드 결과 스냅샷 구독(차트 유지용)
  useEffect(() => {
    const unsubs = [1, 2, 3].map((round) =>
      onSnapshot(
        doc(db, "liveVote", "current", "rounds", String(round)),
        (snap) => {
          const data = snap.exists() ? (snap.data() as RoundResultDoc) : null;
          if (round === 1) setR1(data);
          if (round === 2) setR2(data);
          if (round === 3) setR3(data);
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  // ✅ 투표 시작
  const startVote = async (round: number, candidates: string[]) => {
    if (candidates.length !== 2) return;
    if (!candidates[0]?.trim() || !candidates[1]?.trim()) return;

    // ✅ 먼저 votes 비우기 (이전 라운드 찌꺼기 제거 + 시작 직후 삭제 사고 방지)
    await clearCurrentVotes();

    // ✅ 시작 시 current 갱신
    await setDoc(doc(db, "liveVote", "current"), {
      active: true,
      round,
      candidates: [candidates[0].trim(), candidates[1].trim()],
      startedAt: serverTimestamp(),
      duration: 30,
      ended: false,
    });

    // ✅ 라운드 스냅샷 startedAt 기록
    await setDoc(
      doc(db, "liveVote", "current", "rounds", String(round)),
      {
        round,
        candidates: [candidates[0].trim(), candidates[1].trim()],
        startedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // ✅ current/votes 전체 삭제 (안전하게 batch로)
  const clearCurrentVotes = async () => {
    const votesRef = collection(db, "liveVote", "current", "votes");
    const snap = await getDocs(votesRef);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  // ✅ 현재 라운드 종료: votes 집계 → rounds/{round}에 저장 → current 비활성화 → votes 비우기
  const finalizeCurrentRound = async () => {
    const curSnap = await getDoc(doc(db, "liveVote", "current"));
    if (!curSnap.exists()) return;

    const cur = curSnap.data() as LiveCurrent;
    if (!cur.round || !cur.candidates || cur.candidates.length !== 2) return;

    const votesRef = collection(db, "liveVote", "current", "votes");
    const votesSnap = await getDocs(votesRef);

    let c0 = 0;
    let c1 = 0;
    votesSnap.forEach((d) => {
      const idx = (d.data() as any).choiceIndex as number | undefined;
      if (idx === 0) c0++;
      if (idx === 1) c1++;
    });

    const total = c0 + c1;
    // 동점이면 0을 승자로 처리(원하면 규칙 바꿔도 됨)
    const winnerIndex = c1 > c0 ? 1 : 0;
    const winnerName = cur.candidates[winnerIndex];

    await setDoc(
      doc(db, "liveVote", "current", "rounds", String(cur.round)),
      {
        round: cur.round,
        candidates: cur.candidates,
        totalVotes: total,
        counts: [c0, c1],
        winnerIndex,
        winnerName,
        startedAt: cur.startedAt ?? null,
        endedAt: serverTimestamp(),
      } satisfies Partial<RoundResultDoc>,
      { merge: true }
    );

    // current 종료 표시(오버레이는 클라이언트 타이머로도 사라짐)
    await setDoc(
      doc(db, "liveVote", "current"),
      { active: false, ended: true },
      { merge: true }
    );

    // 다음 라운드 위해 votes 비우기
    await clearCurrentVotes();
  };

  // ✅ 결승 자동 시작: rounds/1 winner + rounds/2 winner로 candidates 구성
  const startFinalAuto = async () => {
    const r1Snap = await getDoc(doc(db, "liveVote", "current", "rounds", "1"));
    const r2Snap = await getDoc(doc(db, "liveVote", "current", "rounds", "2"));
    if (!r1Snap.exists() || !r2Snap.exists()) return;

    const rr1 = r1Snap.data() as RoundResultDoc;
    const rr2 = r2Snap.data() as RoundResultDoc;

    if (!rr1.winnerName || !rr2.winnerName) return;

    await startVote(3, [rr1.winnerName, rr2.winnerName]);
  };

  // (UI 도움) 버튼용 후보 배열
  const ab = useMemo(() => clampCandidates(a, b), [a, b]);
  const cd = useMemo(() => clampCandidates(c, d), [c, d]);

  // 진행중 차트 계산
  const liveTotal = (liveCounts[0] || 0) + (liveCounts[1] || 0);
  const liveCand0 = current?.candidates?.[0] ?? "(미정)";
  const liveCand1 = current?.candidates?.[1] ?? "(미정)";
  const liveV0 = liveCounts[0] || 0;
  const liveV1 = liveCounts[1] || 0;

  return (
    <Wrap>
      <Card>
        <CardHeader>
          <CardTitle>가왕전 투표 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Grid>
            <Field>
              <Label>A</Label>
              <Input
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="A 후보 이름"
              />
            </Field>
            <Field>
              <Label>B</Label>
              <Input
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="B 후보 이름"
              />
            </Field>
            <Field>
              <Label>C</Label>
              <Input
                value={c}
                onChange={(e) => setC(e.target.value)}
                placeholder="C 후보 이름"
              />
            </Field>
            <Field>
              <Label>D</Label>
              <Input
                value={d}
                onChange={(e) => setD(e.target.value)}
                placeholder="D 후보 이름"
              />
            </Field>
          </Grid>

          <BtnRow>
            <Button onClick={() => ab && startVote(1, ab)} disabled={!ab}>
              AB 투표 시작
            </Button>
            <Button onClick={() => cd && startVote(2, cd)} disabled={!cd}>
              CD 투표 시작
            </Button>
            <Button onClick={startFinalAuto} variant="secondary">
              결승 자동 시작 (AB승자 vs CD승자)
            </Button>
            <Button variant="outline" onClick={finalizeCurrentRound}>
              라운드 종료(집계 저장)
            </Button>
          </BtnRow>

          <SmallInfo>
            현재 상태:{" "}
            <b style={{ color: current?.active ? "green" : "crimson" }}>
              {current?.active ? "진행중" : "중지"}
            </b>
            {typeof current?.round === "number" && (
              <>
                {" "}
                · Round <b>{current.round}</b>
              </>
            )}
          </SmallInfo>
        </CardContent>
      </Card>

      {/* ✅ 진행중 실시간 차트 */}
      <ChartCard
        title={`(진행중) Round ${current?.round ?? "-"} 실시간`}
        leftName={liveCand0}
        rightName={liveCand1}
        leftVotes={liveV0}
        rightVotes={liveV1}
        total={liveTotal}
      />

      {/* ✅ 라운드별 결과 차트(유지) */}
      <RoundResultCard round={1} data={r1} />
      <RoundResultCard round={2} data={r2} />
      <RoundResultCard round={3} data={r3} />
    </Wrap>
  );
}

/* ---------- 차트 컴포넌트 ---------- */

function RoundResultCard({
  round,
  data,
}: {
  round: number;
  data: RoundResultDoc | null;
}) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Round {round} 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <SmallInfo>아직 저장된 결과가 없습니다.</SmallInfo>
        </CardContent>
      </Card>
    );
  }

  const leftName = data.candidates?.[0] ?? "(미정)";
  const rightName = data.candidates?.[1] ?? "(미정)";
  const leftVotes = data.counts?.[0] ?? 0;
  const rightVotes = data.counts?.[1] ?? 0;
  const total = data.totalVotes ?? leftVotes + rightVotes;

  return (
    <ChartCard
      title={`Round ${round} 결과 · 승자: ${data.winnerName ?? "-"}`}
      leftName={leftName}
      rightName={rightName}
      leftVotes={leftVotes}
      rightVotes={rightVotes}
      total={total}
    />
  );
}

function ChartCard({
  title,
  leftName,
  rightName,
  leftVotes,
  rightVotes,
  total,
}: {
  title: string;
  leftName: string;
  rightName: string;
  leftVotes: number;
  rightVotes: number;
  total: number;
}) {
  const p0 = total ? Math.round((leftVotes / total) * 100) : 0;
  const p1 = total ? Math.round((rightVotes / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row>
          <NameBox>
            <b>{leftName}</b>
            <span>
              {leftVotes}표 · {p0}%
            </span>
          </NameBox>
          <BarWrap>
            <Bar style={{ width: `${p0}%` }} />
          </BarWrap>
        </Row>

        <Row>
          <NameBox>
            <b>{rightName}</b>
            <span>
              {rightVotes}표 · {p1}%
            </span>
          </NameBox>
          <BarWrap>
            <Bar style={{ width: `${p1}%` }} />
          </BarWrap>
        </Row>

        <SmallInfo>총 {total}표</SmallInfo>
      </CardContent>
    </Card>
  );
}

/* ---------- styled ---------- */

const Wrap = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Grid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.65);
`;

const Input = styled.input`
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  background: #fff;

  &:focus {
    border-color: rgba(0, 0, 0, 0.75);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
  }
`;

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SmallInfo = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
`;

const NameBox = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;

  b {
    font-size: 14px;
  }
  span {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.55);
  }
`;

const BarWrap = styled.div`
  height: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const Bar = styled.div`
  height: 100%;
  background: #111;
  transition: width 200ms linear;
`;
