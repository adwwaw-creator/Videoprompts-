import React from "react";
import { ChevronDown, Sparkles } from "lucide-react";

interface CollapsibleStudioPanelProps {
  title: string;
  summary: string;
  autoBadge?: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleStudioPanel: React.FC<CollapsibleStudioPanelProps> = ({
  title,
  summary,
  autoBadge,
  icon,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white transition-colors dark:border-[#222634] dark:bg-[#13161F]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start transition-colors hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-5 dark:hover:bg-[#181C28]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5 text-start">
          {icon && (
            <span className="mt-0.5 shrink-0 text-amber-700 dark:text-[#D4A34B]">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </span>
              {autoBadge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-[#D4A34B]">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>{autoBadge}</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 break-words text-xs leading-snug text-slate-500 dark:text-slate-400">
              {summary}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
            isOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-[#222634]">
          {children}
        </div>
      )}
    </section>
  );
};
