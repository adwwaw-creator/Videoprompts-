import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  Download,
  FileJson,
  Film,
  Loader2,
  Lock,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { I18nCopy } from "../data/i18n";
import { Language, SceneChainItem, SceneChainState } from "../types/prompt";

interface SceneChainStudioProps {
  copy: I18nCopy;
  lang?: Language;
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

export const SceneChainStudio: React.FC<SceneChainStudioProps> = ({
  copy,
  lang = "ar",
  sceneChain,
  addingNextScene,
  generatingFilmChain = false,
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
  chainSavedRecently = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [chainOpen, setChainOpen] = useState(false);
  const [nextSceneIdea, setNextSceneIdea] = useState("");
  const [copiedSceneId, setCopiedSceneId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const prevCountRef = useRef(sceneChain.scenes.length);

  const totalScenes = sceneChain.scenes.length;
  const activeError = chainError || localError;
  const isBusy = addingNextScene || generatingFilmChain;
  const canAdd = useMemo(
    () => !isBusy && nextSceneIdea.trim().length > 0,
    [isBusy, nextSceneIdea]
  );

  useEffect(() => {
    if (totalScenes >= 10 && prevCountRef.current < 10) {
      setChainOpen(true);
    }
    prevCountRef.current = totalScenes;
  }, [totalScenes]);

  const handleSubmitNext = async () => {
    if (!canAdd) return;
    setLocalError(null);
    try {
      const ok = await onAddNextScene(nextSceneIdea);
      if (ok) {
        setNextSceneIdea("");
      }
    } catch (err: unknown) {
      console.error("SceneChainStudio handleSubmitNext error:", err);
      setLocalError(
        err instanceof Error ? err.message : "Failed to generate next scene."
      );
    }
  };

  const handleSubmitTenFilm = async () => {
    if (!onGenerateTenSceneFilm || isBusy) return;
    setLocalError(null);
    try {
      const ok = await onGenerateTenSceneFilm(nextSceneIdea);
      if (ok) {
        setNextSceneIdea("");
        setChainOpen(true);
      }
    } catch (err: unknown) {
      console.error("SceneChainStudio handleSubmitTenFilm error:", err);
      setLocalError(
        err instanceof Error
          ? err.message
          : "Failed to generate 10-scene film chain."
      );
    }
  };

  const handleCopyAll = async () => {
    if (totalScenes === 0) return;
    const text = sceneChain.scenes
      .map((s) => {
        const handoff = s.continuityState
          ? `\n\nCONTINUITY HANDOFF FOR NEXT SCENE: ${s.continuityState}`
          : "";
        return `=== ${copy.chainSceneLabel} ${s.order} — ${s.idea} ===\n${s.prompt}${handoff}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1800);
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-[#222634]">
      <button
        type="button"
        onClick={() => setChainOpen((v) => !v)}
        aria-expanded={chainOpen}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-amber-500/35 bg-amber-50/50 px-3 py-2 text-start text-xs font-semibold text-amber-900 transition-colors hover:border-amber-600 dark:border-[#D4A34B]/40 dark:bg-[#181B25] dark:text-[#F0C775]"
      >
        <span className="flex items-center gap-1.5">
          <Film className="h-3.5 w-3.5 shrink-0" />
          <span>
            {copy.chainSectionTitle}
            {totalScenes > 0 ? ` (${totalScenes})` : ""}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium opacity-90">
            {copy.chainAddBtn}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              chainOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {chainOpen && (
        <div className="mt-2.5 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-[#222634] dark:bg-[#0B0D12]">
          {/* Shared Locked Continuity Context */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span>{copy.chainHint}</span>
            {sceneChain.baseContext?.seed !== undefined && (
              <span className="inline-flex items-center gap-1 font-mono-code font-semibold text-amber-800 dark:text-[#F0C775]">
                <Lock className="h-3 w-3 shrink-0" />
                <span>
                  {copy.chainSeedLocked}: {sceneChain.baseContext.seed}
                </span>
              </span>
            )}
          </div>

          {sceneChain.baseContext && (
            <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 p-2.5 text-[11px] text-slate-600 sm:grid-cols-2 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300">
              {sceneChain.baseContext.character && (
                <p className="truncate">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {copy.chainCharacterLbl}:
                  </strong>{" "}
                  {sceneChain.baseContext.character}
                </p>
              )}
              {sceneChain.baseContext.style && (
                <p className="truncate">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {copy.chainStyleLbl}:
                  </strong>{" "}
                  {sceneChain.baseContext.style}
                </p>
              )}
              {sceneChain.baseContext.environment && (
                <p className="truncate">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {copy.chainEnvLbl}:
                  </strong>{" "}
                  {sceneChain.baseContext.environment}
                </p>
              )}
              {sceneChain.baseContext.camera && (
                <p className="truncate">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {copy.chainCameraLbl}:
                  </strong>{" "}
                  {sceneChain.baseContext.camera}
                </p>
              )}
            </div>
          )}

          {/* Scenes List */}
          {totalScenes > 0 && (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
              {sceneChain.scenes.map((scene) => (
                <div
                  key={`${scene.id}-${scene.order}`}
                  className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-[#222634] dark:bg-[#13161F]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-[#F0C775]">
                      {copy.chainSceneLabel} {scene.order} —{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {scene.idea}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLoadChainScene(scene)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                      >
                        {copy.chainLoadBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onCopyChainScene(scene);
                          setCopiedSceneId(scene.id);
                          window.setTimeout(() => setCopiedSceneId(null), 1600);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                      >
                        {copiedSceneId === scene.id ? (
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copy.chainCopyBtn}</span>
                      </button>
                    </div>
                  </div>
                  <p
                    dir="ltr"
                    className="mt-1.5 whitespace-pre-wrap break-words font-mono-code text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {scene.prompt}
                  </p>
                  {scene.continuityState && (
                    <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-50/50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-950 dark:border-[#D4A34B]/30 dark:bg-[#191610] dark:text-[#E5C98B]">
                      <span className="font-semibold">
                        {copy.chainContinuityLabel}:{" "}
                      </span>
                      <span dir="ltr" className="font-mono-code">
                        {scene.continuityState}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Next Scene Input & Actions */}
          <div className="space-y-2 border-t border-slate-200/80 pt-2.5 dark:border-[#222634]">
            {activeError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] leading-relaxed text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 break-words">{activeError}</span>
              </div>
            )}
            <textarea
              rows={2}
              value={nextSceneIdea}
              onChange={(e) => setNextSceneIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && canAdd) {
                  e.preventDefault();
                  void handleSubmitNext();
                }
              }}
              placeholder={copy.chainPlaceholder}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
            />

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,text/plain,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportChainFile(file);
                    setChainOpen(true);
                  }
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                disabled={!canAdd}
                onClick={() => void handleSubmitNext()}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-50 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
              >
                {addingNextScene && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                )}
                <span>
                  {addingNextScene ? copy.chainAddingBtn : copy.chainAddBtn}
                </span>
              </button>

              {onGenerateTenSceneFilm && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleSubmitTenFilm()}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-600/70 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-[#D4A34B]/70 dark:bg-[#1E1A12] dark:text-[#F0C775] dark:hover:bg-[#2A2418]"
                >
                  {generatingFilmChain ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    <Clapperboard className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>
                    {generatingFilmChain
                      ? lang === "ar"
                        ? "جارٍ توليد 10 برومبتات..."
                        : lang === "fr"
                        ? "Génération des 10 prompts..."
                        : "Generating 10 prompts..."
                      : lang === "ar"
                      ? "سلسلة فيلم (10 برومبتات)"
                      : lang === "fr"
                      ? "Série film (10 prompts)"
                      : "10-Prompt Film Chain"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200"
              >
                <Upload className="h-3.5 w-3.5 shrink-0" />
                <span>{copy.chainImportBtn}</span>
              </button>

              {totalScenes > 0 && (
                <>
                  {onSaveChainSequence && (
                    <button
                      type="button"
                      onClick={onSaveChainSequence}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-50/80 px-3 py-2 text-[11.5px] font-bold text-emerald-900 transition-colors hover:border-emerald-600 hover:bg-emerald-100/80 dark:border-emerald-500/45 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:border-emerald-400"
                    >
                      {chainSavedRecently ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Save className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>
                        {chainSavedRecently
                          ? copy.chainSequenceSavedBtn
                          : copy.chainSaveSequenceBtn}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleCopyAll()}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200"
                  >
                    {copiedAll ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{copy.chainCopyAllBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExportChain}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span>{copy.chainExportBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExportChainJson}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200"
                  >
                    <FileJson className="h-3.5 w-3.5 shrink-0" />
                    <span>{copy.chainExportJsonBtn}</span>
                  </button>

                  {totalScenes > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirmReset) {
                          setConfirmReset(true);
                          window.setTimeout(() => setConfirmReset(false), 3000);
                          return;
                        }
                        setConfirmReset(false);
                        onClearChain();
                      }}
                      className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border px-2.5 py-2 text-[11.5px] font-medium transition-colors ${
                        confirmReset
                          ? "border-red-500 bg-red-50 text-red-700 dark:border-red-500/70 dark:bg-red-950/40 dark:text-red-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-400 hover:text-red-600 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-300"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {confirmReset ? copy.chainConfirmReset : copy.chainClearBtn}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            {totalScenes > 0 && (
              <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                {copy.chainTotalScenes}: {totalScenes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
