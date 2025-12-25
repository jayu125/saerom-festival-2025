"use client";

import styled, { css } from "styled-components";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminGuard } from "@/components/admin-gurad";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import FinalizeAdminPage from "@/components/admin/FinalizePanel";
import ManualTagPage from "@/components/admin/ManualTagPanel";
import BoothImageUploadPage from "@/components/admin/BoothImagePanel";
import WhitelistPage from "@/components/admin/WhitelistPanel";

//여기 패널들 임포트하기

type TabKey = "finalize" | "manual-tag" | "booth-image" | "white-list";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  {
    key: "finalize",
    label: "최종결산",
    desc: "반별 인당 평균 마일리지 계산/저장",
  },
  { key: "manual-tag", label: "수동태그", desc: "NFC 없는 학생 방문 처리" },
  { key: "booth-image", label: "부스사진", desc: "부스 이미지 업로드/연결" },
  { key: "white-list", label: "화이트리스트", desc: "수동태그 대상 학생 등록" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const tab = useMemo(() => {
    const t = sp.get("tab") as TabKey | null;
    if (!t) return "finalize";
    return (TABS.some((x) => x.key === t) ? t : "finalize") as TabKey;
  }, [sp]);

  const activeMeta = TABS.find((t) => t.key === tab)!;

  const setTab = (next: TabKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    router.replace(url.pathname + url.search);
  };

  return (
    <AdminGuard>
      <Page>
        <Header>
          <H1>관리자 패널</H1>
          <Sub>축제 운영 도구 모음</Sub>
        </Header>

        <TabBar>
          {TABS.map((t) => (
            <TabBtn
              key={t.key}
              $active={t.key === tab}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </TabBtn>
          ))}
        </TabBar>

        <Card>
          <CardHeader>
            <CardTitle>{activeMeta.label}</CardTitle>
            <CardDescription>{activeMeta.desc}</CardDescription>
          </CardHeader>

          <CardContent>
            {tab === "finalize" && <FinalizeAdminPage />}
            {tab === "manual-tag" && <ManualTagPage />}
            {tab === "booth-image" && <BoothImageUploadPage />}
            {tab === "white-list" && <WhitelistPage />}
          </CardContent>
        </Card>

        <Hint>
          💡 상단 탭을 눌러 기능을 전환할 수 있어요. 링크는{" "}
          <code>?tab=...</code>로 유지됩니다.
        </Hint>
      </Page>
    </AdminGuard>
  );
}

/* styled-components */

const Page = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const H1 = styled.h1`
  font-size: 20px;
  font-weight: 900;
`;

const Sub = styled.p`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
`;

const TabBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TabBtn = styled.button<{ $active: boolean }>`
  height: 44px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 13px;
  border: 2px solid #e5e7eb;
  background: #fff;
  color: #111827;
  transition: all 140ms ease;
  cursor: pointer;

  ${({ $active }) =>
    $active &&
    css`
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    `}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.15);
  }
`;

const Hint = styled.p`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 8px;
  }
`;
