import React, { useEffect, useState } from "react";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { Language } from "../types/prompt";

export const COOKIE_CONSENT_STORAGE_KEY = "videoprompts_cookie_consent_v1";

export interface CookieConsentRecord {
  version: number;
  updatedAt: string;
  essential: true;
  analytics: boolean;
  personalizedAds: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[] & {
      requestNonPersonalizedAds?: number;
      pauseAdRequests?: number;
    };
  }
}

export function readStoredConsent(): CookieConsentRecord | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (typeof parsed.personalizedAds === "boolean") {
      return {
        version: parsed.version || 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        essential: true,
        analytics: Boolean(parsed.analytics),
        personalizedAds: Boolean(parsed.personalizedAds),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function applyConsentToGoogle(record: CookieConsentRecord): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    const adsState = record.personalizedAds ? "granted" : "denied";
    const analyticsState = record.analytics ? "granted" : "denied";

    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: adsState,
        ad_user_data: adsState,
        ad_personalization: adsState,
        analytics_storage: analyticsState,
        functionality_storage: "granted",
        security_storage: "granted",
      });
    }

    const adsArray = (window.adsbygoogle = window.adsbygoogle || []);
    adsArray.requestNonPersonalizedAds = record.personalizedAds ? 0 : 1;
    adsArray.pauseAdRequests = 0;
  }
}

interface CookieConsentBannerProps {
  lang: Language;
  forceOpen: boolean;
  onCloseForceOpen: () => void;
  onOpenPrivacyPolicy: () => void;
  onConsentChange?: (record: CookieConsentRecord) => void;
}

const CONSENT_COPY: Record<
  Language,
  {
    title: string;
    body: string;
    privacyLink: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
    savePrefs: string;
    essentialTitle: string;
    essentialDesc: string;
    alwaysOn: string;
    analyticsTitle: string;
    analyticsDesc: string;
    adsTitle: string;
    adsDesc: string;
    euNote: string;
  }
