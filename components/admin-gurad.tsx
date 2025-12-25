"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isAdminUid } from "@/lib/admin";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (loading) return;
      if (!user) {
        if (!alive) return;
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        const ok = await isAdminUid(user.uid);
        if (!alive) return;
        setIsAdmin(ok);
      } catch (e) {
        console.error("[ADMIN_GUARD] admin check failed", e);
        if (!alive) return;
        setIsAdmin(false);
      } finally {
        if (!alive) return;
        setAdminLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [user, loading]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          관리자만 접근할 수 있는 페이지입니다.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
