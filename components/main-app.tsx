"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { BottomNavigation } from "@/components/bottom-navigation"
import { HomePage } from "@/components/pages/home-page"
import { BoothPage } from "@/components/pages/booth-page"
import { StampPage } from "@/components/pages/stamp-page"
import { ProfilePage } from "@/components/pages/profile-page"

export type TabType = "home" | "booth" | "stamp" | "profile"

export function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const { userProfile } = useAuth()

  if (!userProfile) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      {activeTab === "home" && <HomePage />}
      {activeTab === "booth" && <BoothPage />}
      {activeTab === "stamp" && <StampPage />}
      {activeTab === "profile" && <ProfilePage />}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
