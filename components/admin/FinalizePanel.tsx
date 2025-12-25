"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ClassStat = {
  grade: number;
  class: number;
  memberCount: number;
  totalBaseMileage: number;
  avgBaseMileage: number;
};

function isAdmin(email?: string | null) {
  // ✅ 원본과 동일: 클라 가드(하드코딩)
  const admins = new Set(["admin@saerom.hs.kr", "2411129@saerom.hs.kr"]);
  return !!email && admins.has(email);
}

export default function FinalizeAdminPage() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<ClassStat[]>([]);

  const top3 = useMemo(() => stats.slice(0, 3), [stats]);
  const winner = useMemo(() => (stats.length > 0 ? stats[0] : null), [stats]);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "users"));

      const map = new Map<
        string,
        { grade: number; klass: number; count: number; total: number }
      >();

      snap.forEach((d) => {
        const u = d.data() as any;
        const grade = Number(u.grade);
        const klass = Number(u.class);
        const base = Number(u.baseMileage ?? 0);

        // grade/class가 없거나 비정상인 문서는 제외
        if (!Number.isFinite(grade) || !Number.isFinite(klass)) return;

        const key = `${grade}-${klass}`;
        const prev = map.get(key) ?? { grade, klass, count: 0, total: 0 };

        map.set(key, {
          grade,
          klass,
          count: prev.count + 1, // ✅ users 문서 수 = 인원
          total: prev.total + (Number.isFinite(base) ? base : 0),
        });
      });

      const list: ClassStat[] = Array.from(map.values())
        .map((v) => ({
          grade: v.grade,
          class: v.klass,
          memberCount: v.count,
          totalBaseMileage: v.total,
          avgBaseMileage: v.count > 0 ? v.total / v.count : 0,
        }))
        .sort((a, b) => b.avgBaseMileage - a.avgBaseMileage);

      setStats(list);
    } catch (e) {
      console.error("[FINALIZE] failed", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveSnapshot = async () => {
    if (stats.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const id = `final_${Date.now()}`;

      await setDoc(doc(db, "classStats", id), {
        type: "avg_baseMileage_per_student",
        createdAt: serverTimestamp(),

        // ✅ 나중에 확인 편해서 같이 저장(원치 않으면 삭제 가능)
        winner: winner
          ? {
              grade: winner.grade,
              class: winner.class,
              memberCount: winner.memberCount,
              totalBaseMileage: winner.totalBaseMileage,
              avgBaseMileage: Math.floor(winner.avgBaseMileage),
            }
          : null,
        top3: top3.map((s) => ({
          grade: s.grade,
          class: s.class,
          memberCount: s.memberCount,
          totalBaseMileage: s.totalBaseMileage,
          avgBaseMileage: Math.floor(s.avgBaseMileage),
        })),

        rows: stats,
      });

      alert("스냅샷 저장 완료(classStats)");
    } catch (e) {
      console.error("[FINALIZE] save failed", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Wrap>로딩...</Wrap>;
  if (!user) return <Wrap>로그인이 필요합니다.</Wrap>;
  if (!isAdmin(user.email)) return <Wrap>접근 권한이 없습니다.</Wrap>;

  return (
    <Wrap>
      <Card>
        <CardHeader>
          <CardTitle>최종 결산: 반별 1인당 평균 마일리지</CardTitle>
        </CardHeader>
        <CardContent>
          <Row>
            <Button onClick={run} disabled={busy}>
              {busy ? "계산 중..." : "계산 실행"}
            </Button>
            <Button
              onClick={saveSnapshot}
              variant="secondary"
              disabled={busy || stats.length === 0}
            >
              스냅샷 저장(classStats)
            </Button>
          </Row>

          {error && <Err>에러: {error}</Err>}

          {top3.length > 0 && (
            <Top>
              <b>TOP 3</b>
              <ul>
                {top3.map((s) => (
                  <li key={`${s.grade}-${s.class}`}>
                    {s.grade}학년 {s.class}반 — 평균{" "}
                    {Math.floor(s.avgBaseMileage).toLocaleString()}점 (총{" "}
                    {s.totalBaseMileage.toLocaleString()} / {s.memberCount}명)
                  </li>
                ))}
              </ul>
            </Top>
          )}

          {stats.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>반</th>
                  <th>인원</th>
                  <th>총합(base)</th>
                  <th>평균(base)</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={`${s.grade}-${s.class}`}>
                    <td>{i + 1}</td>
                    <td>
                      {s.grade}-{s.class}
                    </td>
                    <td>{s.memberCount}</td>
                    <td>{s.totalBaseMileage.toLocaleString()}</td>
                    <td>{Math.floor(s.avgBaseMileage).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Wrap>
  );
}

const Wrap = styled.div`
  padding: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const Err = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 0, 0, 0.08);
`;

const Top = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
`;

const Table = styled.table`
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    text-align: left;
    font-size: 14px;
  }
`;
