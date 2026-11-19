import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  Download,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Language } from "../types/prompt";
import {
  ArabiCinematicDirector,
  DEFAULT_DIRECTOR_NEGATIVES,
  DEFAULT_TIMELINE_BEATS,
  DirectorCameraMovementId,
  DirectorEngineId,
  DirectorEnhanceOptions,
  DirectorGenreId,
  DirectorGradingId,
  DirectorLanguageId,
  DirectorMoodId,
  DirectorOutputFormat,
  DirectorShotTypeId,
  TimelineBeat,
} from "../utils/arabiCinematicDirector";
import { SmartSceneGuard } from "../utils/smartSceneGuard";

export interface DirectorAppliedProps {
  options: Partial<DirectorEnhanceOptions>;
  nonce: number;
}

interface DirectorEngineViewProps {
  lang: Language;
  activeSnapshot?: {
    options: DirectorEnhanceOptions;
    output: string;
  } | null;
  appliedProps?: DirectorAppliedProps | null;
  onSaveToHistory: (options: DirectorEnhanceOptions, output: string) => void;
  onNotify: (msg: string) => void;
}

const DEFAULT_PROMPT_AR =
  "فارس مدرع يسير ببطء وسط ضباب كثيف على قمة جبل بركاني أثناء الغسق بينما تتطاير شرارات الجمر في الهواء";
const DEFAULT_PROMPT_EN =
  "A lone armored knight walking slowly through thick volcanic mist on a mountain ridge at dusk as glowing embers drift through the wind";

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

