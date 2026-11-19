import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  Check,
  Clapperboard,
  Copy,
  Download,
  Film,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import { VIDEO_GENERATOR_STYLES } from "../data/engines";
import { I18N } from "../data/i18n";
import {
  HistoryEntry,
  Language,
  SavedSequenceEntry,
  VideoGeneratorLang,
  VideoGeneratorMode,
  VideoGeneratorModel,
  VideoGeneratorRequest,
  VideoGeneratorResult,
} from "../types/prompt";
import { safeFetchJson } from "../utils/safeFetchJson";

export interface VideoGeneratorAppliedProps {
  model?: VideoGeneratorModel;
  mode?: VideoGeneratorMode;
  scenes?: number;
  shotLen?: number;
  style?: string;
  lang?: VideoGeneratorLang;
  nonce: number;
}

interface VideoPromptGeneratorViewProps {
  lang: Language;
  activeResult?: VideoGeneratorResult | null;
  activeIdea?: string;
  appliedProps?: VideoGeneratorAppliedProps | null;
  onResultChange?: (result: VideoGeneratorResult | null, idea: string) => void;
  savedPrompts?: HistoryEntry[];
  onLoadSavedPrompt?: (entry: HistoryEntry) => void;
  onToggleFavoritePrompt?: (id: string) => void;
  onDeleteSavedPrompt?: (id: string) => void;
  savedSequences: SavedSequenceEntry[];
  onSaveSequence: (result: VideoGeneratorResult, idea: string) => boolean;
  onLoadSequence: (seq: SavedSequenceEntry) => void;
  onDeleteSequence: (id: string) => void;
  onSaveToHistory: (
    result: VideoGeneratorResult,
    idea: string,
    options?: { silent?: boolean }
  ) => void;
  onSendToStudio: (result: VideoGeneratorResult, idea: string) => void;
  onNotify: (msg: string) => void;
}

const SCENE_PRESETS = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30];

const MODEL_CARDS: {
  id: VideoGeneratorModel;
  title: string;
  subtitle: Record<Language, string>;
  spec: string;
}[] = [
  {
    id: "wan",
    title: "WAN 2.2",
    subtitle: {
      ar: "لقطة سينمائية متصلة بتفاصيل عدسة وإضاءة دقيقة",
      fr: "Plan cinématique continu avec lentille et éclairage précis",
      en: "Continuous cinematic shot with precise lens & lighting detail",
    },
    spec: "Wan 2.2 · A14B / TI2V-5B",
  },
  {
    id: "minimax",
    title: "MiniMax Hailuo 02",
    subtitle: {
      ar: "أوامر كاميرا داخل أقواس [Truck left] وفيزياء سلسة",
      fr: "Commandes caméra entre crochets et physique fluide",
      en: "Bracketed camera directives & fluid physical inertia",
    },
    spec: "6–15s · Bracket Camera",
  },
  {
    id: "google",
    title: "Google Veo 3.1",
    subtitle: {
      ar: "إخراج بصري متكامل مع فولي وأصوات محيطة متزامنة",
      fr: "Visuel cinématique avec Foley et ambiance synchronisés",
      en: "Cinematic visuals with synchronized ambient & Foley audio",
    },
    spec: "Veo 3.1 · Native Audio",
  },
];

async function copyTextSafe(text: string): Promise<void> {
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
}

