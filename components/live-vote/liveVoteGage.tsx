"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LiveVoteOverlay } from "./liveVoteOverlay";
import { useLiveVote } from "@/components/live-vote/useLiveVote";

export function LiveVoteGate() {
  const pathname = usePathname();
  const vote = useLiveVote();

  // ✅ 관리자 페이지(/admin...)에서는 오버레이 숨김
  const isAdminRoute = useMemo(
    () => pathname?.startsWith("/admin"),
    [pathname]
  );

  if (isAdminRoute) return null;
  if (!vote?.active) return null;

  return <LiveVoteOverlay vote={vote} />;
}