export const DirectorEngineView: React.FC<DirectorEngineViewProps> = ({
  lang,
  activeSnapshot,
  appliedProps,
  onSaveToHistory,
  onNotify,
}) => {
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const [prompt, setPrompt] = useState<string>(
    activeSnapshot?.options.prompt || (isAr ? DEFAULT_PROMPT_AR : DEFAULT_PROMPT_EN)
  );
  const [engine, setEngine] = useState<DirectorEngineId>(
    (activeSnapshot?.options.engine as DirectorEngineId) || "veo"
  );
  const [language, setLanguage] = useState<DirectorLanguageId>(
    activeSnapshot?.options.language || "en"
  );
  const [format, setFormat] = useState<DirectorOutputFormat>(
    activeSnapshot?.options.format || "markdown"
  );
  const [duration, setDuration] = useState<number>(
    activeSnapshot?.options.duration || 15
  );
  const [fps, setFps] = useState<number>(activeSnapshot?.options.fps || 24);
  const [aspectRatio, setAspectRatio] = useState<string>(
    activeSnapshot?.options.aspectRatio || "16:9"
  );

  const [genre, setGenre] = useState<DirectorGenreId | "">(
    activeSnapshot?.options.genre || "cinematic"
  );
  const [shotType, setShotType] = useState<DirectorShotTypeId | "">(
    activeSnapshot?.options.shotType || "tracking"
  );
  const [mood, setMood] = useState<DirectorMoodId | "">(
    activeSnapshot?.options.mood || "epic"
  );
  const [grading, setGrading] = useState<DirectorGradingId | "">(
    activeSnapshot?.options.grading || "teal_orange"
  );
  const [cameraMovements, setCameraMovements] = useState<
    DirectorCameraMovementId[]
  >(activeSnapshot?.options.cameraMovements || ["push_in", "tracking_forward"]);

  const [lens, setLens] = useState<string>(activeSnapshot?.options.lens || "");
  const [lightingStyle, setLightingStyle] = useState<string>(
    activeSnapshot?.options.lightingStyle || ""
  );
  const [audioStyle, setAudioStyle] = useState<string>(
    activeSnapshot?.options.audioStyle || ""
  );

  const [modCamera, setModCamera] = useState<boolean>(
    activeSnapshot?.options.camera ?? true
  );
  const [modPhysics, setModPhysics] = useState<boolean>(
    activeSnapshot?.options.physics ?? true
  );
  const [modLighting, setModLighting] = useState<boolean>(
    activeSnapshot?.options.lighting ?? true
  );
  const [modSound, setModSound] = useState<boolean>(
    activeSnapshot?.options.sound ?? true
  );
  const [modContinuity, setModContinuity] = useState<boolean>(
    activeSnapshot?.options.continuity ?? true
  );
  const [modTimeline, setModTimeline] = useState<boolean>(
    activeSnapshot?.options.timeline ?? true
  );

  const [useCustomBeats, setUseCustomBeats] = useState<boolean>(
    Boolean(activeSnapshot?.options.beats?.length)
  );
  const [beats, setBeats] = useState<TimelineBeat[]>(
    activeSnapshot?.options.beats?.length
      ? activeSnapshot.options.beats
      : DEFAULT_TIMELINE_BEATS.map((b) => ({ ...b }))
  );

  const [negatives, setNegatives] = useState<string[]>(
    activeSnapshot?.options.negatives?.length
      ? activeSnapshot.options.negatives
      : [...DEFAULT_DIRECTOR_NEGATIVES]
  );
  const [newNegative, setNewNegative] = useState<string>("");

  const [references, setReferences] = useState<string[]>(
    activeSnapshot?.options.references || []
  );
  const [newReference, setNewReference] = useState<string>("");

  const [attachSmartGuard, setAttachSmartGuard] = useState<boolean>(false);
  const [beatsOpen, setBeatsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedFlag, setSavedFlag] = useState<boolean>(false);

  const lastAppliedNonceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeSnapshot) return;
    const o = activeSnapshot.options;
    if (o.prompt) setPrompt(o.prompt);
    if (o.engine) setEngine(o.engine as DirectorEngineId);
    if (o.language) setLanguage(o.language);
    if (o.format) setFormat(o.format);
    if (o.duration) setDuration(o.duration);
    if (o.fps) setFps(o.fps);
    if (o.aspectRatio) setAspectRatio(o.aspectRatio);
    setGenre(o.genre || "");
    setShotType(o.shotType || "");
    setMood(o.mood || "");
    setGrading(o.grading || "");
    setCameraMovements(o.cameraMovements || []);
    setLens(o.lens || "");
    setLightingStyle(o.lightingStyle || "");
    setAudioStyle(o.audioStyle || "");
    setModCamera(o.camera ?? true);
    setModPhysics(o.physics ?? true);
    setModLighting(o.lighting ?? true);
    setModSound(o.sound ?? true);
    setModContinuity(o.continuity ?? true);
    setModTimeline(o.timeline ?? true);
    if (o.beats?.length) {
      setUseCustomBeats(true);
      setBeats(o.beats.map((b) => ({ ...b })));
    }
    if (o.negatives) setNegatives(o.negatives);
    if (o.references) setReferences(o.references);
  }, [activeSnapshot]);

  useEffect(() => {
    if (!appliedProps || appliedProps.nonce === lastAppliedNonceRef.current) {
      return;
    }
    lastAppliedNonceRef.current = appliedProps.nonce;
    const o = appliedProps.options;
    if (o.engine) setEngine(o.engine as DirectorEngineId);
    if (o.language) setLanguage(o.language);
    if (o.format) setFormat(o.format);
    if (o.duration) setDuration(o.duration);
    if (o.fps) setFps(o.fps);
    if (o.aspectRatio) setAspectRatio(o.aspectRatio);
    if (o.genre !== undefined) setGenre(o.genre || "");
    if (o.shotType !== undefined) setShotType(o.shotType || "");
    if (o.mood !== undefined) setMood(o.mood || "");
    if (o.grading !== undefined) setGrading(o.grading || "");
    if (o.cameraMovements) setCameraMovements(o.cameraMovements);
    if (o.lens !== undefined) setLens(o.lens || "");
    if (o.lightingStyle !== undefined) setLightingStyle(o.lightingStyle || "");
    if (o.audioStyle !== undefined) setAudioStyle(o.audioStyle || "");
    if (o.camera !== undefined) setModCamera(o.camera);
    if (o.physics !== undefined) setModPhysics(o.physics);
    if (o.lighting !== undefined) setModLighting(o.lighting);
    if (o.sound !== undefined) setModSound(o.sound);
    if (o.continuity !== undefined) setModContinuity(o.continuity);
    if (o.timeline !== undefined) setModTimeline(o.timeline);
  }, [appliedProps]);

  const currentOptions: DirectorEnhanceOptions = useMemo(
    () => ({
      prompt: prompt.trim() || DEFAULT_PROMPT_EN,
      duration,
      engine,
      aspectRatio,
      fps,
      genre: genre || null,
      shotType: shotType || null,
      cameraMovements,
      lens: lens.trim() || null,
      mood: mood || null,
      grading: grading || null,
      lightingStyle: lightingStyle.trim() || null,
      audioStyle: audioStyle.trim() || null,
      camera: modCamera,
      physics: modPhysics,
      lighting: modLighting,
      sound: modSound,
      continuity: modContinuity,
      timeline: modTimeline,
      beats: useCustomBeats ? beats : null,
      negatives,
      references,
      language,
      format,
    }),
    [
      prompt,
      duration,
      engine,
      aspectRatio,
      fps,
      genre,
      shotType,
      cameraMovements,
      lens,
      mood,
      grading,
      lightingStyle,
      audioStyle,
      modCamera,
      modPhysics,
      modLighting,
      modSound,
      modContinuity,
      modTimeline,
      useCustomBeats,
      beats,
      negatives,
      references,
      language,
      format,
    ]
  );

  const generatedOutput = useMemo(() => {
    try {
      const base = ArabiCinematicDirector.enhance(currentOptions);
      if (!attachSmartGuard || format === "json") return base;
      const guardProvider =
        engine === "minimax" || engine === "hailuo"
          ? "minimax"
          : engine === "veo"
          ? "veo"
          : engine === "wan"
          ? "wan"
          : "universal";
      return SmartSceneGuard.apply(base, guardProvider);
    } catch (err: unknown) {
      return err instanceof Error ? `Error: ${err.message}` : "Error";
    }
  }, [currentOptions, attachSmartGuard, format, engine]);

  const timelinePreview = useMemo(
    () =>
      ArabiCinematicDirector.buildTimeline(
        duration,
        useCustomBeats ? beats : null
      ),
    [duration, useCustomBeats, beats]
  );

  const toggleMovement = (id: DirectorCameraMovementId) => {
    setCameraMovements((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const applySample = (kind: "simple" | "advanced") => {
    if (kind === "simple") {
      setPrompt(
        isAr
          ? "كوب قهوة إسبريسو ساخن على طاولة خشبية قديمة في مقهى باريسي ممطر، البخار يتصاعد ببطء مع انعكاس أضواء الشارع على الزجاج"
          : "A steaming ceramic cup of espresso on a weathered wooden table inside a rainy Parisian cafe, delicate steam rising slowly as streetlamps reflect off rain-streaked glass"
      );
      setEngine("wan");
      setDuration(10);
      setFps(24);
      setAspectRatio("16:9");
      setGenre("cinematic");
      setShotType("closeup");
      setMood("intimate");
      setGrading("warm_vintage");
      setCameraMovements(["push_in"]);
      setLens("85mm f/1.4 prime lens");
      setLightingStyle("Soft diffused window light with warm practical lamp");
      setAudioStyle("Gentle rain on windowpane, quiet espresso machine hiss");
      setUseCustomBeats(false);
      setFormat("markdown");
    } else {
      setPrompt(
        isAr
          ? "سيارة رياضية كهربائية سوداء تنطلق بسرعة فائقة عبر نفق طوكيو المضاء بالنيون تحت المطر الغزير، رذاذ الماء يتطاير في حركة بطيئة سينمائية"
          : "A matte-black electric hypercar accelerating through a neon-lit Tokyo expressway tunnel during heavy rain, illuminated tire spray erupting in crisp slow motion"
      );
      setEngine("veo");
      setDuration(20);
      setFps(48);
      setAspectRatio("2.39:1");
      setGenre("scifi");
      setShotType("tracking");
      setMood("epic");
      setGrading("cold_cyber");
      setCameraMovements(["tracking_forward", "arc", "push_in"]);
      setLens("35mm anamorphic lens, horizontal amber/cyan flares");
      setLightingStyle("High-contrast wet asphalt reflections and volumetric neon haze");
      setAudioStyle("Deep electric turbine whine, rain impact on carbon fiber, rhythmic sub-bass");
      setUseCustomBeats(true);
      setBeats(DEFAULT_TIMELINE_BEATS.map((b) => ({ ...b })));
      setFormat("markdown");
    }
  };

  const handleReset = () => {
    setPrompt(isAr ? DEFAULT_PROMPT_AR : DEFAULT_PROMPT_EN);
    setEngine("veo");
    setLanguage("en");
    setFormat("markdown");
    setDuration(15);
    setFps(24);
    setAspectRatio("16:9");
    setGenre("cinematic");
    setShotType("tracking");
    setMood("epic");
    setGrading("teal_orange");
    setCameraMovements(["push_in"]);
    setLens("");
    setLightingStyle("");
    setAudioStyle("");
    setModCamera(true);
    setModPhysics(true);
    setModLighting(true);
    setModSound(true);
    setModContinuity(true);
    setModTimeline(true);
    setUseCustomBeats(false);
    setBeats(DEFAULT_TIMELINE_BEATS.map((b) => ({ ...b })));
    setNegatives([...DEFAULT_DIRECTOR_NEGATIVES]);
    setReferences([]);
    setAttachSmartGuard(false);
  };

  const handleCopy = async () => {
    await copyTextSafe(generatedOutput);
    setCopied(true);
    onNotify(
      isAr
        ? "تم نسخ برومبت المخرج السينمائي."
        : isFr
        ? "Prompt du réalisateur copié."
        : "Director prompt copied."
    );
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = () => {
    onSaveToHistory(currentOptions, generatedOutput);
    setSavedFlag(true);
    onNotify(
      isAr
        ? "تم حفظ برومبت المخرج في مكتبة السجل."
        : isFr
        ? "Enregistré dans l'historique."
        : "Saved Director prompt to History."
    );
    window.setTimeout(() => setSavedFlag(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === "json" ? "json" : format === "plain" ? "txt" : "md";
    const mime =
      format === "json"
        ? "application/json;charset=utf-8"
        : "text/plain;charset=utf-8";
    const blob = new Blob([generatedOutput], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts-director-${engine}-${duration}s.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addNegative = () => {
    const clean = newNegative.trim();
    if (!clean) return;
    if (!negatives.includes(clean)) {
      setNegatives((prev) => [...prev, clean]);
    }
    setNewNegative("");
  };

  const addReference = () => {
    const clean = newReference.trim();
    if (!clean) return;
    setReferences((prev) => [...prev, clean]);
    setNewReference("");
  };

  const wordCount = useMemo(
    () => generatedOutput.trim().split(/\s+/).filter(Boolean).length,
    [generatedOutput]
  );

  return (
    <div className="mx-auto max-w-[1440px] px-3.5 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-[#222634]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs text-amber-700 dark:text-[#F0C775]">
            <Clapperboard className="h-4 w-4 shrink-0" />
            <span>VideoPrompts Engine v2.0</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Director</span>
            <span aria-hidden="true">·</span>
            <span>10 Video Engines</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {isAr
              ? "محرك المخرج السينمائي v2.0"
              : isFr
              ? "Moteur Réalisateur Cinématique v2.0"
              : "Cinematic Director Engine v2.0"}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {isAr
              ? "صياغة فورية وحتمية لبرومبتات الإخراج السينمائي مع تحكم دقيق بالعدسة، حركات الكاميرا، التدريج اللوني، الجدول الزمني، والتصدير بـ Markdown و JSON."
              : isFr
              ? "Construction instantanée et déterministe de prompts de réalisation avec caméra, étalonnage, timeline et export Markdown/JSON."
              : "Instant deterministic cinematic prompt compiler with precision control over lenses, multi-axis camera movements, color grading, timeline beats, and Markdown/JSON export."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applySample("simple")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B]"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{isAr ? "مثال بسيط" : isFr ? "Exemple simple" : "Simple Sample"}</span>
          </button>
          <button
            type="button"
            onClick={() => applySample("advanced")}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? "مثال احترافي" : isFr ? "Exemple avancé" : "Advanced Sample"}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-400 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isAr ? "إعادة ضبط" : isFr ? "Réinitialiser" : "Reset"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-5 lg:col-span-6">
          {/* Core Idea & Engine Specs */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            <label
              htmlFor="dir-prompt-input"
              className="mb-2 block text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {isAr
                ? "الفكرة الإبداعية الأساسية"
                : isFr
                ? "Idée créative principale"
                : "Core Creative Prompt Idea"}
            </label>
            <textarea
              id="dir-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:focus:border-[#D4A34B]"
            />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "محرك الفيديو" : "Video Engine"}
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value as DirectorEngineId)}
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  {(
                    Object.entries(ArabiCinematicDirector.engines) as [
                      DirectorEngineId,
                      string
                    ][]
                  ).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "لغة الإخراج" : "Output Language"}
                </label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as DirectorLanguageId)
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  {(
                    Object.entries(ArabiCinematicDirector.languages) as [
                      DirectorLanguageId,
                      { name: string }
                    ][]
                  ).map(([id, meta]) => (
                    <option key={id} value={id}>
                      {meta.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "صيغة التصدير" : "Export Format"}
                </label>
                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value as DirectorOutputFormat)
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="markdown">Markdown (.md)</option>
                  <option value="json">Structured JSON (.json)</option>
                  <option value="plain">Plain Text (.txt)</option>
                </select>
              </div>
            </div>

            {/* Duration, FPS, Aspect */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? "المدة" : "Duration"}
                  </span>
                  <span className="font-mono-code font-bold tabular-nums text-amber-700 dark:text-[#F0C775]">
                    {duration}s
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="h-2 w-full accent-amber-600 dark:accent-[#D4A34B]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  FPS
                </label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono-code text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  {ArabiCinematicDirector.config.supportedFPS.map((f) => (
                    <option key={f} value={f}>
                      {f} FPS
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "نسبة الأبعاد" : "Aspect Ratio"}
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono-code text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  {ArabiCinematicDirector.config.supportedAspectRatios.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Cinematography Controls */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            <h2 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr
                ? "إعدادات التصوير السينمائي واللون"
                : isFr
                ? "Cinématographie & Étalonnage"
                : "Cinematography & Color Grading"}
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "النوع السينمائي" : "Genre"}
                </label>
                <select
                  value={genre}
                  onChange={(e) =>
                    setGenre(e.target.value as DirectorGenreId | "")
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="">{isAr ? "تلقائي" : "Auto / None"}</option>
                  {(
                    Object.entries(ArabiCinematicDirector.genres) as [
                      DirectorGenreId,
                      { name: string; arName: string }
                    ][]
                  ).map(([id, g]) => (
                    <option key={id} value={id}>
                      {isAr ? `${g.arName} (${g.name})` : g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "نوع اللقطة" : "Shot Type"}
                </label>
                <select
                  value={shotType}
                  onChange={(e) =>
                    setShotType(e.target.value as DirectorShotTypeId | "")
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="">{isAr ? "تلقائي" : "Auto / None"}</option>
                  {(
                    Object.entries(ArabiCinematicDirector.shotTypes) as [
                      DirectorShotTypeId,
                      string
                    ][]
                  ).map(([id, desc]) => (
                    <option key={id} value={id}>
                      {id.replace(/_/g, " ")} — {desc.slice(0, 42)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "المزاج الدرامي" : "Mood"}
                </label>
                <select
                  value={mood}
                  onChange={(e) =>
                    setMood(e.target.value as DirectorMoodId | "")
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="">{isAr ? "تلقائي" : "Auto / None"}</option>
                  {(
                    Object.entries(ArabiCinematicDirector.moods) as [
                      DirectorMoodId,
                      string
                    ][]
                  ).map(([id, desc]) => (
                    <option key={id} value={id}>
                      {id} — {desc.slice(0, 42)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "التدريج اللوني" : "Color Grading"}
                </label>
                <select
                  value={grading}
                  onChange={(e) =>
                    setGrading(e.target.value as DirectorGradingId | "")
                  }
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="">{isAr ? "تلقائي" : "Auto / None"}</option>
                  {(
                    Object.entries(ArabiCinematicDirector.gradingPresets) as [
                      DirectorGradingId,
                      string
                    ][]
                  ).map(([id, desc]) => (
                    <option key={id} value={id}>
                      {id.replace(/_/g, " ")} — {desc.slice(0, 42)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Camera Movements multi-select */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? "حركات الكاميرا (اختيار متعدد)" : "Camera Movements (Multi-Select)"}
                </span>
                <span className="font-mono-code tabular-nums text-slate-400">
                  {cameraMovements.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  Object.keys(
                    ArabiCinematicDirector.cameraMovements
                  ) as DirectorCameraMovementId[]
                ).map((id) => {
                  const active = cameraMovements.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleMovement(id)}
                      className={`rounded-md border px-2.5 py-1 font-mono-code text-[11px] transition-colors ${
                        active
                          ? "border-amber-600 bg-amber-700 font-semibold text-white dark:border-[#D4A34B] dark:bg-[#D4A34B] dark:text-[#110D05]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-300"
                      }`}
                    >
                      {id.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Lens / Lighting / Audio */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={lens}
                onChange={(e) => setLens(e.target.value)}
                placeholder={isAr ? "العدسة (مثل 35mm anamorphic)" : "Custom Lens (e.g. 50mm f/1.4)"}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
              />
              <input
                type="text"
                value={lightingStyle}
                onChange={(e) => setLightingStyle(e.target.value)}
                placeholder={isAr ? "إضاءة مخصصة" : "Custom Lighting"}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
              />
              <input
                type="text"
                value={audioStyle}
                onChange={(e) => setAudioStyle(e.target.value)}
                placeholder={isAr ? "تصميم صوتي مخصص" : "Custom Audio / Foley"}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
              />
            </div>

            {/* 6 Director Module Toggles */}
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-[#222634]">
              <span className="mb-2 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {isAr ? "وحدات الإخراج النشطة" : "Active Director Modules"}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  {
                    label: isAr ? "الكاميرا" : "Camera",
                    checked: modCamera,
                    set: setModCamera,
                  },
                  {
                    label: isAr ? "الفيزياء" : "Physics",
                    checked: modPhysics,
                    set: setModPhysics,
                  },
                  {
                    label: isAr ? "الإضاءة" : "Lighting",
                    checked: modLighting,
                    set: setModLighting,
                  },
                  {
                    label: isAr ? "الصوت" : "Sound",
                    checked: modSound,
                    set: setModSound,
                  },
                  {
                    label: isAr ? "الاستمرارية" : "Continuity",
                    checked: modContinuity,
                    set: setModContinuity,
                  },
                  {
                    label: isAr ? "الجدول الزمني" : "Timeline",
                    checked: modTimeline,
                    set: setModTimeline,
                  },
                ].map((m) => (
                  <label
                    key={m.label}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-700 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={m.checked}
                      onChange={(e) => m.set(e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-600 dark:accent-[#D4A34B]"
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline Beats, Negatives & References */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            <button
              type="button"
              onClick={() => setBeatsOpen((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <span>
                {isAr
                  ? "الجدول الزمني المخصص، السلبيات والمراجع"
                  : isFr
                  ? "Timeline personnalisée, négatifs et références"
                  : "Custom Timeline Beats, Negatives & References"}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  beatsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {beatsOpen && (
              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-[#222634]">
                {/* Custom Beats */}
                <div>
                  <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={useCustomBeats}
                      onChange={(e) => setUseCustomBeats(e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-600 dark:accent-[#D4A34B]"
                    />
                    <span>
                      {isAr
                        ? "تفعيل محرر النبضات الزمنية المخصصة"
                        : "Enable Custom Timeline Beats"}
                    </span>
                  </label>

                  {useCustomBeats && (
                    <div className="space-y-2">
                      {beats.map((b, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 items-center gap-2"
                        >
                          <input
                            type="number"
                            step={0.05}
                            min={0}
                            max={1}
                            value={b.start}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setBeats((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, start: v } : item
                                )
                              );
                            }}
                            className="col-span-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono-code text-xs dark:border-[#262B3A] dark:bg-[#0B0D12]"
                          />
                          <input
                            type="number"
                            step={0.05}
                            min={0}
                            max={1}
                            value={b.end}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setBeats((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, end: v } : item
                                )
                              );
                            }}
                            className="col-span-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono-code text-xs dark:border-[#262B3A] dark:bg-[#0B0D12]"
                          />
                          <input
                            type="text"
                            value={b.role}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBeats((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, role: v } : item
                                )
                              );
                            }}
                            className="col-span-7 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-[#262B3A] dark:bg-[#0B0D12]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setBeats((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove beat"
                            className="col-span-1 inline-flex justify-center text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setBeats((prev) => [
                            ...prev,
                            { start: 0.8, end: 1, role: "Final beat" },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline dark:text-[#F0C775]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{isAr ? "إضافة نبضة زمنية" : "Add Beat"}</span>
                      </button>
                    </div>
                  )}

                  <pre
                    dir="ltr"
                    className="mt-2.5 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono-code text-[11px] text-slate-600 dark:border-[#262B3A] dark:bg-[#080A0F] dark:text-slate-400"
                  >
                    {timelinePreview}
                  </pre>
                </div>

                {/* Negatives */}
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "القيود السلبية (Negative Constraints)" : "Negative Constraints"}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNegative}
                      onChange={(e) => setNewNegative(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addNegative();
                        }
                      }}
                      placeholder={isAr ? "أضف قيداً سلبياً..." : "Add negative constraint..."}
                      className="min-h-[34px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs dark:border-[#262B3A] dark:bg-[#0B0D12]"
                    />
                    <button
                      type="button"
                      onClick={addNegative}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {negatives.map((neg) => (
                      <button
                        key={neg}
                        type="button"
                        onClick={() =>
                          setNegatives((prev) => prev.filter((n) => n !== neg))
                        }
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:border-red-400 hover:text-red-500 dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-300"
                      >
                        <span>{neg}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference Frames */}
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "إطارات ومراجع بصرية (اختياري)" : "Reference Frames / Visual Notes"}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addReference();
                        }
                      }}
                      placeholder={isAr ? "رابط صورة أو وصف مرجع..." : "Reference image note or style anchor..."}
                      className="min-h-[34px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs dark:border-[#262B3A] dark:bg-[#0B0D12]"
                    />
                    <button
                      type="button"
                      onClick={addReference}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {references.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {references.map((ref, idx) => (
                        <li
                          key={`${ref}-${idx}`}
                          className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-[#262B3A] dark:bg-[#0B0D12]"
                        >
                          <span className="truncate">{ref}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReferences((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Live Compiled Output */}
        <div className="lg:col-span-6">
          <section className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-[#222634]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {isAr ? "الإخراج السينمائي الفوري" : "Live Compiled Director Prompt"}
                </h2>
                <p className="mt-1 font-mono-code text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {ArabiCinematicDirector.engines[engine]} · {duration}s · {fps} FPS ·{" "}
                  {aspectRatio} · {wordCount} words
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    savedFlag
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                  }`}
                >
                  {savedFlag ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {savedFlag
                      ? isAr
                        ? "تم الحفظ"
                        : "Saved"
                      : isAr
                      ? "حفظ في السجل"
                      : "Save to History"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{format.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Smart Scene Guard v2.0 attachment toggle */}
            {format !== "json" && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-[#262B3A] dark:bg-[#0B0D12]">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={attachSmartGuard}
                    onChange={(e) => setAttachSmartGuard(e.target.checked)}
                    className="h-3.5 w-3.5 accent-amber-600 dark:accent-[#D4A34B]"
                  />
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700 dark:text-[#F0C775]" />
                  <span>
                    {isAr
                      ? "إرفاق درع حماية المشهد v2.0 (Smart Scene Guard)"
                      : "Attach Smart Scene Guard v2.0"}
                  </span>
                </label>
                <span className="font-mono-code text-[11px] text-slate-400">
                  {attachSmartGuard ? "ON" : "OFF"}
                </span>
              </div>
            )}

            <pre
              dir="ltr"
              className="mt-4 max-h-[640px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono-code text-xs leading-relaxed text-slate-800 dark:border-[#252A38] dark:bg-[#080A0F] dark:text-slate-200"
            >
              {generatedOutput}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
};
