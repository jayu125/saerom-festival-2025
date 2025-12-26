"use client";

import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "./usePresence";

function toNumOrUndef(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function PresenceGate() {
  const { user, userProfile } = useAuth();

  usePresence(user?.uid, {
    name: (userProfile as any)?.name ?? (userProfile as any)?.displayName ?? "",
    grade: toNumOrUndef((userProfile as any)?.grade),
    class: toNumOrUndef((userProfile as any)?.class),
    number: toNumOrUndef((userProfile as any)?.number),
  });

  return null;
}
