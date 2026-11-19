import React from "react";
import { Language, WorkspaceTab } from "../types/prompt";

interface SiteFooterProps {
  lang: Language;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenCookieSettings: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  lang,
  activeTab,
  onSelectTab,
  onOpenCookieSettings,
}) => {
  const isAr = lang === "ar";
  const isFr = lang === "fr";
  const year = new Date().getFullYear();

  const links: { id: WorkspaceTab; label: string }[] = [
    {
      id: "about",
      label: isAr ? "من نحن" : isFr ? "À propos" : "About Us",
    },
    {
      id: "privacy",
      label: isAr
        ? "سياسة الخصوصية"
        : isFr
        ? "Politique de confidentialité"
        : "Privacy Policy",
    },
    {
      id: "terms",
      label: isAr
        ? "شروط الاستخدام"
        : isFr
        ? "Conditions d'utilisation"
        : "Terms of Service",
    },
    {
      id: "contact",
      label: isAr ? "اتصل بنا" : isFr ? "Contact" : "Contact Us",
    },
    {
      id: "guide",
      label: isAr ? "دليل المحركات" : isFr ? "Guide des moteurs" : "Engine Guide",
    },
  ];

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/90 px-4 py-6 text-xs text-slate-600 dark:border-[#222634] dark:bg-[#090B10] dark:text-slate-400">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <bdi
            dir="ltr"
            className="font-mono-code font-semibold text-slate-800 dark:text-slate-200"
          >
            VideoPrompts Studio
          </bdi>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">© {year}</span>
        </div>

        <nav
          aria-label="Legal and compliance links"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          {links.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`transition-colors hover:text-amber-700 dark:hover:text-[#F0C775] ${
                  active
                    ? "font-semibold text-amber-700 underline underline-offset-4 dark:text-[#F0C775]"
                    : ""
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>

          <button
            type="button"
            onClick={onOpenCookieSettings}
            className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-[#E5BE6F]"
          >
            {isAr
              ? "إعدادات الخصوصية والكوكيز"
              : isFr
              ? "Paramètres de cookies"
              : "Cookie & Ad Settings"}
          </button>
        </nav>
      </div>
    </footer>
  );
};
