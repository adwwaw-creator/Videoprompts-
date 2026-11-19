import React from "react";
import { Cloud, LogIn, LogOut, Menu, ShieldCheck, UserCheck, Users, X } from "lucide-react";
import { I18nCopy } from "../data/i18n";
import { WorkspaceTab } from "../types/prompt";

interface TopBarProps {
  copy: I18nCopy;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onBuildPrompt: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  isAdmin: boolean;
  currentUserEmail: string | null;
  currentUserName?: string | null;
  currentUserPhoto?: string | null;
  authLoading: boolean;
  totalVisits: number | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  copy,
  activeTab,
  onSelectTab,
  onBuildPrompt,
  mobileMenuOpen,
  onToggleMobileMenu,
  isAdmin,
  currentUserEmail,
  currentUserName,
  currentUserPhoto,
  authLoading,
  totalVisits,
  onSignIn,
  onSignOut,
}) => {
  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: "portal", label: copy.navPortal },
    { id: "generator", label: copy.navGenerator },
    { id: "director", label: copy.navDirector },
    { id: "studio", label: copy.navStudio },
    { id: "guide", label: copy.navGuide },
    { id: "history", label: copy.navHistory },
  ];

  const displayName =
    currentUserName?.trim() ||
    (currentUserEmail ? currentUserEmail.split("@")[0] : "");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-[#222634] dark:bg-[#0B0D12]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-2.5 py-2 sm:gap-6 sm:px-6 sm:py-3">
        {/* Zone 1: Single-line brand title */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle workspace menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-amber-600 hover:text-amber-700 sm:h-10 sm:w-10 lg:hidden dark:border-[#262B3A] dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-300"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("studio")}
            className="truncate text-sm sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded dark:text-slate-50"
          >
            <bdi dir="ltr">{copy.brand}</bdi>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Workspace navigation">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded ${
                  active
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-amber-600 dark:bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Account / Registration, Admin Visits & Primary Action */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "studio") onSelectTab("studio");
              }}
              title={`${copy.adminCounterTitle} · ${currentUserEmail || ""}`}
              className="inline-flex min-h-[36px] sm:min-h-[40px] items-center gap-1 sm:gap-1.5 rounded-lg border border-amber-500/50 bg-amber-50/80 px-2 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-amber-900 transition-colors hover:border-amber-600 dark:border-[#D4A34B]/50 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <Users className="hidden sm:block h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="font-mono-code tabular-nums">
                {totalVisits !== null ? totalVisits.toLocaleString() : "0"}
              </span>
            </button>
          )}

          {currentUserEmail ? (
            <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-50/60 px-2 py-1 dark:border-emerald-500/30 dark:bg-emerald-950/25">
              <button
                type="button"
                onClick={() => onSelectTab("history")}
                title={`${copy.accountCloudSyncActive} (${currentUserEmail})`}
                className="inline-flex min-h-[28px] sm:min-h-[30px] items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-900 dark:text-emerald-200"
              >
                {currentUserPhoto ? (
                  <img
                    src={currentUserPhoto}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {displayName}
                </span>
                <Cloud className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </button>
              <button
                type="button"
                disabled={authLoading}
                onClick={onSignOut}
                title={copy.btnSignOutAccount}
                aria-label={copy.btnSignOutAccount}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={authLoading}
              onClick={onSignIn}
              title={copy.btnSignInRegister}
              className="inline-flex min-h-[36px] sm:min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 disabled:opacity-50 whitespace-nowrap dark:border-[#2C3346] dark:bg-[#141824] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-[#D4A34B]" />
              <span className="hidden sm:inline">{copy.btnSignInRegister}</span>
              <span className="sm:hidden">{copy.accountSignedInLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeTab !== "studio") onSelectTab("studio");
              onBuildPrompt();
            }}
            className="min-h-[36px] sm:min-h-[40px] rounded-lg bg-amber-700 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-semibold text-white transition-colors hover:bg-amber-800 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
          >
            {copy.ctaBuild}
          </button>
        </div>
      </div>

      {/* Compact Mobile navigation strip */}
      <div className="flex overflow-x-auto border-t border-slate-200 px-2 md:hidden dark:border-[#222634]">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[40px] shrink-0 px-3 py-2 text-center text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-b-2 border-amber-700 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
