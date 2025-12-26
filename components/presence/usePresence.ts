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

function cleanUndefined<T extends Record<string, any>>(obj?: T) {
  if (!obj) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function usePresence(uid?: string | null, meta?: PresenceMeta) {
  useEffect(() => {
    if (!uid) return;

    const connectedRef = ref(rtdb, ".info/connected");
    const userRef = ref(rtdb, `presence/${uid}`);

    const metaClean = cleanUndefined(meta);

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;

      const offlinePayload = {
        state: "offline" as const,
        lastChanged: serverTimestamp(),
        ...metaClean,
      };

      const onlinePayload = {
        state: "online" as const,
        lastChanged: serverTimestamp(),
        ...metaClean,
      };

      // ✅ 끊기면 offline
      onDisconnect(userRef).set(offlinePayload);

      // ✅ 연결되면 online
      set(userRef, onlinePayload);
    });

    return () => unsub();
  }, [uid, meta?.name, meta?.grade, meta?.class, meta?.number]);
}
