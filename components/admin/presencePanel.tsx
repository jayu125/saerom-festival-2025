"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-gurad";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { get } from "firebase/database";

type PresenceRow = {
  state?: "online" | "offline";
  lastChanged?: any;
  name?: string;
  grade?: number;
  class?: number;
  number?: number;
};

export default function PresencePanel() {
  const [rows, setRows] = useState<Record<string, PresenceRow>>({});
  get(ref(rtdb, "presence")).then((s) => console.log("test", s.val()));

  useEffect(() => {
    const presenceRef = ref(rtdb, "presence");
    const unsub = onValue(presenceRef, (snap) => {
      setRows((snap.val() as any) ?? {});
    });
    return () => unsub();
  }, []);

  const onlineList = useMemo(() => {
    return Object.entries(rows)
      .filter(([, v]) => v?.state === "online")
      .map(([uid, v]) => ({ uid, ...v }));
  }, [rows]);

  const onlineCount = onlineList.length;

  const byGrade = useMemo(() => {
    const m = new Map<number, number>();
    for (const u of onlineList) {
      const g = Number(u.grade);
      if (!Number.isFinite(g) || g <= 0) continue;
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [onlineList]);

  return (
    <AdminGuard>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>현재 접속자(Online)</CardTitle>
            <CardDescription>
              RTDB Presence 기반. 새로고침 없이 실시간으로 변합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-black">{onlineCount}명</div>

            {byGrade.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {byGrade.map(([g, c]) => (
                  <span key={g} className="mr-3">
                    {g}학년 {c}명
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              ※ 브라우저가 백그라운드/절전 상태일 때 OS 정책에 따라 연결이 잠깐
              끊길 수 있어요.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
