import React from "react";
import { Clapperboard, History, SlidersHorizontal } from "lucide-react";
import { I18nCopy } from "../data/i18n";
import { WorkspaceTab } from "../types/prompt";

interface MobileBottomNavProps {
  copy: I18nCopy;
  activeTab: WorkspaceTab;
  savedCount: number;
  onSelectTab: (tab: WorkspaceTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  copy,
  activeTab,
  savedCount,
  onSelectTab,
}) => {
  const items: {
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: "studio",
      label: copy.navStudio,
      icon: SlidersHorizontal,
    },
    {
      id: "generator",
      label: copy.navGenerator,
      icon: Clapperboard,
    },
    {
      id: "history",
      label: copy.navHistory,
      icon: History,
      badge: savedCount > 0 ? savedCount : undefined,
    },
  ];

  const handleTap = (tab: WorkspaceTab) => {
    onSelectTab(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden dark:border-[#222634] dark:bg-[#0B0D12]/95 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTap(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                isActive
                  ? "font-bold text-amber-700 dark:text-[#F0C775]"
                  : "font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-amber-600 dark:bg-[#D4A34B]" />
              )}
              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className={`h-[19px] w-[19px] transition-transform ${
                    isActive ? "scale-105" : ""
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -end-2.5 -top-1.5 min-w-[16px] rounded-full bg-amber-600 px-1 py-0.2 text-center font-mono-code text-[9.5px] font-bold leading-[15px] text-white tabular-nums dark:bg-[#D4A34B] dark:text-[#110D05]">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
