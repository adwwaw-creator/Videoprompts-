import React from "react";
import { ArrowLeft, ArrowRight, Film, Sparkles, Wand2 } from "lucide-react";
import { SpaceStarfieldBackground } from "./SpaceStarfieldBackground";
import { I18nCopy } from "../data/i18n";
import { EngineId, Language } from "../types/prompt";

interface LuxuryPortalViewProps {
  copy: I18nCopy;
  lang: Language;
  onEnterStudio: (engine?: EngineId) => void;
  onOpenGuide: () => void;
  onOpenGenerator: () => void;
  onOpenDirector: () => void;
}

const FourPointStar: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 1.5L14.6 9.4L22.5 12L14.6 14.6L12 22.5L9.4 14.6L1.5 12L9.4 9.4L12 1.5Z" />
  </svg>
);

export const LuxuryPortalView: React.FC<LuxuryPortalViewProps> = ({
  copy,
  lang,
  onEnterStudio,
  onOpenGuide,
  onOpenGenerator,
  onOpenDirector,
}) => {
  const isRtl = lang === "ar";

  return (
    <div className="relative flex min-h-[calc(100vh-58px)] flex-col justify-between overflow-hidden bg-[#F7F6F2] px-4 py-8 text-slate-900 dark:bg-[#07080D] dark:text-slate-100 sm:px-8 sm:py-12">
      {/* Cosmic Ambient Nebula Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-[420px] w-[540px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[130px] dark:bg-[#D4A34B]/12" />
        <div className="absolute bottom-[-120px] left-1/4 h-[320px] w-[420px] rounded-full bg-sky-400/5 blur-[120px] dark:bg-[#38BDF8]/8" />
      </div>

      {/* Moving Cosmic Space Particles */}
      <SpaceStarfieldBackground className="opacity-55 dark:opacity-100" />

      {/* Portal Top Header Strip */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
        <bdi
          dir="ltr"
          className="font-mono-code text-xs font-semibold tracking-wider text-slate-800 dark:text-[#F0C775]"
        >
          {copy.portalBrand}
        </bdi>
        <span className="text-xs font-medium text-amber-800 dark:text-[#D4A34B]">
          {copy.portalBadge}
        </span>
      </div>

      {/* Centerpiece Hero & Luxury Gateway Card */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-2xl flex-col items-center py-6 text-center sm:py-10">
        <h1 className="text-balance bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-5xl dark:from-[#F8E7B9] dark:via-[#DFB567] dark:to-[#B88635]">
          {copy.portalHeadline}
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300/90">
          {copy.portalDescription}
        </p>

        {/* Luxury Gateway Card */}
        <section className="mt-7 w-full max-w-[520px] rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-md sm:p-8 dark:border-[#D4A34B]/25 dark:bg-[#11131B]/88 dark:shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          {/* Card Brand Mark */}
          <div className="flex items-center justify-center gap-3">
            <FourPointStar className="h-4 w-4 shrink-0 text-amber-600 dark:text-[#E5BE6F]" />
            <bdi
              dir="ltr"
              className="font-mono-code text-base font-bold tracking-[0.26em] text-slate-900 sm:text-lg dark:text-[#F6E6BF]"
            >
              {copy.portalCardTitle}
            </bdi>
            <FourPointStar className="h-4 w-4 shrink-0 text-amber-600 dark:text-[#E5BE6F]" />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
            {copy.portalCardSub}
          </p>

          {/* Primary Metallic Gold Pill CTA */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => onEnterStudio()}
              className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#C8963E] via-[#E5BE6F] to-[#D4A34B] px-9 py-3 text-center text-sm font-bold text-[#140F06] shadow-[0_10px_28px_rgba(212,163,75,0.3)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>{copy.portalEnterStudio}</span>
              {isRtl ? (
                <ArrowLeft className="h-4 w-4 shrink-0" />
              ) : (
                <ArrowRight className="h-4 w-4 shrink-0" />
              )}
            </button>
          </div>

          {/* 3 Stacked Full-Width Quick Engine Launchers */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onEnterStudio("wan22")}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-amber-600/35 bg-amber-50/70 px-5 py-3 text-center text-sm font-semibold text-amber-950 transition-colors hover:border-amber-600 hover:bg-amber-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-[#D4A34B]/35 dark:bg-[#1E1912]/90 dark:text-[#F5E3B5] dark:hover:border-[#D4A34B]/75 dark:hover:bg-[#272016]"
            >
              <Wand2 className="h-4 w-4 shrink-0 text-amber-700 dark:text-[#E5BE6F]" />
              <span>{copy.portalLaunchWan}</span>
            </button>

            <button
              type="button"
              onClick={() => onEnterStudio("minimax")}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-cyan-600/40 bg-cyan-50/80 px-5 py-3 text-center text-sm font-semibold text-cyan-900 transition-colors hover:border-cyan-600 hover:bg-cyan-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:border-[#38BDF8]/40 dark:bg-[#0D2129]/90 dark:text-[#4AD8EB] dark:hover:border-[#38BDF8]/75 dark:hover:bg-[#112A34]"
            >
              <Film className="h-4 w-4 shrink-0 text-cyan-700 dark:text-[#4AD8EB]" />
              <span>{copy.portalLaunchMiniMax}</span>
            </button>

            <button
              type="button"
              onClick={() => onEnterStudio("veo")}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-slate-100/90 px-5 py-3 text-center text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:border-white/15 dark:bg-[#191B23]/90 dark:text-slate-100 dark:hover:border-[#38BDF8]/50 dark:hover:bg-[#20232E]"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-cyan-700 dark:text-[#4AD8EB]" />
              <span>{copy.portalLaunchVeo}</span>
            </button>
          </div>

          {/* Supported Engines Footer Row */}
          <div className="mt-6 border-t border-slate-200/80 pt-4 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <bdi dir="ltr" className="text-cyan-700 dark:text-[#4AD8EB]">
                MiniMax Hailuo 02
              </bdi>
              <span aria-hidden="true">·</span>
              <bdi dir="ltr">WAN 2.2 A14B / TI2V-5B</bdi>
              <span aria-hidden="true">·</span>
              <bdi dir="ltr">FLUX.1</bdi>
              <span aria-hidden="true">·</span>
              <bdi dir="ltr">HunyuanVideo</bdi>
              <span aria-hidden="true">·</span>
              <bdi dir="ltr" className="text-cyan-700 dark:text-[#4AD8EB]">
                Google Veo 3.1
              </bdi>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs">
              <button
                type="button"
                onClick={onOpenGenerator}
                className="font-medium text-amber-800 underline-offset-4 hover:underline dark:text-[#E5BE6F]"
              >
                {copy.portalGeneratorShortcut}
              </button>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                ·
              </span>
              <button
                type="button"
                onClick={onOpenDirector}
                className="font-medium text-cyan-800 underline-offset-4 hover:underline dark:text-[#4AD8EB]"
              >
                {copy.portalDirectorShortcut}
              </button>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                ·
              </span>
              <button
                type="button"
                onClick={onOpenGuide}
                className="font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
              >
                {copy.navGuide}
              </button>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          {copy.portalPalette}
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 dark:text-slate-500">
        {copy.portalFooter}
      </footer>
    </div>
  );
};
