import React from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Clock,
  Film,
  Sparkles,
} from "lucide-react";
import { HAILUO_OFFICIAL_COMMANDS } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import {
  GenerationMode,
  Language,
  ReferenceImageState,
  StudioFormState,
} from "../types/prompt";
import { ImageReferenceDropzone } from "./ImageReferenceDropzone";

interface MiniMaxStudioPanelProps {
  copy: I18nCopy;
  lang: Language;
  form: StudioFormState;
  aspectOptions: string[];
  firstFrame: ReferenceImageState | null;
  lastFrame: ReferenceImageState | null;
  analyzingImage: boolean;
  analyzingTransition: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onChangeMode: (mode: GenerationMode) => void;
  onSelectDurationPreset: (duration: 6 | 10, resolution: "1080P" | "768P") => void;
  onToggleCameraCommand: (cmd: string) => void;
  onChangeCustomDirective: (val: string) => void;
  onTogglePromptOptimizer: (enabled: boolean) => void;
  onFirstFrameLoaded: (img: ReferenceImageState) => void;
  onClearFirstFrame: () => void;
  onAnalyzeFirstFrame: () => void;
  onLastFrameLoaded: (img: ReferenceImageState) => void;
  onClearLastFrame: () => void;
  onAnalyzeTransition: () => void;
}

