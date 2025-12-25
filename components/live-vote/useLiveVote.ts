"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LiveVoteDoc = {
  active: boolean;
  round: number;
  candidates: string[]; // length 2
  startedAt: Timestamp;
  duration: number; // seconds
  ended?: boolean;
};

export type LiveVoteState = {
  active: boolean;
  round: number;
  candidates: string[];
  duration: number;
  endAtMs: number;
  remainMs: number;
  remainSec: number;
};

export function useLiveVote(): LiveVoteState | null {
  const [raw, setRaw] = useState<LiveVoteDoc | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // liveVote/current 구독
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "liveVote", "current"), (snap) => {
      if (!snap.exists()) {
        setRaw(null);
        return;
      }
      setRaw(snap.data() as LiveVoteDoc);
    });
    return () => unsub();
  }, []);

  // 200ms마다 now 갱신(카운트다운/게이지)
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(t);
  }, []);

  return useMemo(() => {
    if (!raw) return null;
    if (!raw.active) return null;
    if (!raw.startedAt) return null;
    if (!Array.isArray(raw.candidates) || raw.candidates.length !== 2)
      return null;

    const startedAtMs = raw.startedAt.toDate().getTime();
    const endAtMs = startedAtMs + (raw.duration ?? 20) * 1000;

    const remainMs = Math.max(0, endAtMs - now);
    const remainSec = Math.ceil(remainMs / 1000);

    // ✅ “이중 안전장치”: 서버가 active=true로 남아도, 시간 끝나면 클라이언트는 자동으로 안 보이게 됨
    if (remainMs <= 0) return null;

    return {
      active: true,
      round: raw.round ?? 1,
      candidates: raw.candidates,
      duration: raw.duration ?? 20,
      endAtMs,
      remainMs,
      remainSec,
    };
  }, [raw, now]);
}
