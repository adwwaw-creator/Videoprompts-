import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudUpload,
  Copy,
  Cpu,
  FileJson,
  Film,
  Layers,
  Loader2,
  LogIn,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { ENGINE_ORDER, ENGINES } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import {
  EngineId,
  HistoryEntry,
  Language,
  SavedSequenceEntry,
  VideoGeneratorModel,
} from "../types/prompt";

const SEQUENCE_ENGINES: EngineId[] = ["wan22", "minimax", "veo"];

const ENGINE_ALIASES: Record<EngineId, string[]> = {
  wan22: ["wan", "wan22", "wan2.2", "wan 2.2", "a14b", "ti2v", "alibaba"],
  minimax: ["minimax", "hailuo", "hailuo 02", "hailuo02"],
  veo: ["veo", "veo 3", "veo 3.1", "veo3", "google", "deepmind"],
  hunyuan: ["hunyuan", "hunyuanvideo", "tencent"],
  ltx: ["ltx", "ltx-video", "lightricks"],
  flux1: ["flux", "flux1", "flux.1", "black forest"],
  sdxl: ["sdxl", "illustrious", "stability"],
};

function mapSequenceModelToEngine(model: VideoGeneratorModel): EngineId {
  if (model === "minimax") return "minimax";
  if (model === "google") return "veo";
  return "wan22";
}

function resolveHistoryEngine(entry: HistoryEntry): EngineId {
  if (entry.engine && ENGINES[entry.engine]) {
    return entry.engine;
  }
  if (entry.generatorSnapshot?.result.model) {
    return mapSequenceModelToEngine(entry.generatorSnapshot.result.model);
  }
  const dirEngine = String(entry.directorSnapshot?.options.engine || "").toLowerCase();
  if (dirEngine.includes("minimax") || dirEngine.includes("hailuo")) return "minimax";
  if (dirEngine.includes("veo") || dirEngine.includes("google")) return "veo";
  return "wan22";
}

