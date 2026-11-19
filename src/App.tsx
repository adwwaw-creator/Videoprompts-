import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Clapperboard,
  Dices,
  Download,
  Film,
  Loader2,
  Lock,
  Palette,
  PlugZap,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unlock,
  Upload,
  Volume2,
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { AdminVisitorCounter } from "./components/AdminVisitorCounter";
import { AdUnit } from "./components/AdUnit";
import { CollapsibleStudioPanel } from "./components/CollapsibleStudioPanel";
import {
  applyConsentToGoogle,
  CookieConsentBanner,
  CookieConsentRecord,
  readStoredConsent,
} from "./components/CookieConsentBanner";
import {
  DirectorAppliedProps,
  DirectorEngineView,
} from "./components/DirectorEngineView";
import { EngineGuideView } from "./components/EngineGuideView";
import { EngineSidebar } from "./components/EngineSidebar";
import { GoogleVeoStudioPanel } from "./components/GoogleVeoStudioPanel";
import { HistoryView } from "./components/HistoryView";
import { ImageReferenceDropzone } from "./components/ImageReferenceDropzone";
import { LegalPagesView, LegalSectionId } from "./components/LegalPagesView";
import { LuxuryPortalView } from "./components/LuxuryPortalView";
import { MiniMaxStudioPanel } from "./components/MiniMaxStudioPanel";
import { MiniMaxLaunchState, PromptOutputPanel } from "./components/PromptOutputPanel";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SiteFooter } from "./components/SiteFooter";
import { StoryboardEditor } from "./components/StoryboardEditor";
import { TopBar } from "./components/TopBar";
import {
  VideoGeneratorAppliedProps,
  VideoPromptGeneratorView,
} from "./components/VideoPromptGeneratorView";
import {
  AUDIO_DESIGN_TAGS,
  CAMERA_LENSES,
  CAMERA_MOVEMENTS,
  CATEGORIES,
  ENGINE_ORDER,
  ENGINES,
  HAILUO_OFFICIAL_COMMANDS,
  LIGHTING_PALETTES,
  PHYSICS_HINTS,
  SMART_KEYWORDS,
  STYLE_OPTIONS,
  WAN_VARIANTS,
} from "./data/engines";
import { I18N } from "./data/i18n";
import {
  AIProvider,
  AudioTagId,
  EngineId,
  GenerationMode,
  GoogleVideoDetail,
  GoogleVideoLanguage,
  GoogleVideoModel,
  HistoryEntry,
  Language,
  PhysicsHintId,
  PresetItem,
  PromptFormat,
  ReferenceImageState,
  SavedSequenceEntry,
  SceneChainContext,
  SceneChainItem,
  SceneChainState,
  StudioFormState,
  ThemeMode,
  VideoGeneratorResult,
  WanVariant,
  WorkspaceTab,
} from "./types/prompt";
import { DirectorEnhanceOptions } from "./utils/arabiCinematicDirector";
import { CinematicPromptRules } from "./utils/cinematicPromptRules";
import {
  compileGoogleVeoFromStudio,
  GOOGLE_VEO_LANGUAGES,
} from "./utils/googleVeoPrompt";
import { analyzePromptQuality } from "./utils/promptAnalyzer";
import {
  buildComfyExportPayload,
  buildDefaultShots,
  buildPythonPipelineScript,
  buildSmartNegative,
  compileEnginePrompt,
} from "./utils/promptEngine";
import { parseSceneChainInput } from "./utils/sceneChainParser";
import { safeFetchJson } from "./utils/safeFetchJson";
import { SmartSceneGuard } from "./utils/smartSceneGuard";
import { cleanPromptWithUnslop } from "./utils/unslopUtils";
import {
  extractOutputParts,
  usePersistentOutput,
} from "./hooks/usePersistentOutput";
import {
  FORM_STORAGE_KEY,
  usePersistentForm,
} from "./hooks/usePersistentForm";
import { auth, googleProvider } from "./firebase";
import {
  AdminVisitorStats,
  checkUserIsAdmin,
  fetchAdminExactCounts,
  recordSiteVisit,
  subscribeAdminVisitorStats,
} from "./utils/visitorTracker";
import {
  deletePromptFromCloud,
  deleteSequenceFromCloud,
  ensureUserProfile,
  savePromptToCloud,
  saveSequenceToCloud,
  subscribeUserPrompts,
  subscribeUserSequences,
  togglePromptFavoriteInCloud,
  toggleSequenceFavoriteInCloud,
} from "./utils/userCloudLibrary";

const STATE_STORAGE_KEY = "arabiprompt_studio_state_v2";
const HISTORY_STORAGE_KEY = "arabiprompt_studio_history_v1";
const SCENE_CHAIN_STORAGE_KEY = "arabiprompt_scene_chain_v1";
const SEQUENCES_STORAGE_KEY = "videoprompts_saved_sequences_v1";

function randomSeed(): number {
  return Math.floor(100_000 + Math.random() * 8_999_999_999);
}

async function safeReadJsonResponse<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`HTTP ${res.status}: Upstream returned non-JSON response.`);
  }
}

function safeParseClientJson<T = Record<string, unknown>>(raw: string): T {
  const cleaned = String(raw || "{}")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Invalid JSON response returned by AI model.");
  }
}

function formatRetryWait(retryDelay: string | null | undefined, lang: Language): string {
  if (!retryDelay) return "";
  const match = String(retryDelay).match(/^(\d+)s$/);
  if (!match) return "";
  const secs = Number(match[1]);
  if (!Number.isFinite(secs) || secs <= 0) return "";
  const mins = Math.ceil(secs / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    if (lang === "ar") return rem > 0 ? ` (~${hrs} س ${rem} د)` : ` (~${hrs} س)`;
    if (lang === "fr") return rem > 0 ? ` (~${hrs} h ${rem} min)` : ` (~${hrs} h)`;
    return rem > 0 ? ` (~${hrs}h ${rem}m)` : ` (~${hrs}h)`;
  }
  if (lang === "ar") return ` (~${mins} دقيقة)`;
  if (lang === "fr") return ` (~${mins} min)`;
  return ` (~${mins} min)`;
}

function formatClientApiError(
  rawMsg: string,
  lang: Language,
  opts?: { httpStatus?: number; apiStatus?: string; retryDelay?: string | null }
): string {
  const text = String(rawMsg || "").trim();
  let apiStatus = opts?.apiStatus || "";
  let retryDelay = opts?.retryDelay || null;
  let httpStatus = opts?.httpStatus || 0;

  if (!apiStatus && text.includes("{")) {
    try {
      const parsed = JSON.parse(text.slice(text.indexOf("{"))) as {
        error?: { code?: number; status?: string; details?: Array<{ retryDelay?: string }> };
      };
      if (parsed?.error) {
        apiStatus = parsed.error.status || apiStatus;
        httpStatus = parsed.error.code || httpStatus;
        const rd = parsed.error.details?.find((d) => typeof d?.retryDelay === "string");
        if (rd?.retryDelay) retryDelay = rd.retryDelay;
      }
    } catch {
      // ignore JSON parse issues
    }
  }

  const isQuota =
    httpStatus === 429 ||
    apiStatus === "RESOURCE_EXHAUSTED" ||
    text.includes("RESOURCE_EXHAUSTED") ||
    text.toLowerCase().includes("quota exceeded");

  if (isQuota) {
    const waitHint = formatRetryWait(retryDelay, lang);
    if (lang === "ar") {
      return `تم تجاوز الحصة اليومية المجانية لواجهة Gemini${waitHint}. يمكنك تفعيل مفتاح بمستوى مدفوع عبر Settings > Secrets أو التبديل إلى Ollama المحلي.`;
    }
    if (lang === "fr") {
      return `Quota gratuit Gemini dépassé${waitHint}. Sélectionnez une clé avec facturation dans Settings > Secrets ou utilisez Ollama local.`;
    }
    return `Gemini Free Tier quota exceeded${waitHint}. Select a billing-enabled key in Settings > Secrets or switch to local Ollama.`;
  }

  const isKeyErr =
    httpStatus === 403 ||
    apiStatus === "PERMISSION_DENIED" ||
    apiStatus === "API_KEY_INVALID" ||
    apiStatus === "MISSING_KEY" ||
    text.includes("PERMISSION_DENIED") ||
    text.includes("API_KEY_INVALID") ||
    text.includes("GEMINI_API_KEY is not configured");

  if (isKeyErr) {
    if (lang === "ar") {
      return "مفتاح Gemini غير صالح أو غير مفعّل. يرجى التحقق من المفتاح في Settings > Secrets.";
    }
    if (lang === "fr") {
      return "Clé API Gemini invalide ou manquante. Vérifiez Settings > Secrets.";
    }
    return "Gemini API key is missing or lacks permission. Please check Settings > Secrets.";
  }

  if (/timed?\s*out|timeout|aborted/i.test(text)) {
    if (lang === "ar") {
      return "انتهت مهلة استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
    }
    if (lang === "fr") {
      return "Le délai de réponse de l'IA a expiré. Veuillez réessayer.";
    }
    return "AI request timed out. Please try again.";
  }

  if (text.length > 220 && text.includes("{")) {
    return lang === "ar"
      ? "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. حاول مرة أخرى بعد قليل."
      : lang === "fr"
        ? "Échec de la requête IA. Veuillez réessayer."
        : "AI request failed. Please try again shortly.";
  }

  return text;
}

