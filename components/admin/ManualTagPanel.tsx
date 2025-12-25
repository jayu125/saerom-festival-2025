"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { AdminGuard } from "../admin-gurad";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

type WhitelistEntry = {
  studentId: string; // doc id 와 동일
  name: string;
  uid: string;
};

type BoothLite = {
  id: string; // booths random doc id
  boothIdx: number;
  name: string;
  location?: string;
};

export default function ManualTagPage() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [booths, setBooths] = useState<BoothLite[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBoothIdx, setSelectedBoothIdx] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      // whitelist 로드
      const ws = await getDocs(collection(db, "whitelist"));
      const listW: WhitelistEntry[] = ws.docs
        .map((d) => ({ ...(d.data() as any), studentId: d.id }))
        .sort((a, b) => a.studentId.localeCompare(b.studentId));
      setWhitelist(listW);

      // booths 로드
      const bs = await getDocs(collection(db, "booths"));
      const listB: BoothLite[] = bs.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((b: any) => Number.isFinite(Number(b.boothIdx)))
        .map((b: any) => ({
          id: b.id,
          boothIdx: Number(b.boothIdx),
          name: String(b.name ?? ""),
          location: b.location ? String(b.location) : "",
        }))
        .sort((a, b) => a.boothIdx - b.boothIdx);

      setBooths(listB);

      if (listW[0]) setSelectedStudentId(listW[0].studentId);
      if (listB[0]) setSelectedBoothIdx(String(listB[0].boothIdx));
    };

    load();
  }, []);

  const selectedUser = useMemo(() => {
    return whitelist.find((w) => w.studentId === selectedStudentId) ?? null;
  }, [whitelist, selectedStudentId]);

  const doVisit = async () => {
    setMsg("");

    if (!selectedUser) return setMsg("학생을 선택하세요.");
    const boothIdxNum = Number(selectedBoothIdx);
    if (!Number.isFinite(boothIdxNum)) return setMsg("부스를 선택하세요.");

    setBusy(true);
    try {
      // boothIdx로 booth 문서 찾기 (랜덤 id)
      const boothQ = query(
        collection(db, "booths"),
        where("boothIdx", "==", boothIdxNum)
      );
      const boothSnap = await getDocs(boothQ);

      if (boothSnap.empty) {
        setMsg(`boothIdx=${boothIdxNum} 부스를 찾지 못했습니다.`);
        return;
      }
      if (boothSnap.size > 1) {
        // ⚠️ 병합/정합성 검토 필요: 같은 boothIdx 문서가 여러 개
        const ids = boothSnap.docs.map((d) => d.id).join(", ");
        setMsg(
          `⚠️ boothIdx=${boothIdxNum} 문서가 여러 개입니다. 관리자 검토 필요: ${ids}`
        );
        return;
      }

      const boothDoc = boothSnap.docs[0];
      const boothDocId = boothDoc.id;

      // 방문 중복 확인: boothVisits/{boothIdx}
      const visitRef = doc(
        db,
        "users",
        selectedUser.uid,
        "boothVisits",
        String(boothIdxNum)
      );
      const visitSnap = await getDoc(visitRef);

      if (visitSnap.exists()) {
        setMsg("이미 방문 처리된 부스입니다. (중복)");
        return;
      }

      // 방문 기록 생성
      await setDoc(visitRef, {
        boothIdx: boothIdxNum,
        boothDocId,
        visitedAt: serverTimestamp(),
        mileageEarned: 100,
        manual: true,
      });

      // booths.visitCount 증가
      await setDoc(
        doc(db, "booths", boothDocId),
        { visitCount: increment(1) },
        { merge: true }
      );

      // user 마일리지/스탬프 증가
      await setDoc(
        doc(db, "users", selectedUser.uid),
        {
          baseMileage: increment(100),
          stampCount: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 로그
      await setDoc(
        doc(
          db,
          "users",
          selectedUser.uid,
          "logs",
          `manual_visit_${boothIdxNum}_${Date.now()}`
        ),
        {
          type: "visit",
          boothIdx: boothIdxNum,
          boothDocId,
          mileageChange: 100,
          timestamp: serverTimestamp(),
          manual: true,
        }
      );

      setMsg(
        `완료! ${selectedUser.studentId} (${selectedUser.name}) → ${boothIdxNum}번 방문 처리`
      );
    } catch (e) {
      console.error("[MANUAL_TAG] failed", e);
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminGuard>
      <Wrap>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>수동 태그 (NFC 대체)</CardTitle>
            <CardDescription>
              화이트리스트 학생을 선택하고 부스를 선택한 뒤 방문 처리합니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Label>학생 선택 (화이트리스트)</Label>
            <Select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {whitelist.map((w) => (
                <option key={w.studentId} value={w.studentId}>
                  {w.studentId} {w.name}
                </option>
              ))}
            </Select>

            <Label>부스 선택</Label>
            <Select
              value={selectedBoothIdx}
              onChange={(e) => setSelectedBoothIdx(e.target.value)}
            >
              {booths.map((b) => (
                <option key={b.id} value={String(b.boothIdx)}>
                  {b.boothIdx}. {b.name} {b.location ? `(${b.location})` : ""}
                </option>
              ))}
            </Select>

            <Button className="w-full" onClick={doVisit} disabled={busy}>
              {busy ? "처리 중..." : "방문 처리 ( +100 / 스탬프 +1 )"}
            </Button>

            {msg && <Msg>{msg}</Msg>}
          </CardContent>
        </Card>
      </Wrap>
    </AdminGuard>
  );
}

const Wrap = styled.div`
  padding: 16px;
  display: flex;
  justify-content: center;
`;

const Label = styled.div`
  font-size: 13px;
  font-weight: 700;
`;

const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

const Msg = styled.p`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  text-align: center;
`;
