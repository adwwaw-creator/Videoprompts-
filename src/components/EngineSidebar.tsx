import React, { useRef, useState } from "react";
import { ChevronDown, Cloud, Download, LogIn, LogOut, Moon, RotateCcw, ShieldCheck, Sun, Upload, UserCheck, X } from "lucide-react";
import { ENGINE_ORDER, ENGINES } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import { PRESETS } from "../data/presets";
import { EngineId, Language, PresetItem, ThemeMode } from "../types/prompt";
import { AdUnit } from "./AdUnit";

interface EngineSidebarProps {
  copy: I18nCopy;
  lang: Language;
  theme: ThemeMode;
  activeEngine: EngineId;
  activePresetId: string | null;
  onSelectEngine: (id: EngineId) => void;
  onApplyPreset: (preset: PresetItem) => void;
  onChangeLang: (lang: Language) => void;
  onToggleTheme: () => void;
  onResetAll: () => void;
  onBackupStudioState?: () => void;
  onRestoreStudioBackup?: (file: File) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isAdmin: boolean;
  currentUserEmail: string | null;
  currentUserName?: string | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  adConsentResolved?: boolean;
  personalizedAds?: boolean;
}

export const EngineSidebar: React.FC<EngineSidebarProps> = ({
  copy,
  lang,
  theme,
  activeEngine,
  activePresetId,
  onSelectEngine,
  onApplyPreset,
  onChangeLang,
  onToggleTheme,
  onResetAll,
  onBackupStudioState,
  onRestoreStudioBackup,
  isOpenMobile,
  onCloseMobile,
  isAdmin,
  currentUserEmail,
  currentUserName,
  authLoading,
  onSignIn,
  onSignOut,
  adConsentResolved,
  personalizedAds,
}) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const languages: { code: Language; label: string }[] = [
    { code: "ar", label: "العربية" },
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col gap-6 p-4 text-start">
      {/* Mobile Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 lg:hidden dark:border-[#222634]">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {copy.sidebarEngines}
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 dark:border-[#262B3A] dark:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Open-Source Engine Selector */}
      <div>
        <h2 className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {copy.sidebarEngines}
        </h2>
        <div className="flex flex-col gap-2">
          {ENGINE_ORDER.map((id) => {
            const engine = ENGINES[id];
            const selected = activeEngine === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelectEngine(id);
                  onCloseMobile();
                }}
                className={`flex min-h-[44px] w-full flex-col items-start rounded-lg border px-3.5 py-2.5 text-start transition-colors ${
                  selected
                    ? "border-amber-600/70 bg-amber-50/70 dark:border-[#D4A34B]/70 dark:bg-[#1A1D28]"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-[#222634] dark:bg-[#13161F] dark:hover:border-[#343B50]"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    selected
                      ? "text-amber-800 dark:text-[#F0C775]"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {engine.name}
                </span>
                <span className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                  {engine.vendor} · {engine.encoder}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Presets (Collapsible) */}
      <div className="border-t border-slate-200 pt-4 dark:border-[#222634]">
        <button
          type="button"
          onClick={() => setPresetsOpen((v) => !v)}
          aria-expanded={presetsOpen}
          className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-start text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span>
            {copy.sidebarPresets} ({PRESETS.length})
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              presetsOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
            }`}
          />
        </button>

        {presetsOpen && (
          <div className="mt-2 flex flex-col gap-2">
            {PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              const engineName = ENGINES[preset.engine].name;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onApplyPreset(preset);
                    onCloseMobile();
                  }}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-xs font-medium transition-colors ${
                    isActive
                      ? "border-amber-600/60 bg-amber-50/60 text-amber-800 dark:border-[#D4A34B]/60 dark:bg-[#1A1D28] dark:text-[#F0C775]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300 dark:hover:border-[#343B50] dark:hover:text-slate-100"
                  }`}
                >
                  <span className="break-words text-start leading-snug">{preset.labels[lang]}</span>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    {engineName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Language, Theme & Reset (Collapsible) */}
      <div className="mt-auto border-t border-slate-200 pt-4 dark:border-[#222634]">
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-expanded={settingsOpen}
          className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-start text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span>{copy.sidebarSettings}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              settingsOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
            }`}
          />
        </button>

        {settingsOpen && (
          <div className="mt-2.5">
            <div
              className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-[#222634] dark:bg-[#13161F]"
              role="group"
              aria-label="Language"
            >
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onChangeLang(item.code)}
                  className={`min-h-[38px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    lang === item.code
                      ? "bg-white text-slate-900 shadow-xs dark:bg-[#232838] dark:text-[#F0C775]"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-xs font-medium leading-snug text-slate-700 transition-colors hover:border-slate-300 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#343B50]"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 shrink-0" /> : <Moon className="h-3.5 w-3.5 shrink-0" />}
                <span className="whitespace-normal">
                  {theme === "dark" ? copy.themeLight : copy.themeDark}
                </span>
              </button>

              <button
                type="button"
                onClick={onResetAll}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-xs font-medium leading-snug text-slate-700 transition-colors hover:border-red-400 hover:text-red-600 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300 dark:hover:border-red-500/60 dark:hover:text-red-400"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-normal">{copy.btnReset}</span>
              </button>
            </div>

            {(onBackupStudioState || onRestoreStudioBackup) && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {onBackupStudioState && (
                  <button
                    type="button"
                    onClick={onBackupStudioState}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-50/70 px-2.5 py-2 text-center text-[11.5px] font-semibold leading-snug text-amber-900 transition-colors hover:border-amber-600 hover:bg-amber-100/80 dark:border-[#D4A34B]/40 dark:bg-[#1A1811] dark:text-[#F0C775] dark:hover:border-[#D4A34B]"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-normal">{copy.btnBackupStudio}</span>
                  </button>
                )}
                {onRestoreStudioBackup && (
                  <>
                    <input
                      ref={backupInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onRestoreStudioBackup(file);
                        }
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => backupInputRef.current?.click()}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[11.5px] font-medium leading-snug text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                    >
                      <Upload className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-normal">{copy.btnRestoreBackup}</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* User Account & Cloud Sync Control */}
            <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-[#222634]">
              {!currentUserEmail ? (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={onSignIn}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:border-amber-600 hover:bg-amber-100/70 disabled:opacity-50 dark:border-[#D4A34B]/50 dark:bg-[#1B1810] dark:text-[#F0C775] dark:hover:border-[#D4A34B]"
                >
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnSignInRegister}</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/35 bg-emerald-50/40 p-2.5 text-xs dark:border-emerald-500/25 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-300">
                      {isAdmin ? (
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-[#F0C775]" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate max-w-[125px]">
                        {currentUserName || copy.accountSignedInLabel}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>{copy.btnSignOutAccount}</span>
                    </button>
                  </div>
                  <p dir="ltr" className="truncate font-mono-code text-[11px] text-slate-600 dark:text-slate-400">
                    {currentUserEmail}
                  </p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    <Cloud className="h-3 w-3 shrink-0" />
                    <span>{copy.accountCloudSyncActive}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar pinned on the right side */}
      <aside className="hidden lg:block w-[264px] shrink-0 border-l border-slate-200 bg-slate-50/70 dark:border-[#222634] dark:bg-[#0E1118]">
        <div className="sticky top-[57px] flex min-h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] flex-col overflow-y-auto">
          <div className="flex-1">{sidebarContent}</div>
          <div className="mt-auto px-4 pb-5 pt-2">
            <AdUnit
              placement="sidebar"
              slot={import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT}
              lang={lang}
              format="rectangle"
              fullWidthResponsive={true}
              consentResolved={adConsentResolved}
              personalizedAds={personalizedAds}
            />
          </div>
        </div>
      </aside>

      {/* Mobile slide-over drawer pinned on the right edge */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-[300px] max-w-[85vw] overflow-y-auto border-l border-slate-200 bg-white shadow-xl dark:border-[#222634] dark:bg-[#0E1118]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
