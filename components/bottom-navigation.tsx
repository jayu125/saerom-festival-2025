"use client";

import { Home, MapPin, Stamp, User, Trophy } from "lucide-react";
import type { TabType } from "@/components/main-app";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "home" as const, label: "홈", icon: Home },
  { id: "booth" as const, label: "부스", icon: MapPin },
  // { id: "stamp" as const, label: "스탬프", icon: Stamp },
  { id: "ranking" as const, label: "순위", icon: Trophy },
  { id: "profile" as const, label: "내정보", icon: User },
];

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn("w-5 h-5 mb-1", isActive && "fill-current")}
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
