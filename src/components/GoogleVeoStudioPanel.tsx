import React from "react";
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  Clock,
  Film,
  Globe,
  Loader2,
  Maximize2,
  MessageSquare,
  Palette,
  ShieldAlert,
  Sliders,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";
import { ENGINES, STYLE_OPTIONS } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import {
  GoogleVideoDetail,
  GoogleVideoLanguage,
  GoogleVideoModel,
  StudioFormState,
} from "../types/prompt";
import {
  GOOGLE_VEO_LANGUAGES,
  GoogleVideoPromptResult,
  MODEL_CAPABILITIES,
} from "../utils/googleVeoPrompt";

interface GoogleVeoStudioPanelProps {
  copy: I18nCopy;
  form: StudioFormState;
  autoFilling: boolean;
  veoMeta: GoogleVideoPromptResult["meta"] | null;
  isOpen: boolean;
  onToggle: () => void;
  onAiAutoFill: () => void;
  onChangeModel: (model: GoogleVideoModel) => void;
  onChangeDuration: (duration: 4 | 6 | 8) => void;
  onChangeResolution: (res: "720p" | "1080p") => void;
  onChangeAspect: (aspect: string) => void;
  onChangeDetail: (detail: GoogleVideoDetail) => void;
  onChangeLanguage: (lang: GoogleVideoLanguage) => void;
  onToggleAudio: (enabled: boolean) => void;
  onChangeDialogue: (val: string) => void;
  onChangeSoundEffects: (val: string) => void;
  onChangeCamera: (val: string) => void;
  onChangeLighting: (val: string) => void;
  onChangeStyle: (val: string) => void;
  onChangeNegative: (val: string) => void;
}

