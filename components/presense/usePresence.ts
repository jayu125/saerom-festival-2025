"use client";

import { useEffect } from "react";
import {
  ref,
  onValue,
  set,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { rtdb } from "@/lib/firebase";

type PresenceMeta = {
  name?: string;
  grade?: number;
  class?: number;
  number?: number;
};

export function usePresence(uid?: string | null, meta?: PresenceMeta) {
  useEffect(() => {
    if (!uid) return;

    const connectedRef = ref(rtdb, ".info/connected");
    const userRef = ref(rtdb, `presence/${uid}`);

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;

      // 끊기면 자동 offline
      onDisconnect(userRef).set({
        state: "offline",
        lastChanged: serverTimestamp(),
        ...meta,
      });

      // 연결되면 online
      set(userRef, {
        state: "online",
        lastChanged: serverTimestamp(),
        ...meta,
      });
    });

    return () => unsub();
  }, [uid, meta?.name, meta?.grade, meta?.class, meta?.number]);
}
