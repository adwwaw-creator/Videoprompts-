import React, { useState } from "react";
import {
  ChevronDown,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { I18nCopy } from "../data/i18n";
import { AdminVisitorStats } from "../utils/visitorTracker";

interface AdminVisitorCounterProps {
  copy: I18nCopy;
  adminEmail: string | null;
  stats: AdminVisitorStats | null;
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}

export const AdminVisitorCounter: React.FC<AdminVisitorCounterProps> = ({
  copy,
  adminEmail,
  stats,
  loading,
  onRefresh,
  onSignOut,
}) => {
  const [expanded, setExpanded] = useState(false);

  const total = stats?.totalVisits ?? 0;
  const today = stats?.todayVisits ?? 0;
  const unique = stats?.uniqueRecentVisitors ?? 0;

  return (
    <section className="mb-5 rounded-xl border border-amber-500/40 bg-amber-50/60 transition-colors dark:border-[#D4A34B]/40 dark:bg-[#141722]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-h-[40px] flex-1 items-center justify-between gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-700/10 text-amber-800 dark:bg-[#D4A34B]/15 dark:text-[#F0C775]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {copy.adminCounterTitle}
                </span>
                <span className="text-[11px] font-medium text-amber-800 dark:text-[#F0C775]">
                  ({copy.adminOnlyBadge})
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {loading && !stats ? "..." : total.toLocaleString()}
                </span>{" "}
                {copy.adminTotalVisits} ·{" "}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {loading && !stats ? "..." : today.toLocaleString()}
                </span>{" "}
                {copy.adminTodayVisits}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
              expanded ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title={copy.adminRefreshStats}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 disabled:opacity-50 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200 dark:hover:border-[#D4A34B]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{copy.adminRefreshStats}</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title={copy.adminSignOut}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-red-500 hover:text-red-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200 dark:hover:border-red-500/60 dark:hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{copy.adminSignOut}</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-amber-500/20 px-4 py-4 sm:px-5 dark:border-[#222634]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#222634] dark:bg-[#0E1118]">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {copy.adminTotalVisits}
              </p>
              <p className="mt-1 font-mono-code text-xl font-bold text-slate-900 dark:text-slate-100">
                {total.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#222634] dark:bg-[#0E1118]">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {copy.adminTodayVisits}
              </p>
              <p className="mt-1 font-mono-code text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {today.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-[#222634] dark:bg-[#0E1118]">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {copy.adminUniqueVisitors}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono-code text-xl font-bold text-amber-700 dark:text-[#F0C775]">
                <Users className="h-4 w-4 shrink-0" />
                <span>{unique.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {stats && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  AR: <strong className="font-mono-code">{stats.langCounts.ar}</strong>
                </span>
                <span>
                  FR: <strong className="font-mono-code">{stats.langCounts.fr}</strong>
                </span>
                <span>
                  EN: <strong className="font-mono-code">{stats.langCounts.en}</strong>
                </span>
              </div>
              {adminEmail && (
                <span dir="ltr" className="font-mono-code text-[11px] opacity-80">
                  {adminEmail}
                </span>
              )}
            </div>
          )}

          {stats && stats.recentVisits.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-[#222634] dark:bg-[#0E1118]">
              <div className="divide-y divide-slate-100 dark:divide-[#1E2230]">
                {stats.recentVisits.slice(0, 8).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-[11px]"
                  >
                    <span className="font-mono-code text-slate-700 dark:text-slate-300">
                      {v.path} · {v.lang.toUpperCase()}
                    </span>
                    <span dir="ltr" className="font-mono-code text-slate-500 dark:text-slate-400">
                      {new Date(v.createdAtMs).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
