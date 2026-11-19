import React, { useEffect, useRef } from "react";
import { Language } from "../types/prompt";
import { readStoredConsent } from "./CookieConsentBanner";

export type AdUnitPlacement = "studio-bottom" | "sidebar";

interface AdUnitProps {
  placement?: AdUnitPlacement;
  lang?: Language;
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle";
  fullWidthResponsive?: boolean;
  /** Must be true (user has resolved CookieConsentBanner) before AdUnit mounts or pushes. */
  consentResolved?: boolean;
  /** Whether user explicitly granted consent for personalized advertising. Falls back to NPA if false. */
  personalizedAds?: boolean;
  /** Optional custom AdSense channel override for reporting. */
  adChannel?: string;
  className?: string;
}

const DEFAULT_ADSENSE_CLIENT = "ca-pub-3312377428939400";

const AD_LABEL: Record<Language, string> = {
  ar: "إعلان",
  fr: "Annonce",
  en: "Advertisement",
};

function resolveAdClient(): string {
  const envClient = String(import.meta.env.VITE_ADSENSE_CLIENT_ID || "").trim();
  return /^ca-pub-\d{10,20}$/.test(envClient) ? envClient : DEFAULT_ADSENSE_CLIENT;
}

function resolveAdSlot(placement: AdUnitPlacement, explicitSlot?: string): string {
  const candidate =
    explicitSlot?.trim() ||
    (placement === "sidebar"
      ? String(import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || "").trim()
      : String(import.meta.env.VITE_ADSENSE_STUDIO_SLOT || "").trim());

  return /^\d{6,16}$/.test(candidate) ? candidate : "";
}

/**
 * Policy-compliant Google AdSense display AdUnit:
 * - Waits until consentResolved is true before rendering or requesting ads.
 * - Falls back to non-personalized ads (requestNonPersonalizedAds = 1 and data-ad-channel)
 *   whenever the user has not granted personalized advertising consent.
 * - Renders only with a valid numeric data-ad-slot (never dummy IDs or display:none).
 * - Uses strictly permitted AdSense disclosure labels ("Advertisement" / "إعلان" / "Annonce").
 * - Enforces generous visual separation from interactive buttons to prevent accidental clicks.
 * - Guards against duplicate adsbygoogle.push() calls in React StrictMode.
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  placement = "sidebar",
  lang = "ar",
  slot,
  format = "auto",
  fullWidthResponsive = true,
  consentResolved,
  personalizedAds,
  adChannel,
  className = "",
}) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedKeyRef = useRef<string | null>(null);

  const storedConsent = readStoredConsent();
  const isConsentResolved =
    typeof consentResolved === "boolean" ? consentResolved : storedConsent !== null;
  const allowPersonalized =
    typeof personalizedAds === "boolean"
      ? personalizedAds
      : Boolean(storedConsent?.personalizedAds);

  const adClient = resolveAdClient();
  const adSlot = resolveAdSlot(placement, slot);
  const npaChannel =
    adChannel?.trim() ||
    String(import.meta.env.VITE_ADSENSE_NPA_CHANNEL || "").trim() ||
    "non-personalized";
  const effectiveChannel = allowPersonalized ? adChannel?.trim() || undefined : npaChannel;
  const renderKey = `${adSlot}-${allowPersonalized ? "pa" : "npa"}`;

  useEffect(() => {
    if (!isConsentResolved || !adSlot) return;
    if (pushedKeyRef.current === renderKey) return;

    const insEl = insRef.current;
    if (!insEl) return;
    if (insEl.getAttribute("data-adsbygoogle-status") === "done") {
      pushedKeyRef.current = renderKey;
      return;
    }

    try {
      const adsArray = (window.adsbygoogle = window.adsbygoogle || []);
      adsArray.requestNonPersonalizedAds = allowPersonalized ? 0 : 1;
      adsArray.pauseAdRequests = 0;
      adsArray.push({});
      pushedKeyRef.current = renderKey;
    } catch {
      // Ignore AdSense load/blocker errors silently so the studio never breaks
    }
  }, [isConsentResolved, adSlot, adClient, allowPersonalized, renderKey]);

  // Do not mount or request ads before user resolves consent, or when no valid numeric slot is configured
  if (!isConsentResolved || !adSlot) {
    return null;
  }

  const minHeightClass =
    placement === "sidebar" ? "min-h-[250px]" : "min-h-[100px]";

  return (
    <aside
      aria-label={AD_LABEL[lang]}
      data-ad-placement={placement}
      data-ad-mode={allowPersonalized ? "personalized" : "non-personalized"}
      className={`border-t border-slate-200 pt-5 dark:border-[#222634] ${className}`}
    >
      <div className="mb-2 flex items-center justify-between text-[10.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span>{AD_LABEL[lang]}</span>
      </div>
      <div
        className={`w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 dark:border-[#222634] dark:bg-[#0D1017] ${minHeightClass}`}
      >
        <ins
          key={renderKey}
          ref={insRef}
          className="adsbygoogle block w-full"
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
          {...(effectiveChannel ? { "data-ad-channel": effectiveChannel } : {})}
        />
      </div>
    </aside>
  );
};

export default AdUnit;