function composeCameraDirective(movementLabel: string, lensLabel: string): string {
  const mov = CAMERA_MOVEMENTS.find((m) => m.label === movementLabel);
  const lens = CAMERA_LENSES.find((l) => l.label === lensLabel);
  const movPart = mov ? mov.prompt : movementLabel;
  const lensPart = lens ? lens.prompt : lensLabel;
  return [movPart, lensPart].filter(Boolean).join(", ");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSmartKeyword(text: string, keyword: string): boolean {
  const regex = new RegExp(`(^|[,،\\s])${escapeRegExp(keyword)}($|[,،\\s])`, "i");
  return regex.test(text);
}

function toggleSmartKeyword(text: string, keyword: string): string {
  const trimmed = text.trim();
  if (!trimmed) return keyword;

  if (hasSmartKeyword(trimmed, keyword)) {
    const removeRegex = new RegExp(
      `(?:^|\\s*[,،]\\s*)${escapeRegExp(keyword)}(?=\\s*[,،]|\\s*$)`,
      "gi"
    );
    return trimmed
      .replace(removeRegex, "")
      .replace(/^[\s,،]+|[\s,،]+$/g, "")
      .replace(/\s*([,،])\s*([,،])+/g, "$1 ")
      .trim();
  }

  return `${trimmed.replace(/[,،\s]+$/, "")}, ${keyword}`;
}

function createInitialFormState(): StudioFormState {
  const defaultEngine: EngineId = "wan22";
  const defaultVariant: WanVariant = "a14b";
  const spec = ENGINES[defaultEngine];
  const variantSpec = WAN_VARIANTS[defaultVariant];

  return {
    engine: defaultEngine,
    wanVariant: defaultVariant,
    promptFormat: "official",
    mode: spec.defaultMode,
    category: "",
    subject: "",
    environment: "",
    action: "",
    camera: "",
    cameraMovement: "",
    cameraLens: "",
    light: "",
    style: "",
    extra: "",
    aspect: variantSpec.aspectOptions[0],
    duration: spec.defaultDuration,
    motionScale: 6,
    shotsCount: 3,
    shots: buildDefaultShots(3),
    cfgScale: variantSpec.defaultCfg,
    steps: variantSpec.defaultSteps,
    loraTags: "",
    seed: randomSeed(),
    seedLocked: false,
    physicsHints: [],
    includeAudio: true,
    audioTags: [],
    audioDescription: "",
    negative: "",
    negativeEdited: false,
    aiProvider: "gemini",
    ollamaModel: "llama3.1",
    minimaxResolution: "1080P",
    minimaxCameraCommands: [],
    minimaxCustomDirective: "",
    minimaxPromptOptimizer: true,
    veoModel: "veo-3.1",
    veoResolution: "1080p",
    veoDialogue: "",
    veoSoundEffects: "",
    veoDetail: "professional",
    veoLanguage: "English",
    smartSceneGuard: true,
  };
}

function isValidEngineId(id: unknown): id is EngineId {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(ENGINES, id);
}

function readStoredWorkspace(): {
  lang?: Language;
  theme?: ThemeMode;
  form?: Partial<StudioFormState>;
} | null {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = readStoredWorkspace()?.lang;
    return saved === "ar" || saved === "fr" || saved === "en" ? saved : "ar";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = readStoredWorkspace()?.theme;
    return saved === "dark" || saved === "light" ? saved : "dark";
  });
  const resolveTabFromPath = (): WorkspaceTab => {
    if (typeof window === "undefined") return "portal";
    const p = window.location.pathname.replace(/\/+$/, "").toLowerCase();
    if (p === "/privacy" || p === "/privacy-policy") return "privacy";
    if (p === "/terms" || p === "/terms-of-service") return "terms";
    if (p === "/about" || p === "/about-us") return "about";
    if (p === "/contact" || p === "/contact-us") return "contact";
    if (p === "/guide") return "guide";
    if (p === "/studio") return "studio";
    if (p === "/generator") return "generator";
    if (p === "/director") return "director";
    if (p === "/history") return "history";
    return "portal";
  };

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(resolveTabFromPath);
  const [adConsent, setAdConsent] = useState<CookieConsentRecord | null>(() =>
    readStoredConsent()
  );
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adConsentResolved = adConsent !== null;
  const personalizedAdsGranted = Boolean(adConsent?.personalizedAds);

  // Consent-gated Google AdSense initialization:
  // Do not inject or trigger AdSense scripts until the user resolves CookieConsentBanner.
  // If personalized advertising consent is not granted, enforce non-personalized ads (requestNonPersonalizedAds = 1).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const adsArray = (window.adsbygoogle = window.adsbygoogle || []);

    if (!adConsent) {
      adsArray.pauseAdRequests = 1;
      adsArray.requestNonPersonalizedAds = 1;
      return;
    }

    applyConsentToGoogle(adConsent);
    adsArray.requestNonPersonalizedAds = adConsent.personalizedAds ? 0 : 1;
    adsArray.pauseAdRequests = 0;

    const existingScript = document.getElementById("google-adsense-sdk");
    if (!existingScript) {
      const envClient = String(import.meta.env.VITE_ADSENSE_CLIENT_ID || "").trim();
      const adClient = /^ca-pub-\d{10,20}$/.test(envClient)
        ? envClient
        : "ca-pub-3312377428939400";
      const script = document.createElement("script");
      script.id = "google-adsense-sdk";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        adClient
      )}`;
      document.head.appendChild(script);
    }
  }, [adConsent]);

  // Synchronize clean URL paths for AdSense crawlers & browser back/forward navigation
  useEffect(() => {
    const tabToPath: Record<WorkspaceTab, string> = {
      portal: "/",
      studio: "/studio",
      generator: "/generator",
      director: "/director",
      guide: "/guide",
      history: "/history",
      about: "/about",
      privacy: "/privacy",
      terms: "/terms",
      contact: "/contact",
    };
    const nextPath = tabToPath[activeTab] || "/";
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ tab: activeTab }, "", nextPath);
    }
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(resolveTabFromPath());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [form, setForm, resetPersistedForm] = usePersistentForm(
    createInitialFormState,
    FORM_STORAGE_KEY,
    STATE_STORAGE_KEY
  );

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is HistoryEntry =>
              Boolean(item) &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.prompt === "string" &&
              isValidEngineId(item.engine)
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [directing, setDirecting] = useState(false);

  const [sceneChain, setSceneChain] = useState<SceneChainState>(() => {
    try {
      const raw = localStorage.getItem(SCENE_CHAIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SceneChainState>;
        if (parsed && Array.isArray(parsed.scenes)) {
          const validScenes = parsed.scenes.filter(
            (s): s is SceneChainItem =>
              Boolean(s) &&
              typeof s === "object" &&
              typeof s.prompt === "string" &&
              isValidEngineId(s.engine)
          );
          const safeBase =
            parsed.baseContext && typeof parsed.baseContext === "object"
              ? {
                  ...parsed.baseContext,
                  engine: isValidEngineId(parsed.baseContext.engine)
                    ? parsed.baseContext.engine
                    : "wan22",
                }
              : null;
          return {
            baseContext: safeBase,
            scenes: validScenes,
          };
        }
      }
    } catch {
      // ignore
    }
    return { baseContext: null, scenes: [] };
  });

  const [outputText, setOutputText, clearPersistedOutput] = usePersistentOutput(
    () => sceneChain.scenes[sceneChain.scenes.length - 1]?.prompt ?? ""
  );
  const [positiveText, setPositiveText] = useState(() => {
    const last = sceneChain.scenes[sceneChain.scenes.length - 1];
    if (last && outputText === last.prompt) {
      return last.positiveOnly;
    }
    return outputText ? extractOutputParts(outputText).positiveOnly : "";
  });
  const [negativeText, setNegativeText] = useState(() => {
    const last = sceneChain.scenes[sceneChain.scenes.length - 1];
    if (last && outputText === last.prompt) {
      return last.negativeOnly;
    }
    return outputText ? extractOutputParts(outputText).negativeOnly : "";
  });
  const [hasCompiledOnce, setHasCompiledOnce] = useState(
    () => outputText.trim().length > 0 || sceneChain.scenes.length > 0
  );
  const [addingNextScene, setAddingNextScene] = useState(false);
  const [generatingFilmChain, setGeneratingFilmChain] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] =
    useState<ReferenceImageState | null>(null);
  const [endReferenceImage, setEndReferenceImage] =
    useState<ReferenceImageState | null>(null);

  const [enhancing, setEnhancing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [analyzingTransition, setAnalyzingTransition] = useState(false);
  const [fittingLength, setFittingLength] = useState(false);
  const [convertingTarget, setConvertingTarget] = useState<
    "hailuo02" | "veo31" | null
  >(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [confirmNegReset, setConfirmNegReset] = useState(false);
  const [copiedType, setCopiedType] = useState<"full" | "positive" | null>(null);
  const [promptSavedRecently, setPromptSavedRecently] = useState(false);
  const [openPanels, setOpenPanels] = useState({
    sceneDetails: false,
    minimax: false,
    veo: false,
    engineOpts: false,
    camera: false,
    lighting: false,
    technical: false,
    audio: false,
    storyboard: false,
    negativeAi: false,
  });
  const [minimaxLaunchState, setMinimaxLaunchState] = useState<MiniMaxLaunchState>({
    open: false,
    submitting: false,
    polling: false,
    mode: null,
    launchUrl: "https://hailuoai.video/create",
    taskId: null,
    statusText: null,
    videoUrl: null,
    error: null,
    compiledPrompt: "",
    duration: 6,
    resolution: "1080P",
    hasFirstFrame: false,
    hasLastFrame: false,
  });
  const [status, setStatus] = useState<{ msg: string; type: "ok" | "err" | null }>({
    msg: "",
    type: null,
  });

  // Firebase Auth, User Cloud Library & Admin-only Visitor Counter state
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [chainSavedRecently, setChainSavedRecently] = useState(false);
  const [visitorStats, setVisitorStats] = useState<AdminVisitorStats | null>(null);
  const [visitorStatsLoading, setVisitorStatsLoading] = useState(false);

  // Video Prompt Generator (10 + 20) & Cinematic Director Engine v2.0 state
  const [savedSequences, setSavedSequences] = useState<SavedSequenceEntry[]>(() => {
    try {
      const raw = localStorage.getItem(SEQUENCES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeGenResult, setActiveGenResult] =
    useState<VideoGeneratorResult | null>(null);
  const [activeGenIdea, setActiveGenIdea] = useState<string>("");
  const [genPresetProps, setGenPresetProps] =
    useState<VideoGeneratorAppliedProps | null>(null);
  const [activeDirectorSnapshot, setActiveDirectorSnapshot] = useState<{
    options: DirectorEnhanceOptions;
    output: string;
  } | null>(null);
  const [directorPresetProps, setDirectorPresetProps] =
    useState<DirectorAppliedProps | null>(null);

  const togglePanel = (key: keyof typeof openPanels) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const anyPanelOpen = Object.values(openPanels).some(Boolean);
  const setAllPanels = (open: boolean) => {
    setOpenPanels({
      sceneDetails: open,
      minimax: open,
      veo: open,
      engineOpts: open,
      camera: open,
      lighting: open,
      technical: open,
      audio: open,
      storyboard: open,
      negativeAi: open,
    });
  };

  // Record one real persistent visit per browser session
  useEffect(() => {
    void recordSiteVisit(lang, activeTab).catch(() => {
      // Structured error already logged inside handleFirestoreError
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to Firebase Authentication, upsert user profile, and check admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setCurrentUserEmail(user?.email ?? null);
      if (user) {
        if (user.emailVerified) {
          void ensureUserProfile(user).catch(() => {
            // Structured error already logged inside handleFirestoreError
          });
        }
        const adminFlag = await checkUserIsAdmin(user);
        setIsAdmin(adminFlag);
      } else {
        setIsAdmin(false);
        setVisitorStats(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's private cloud prompts & film sequences when signed in
  useEffect(() => {
    if (!authReady || !currentUser || !currentUser.emailVerified) {
      return;
    }

    const unsubPrompts = subscribeUserPrompts(currentUser.uid, (cloudEntries) => {
      setHistory((localPrev) => {
        const localById = new Map(localPrev.map((item) => [item.id, item]));
        const merged: HistoryEntry[] = cloudEntries.map((cloudItem) => {
          const localMatch = localById.get(cloudItem.id);
          return localMatch
            ? {
                ...localMatch,
                ...cloudItem,
                stateSnapshot: localMatch.stateSnapshot,
                generatorSnapshot: localMatch.generatorSnapshot,
                directorSnapshot: localMatch.directorSnapshot,
              }
            : cloudItem;
        });
        const cloudIds = new Set(cloudEntries.map((c) => c.id));
        for (const localItem of localPrev) {
          if (!cloudIds.has(localItem.id)) {
            merged.push(localItem);
          }
        }
        merged.sort((a, b) => b.timestamp - a.timestamp);
        return merged.slice(0, 60);
      });
    });

    const unsubSequences = subscribeUserSequences(
      currentUser.uid,
      (cloudSequences) => {
        setSavedSequences((localPrev) => {
          const cloudIds = new Set(cloudSequences.map((c) => c.id));
          const merged: SavedSequenceEntry[] = [...cloudSequences];
          for (const localSeq of localPrev) {
            if (!cloudIds.has(localSeq.id)) {
              merged.push(localSeq);
            }
          }
          merged.sort((a, b) => b.createdAt - a.createdAt);
          return merged.slice(0, 50);
        });
      }
    );

    return () => {
      unsubPrompts();
      unsubSequences();
    };
  }, [authReady, currentUser]);

  // Subscribe to live visitor analytics ONLY when authenticated as verified Admin
  useEffect(() => {
    if (!authReady || !isAdmin) {
      return;
    }
    setVisitorStatsLoading(true);
    const unsubscribe = subscribeAdminVisitorStats(
      (nextStats) => {
        setVisitorStats(nextStats);
        setVisitorStatsLoading(false);
      },
      () => {
        setVisitorStatsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [authReady, isAdmin]);

  const handleUserSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showStatus(copy.okSignedInAccount, "ok");
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code || "")
          : "";
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      const message =
        err instanceof Error ? err.message : "Authentication failed.";
      showStatus(message, "err");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUserSignOut = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentUserEmail(null);
      setIsAdmin(false);
      setVisitorStats(null);
      showStatus(copy.okSignedOutAccount, "ok");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign out failed.";
      setStatus({ msg: message, type: "err" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (!currentUser || !currentUser.emailVerified) {
      await handleUserSignIn();
      return;
    }
    setCloudSyncing(true);
    try {
      const uid = currentUser.uid;
      await Promise.all([
        ...history.slice(0, 40).map((entry) =>
          savePromptToCloud(uid, entry).catch(() => {})
        ),
        ...savedSequences.slice(0, 30).map((seq) =>
          saveSequenceToCloud(uid, seq).catch(() => {})
        ),
      ]);
      showStatus(copy.accountSyncLocalDone, "ok");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Cloud sync failed.";
      showStatus(message, "err");
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleRefreshVisitorStats = async () => {
    if (!isAdmin) return;
    setVisitorStatsLoading(true);
    try {
      const exact = await fetchAdminExactCounts();
      setVisitorStats((prev) =>
        prev
          ? {
              ...prev,
              totalVisits: exact.totalVisits,
              todayVisits: exact.todayVisits,
              lastUpdatedAt: Date.now(),
            }
          : {
              totalVisits: exact.totalVisits,
              todayVisits: exact.todayVisits,
              uniqueRecentVisitors: 0,
              langCounts: { ar: 0, fr: 0, en: 0 },
              recentVisits: [],
              lastUpdatedAt: Date.now(),
            }
      );
    } catch {
      // Structured error logged inside fetchAdminExactCounts
    } finally {
      setVisitorStatsLoading(false);
    }
  };

  // Cleanup any active MiniMax polling loop on unmount
  useEffect(() => {
    return () => {
      activeMinimaxPollRef.current = null;
    };
  }, []);

  // Sync HTML attributes for RTL/LTR and dark/light theme
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    root.classList.toggle("dark", theme === "dark");
  }, [lang, theme]);

  // Persist UI language and theme preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({ lang, theme })
      );
    } catch {
      // ignore
    }
  }, [lang, theme]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Persist saved film sequences
  useEffect(() => {
    try {
      localStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(savedSequences));
    } catch {
      // ignore
    }
  }, [savedSequences]);

  // Persist sequential scene chain across page reloads
  useEffect(() => {
    try {
      if (sceneChain.scenes.length === 0 && !sceneChain.baseContext) {
        localStorage.removeItem(SCENE_CHAIN_STORAGE_KEY);
      } else {
        localStorage.setItem(SCENE_CHAIN_STORAGE_KEY, JSON.stringify(sceneChain));
      }
    } catch {
      // ignore
    }
  }, [sceneChain]);

  const copy = I18N[lang];
  const engineSpec = ENGINES[form.engine];
  const activeWanSpec = WAN_VARIANTS[form.wanVariant];
  const activeModes =
    form.engine === "wan22" ? activeWanSpec.modes : engineSpec.modes;
  const activeAspectOptions =
    form.engine === "wan22"
      ? activeWanSpec.aspectOptions
      : engineSpec.aspectOptions;
  const activeDurationOptions =
    form.engine === "wan22"
      ? activeWanSpec.durationOptions
      : engineSpec.durationOptions;
  const needsReferenceImage =
    form.mode === "i2v" ||
    form.mode === "flf2v" ||
    form.mode === "s2v" ||
    form.mode === "img2img";

  const qualityReport = useMemo(() => {
    const targetText = outputText.trim() || compileEnginePrompt(form).fullPrompt;
    return analyzePromptQuality(form, targetText);
  }, [form, outputText]);

  const veoMeta = useMemo(() => {
    if (form.engine !== "veo") return null;
    if (!form.subject.trim() && !form.action.trim()) return null;
    try {
      return compileGoogleVeoFromStudio(form).meta;
    } catch {
      return null;
    }
  }, [form]);

  const showStatus = useCallback((msg: string, type: "ok" | "err") => {
    setStatus({ msg, type });
  }, []);

  const pendingResyncRef = useRef(false);
  const activeMinimaxPollRef = useRef<string | null>(null);

  const resyncOutputIfActive = useCallback(
    (nextForm: StudioFormState) => {
      if (!hasCompiledOnce) return;
      if (nextForm.engine === "veo") {
        if (!nextForm.subject.trim() && !nextForm.action.trim()) return;
      } else if (
        !nextForm.subject.trim() &&
        !nextForm.action.trim() &&
        !nextForm.environment.trim()
      ) {
        return;
      }
      const compiled = compileEnginePrompt(nextForm);
      setOutputText(compiled.fullPrompt);
      setPositiveText(compiled.positiveOnly);
      setNegativeText(compiled.negativeOnly);
    },
    [hasCompiledOnce]
  );

  useEffect(() => {
    if (!pendingResyncRef.current) return;
    pendingResyncRef.current = false;
    resyncOutputIfActive(form);
  }, [form, resyncOutputIfActive]);

  const handleChangeOutput = useCallback((nextValue: string) => {
    setOutputText(nextValue);
    const { positiveOnly, negativeOnly } = extractOutputParts(nextValue);
    setPositiveText(positiveOnly);
    setNegativeText(negativeOnly);
  }, [setOutputText]);

  const handleUnslopOutput = useCallback(() => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const result = cleanPromptWithUnslop(outputText);
    if (!result.changed) {
      showStatus(
        lang === "ar"
          ? "البرومبت نقي بالفعل ولا يحتوي على كلمات حشوية زائدة."
          : lang === "fr"
            ? "Le prompt est déjà épuré et sans remplissage superflu."
            : "Prompt is already clean with no filler jargon found.",
        "ok"
      );
      return;
    }
    handleChangeOutput(result.cleaned);
    showStatus(
      lang === "ar"
        ? `تم تنظيف البرومبت (Unslop) وإزالة ${result.wordsSaved > 0 ? `${result.wordsSaved} كلمة حشوية` : `${result.removedCount} عبارة مكررة`}.`
        : lang === "fr"
          ? `Prompt nettoyé (Unslop) · ${result.wordsSaved} mot(s) superflu(s) retiré(s).`
          : `Prompt cleaned with Unslop (${result.wordsSaved > 0 ? `${result.wordsSaved} filler words` : `${result.removedCount} phrases`} removed).`,
      "ok"
    );
  }, [copy.errEmptyOutput, handleChangeOutput, lang, outputText, showStatus]);

  const updateFormField = <K extends keyof StudioFormState>(
    key: K,
    value: StudioFormState[K],
    shouldResync = false
  ) => {
    setActivePresetId(null);
    if (shouldResync) {
      pendingResyncRef.current = true;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectEngine = (nextEngineId: EngineId) => {
    const nextSpec = ENGINES[nextEngineId];
    setActivePresetId(null);
    setConfirmNegReset(false);
    pendingResyncRef.current = true;
    setForm((prev) => {
      const variantSpec = WAN_VARIANTS[prev.wanVariant];
      const allowedModes =
        nextEngineId === "wan22" ? variantSpec.modes : nextSpec.modes;
      const allowedAspects =
        nextEngineId === "wan22"
          ? variantSpec.aspectOptions
          : nextSpec.aspectOptions;
      const allowedDurations =
        nextEngineId === "wan22"
          ? variantSpec.durationOptions
          : nextSpec.durationOptions;

      const nextMode = allowedModes.includes(prev.mode)
        ? prev.mode
        : nextSpec.defaultMode;
      const nextAspect = allowedAspects.includes(prev.aspect)
        ? prev.aspect
        : allowedAspects[0];
      const nextDuration =
        nextSpec.kind === "video"
          ? allowedDurations.some((d) => d.value === prev.duration)
            ? prev.duration
            : nextSpec.defaultDuration
          : 0;
      const nextShots = nextSpec.supportsStoryboard ? prev.shotsCount : 1;
      const nextNegative = prev.negativeEdited
        ? prev.negative
        : prev.negative.trim()
          ? buildSmartNegative(nextEngineId, nextMode, prev.category)
          : "";

      return {
        ...prev,
        engine: nextEngineId,
        mode: nextMode,
        aspect: nextAspect,
        duration: nextDuration,
        shotsCount: nextShots,
        cfgScale:
          nextEngineId === "wan22" ? variantSpec.defaultCfg : nextSpec.defaultCfg,
        steps:
          nextEngineId === "wan22"
            ? variantSpec.defaultSteps
            : nextSpec.defaultSteps,
        minimaxResolution:
          nextEngineId === "minimax" && nextDuration === 10
            ? "768P"
            : prev.minimaxResolution || "1080P",
        negative: nextNegative,
      };
    });
  };

  const handleWanVariantChange = (nextVariant: WanVariant) => {
    const variantSpec = WAN_VARIANTS[nextVariant];
    setActivePresetId(null);
    pendingResyncRef.current = true;
    setForm((prev) => {
      const nextMode = variantSpec.modes.includes(prev.mode)
        ? prev.mode
        : "t2v";
      const nextAspect = variantSpec.aspectOptions.includes(prev.aspect)
        ? prev.aspect
        : variantSpec.aspectOptions[0];
      const nextDuration = variantSpec.durationOptions.some(
        (d) => d.value === prev.duration
      )
        ? prev.duration
        : variantSpec.durationOptions[1]?.value ||
          variantSpec.durationOptions[0].value;
      const nextNegative = prev.negativeEdited
        ? prev.negative
        : prev.negative.trim()
          ? buildSmartNegative("wan22", nextMode, prev.category)
          : "";

      return {
        ...prev,
        wanVariant: nextVariant,
        mode: nextMode,
        aspect: nextAspect,
        duration: nextDuration,
        cfgScale: variantSpec.defaultCfg,
        steps: variantSpec.defaultSteps,
        negative: nextNegative,
      };
    });
  };

  const handleModeChange = (nextMode: GenerationMode) => {
    setActivePresetId(null);
    setConfirmNegReset(false);
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      mode: nextMode,
      negative: prev.negativeEdited
        ? prev.negative
        : prev.negative.trim()
          ? buildSmartNegative(prev.engine, nextMode, prev.category)
          : "",
    }));
    if (nextMode === "s2v") {
      showStatus(copy.tipS2vMode, "ok");
    }
  };

  const handleCategoryChange = (nextCategory: string) => {
    setActivePresetId(null);
    setConfirmNegReset(false);
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      negative: prev.negativeEdited
        ? prev.negative
        : prev.negative.trim()
          ? buildSmartNegative(prev.engine, prev.mode, nextCategory)
          : "",
    }));
  };

  const handleCameraStudioChange = (
    movementLabel: string,
    lensLabel: string
  ) => {
    setActivePresetId(null);
    const combined = composeCameraDirective(movementLabel, lensLabel);
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      cameraMovement: movementLabel,
      cameraLens: lensLabel,
      camera: combined,
    }));
  };

  const handleShotsCountChange = (nextCount: number) => {
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      shotsCount: nextCount,
      shots: buildDefaultShots(nextCount, prev.shots),
    }));
  };

  const handleUpdateShot = (
    index: number,
    field: "camera" | "description",
    value: string
  ) => {
    pendingResyncRef.current = true;
    setForm((prev) => {
      const updated = [...prev.shots];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, shots: updated };
    });
  };

  const handleTogglePhysicsHint = (hintId: PhysicsHintId) => {
    pendingResyncRef.current = true;
    setForm((prev) => {
      const exists = prev.physicsHints.includes(hintId);
      const nextHints = exists
        ? prev.physicsHints.filter((id) => id !== hintId)
        : [...prev.physicsHints, hintId];
      return { ...prev, physicsHints: nextHints };
    });
  };

  const handleToggleAudioTag = (tagId: AudioTagId) => {
    pendingResyncRef.current = true;
    setForm((prev) => {
      const exists = prev.audioTags.includes(tagId);
      const nextTags = exists
        ? prev.audioTags.filter((id) => id !== tagId)
        : [...prev.audioTags, tagId];
      return { ...prev, audioTags: nextTags };
    });
  };

  const compileAndSave = useCallback(
    (
      overrideState?: StudioFormState,
      customSuccessMsg?: string,
      options?: { preserveStatusBanner?: boolean }
    ) => {
      const base = overrideState || form;
      const target: StudioFormState = base.seedLocked
        ? base
        : { ...base, seed: randomSeed() };

      if (!base.seedLocked && !overrideState) {
        setForm(target);
      }

      const spec = ENGINES[target.engine];

      if (target.engine === "veo") {
        if (!target.subject.trim() && !target.action.trim()) {
          showStatus(copy.errSubject, "err");
          return;
        }
      } else if (
        !target.subject.trim() &&
        !target.action.trim() &&
        !target.environment.trim() &&
        !referenceImage
      ) {
        showStatus(copy.errSubject, "err");
        return;
      }

      const compiled = compileEnginePrompt(target);
      setOutputText(compiled.fullPrompt);
      setPositiveText(compiled.positiveOnly);
      setNegativeText(compiled.negativeOnly);
      setHasCompiledOnce(true);

      const titleBody = (target.subject || target.action || spec.name).slice(
        0,
        48
      );
      const prefixedTitle = `${spec.name}${target.category ? ` · ${target.category.split(" ")[0]}` : ""} — ${titleBody}`;

      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        engine: target.engine,
        wanVariant: target.engine === "wan22" ? target.wanVariant : undefined,
        mode: target.mode,
        category: target.category,
        shotsCount: spec.kind === "video" ? target.shotsCount : 1,
        title: prefixedTitle,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: Date.now(),
        isFavorite: false,
        prompt: compiled.fullPrompt,
        positiveOnly: compiled.positiveOnly,
        negativeOnly: compiled.negativeOnly,
        stateSnapshot: {
          ...target,
        },
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 60));
      if (currentUser?.emailVerified) {
        void savePromptToCloud(currentUser.uid, newEntry).catch(() => {});
      }

      setSceneChain({
        baseContext: {
          engine: target.engine,
          style: target.style,
          character: target.subject,
          environment: target.environment,
          camera: target.camera,
          lighting: target.light,
          seed: target.seed,
        },
        scenes: [
          {
            id: 1,
            order: 1,
            idea: target.subject.trim() || target.action.trim() || spec.name,
            prompt: compiled.fullPrompt,
            positiveOnly: compiled.positiveOnly,
            negativeOnly: compiled.negativeOnly,
            engine: target.engine,
            createdAt: Date.now(),
            sceneId: "scene_1",
            jobId: `sg_chain_1_${Date.now()}`,
          },
        ],
      });

      if (options?.preserveStatusBanner) {
        return;
      }

      if (customSuccessMsg) {
        showStatus(customSuccessMsg, "ok");
      } else if (target.engine === "wan22" && target.promptFormat === "official") {
        const w = compiled.positiveWords;
        const lengthMsg =
          lang === "ar"
            ? w < 80
              ? `تم البناء (${w} كلمة · المثالي لـ Wan 80–120، يمكنك إضافة تفاصيل للمشهد أو الضوء).`
              : w > 120
                ? `تم البناء (${w} كلمة · فوق 120 كلمة قد يتجاهل Wan التفاصيل الأخيرة، يفضل الاختصار).`
                : `تم البناء (${w} كلمة · طول مثالي لمعيار Wan 2.2).`
            : lang === "fr"
              ? w < 80
                ? `Généré (${w} mots · idéal Wan : 80–120).`
                : w > 120
                  ? `Généré (${w} mots · au-delà de 120, Wan peut ignorer l'excédent).`
                  : `Généré (${w} mots · longueur idéale Wan 2.2).`
              : w < 80
                ? `Built (${w} words · Wan 2.2 sweet spot is 80–120 words).`
                : w > 120
                  ? `Built (${w} words · above 120 words, Wan may attenuate trailing details).`
                  : `Built (${w} words · optimal Wan 2.2 length).`;
        showStatus(lengthMsg, "ok");
      } else {
        showStatus(copy.okGenerated, "ok");
      }
    },
    [copy, currentUser, form, lang, referenceImage, showStatus]
  );


  const handleToggleFavorite = (id: string) => {
    const currentItem = history.find((item) => item.id === id);
    const nextFav = currentItem ? !currentItem.isFavorite : true;
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
    if (currentUser?.emailVerified) {
      if (currentItem) {
        void togglePromptFavoriteInCloud(currentUser.uid, id, nextFav).catch(
          () => {}
        );
      }
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentUser?.emailVerified) {
      void deletePromptFromCloud(currentUser.uid, id).catch(() => {});
    }
  };

  const handleClearAllHistory = () => {
    const idsToDelete = history.map((item) => item.id);
    setHistory([]);
    if (currentUser?.emailVerified) {
      void Promise.all(
        idsToDelete.map((id) =>
          deletePromptFromCloud(currentUser.uid, id).catch(() => {})
        )
      );
    }
  };

  const handleToggleFavoriteSequence = (id: string) => {
    const currentSeq = savedSequences.find((seq) => seq.id === id);
    const nextFav = currentSeq ? !currentSeq.isFavorite : true;
    setSavedSequences((prev) =>
      prev.map((seq) =>
        seq.id === id ? { ...seq, isFavorite: !seq.isFavorite } : seq
      )
    );
    if (currentUser?.emailVerified) {
      void toggleSequenceFavoriteInCloud(currentUser.uid, id, nextFav).catch(
        () => {}
      );
    }
  };

  const handleDeleteSequenceEntry = (id: string) => {
    setSavedSequences((prev) => prev.filter((seq) => seq.id !== id));
    if (currentUser?.emailVerified) {
      void deleteSequenceFromCloud(currentUser.uid, id).catch(() => {});
    }
  };

  const handleClearAllSequences = () => {
    const idsToDelete = savedSequences.map((seq) => seq.id);
    setSavedSequences([]);
    if (currentUser?.emailVerified) {
      void Promise.all(
        idsToDelete.map((id) =>
          deleteSequenceFromCloud(currentUser.uid, id).catch(() => {})
        )
      );
    }
  };

  const handleApplyPreset = (preset: PresetItem) => {
    const spec = ENGINES[preset.engine];
    const nextVariant: WanVariant = preset.data.wanVariant ?? form.wanVariant;
    const variantSpec = WAN_VARIANTS[nextVariant];
    const nextShotsCount =
      preset.data.shotsCount ?? (spec.supportsStoryboard ? 3 : 1);
    const nextMode = preset.data.mode ?? spec.defaultMode;
    const nextCategory = preset.data.category ?? CATEGORIES[0];
    const aspectPool =
      preset.engine === "wan22"
        ? variantSpec.aspectOptions
        : spec.aspectOptions;

    const merged: StudioFormState = {
      ...form,
      ...preset.data,
      engine: preset.engine,
      wanVariant: nextVariant,
      mode: nextMode,
      category: nextCategory,
      aspect:
        preset.data.aspect && aspectPool.includes(preset.data.aspect)
          ? preset.data.aspect
          : aspectPool[0],
      duration: preset.data.duration ?? spec.defaultDuration,
      cfgScale:
        preset.data.cfgScale ??
        (preset.engine === "wan22" ? variantSpec.defaultCfg : spec.defaultCfg),
      steps:
        preset.data.steps ??
        (preset.engine === "wan22" ? variantSpec.defaultSteps : spec.defaultSteps),
      shotsCount: nextShotsCount,
      shots: buildDefaultShots(nextShotsCount),
      seed: form.seedLocked ? form.seed : randomSeed(),
      negative:
        preset.data.negative ??
        buildSmartNegative(preset.engine, nextMode, nextCategory),
      negativeEdited: Boolean(preset.data.negative),
    };

    setConfirmNegReset(false);
    setForm(merged);
    setActivePresetId(preset.id);
    setActiveTab("studio");
    compileAndSave(merged);
  };

  const runAutoSceneDirector = useCallback(
    async (briefText: string, baseState: StudioFormState = form): Promise<StudioFormState | null> => {
      const briefToUse = briefText.trim();
      if (!briefToUse) return null;

      setDirecting(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55_000);

      try {
        let data: {
          category?: string;
          duration?: number;
          subject?: string;
          environment?: string;
          action?: string;
          extra?: string;
          cameraMovement?: string;
          lens?: string;
          lightingMood?: string;
          style?: string;
          physicsHints?: string[];
          audioTags?: string[];
          audioDesign?: string;
          dialogue?: string;
          soundEffects?: string;
          minimaxCameraCommands?: string[];
          shots?: { camera: string; description: string }[];
          negative?: string;
        } = {};

        const baseSpec = ENGINES[baseState.engine];
        const baseDurations =
          baseState.engine === "wan22"
            ? WAN_VARIANTS[baseState.wanVariant].durationOptions
            : baseSpec.durationOptions;
        const isRefMode = baseState.mode === "i2v" || baseState.mode === "flf2v";

        if (baseState.aiProvider === "gemini") {
          const res = await fetch("/api/ai/director", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              brief: briefToUse,
              engine: baseState.engine,
              wanVariant: baseState.wanVariant,
            }),
          });
          const json = await safeReadJsonResponse<{
            error?: string;
            apiStatus?: string;
            retryDelay?: string | null;
            [key: string]: unknown;
          }>(res);
          if (!res.ok) {
            throw new Error(
              formatClientApiError(
                json.error || `HTTP ${res.status}: Auto scene direction failed.`,
                lang,
                {
                  httpStatus: res.status,
                  apiStatus: json.apiStatus,
                  retryDelay: json.retryDelay,
                }
              )
            );
          }
          data = json as typeof data;
        } else {
          const modelName = baseState.ollamaModel.trim() || "llama3.1";
          const sysPrompt = `You are an elite AI Commercial Film Director for ${baseSpec.name}. Convert the user's brief into strictly valid JSON with keys: category, duration (integer 5, 6, 8, or 10), subject, environment, action, extra, cameraMovement, lens, lightingMood, style, physicsHints (array from gravity,fluid,volumetric,subsurface,inertia,caustics), audioTags (array from bass,whoosh,clicks,music,ambient,foley), audioDesign, minimaxCameraCommands (array of 1-2 from Push in,Pull out,Orbit,Tracking shot,Pan left,Pan right,Tilt up,Tilt down,Pedestal up,Zoom in,Zoom out,Static shot), shots (array of 3 objects with camera and description), negative.`;
          const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              model: modelName,
              prompt: `${sysPrompt}\n\nBrief: ${briefToUse}`,
              format: "json",
              stream: false,
            }),
          });
          if (!res.ok) {
            throw new Error(`Ollama error (HTTP ${res.status}) at http://localhost:11434.`);
          }
          const json = await safeReadJsonResponse<{ response?: string }>(res);
          data = safeParseClientJson<typeof data>(json.response || "{}");
        }

        const matchedCategory =
          baseState.category ||
          CATEGORIES.find((c) => c === data.category) ||
          CATEGORIES[0];

        const matchedMovement =
          baseState.cameraMovement ||
          CAMERA_MOVEMENTS.find(
            (m) =>
              (data.cameraMovement || "").toLowerCase().includes(m.id) ||
              (data.cameraMovement || "")
                .toLowerCase()
                .includes(m.label.toLowerCase().split(" ")[0])
          )?.label ||
          CAMERA_MOVEMENTS[0].label;

        const matchedLens =
          baseState.cameraLens ||
          CAMERA_LENSES.find((l) =>
            (data.lens || "").toLowerCase().includes(l.id)
          )?.label ||
          CAMERA_LENSES[1].label;

        const composedCam =
          baseState.camera.trim() ||
          composeCameraDirective(matchedMovement, matchedLens);

        const matchedStyle =
          baseState.style ||
          STYLE_OPTIONS.find((s) =>
            s.toLowerCase().includes((data.style || "").toLowerCase().slice(0, 18))
          ) ||
          data.style ||
          STYLE_OPTIONS[0];

        const validPhysicsIds = new Set<PhysicsHintId>(PHYSICS_HINTS.map((h) => h.id));
        const matchedPhysics =
          baseState.physicsHints.length > 0
            ? baseState.physicsHints
            : Array.isArray(data.physicsHints)
              ? data.physicsHints.filter((id): id is PhysicsHintId =>
                  validPhysicsIds.has(id as PhysicsHintId)
                )
              : (["gravity", "inertia"] as PhysicsHintId[]);

        const validAudioIds = new Set<AudioTagId>(AUDIO_DESIGN_TAGS.map((t) => t.id));
        const matchedAudioTags =
          baseState.audioTags.length > 0
            ? baseState.audioTags
            : baseSpec.kind === "video" && Array.isArray(data.audioTags)
              ? data.audioTags.filter((id): id is AudioTagId =>
                  validAudioIds.has(id as AudioTagId)
                )
              : baseSpec.kind === "video"
                ? (["ambient"] as AudioTagId[])
                : [];

        const validHailuoCmds = new Set(HAILUO_OFFICIAL_COMMANDS.map((c) => c.cmd));
        const matchedHailuoCmds =
          baseState.minimaxCameraCommands.length > 0
            ? baseState.minimaxCameraCommands
            : Array.isArray(data.minimaxCameraCommands)
              ? data.minimaxCameraCommands
                  .filter((c) => validHailuoCmds.has(c))
                  .slice(0, 3)
              : [];

        let nextDuration = baseState.duration;
        if (baseSpec.kind === "video" && baseDurations.length > 0) {
          const requested = Number(data.duration) || baseState.duration;
          const closest = baseDurations.reduce((best, opt) =>
            Math.abs(opt.value - requested) < Math.abs(best.value - requested)
              ? opt
              : best
          );
          nextDuration = closest.value;
        }

        const nextShotsCount = baseSpec.supportsStoryboard ? 3 : 1;
        const userEnteredShots = baseState.shots.some(
          (s) => s.camera.trim() || s.description.trim()
        );
        const mappedShots = userEnteredShots
          ? baseState.shots
          : buildDefaultShots(
              nextShotsCount,
              Array.isArray(data.shots)
                ? data.shots.map((s, idx) => ({
                    id: idx + 1,
                    role: `Shot ${idx + 1}`,
                    camera: s.camera || composedCam,
                    description: s.description || data.action || "",
                  }))
                : []
            );

        const nextForm: StudioFormState = {
          ...baseState,
          category: matchedCategory,
          duration: nextDuration,
          subject: data.subject || baseState.subject,
          environment: isRefMode
            ? baseState.environment
            : baseState.environment.trim() || data.environment || "",
          action: baseState.action.trim() || data.action || "",
          extra: baseState.extra.trim() || data.extra || "",
          cameraMovement: matchedMovement,
          cameraLens: matchedLens,
          camera: composedCam,
          light: baseState.light.trim() || data.lightingMood || "",
          style: matchedStyle,
          physicsHints: matchedPhysics,
          includeAudio: baseSpec.kind === "video",
          audioTags: matchedAudioTags,
          audioDescription:
            baseState.audioDescription.trim() || data.audioDesign || "",
          veoDialogue:
            baseState.veoDialogue.trim() || data.dialogue || "",
          veoSoundEffects:
            baseState.veoSoundEffects.trim() ||
            data.soundEffects ||
            data.audioDesign ||
            "",
          minimaxCameraCommands: matchedHailuoCmds,
          shotsCount: nextShotsCount,
          shots: mappedShots,
          negative: !baseSpec.supportsNegative
            ? ""
            : baseState.negative.trim() ||
              data.negative ||
              buildSmartNegative(baseState.engine, baseState.mode, matchedCategory),
          negativeEdited: Boolean(baseState.negativeEdited || data.negative),
        };

        setConfirmNegReset(false);
        setActivePresetId(null);
        setForm(nextForm);
        return nextForm;
      } catch (err: unknown) {
        const raw =
          err instanceof DOMException && err.name === "AbortError"
            ? "Auto scene direction timed out after 55s."
            : err instanceof Error
              ? err.message
              : "Auto scene direction failed.";
        showStatus(formatClientApiError(raw, lang), "err");
        return null;
      } finally {
        clearTimeout(timer);
        setDirecting(false);
      }
    },
    [form, lang, showStatus]
  );

  const handleSmartBuild = useCallback(async () => {
    const needsAutoDirection =
      Boolean(form.subject.trim()) &&
      (form.mode === "t2v" || form.mode === "t2i"
        ? !form.environment.trim() || !form.action.trim()
        : !form.action.trim());

    if (needsAutoDirection) {
      const directed = await runAutoSceneDirector(form.subject, form);
      if (directed) {
        compileAndSave(directed, copy.okDirectorDone);
        return;
      }
      if (form.subject.trim() || referenceImage) {
        compileAndSave(form, undefined, { preserveStatusBanner: true });
      }
      return;
    }

    compileAndSave();
  }, [compileAndSave, copy.okDirectorDone, form, referenceImage, runAutoSceneDirector]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && activeTab === "studio") {
        e.preventDefault();
        void handleSmartBuild();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, handleSmartBuild]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      if (form.aiProvider === "gemini") {
        const res = await fetch("/api/ai/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: controller.signal,
        });
        const data = await safeReadJsonResponse<{
          ok?: boolean;
          error?: string;
          apiStatus?: string;
          retryDelay?: string | null;
        }>(res);
        if (!res.ok || !data.ok) {
          throw new Error(
            formatClientApiError(
              data.error || "Gemini connection test failed.",
              lang,
              {
                httpStatus: res.status,
                apiStatus: data.apiStatus,
                retryDelay: data.retryDelay,
              }
            )
          );
        }
        showStatus(copy.okConnectionTest, "ok");
      } else {
        const res = await fetch("http://localhost:11434/api/tags", {
          method: "GET",
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Ollama returned HTTP ${res.status}`);
        }
        showStatus(copy.okConnectionTest, "ok");
      }
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Connection timed out."
          : err instanceof Error
            ? err.message
            : "Connection test failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setTestingConnection(false);
    }
  };

  const handleAiEnhance = async () => {
    if (!form.subject.trim() && !form.action.trim()) {
      showStatus(copy.errSubject, "err");
      return;
    }

    setEnhancing(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);

    try {
      let parsed: {
        subject?: string;
        environment?: string;
        action?: string;
        extra?: string;
        category?: string;
        duration?: number;
        cameraMovement?: string;
        lens?: string;
        lightingMood?: string;
        style?: string;
        physicsHints?: string[];
        audioTags?: string[];
        audioDesign?: string;
        dialogue?: string;
        soundEffects?: string;
        minimaxCameraCommands?: string[];
        shots?: { camera: string; description: string }[];
        negative?: string;
      } = {};

      if (form.aiProvider === "gemini") {
        const res = await fetch("/api/ai/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            engine: form.engine,
            mode: form.mode,
            category: form.category,
            subject: form.subject,
            environment: form.environment,
            action: form.action,
            style: form.style,
            light: form.light,
            camera: form.camera,
            extra: form.extra,
          }),
        });
        const data = await safeReadJsonResponse<{
          error?: string;
          apiStatus?: string;
          retryDelay?: string | null;
          [key: string]: unknown;
        }>(res);
        if (!res.ok) {
          throw new Error(
            formatClientApiError(
              data.error || `HTTP ${res.status}: Failed to enhance prompt.`,
              lang,
              {
                httpStatus: res.status,
                apiStatus: data.apiStatus,
                retryDelay: data.retryDelay,
              }
            )
          );
        }
        parsed = data as typeof parsed;
      } else {
        const modelName = form.ollamaModel.trim() || "llama3.1";
        const sysPrompt = `You are an elite AI Prompt Engineer for ${engineSpec.name} (${engineSpec.encoder}). Convert the user's raw idea into master-level English prompt fields. Return ONLY valid JSON with keys: subject, environment, action, extra, category, duration, cameraMovement, lens, lightingMood, style, physicsHints, audioTags, audioDesign, minimaxCameraCommands, shots (array of 3 {camera, description}), negative.`;
        const userPayload = `Subject: ${form.subject} | Environment: ${form.environment} | Action: ${form.action} | Style: ${form.style} | Lighting: ${form.light} | Camera: ${form.camera}`;
        const res = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: `${sysPrompt}\n\n${userPayload}`,
            format: "json",
            stream: false,
          }),
        });
        if (!res.ok) {
          throw new Error(
            `Ollama error (HTTP ${res.status}) at http://localhost:11434.`
          );
        }
        const data = await safeReadJsonResponse<{ response?: string }>(res);
        parsed = safeParseClientJson<typeof parsed>(data.response || "{}");
      }

      const matchedCategory =
        CATEGORIES.find((c) => c === parsed.category) || form.category || CATEGORIES[0];
      const matchedMovement =
        CAMERA_MOVEMENTS.find(
          (m) =>
            (parsed.cameraMovement || "").toLowerCase().includes(m.id) ||
            (parsed.cameraMovement || "")
              .toLowerCase()
              .includes(m.label.toLowerCase().split(" ")[0])
        )?.label ||
        form.cameraMovement ||
        CAMERA_MOVEMENTS[0].label;
      const matchedLens =
        CAMERA_LENSES.find((l) =>
          (parsed.lens || "").toLowerCase().includes(l.id)
        )?.label ||
        form.cameraLens ||
        CAMERA_LENSES[1].label;
      const composedCam = composeCameraDirective(matchedMovement, matchedLens);

      const matchedStyle =
        form.style ||
        STYLE_OPTIONS.find((s) =>
          s.toLowerCase().includes((parsed.style || "").toLowerCase().slice(0, 18))
        ) ||
        parsed.style ||
        STYLE_OPTIONS[0];

      const validPhysicsIds = new Set<PhysicsHintId>(PHYSICS_HINTS.map((h) => h.id));
      const matchedPhysics =
        form.physicsHints.length > 0
          ? form.physicsHints
          : Array.isArray(parsed.physicsHints)
            ? parsed.physicsHints.filter((id): id is PhysicsHintId =>
                validPhysicsIds.has(id as PhysicsHintId)
              )
            : (["gravity", "inertia"] as PhysicsHintId[]);

      const validAudioIds = new Set<AudioTagId>(AUDIO_DESIGN_TAGS.map((t) => t.id));
      const matchedAudioTags =
        form.audioTags.length > 0
          ? form.audioTags
          : engineSpec.kind === "video" && Array.isArray(parsed.audioTags)
            ? parsed.audioTags.filter((id): id is AudioTagId =>
                validAudioIds.has(id as AudioTagId)
              )
            : engineSpec.kind === "video"
              ? (["ambient"] as AudioTagId[])
              : [];

      const validHailuoCmds = new Set(HAILUO_OFFICIAL_COMMANDS.map((c) => c.cmd));
      const matchedHailuoCmds =
        form.minimaxCameraCommands.length > 0
          ? form.minimaxCameraCommands
          : Array.isArray(parsed.minimaxCameraCommands)
            ? parsed.minimaxCameraCommands
                .filter((c) => validHailuoCmds.has(c))
                .slice(0, 3)
            : [];

      let nextDuration = form.duration;
      if (engineSpec.kind === "video" && activeDurationOptions.length > 0 && parsed.duration) {
        const requested = Number(parsed.duration);
        const closest = activeDurationOptions.reduce((best, opt) =>
          Math.abs(opt.value - requested) < Math.abs(best.value - requested)
            ? opt
            : best
        );
        nextDuration = closest.value;
      }

      const nextShotsCount = engineSpec.supportsStoryboard ? 3 : 1;
      const mappedShots =
        Array.isArray(parsed.shots) && parsed.shots.length > 0
          ? buildDefaultShots(
              nextShotsCount,
              parsed.shots.map((s, idx) => ({
                id: idx + 1,
                role: `Shot ${idx + 1}`,
                camera: s.camera || composedCam,
                description: s.description || parsed.action || form.action || "",
              }))
            )
          : form.shots;

      const nextForm: StudioFormState = {
        ...form,
        category: matchedCategory,
        duration: nextDuration,
        cameraMovement: matchedMovement,
        cameraLens: matchedLens,
        camera: form.camera.trim() || composedCam,
        light: form.light.trim() || parsed.lightingMood || "",
        style: matchedStyle,
        physicsHints: matchedPhysics,
        includeAudio: engineSpec.kind === "video",
        audioTags: matchedAudioTags,
        audioDescription:
          engineSpec.kind === "video" && parsed.audioDesign
            ? parsed.audioDesign
            : form.audioDescription,
        veoDialogue: form.veoDialogue.trim() || parsed.dialogue || "",
        veoSoundEffects:
          form.veoSoundEffects.trim() ||
          parsed.soundEffects ||
          parsed.audioDesign ||
          "",
        minimaxCameraCommands: matchedHailuoCmds,
        shotsCount: nextShotsCount,
        shots: mappedShots,
        negative: !engineSpec.supportsNegative
          ? ""
          : form.negative.trim() ||
            parsed.negative ||
            buildSmartNegative(form.engine, form.mode, matchedCategory),
        subject: parsed.subject || form.subject,
        environment:
          form.mode === "i2v" || form.mode === "flf2v"
            ? form.environment
            : parsed.environment || form.environment,
        action: parsed.action || form.action,
        extra: parsed.extra || form.extra,
      };
      setForm(nextForm);
      compileAndSave(nextForm, copy.okAiEnhanced);
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out after 30s."
          : err instanceof Error
            ? err.message
            : "AI enhancement failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setEnhancing(false);
    }
  };

  const handleVeoAutoFill = async () => {
    if (!form.subject.trim() && !form.action.trim()) {
      showStatus(copy.errSubject, "err");
      return;
    }
    await handleAiEnhance();
  };

  const handleAnalyzeImage = async () => {
    if (!referenceImage) return;
    setAnalyzingImage(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: referenceImage.base64,
          mimeType: referenceImage.mimeType,
          engine: form.engine,
        }),
      });
      const data = await safeReadJsonResponse<{
        subject?: string;
        environment?: string;
        action?: string;
        extra?: string;
        error?: string;
        apiStatus?: string;
        retryDelay?: string | null;
      }>(res);
      if (!res.ok) {
        throw new Error(
          formatClientApiError(
            data.error || `HTTP ${res.status}: Image analysis failed.`,
            lang,
            {
              httpStatus: res.status,
              apiStatus: data.apiStatus,
              retryDelay: data.retryDelay,
            }
          )
        );
      }

      const nextForm: StudioFormState = {
        ...form,
        subject: data.subject || form.subject,
        environment: data.environment || form.environment,
        action: data.action || form.action,
        extra: data.extra || form.extra,
      };
      setForm(nextForm);
      compileAndSave(nextForm, copy.okImageAnalyzed);
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Image analysis timed out after 30s."
          : err instanceof Error
            ? err.message
            : "Image analysis failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setAnalyzingImage(false);
    }
  };

  const handleAnalyzeTransition = async () => {
    if (!referenceImage || !endReferenceImage) {
      showStatus(copy.errNeedBothFrames, "err");
      return;
    }
    setAnalyzingTransition(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch("/api/ai/analyze-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          firstImageBase64: referenceImage.base64,
          firstMimeType: referenceImage.mimeType,
          lastImageBase64: endReferenceImage.base64,
          lastMimeType: endReferenceImage.mimeType,
        }),
      });
      const data = await safeReadJsonResponse<{
        subject?: string;
        action?: string;
        extra?: string;
        error?: string;
        apiStatus?: string;
        retryDelay?: string | null;
      }>(res);
      if (!res.ok) {
        throw new Error(
          formatClientApiError(
            data.error || `HTTP ${res.status}: Transition analysis failed.`,
            lang,
            {
              httpStatus: res.status,
              apiStatus: data.apiStatus,
              retryDelay: data.retryDelay,
            }
          )
        );
      }

      const nextForm: StudioFormState = {
        ...form,
        subject: data.subject || form.subject,
        action: data.action || form.action,
        extra: data.extra || form.extra,
      };
      setForm(nextForm);
      compileAndSave(nextForm, copy.okTransitionAnalyzed);
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Transition analysis timed out after 30s."
          : err instanceof Error
            ? err.message
            : "Transition analysis failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setAnalyzingTransition(false);
    }
  };

  const handleFitLength = async () => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const splitParts = outputText.split("NEGATIVE PROMPT:");
    const withoutNeg = splitParts[0] || "";
    const audioSplit = withoutNeg.split(/\n{2,}AUDIO & SOUND DESIGN:\n?/);
    const audioBlock = audioSplit[1]
      ? `AUDIO & SOUND DESIGN:\n${audioSplit[1].trim()}`
      : "";
    const rawPos = (positiveText || audioSplit[0] || "").trim();
    const pos = SmartSceneGuard.strip(rawPos);
    const neg = (negativeText || splitParts[1] || "").trim();
    const currentWords = pos.split(/\s+/).filter(Boolean).length;
    if (currentWords >= 80 && currentWords <= 120) {
      showStatus(copy.okLengthFitted, "ok");
      return;
    }

    setFittingLength(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      let fitted = "";
      if (form.aiProvider === "gemini") {
        const res = await fetch("/api/ai/fit-length", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ prompt: pos }),
        });
        const data = await safeReadJsonResponse<{
          prompt?: string;
          error?: string;
          apiStatus?: string;
          retryDelay?: string | null;
        }>(res);
        if (!res.ok || !data.prompt) {
          throw new Error(
            formatClientApiError(
              data.error || "Failed to fit prompt length.",
              lang,
              {
                httpStatus: res.status,
                apiStatus: data.apiStatus,
                retryDelay: data.retryDelay,
              }
            )
          );
        }
        fitted = SmartSceneGuard.strip(String(data.prompt));
      } else {
        const modelName = form.ollamaModel.trim() || "llama3.1";
        const res = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: `Rewrite this video prompt as one natural English paragraph of 90-110 words. Return JSON {"prompt":"..."}:\n\n${pos}`,
            format: "json",
            stream: false,
          }),
        });
        if (!res.ok) throw new Error(`Ollama error (HTTP ${res.status}).`);
        const json = await safeReadJsonResponse<{ response?: string }>(res);
        const parsed = safeParseClientJson<{ prompt?: string }>(json.response || "{}");
        fitted = SmartSceneGuard.strip(String(parsed.prompt || ""));
      }
      if (!fitted) throw new Error("Empty prompt returned.");

      const guardEnabled =
        engineSpec.kind === "video" && form.smartSceneGuard !== false;
      const finalPositive = guardEnabled
        ? SmartSceneGuard.apply(fitted, SmartSceneGuard.resolveProvider(form.engine))
        : fitted;

      setPositiveText(finalPositive);
      setOutputText(
        [
          finalPositive,
          audioBlock,
          neg ? `NEGATIVE PROMPT:\n${neg}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
      showStatus(copy.okLengthFitted, "ok");
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out after 30s."
          : err instanceof Error
            ? err.message
            : "Length fitting failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setFittingLength(false);
    }
  };

  const handleConvertFormat = async (target: "hailuo02" | "veo31") => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const withoutNeg = outputText.split("NEGATIVE PROMPT:")[0] || "";
    const withoutAudio = withoutNeg.split(/\n{2,}AUDIO & SOUND DESIGN:\n?/)[0] || "";
    const pos = SmartSceneGuard.strip((positiveText || withoutAudio).trim());
    if (!pos) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const isSinger =
      form.mode === "s2v" || form.category === "Vocal & Music Performance";

    setConvertingTarget(target);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      let converted = "";
      if (form.aiProvider === "gemini") {
        const res = await fetch("/api/ai/convert-format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ prompt: pos, target, isSinger }),
        });
        const data = await safeReadJsonResponse<{
          prompt?: string;
          error?: string;
          apiStatus?: string;
          retryDelay?: string | null;
        }>(res);
        if (!res.ok || !data.prompt) {
          throw new Error(
            formatClientApiError(
              data.error || "Conversion failed.",
              lang,
              {
                httpStatus: res.status,
                apiStatus: data.apiStatus,
                retryDelay: data.retryDelay,
              }
            )
          );
        }
        converted = SmartSceneGuard.strip(String(data.prompt));
      } else {
        const modelName = form.ollamaModel.trim() || "llama3.1";
        const instruction =
          target === "veo31"
            ? "Convert to Google Veo 3.1 format ([Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance] + [Audio]). Return JSON {\"prompt\":\"...\"}:"
            : "Convert to MiniMax Hailuo 02 format ([camera movement] + [subject action] + [environment] + [style]). Return JSON {\"prompt\":\"...\"}:";
        const res = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: `${instruction}\n\n${pos}`,
            format: "json",
            stream: false,
          }),
        });
        if (!res.ok) throw new Error(`Ollama error (HTTP ${res.status}).`);
        const json = await safeReadJsonResponse<{ response?: string }>(res);
        const parsed = safeParseClientJson<{ prompt?: string }>(json.response || "{}");
        converted = SmartSceneGuard.strip(String(parsed.prompt || ""));
      }
      if (!converted) throw new Error("Empty converted prompt.");

      const guardProvider = target === "hailuo02" ? "minimax" : "universal";
      const finalConverted =
        form.smartSceneGuard !== false
          ? SmartSceneGuard.apply(converted, guardProvider)
          : converted;

      setPositiveText(finalConverted);
      setOutputText(finalConverted);
      setNegativeText("");
      showStatus(
        target === "veo31" ? copy.okConvertedVeo : copy.okConvertedHailuo,
        "ok"
      );
    } catch (err: unknown) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Conversion timed out after 30s."
          : err instanceof Error
            ? err.message
            : "Conversion failed.";
      showStatus(formatClientApiError(raw, lang), "err");
    } finally {
      clearTimeout(timer);
      setConvertingTarget(null);
    }
  };

  const handleSelectMinimaxDurationPreset = (
    duration: 6 | 10,
    resolution: "1080P" | "768P"
  ) => {
    const safeResolution: "1080P" | "768P" = duration === 10 ? "768P" : resolution;
    const matchingAspect =
      ENGINES.minimax.aspectOptions.find((opt) =>
        safeResolution === "1080P" ? opt.includes("1080p") : opt.includes("768p")
      ) || form.aspect;
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      duration,
      minimaxResolution: safeResolution,
      aspect: matchingAspect,
    }));
  };

  const handleToggleMinimaxCameraCommand = (cmd: string) => {
    pendingResyncRef.current = true;
    setForm((prev) => {
      const current = prev.minimaxCameraCommands || [];
      const exists = current.includes(cmd);
      const nextCmds = exists
        ? current.filter((c) => c !== cmd)
        : current.length >= 3
          ? [...current.slice(1), cmd]
          : [...current, cmd];
      return {
        ...prev,
        minimaxCameraCommands: nextCmds,
      };
    });
  };

  const pollMinimaxTask = async (taskId: string) => {
    let attempts = 0;
    while (attempts < 30) {
      if (activeMinimaxPollRef.current !== taskId) return;
      attempts += 1;
      await new Promise((r) => setTimeout(r, 4000));
      if (activeMinimaxPollRef.current !== taskId) return;
      try {
        const res = await fetch(`/api/minimax/status/${encodeURIComponent(taskId)}`);
        if (activeMinimaxPollRef.current !== taskId) return;
        const data = await safeReadJsonResponse<{
          status?: string;
          videoUrl?: string | null;
          error?: string;
        }>(res);
        if (!res.ok) {
          throw new Error(data.error || "Status query failed.");
        }
        if (data.status === "Success" && data.videoUrl) {
          activeMinimaxPollRef.current = null;
          setMinimaxLaunchState((prev) => ({
            ...prev,
            polling: false,
            statusText: "Success",
            videoUrl: data.videoUrl,
          }));
          showStatus(copy.minimaxLaunchSuccess, "ok");
          return;
        }
        if (data.status === "Fail") {
          activeMinimaxPollRef.current = null;
          setMinimaxLaunchState((prev) => ({
            ...prev,
            polling: false,
            statusText: "Fail",
            error: "MiniMax task failed.",
          }));
          return;
        }
      } catch (err: unknown) {
        if (activeMinimaxPollRef.current !== taskId) return;
        activeMinimaxPollRef.current = null;
        const message = err instanceof Error ? err.message : "Polling error.";
        setMinimaxLaunchState((prev) => ({
          ...prev,
          polling: false,
          error: message,
        }));
        return;
      }
    }
    if (activeMinimaxPollRef.current === taskId) {
      activeMinimaxPollRef.current = null;
      setMinimaxLaunchState((prev) => ({
        ...prev,
        polling: false,
        error:
          lang === "ar"
            ? "انتهت مهلة متابعة التوليد (MiniMax). يمكنك التحقق من حسابك أو إعادة المحاولة."
            : lang === "fr"
              ? "Délai d'attente dépassé pour la génération MiniMax."
              : "MiniMax generation polling timed out.",
      }));
    }
  };

  const handleLaunchMinimax = async () => {
    let sourceForm = form;
    if (
      form.mode === "t2v" &&
      form.subject.trim() &&
      (!form.environment.trim() || !form.action.trim())
    ) {
      const directed = await runAutoSceneDirector(form.subject, form);
      if (directed) {
        sourceForm = directed;
      }
    }

    let promptToSend = "";
    const effectiveDuration = sourceForm.duration === 10 ? 10 : 6;
    const effectiveResolution =
      effectiveDuration === 10 ? "768P" : sourceForm.minimaxResolution || "1080P";

    if (
      sourceForm.subject.trim() ||
      sourceForm.action.trim() ||
      sourceForm.minimaxCustomDirective.trim() ||
      referenceImage ||
      endReferenceImage
    ) {
      const minimaxState: StudioFormState = {
        ...sourceForm,
        engine: "minimax",
        subject:
          sourceForm.subject.trim() ||
          (referenceImage ? "Reference frame subject" : "Hero subject"),
        action:
          sourceForm.action.trim() ||
          sourceForm.minimaxCustomDirective.trim() ||
          "Smooth cinematic physical motion",
        duration: effectiveDuration,
        minimaxResolution: effectiveResolution,
      };
      const compiled = compileEnginePrompt(minimaxState);
      promptToSend = compiled.positiveOnly;
      if (sourceForm.engine === "minimax") {
        setOutputText(compiled.fullPrompt);
        setPositiveText(compiled.positiveOnly);
        setNegativeText("");
        setHasCompiledOnce(true);
      }
    } else if (positiveText.trim() || outputText.trim()) {
      promptToSend = (
        positiveText || outputText.split("NEGATIVE PROMPT:")[0]
      ).trim();
      if (form.smartSceneGuard !== false && promptToSend) {
        promptToSend = SmartSceneGuard.apply(promptToSend, "minimax");
      }
    }

    if (!promptToSend) {
      showStatus(copy.errSubject, "err");
      return;
    }

    const independentJobId = `sg_minimax_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    try {
      await navigator.clipboard.writeText(promptToSend);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = promptToSend;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {
        // ignore clipboard denial in sandboxed browsers
      }
    }

    activeMinimaxPollRef.current = null;
    setMinimaxLaunchState({
      open: true,
      submitting: true,
      polling: false,
      mode: null,
      launchUrl: "https://hailuoai.video/create",
      taskId: null,
      statusText: null,
      videoUrl: null,
      error: null,
      compiledPrompt: promptToSend,
      duration: effectiveDuration,
      resolution: effectiveResolution,
      hasFirstFrame: Boolean(referenceImage),
      hasLastFrame: Boolean(endReferenceImage),
    });

    try {
      const res = await fetch("/api/minimax/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: independentJobId,
          prompt: promptToSend,
          duration: effectiveDuration,
          resolution: effectiveResolution,
          promptOptimizer: form.minimaxPromptOptimizer,
          firstFrameDataUrl: referenceImage?.dataUrl || "",
          lastFrameDataUrl: endReferenceImage?.dataUrl || "",
        }),
      });
      const data = await safeReadJsonResponse<{
        mode?: "api" | "handoff";
        taskId?: string;
        launchUrl?: string;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.mode === "api" && data.taskId) {
        activeMinimaxPollRef.current = data.taskId;
        setMinimaxLaunchState((prev) => ({
          ...prev,
          submitting: false,
          polling: true,
          mode: "api",
          taskId: data.taskId,
        }));
        showStatus(copy.minimaxLaunchPolling, "ok");
        void pollMinimaxTask(data.taskId);
      } else {
        setMinimaxLaunchState((prev) => ({
          ...prev,
          submitting: false,
          polling: false,
          mode: "handoff",
          launchUrl: data.launchUrl || "https://hailuoai.video/create",
        }));
        showStatus(copy.minimaxLaunchCopiedNote, "ok");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "MiniMax request failed.";
      setMinimaxLaunchState((prev) => ({
        ...prev,
        submitting: false,
        polling: false,
        mode: "handoff",
        error: message,
      }));
      showStatus(message, "err");
    }
  };

  const copyToClipboard = async (
    text: string,
    type: "full" | "positive",
    msg: string
  ) => {
    if (!text.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
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
    setCopiedType(type);
    showStatus(msg, "ok");
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleSaveGeneratedPrompt = () => {
    const trimmed = outputText.trim();
    if (!trimmed) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const extracted = extractOutputParts(outputText);
    const pos = positiveText.trim() || extracted.positiveOnly;
    const neg = negativeText.trim() || extracted.negativeOnly;
    const spec = ENGINES[form.engine];
    const titleSource =
      form.subject.trim() ||
      form.action.trim() ||
      pos.split(/\r?\n/)[0]?.trim() ||
      spec.name;
    const titleBody = titleSource.slice(0, 48);
    const prefixedTitle = `${spec.name}${form.category ? ` · ${form.category.split(" ")[0]}` : ""} — ${titleBody}`;

    const existingMatch = history.find((item) => item.prompt.trim() === trimmed);
    const savedEntry: HistoryEntry = existingMatch
      ? {
          ...existingMatch,
          isFavorite: true,
          positiveOnly: pos,
          negativeOnly: neg,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: Date.now(),
          stateSnapshot: { ...form },
        }
      : {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          engine: form.engine,
          wanVariant: form.engine === "wan22" ? form.wanVariant : undefined,
          mode: form.mode,
          category: form.category,
          shotsCount: spec.kind === "video" ? form.shotsCount : 1,
          title: prefixedTitle,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: Date.now(),
          isFavorite: true,
          prompt: outputText,
          positiveOnly: pos,
          negativeOnly: neg,
          stateSnapshot: { ...form },
        };

    setHistory((prev) => [
      savedEntry,
      ...prev.filter((item) => item.id !== savedEntry.id),
    ].slice(0, 60));

    if (currentUser?.emailVerified) {
      void savePromptToCloud(currentUser.uid, savedEntry).catch(() => {});
    }

    setPromptSavedRecently(true);
    showStatus(
      currentUser?.emailVerified ? copy.okPromptSavedCloud : copy.okPromptSaved,
      "ok"
    );
    setTimeout(() => setPromptSavedRecently(false), 1800);
  };

  const handleExportJson = () => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const splitParts = outputText.split("NEGATIVE PROMPT:");
    const pos = positiveText || (splitParts[0] || "").trim();
    const neg = negativeText || (splitParts[1] || form.negative).trim();
    const payload = buildComfyExportPayload(form, pos, neg);

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.engine}_prompt_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(copy.okExportedJson, "ok");
  };

  const handleExportPython = () => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const splitParts = outputText.split("NEGATIVE PROMPT:");
    const pos = positiveText || (splitParts[0] || "").trim();
    const neg = negativeText || (splitParts[1] || form.negative).trim();
    const pyScript = buildPythonPipelineScript(form, pos, neg);

    const blob = new Blob([pyScript], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.engine}_pipeline_${form.seed}.py`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(copy.okExportedPython, "ok");
  };

  const handleDownloadTxt = () => {
    if (!outputText.trim()) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts_${form.engine}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mapGeneratorModelToEngine = (
    model: VideoGeneratorResult["model"]
  ): EngineId => {
    if (model === "minimax") return "minimax";
    if (model === "google") return "veo";
    return "wan22";
  };

  const handleSaveGeneratorResult = (
    result: VideoGeneratorResult,
    idea: string,
    options?: { silent?: boolean }
  ) => {
    const cleanIdea = idea.trim() || "Video Prompt";
    const engineId = mapGeneratorModelToEngine(result.model);
    const entry: HistoryEntry = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      engine: engineId,
      mode: result.mode === "normal" ? "t2v" : "film",
      category: result.style || "cinematic",
      shotsCount: result.scenes.length || 1,
      title: `${result.model.toUpperCase()} · ${
        result.scenes.length > 0 ? `${result.scenes.length} Scenes — ` : ""
      }${cleanIdea.slice(0, 60)}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: Date.now(),
      isFavorite: false,
      prompt: result.formattedOutput,
      positiveOnly: result.singlePrompt || result.formattedOutput,
      negativeOnly: "",
      source: "generator_v1",
      generatorSnapshot: {
        result,
        idea: cleanIdea,
      },
    };
    setActiveGenResult(result);
    setActiveGenIdea(cleanIdea);
    setHistory((prev) => [entry, ...prev].slice(0, 60));
    if (currentUser?.emailVerified) {
      void savePromptToCloud(currentUser.uid, entry).catch(() => {});
    }
    if (!options?.silent) {
      showStatus(
        currentUser?.emailVerified ? copy.okPromptSavedCloud : copy.genPromptSaved,
        "ok"
      );
    }
  };

  const handleSaveSequence = (
    result: VideoGeneratorResult,
    idea: string
  ): boolean => {
    if (!result.scenes || result.scenes.length === 0) return false;
    const cleanIdea = idea.trim() || "Untitled Film Sequence";
    const now = Date.now();
    const existingMatch = savedSequences.find(
      (s) =>
        s.idea.trim().toLowerCase() === cleanIdea.toLowerCase() &&
        s.model === result.model
    );
    const nextItem: SavedSequenceEntry = {
      id: existingMatch
        ? existingMatch.id
        : `seq-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanIdea.slice(0, 80),
      idea: cleanIdea,
      model: result.model,
      mode: result.mode,
      style: result.style,
      lang: result.lang,
      shotLen: result.shotLen,
      scenes: result.scenes,
      consistencyNotes: result.consistencyNotes,
      formattedOutput: result.formattedOutput,
      createdAt: now,
      isFavorite: existingMatch ? existingMatch.isFavorite : false,
    };

    setSavedSequences((prev) => [
      nextItem,
      ...prev.filter((s) => s.id !== nextItem.id),
    ].slice(0, 50));

    if (currentUser?.emailVerified) {
      void saveSequenceToCloud(currentUser.uid, nextItem).catch(() => {});
    }
    return true;
  };

  const handleLoadSequence = (seq: SavedSequenceEntry) => {
    const reconstructed: VideoGeneratorResult = {
      version: "1.0",
      model: seq.model,
      mode: seq.mode,
      style: seq.style,
      lang: seq.lang,
      shotLen: seq.shotLen,
      singlePrompt: seq.scenes[0]?.prompt || seq.formattedOutput,
      scenes: seq.scenes,
      consistencyNotes: seq.consistencyNotes,
      formattedOutput: seq.formattedOutput,
    };
    setActiveGenResult(reconstructed);
    setActiveGenIdea(seq.idea);
    setActiveTab("generator");
    showStatus(copy.okRestored, "ok");
  };

  const handleApplySequenceProps = (seq: SavedSequenceEntry) => {
    setGenPresetProps({
      model: seq.model,
      mode: seq.mode,
      scenes: seq.scenes.length,
      shotLen: seq.shotLen,
      style: seq.style,
      lang: seq.lang,
      nonce: Date.now(),
    });
    setActiveTab("generator");
    showStatus(copy.historyPropsApplied, "ok");
  };

  const handleSendGeneratorToStudio = (
    result: VideoGeneratorResult,
    idea: string
  ) => {
    const targetEngine = mapGeneratorModelToEngine(result.model);
    handleSelectEngine(targetEngine);
    const primaryPrompt =
      result.scenes[0]?.prompt || result.singlePrompt || result.formattedOutput;
    setForm((prev) => ({
      ...prev,
      engine: targetEngine,
      subject: idea.trim() || prev.subject,
      style: result.style || prev.style,
    }));
    setOutputText(result.formattedOutput);
    setPositiveText(primaryPrompt);
    setNegativeText("");
    setHasCompiledOnce(true);

    if (result.scenes.length > 0) {
      const importedItems: SceneChainItem[] = result.scenes.map((sc, idx) => ({
        id: idx + 1,
        order: sc.sceneNumber || idx + 1,
        idea: sc.narrativeBeat || `${idea.trim()} #${idx + 1}`,
        prompt: sc.prompt,
        positiveOnly: sc.prompt,
        negativeOnly: "",
        engine: targetEngine,
        createdAt: Date.now() + idx,
        sceneId: `scene_${sc.sceneNumber || idx + 1}`,
      }));
      setSceneChain({
        baseContext: {
          engine: targetEngine,
          style: result.style,
          character: result.consistencyNotes?.character || idea.trim(),
          environment: result.consistencyNotes?.palette || "",
          camera: result.consistencyNotes?.lens || "",
          lighting: "",
          seed: form.seed,
        },
        scenes: importedItems,
      });
    }
    setActiveTab("studio");
    showStatus(copy.okRestored, "ok");
  };

  const handleSaveDirectorResult = (
    options: DirectorEnhanceOptions,
    output: string
  ) => {
    const engineMap: Record<string, EngineId> = {
      veo: "veo",
      wan: "wan22",
      minimax: "minimax",
      hailuo: "minimax",
    };
    const mappedEngine: EngineId =
      engineMap[String(options.engine || "veo")] || "veo";
    const entry: HistoryEntry = {
      id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      engine: mappedEngine,
      mode: "t2v",
      category: options.genre || "cinematic",
      shotsCount: 1,
      title: `Director v2.0 · ${String(options.engine || "veo").toUpperCase()} — ${(
        options.prompt || "Untitled"
      ).slice(0, 60)}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: Date.now(),
      isFavorite: false,
      prompt: output,
      positiveOnly: output,
      negativeOnly: (options.negatives || []).join(", "),
      source: "director_v2",
      directorSnapshot: {
        options,
        output,
      },
    };
    setActiveDirectorSnapshot({ options, output });
    setHistory((prev) => [entry, ...prev].slice(0, 60));
    if (currentUser?.emailVerified) {
      void savePromptToCloud(currentUser.uid, entry).catch(() => {});
    }
  };

  const handleApplyHistoryEntryProps = (entry: HistoryEntry) => {
    if (entry.source === "director_v2" && entry.directorSnapshot) {
      const { prompt: _omitPrompt, ...restOptions } =
        entry.directorSnapshot.options;
      void _omitPrompt;
      setDirectorPresetProps({
        options: restOptions,
        nonce: Date.now(),
      });
      setActiveTab("director");
      showStatus(copy.historyPropsApplied, "ok");
      return;
    }
    if (entry.source === "generator_v1" && entry.generatorSnapshot) {
      const r = entry.generatorSnapshot.result;
      setGenPresetProps({
        model: r.model,
        mode: r.mode,
        scenes: r.scenes.length || 10,
        shotLen: r.shotLen,
        style: r.style,
        lang: r.lang,
        nonce: Date.now(),
      });
      setActiveTab("generator");
      showStatus(copy.historyPropsApplied, "ok");
      return;
    }
    const snap = entry.stateSnapshot;
    const safeEngine: EngineId = isValidEngineId(entry.engine)
      ? entry.engine
      : "wan22";
    setForm((prev) => ({
      ...prev,
      engine: safeEngine,
      wanVariant: snap?.wanVariant || entry.wanVariant || prev.wanVariant,
      mode: snap?.mode || entry.mode || prev.mode,
      aspect: snap?.aspect || prev.aspect,
      duration:
        typeof snap?.duration === "number" ? snap.duration : prev.duration,
      style: snap?.style || prev.style,
      camera: snap?.camera || prev.camera,
      cameraMovement: snap?.cameraMovement || prev.cameraMovement,
      cameraLens: snap?.cameraLens || prev.cameraLens,
      light: snap?.light || prev.light,
    }));
    setActiveTab("studio");
    showStatus(copy.historyPropsApplied, "ok");
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    if (entry.source === "generator_v1" && entry.generatorSnapshot) {
      setActiveGenResult(entry.generatorSnapshot.result);
      setActiveGenIdea(entry.generatorSnapshot.idea);
      setActiveTab("generator");
      showStatus(copy.okRestored, "ok");
      return;
    }
    if (entry.source === "director_v2" && entry.directorSnapshot) {
      setActiveDirectorSnapshot(entry.directorSnapshot);
      setActiveTab("director");
      showStatus(copy.okRestored, "ok");
      return;
    }

    const safeEngine: EngineId = isValidEngineId(entry.engine)
      ? entry.engine
      : "wan22";
    const spec = ENGINES[safeEngine];
    const restoredShotsCount = spec.supportsStoryboard
      ? Math.max(1, Math.min(4, entry.stateSnapshot?.shotsCount || entry.shotsCount || 1))
      : 1;
    setForm((prev) => {
      const snap = entry.stateSnapshot;
      const nextVariant: WanVariant =
        snap?.wanVariant || entry.wanVariant || prev.wanVariant;
      const variantSpec = WAN_VARIANTS[nextVariant];
      const allowedModes =
        safeEngine === "wan22" ? variantSpec.modes : spec.modes;
      const allowedAspects =
        safeEngine === "wan22" ? variantSpec.aspectOptions : spec.aspectOptions;
      const allowedDurations =
        safeEngine === "wan22" ? variantSpec.durationOptions : spec.durationOptions;
      const nextMode: GenerationMode = allowedModes.includes(
        snap?.mode || entry.mode
      )
        ? snap?.mode || entry.mode
        : spec.defaultMode;
      const nextAspect =
        snap?.aspect && allowedAspects.includes(snap.aspect)
          ? snap.aspect
          : allowedAspects[0];
      const nextDuration =
        spec.kind === "video"
          ? allowedDurations.some((d) => d.value === snap?.duration)
            ? Number(snap?.duration)
            : spec.defaultDuration
          : 0;

      return {
        ...prev,
        ...(snap || {}),
        engine: safeEngine,
        wanVariant: nextVariant,
        mode: nextMode,
        aspect: nextAspect,
        duration: nextDuration,
        smartSceneGuard:
          typeof snap?.smartSceneGuard === "boolean"
            ? snap.smartSceneGuard
            : prev.smartSceneGuard,
        shotsCount: restoredShotsCount,
        shots: buildDefaultShots(restoredShotsCount, snap?.shots || []),
      };
    });
    setOutputText(entry.prompt);
    setPositiveText(entry.positiveOnly);
    setNegativeText(entry.negativeOnly);
    setHasCompiledOnce(true);
    setActiveTab("studio");
    showStatus(copy.okRestored, "ok");
  };

  const handleResetAll = () => {
    localStorage.removeItem(STATE_STORAGE_KEY);
    localStorage.removeItem(SCENE_CHAIN_STORAGE_KEY);
    resetPersistedForm();
    clearPersistedOutput();
    setPositiveText("");
    setNegativeText("");
    setHasCompiledOnce(false);
    setReferenceImage(null);
    setEndReferenceImage(null);
    setActivePresetId(null);
    setConfirmNegReset(false);
    setChainError(null);
    setSceneChain({ baseContext: null, scenes: [] });
    showStatus(copy.okReset, "ok");
  };

  const studioBackupInputRef = useRef<HTMLInputElement | null>(null);

  const handleBackupStudioState = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

    const backupPayload = {
      schema: "videoprompts-studio-state-backup",
      version: 1,
      exportedAt: now.toISOString(),
      workspace: {
        lang,
        theme,
        activePresetId,
      },
      studioState: form,
      output: {
        outputText,
        positiveText,
        negativeText,
        hasCompiledOnce,
      },
      sceneChain,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `videoprompts-studio-backup-${form.engine}-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus(copy.okStudioBackupSaved, "ok");
  };

  const handleRestoreStudioBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const parsed = JSON.parse(raw) as {
          schema?: string;
          workspace?: {
            lang?: Language;
            theme?: ThemeMode;
            activePresetId?: string | null;
          };
          studioState?: Partial<StudioFormState>;
          form?: Partial<StudioFormState>;
          output?: {
            outputText?: string;
            positiveText?: string;
            negativeText?: string;
            hasCompiledOnce?: boolean;
          };
          sceneChain?: SceneChainState;
        };

        const rawStudio =
          parsed && typeof parsed === "object"
            ? parsed.studioState ?? parsed.form ?? (isValidEngineId((parsed as Record<string, unknown>).engine) ? (parsed as unknown as Partial<StudioFormState>) : null)
            : null;

        if (!rawStudio || typeof rawStudio !== "object") {
          showStatus(copy.errStudioBackupInvalid, "err");
          return;
        }

        const targetEngine: EngineId = isValidEngineId(rawStudio.engine)
          ? rawStudio.engine
          : form.engine;
        const baseDefaults = createInitialFormState();
        const targetShotsCount =
          typeof rawStudio.shotsCount === "number" &&
          rawStudio.shotsCount >= 1 &&
          rawStudio.shotsCount <= 10
            ? Math.round(rawStudio.shotsCount)
            : baseDefaults.shotsCount;

        setForm({
          ...baseDefaults,
          ...rawStudio,
          engine: targetEngine,
          shotsCount: targetShotsCount,
          shots: buildDefaultShots(
            targetShotsCount,
            Array.isArray(rawStudio.shots) ? rawStudio.shots : baseDefaults.shots
          ),
        });

        if (parsed.workspace?.lang && ["ar", "fr", "en"].includes(parsed.workspace.lang)) {
          setLang(parsed.workspace.lang);
        }
        if (parsed.workspace?.theme && ["dark", "light"].includes(parsed.workspace.theme)) {
          setTheme(parsed.workspace.theme);
        }
        if ("activePresetId" in (parsed.workspace ?? {})) {
          setActivePresetId(parsed.workspace?.activePresetId ?? null);
        }

        if (parsed.output && typeof parsed.output === "object") {
          if (typeof parsed.output.outputText === "string") {
            setOutputText(parsed.output.outputText);
          }
          if (typeof parsed.output.positiveText === "string") {
            setPositiveText(parsed.output.positiveText);
          }
          if (typeof parsed.output.negativeText === "string") {
            setNegativeText(parsed.output.negativeText);
          }
          if (typeof parsed.output.hasCompiledOnce === "boolean") {
            setHasCompiledOnce(parsed.output.hasCompiledOnce);
          }
        }

        if (
          parsed.sceneChain &&
          typeof parsed.sceneChain === "object" &&
          Array.isArray(parsed.sceneChain.scenes)
        ) {
          setSceneChain({
            baseContext: parsed.sceneChain.baseContext ?? null,
            scenes: parsed.sceneChain.scenes,
          });
        }

        showStatus(copy.okStudioBackupRestored, "ok");
      } catch {
        showStatus(copy.errStudioBackupInvalid, "err");
      }
    };
    reader.onerror = () => {
      showStatus(copy.errStudioBackupInvalid, "err");
    };
    reader.readAsText(file);
  };

  const handleAddNextScene = async (rawIdea: string): Promise<boolean> => {
    const cleanIdea = rawIdea.trim();
    if (!cleanIdea) {
      showStatus(copy.errSubject, "err");
      return false;
    }

    const guardEnabled =
      engineSpec.kind === "video" && form.smartSceneGuard !== false;
    const guardProvider = SmartSceneGuard.resolveProvider(form.engine);
    const sceneIsolationContext = [
      SmartSceneGuard.providerRules[guardProvider],
      SmartSceneGuard.isolationRules,
      SmartSceneGuard.negativeRules,
      CinematicPromptRules.build(form.engine),
      CinematicPromptRules.seriesBibleRules,
    ].join("\n\n");

    const baseCtx: SceneChainContext = sceneChain.baseContext ?? {
      engine: form.engine,
      style: form.style,
      character: form.subject,
      environment: form.environment,
      camera: form.camera,
      lighting: form.light,
      seed: form.seed,
    };

    const existingScenes: SceneChainItem[] =
      sceneChain.scenes.length > 0
        ? sceneChain.scenes
        : outputText.trim()
          ? [
              {
                id: 1,
                order: 1,
                idea: form.subject.trim() || form.action.trim() || engineSpec.name,
                prompt: outputText,
                positiveOnly: guardEnabled
                  ? SmartSceneGuard.apply(positiveText || outputText, guardProvider)
                  : positiveText || outputText,
                negativeOnly: negativeText,
                engine: form.engine,
                createdAt: Date.now(),
                sceneId: "scene_1",
                jobId: `sg_chain_1_${Date.now()}`,
              },
            ]
          : [];

    const lastScene = existingScenes[existingScenes.length - 1];
    const nextOrder = existingScenes.length + 1;
    const sceneJobId = `sg_chain_${nextOrder}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const previousNarrativePrompt = SmartSceneGuard.strip(
      lastScene?.positiveOnly || lastScene?.prompt || outputText
    );

    setAddingNextScene(true);
    setChainError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    try {
      let parsed: {
        jobId?: string;
        transitionNote?: string;
        subject?: string;
        environment?: string;
        action?: string;
        extra?: string;
        cameraMovement?: string;
        lens?: string;
        lightingMood?: string;
        style?: string;
        dialogue?: string;
        soundEffects?: string;
        minimaxCameraCommands?: string[];
        continuityState?: string;
      } = {};

      if (form.aiProvider === "gemini") {
        const res = await fetch("/api/ai/next-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            engine: form.engine,
            wanVariant: form.wanVariant,
            mode: form.mode,
            sceneOrder: nextOrder,
            baseContext: baseCtx,
            previousPrompt: previousNarrativePrompt,
            previousIdea: lastScene?.idea || form.subject,
            previousEndingState: lastScene?.continuityState || "",
            newIdea: cleanIdea,
            jobId: sceneJobId,
            sceneGuardEnabled: guardEnabled,
            sceneGuardProvider: guardProvider,
            sceneGuardRules: guardEnabled ? sceneIsolationContext : "",
          }),
        });
        const data = await safeReadJsonResponse<{
          error?: string;
          apiStatus?: string;
          retryDelay?: string | null;
          [key: string]: unknown;
        }>(res);
        if (!res.ok) {
          throw new Error(
            formatClientApiError(
              data.error || `HTTP ${res.status}: Failed to generate next scene.`,
              lang,
              {
                httpStatus: res.status,
                apiStatus: data.apiStatus,
                retryDelay: data.retryDelay,
              }
            )
          );
        }
        parsed = data as typeof parsed;
      } else {
        const modelName = form.ollamaModel.trim() || "llama3.1";
        const sysPrompt = `You are an AI continuity screenwriter for ${engineSpec.name} (Independent Job ID: ${sceneJobId}). Keep character "${baseCtx.character}", style "${baseCtx.style}", and environment "${baseCtx.environment}" consistent with the previous scene, and write Scene #${nextOrder} for the new idea "${cleanIdea}". Return strictly JSON with keys: transitionNote, subject, environment, action, extra, cameraMovement, lens, lightingMood, style, dialogue, soundEffects, minimaxCameraCommands.${
          guardEnabled
            ? `\n\n[SMART SCENE GUARD — SCENE ISOLATION CONTEXT (${guardProvider})]\n${sceneIsolationContext}\n(Enforce these scene isolation rules conceptually without copying raw isolation tags into the JSON fields.)`
            : ""
        }`;
        const res = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: `${sysPrompt}\n\nPrevious Scene:\n${previousNarrativePrompt}`,
            format: "json",
            stream: false,
          }),
        });
        if (!res.ok) {
          throw new Error(`Ollama error (HTTP ${res.status}).`);
        }
        const data = await safeReadJsonResponse<{ response?: string }>(res);
        parsed = safeParseClientJson<typeof parsed>(data.response || "{}");
      }

      const matchedMovement =
        CAMERA_MOVEMENTS.find(
          (m) =>
            (parsed.cameraMovement || "").toLowerCase().includes(m.id) ||
            (parsed.cameraMovement || "")
              .toLowerCase()
              .includes(m.label.toLowerCase().split(" ")[0])
        )?.label ||
        form.cameraMovement ||
        CAMERA_MOVEMENTS[0].label;

      const matchedLens =
        CAMERA_LENSES.find((l) =>
          (parsed.lens || "").toLowerCase().includes(l.id)
        )?.label ||
        form.cameraLens ||
        CAMERA_LENSES[1].label;

      const composedCam =
        baseCtx.camera || composeCameraDirective(matchedMovement, matchedLens);

      const validHailuoCmds = new Set(HAILUO_OFFICIAL_COMMANDS.map((c) => c.cmd));
      const matchedHailuoCmds =
        Array.isArray(parsed.minimaxCameraCommands) &&
        parsed.minimaxCameraCommands.length > 0
          ? parsed.minimaxCameraCommands
              .filter((c) => validHailuoCmds.has(c))
              .slice(0, 3)
          : form.minimaxCameraCommands;

      const transitionAction = [
        parsed.transitionNote?.trim(),
        parsed.action?.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const nextForm: StudioFormState = {
        ...form,
        seed: baseCtx.seed,
        seedLocked: true,
        subject: parsed.subject?.trim() || baseCtx.character || form.subject,
        environment:
          parsed.environment?.trim() || baseCtx.environment || form.environment,
        action: transitionAction || cleanIdea,
        extra: parsed.extra?.trim() || form.extra,
        cameraMovement: matchedMovement,
        cameraLens: matchedLens,
        camera: composedCam,
        light: parsed.lightingMood?.trim() || baseCtx.lighting || form.light,
        style: baseCtx.style || parsed.style?.trim() || form.style,
        veoDialogue: parsed.dialogue?.trim() || "",
        veoSoundEffects: parsed.soundEffects?.trim() || form.veoSoundEffects,
        minimaxCameraCommands: matchedHailuoCmds,
      };

      const compiled = compileEnginePrompt(nextForm);
      const isolatedScene = guardEnabled
        ? SmartSceneGuard.separateScenes([compiled.positiveOnly], guardProvider)[0]
        : null;
      const guardedPositive = isolatedScene
        ? isolatedScene.prompt
        : compiled.positiveOnly;
      const guardedFullPrompt = guardEnabled
        ? [
            guardedPositive,
            compiled.audioBlock,
            engineSpec.supportsNegative && compiled.negativeOnly
              ? `NEGATIVE PROMPT:\n${compiled.negativeOnly}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : compiled.fullPrompt;

      setForm(nextForm);
      setOutputText(guardedFullPrompt);
      setPositiveText(guardedPositive);
      setNegativeText(compiled.negativeOnly);
      setHasCompiledOnce(true);

      const newSceneItem: SceneChainItem = {
        id: nextOrder,
        order: nextOrder,
        idea: cleanIdea,
        prompt: guardedFullPrompt,
        positiveOnly: guardedPositive,
        negativeOnly: compiled.negativeOnly,
        engine: nextForm.engine,
        createdAt: Date.now(),
        sceneId: `scene_${nextOrder}`,
        jobId: parsed.jobId || isolatedScene?.jobId || sceneJobId,
        continuityState: parsed.continuityState?.trim() || undefined,
      };

      setSceneChain({
        baseContext: baseCtx,
        scenes: [...existingScenes, newSceneItem],
      });

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        engine: nextForm.engine,
        wanVariant: nextForm.engine === "wan22" ? nextForm.wanVariant : undefined,
        mode: nextForm.mode,
        category: nextForm.category,
        shotsCount: engineSpec.kind === "video" ? nextForm.shotsCount : 1,
        title: `${engineSpec.name} · ${copy.chainSceneLabel} ${nextOrder} — ${cleanIdea.slice(0, 40)}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: Date.now(),
        isFavorite: false,
        prompt: guardedFullPrompt,
        positiveOnly: guardedPositive,
        negativeOnly: compiled.negativeOnly,
        stateSnapshot: { ...nextForm },
      };
      setHistory((prev) => [entry, ...prev].slice(0, 60));
      if (currentUser?.emailVerified) {
        void savePromptToCloud(currentUser.uid, entry).catch(() => {});
      }

      setChainError(null);
      showStatus(copy.chainOkAdded, "ok");
      return true;
    } catch (err: unknown) {
      console.error("handleAddNextScene error:", err);
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "Next scene generation timed out after 55s."
          : err instanceof Error
            ? err.message
            : "Next scene generation failed.";
      const cleanMsg = formatClientApiError(raw, lang);
      setChainError(cleanMsg);
      showStatus(cleanMsg, "err");
      return false;
    } finally {
      clearTimeout(timer);
      setAddingNextScene(false);
    }
  };

  const handleGenerateTenSceneFilm = async (
    ideaOverride?: string
  ): Promise<boolean> => {
    const cleanIdea = (
      ideaOverride?.trim() ||
      form.subject.trim() ||
      form.action.trim()
    ).trim();
    if (!cleanIdea) {
      showStatus(copy.errSubject, "err");
      return false;
    }

    const generatorModel: VideoGeneratorResult["model"] =
      form.engine === "minimax"
        ? "minimax"
        : form.engine === "veo"
        ? "google"
        : "wan";
    const shotLen = Math.max(4, Math.min(10, Number(form.duration) || 6));

    setGeneratingFilmChain(true);
    setChainError(null);

    try {
      const data = await safeFetchJson<VideoGeneratorResult>(
        "/api/ai/video-generator",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: cleanIdea,
            model: generatorModel,
            mode: "film_10",
            scenes: 10,
            shotLen,
            style: form.style || "cinematic_film",
            lang: "en",
          }),
        },
        lang
      );

      if (!data.scenes || data.scenes.length === 0) {
        throw new Error(
          lang === "ar"
            ? "لم يتم إرجاع مشاهد للسلسلة، يرجى المحاولة مجدداً."
            : "No film scenes were returned. Please try again."
        );
      }

      const now = Date.now();
      const chainItems: SceneChainItem[] = data.scenes.map((sc, idx) => ({
        id: idx + 1,
        order: sc.sceneNumber || idx + 1,
        idea: sc.narrativeBeat || `${cleanIdea.slice(0, 60)} #${idx + 1}`,
        prompt: sc.prompt,
        positiveOnly: sc.prompt,
        negativeOnly: "",
        engine: form.engine,
        createdAt: now + idx,
        sceneId: `scene_${sc.sceneNumber || idx + 1}`,
        jobId: `sg_film10_${idx + 1}_${now}`,
      }));

      setSceneChain({
        baseContext: {
          engine: form.engine,
          style: data.style || form.style,
          character: data.consistencyNotes?.character || cleanIdea,
          environment: data.consistencyNotes?.palette || form.environment,
          camera: data.consistencyNotes?.lens || form.camera,
          lighting: form.light,
          seed: form.seed,
        },
        scenes: chainItems,
      });

      setOutputText(data.formattedOutput);
      setPositiveText(data.scenes[0]?.prompt || data.formattedOutput);
      setNegativeText("");
      setHasCompiledOnce(true);

      handleSaveSequence(data, cleanIdea);
      handleSaveGeneratorResult(data, cleanIdea, { silent: true });

      showStatus(
        lang === "ar"
          ? `تم توليد سلسلة فيلم من ${chainItems.length} برومبتات متتالية وحفظها في السجل.`
          : lang === "fr"
          ? `Série film de ${chainItems.length} prompts consécutifs générée et enregistrée.`
          : `Generated a ${chainItems.length}-prompt sequential film chain and saved it to History.`,
        "ok"
      );
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : lang === "ar"
          ? "فشل توليد سلسلة الـ 10 برومبتات."
          : "Failed to generate 10-prompt film chain.";
      setChainError(msg);
      showStatus(msg, "err");
      return false;
    } finally {
      setGeneratingFilmChain(false);
    }
  };

  const handleLoadChainScene = (scene: SceneChainItem) => {
    setOutputText(scene.prompt);
    setPositiveText(scene.positiveOnly);
    setNegativeText(scene.negativeOnly);
    setHasCompiledOnce(true);
    showStatus(copy.okRestored, "ok");
  };

  const handleSaveSceneChainToSequences = () => {
    if (sceneChain.scenes.length === 0) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const baseModel: VideoGeneratorResult["model"] =
      form.engine === "minimax"
        ? "minimax"
        : form.engine === "veo"
        ? "google"
        : "wan";
    const firstIdea =
      sceneChain.baseContext?.character?.trim() ||
      sceneChain.scenes[0]?.idea?.trim() ||
      form.subject.trim() ||
      "Studio Scene Chain";
    const formattedOutput = sceneChain.scenes
      .map(
        (sc) =>
          `Scene ${sc.order} — ${sc.idea}\n${sc.prompt}${
            sc.continuityState
              ? `\nCONTINUITY HANDOFF: ${sc.continuityState}`
              : ""
          }`
      )
      .join("\n\n");
    const syntheticResult: VideoGeneratorResult = {
      version: "1.0",
      model: baseModel,
      mode: sceneChain.scenes.length >= 10 ? "film_10" : "film",
      style: sceneChain.baseContext?.style || form.style || "cinematic_film",
      lang: lang === "ar" ? "ar" : "en",
      shotLen: Math.max(4, Math.min(10, Number(form.duration) || 6)),
      singlePrompt: sceneChain.scenes[0]?.prompt || formattedOutput,
      scenes: sceneChain.scenes.map((sc, idx) => ({
        sceneNumber: sc.order || idx + 1,
        narrativeBeat: sc.idea || `Scene ${idx + 1}`,
        prompt: sc.prompt,
      })),
      consistencyNotes: sceneChain.baseContext
        ? {
            character: sceneChain.baseContext.character || "",
            palette: sceneChain.baseContext.environment || "",
            lens: sceneChain.baseContext.camera || "",
          }
        : null,
      formattedOutput,
    };

    handleSaveSequence(syntheticResult, firstIdea);
    setChainSavedRecently(true);
    showStatus(
      currentUser?.emailVerified
        ? copy.okSequenceSavedCloud
        : copy.okChainSequenceSaved,
      "ok"
    );
    window.setTimeout(() => setChainSavedRecently(false), 1800);
  };

  const handleExportChain = () => {
    if (sceneChain.scenes.length === 0) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const text = sceneChain.scenes
      .map((s) => {
        const handoff = s.continuityState
          ? `\n\nCONTINUITY HANDOFF FOR NEXT SCENE: ${s.continuityState}`
          : "";
        return `=== ${copy.chainSceneLabel} ${s.order}: ${s.idea} (${ENGINES[s.engine]?.name || s.engine}) ===\n${s.prompt}${handoff}`;
      })
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts_scene_chain_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChainJson = () => {
    if (sceneChain.scenes.length === 0) {
      showStatus(copy.errEmptyOutput, "err");
      return;
    }
    const payload: SceneChainState = {
      baseContext: sceneChain.baseContext,
      scenes: sceneChain.scenes,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `videoprompts_scene_chain_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(copy.okExportedJson, "ok");
  };

  const handleImportChainFile = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = parseSceneChainInput(raw, form);
      if (!parsed || parsed.scenes.length === 0) {
        showStatus(copy.chainImportErr, "err");
        return;
      }

      setSceneChain(parsed);
      const lastScene = parsed.scenes[parsed.scenes.length - 1];
      setOutputText(lastScene.prompt);
      setPositiveText(lastScene.positiveOnly);
      setNegativeText(lastScene.negativeOnly);
      setHasCompiledOnce(true);

      if (parsed.baseContext) {
        const ctx = parsed.baseContext;
        setForm((prev) => {
          const nextEngine: EngineId = isValidEngineId(ctx.engine)
            ? ctx.engine
            : prev.engine;
          const nextSpec = ENGINES[nextEngine];
          const variantSpec = WAN_VARIANTS[prev.wanVariant];
          const allowedModes =
            nextEngine === "wan22" ? variantSpec.modes : nextSpec.modes;
          const allowedAspects =
            nextEngine === "wan22"
              ? variantSpec.aspectOptions
              : nextSpec.aspectOptions;
          const allowedDurations =
            nextEngine === "wan22"
              ? variantSpec.durationOptions
              : nextSpec.durationOptions;
          const nextMode = allowedModes.includes(prev.mode)
            ? prev.mode
            : nextSpec.defaultMode;
          const nextAspect = allowedAspects.includes(prev.aspect)
            ? prev.aspect
            : allowedAspects[0];
          const nextDuration =
            nextSpec.kind === "video"
              ? allowedDurations.some((d) => d.value === prev.duration)
                ? prev.duration
                : nextSpec.defaultDuration
              : 0;
          return {
            ...prev,
            engine: nextEngine,
            mode: nextMode,
            aspect: nextAspect,
            duration: nextDuration,
            shotsCount: nextSpec.supportsStoryboard ? prev.shotsCount : 1,
            cfgScale:
              nextEngine === "wan22"
                ? variantSpec.defaultCfg
                : nextSpec.defaultCfg,
            steps:
              nextEngine === "wan22"
                ? variantSpec.defaultSteps
                : nextSpec.defaultSteps,
            style: ctx.style || prev.style,
            subject: ctx.character || prev.subject,
            environment: ctx.environment || prev.environment,
            camera: ctx.camera || prev.camera,
            light: ctx.lighting || prev.light,
            seed: ctx.seed ?? prev.seed,
            seedLocked: true,
          };
        });
      }

      setChainError(null);
      showStatus(copy.chainImportedOk, "ok");
    } catch {
      showStatus(copy.chainImportErr, "err");
    }
  };

  const handleClearChain = () => {
    setChainError(null);
    setSceneChain((prev) =>
      prev.scenes.length > 0
        ? { ...prev, scenes: [prev.scenes[0]] }
        : { baseContext: null, scenes: [] }
    );
  };

  const handleNegativeRegenClick = () => {
    if (form.negativeEdited && !confirmNegReset) {
      setConfirmNegReset(true);
      return;
    }
    setConfirmNegReset(false);
    pendingResyncRef.current = true;
    setForm((prev) => ({
      ...prev,
      negative: buildSmartNegative(prev.engine, prev.mode, prev.category),
      negativeEdited: false,
    }));
  };

  const inputBaseClass =
    "min-h-[44px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#D4A34B] dark:focus:bg-[#0E1118]";

  const labelBaseClass =
    "mb-1.5 block text-right text-xs font-semibold text-slate-700 dark:text-slate-300";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F7F9] pb-[72px] text-slate-900 md:pb-0 dark:bg-[#0B0D12] dark:text-slate-100">
      <TopBar
        copy={copy}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onBuildPrompt={() => void handleSmartBuild()}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => {
          if (activeTab !== "studio") {
            setActiveTab("studio");
            setMobileMenuOpen(true);
          } else {
            setMobileMenuOpen((v) => !v);
          }
        }}
        isAdmin={isAdmin}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUser?.displayName ?? null}
        currentUserPhoto={currentUser?.photoURL ?? null}
        authLoading={authLoading}
        totalVisits={visitorStats?.totalVisits ?? null}
        onSignIn={() => void handleUserSignIn()}
        onSignOut={() => void handleUserSignOut()}
      />

      {isAdmin && (
        <div className="mx-auto max-w-[1440px] px-3.5 pt-4 sm:px-6 lg:px-8">
          <AdminVisitorCounter
            copy={copy}
            adminEmail={currentUserEmail}
            stats={visitorStats}
            loading={visitorStatsLoading}
            onRefresh={() => void handleRefreshVisitorStats()}
            onSignOut={() => void handleUserSignOut()}
          />
        </div>
      )}

      {activeTab !== "studio" && status.msg && (
        <div className="mx-auto max-w-[1440px] px-3.5 pt-3 sm:px-6 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2.5 overflow-hidden rounded-lg border px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
              status.type === "err"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300"
            }`}
          >
            {status.type === "err" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 break-words">{status.msg}</span>
          </div>
        </div>
      )}

      {activeTab === "portal" ? (
        <LuxuryPortalView
          copy={copy}
          lang={lang}
          onEnterStudio={(engineId) => {
            if (engineId) handleSelectEngine(engineId);
            setActiveTab("studio");
          }}
          onOpenGuide={() => setActiveTab("guide")}
          onOpenGenerator={() => setActiveTab("generator")}
          onOpenDirector={() => setActiveTab("director")}
        />
      ) : activeTab === "generator" ? (
        <VideoPromptGeneratorView
          lang={lang}
          activeResult={activeGenResult}
          activeIdea={activeGenIdea}
          appliedProps={genPresetProps}
          onResultChange={(nextRes, nextIdea) => {
            setActiveGenResult(nextRes);
            setActiveGenIdea(nextIdea);
          }}
          savedPrompts={history}
          onLoadSavedPrompt={handleRestoreHistory}
          onToggleFavoritePrompt={handleToggleFavorite}
          onDeleteSavedPrompt={handleDeleteHistoryEntry}
          savedSequences={savedSequences}
          onSaveSequence={handleSaveSequence}
          onLoadSequence={handleLoadSequence}
          onDeleteSequence={handleDeleteSequenceEntry}
          onSaveToHistory={handleSaveGeneratorResult}
          onSendToStudio={handleSendGeneratorToStudio}
          onNotify={(msg) => showStatus(msg, "ok")}
        />
      ) : activeTab === "director" ? (
        <DirectorEngineView
          lang={lang}
          activeSnapshot={activeDirectorSnapshot}
          appliedProps={directorPresetProps}
          onSaveToHistory={handleSaveDirectorResult}
          onNotify={(msg) => showStatus(msg, "ok")}
        />
      ) : activeTab === "guide" ? (
        <EngineGuideView
          copy={copy}
          lang={lang}
          activeEngine={form.engine}
          onSelectEngineForStudio={(id) => {
            handleSelectEngine(id);
            setActiveTab("studio");
          }}
        />
      ) : activeTab === "history" ? (
        <HistoryView
          copy={copy}
          lang={lang}
          history={history}
          savedSequences={savedSequences}
          onRestore={handleRestoreHistory}
          onCopyPrompt={(txt) => copyToClipboard(txt, "full", copy.okCopiedFull)}
          onExportEntryJson={(entry) => {
            const snap: StudioFormState = {
              ...form,
              ...(entry.stateSnapshot || {}),
              engine: entry.engine,
              wanVariant:
                entry.stateSnapshot?.wanVariant ||
                entry.wanVariant ||
                form.wanVariant,
              mode: entry.mode,
            };
            const payload = buildComfyExportPayload(
              snap,
              entry.positiveOnly,
              entry.negativeOnly
            );
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${entry.engine}_prompt_${entry.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onToggleFavorite={handleToggleFavorite}
          onDeleteEntry={handleDeleteHistoryEntry}
          onClearAll={handleClearAllHistory}
          onToggleFavoriteSequence={handleToggleFavoriteSequence}
          onDeleteSequence={handleDeleteSequenceEntry}
          onClearSequences={handleClearAllSequences}
          onLoadSequence={handleLoadSequence}
          onApplySequenceProps={handleApplySequenceProps}
          onApplyEntryProps={handleApplyHistoryEntryProps}
          onGoStudio={() => setActiveTab("studio")}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUser?.displayName ?? null}
          authLoading={authLoading}
          cloudSyncing={cloudSyncing}
          onSignIn={() => void handleUserSignIn()}
          onSyncLocalToCloud={() => void handleSyncLocalToCloud()}
        />
      ) : activeTab === "about" ||
        activeTab === "privacy" ||
        activeTab === "terms" ||
        activeTab === "contact" ? (
        <LegalPagesView
          lang={lang}
          section={activeTab as LegalSectionId}
          onSelectSection={(sec) => setActiveTab(sec)}
          onOpenCookieSettings={() => setCookieSettingsOpen(true)}
          onGoStudio={() => setActiveTab("studio")}
        />
      ) : (
        <div
          className={`mx-auto flex max-w-[1440px] ${
            lang === "ar" ? "lg:flex-row" : "lg:flex-row-reverse"
          }`}
        >
          <EngineSidebar
            copy={copy}
            lang={lang}
            theme={theme}
            activeEngine={form.engine}
            activePresetId={activePresetId}
            onSelectEngine={handleSelectEngine}
            onApplyPreset={handleApplyPreset}
            onChangeLang={setLang}
            onToggleTheme={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            onResetAll={handleResetAll}
            onBackupStudioState={handleBackupStudioState}
            onRestoreStudioBackup={handleRestoreStudioBackup}
            isOpenMobile={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            isAdmin={isAdmin}
            currentUserEmail={currentUserEmail}
            currentUserName={currentUser?.displayName ?? null}
            authLoading={authLoading}
            onSignIn={() => void handleUserSignIn()}
            onSignOut={() => void handleUserSignOut()}
            adConsentResolved={adConsentResolved}
            personalizedAds={personalizedAdsGranted}
          />

          <main className="min-w-0 flex-1 px-3.5 py-5 sm:px-6 lg:px-8 lg:py-6">
            {/* Mobile Quick Engine Selector Strip */}
            <div className="mb-4 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2" dir="rtl">
                {ENGINE_ORDER.map((id) => {
                  const eng = ENGINES[id];
                  const active = form.engine === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectEngine(id)}
                      className={`min-h-[42px] shrink-0 rounded-lg border px-3.5 py-2 text-right text-xs font-semibold transition-colors whitespace-nowrap ${
                        active
                          ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                          : "border-slate-200 bg-white text-slate-700 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300"
                      }`}
                    >
                      {eng.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Engine Context Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-[#222634]">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {form.engine === "wan22"
                    ? activeWanSpec.name
                    : engineSpec.name}
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {form.engine === "wan22"
                    ? activeWanSpec.note[lang]
                    : engineSpec.recommendedSummary[lang]}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-mono-code dark:text-slate-400">
                  {engineSpec.vendor} · {engineSpec.encoder}
                </span>
                <input
                  ref={studioBackupInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleRestoreStudioBackup(file);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={handleBackupStudioState}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-600/45 bg-amber-50/70 px-2.5 py-1.5 text-[11.5px] font-semibold text-amber-900 transition-colors hover:border-amber-600 hover:bg-amber-100/80 dark:border-[#D4A34B]/45 dark:bg-[#1A1811] dark:text-[#F0C775] dark:hover:border-[#D4A34B]"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnBackupStudio}</span>
                </button>
                <button
                  type="button"
                  onClick={() => studioBackupInputRef.current?.click()}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B] dark:hover:text-[#F0C775]"
                >
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.btnRestoreBackup}</span>
                </button>
              </div>
            </div>

            {/* Status Banner */}
            {status.msg && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-5 flex items-start gap-2.5 overflow-hidden rounded-lg border px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
                  status.type === "err"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300"
                }`}
              >
                {status.type === "err" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 break-words">{status.msg}</span>
              </div>
            )}

            {/* Main 2-Column Studio Workbench */}
            <div className="grid gap-6 xl:grid-cols-12">
              {/* Builder Form Column */}
              <div className="space-y-4 xl:col-span-7">
                {/* Section 1: Core Scene Input (Always Visible & Spacious) */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {copy.secBasic}
                    </h2>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      {copy.modeLabels[form.mode] || form.mode}
                      {form.category ? ` · ${form.category}` : ""}
                    </span>
                  </div>

                  {needsReferenceImage && form.engine !== "minimax" && (
                    <ImageReferenceDropzone
                      copy={copy}
                      aspectOptions={activeAspectOptions}
                      imageState={referenceImage}
                      analyzing={analyzingImage}
                      onImageLoaded={(img) => {
                        setReferenceImage(img);
                        updateFormField("aspect", img.detectedAspect, true);
                        showStatus(copy.okImageLoaded, "ok");
                      }}
                      onClearImage={() => setReferenceImage(null)}
                      onAnalyzeImage={handleAnalyzeImage}
                      showEndFrame={form.mode === "flf2v"}
                      endImageState={endReferenceImage}
                      analyzingTransition={analyzingTransition}
                      onEndImageLoaded={(img) => {
                        setEndReferenceImage(img);
                        showStatus(copy.okEndImageLoaded, "ok");
                      }}
                      onClearEndImage={() => setEndReferenceImage(null)}
                      onAnalyzeTransition={handleAnalyzeTransition}
                    />
                  )}

                  <div>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {copy.lblSubject}
                      </label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {copy.hintSubject}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={form.subject}
                      onChange={(e) =>
                        updateFormField("subject", e.target.value, true)
                      }
                      placeholder={copy.placeholderSubject}
                      className={`${inputBaseClass} min-h-[56px] resize-y leading-relaxed`}
                    />

                    {/* Smart Keywords Quick Bar */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-[#F0C775]">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span>{copy.smartKeywordsLbl}</span>
                      </span>
                      {SMART_KEYWORDS.map((item) => {
                        const active = hasSmartKeyword(form.subject, item.keyword);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              updateFormField(
                                "subject",
                                toggleSmartKeyword(form.subject, item.keyword),
                                true
                              )
                            }
                            title={item.keyword}
                            className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                              active
                                ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-500/70 hover:text-amber-800 dark:border-[#262B3A] dark:bg-[#0D1017] dark:text-slate-300 dark:hover:border-[#D4A34B]/70 dark:hover:text-[#F0C775]"
                            }`}
                          >
                            {active ? (
                              <Check className="h-3 w-3 shrink-0" />
                            ) : (
                              <Plus className="h-3 w-3 shrink-0 opacity-60" />
                            )}
                            <span>{item.labels[lang]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Collapsible Panel: Environment & Action (Optional) */}
                <CollapsibleStudioPanel
                  title={copy.secSceneDetails}
                  summary={
                    [form.environment.trim(), form.action.trim()]
                      .filter(Boolean)
                      .join(" · ") || copy.emptyFieldTag
                  }
                  autoBadge={copy.autoTag}
                  icon={<Film className="h-4 w-4" />}
                  isOpen={openPanels.sceneDetails}
                  onToggle={() => togglePanel("sceneDetails")}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBaseClass}>
                        {copy.lblEnvironment}
                      </label>
                      <textarea
                        rows={3}
                        value={form.environment}
                        onChange={(e) =>
                          updateFormField("environment", e.target.value, true)
                        }
                        placeholder={copy.placeholderEnvironment}
                        className={`${inputBaseClass} resize-y leading-relaxed`}
                      />
                    </div>
                    <div>
                      <label className={labelBaseClass}>
                        {engineSpec.kind === "video"
                          ? copy.lblAction
                          : copy.lblActionImage}
                      </label>
                      <textarea
                        rows={3}
                        value={form.action}
                        onChange={(e) =>
                          updateFormField("action", e.target.value, true)
                        }
                        placeholder={
                          engineSpec.kind === "video"
                            ? copy.placeholderAction
                            : copy.placeholderActionImage
                        }
                        className={`${inputBaseClass} resize-y leading-relaxed`}
                      />
                    </div>
                  </div>
                </CollapsibleStudioPanel>

                {/* Dedicated MiniMax Hailuo 02 Panel (Collapsed Until Clicked) */}
                {form.engine === "minimax" && (
                  <MiniMaxStudioPanel
                    copy={copy}
                    lang={lang}
                    form={form}
                    isOpen={openPanels.minimax}
                    onToggle={() => togglePanel("minimax")}
                    aspectOptions={activeAspectOptions}
                    firstFrame={referenceImage}
                    lastFrame={endReferenceImage}
                    analyzingImage={analyzingImage}
                    analyzingTransition={analyzingTransition}
                    onChangeMode={handleModeChange}
                    onSelectDurationPreset={handleSelectMinimaxDurationPreset}
                    onToggleCameraCommand={handleToggleMinimaxCameraCommand}
                    onChangeCustomDirective={(val) =>
                      updateFormField("minimaxCustomDirective", val, true)
                    }
                    onTogglePromptOptimizer={(enabled) =>
                      updateFormField("minimaxPromptOptimizer", enabled, true)
                    }
                    onFirstFrameLoaded={(img) => {
                      setReferenceImage(img);
                      pendingResyncRef.current = true;
                      setForm((prev) => ({
                        ...prev,
                        mode: prev.mode === "t2v" ? "i2v" : prev.mode,
                        aspect: img.detectedAspect,
                      }));
                      showStatus(copy.okImageLoaded, "ok");
                    }}
                    onClearFirstFrame={() => setReferenceImage(null)}
                    onAnalyzeFirstFrame={handleAnalyzeImage}
                    onLastFrameLoaded={(img) => {
                      setEndReferenceImage(img);
                      pendingResyncRef.current = true;
                      setForm((prev) => ({
                        ...prev,
                        mode: "flf2v",
                      }));
                      showStatus(copy.okEndImageLoaded, "ok");
                    }}
                    onClearLastFrame={() => setEndReferenceImage(null)}
                    onAnalyzeTransition={handleAnalyzeTransition}
                  />
                )}

                {/* Dedicated Google Veo 3.1 Panel (Collapsed Until Clicked) */}
                {form.engine === "veo" && (
                  <GoogleVeoStudioPanel
                    copy={copy}
                    form={form}
                    isOpen={openPanels.veo}
                    onToggle={() => togglePanel("veo")}
                    autoFilling={enhancing || directing}
                    veoMeta={veoMeta}
                    onAiAutoFill={() => void handleVeoAutoFill()}
                    onChangeModel={(model: GoogleVideoModel) =>
                      updateFormField("veoModel", model, true)
                    }
                    onChangeDuration={(dur: 4 | 6 | 8) =>
                      updateFormField("duration", dur, true)
                    }
                    onChangeResolution={(res: "720p" | "1080p") =>
                      updateFormField("veoResolution", res, true)
                    }
                    onChangeAspect={(aspect: string) =>
                      updateFormField("aspect", aspect, true)
                    }
                    onChangeDetail={(detail: GoogleVideoDetail) =>
                      updateFormField("veoDetail", detail, true)
                    }
                    onChangeLanguage={(lng: GoogleVideoLanguage) =>
                      updateFormField("veoLanguage", lng, true)
                    }
                    onToggleAudio={(enabled: boolean) =>
                      updateFormField("includeAudio", enabled, true)
                    }
                    onChangeDialogue={(val: string) =>
                      updateFormField("veoDialogue", val, true)
                    }
                    onChangeSoundEffects={(val: string) =>
                      updateFormField("veoSoundEffects", val, true)
                    }
                    onChangeCamera={(val: string) =>
                      updateFormField("camera", val, true)
                    }
                    onChangeLighting={(val: string) =>
                      updateFormField("light", val, true)
                    }
                    onChangeStyle={(val: string) =>
                      updateFormField("style", val, true)
                    }
                    onChangeNegative={(val: string) => {
                      setConfirmNegReset(false);
                      pendingResyncRef.current = true;
                      setForm((prev) => ({
                        ...prev,
                        negative: val,
                        negativeEdited: true,
                      }));
                    }}
                  />
                )}

                {/* Auto / AI Smart Configuration Bar */}
                <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 dark:border-[#222634] dark:bg-[#0E1118]">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-[#F0C775]">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>{copy.autoModeTitle}</span>
                    </p>
                    <p className="mt-0.5 break-words text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">
                      {copy.autoModeSub}
                    </p>
                  </div>
                  <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5 sm:w-auto sm:gap-2">
                    {engineSpec.kind === "video" && (
                      <button
                        type="button"
                        aria-pressed={form.smartSceneGuard !== false}
                        title={copy.smartGuardHint}
                        onClick={() =>
                          updateFormField(
                            "smartSceneGuard",
                            form.smartSceneGuard === false,
                            true
                          )
                        }
                        className={`inline-flex min-h-[32px] sm:min-h-[38px] max-w-full items-center gap-1 sm:gap-1.5 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold transition-colors ${
                          form.smartSceneGuard !== false
                            ? "border-emerald-600/60 bg-emerald-50 text-emerald-800 hover:border-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/35 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-400"
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <span className="truncate">
                          <span className="hidden sm:inline">{copy.smartGuardTitle}</span>
                          <span className="sm:hidden">Scene Guard</span>
                          {" · "}
                          {SmartSceneGuard.resolveProvider(form.engine).toUpperCase()}
                          {" · "}
                          {form.smartSceneGuard !== false
                            ? copy.smartGuardOn
                            : copy.smartGuardOff}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="inline-flex min-h-[32px] sm:min-h-[38px] items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B]"
                    >
                      <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span>{copy.autoResetAll}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllPanels(!anyPanelOpen)}
                      className="inline-flex min-h-[32px] sm:min-h-[38px] items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-200 dark:hover:border-[#D4A34B]"
                    >
                      <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span>{anyPanelOpen ? copy.collapseAll : copy.expandAll}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Panel 1: Mode, Category & Variant */}
                <CollapsibleStudioPanel
                  title={copy.secEngineOptions}
                  summary={`${copy.modeLabels[form.mode] || form.mode}${
                    form.category ? ` · ${form.category}` : ""
                  }${form.engine === "wan22" ? ` · ${activeWanSpec.name}` : ""}`}
                  autoBadge={copy.autoTag}
                  icon={<SlidersHorizontal className="h-4 w-4" />}
                  isOpen={openPanels.engineOpts}
                  onToggle={() => togglePanel("engineOpts")}
                >
                  {form.engine === "wan22" && (
                    <div className="mb-4">
                      <label className={labelBaseClass}>
                        {copy.wanVariantLabel}
                      </label>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {(["a14b", "ti2v_5b"] as WanVariant[]).map((vId) => {
                          const vSpec = WAN_VARIANTS[vId];
                          const isSelected = form.wanVariant === vId;
                          return (
                            <button
                              key={vId}
                              type="button"
                              onClick={() => handleWanVariantChange(vId)}
                              className={`flex min-h-[48px] flex-col items-end rounded-lg border px-3.5 py-2.5 text-right transition-colors ${
                                isSelected
                                  ? "border-amber-600 bg-amber-50/80 dark:border-[#D4A34B] dark:bg-[#1B1E2A]"
                                  : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0D1017] dark:hover:border-[#343B50]"
                              }`}
                            >
                              <span
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-amber-800 dark:text-[#F0C775]"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {vSpec.name}
                              </span>
                              <span className="mt-0.5 text-[11px] text-slate-500 font-mono-code dark:text-slate-400">
                                {vSpec.fps}fps · {vSpec.modes.join("/").toUpperCase()} ·{" "}
                                {vSpec.defaultSteps} steps
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelBaseClass}>{copy.lblMode}</label>
                      <select
                        value={form.mode}
                        onChange={(e) =>
                          handleModeChange(e.target.value as GenerationMode)
                        }
                        className={inputBaseClass}
                      >
                        {activeModes.map((m) => (
                          <option key={m} value={m}>
                            {copy.modeLabels[m] || m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelBaseClass}>
                        {copy.lblCategory}
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className={inputBaseClass}
                      >
                        <option value="">{copy.selectOptionalAuto}</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelBaseClass}>
                        {copy.lblPromptFormat}
                      </label>
                      <select
                        value={form.promptFormat}
                        onChange={(e) =>
                          updateFormField(
                            "promptFormat",
                            e.target.value as PromptFormat,
                            true
                          )
                        }
                        className={inputBaseClass}
                      >
                        <option value="official">{copy.formatOfficial}</option>
                        <option value="structured">
                          {copy.formatStructured}
                        </option>
                      </select>
                    </div>
                  </div>
                </CollapsibleStudioPanel>

                {/* Collapsible Panel 2: Camera & Lens Studio */}
                <CollapsibleStudioPanel
                  title={copy.secCameraStudio}
                  summary={
                    [form.cameraMovement, form.cameraLens].filter(Boolean).join(" · ") ||
                    form.camera.trim() ||
                    copy.emptyFieldTag
                  }
                  autoBadge={copy.autoTag}
                  icon={<Camera className="h-4 w-4" />}
                  isOpen={openPanels.camera}
                  onToggle={() => togglePanel("camera")}
                >
                  <div className="space-y-3">
                    <div>
                      <label className={labelBaseClass}>
                        {copy.lblCameraMovement}
                      </label>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                        {CAMERA_MOVEMENTS.map((mov) => {
                          const selected = form.cameraMovement === mov.label;
                          return (
                            <button
                              key={mov.id}
                              type="button"
                              onClick={() =>
                                handleCameraStudioChange(
                                  mov.label,
                                  form.cameraLens
                                )
                              }
                              className={`min-h-[42px] rounded-lg border px-2.5 py-2 text-right text-xs font-medium leading-snug whitespace-normal break-words transition-colors ${
                                selected
                                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-300"
                              }`}
                            >
                              {mov.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className={labelBaseClass}>
                        {copy.lblCameraLens}
                      </label>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        {CAMERA_LENSES.map((lens) => {
                          const selected = form.cameraLens === lens.label;
                          return (
                            <button
                              key={lens.id}
                              type="button"
                              onClick={() =>
                                handleCameraStudioChange(
                                  form.cameraMovement,
                                  lens.label
                                )
                              }
                              className={`min-h-[42px] rounded-lg border px-2.5 py-2 text-right text-[11.5px] font-medium leading-snug whitespace-normal break-words transition-colors ${
                                selected
                                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-300"
                              }`}
                            >
                              {lens.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className={labelBaseClass}>{copy.lblCamera}</label>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={form.camera}
                        onChange={(e) =>
                          updateFormField("camera", e.target.value, true)
                        }
                        placeholder={copy.placeholderCamera}
                        className={`${inputBaseClass} min-h-[56px] resize-y text-left font-mono-code text-xs leading-relaxed`}
                      />
                    </div>
                  </div>
                </CollapsibleStudioPanel>

                {/* Collapsible Panel 3: Lighting, Color & Style */}
                <CollapsibleStudioPanel
                  title={copy.secLightingDesigner}
                  summary={
                    LIGHTING_PALETTES.find((p) => p.value === form.light)?.label ||
                    form.light.trim() ||
                    form.style.trim() ||
                    copy.emptyFieldTag
                  }
                  autoBadge={copy.autoTag}
                  icon={<Palette className="h-4 w-4" />}
                  isOpen={openPanels.lighting}
                  onToggle={() => togglePanel("lighting")}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {LIGHTING_PALETTES.map((pal) => {
                      const selected = form.light === pal.value;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() =>
                            updateFormField("light", pal.value, true)
                          }
                          className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-right text-xs font-medium transition-colors ${
                            selected
                              ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-300"
                          }`}
                        >
                          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                            {pal.label}
                          </span>
                          <span className="flex shrink-0 items-center gap-1">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: pal.colors[0] }}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: pal.colors[1] }}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelBaseClass}>{copy.lblLight}</label>
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={form.light}
                        onChange={(e) =>
                          updateFormField("light", e.target.value, true)
                        }
                        placeholder={copy.placeholderLight}
                        className={`${inputBaseClass} min-h-[56px] resize-y text-left text-xs leading-relaxed`}
                      />
                    </div>

                    <div>
                      <label className={labelBaseClass}>{copy.lblStyle}</label>
                      <select
                        value={form.style}
                        onChange={(e) =>
                          updateFormField("style", e.target.value, true)
                        }
                        className={inputBaseClass}
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
                  </div>

                  <div className="mt-3">
                    <label className={labelBaseClass}>{copy.lblExtra}</label>
                    <textarea
                      rows={2}
                      value={form.extra}
                      onChange={(e) =>
                        updateFormField("extra", e.target.value, true)
                      }
                      placeholder={copy.placeholderExtra}
                      className={`${inputBaseClass} min-h-[56px] resize-y leading-relaxed`}
                    />
                  </div>
                </CollapsibleStudioPanel>

                {/* Collapsible Panel 4: Aspect, Duration, Motion, Seed & Physics */}
                <CollapsibleStudioPanel
                  title={copy.secTechnicalParams}
                  summary={`${form.aspect}${
                    engineSpec.kind === "video"
                      ? ` · ${form.duration}s · Motion ${form.motionScale}/10`
                      : ` · CFG ${form.cfgScale} · ${form.steps} steps`
                  } · ${form.physicsHints.length} physics`}
                  autoBadge={copy.autoTag}
                  icon={<Film className="h-4 w-4" />}
                  isOpen={openPanels.technical}
                  onToggle={() => togglePanel("technical")}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className={labelBaseClass}>{copy.lblAspect}</label>
                      <select
                        value={form.aspect}
                        onChange={(e) =>
                          updateFormField("aspect", e.target.value, true)
                        }
                        className={inputBaseClass}
                      >
                        {activeAspectOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {engineSpec.kind === "video" ? (
                      <>
                        <div>
                          <label className={labelBaseClass}>
                            {copy.lblDuration}
                          </label>
                          <select
                            value={form.duration}
                            onChange={(e) => {
                              const nextDur = Number(e.target.value);
                              updateFormField("duration", nextDur, true);
                              if (form.engine === "wan22" && nextDur > 5) {
                                showStatus(copy.tipWanDuration, "ok");
                              }
                            }}
                            className={inputBaseClass}
                          >
                            {activeDurationOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {copy.lblMotion}
                            </label>
                            <span className="text-xs font-semibold text-amber-700 font-mono-code dark:text-[#F0C775]">
                              {form.motionScale}/10
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={form.motionScale}
                            onChange={(e) =>
                              updateFormField(
                                "motionScale",
                                Number(e.target.value),
                                true
                              )
                            }
                            className="h-10 w-full accent-amber-700 dark:accent-[#D4A34B]"
                          />
                        </div>

                        {engineSpec.supportsStoryboard ? (
                          <div>
                            <label className={labelBaseClass}>
                              {copy.lblShots}
                            </label>
                            <select
                              value={form.shotsCount}
                              onChange={(e) =>
                                handleShotsCountChange(Number(e.target.value))
                              }
                              className={inputBaseClass}
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className={labelBaseClass}>
                              {copy.lblCfg}
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min={1}
                              max={15}
                              value={form.cfgScale}
                              onChange={(e) =>
                                updateFormField(
                                  "cfgScale",
                                  Number(e.target.value),
                                  true
                                )
                              }
                              className={`${inputBaseClass} font-mono-code`}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={labelBaseClass}>{copy.lblCfg}</label>
                          <input
                            type="number"
                            step="0.5"
                            min={1}
                            max={15}
                            value={form.cfgScale}
                            onChange={(e) =>
                              updateFormField(
                                "cfgScale",
                                Number(e.target.value),
                                true
                              )
                            }
                            className={`${inputBaseClass} font-mono-code`}
                          />
                        </div>

                        <div>
                          <label className={labelBaseClass}>
                            {copy.lblSteps}
                          </label>
                          <input
                            type="number"
                            min={4}
                            max={80}
                            value={form.steps}
                            onChange={(e) =>
                              updateFormField(
                                "steps",
                                Number(e.target.value),
                                true
                              )
                            }
                            className={`${inputBaseClass} font-mono-code`}
                          />
                        </div>

                        <div>
                          <label className={labelBaseClass}>
                            {copy.lblLora}
                          </label>
                          <input
                            type="text"
                            value={form.loraTags}
                            onChange={(e) =>
                              updateFormField("loraTags", e.target.value, true)
                            }
                            placeholder="<lora:detail:0.8>"
                            dir="ltr"
                            className={`${inputBaseClass} font-mono-code`}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Seed Lock + Micro-Physics Hints */}
                  <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-12 dark:border-[#222634]">
                    <div className="sm:col-span-5">
                      <label className={labelBaseClass}>{copy.lblSeed}</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={form.seed}
                          onChange={(e) =>
                            updateFormField(
                              "seed",
                              Number(e.target.value) || 0,
                              true
                            )
                          }
                          className={`${inputBaseClass} min-w-0 flex-1 font-mono-code text-xs`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateFormField("seedLocked", !form.seedLocked)
                          }
                          title={form.seedLocked ? copy.seedLock : copy.seedUnlock}
                          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                            form.seedLocked
                              ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-300"
                          }`}
                        >
                          {form.seedLocked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {form.seedLocked ? copy.seedLock : copy.seedUnlock}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateFormField("seed", randomSeed(), true)
                          }
                          aria-label={copy.seedRandomize}
                          title={copy.seedRandomize}
                          className="inline-flex min-h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-300 dark:hover:border-[#D4A34B]"
                        >
                          <Dices className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-7">
                      <label className={labelBaseClass}>{copy.lblPhysics}</label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {PHYSICS_HINTS.map((hint) => {
                          const checked = form.physicsHints.includes(hint.id);
                          return (
                            <label
                              key={hint.id}
                              dir="rtl"
                              className={`flex min-h-[44px] cursor-pointer items-center justify-start gap-2 rounded-lg border px-3 py-2 text-right text-xs font-medium transition-colors ${
                                checked
                                  ? "border-amber-600/70 bg-amber-50/70 text-amber-900 dark:border-[#D4A34B]/70 dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#0E1118] dark:text-slate-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePhysicsHint(hint.id)}
                                className="h-4 w-4 shrink-0 rounded accent-amber-700 dark:accent-[#D4A34B]"
                              />
                              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                                {hint.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleStudioPanel>

                {/* Collapsible Panel 5: Audio & Sound Design (Video Engines) */}
                {engineSpec.kind === "video" && (
                  <CollapsibleStudioPanel
                    title={copy.secAudioStudio}
                    summary={
                      form.includeAudio
                        ? form.audioTags.length > 0 || form.audioDescription.trim()
                          ? [
                              form.audioTags.length > 0
                                ? `${form.audioTags.length} tags`
                                : "",
                              form.audioDescription.trim(),
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : copy.emptyFieldTag
                        : "Off"
                    }
                    autoBadge={copy.autoTag}
                    icon={<Volume2 className="h-4 w-4" />}
                    isOpen={openPanels.audio}
                    onToggle={() => togglePanel("audio")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        dir="rtl"
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={form.includeAudio}
                          onChange={(e) =>
                            updateFormField(
                              "includeAudio",
                              e.target.checked,
                              true
                            )
                          }
                          className="h-4 w-4 shrink-0 rounded accent-amber-700 dark:accent-[#D4A34B]"
                        />
                        <span>{copy.lblAudioToggle}</span>
                      </label>
                    </div>

                    {form.includeAudio && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {AUDIO_DESIGN_TAGS.map((tag) => {
                            const active = form.audioTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleAudioTag(tag.id)}
                                className={`min-h-[42px] rounded-lg border px-3 py-2 text-right text-xs font-medium leading-snug whitespace-normal break-words transition-colors ${
                                  active
                                    ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-[#D4A34B] dark:bg-[#1B1E2A] dark:text-[#F0C775]"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-[#252A38] dark:bg-[#13161F] dark:text-slate-300"
                                }`}
                              >
                                {tag.label}
                              </button>
                            );
                          })}
                        </div>

                        <div>
                          <label className={labelBaseClass}>
                            {copy.lblAudioCustom}
                          </label>
                          <textarea
                            rows={2}
                            value={form.audioDescription}
                            onChange={(e) =>
                              updateFormField(
                                "audioDescription",
                                e.target.value,
                                true
                              )
                            }
                            placeholder={copy.placeholderAudio}
                            className={`${inputBaseClass} min-h-[56px] resize-y leading-relaxed`}
                          />
                        </div>
                      </div>
                    )}
                  </CollapsibleStudioPanel>
                )}

                {/* Collapsible Panel 6: Multi-Shot Storyboard */}
                {engineSpec.supportsStoryboard && (
                  <CollapsibleStudioPanel
                    title={copy.secStoryboard}
                    summary={
                      form.shots
                        .slice(0, form.shotsCount)
                        .some((s) => s.camera.trim() || s.description.trim())
                        ? `${form.shotsCount} cuts · ${form.duration}s`
                        : copy.emptyFieldTag
                    }
                    autoBadge={copy.autoTag}
                    icon={<Clapperboard className="h-4 w-4" />}
                    isOpen={openPanels.storyboard}
                    onToggle={() => togglePanel("storyboard")}
                  >
                    <StoryboardEditor
                      shotsCount={form.shotsCount}
                      duration={form.duration}
                      shots={form.shots}
                      placeholderCamera={copy.placeholderShotCamera}
                      placeholderDesc={copy.placeholderShotDesc}
                      onUpdateShot={handleUpdateShot}
                    />
                  </CollapsibleStudioPanel>
                )}

                {/* Collapsible Panel 7: Negative Prompt & AI Provider */}
                <CollapsibleStudioPanel
                  title={copy.secNegativeAndAi}
                  summary={`${
                    form.aiProvider === "gemini"
                      ? "Gemini"
                      : `Ollama (${form.ollamaModel})`
                  } · ${
                    engineSpec.supportsNegative ? "Negative Auto" : "Affirmative"
                  }`}
                  autoBadge={copy.autoTag}
                  icon={<ShieldAlert className="h-4 w-4" />}
                  isOpen={openPanels.negativeAi}
                  onToggle={() => togglePanel("negativeAi")}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Negative Prompt */}
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {copy.lblNegative}
                        </label>
                        {engineSpec.supportsNegative && (
                          <div className="flex items-center gap-1.5">
                            {confirmNegReset ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleNegativeRegenClick}
                                  className="rounded-md bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-[#D4A34B] dark:text-[#110D05]"
                                >
                                  {copy.confirmRegenNeg}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmNegReset(false)}
                                  className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-[#262B3A] dark:text-slate-300"
                                >
                                  {copy.cancelAction}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={handleNegativeRegenClick}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>{copy.btnRegenNeg}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {engineSpec.supportsNegative ? (
                        <textarea
                          rows={4}
                          dir="ltr"
                          value={form.negative}
                          onChange={(e) => {
                            setConfirmNegReset(false);
                            pendingResyncRef.current = true;
                            setForm((prev) => ({
                              ...prev,
                              negative: e.target.value,
                              negativeEdited: true,
                            }));
                          }}
                          placeholder={copy.placeholderNegative}
                          className={`${inputBaseClass} text-left font-mono-code text-xs`}
                        />
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600 dark:border-[#252A38] dark:bg-[#0B0D12] dark:text-slate-400">
                          {form.engine === "minimax"
                            ? copy.minimaxNoNegNote
                            : copy.fluxNoNegNote}
                        </div>
                      )}
                    </div>

                    {/* AI Enhancement Provider */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {copy.aiBridgeTitle}
                          </label>
                          <button
                            type="button"
                            disabled={testingConnection}
                            onClick={handleTestConnection}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-amber-600 disabled:opacity-50 dark:border-[#262B3A] dark:bg-[#191D29] dark:text-slate-200"
                          >
                            <PlugZap className="h-3 w-3" />
                            <span>
                              {testingConnection
                                ? copy.btnTestingConnection
                                : copy.btnTestConnection}
                            </span>
                          </button>
                        </div>

                        <select
                          value={form.aiProvider}
                          onChange={(e) =>
                            updateFormField(
                              "aiProvider",
                              e.target.value as AIProvider
                            )
                          }
                          className={inputBaseClass}
                        >
                          <option value="gemini">{copy.aiGeminiLabel}</option>
                          <option value="ollama">{copy.aiOllamaLabel}</option>
                        </select>

                        {form.aiProvider === "ollama" && (
                          <input
                            type="text"
                            value={form.ollamaModel}
                            onChange={(e) =>
                              updateFormField("ollamaModel", e.target.value)
                            }
                            placeholder={copy.aiOllamaModelPlaceholder}
                            dir="ltr"
                            className={`${inputBaseClass} mt-2.5 text-left font-mono-code text-xs`}
                          />
                        )}

                        <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {copy.aiEnhanceHint}
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleStudioPanel>

                {/* Primary Action Row (Always Accessible) */}
                <div className="grid gap-3 pt-1 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={directing}
                    onClick={() => void handleSmartBuild()}
                    title="Ctrl + Enter"
                    className="min-h-[48px] sm:col-span-2 rounded-xl bg-amber-700 px-5 py-3 text-center text-sm font-semibold leading-snug whitespace-normal break-words text-white transition-colors hover:bg-amber-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                  >
                    {directing
                      ? copy.directorRunning
                      : `${copy.btnGenerate} (Ctrl+Enter)`}
                  </button>

                  <button
                    type="button"
                    disabled={enhancing}
                    onClick={handleAiEnhance}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-900 px-4 py-3 text-center text-sm font-semibold leading-snug text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-[#343B50] dark:bg-[#1E2331] dark:text-slate-100 dark:hover:bg-[#272E40]"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="whitespace-normal break-words">
                      {enhancing ? copy.btnAiEnhancing : copy.btnAiEnhance}
                    </span>
                  </button>
                </div>

                {/* 10-Prompt Sequential Film Chain Action */}
                <button
                  type="button"
                  disabled={generatingFilmChain || directing}
                  onClick={() => void handleGenerateTenSceneFilm()}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-amber-600/60 bg-amber-50/80 px-5 py-3 text-center text-sm font-bold leading-snug text-amber-950 transition-colors hover:border-amber-600 hover:bg-amber-100/80 disabled:opacity-50 dark:border-[#D4A34B]/55 dark:bg-[#1B1710] dark:text-[#F5E3B5] dark:hover:border-[#D4A34B] dark:hover:bg-[#251F14]"
                >
                  {generatingFilmChain ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-700 dark:text-[#F0C775]" />
                  ) : (
                    <Clapperboard className="h-4 w-4 shrink-0 text-amber-700 dark:text-[#F0C775]" />
                  )}
                  <span className="whitespace-normal break-words">
                    {generatingFilmChain
                      ? lang === "ar"
                        ? "جارٍ توليد سلسلة الفيلم (10 برومبتات متتالية)..."
                        : lang === "fr"
                        ? "Génération de la série de 10 prompts film..."
                        : "Generating 10-Prompt Sequential Film Chain..."
                      : lang === "ar"
                      ? "توليد سلسلة فيلم من 10 برومبتات متتالية من الفكرة"
                      : lang === "fr"
                      ? "Générer une série film de 10 prompts consécutifs"
                      : "Generate 10-Prompt Sequential Film Chain from Idea"}
                  </span>
                </button>

                {form.engine === "minimax" && (
                  <button
                    type="button"
                    disabled={minimaxLaunchState.submitting}
                    onClick={handleLaunchMinimax}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#55D9EE]/50 bg-gradient-to-l from-[#10242A] via-[#132C34] to-[#1A1A26] px-5 py-3 text-center text-sm font-bold leading-snug text-[#F5E3B5] transition-colors hover:border-[#55D9EE] hover:text-white disabled:opacity-50 whitespace-normal break-words dark:from-[#0C1D24] dark:via-[#12262E] dark:to-[#191625]"
                  >
                    <span>
                      {minimaxLaunchState.submitting
                        ? copy.minimaxLaunchGenerating
                        : copy.btnLaunchMinimax}
                    </span>
                  </button>
                )}
              </div>

              {/* Sticky Output, Analyzer & History Column */}
              <div className="xl:col-span-5">
                <PromptOutputPanel
                  copy={copy}
                  lang={lang}
                  activeEngine={form.engine}
                  outputText={outputText}
                  shotsOrStepsLabel={
                    engineSpec.kind === "video" ? copy.statShots : copy.statSteps
                  }
                  shotsOrStepsValue={
                    engineSpec.kind === "video" ? form.shotsCount : form.steps
                  }
                  qualityReport={qualityReport}
                  recentHistory={history}
                  fittingLength={fittingLength}
                  convertingTarget={convertingTarget}
                  onChangeOutput={handleChangeOutput}
                  onCopyFull={() =>
                    copyToClipboard(outputText, "full", copy.okCopiedFull)
                  }
                  onCopyPositive={() => {
                    const pos =
                      positiveText ||
                      outputText.split("NEGATIVE PROMPT:")[0].trim();
                    copyToClipboard(pos, "positive", copy.okCopiedPositive);
                  }}
                  onSavePrompt={handleSaveGeneratedPrompt}
                  promptSavedRecently={promptSavedRecently}
                  onUnslop={handleUnslopOutput}
                  onExportJson={handleExportJson}
                  onExportPython={handleExportPython}
                  onDownloadTxt={handleDownloadTxt}
                  onFitLength={handleFitLength}
                  onConvertFormat={handleConvertFormat}
                  onRestoreHistory={handleRestoreHistory}
                  onToggleFavorite={handleToggleFavorite}
                  onClearHistory={handleClearAllHistory}
                  onLaunchMinimax={handleLaunchMinimax}
                  onCloseMinimaxLaunch={() => {
                    activeMinimaxPollRef.current = null;
                    setMinimaxLaunchState((prev) => ({
                      ...prev,
                      open: false,
                      polling: false,
                    }));
                  }}
                  minimaxLaunchState={minimaxLaunchState}
                  veoMeta={veoMeta}
                  copiedType={copiedType}
                  sceneChain={sceneChain}
                  addingNextScene={addingNextScene}
                  generatingFilmChain={generatingFilmChain}
                  chainError={chainError}
                  onAddNextScene={handleAddNextScene}
                  onGenerateTenSceneFilm={handleGenerateTenSceneFilm}
                  onCopyChainScene={(scene) =>
                    copyToClipboard(scene.prompt, "full", copy.okCopiedFull)
                  }
                  onLoadChainScene={handleLoadChainScene}
                  onExportChain={handleExportChain}
                  onExportChainJson={handleExportChainJson}
                  onImportChainFile={(file) => void handleImportChainFile(file)}
                  onClearChain={handleClearChain}
                  onSaveChainSequence={handleSaveSceneChainToSequences}
                  chainSavedRecently={chainSavedRecently}
                />
              </div>
            </div>

            <AdUnit
              placement="studio-bottom"
              lang={lang}
              format="horizontal"
              fullWidthResponsive={true}
              consentResolved={adConsentResolved}
              personalizedAds={personalizedAdsGranted}
              className="mt-8"
            />
          </main>
        </div>
      )}

      <SiteFooter
        lang={lang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCookieSettings={() => setCookieSettingsOpen(true)}
      />

      <CookieConsentBanner
        lang={lang}
        forceOpen={cookieSettingsOpen}
        onCloseForceOpen={() => setCookieSettingsOpen(false)}
        onOpenPrivacyPolicy={() => setActiveTab("privacy")}
        onConsentChange={(nextConsent) => setAdConsent(nextConsent)}
      />

      <MobileBottomNav
        copy={copy}
        activeTab={activeTab}
        savedCount={history.length + savedSequences.length}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
