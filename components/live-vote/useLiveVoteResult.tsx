"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useLiveVoteResults() {
  const [counts, setCounts] = useState({ A: 0, B: 0, C: 0, D: 0 });

  useEffect(() => {
    const ref = collection(db, "liveVote", "current", "votes");
    return onSnapshot(ref, (snap) => {
      const c = { A: 0, B: 0, C: 0, D: 0 };
      snap.forEach((d) => {
        const v = d.data().choice;
        if (c[v as keyof typeof c] !== undefined) c[v]++;
      });
      setCounts(c);
    });
  }, []);

  return counts;
}