> = {
  ar: {
    title: "إعدادات الخصوصية وملفات تعريف الارتباط (Google AdSense)",
    body: "نستخدم ملفات تعريف الارتباط والتخزين المحلي لحفظ مسوداتك وتفضيلاتك، وكذلك لعرض إعلانات Google AdSense (مخصصة أو غير مخصصة حسب اختيارك) وقياس الأداء. يمكنك تعديل اختيارك أو سحب موافقتك في أي وقت.",
    privacyLink: "اقرأ سياسة الخصوصية",
    acceptAll: "قبول الكل",
    rejectAll: "رفض غير الضروري",
    customize: "تخصيص",
    savePrefs: "حفظ التفضيلات",
    essentialTitle: "ملفات أساسية وضرورية",
    essentialDesc: "ضرورية لحفظ اللغة والمظهر ومسودات البرومبت محلياً على جهازك ولا يمكن تعطيلها.",
    alwaysOn: "مفعّل دائماً",
    analyticsTitle: "قياس الأداء والتحليلات",
    analyticsDesc: "تساعدنا في تحسين استقرار الاستوديو وفهم الأدوات الأكثر فائدة للمستخدمين.",
    adsTitle: "الإعلانات المخصصة (Google AdSense)",
    adsDesc: "تسمح لشركة Google وشركائها بعرض إعلانات أكثر ملاءمة. في حال الرفض، ستظهر إعلانات غير مخصصة فقط.",
    euNote: "متوافق مع سياسة موافقة المستخدمين في الاتحاد الأوروبي (GDPR / EEA / UK) و Google Consent Mode v2.",
  },
  fr: {
    title: "Paramètres de confidentialité et cookies (Google AdSense)",
    body: "Nous utilisons des cookies et le stockage local pour sauvegarder vos brouillons et préférences, mesurer l'audience et diffuser des annonces Google AdSense (personnalisées ou non personnalisées selon votre choix). Vous pouvez modifier votre choix à tout moment.",
    privacyLink: "Lire la politique de confidentialité",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    customize: "Personnaliser",
    savePrefs: "Enregistrer mes choix",
    essentialTitle: "Cookies strictement nécessaires",
    essentialDesc: "Indispensables pour enregistrer votre langue, thème et brouillons localement sur votre appareil.",
    alwaysOn: "Toujours actif",
    analyticsTitle: "Mesure d'audience et analytique",
    analyticsDesc: "Nous aide à améliorer la fiabilité du studio et la qualité de nos guides.",
    adsTitle: "Annonces personnalisées (Google AdSense)",
    adsDesc: "Permet à Google et ses partenaires d'afficher des annonces pertinentes. En cas de refus, seules des annonces non personnalisées seront affichées.",
    euNote: "Conforme aux règles relatives au consentement de l'utilisateur dans l'UE (RGPD / EEE / Royaume-Uni) et Google Consent Mode v2.",
  },
  en: {
    title: "Privacy & Cookie Consent Settings (Google AdSense)",
    body: "We use cookies and local browser storage to save your prompt drafts and preferences, measure site performance, and serve Google AdSense ads (personalized or non-personalized based on your choice). You can change or withdraw your consent at any time.",
    privacyLink: "Read Privacy Policy",
    acceptAll: "Accept All",
    rejectAll: "Reject Non-Essential",
    customize: "Customize",
    savePrefs: "Save Preferences",
    essentialTitle: "Strictly Necessary Storage",
    essentialDesc: "Required to save your language, theme, and local prompt drafts on your device.",
    alwaysOn: "Always active",
    analyticsTitle: "Analytics & Performance",
    analyticsDesc: "Helps us understand studio usage and improve tool reliability.",
    adsTitle: "Personalized Advertising (Google AdSense)",
    adsDesc: "Allows Google and advertising partners to serve relevant ads. If declined, only non-personalized ads will be requested.",
    euNote: "Compliant with Google EU User Consent Policy (GDPR / EEA / UK / Switzerland) and Google Consent Mode v2.",
  },
};

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  lang,
  forceOpen,
  onCloseForceOpen,
  onOpenPrivacyPolicy,
  onConsentChange,
}) => {
  const t = CONSENT_COPY[lang];
  const [stored, setStored] = useState<CookieConsentRecord | null>(() =>
    readStoredConsent()
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [analytics, setAnalytics] = useState<boolean>(
    () => stored?.analytics ?? false
  );
  const [personalizedAds, setPersonalizedAds] = useState<boolean>(
    () => stored?.personalizedAds ?? false
  );

  useEffect(() => {
    if (forceOpen) {
      const current = readStoredConsent();
      if (current) {
        setAnalytics(current.analytics);
        setPersonalizedAds(current.personalizedAds);
      }
      setCustomizeOpen(true);
    }
  }, [forceOpen]);

  const visible = forceOpen || stored === null;
  if (!visible) return null;

  const commit = (nextAnalytics: boolean, nextAds: boolean) => {
    const record: CookieConsentRecord = {
      version: 1,
      updatedAt: new Date().toISOString(),
      essential: true,
      analytics: nextAnalytics,
      personalizedAds: nextAds,
    };
    applyConsentToGoogle(record);
    setStored(record);
    onConsentChange?.(record);
    setCustomizeOpen(false);
    onCloseForceOpen();
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/98 p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.16)] backdrop-blur-md dark:border-[#2A3042] dark:bg-[#0E1118]/98 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-[#F0C775]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {t.body}{" "}
                <button
                  type="button"
                  onClick={() => {
                    onCloseForceOpen();
                    onOpenPrivacyPolicy();
                  }}
                  className="font-semibold text-amber-800 underline underline-offset-4 hover:text-amber-700 dark:text-[#F0C775]"
                >
                  {t.privacyLink}
                </button>
              </p>
            </div>
          </div>

          {forceOpen && stored !== null && (
            <button
              type="button"
              onClick={onCloseForceOpen}
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 dark:border-[#262B3A] dark:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {customizeOpen && (
          <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-slate-200 pt-3.5 sm:grid-cols-3 dark:border-[#222634]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#262B3A] dark:bg-[#13161F]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t.essentialTitle}
                </span>
                <span className="font-mono-code text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {t.alwaysOn}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {t.essentialDesc}
              </p>
            </div>

            <label className="flex cursor-pointer flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#262B3A] dark:bg-[#13161F]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t.analyticsTitle}
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 accent-amber-700 dark:accent-[#D4A34B]"
                />
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {t.analyticsDesc}
              </p>
            </label>

            <label className="flex cursor-pointer flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#262B3A] dark:bg-[#13161F]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t.adsTitle}
                </span>
                <input
                  type="checkbox"
                  checked={personalizedAds}
                  onChange={(e) => setPersonalizedAds(e.target.checked)}
                  className="h-4 w-4 accent-amber-700 dark:accent-[#D4A34B]"
                />
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {t.adsDesc}
              </p>
            </label>
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.euNote}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* Equal-prominence Reject Non-Essential & Accept All buttons per EU User Consent Policy */}
            <button
              type="button"
              onClick={() => commit(false, false)}
              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-500 dark:border-[#343B50] dark:bg-[#161A24] dark:text-slate-100 dark:hover:border-slate-400"
            >
              {t.rejectAll}
            </button>

            {customizeOpen ? (
              <button
                type="button"
                onClick={() => commit(analytics, personalizedAds)}
                className="min-h-[38px] rounded-lg border border-amber-600/70 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-[#D4A34B]/70 dark:bg-[#1F1A11] dark:text-[#F0C775]"
              >
                {t.savePrefs}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{t.customize}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => commit(true, true)}
              className="min-h-[38px] rounded-lg bg-amber-700 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
            >
              {t.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
