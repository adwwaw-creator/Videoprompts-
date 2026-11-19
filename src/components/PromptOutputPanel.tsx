import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileJson,
  Gauge,
  History,
  Info,
  Loader2,
  Save,
  SlidersHorizontal,
  Star,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { SceneChainStudio } from "./SceneChainStudio";
import { ENGINES } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import {
  EngineId,
  HistoryEntry,
  Language,
  PromptQualityReport,
  SceneChainItem,
  SceneChainState,
} from "../types/prompt";

export interface MiniMaxLaunchState {
  open: boolean;
  submitting: boolean;
  polling: boolean;
  mode: "api" | "handoff" | null;
  launchUrl: string;
  taskId?: string | null;
  statusText?: string | null;
  videoUrl?: string | null;
  error?: string | null;
  compiledPrompt: string;
  duration: number;
  resolution: string;
  hasFirstFrame: boolean;
  hasLastFrame: boolean;
}

interface PromptOutputPanelProps {
  copy: I18nCopy;
  lang: Language;
  activeEngine: EngineId;
  outputText: string;
  shotsOrStepsLabel: string;
  shotsOrStepsValue: number;
  qualityReport: PromptQualityReport;
  recentHistory: HistoryEntry[];
  fittingLength: boolean;
  convertingTarget: "hailuo02" | "veo31" | null;
  onChangeOutput: (value: string) => void;
  onCopyFull: () => void;
  onCopyPositive: () => void;
  onSavePrompt: () => void;
  promptSavedRecently?: boolean;
  onUnslop: () => void;
  onExportJson: () => void;
  onExportPython: () => void;
  onDownloadTxt: () => void;
  onFitLength: () => void;
  onConvertFormat: (target: "hailuo02" | "veo31") => void;
  onRestoreHistory: (entry: HistoryEntry) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
  onLaunchMinimax: () => void;
  onCloseMinimaxLaunch: () => void;
  minimaxLaunchState: MiniMaxLaunchState;
  veoMeta?: {
    promptChars: number;
    maxPromptChars: number;
    warnings: string[];
  } | null;
  copiedType: "full" | "positive" | null;
  sceneChain: SceneChainState;
  addingNextScene: boolean;
  generatingFilmChain?: boolean;
  chainError?: string | null;
  onAddNextScene: (newIdea: string) => Promise<boolean>;
  onGenerateTenSceneFilm?: (filmIdea: string) => Promise<boolean>;
  onCopyChainScene: (scene: SceneChainItem) => void;
  onLoadChainScene: (scene: SceneChainItem) => void;
  onExportChain: () => void;
  onExportChainJson: () => void;
  onImportChainFile: (file: File) => void;
  onClearChain: () => void;
  onSaveChainSequence?: () => void;
  chainSavedRecently?: boolean;
}

const VEO_API_SNIPPET = `from google import genai
from google.genai import types

client = genai.Client()
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=YOUR_CONVERTED_PROMPT,
    config=types.GenerateVideosConfig(resolution="720p"),
)`;