export const VideoPromptGeneratorView: React.FC<VideoPromptGeneratorViewProps> = ({
  lang,
  activeResult,
  activeIdea,
  appliedProps,
  onResultChange,
  savedPrompts = [],
  onLoadSavedPrompt,
  onToggleFavoritePrompt,
  onDeleteSavedPrompt,
  savedSequences,
  onSaveSequence,
  onLoadSequence,
  onDeleteSequence,
  onSaveToHistory,
  onSendToStudio,
  onNotify,
}) => {
  const copy = I18N[lang];
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const [idea, setIdea] = useState(activeIdea || "");
  const [model, setModel] = useState<VideoGeneratorModel>("wan");
  const [mode, setMode] = useState<VideoGeneratorMode>("film_10");
  const [scenes, setScenes] = useState<number>(10);
  const [shotLen, setShotLen] = useState<number>(6);
  const [styleSelect, setStyleSelect] = useState<string>(
    VIDEO_GENERATOR_STYLES[0].id
  );
  const [customStyle, setCustomStyle] = useState<string>("");
  const [outputLang, setOutputLang] = useState<VideoGeneratorLang>(
    lang === "ar" ? "ar" : "en"
  );
  const [allowMinimaxMerge, setAllowMinimaxMerge] = useState<boolean>(false);

  const [result, setResult] = useState<VideoGeneratorResult | null>(
    activeResult || null
  );
  const [loading, setLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSeqFlag, setSavedSeqFlag] = useState(false);
  const [savedPromptFlag, setSavedPromptFlag] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"sequences" | "prompts">(
    "sequences"
  );

  const lastAppliedNonceRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeResult) {
      setResult(activeResult);
      setModel(activeResult.model);
      setMode(activeResult.mode);
      if (activeResult.scenes.length > 0) {
        setScenes(activeResult.scenes.length);
      }
      setShotLen(activeResult.shotLen || 6);
      setOutputLang(activeResult.lang || "en");
      const matchedStyle = VIDEO_GENERATOR_STYLES.find(
        (s) => s.id === activeResult.style
      );
      if (matchedStyle) {
        setStyleSelect(matchedStyle.id);
        setCustomStyle("");
      } else if (activeResult.style) {
        setCustomStyle(activeResult.style);
      }
    }
  }, [activeResult]);

  useEffect(() => {
    if (typeof activeIdea === "string" && activeIdea.trim().length > 0) {
      setIdea(activeIdea);
    }
  }, [activeIdea]);

  useEffect(() => {
    if (!appliedProps || appliedProps.nonce === lastAppliedNonceRef.current) {
      return;
    }
    lastAppliedNonceRef.current = appliedProps.nonce;
    if (appliedProps.model) setModel(appliedProps.model);
    if (appliedProps.mode) setMode(appliedProps.mode);
    if (appliedProps.scenes) setScenes(appliedProps.scenes);
    if (appliedProps.shotLen) setShotLen(appliedProps.shotLen);
    if (appliedProps.lang) setOutputLang(appliedProps.lang);
    if (appliedProps.style) {
      const matched = VIDEO_GENERATOR_STYLES.find(
        (s) => s.id === appliedProps.style
      );
      if (matched) {
        setStyleSelect(matched.id);
        setCustomStyle("");
      } else {
        setCustomStyle(appliedProps.style);
      }
    }
  }, [appliedProps]);

  // Keep shotLen within MiniMax bounds when switching model
  useEffect(() => {
    if (model === "minimax" && shotLen > 15) {
      setShotLen(10);
    }
  }, [model, shotLen]);

  const effectiveStyle = customStyle.trim() || styleSelect;
  const maxShotLen = model === "minimax" ? 15 : 20;
  const isFilmMode = mode === "film" || mode === "film_10";
  const effectiveScenes = mode === "film_10" ? 10 : mode === "film" ? scenes : 1;

  const canExpandIncremental = useMemo(() => {
    if (!result || result.scenes.length === 0) return false;
    if (result.mode === "normal") return false;
    return result.scenes.length < 30;
  }, [result]);

  const nextExpandTarget = useMemo(() => {
    if (!result || result.scenes.length === 0) return 30;
    return Math.min(30, result.scenes.length + 20);
  }, [result]);

  const estimatedTotalDuration = useMemo(() => {
    const count = result?.scenes?.length || effectiveScenes;
    return count * shotLen;
  }, [result, effectiveScenes, shotLen]);

  const triggerCopied = (key: string, label?: string) => {
    setCopiedKey(key);
    onNotify(label || copy.genCopied);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const runGeneration = async (opts?: {
    forceMode?: VideoGeneratorMode;
    forceScenes?: number;
    expandFromExisting?: boolean;
  }) => {
    const cleanIdea = idea.trim();
    if (!cleanIdea) {
      setErrorMsg(
        isAr
          ? "يرجى إدخال فكرة المشهد أو القصة أولاً."
          : isFr
          ? "Veuillez d'abord saisir l'idée de la scène ou du film."
          : "Please enter a scene or story idea first."
      );
      return;
    }

    const reqMode = opts?.forceMode ?? mode;
    const reqScenes =
      opts?.forceScenes ??
      (reqMode === "film_10" ? 10 : reqMode === "film" ? scenes : 1);

    const isContinuation =
      Boolean(opts?.expandFromExisting) ||
      (result !== null &&
        result.scenes.length > 0 &&
        reqMode !== "normal" &&
        reqScenes > result.scenes.length &&
        result.model === model &&
        (activeIdea || cleanIdea).trim().toLowerCase() ===
          cleanIdea.toLowerCase());

    setErrorMsg(null);
    setLoading(true);
    setExpanding(Boolean(opts?.expandFromExisting));
    setSavedSeqFlag(false);
    setSavedPromptFlag(false);

    try {
      const payload: VideoGeneratorRequest & {
        previousScenes?: VideoGeneratorResult["scenes"];
        previousConsistencyNotes?: VideoGeneratorResult["consistencyNotes"];
      } = {
        idea: cleanIdea,
        model,
        mode: reqMode,
        scenes: reqScenes,
        shotLen,
        style: effectiveStyle,
        lang: outputLang,
        allowMinimaxMerge: model === "minimax" ? allowMinimaxMerge : false,
      };

      if (isContinuation && result && result.scenes.length > 0) {
        payload.previousScenes = result.scenes;
        payload.previousConsistencyNotes = result.consistencyNotes;
      }

      const data = await safeFetchJson<VideoGeneratorResult>(
        "/api/ai/video-generator",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        lang
      );

      setResult(data);
      if (opts?.forceMode) setMode(opts.forceMode);
      if (opts?.forceScenes) setScenes(opts.forceScenes);
      onResultChange?.(data, cleanIdea);
      onSaveToHistory(data, cleanIdea, { silent: true });

      onNotify(
        isContinuation
          ? isAr
            ? `تمت إضافة المشاهد الجديدة بنجاح — الإجمالي الآن ${data.scenes.length} مشهداً.`
            : isFr
            ? `Nouvelles scènes ajoutées — total ${data.scenes.length} scènes.`
            : `Expanded sequence successfully — now ${data.scenes.length} scenes total.`
          : isAr
          ? data.scenes.length > 0
            ? `تم توليد تسلسل من ${data.scenes.length} مشهداً سينمائياً.`
            : "تم توليد برومبت الفيديو بنجاح."
          : isFr
          ? data.scenes.length > 0
            ? `Séquence de ${data.scenes.length} scènes générée.`
            : "Prompt vidéo généré avec succès."
          : data.scenes.length > 0
          ? `Generated a ${data.scenes.length}-scene cinematic sequence.`
          : "Video prompt generated successfully."
      );

      window.setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ أثناء توليد البرومبت."
          : "Failed to generate video prompt.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setExpanding(false);
    }
  };

  const handleApplySample = (sample: "wan-normal" | "minimax-film") => {
    setErrorMsg(null);
    if (sample === "wan-normal") {
      setModel("wan");
      setMode("normal");
      setScenes(1);
      setShotLen(6);
      setStyleSelect("photorealistic");
      setCustomStyle("");
      setIdea(
        isAr
          ? "صانع ساعات مسن يفحص ساعة جيب ميكانيكية ذهبية داخل ورشة خشبية دافئة مضاءة بمصباح مكتب، والغبار يسبح في أشعة الضوء"
          : "An elderly watchmaker inspecting a golden mechanical pocket watch inside a warm wooden workshop illuminated by a single desk lamp with dust motes drifting in the beam"
      );
    } else {
      setModel("minimax");
      setMode("film_10");
      setScenes(10);
      setShotLen(6);
      setStyleSelect("cinematic_film");
      setCustomStyle("");
      setIdea(
        isAr
          ? "مهندس آثار شاب يكتشف خريطة مضيئة تقوده عبر كثبان صحراوية ليلية نحو بوابة مدينة مفقودة تحت الرمال"
          : "A young archaeological engineer uncovers a glowing map that guides him across moonlit desert dunes toward the buried gate of a lost ancient city"
      );
    }
  };

  const handleSaveCurrentSequence = () => {
    if (!result) return;
    const ok = onSaveSequence(result, idea.trim() || activeIdea || "Untitled");
    if (ok) {
      setSavedSeqFlag(true);
      onNotify(copy.genSequenceSaved);
      window.setTimeout(() => setSavedSeqFlag(false), 2200);
    }
  };

  const handleSaveCurrentPrompt = () => {
    if (!result) return;
    onSaveToHistory(result, idea.trim() || activeIdea || "Untitled");
    setSavedPromptFlag(true);
    onNotify(copy.genPromptSaved);
    window.setTimeout(() => setSavedPromptFlag(false), 2200);
  };

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            idea: idea.trim() || activeIdea || "",
            exportedAt: new Date().toISOString(),
            ...result,
          },
          null,
          2
        ),
      ],
      { type: "application/json;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts-sequence-${result.model}-${
      result.scenes.length || 1
    }scenes.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(copy.okExportedJson);
  };

  const handleReset = () => {
    setIdea("");
    setResult(null);
    setErrorMsg(null);
    setCustomStyle("");
    onResultChange?.(null, "");
  };

  const generatorSavedPrompts = useMemo(
    () => savedPrompts.filter((h) => h.source === "generator_v1"),
    [savedPrompts]
  );

  return (
    <div className="mx-auto max-w-[1440px] px-3.5 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-[#222634]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-amber-700 dark:text-[#F0C775]">
            <Film className="h-4 w-4 shrink-0" />
            <span>VideoPrompts Engine</span>
            <span aria-hidden="true">·</span>
            <span>10 + 20 Scenes</span>
            <span aria-hidden="true">·</span>
            <span>WAN 2.2 · MiniMax · Veo 3.1</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {copy.genTitle}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {copy.genSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplySample("wan-normal")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
          >
            <Wand2 className="h-3.5 w-3.5 shrink-0" />
            <span>{copy.genSampleNormal}</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplySample("minimax-film")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
          >
            <Clapperboard className="h-3.5 w-3.5 shrink-0" />
            <span>{copy.genSampleFilm}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-400 dark:hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span>{copy.btnReset}</span>
          </button>
        </div>
      </div>

      {/* Main 2-column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Controls Panel */}
        <section className="space-y-5 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            {/* IDEA */}
            <div>
              <label
                htmlFor="gen-idea-input"
                className="mb-2 block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {copy.genIdeaLabel}
              </label>
              <textarea
                id="gen-idea-input"
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={copy.genIdeaPlaceholder}
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:focus:border-[#D4A34B]"
              />
            </div>

            {/* MODEL */}
            <div className="mt-5">
              <span className="mb-2 block text-xs font-semibold text-slate-800 dark:text-slate-200">
                {copy.genModelLabel}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {MODEL_CARDS.map((card) => {
                  const active = model === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setModel(card.id)}
                      className={`rounded-lg border p-3 text-start transition-colors ${
                        active
                          ? "border-amber-600 bg-amber-50/70 dark:border-[#D4A34B] dark:bg-[#1C1912]"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          dir="ltr"
                          className={`text-xs font-bold ${
                            active
                              ? "text-amber-900 dark:text-[#F0C775]"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {card.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        {card.subtitle[lang]}
                      </p>
                      <p
                        dir="ltr"
                        className="mt-1.5 font-mono-code text-[10px] text-slate-400 dark:text-slate-500"
                      >
                        {card.spec}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODE */}
            <div className="mt-5">
              <span className="mb-2 block text-xs font-semibold text-slate-800 dark:text-slate-200">
                {copy.genModeLabel}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: "normal" as const, label: copy.genModeNormal },
                    { id: "film_10" as const, label: copy.genModeFilm10 },
                    { id: "film" as const, label: copy.genModeFilm },
                  ] as const
                ).map((item) => {
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMode(item.id);
                        if (item.id === "film_10") setScenes(10);
                        else if (item.id === "film" && scenes < 2) setScenes(10);
                      }}
                      className={`min-h-[40px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? "border-amber-600 bg-amber-700 text-white dark:border-[#D4A34B] dark:bg-[#D4A34B] dark:text-[#110D05]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {isFilmMode && (
                <p className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-50/50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900 dark:border-[#D4A34B]/30 dark:bg-[#191610] dark:text-[#E5C98B]">
                  {isAr
                    ? "نظام 10 + 20 مشهد: ابدأ بـ 10 مشاهد أساسية متماسكة، ثم وسّع القصة تلقائياً حتى 30 مشهداً دون إعادة كتابة المشاهد الأولى مع الحفاظ على ثبات الشخصيات والألوان والعدسة."
                    : isFr
                    ? "Système 10 + 20 scènes : démarrez avec 10 scènes cohérentes puis étendez jusqu'à 30 scènes sans réécrire les 10 premières."
                    : "10 + 20 Film System: Start with 10 cohesive core scenes, then expand incrementally up to 30 scenes without rewriting scenes 1–10 while preserving character, palette, and lens lock."}
                </p>
              )}
            </div>

            {/* SCENES + SHOT_LEN */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {mode === "film" && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label
                      htmlFor="gen-scenes-select"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {copy.genScenesLabel}
                    </label>
                    <span className="font-mono-code font-bold tabular-nums text-amber-700 dark:text-[#F0C775]">
                      {scenes} / 30
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      id="gen-scenes-select"
                      value={SCENE_PRESETS.includes(scenes) ? scenes : ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (Number.isFinite(val) && val >= 2) setScenes(val);
                      }}
                      className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono-code text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                    >
                      {!SCENE_PRESETS.includes(scenes) && (
                        <option value="">{scenes}</option>
                      )}
                      {SCENE_PRESETS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      step={1}
                      value={scenes}
                      onChange={(e) => setScenes(Number(e.target.value))}
                      className="h-2 flex-1 accent-amber-600 dark:accent-[#D4A34B]"
                    />
                  </div>
                </div>
              )}

              <div className={mode !== "film" ? "sm:col-span-2" : ""}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label
                    htmlFor="gen-shotlen-range"
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {copy.genShotLenLabel}
                  </label>
                  <span className="font-mono-code font-bold tabular-nums text-amber-700 dark:text-[#F0C775]">
                    {shotLen}s
                    {isFilmMode ? ` · ~${estimatedTotalDuration}s` : ""}
                  </span>
                </div>
                <input
                  id="gen-shotlen-range"
                  type="range"
                  min={3}
                  max={maxShotLen}
                  step={1}
                  value={shotLen}
                  onChange={(e) => setShotLen(Number(e.target.value))}
                  className="h-2 w-full accent-amber-600 dark:accent-[#D4A34B]"
                />
              </div>
            </div>

            {/* STYLE + OUTPUT LANG */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="gen-style-select"
                  className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {copy.genStyleLabel}
                </label>
                <select
                  id="gen-style-select"
                  value={styleSelect}
                  onChange={(e) => {
                    setStyleSelect(e.target.value);
                    setCustomStyle("");
                  }}
                  className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  {VIDEO_GENERATOR_STYLES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st[lang]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder={
                    isAr
                      ? "أو اكتب أسلوباً مخصصاً (اختياري)..."
                      : isFr
                      ? "Ou style personnalisé (optionnel)..."
                      : "Or type custom style override (optional)..."
                  }
                  className="mt-2 min-h-[36px] w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {copy.genLangLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "en" as const, label: "English" },
                      { id: "ar" as const, label: "العربية" },
                    ] as const
                  ).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setOutputLang(l.id)}
                      className={`min-h-[40px] rounded-lg border text-xs font-semibold transition-colors ${
                        outputLang === l.id
                          ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1C1912] dark:text-[#F0C775]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-400"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {model === "minimax" && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-[11.5px] leading-snug text-slate-700 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowMinimaxMerge}
                      onChange={(e) => setAllowMinimaxMerge(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 accent-amber-600 dark:accent-[#D4A34B]"
                    />
                    <span>{copy.genMinimaxMergeLabel}</span>
                  </label>
                )}
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 break-words">{errorMsg}</span>
              </div>
            )}

            {/* Primary Generate CTA */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => void runGeneration()}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-800 disabled:opacity-60 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
              >
                {loading && !expanding ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {loading && !expanding ? copy.genGenerating : copy.genGenerateBtn}
                </span>
              </button>

              {canExpandIncremental && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void runGeneration({
                      forceMode: "film",
                      forceScenes: nextExpandTarget,
                      expandFromExisting: true,
                    })
                  }
                  className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-amber-600/70 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-[#D4A34B]/70 dark:bg-[#1E1A12] dark:text-[#F0C775] dark:hover:bg-[#2A2418]"
                >
                  {expanding ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {isAr
                      ? `توسيع +${nextExpandTarget - (result?.scenes.length || 0)} مشهد (حتى ${nextExpandTarget})`
                      : isFr
                      ? `Étendre +${nextExpandTarget - (result?.scenes.length || 0)} scènes (${nextExpandTarget})`
                      : `Expand +${nextExpandTarget - (result?.scenes.length || 0)} Scenes (to ${nextExpandTarget})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Right: Output & Scenes Panel */}
        <section ref={outputRef} className="space-y-5 lg:col-span-7">
          {!result ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-[#2A3042] dark:bg-[#13161F]/60">
              <Film className="h-10 w-10 text-amber-600/80 dark:text-[#D4A34B]/80" />
              <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
                {copy.genEmptyTitle}
              </h2>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {copy.genEmptyDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
              {/* Output Header & Metadata */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-[#222634]">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {copy.genOutputTitle}
                  </h2>
                  <p className="mt-1 font-mono-code text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {result.model.toUpperCase()} ·{" "}
                    {result.mode === "normal"
                      ? copy.genModeNormal
                      : `${result.scenes.length} ${copy.propScenes}`}{" "}
                    · {result.shotLen}s · {result.style} ·{" "}
                    {result.lang.toUpperCase()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await copyTextSafe(result.formattedOutput);
                      triggerCopied("all");
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                  >
                    {copiedKey === "all" ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>
                      {copiedKey === "all" ? copy.genCopied : copy.genCopyAll}
                    </span>
                  </button>

                  {result.scenes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveCurrentSequence}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        savedSeqFlag
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                      }`}
                    >
                      {savedSeqFlag ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>
                        {savedSeqFlag
                          ? copy.genSequenceSaved
                          : copy.genSaveSequence}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveCurrentPrompt}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      savedPromptFlag
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                    }`}
                  >
                    {savedPromptFlag ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>
                      {savedPromptFlag
                        ? copy.genPromptSaved
                        : copy.genSavePrompt}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onSendToStudio(result, idea.trim() || activeIdea || "")
                    }
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-50/70 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:border-amber-600 dark:border-[#D4A34B]/50 dark:bg-[#1D1912] dark:text-[#F0C775]"
                  >
                    <Wand2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{copy.genOpenInStudio}</span>
                  </button>
                </div>
              </div>

              {/* Consistency Notes */}
              {result.consistencyNotes && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-50/40 p-3.5 dark:border-[#D4A34B]/30 dark:bg-[#18150F]">
                  <h3 className="text-xs font-bold text-amber-900 dark:text-[#F0C775]">
                    {copy.genConsistencyTitle}
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-3 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {copy.chainCharacterLbl}:
                      </span>{" "}
                      <span>{result.consistencyNotes.character}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Palette:
                      </span>{" "}
                      <span>{result.consistencyNotes.palette}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Lens:
                      </span>{" "}
                      <span>{result.consistencyNotes.lens}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Per-Scene Quick Copy Cards */}
              {result.scenes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {copy.propScenes}: {result.scenes.length}
                    </span>
                    {canExpandIncremental && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          void runGeneration({
                            forceMode: "film",
                            forceScenes: nextExpandTarget,
                            expandFromExisting: true,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline-offset-4 hover:underline disabled:opacity-50 dark:text-[#F0C775]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>
                          {isAr
                            ? `إضافة ${nextExpandTarget - result.scenes.length} مشاهد تالية (حتى ${nextExpandTarget})`
                            : isFr
                            ? `Ajouter les ${nextExpandTarget - result.scenes.length} scènes suivantes`
                            : `Add next ${nextExpandTarget - result.scenes.length} scenes (up to ${nextExpandTarget})`}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-[460px] space-y-2.5 overflow-y-auto pe-1">
                    {result.scenes.map((scene) => {
                      const sceneKey = `scene-${scene.sceneNumber}`;
                      return (
                        <div
                          key={sceneKey}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-[#262B3A] dark:bg-[#0B0D12]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono-code font-bold tabular-nums text-amber-800 dark:text-[#F0C775]">
                                SCENE {scene.sceneNumber}/{result.scenes.length}
                              </span>
                              {scene.narrativeBeat && (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="text-slate-400"
                                  >
                                    ·
                                  </span>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {scene.narrativeBeat}
                                  </span>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await copyTextSafe(scene.prompt);
                                triggerCopied(sceneKey);
                              }}
                              className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B]"
                            >
                              {copiedKey === sceneKey ? (
                                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>
                                {copiedKey === sceneKey
                                  ? copy.genCopied
                                  : copy.genCopyScene}
                              </span>
                            </button>
                          </div>

                          <p
                            dir={result.lang === "ar" ? "rtl" : "ltr"}
                            className="mt-2 whitespace-pre-wrap break-words font-mono-code text-xs leading-relaxed text-slate-800 dark:text-slate-200"
                          >
                            {scene.prompt}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Canonical Raw Output */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Raw Canonical Output
                  </span>
                  <span className="font-mono-code text-[11px] tabular-nums text-slate-400">
                    {result.formattedOutput.length.toLocaleString()} chars
                  </span>
                </div>
                <pre
                  dir={result.lang === "ar" ? "rtl" : "ltr"}
                  className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-mono-code text-xs leading-relaxed text-slate-800 dark:border-[#252A38] dark:bg-[#080A0F] dark:text-slate-200"
                >
                  {result.formattedOutput}
                </pre>
              </div>
            </div>
          )}

          {/* Inline Saved Sequences & Prompts Library */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-[#222634]">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setLibraryTab("sequences")}
                  className={`relative pb-1 text-xs font-bold transition-colors ${
                    libraryTab === "sequences"
                      ? "text-amber-700 dark:text-[#F0C775]"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {copy.genSavedSequencesTitle} ({savedSequences.length})
                  {libraryTab === "sequences" && (
                    <span className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-amber-600 dark:bg-[#D4A34B]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryTab("prompts")}
                  className={`relative pb-1 text-xs font-bold transition-colors ${
                    libraryTab === "prompts"
                      ? "text-amber-700 dark:text-[#F0C775]"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {copy.genSavedPromptsTitle} ({generatorSavedPrompts.length})
                  {libraryTab === "prompts" && (
                    <span className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-amber-600 dark:bg-[#D4A34B]" />
                  )}
                </button>
              </div>
            </div>

            {libraryTab === "sequences" ? (
              savedSequences.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {copy.genSavedSequencesEmpty}
                </p>
              ) : (
                <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pe-1">
                  {savedSequences.map((seq) => (
                    <div
                      key={seq.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-[#262B3A] dark:bg-[#0B0D12]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {seq.title}
                        </p>
                        <p className="mt-0.5 font-mono-code text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                          {seq.model.toUpperCase()} · {seq.scenes.length}{" "}
                          {copy.propScenes} · {seq.shotLen}s · {seq.style}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onLoadSequence(seq)}
                          className="rounded-md bg-amber-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05]"
                        >
                          {copy.genLoadSequence}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSequence(seq.id)}
                          aria-label="Delete sequence"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 dark:border-[#262B3A]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : generatorSavedPrompts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {copy.genSavedPromptsEmpty}
              </p>
            ) : (
              <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pe-1">
                {generatorSavedPrompts.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-[#262B3A] dark:bg-[#0B0D12]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {entry.title}
                      </p>
                      <p className="mt-0.5 font-mono-code text-[11px] text-slate-500 dark:text-slate-400">
                        {entry.engine.toUpperCase()} · {entry.mode.toUpperCase()}{" "}
                        · {entry.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onToggleFavoritePrompt && (
                        <button
                          type="button"
                          onClick={() => onToggleFavoritePrompt(entry.id)}
                          aria-label="Favorite prompt"
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                            entry.isFavorite
                              ? "border-amber-500 text-amber-600 dark:border-[#D4A34B] dark:text-[#F0C775]"
                              : "border-slate-200 text-slate-400 dark:border-[#262B3A]"
                          }`}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              entry.isFavorite ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      )}
                      {onLoadSavedPrompt && (
                        <button
                          type="button"
                          onClick={() => onLoadSavedPrompt(entry)}
                          className="rounded-md bg-amber-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05]"
                        >
                          {copy.genLoadPrompt}
                        </button>
                      )}
                      {onDeleteSavedPrompt && (
                        <button
                          type="button"
                          onClick={() => onDeleteSavedPrompt(entry.id)}
                          aria-label="Delete prompt"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 dark:border-[#262B3A]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
