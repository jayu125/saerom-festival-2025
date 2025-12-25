// app/admin/page.tsx
import { Suspense } from "react";
import AdminDashboardClient from "./AdminDashboardClient";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6">관리자 패널 로딩중...</div>}>
      <AdminDashboardClient />
    </Suspense>
  );
}