export const GoogleVeoStudioPanel: React.FC<GoogleVeoStudioPanelProps> = ({
  copy,
  form,
  autoFilling,
  veoMeta,
  isOpen,
  onToggle,
  onAiAutoFill,
  onChangeModel,
  onChangeDuration,
  onChangeResolution,
  onChangeAspect,
  onChangeDetail,
  onChangeLanguage,
  onToggleAudio,
  onChangeDialogue,
  onChangeSoundEffects,
  onChangeCamera,
  onChangeLighting,
  onChangeStyle,
  onChangeNegative,
}) => {
  const activeModel: GoogleVideoModel = form.veoModel || "veo-3.1";
  const caps = MODEL_CAPABILITIES[activeModel];
  const activeRes = form.veoResolution || "1080p";
  const activeDetail: GoogleVideoDetail = form.veoDetail || "professional";
  const activeLang: GoogleVideoLanguage = form.veoLanguage || "English";
  const aspect16_9 = ENGINES.veo.aspectOptions[0];
  const aspect9_16 = ENGINES.veo.aspectOptions[1];
  const isVertical = form.aspect.includes("9:16");

  const charPct = veoMeta
    ? Math.min(100, Math.round((veoMeta.promptChars / veoMeta.maxPromptChars) * 100))
    : 0;

  const fieldClass =
    "min-h-[44px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyan-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#55D9EE] dark:focus:bg-[#0E1118]";

  return (
    <section className="rounded-xl border border-cyan-600/35 bg-white dark:border-[#55D9EE]/35 dark:bg-[#13161F]">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start transition-colors hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:px-5 dark:hover:bg-[#181C28]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5 text-start">
          <span className="mt-0.5 shrink-0 text-cyan-700 dark:text-[#55D9EE]">
            <Film className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-[#55D9EE]">
                {copy.veoPanelTitle}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-[#55D9EE]">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{copy.autoTag}</span>
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs leading-snug text-slate-500 dark:text-slate-400">
              {activeModel} · {activeRes} · {form.duration || 8}s ·{" "}
              {isVertical ? "9:16" : "16:9"} · {activeLang}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
            isOpen ? "rotate-180 text-cyan-700 dark:text-[#55D9EE]" : ""
          }`}
        />
      </button>

      {isOpen && (
      <div className="flex flex-col gap-5 border-t border-slate-100 p-4 sm:p-5 dark:border-[#222634]">
        {/* AI Complete From Idea Banner */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#222634]">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {copy.veoPanelSub}
          </p>
          <button
            type="button"
            disabled={autoFilling}
            onClick={onAiAutoFill}
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-900 transition-colors hover:border-cyan-700 hover:bg-cyan-100 disabled:opacity-50 dark:border-[#55D9EE]/45 dark:bg-[#11232B] dark:text-[#55D9EE] dark:hover:bg-[#17303B]"
          >
            {autoFilling ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{autoFilling ? copy.veoAutoFillRunning : copy.veoAutoFillBtn}</span>
          </button>
        </div>

      {/* Model Selector (Full vs Fast) */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-start gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Zap className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
          <span>{copy.veoModelLbl}</span>
        </label>
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
          {(
            [
              { id: "veo-3.1", label: copy.veoModelFull, cap: "4000 chars" },
              { id: "veo-3.1-fast", label: copy.veoModelFast, cap: "1200 chars" },
            ] as { id: GoogleVideoModel; label: string; cap: string }[]
          ).map((item) => {
            const selected = activeModel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeModel(item.id)}
                className={`flex min-h-[48px] w-full flex-col items-start justify-center rounded-lg border px-3.5 py-2.5 text-start transition-colors ${
                  selected
                    ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                }`}
              >
                <span className="text-xs font-bold leading-snug whitespace-normal break-words">
                  {item.label}
                </span>
                <span className="mt-0.5 text-[11px] font-mono-code opacity-80">
                  {item.id} · max {item.cap}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration, Resolution & Aspect Ratio (Vertical on Mobile) */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:grid sm:grid-cols-3 dark:border-[#222634]">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoDurationLbl}</span>
          </label>
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-3">
            {caps.supportedDurations.map((d) => {
              const selected = (form.duration || 8) === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChangeDuration(d)}
                  className={`flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors sm:min-h-[42px] ${
                    selected
                      ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                  }`}
                >
                  {d}s
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Maximize2 className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoResolutionLbl}</span>
          </label>
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2">
            {caps.supportedResolutions.map((res) => {
              const selected = activeRes === res;
              return (
                <button
                  key={res}
                  type="button"
                  onClick={() => onChangeResolution(res)}
                  className={`flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors sm:min-h-[42px] ${
                    selected
                      ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                  }`}
                >
                  {res}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            {copy.lblAspect}
          </label>
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onChangeAspect(aspect16_9)}
              className={`flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors sm:min-h-[42px] ${
                !isVertical
                  ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
              }`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => onChangeAspect(aspect9_16)}
              className={`flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors sm:min-h-[42px] ${
                isVertical
                  ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
              }`}
            >
              9:16
            </button>
          </div>
        </div>
      </div>

      {/* Detail Level & Output Language */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-[#222634]">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sliders className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoDetailLbl}</span>
          </label>
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-3">
            {(
              [
                { id: "short", label: copy.veoDetailShort },
                { id: "balanced", label: copy.veoDetailBalanced },
                { id: "professional", label: copy.veoDetailProfessional },
              ] as { id: GoogleVideoDetail; label: string }[]
            ).map((opt) => {
              const selected = activeDetail === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeDetail(opt.id)}
                  className={`flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors sm:min-h-[42px] ${
                    selected
                      ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Globe className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoLanguageLbl}</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {GOOGLE_VEO_LANGUAGES.map((lng) => {
              const selected = activeLang === lng.id;
              return (
                <button
                  key={lng.id}
                  type="button"
                  onClick={() => onChangeLanguage(lng.id)}
                  className={`flex min-h-[46px] flex-col items-center justify-center rounded-lg border px-2.5 py-1.5 text-center transition-colors sm:min-h-[42px] ${
                    selected
                      ? "border-cyan-600 bg-cyan-50 text-cyan-950 dark:border-[#55D9EE] dark:bg-[#132229] dark:text-[#55D9EE]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                  }`}
                >
                  <span className="text-xs font-semibold leading-tight">{lng.native}</span>
                  {lng.native !== lng.id && (
                    <span className="text-[10px] opacity-70">{lng.id}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty-by-Default Cinematography, Style & Negative Fields (Filled by Client or AI from Idea) */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:grid sm:grid-cols-2 dark:border-[#222634]">
        <div>
          <label className="mb-1.5 flex items-center justify-start gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Camera className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoCameraLbl}</span>
          </label>
          <input
            type="text"
            value={form.camera}
            onChange={(e) => onChangeCamera(e.target.value)}
            placeholder={copy.placeholderCamera}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-start gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Palette className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoLightingLbl}</span>
          </label>
          <input
            type="text"
            value={form.light}
            onChange={(e) => onChangeLighting(e.target.value)}
            placeholder={copy.placeholderLight}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            {copy.veoStyleLbl}
          </label>
          <select
            value={form.style}
            onChange={(e) => onChangeStyle(e.target.value)}
            className={fieldClass}
          >
            <option value="">{copy.selectOptionalAuto}</option>
            {form.style && !STYLE_OPTIONS.includes(form.style) && (
              <option value={form.style}>{form.style}</option>
            )}
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-start gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <ShieldAlert className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
            <span>{copy.veoNegativeLbl}</span>
          </label>
          <input
            type="text"
            value={form.negative}
            onChange={(e) => onChangeNegative(e.target.value)}
            placeholder={copy.placeholderNegative}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Synchronized Audio, Dialogue & SFX (Empty by Default) */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-[#222634]">
        <label
          className="flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-cyan-600/50 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
        >
          <input
            type="checkbox"
            checked={form.includeAudio}
            onChange={(e) => onToggleAudio(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded accent-cyan-700 dark:accent-[#55D9EE]"
          />
          <Volume2 className="h-4 w-4 shrink-0 text-cyan-700 dark:text-[#55D9EE]" />
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
            {copy.veoAudioLbl}
          </span>
        </label>

        {activeModel === "veo-3.1-fast" && form.includeAudio && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/25 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{copy.veoFastAudioNote}</span>
          </div>
        )}

        {form.includeAudio && caps.audioReliable && (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-700 dark:text-[#55D9EE]" />
                <span>{copy.veoDialogueLbl}</span>
              </label>
              <textarea
                rows={2}
                value={form.veoDialogue}
                onChange={(e) => onChangeDialogue(e.target.value)}
                placeholder={copy.veoDialoguePlaceholder}
                className="min-h-[56px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-start text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyan-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#55D9EE] dark:focus:bg-[#0E1118]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
                {copy.veoSoundEffectsLbl}
              </label>
              <textarea
                rows={2}
                value={form.veoSoundEffects}
                onChange={(e) => onChangeSoundEffects(e.target.value)}
                placeholder={copy.veoSoundEffectsPlaceholder}
                className="min-h-[56px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-start text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-cyan-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#55D9EE] dark:focus:bg-[#0E1118]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Character Budget & Capability Warnings */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-[#222634]">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {copy.veoCharsLimitLbl}
          </span>
          <bdi dir="ltr" className="font-mono-code font-semibold text-slate-800 dark:text-[#55D9EE]">
            {veoMeta ? veoMeta.promptChars : 0} / {caps.maxPromptChars}
          </bdi>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1F2433]">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${
              charPct >= 95
                ? "bg-red-500"
                : charPct >= 80
                  ? "bg-amber-500"
                  : "bg-cyan-600 dark:bg-[#55D9EE]"
            }`}
            style={{ width: `${charPct}%` }}
          />
        </div>

        {veoMeta && veoMeta.warnings.length > 0 && (
          <div className="mt-1 space-y-1.5">
            <p className="text-[11px] font-semibold text-amber-800 dark:text-[#F0C775]">
              {copy.veoWarningsLbl}
            </p>
            {veoMeta.warnings.map((w, idx) => (
              <div
                key={idx}
                dir="ltr"
                className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-[11.5px] text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/25 dark:text-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}
    </section>
  );
};