export const PromptOutputPanel: React.FC<PromptOutputPanelProps> = ({
  copy,
  lang,
  activeEngine,
  outputText,
  shotsOrStepsLabel,
  shotsOrStepsValue,
  qualityReport,
  recentHistory,
  fittingLength,
  convertingTarget,
  onChangeOutput,
  onCopyFull,
  onCopyPositive,
  onSavePrompt,
  promptSavedRecently = false,
  onUnslop,
  onExportJson,
  onExportPython,
  onDownloadTxt,
  onFitLength,
  onConvertFormat,
  onRestoreHistory,
  onToggleFavorite,
  onClearHistory,
  onLaunchMinimax,
  onCloseMinimaxLaunch,
  minimaxLaunchState,
  veoMeta,
  copiedType,
  sceneChain,
  addingNextScene,
  generatingFilmChain,
  chainError,
  onAddNextScene,
  onGenerateTenSceneFilm,
  onCopyChainScene,
  onLoadChainScene,
  onExportChain,
  onExportChainJson,
  onImportChainFile,
  onClearChain,
  onSaveChainSequence,
  chainSavedRecently,
}) => {
  const [showVeoSnippet, setShowVeoSnippet] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const words = outputText.trim()
    ? outputText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const chars = outputText.length;
  const estTokens = Math.round(words * 1.32);
  const spec = ENGINES[activeEngine];

  const scoreTone =
    qualityReport.score >= 80
      ? "text-emerald-700 dark:text-emerald-400"
      : qualityReport.score >= 60
        ? "text-amber-700 dark:text-[#F0C775]"
        : "text-red-600 dark:text-red-400";

  const breakdownItems = [
    { label: copy.analyzerClarity, value: qualityReport.breakdown.clarity },
    { label: copy.analyzerContinuity, value: qualityReport.breakdown.continuity },
    { label: copy.analyzerPacing, value: qualityReport.breakdown.pacing },
    { label: copy.analyzerMotion, value: qualityReport.breakdown.motionCoherence },
  ];

  return (
    <div className="flex flex-col gap-5 lg:sticky lg:top-[76px]">
      {/* Output Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {copy.secOutput}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono-code dark:text-slate-400">
            <span>
              <strong className="text-slate-900 dark:text-[#F0C775]">{words}</strong>{" "}
              {copy.statWords}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 dark:text-[#F0C775]">{chars}</strong>{" "}
              {copy.statChars}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 dark:text-[#F0C775]">~{estTokens}</strong>{" "}
              {copy.statTokens}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 dark:text-[#F0C775]">
                {shotsOrStepsValue}
              </strong>{" "}
              {shotsOrStepsLabel}
            </span>
          </div>
        </div>

        <textarea
          value={outputText}
          onChange={(e) => onChangeOutput(e.target.value)}
          placeholder={copy.outputPlaceholder}
          spellCheck={false}
          dir="ltr"
          className="min-h-[220px] sm:min-h-[280px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-900 font-mono-code placeholder:text-slate-400 focus:border-amber-600 focus:outline-none dark:border-[#252A38] dark:bg-[#080A0F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
        />

        {activeEngine === "veo" && veoMeta && (
          <div className="mt-2.5 rounded-lg border border-cyan-600/30 bg-cyan-50/50 p-2.5 text-xs dark:border-[#55D9EE]/30 dark:bg-[#0B1218]">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-cyan-900 dark:text-[#55D9EE]">
                {copy.veoCharsLimitLbl}
              </span>
              <span className="font-mono-code font-semibold text-slate-800 dark:text-slate-200">
                {veoMeta.promptChars} / {veoMeta.maxPromptChars}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1F2433]">
              <div
                className={`h-full rounded-full transition-all ${
                  veoMeta.promptChars >= veoMeta.maxPromptChars * 0.95
                    ? "bg-red-500"
                    : veoMeta.promptChars >= veoMeta.maxPromptChars * 0.8
                      ? "bg-amber-500"
                      : "bg-cyan-600 dark:bg-[#55D9EE]"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((veoMeta.promptChars / veoMeta.maxPromptChars) * 100)
                  )}%`,
                }}
              />
            </div>
            {veoMeta.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {veoMeta.warnings.map((w, i) => (
                  <p
                    key={i}
                    dir="ltr"
                    className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-[#F0C775]"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCopyFull}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 whitespace-normal dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
          >
            {copiedType === "full" ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{copy.btnCopyFull}</span>
          </button>

          <button
            type="button"
            onClick={onCopyPositive}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 whitespace-normal dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
          >
            {copiedType === "positive" ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{copy.btnCopyPositive}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onSavePrompt}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/45 bg-amber-50/70 px-3 py-2 text-center text-xs font-semibold leading-snug text-amber-900 transition-colors hover:border-amber-600 hover:bg-amber-100/70 dark:border-[#D4A34B]/45 dark:bg-[#1B1E2A] dark:text-[#F0C775] dark:hover:border-[#D4A34B] dark:hover:bg-[#232737]"
        >
          {promptSavedRecently ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Save className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>
            {promptSavedRecently ? copy.btnSavedPrompt : copy.btnSavePrompt}
          </span>
        </button>

        {/* Sequential Scene Chain (Available on ALL generated prompts & TXT imports) */}
        <SceneChainStudio
          copy={copy}
          lang={lang}
          sceneChain={sceneChain}
          addingNextScene={addingNextScene}
          generatingFilmChain={generatingFilmChain}
          chainError={chainError}
          onAddNextScene={onAddNextScene}
          onGenerateTenSceneFilm={onGenerateTenSceneFilm}
          onCopyChainScene={onCopyChainScene}
          onLoadChainScene={onLoadChainScene}
          onExportChain={onExportChain}
          onExportChainJson={onExportChainJson}
          onImportChainFile={onImportChainFile}
          onClearChain={onClearChain}
          onSaveChainSequence={onSaveChainSequence}
          chainSavedRecently={chainSavedRecently}
        />

        {/* Collapsible Export, Calibration & Cross-Engine Converters */}
        <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-[#222634]">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            aria-expanded={exportOpen}
            className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-right text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#181C28] dark:hover:text-[#F0C775]"
          >
            <span>{copy.secExportTools}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                exportOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
              }`}
            />
          </button>

          {exportOpen && (
            <div className="mt-2.5 space-y-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onExportJson}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 whitespace-normal dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <FileJson className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnExportJson}</span>
                </button>

                <button
                  type="button"
                  onClick={onExportPython}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 whitespace-normal dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <Code2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnExportPython}</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadTxt}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold leading-snug text-slate-800 transition-colors hover:border-amber-600 hover:text-amber-700 whitespace-normal dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-100 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnDownloadTxt}</span>
                </button>

                <button
                  type="button"
                  disabled={fittingLength}
                  onClick={onFitLength}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-50/70 px-3 py-2 text-center text-xs font-semibold leading-snug text-amber-900 transition-colors hover:border-amber-600 disabled:opacity-50 whitespace-normal dark:border-[#D4A34B]/40 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {fittingLength ? copy.btnFittingLength : copy.btnFitLength}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={convertingTarget !== null}
                  onClick={() => onConvertFormat("hailuo02")}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[11.5px] font-semibold leading-snug text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-800 disabled:opacity-50 whitespace-normal dark:border-[#262B3A] dark:bg-[#0D1017] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <ArrowRightLeft className="h-3 w-3 shrink-0" />
                  <span>
                    {convertingTarget === "hailuo02"
                      ? copy.convertingFormat
                      : copy.btnConvertHailuo}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={convertingTarget !== null}
                  onClick={() => onConvertFormat("veo31")}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[11.5px] font-semibold leading-snug text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-800 disabled:opacity-50 whitespace-normal dark:border-[#262B3A] dark:bg-[#0D1017] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <ArrowRightLeft className="h-3 w-3 shrink-0" />
                  <span>
                    {convertingTarget === "veo31"
                      ? copy.convertingFormat
                      : copy.btnConvertVeo}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVeoSnippet((v) => !v)}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-center text-[11.5px] font-medium leading-snug transition-colors whitespace-normal ${
                    showVeoSnippet
                      ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-[#262B3A] dark:bg-[#0D1017] dark:text-slate-300"
                  }`}
                >
                  <Terminal className="h-3 w-3 shrink-0" />
                  <span>{copy.btnVeoCode}</span>
                </button>

                <button
                  type="button"
                  disabled={!outputText.trim()}
                  onClick={onUnslop}
                  title={
                    lang === "ar"
                      ? "تنظيف البرومبت من الكلمات الحشوية والمصطلحات المكررة (Unslop)"
                      : lang === "fr"
                        ? "Nettoyer les mots superflus et le jargon IA (Unslop)"
                        : "Clean LLM filler words and over-descriptive jargon (Unslop)"
                  }
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[11.5px] font-semibold leading-snug text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-800 disabled:opacity-50 whitespace-normal dark:border-[#262B3A] dark:bg-[#0D1017] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <Eraser className="h-3 w-3 shrink-0" />
                  <span>Unslop</span>
                </button>
              </div>

              <button
                type="button"
                disabled={minimaxLaunchState.submitting}
                onClick={onLaunchMinimax}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-[#10242A] via-[#132C34] to-[#1A1A26] border border-[#55D9EE]/45 px-4 py-2.5 text-center text-xs font-bold leading-snug text-[#F5E3B5] transition-colors hover:border-[#55D9EE] hover:text-white disabled:opacity-50 whitespace-normal dark:from-[#0C1D24] dark:via-[#12262E] dark:to-[#191625]"
              >
                {minimaxLaunchState.submitting && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55D9EE]" />
                )}
                <span>
                  {minimaxLaunchState.submitting
                    ? copy.minimaxLaunchGenerating
                    : copy.btnLaunchMinimax}
                </span>
              </button>
            </div>
          )}

          {minimaxLaunchState.open && (
            <div className="mt-3 rounded-xl border border-[#55D9EE]/40 bg-slate-50 p-3.5 text-xs dark:border-[#55D9EE]/35 dark:bg-[#0B0F17]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-[#F5E3B5]">
                    {copy.minimaxLaunchReadyTitle}
                  </h4>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {minimaxLaunchState.mode === "api" && minimaxLaunchState.polling
                      ? copy.minimaxLaunchPolling
                      : minimaxLaunchState.videoUrl
                        ? copy.minimaxLaunchSuccess
                        : copy.minimaxLaunchCopiedNote}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseMinimaxLaunch}
                  aria-label={copy.minimaxClosePanel}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 dark:border-[#252A38] dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-mono-code text-slate-500 dark:text-slate-400">
                <span>MiniMax-Hailuo-02</span>
                <span aria-hidden="true">·</span>
                <span>{minimaxLaunchState.duration}s</span>
                <span aria-hidden="true">·</span>
                <span>{minimaxLaunchState.resolution}</span>
                {minimaxLaunchState.hasFirstFrame && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>First Frame ✓</span>
                  </>
                )}
                {minimaxLaunchState.hasLastFrame && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Last Frame ✓</span>
                  </>
                )}
              </div>

              {minimaxLaunchState.error && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11.5px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {minimaxLaunchState.error}
                </p>
              )}

              {minimaxLaunchState.polling && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-50/70 px-3 py-2 text-[11.5px] text-amber-900 dark:border-[#D4A34B]/30 dark:bg-[#161922] dark:text-[#F0C775]">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span>
                    {copy.minimaxLaunchPolling}{" "}
                    {minimaxLaunchState.taskId ? `(${minimaxLaunchState.taskId})` : ""}
                  </span>
                </div>
              )}

              {minimaxLaunchState.videoUrl && (
                <div className="mt-3 space-y-2">
                  <video
                    src={minimaxLaunchState.videoUrl}
                    controls
                    playsInline
                    className="w-full rounded-lg border border-slate-200 bg-black dark:border-[#252A38]"
                  />
                  <a
                    href={minimaxLaunchState.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="minimax_hailuo_02.mp4"
                    className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{copy.minimaxLaunchDownloadVideo}</span>
                  </a>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={minimaxLaunchState.launchUrl || "https://hailuoai.video/create"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#D4A34B] px-3.5 py-2 text-center text-xs font-bold text-[#110D05] transition-colors hover:bg-[#E2B869]"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.minimaxLaunchOpenApp}</span>
                </a>
              </div>
            </div>
          )}

          {showVeoSnippet && (
            <pre
              dir="ltr"
              className="mt-2.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11.5px] leading-relaxed text-slate-700 font-mono-code dark:border-[#252A38] dark:bg-[#080A0F] dark:text-slate-300"
            >
              {VEO_API_SNIPPET}
            </pre>
          )}
        </div>
      </section>

      {/* Prompt Quality Analyzer (/100) - Collapsed by Default */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-[#222634] dark:bg-[#13161F]">
        <button
          type="button"
          onClick={() => setAnalyzerOpen((v) => !v)}
          aria-expanded={analyzerOpen}
          className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-right transition-colors hover:bg-slate-50/70 dark:hover:bg-[#181C28]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
            <Gauge className="h-4 w-4 text-amber-700 dark:text-[#D4A34B]" />
            <span>{copy.secAnalyzer}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1 font-mono-code">
              <span className={`text-base font-bold tabular-nums ${scoreTone}`}>
                {qualityReport.score}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                analyzerOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
              }`}
            />
          </div>
        </button>

        {analyzerOpen && (
          <div className="border-t border-slate-100 p-4 dark:border-[#222634]">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {breakdownItems.map((metric) => {
                const pct = Math.max(0, Math.min(100, (metric.value / 25) * 100));
                return (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-[#1E2331] dark:bg-[#0C0F16]"
                  >
                    <div className="flex items-start justify-between gap-1 text-[11px] leading-snug">
                      <span className="break-words text-slate-600 dark:text-slate-400">
                        {metric.label}
                      </span>
                      <span className="shrink-0 font-mono-code font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {metric.value}/25
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1F2433]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80
                            ? "bg-emerald-500"
                            : pct >= 55
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-2">
              {qualityReport.issues.length === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{copy.analyzerNoIssues}</span>
                </div>
              ) : (
                qualityReport.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                      issue.severity === "warning"
                        ? "border-amber-200/80 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[#222634] dark:bg-[#0C0F16] dark:text-slate-300"
                    }`}
                  >
                    {issue.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-[#F0C775]" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{issue.title[lang]}</p>
                      <p className="mt-0.5 text-[11.5px] opacity-90">{issue.detail[lang]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* Engine Notes - Collapsed by Default */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-[#222634] dark:bg-[#13161F]">
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          aria-expanded={notesOpen}
          className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-right transition-colors hover:bg-slate-50/70 dark:hover:bg-[#181C28]"
        >
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
            <Info className="h-4 w-4 shrink-0 text-amber-700 dark:text-[#D4A34B]" />
            <span className="truncate">{copy.secEngineNotes}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-mono-code text-slate-500 dark:text-slate-400">
              {spec.name}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                notesOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
              }`}
            />
          </div>
        </button>

        {notesOpen && (
          <div className="border-t border-slate-100 p-4 dark:border-[#222634]">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {spec.name} · {spec.vendor}
              </span>
              <span className="font-mono-code">{spec.encoder}</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {spec.bestPractices[lang].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-600 dark:bg-[#D4A34B]" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Compact Recent History - Collapsed by Default */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-[#222634] dark:bg-[#13161F]">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
          className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-right transition-colors hover:bg-slate-50/70 dark:hover:bg-[#181C28]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
            <History className="h-3.5 w-3.5 text-amber-700 dark:text-[#D4A34B]" />
            <span>
              {copy.secHistory} ({recentHistory.length})
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              historyOpen ? "rotate-180 text-amber-700 dark:text-[#D4A34B]" : ""
            }`}
          />
        </button>

        {historyOpen && (
          <div className="border-t border-slate-100 p-4 dark:border-[#222634]">
            {recentHistory.length > 0 && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{copy.btnClearHistory}</span>
                </button>
              </div>
            )}

            {recentHistory.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {copy.emptyHistoryTitle}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#222634]">
                {recentHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="break-words text-xs font-medium leading-snug text-slate-800 dark:text-slate-200"
                        dir="ltr"
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 font-mono-code dark:text-slate-400">
                        {ENGINES[item.engine]?.name || item.engine}
                        {item.engine === "wan22" && item.wanVariant
                          ? ` (${item.wanVariant === "ti2v_5b" ? "TI2V-5B" : "A14B"})`
                          : ""}{" "}
                        · {item.time}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={copy.filterFavorites}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                          item.isFavorite
                            ? "border-amber-500/70 bg-amber-50 text-amber-600 dark:border-[#D4A34B]/70 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                            : "border-slate-200 bg-slate-50 text-slate-400 hover:text-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:hover:text-[#F0C775]"
                        }`}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${item.isFavorite ? "fill-current" : ""}`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRestoreHistory(item)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                      >
                        {copy.btnRestore}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