function getEngineSearchBlob(engineId: EngineId): string {
  const spec = ENGINES[engineId];
  const aliases = ENGINE_ALIASES[engineId] ?? [];
  return [engineId, spec?.name ?? "", spec?.vendor ?? "", ...aliases]
    .join(" ")
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedTitle(title: string, rawQuery: string): React.ReactNode {
  const tokens = rawQuery
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 2);
  if (tokens.length === 0) return title;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = title.split(pattern);
  if (parts.length <= 1) return title;

  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark
        key={`${part}-${idx}`}
        className="rounded-xs bg-amber-200/80 px-0.5 text-slate-950 dark:bg-[#D4A34B]/30 dark:text-[#F6D58E]"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

interface HistoryViewProps {
  copy: I18nCopy;
  lang: Language;
  history: HistoryEntry[];
  savedSequences: SavedSequenceEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onCopyPrompt: (text: string) => void;
  onExportEntryJson: (entry: HistoryEntry) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onToggleFavoriteSequence: (id: string) => void;
  onDeleteSequence: (id: string) => void;
  onClearSequences: () => void;
  onLoadSequence: (seq: SavedSequenceEntry) => void;
  onApplySequenceProps: (seq: SavedSequenceEntry) => void;
  onApplyEntryProps: (entry: HistoryEntry) => void;
  onGoStudio: () => void;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  authLoading?: boolean;
  cloudSyncing?: boolean;
  onSignIn?: () => void;
  onSyncLocalToCloud?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  copy,
  history,
  savedSequences,
  onRestore,
  onCopyPrompt,
  onExportEntryJson,
  onToggleFavorite,
  onDeleteEntry,
  onClearAll,
  onToggleFavoriteSequence,
  onDeleteSequence,
  onClearSequences,
  onLoadSequence,
  onApplySequenceProps,
  onApplyEntryProps,
  onGoStudio,
  currentUserEmail,
  currentUserName,
  authLoading = false,
  cloudSyncing = false,
  onSignIn,
  onSyncLocalToCloud,
}) => {
  const [sectionTab, setSectionTab] = useState<"all" | "sequences">("all");
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  const [selectedEngine, setSelectedEngine] = useState<"all" | EngineId>("all");
  const [expandedSeqIds, setExpandedSeqIds] = useState<Record<string, boolean>>(
    {}
  );

  const availableEngines =
    sectionTab === "all" ? ENGINE_ORDER : SEQUENCE_ENGINES;

  const activeEngineFilter: "all" | EngineId =
    selectedEngine === "all" || availableEngines.includes(selectedEngine)
      ? selectedEngine
      : "all";

  const favoriteCount = useMemo(
    () => history.filter((item) => item.isFavorite).length,
    [history]
  );

  const favoriteSeqCount = useMemo(
    () => savedSequences.filter((seq) => seq.isFavorite).length,
    [savedSequences]
  );

  const engineCounts = useMemo(() => {
    const counts: Partial<Record<EngineId, number>> = {};
    if (sectionTab === "all") {
      for (const item of history) {
        if (filterMode === "favorites" && !item.isFavorite) continue;
        const eng = resolveHistoryEngine(item);
        counts[eng] = (counts[eng] ?? 0) + 1;
      }
    } else {
      for (const seq of savedSequences) {
        if (filterMode === "favorites" && !seq.isFavorite) continue;
        const eng = mapSequenceModelToEngine(seq.model);
        counts[eng] = (counts[eng] ?? 0) + 1;
      }
    }
    return counts;
  }, [sectionTab, history, savedSequences, filterMode]);

  const queryTokens = useMemo(
    () =>
      query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [query]
  );

  const filteredPrompts = useMemo(() => {
    return history.filter((item) => {
      if (filterMode === "favorites" && !item.isFavorite) {
        return false;
      }
      const resolvedEngine = resolveHistoryEngine(item);
      if (activeEngineFilter !== "all" && resolvedEngine !== activeEngineFilter) {
        return false;
      }
      if (queryTokens.length === 0) return true;

      const subject = item.stateSnapshot?.subject ?? "";
      const genIdea = item.generatorSnapshot?.idea ?? "";
      const genModel = item.generatorSnapshot?.result.model ?? "";
      const dirPrompt = item.directorSnapshot?.options.prompt ?? "";
      const dirEngine = String(item.directorSnapshot?.options.engine ?? "");
      const searchableText = [
        item.title,
        getEngineSearchBlob(resolvedEngine),
        genModel,
        dirEngine,
        subject,
        genIdea,
        dirPrompt,
        item.category,
        item.mode,
        item.prompt,
      ]
        .join(" ")
        .toLowerCase();

      return queryTokens.every((token) => searchableText.includes(token));
    });
  }, [history, queryTokens, filterMode, activeEngineFilter]);

  const filteredSequences = useMemo(() => {
    return savedSequences.filter((seq) => {
      if (filterMode === "favorites" && !seq.isFavorite) {
        return false;
      }
      const resolvedEngine = mapSequenceModelToEngine(seq.model);
      if (activeEngineFilter !== "all" && resolvedEngine !== activeEngineFilter) {
        return false;
      }
      if (queryTokens.length === 0) return true;

      const scenesText = seq.scenes
        .map((s) => `${s.narrativeBeat} ${s.prompt}`)
        .join(" ");
      const searchableText = [
        seq.title,
        seq.idea,
        seq.model,
        getEngineSearchBlob(resolvedEngine),
        seq.style,
        scenesText,
      ]
        .join(" ")
        .toLowerCase();

      return queryTokens.every((token) => searchableText.includes(token));
    });
  }, [savedSequences, queryTokens, filterMode, activeEngineFilter]);

  const resetAllFilters = () => {
    setQuery("");
    setSelectedEngine("all");
    setFilterMode("all");
  };

  const isFiltered =
    query.trim().length > 0 ||
    filterMode === "favorites" ||
    activeEngineFilter !== "all";
  const activeTotal =
    sectionTab === "all" ? history.length : savedSequences.length;
  const activeFilteredCount =
    sectionTab === "all" ? filteredPrompts.length : filteredSequences.length;
  const activeFavCount =
    sectionTab === "all" ? favoriteCount : favoriteSeqCount;

  const quickEngineList = useMemo(
    () =>
      availableEngines.filter(
        (engId) =>
          (engineCounts[engId] ?? 0) > 0 || activeEngineFilter === engId
      ),
    [availableEngines, engineCounts, activeEngineFilter]
  );

  const exportSequenceJson = (seq: SavedSequenceEntry) => {
    const blob = new Blob([JSON.stringify(seq, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts-sequence-${seq.model}-${seq.scenes.length}scenes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderEntrySpecs = (entry: HistoryEntry) => {
    const specs: { label: string; value: string }[] = [];
    const wordCount = entry.prompt.trim().split(/\s+/).filter(Boolean).length;

    if (entry.source === "director_v2" && entry.directorSnapshot) {
      const o = entry.directorSnapshot.options;
      specs.push({ label: copy.propModel, value: String(o.engine || "veo").toUpperCase() });
      if (o.duration) specs.push({ label: copy.propDuration, value: `${o.duration}s` });
      if (o.fps) specs.push({ label: copy.propFps, value: `${o.fps}` });
      if (o.aspectRatio) specs.push({ label: copy.propAspect, value: o.aspectRatio });
      if (o.genre) specs.push({ label: copy.propGenre, value: o.genre });
      if (o.shotType) specs.push({ label: copy.propShotType, value: o.shotType });
      if (o.mood) specs.push({ label: copy.propMood, value: o.mood });
      if (o.grading) specs.push({ label: copy.propGrading, value: o.grading });
      specs.push({ label: copy.propWords, value: String(wordCount) });
    } else if (entry.source === "generator_v1" && entry.generatorSnapshot) {
      const r = entry.generatorSnapshot.result;
      specs.push({ label: copy.propModel, value: r.model.toUpperCase() });
      specs.push({
        label: copy.propMode,
        value: r.mode === "normal" ? copy.genModeNormal : r.mode.toUpperCase(),
      });
      if (r.scenes.length > 0) {
        specs.push({ label: copy.propScenes, value: String(r.scenes.length) });
      }
      specs.push({ label: copy.propDuration, value: `${r.shotLen}s` });
      specs.push({ label: copy.propStyle, value: r.style });
      specs.push({ label: copy.propLanguage, value: r.lang.toUpperCase() });
      specs.push({ label: copy.propWords, value: String(wordCount) });
    } else {
      const s = entry.stateSnapshot;
      specs.push({
        label: copy.propModel,
        value: ENGINES[entry.engine]?.name || entry.engine,
      });
      specs.push({ label: copy.propMode, value: entry.mode.toUpperCase() });
      if (s?.duration) specs.push({ label: copy.propDuration, value: `${s.duration}s` });
      if (s?.aspect) specs.push({ label: copy.propAspect, value: s.aspect });
      if (s?.style) specs.push({ label: copy.propStyle, value: s.style });
      if (s?.camera) specs.push({ label: copy.propCamera, value: s.camera });
      if (s?.light) specs.push({ label: copy.propLighting, value: s.light });
      specs.push({ label: copy.propWords, value: String(wordCount) });
    }

    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 dark:border-[#1E2230] dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {copy.historyPromptPropsTitle}:
        </span>
        {specs.map((spec, idx) => (
          <React.Fragment key={`${spec.label}-${idx}`}>
            {idx > 0 && (
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
            )}
            <span className="tabular-nums">
              <span className="text-slate-400 dark:text-slate-500">
                {spec.label}:
              </span>{" "}
              <span className="font-mono-code font-medium text-slate-800 dark:text-slate-200">
                {spec.value}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Cloud Account & Library Sync Banner */}
      {currentUserEmail ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/35 bg-emerald-50/50 px-4 py-3 text-xs dark:border-emerald-500/25 dark:bg-emerald-950/20">
          <div className="flex min-w-0 items-center gap-2.5">
            <Cloud className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                {currentUserName ? `${currentUserName} · ` : ""}
                <bdi dir="ltr" className="font-mono-code font-normal opacity-90">
                  {currentUserEmail}
                </bdi>
              </p>
              <p className="mt-0.5 text-[11.5px] text-emerald-800/90 dark:text-emerald-300/90">
                {copy.accountCloudSyncActive}
              </p>
            </div>
          </div>
          {onSyncLocalToCloud && (history.length > 0 || savedSequences.length > 0) && (
            <button
              type="button"
              disabled={cloudSyncing}
              onClick={onSyncLocalToCloud}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:border-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-[#13161F] dark:text-emerald-300"
            >
              {cloudSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CloudUpload className="h-3.5 w-3.5" />
              )}
              <span>{copy.accountSyncLocalBtn}</span>
            </button>
          )}
        </div>
      ) : onSignIn ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-50/60 px-4 py-3.5 text-xs dark:border-[#D4A34B]/35 dark:bg-[#181510]">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-amber-950 dark:text-[#F0C775]">
              {copy.accountCloudSyncGuestTitle}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-900/85 dark:text-slate-300">
              {copy.accountCloudSyncGuestDesc}
            </p>
          </div>
          <button
            type="button"
            disabled={authLoading}
            onClick={onSignIn}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-50 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
          >
            <LogIn className="h-3.5 w-3.5 shrink-0" />
            <span>{copy.btnSignInRegister}</span>
          </button>
        </div>
      ) : null}

      {/* Header + Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-[#222634]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {copy.secHistory}
          </h1>
          <p className="mt-1 font-mono-code text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {isFiltered
              ? `${activeFilteredCount} / ${activeTotal}`
              : activeTotal}{" "}
            {copy.historySavedLabel} · {activeFavCount} {copy.filterFavorites}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
          {/* All | Favorites filter */}
          <div
            className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-[#252A38] dark:bg-[#0D1017]"
            role="group"
          >
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`min-h-[34px] rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                filterMode === "all"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-[#1E2331] dark:text-[#F0C775]"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {copy.filterAll} ({activeTotal})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("favorites")}
              className={`inline-flex min-h-[34px] items-center justify-center gap-1 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                filterMode === "favorites"
                  ? "bg-white text-amber-700 shadow-xs dark:bg-[#1E2331] dark:text-[#F0C775]"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Star className="h-3 w-3 fill-current" />
              <span>
                {copy.filterFavorites} ({activeFavCount})
              </span>
            </button>
          </div>

          {/* Engine filter select */}
          <div className="relative flex-1 sm:flex-initial">
            <Cpu className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={activeEngineFilter}
              onChange={(e) =>
                setSelectedEngine(e.target.value as "all" | EngineId)
              }
              aria-label={copy.filterEngineLabel}
              className="min-h-[42px] w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 ps-8 pe-8 text-start text-xs font-medium text-slate-800 focus:border-amber-600 focus:outline-none sm:w-48 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
            >
              <option value="all">
                {copy.filterAllEngines} (
                {filterMode === "favorites" ? activeFavCount : activeTotal})
              </option>
              {availableEngines.map((engId) => {
                const count = engineCounts[engId] ?? 0;
                return (
                  <option key={engId} value={engId}>
                    {ENGINES[engId].name} ({count})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Search input with inline X clear button */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchHistoryPlaceholder}
              aria-label={copy.searchHistoryPlaceholder}
              className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-white py-2 ps-8 pe-8 text-start text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none sm:w-64 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={copy.clearSearchBtn}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {sectionTab === "all" && history.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:border-red-400 dark:border-[#252A38] dark:bg-[#13161F] dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{copy.btnClearHistory}</span>
            </button>
          )}

          {sectionTab === "sequences" && savedSequences.length > 0 && (
            <button
              type="button"
              onClick={onClearSequences}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:border-red-400 dark:border-[#252A38] dark:bg-[#13161F] dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{copy.btnClearHistory}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs: All Prompts vs Saved Sequences */}
      <div className="mb-4 flex items-center gap-6 border-b border-slate-200 dark:border-[#222634]">
        <button
          type="button"
          onClick={() => setSectionTab("all")}
          className={`relative inline-flex items-center gap-2 pb-3 text-xs font-bold transition-colors tabular-nums ${
            sectionTab === "all"
              ? "text-amber-700 dark:text-[#F0C775]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>
            {copy.historyTabAll} ({history.length})
          </span>
          {sectionTab === "all" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-600 dark:bg-[#D4A34B]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSectionTab("sequences")}
          className={`relative inline-flex items-center gap-2 pb-3 text-xs font-bold transition-colors tabular-nums ${
            sectionTab === "sequences"
              ? "text-amber-700 dark:text-[#F0C775]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Film className="h-3.5 w-3.5" />
          <span>
            {copy.historyTabSequences} ({savedSequences.length})
          </span>
          {sectionTab === "sequences" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-600 dark:bg-[#D4A34B]" />
          )}
        </button>
      </div>

      {/* Quick Engine Filter Bar */}
      {(quickEngineList.length > 0 || isFiltered) && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-2"
          role="region"
          aria-label={copy.filterEngineLabel}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedEngine("all")}
              className={`min-h-[32px] rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors tabular-nums ${
                activeEngineFilter === "all"
                  ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-[#D4A34B] dark:bg-[#1E1A11] dark:text-[#F0C775]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {copy.filterAllEngines} (
              {filterMode === "favorites" ? activeFavCount : activeTotal})
            </button>

            {quickEngineList.map((engId) => {
              const count = engineCounts[engId] ?? 0;
              const isSelected = activeEngineFilter === engId;
              return (
                <button
                  key={engId}
                  type="button"
                  onClick={() =>
                    setSelectedEngine(isSelected ? "all" : engId)
                  }
                  className={`min-h-[32px] rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors tabular-nums ${
                    isSelected
                      ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-[#D4A34B] dark:bg-[#1E1A11] dark:text-[#F0C775]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {ENGINES[engId].name} ({count})
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-amber-600 hover:text-slate-900 dark:border-[#252A38] dark:bg-[#191D29] dark:text-slate-300 dark:hover:border-[#D4A34B]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{copy.clearFiltersBtn}</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: ALL PROMPTS */}
      {sectionTab === "all" ? (
        filteredPrompts.length === 0 ? (
          history.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-[#222634] dark:bg-[#13161F]">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {copy.noSearchResultsTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {copy.noSearchResultsDesc}
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200 dark:hover:border-[#D4A34B]"
              >
                {copy.clearFiltersBtn}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-[#222634] dark:bg-[#13161F]">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {copy.emptyHistoryTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {copy.emptyHistoryDesc}
              </p>
              <button
                type="button"
                onClick={onGoStudio}
                className="mt-5 rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
              >
                {copy.goToStudio}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100"
                      dir="auto"
                    >
                      {renderHighlightedTitle(entry.title, query)}
                    </h2>
                    <p className="mt-1 break-words font-mono-code text-xs text-slate-500 dark:text-slate-400">
                      {entry.source === "generator_v1"
                        ? "Generator 10+20"
                        : entry.source === "director_v2"
                        ? "Director v2.0"
                        : ENGINES[entry.engine]?.name || entry.engine}
                      {entry.engine === "wan22" &&
                      entry.wanVariant &&
                      !entry.source
                        ? ` (${
                            entry.wanVariant === "ti2v_5b" ? "TI2V-5B" : "A14B"
                          })`
                        : ""}{" "}
                      · {entry.mode.toUpperCase()} · {entry.category} ·{" "}
                      {entry.time}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(entry.id)}
                      aria-label={copy.filterFavorites}
                      className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border px-2 transition-colors ${
                        entry.isFavorite
                          ? "border-amber-500/70 bg-amber-50 text-amber-600 dark:border-[#D4A34B]/70 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                          : "border-slate-200 bg-slate-50 text-slate-400 hover:text-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:hover:text-[#F0C775]"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          entry.isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRestore(entry)}
                      className="min-h-[36px] rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                    >
                      {copy.btnRestore}
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplyEntryProps(entry)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-50/60 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:border-amber-600 dark:border-[#D4A34B]/40 dark:bg-[#1B1810] dark:text-[#F0C775]"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>{copy.historyApplyProps}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCopyPrompt(entry.prompt)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copy.btnCopyFull}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportEntryJson(entry)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                    >
                      <FileJson className="h-3 w-3" />
                      <span>JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      aria-label="Delete entry"
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-400 hover:text-red-500 dark:border-[#262B3A]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {renderEntrySpecs(entry)}

                <pre
                  dir="auto"
                  className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono-code text-xs leading-relaxed text-slate-700 dark:border-[#252A38] dark:bg-[#080A0F] dark:text-slate-300"
                >
                  {entry.prompt}
                </pre>
              </article>
            ))}
          </div>
        )
      ) : /* TAB 2: SAVED SEQUENCES */
      filteredSequences.length === 0 ? (
        savedSequences.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-[#222634] dark:bg-[#13161F]">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {copy.noSearchResultsTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {copy.noSearchResultsDesc}
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
            >
              {copy.clearFiltersBtn}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-[#222634] dark:bg-[#13161F]">
            <Film className="mx-auto h-9 w-9 text-amber-600/80 dark:text-[#D4A34B]/80" />
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              {copy.genSavedSequencesTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {copy.genSavedSequencesEmpty}
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredSequences.map((seq) => {
            const expanded = Boolean(expandedSeqIds[seq.id]);
            const firstScene = seq.scenes[0];
            const dateStr = new Date(seq.createdAt).toLocaleString();
            return (
              <article
                key={seq.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100"
                      dir="auto"
                    >
                      {renderHighlightedTitle(seq.title, query)}
                    </h2>
                    <p className="mt-1 font-mono-code text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {seq.model.toUpperCase()} · {seq.scenes.length}{" "}
                      {copy.propScenes} · {seq.shotLen}s · {seq.style} ·{" "}
                      {seq.lang.toUpperCase()} · {dateStr}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteSequence(seq.id)}
                      aria-label={copy.filterFavorites}
                      className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border px-2 transition-colors ${
                        seq.isFavorite
                          ? "border-amber-500/70 bg-amber-50 text-amber-600 dark:border-[#D4A34B]/70 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                          : "border-slate-200 bg-slate-50 text-slate-400 hover:text-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:hover:text-[#F0C775]"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          seq.isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadSequence(seq)}
                      className="min-h-[36px] rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                    >
                      {copy.genLoadSequence}
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplySequenceProps(seq)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-50/60 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:border-amber-600 dark:border-[#D4A34B]/40 dark:bg-[#1B1810] dark:text-[#F0C775]"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>{copy.historyApplyProps}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCopyPrompt(seq.formattedOutput)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copy.genCopyAll}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportSequenceJson(seq)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                    >
                      <FileJson className="h-3 w-3" />
                      <span>JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSequence(seq.id)}
                      aria-label="Delete sequence"
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-400 hover:text-red-500 dark:border-[#262B3A]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spec Strip */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 dark:border-[#1E2230] dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {copy.historyPromptPropsTitle}:
                  </span>
                  <span>
                    {copy.propModel}:{" "}
                    <strong className="font-mono-code text-slate-800 dark:text-slate-200">
                      {seq.model.toUpperCase()}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.propScenes}:{" "}
                    <strong className="font-mono-code tabular-nums text-slate-800 dark:text-slate-200">
                      {seq.scenes.length}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.propDuration}:{" "}
                    <strong className="font-mono-code tabular-nums text-slate-800 dark:text-slate-200">
                      {seq.shotLen}s × {seq.scenes.length} (~
                      {seq.shotLen * seq.scenes.length}s)
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.propStyle}:{" "}
                    <strong className="font-mono-code text-slate-800 dark:text-slate-200">
                      {seq.style}
                    </strong>
                  </span>
                </div>

                {/* First Scene Preview + Toggle Full Output */}
                {firstScene && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#252A38] dark:bg-[#080A0F]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-[#F0C775]">
                        {copy.historyFirstScenePreview}
                        {firstScene.narrativeBeat
                          ? ` — ${firstScene.narrativeBeat}`
                          : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSeqIds((prev) => ({
                            ...prev,
                            [seq.id]: !prev[seq.id],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline dark:text-[#F0C775]"
                      >
                        <span>
                          {expanded
                            ? copy.historyHideFullOutput
                            : copy.historyShowFullOutput}
                        </span>
                        {expanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <pre
                      dir={seq.lang === "ar" ? "rtl" : "ltr"}
                      className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-mono-code text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                    >
                      {expanded ? seq.formattedOutput : firstScene.prompt}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
