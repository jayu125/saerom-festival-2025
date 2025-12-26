import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/auth-context";
import { LiveVoteGate } from "@/components/live-vote/liveVoteGage";
import { PresenceGate } from "@/components/presense/presenceGate";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "새롬 축제 - NFC 스마트 축제",
  description:
    "NFC 태깅으로 즐기는 새롬고 축제! 부스 방문, 퀴즈 참여로 마일리지를 적립하세요.",
  generator: "v0.app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e85d4c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          {/* ✅ 관리자 라우트에서는 자동으로 숨김 */}
          <LiveVoteGate />
          <PresenceGate />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