export const MiniMaxStudioPanel: React.FC<MiniMaxStudioPanelProps> = ({
  copy,
  lang,
  form,
  aspectOptions,
  firstFrame,
  lastFrame,
  analyzingImage,
  analyzingTransition,
  isOpen,
  onToggle,
  onChangeMode,
  onSelectDurationPreset,
  onToggleCameraCommand,
  onChangeCustomDirective,
  onTogglePromptOptimizer,
  onFirstFrameLoaded,
  onClearFirstFrame,
  onAnalyzeFirstFrame,
  onLastFrameLoaded,
  onClearLastFrame,
  onAnalyzeTransition,
}) => {
  const activeCommands = form.minimaxCameraCommands || [];
  const bracketPreview =
    activeCommands.length > 0 ? `[${activeCommands.join(", ")}]` : "—";

  const is6_1080 = form.duration === 6 && form.minimaxResolution === "1080P";
  const is6_768 = form.duration === 6 && form.minimaxResolution === "768P";
  const is10_768 = form.duration === 10;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-white dark:border-[#D4A34B]/40 dark:bg-[#13161F]">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start transition-colors hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-5 dark:hover:bg-[#181C28]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5 text-start">
          <span className="mt-0.5 shrink-0 text-amber-700 dark:text-[#D4A34B]">
            <Film className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-[#F0C775]">
                {copy.minimaxPanelTitle}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-[#D4A34B]">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{copy.autoTag}</span>
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs leading-snug text-slate-500 dark:text-slate-400">
              MiniMax-Hailuo-02 · {form.mode.toUpperCase()} · {form.duration}s ·{" "}
              {form.duration >= 10 ? "768P" : form.minimaxResolution}
              {activeCommands.length > 0 ? ` · ${bracketPreview}` : ""}
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
      <div className="flex flex-col gap-5 border-t border-slate-100 p-4 sm:p-5 dark:border-[#222634]">
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {copy.minimaxPanelSub}
        </p>

      {/* Frame Workflow Mode & Duration Settings (Vertical Flex-Column on Mobile) */}
      <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2">
        {/* Frame Workflow Mode */}
        <div className="flex flex-col gap-2">
          <label className="block text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            {copy.minimaxFramesLbl}
          </label>
          <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:grid sm:grid-cols-3 dark:border-[#252A38] dark:bg-[#0B0D12]">
            {(
              [
                { id: "t2v", label: copy.minimaxModeT2V },
                { id: "i2v", label: copy.minimaxModeI2V },
                { id: "flf2v", label: copy.minimaxModeFLF2V },
              ] as { id: GenerationMode; label: string }[]
            ).map((item) => {
              const selected = form.mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeMode(item.id)}
                  className={`flex min-h-[48px] w-full items-center justify-center rounded-lg px-3 py-2 text-center text-xs font-semibold leading-snug whitespace-normal break-words transition-colors sm:min-h-[44px] sm:px-2 sm:text-[11.5px] ${
                    selected
                      ? "bg-white text-amber-800 shadow-xs dark:bg-[#1E2331] dark:text-[#F0C775]"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Resolution Presets */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-[#D4A34B]" />
            <span>{copy.minimaxDurationResLbl}</span>
          </label>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-1.5">
            <button
              type="button"
              onClick={() => onSelectDurationPreset(6, "1080P")}
              className={`flex min-h-[48px] w-full items-center justify-center rounded-lg border px-3.5 py-2.5 text-center text-xs font-semibold leading-snug whitespace-normal break-words transition-colors sm:px-2 sm:text-[11.5px] ${
                is6_1080
                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
              }`}
            >
              {copy.minimaxDur6_1080}
            </button>
            <button
              type="button"
              onClick={() => onSelectDurationPreset(6, "768P")}
              className={`flex min-h-[48px] w-full items-center justify-center rounded-lg border px-3.5 py-2.5 text-center text-xs font-semibold leading-snug whitespace-normal break-words transition-colors sm:px-2 sm:text-[11.5px] ${
                is6_768
                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
              }`}
            >
              {copy.minimaxDur6_768}
            </button>
            <button
              type="button"
              onClick={() => onSelectDurationPreset(10, "768P")}
              className={`flex min-h-[48px] w-full items-center justify-center rounded-lg border px-3.5 py-2.5 text-center text-xs font-semibold leading-snug whitespace-normal break-words transition-colors sm:px-2 sm:text-[11.5px] ${
                is10_768
                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
              }`}
            >
              {copy.minimaxDur10_768}
            </button>
          </div>
        </div>
      </div>

      {/* Bracketed Camera Commands [Camera] */}
      <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 dark:border-[#222634]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Camera className="h-3.5 w-3.5 text-amber-700 dark:text-[#D4A34B]" />
            <span>{copy.minimaxCameraBracketsLbl}</span>
          </div>
          <span
            dir="ltr"
            className="text-xs font-mono-code font-semibold text-amber-800 dark:text-[#F0C775]"
          >
            {bracketPreview}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-1.5">
          {HAILUO_OFFICIAL_COMMANDS.map((item) => {
            const active = activeCommands.includes(item.cmd);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleCameraCommand(item.cmd)}
                className={`flex min-h-[48px] w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-xs font-medium leading-snug whitespace-normal break-words transition-colors sm:min-h-[42px] sm:px-2.5 sm:text-[11.5px] ${
                  active
                    ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
                }`}
              >
                <span className="min-w-0 flex-1">{item.labels[lang]}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {copy.minimaxCameraBracketsHint}
        </p>
      </div>

      {/* Custom Hailuo 02 Prompt Directive + Optimizer Toggle */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-[#222634]">
        <div>
          <label className="mb-1.5 block text-start text-xs font-semibold text-slate-700 dark:text-slate-300">
            {copy.minimaxCustomDirectiveLbl}
          </label>
          <textarea
            rows={2}
            value={form.minimaxCustomDirective}
            onChange={(e) => onChangeCustomDirective(e.target.value)}
            placeholder={copy.minimaxCustomDirectivePlaceholder}
            className="min-h-[60px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-start text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#D4A34B] dark:focus:bg-[#0E1118]"
          />
        </div>

        <label
          dir="rtl"
          className="flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-amber-600/50 dark:border-[#252A38] dark:bg-[#0D1017] dark:text-slate-300"
        >
          <input
            type="checkbox"
            checked={form.minimaxPromptOptimizer}
            onChange={(e) => onTogglePromptOptimizer(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded accent-amber-700 dark:accent-[#D4A34B]"
          />
          <Sparkles className="h-4 w-4 shrink-0 text-amber-700 dark:text-[#D4A34B]" />
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
            {copy.minimaxOptimizerLbl}
          </span>
        </label>
      </div>

      {/* First Frame & Last Frame Upload Support (Stacked Vertically on Mobile) */}
      <div className="border-t border-slate-100 pt-2 dark:border-[#222634]">
        <ImageReferenceDropzone
          copy={copy}
          aspectOptions={aspectOptions}
          imageState={firstFrame}
          analyzing={analyzingImage}
          onImageLoaded={onFirstFrameLoaded}
          onClearImage={onClearFirstFrame}
          onAnalyzeImage={onAnalyzeFirstFrame}
          showEndFrame={true}
          endImageState={lastFrame}
          analyzingTransition={analyzingTransition}
          onEndImageLoaded={onLastFrameLoaded}
          onClearEndImage={onClearLastFrame}
          onAnalyzeTransition={onAnalyzeTransition}
        />
      </div>
      </div>
      )}
    </section>
  );
};
