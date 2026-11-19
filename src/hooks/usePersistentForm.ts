import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ENGINES, WAN_VARIANTS } from "../data/engines";
import {
  EngineId,
  GenerationMode,
  GoogleVideoLanguage,
  StudioFormState,
  WanVariant,
} from "../types/prompt";
import { GOOGLE_VEO_LANGUAGES } from "../utils/googleVeoPrompt";
import { buildDefaultShots } from "../utils/promptEngine";

export const FORM_STORAGE_KEY = "videoprompts_studio_form_v1";

function isValidEngineId(id: unknown): id is EngineId {
  return (
    typeof id === "string" && Object.prototype.hasOwnProperty.call(ENGINES, id)
  );
}

export function hydrateStoredForm(
  savedForm: Partial<StudioFormState> | null | undefined,
  base: StudioFormState
): StudioFormState {
  if (!savedForm || typeof savedForm !== "object") {
    return base;
  }

  const restoredEngine: EngineId = isValidEngineId(savedForm.engine)
    ? savedForm.engine
    : base.engine;
  const spec = ENGINES[restoredEngine];
  const restoredVariant: WanVariant =
    savedForm.wanVariant === "ti2v_5b" ? "ti2v_5b" : "a14b";
  const variantSpec = WAN_VARIANTS[restoredVariant];
  const allowedModes =
    restoredEngine === "wan22" ? variantSpec.modes : spec.modes;
  const allowedAspects =
    restoredEngine === "wan22" ? variantSpec.aspectOptions : spec.aspectOptions;
  const allowedDurations =
    restoredEngine === "wan22"
      ? variantSpec.durationOptions
      : spec.durationOptions;
  const restoredMode: GenerationMode =
    savedForm.mode && allowedModes.includes(savedForm.mode)
      ? savedForm.mode
      : spec.defaultMode;
  const restoredAspect =
    savedForm.aspect && allowedAspects.includes(savedForm.aspect)
      ? savedForm.aspect
      : allowedAspects[0];
  const restoredDuration =
    spec.kind === "video"
      ? allowedDurations.some((d) => d.value === savedForm.duration)
        ? Number(savedForm.duration)
        : spec.defaultDuration
      : 0;
  const restoredShotsCount = spec.supportsStoryboard
    ? Math.max(1, Math.min(4, Number(savedForm.shotsCount) || 3))
    : 1;

  return {
    ...base,
    ...savedForm,
    engine: restoredEngine,
    wanVariant: restoredVariant,
    mode: restoredMode,
    aspect: restoredAspect,
    duration: restoredDuration,
    shotsCount: restoredShotsCount,
    promptFormat:
      savedForm.promptFormat === "structured" ? "structured" : "official",
    cameraMovement: savedForm.cameraMovement ?? "",
    cameraLens: savedForm.cameraLens ?? "",
    includeAudio:
      typeof savedForm.includeAudio === "boolean"
        ? savedForm.includeAudio
        : base.includeAudio,
    audioTags: Array.isArray(savedForm.audioTags)
      ? savedForm.audioTags
      : base.audioTags,
    audioDescription: savedForm.audioDescription ?? "",
    smartSceneGuard:
      typeof savedForm.smartSceneGuard === "boolean"
        ? savedForm.smartSceneGuard
        : base.smartSceneGuard,
    minimaxResolution:
      savedForm.minimaxResolution === "768P" ? "768P" : "1080P",
    minimaxCameraCommands: Array.isArray(savedForm.minimaxCameraCommands)
      ? savedForm.minimaxCameraCommands
      : base.minimaxCameraCommands,
    minimaxCustomDirective: savedForm.minimaxCustomDirective ?? "",
    minimaxPromptOptimizer:
      typeof savedForm.minimaxPromptOptimizer === "boolean"
        ? savedForm.minimaxPromptOptimizer
        : base.minimaxPromptOptimizer,
    veoModel:
      savedForm.veoModel === "veo-3.1-fast" ? "veo-3.1-fast" : "veo-3.1",
    veoResolution: savedForm.veoResolution === "720p" ? "720p" : "1080p",
    veoDialogue: savedForm.veoDialogue ?? "",
    veoSoundEffects: savedForm.veoSoundEffects ?? "",
    veoDetail:
      savedForm.veoDetail === "short" ||
      savedForm.veoDetail === "balanced" ||
      savedForm.veoDetail === "professional"
        ? savedForm.veoDetail
        : "professional",
    veoLanguage: GOOGLE_VEO_LANGUAGES.some((l) => l.id === savedForm.veoLanguage)
      ? (savedForm.veoLanguage as GoogleVideoLanguage)
      : "English",
    shots: buildDefaultShots(
      restoredShotsCount,
      Array.isArray(savedForm.shots) ? savedForm.shots : []
    ),
  };
}

function readStoredForm(
  storageKey: string,
  legacyWorkspaceKey?: string
): Partial<StudioFormState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as Partial<StudioFormState>;
      }
    }
    if (legacyWorkspaceKey) {
      const legacyRaw = window.localStorage.getItem(legacyWorkspaceKey);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw) as {
          form?: Partial<StudioFormState>;
        } | null;
        if (legacyParsed?.form && typeof legacyParsed.form === "object") {
          return legacyParsed.form;
        }
      }
    }
  } catch {
    // Ignore storage read / JSON parse errors
  }
  return null;
}

/**
 * Automatically syncs the entire `StudioFormState` to localStorage whenever any
 * field changes, hydrating safely across sessions and syncing across tabs.
 */
export function usePersistentForm(
  createInitialState: () => StudioFormState,
  storageKey = FORM_STORAGE_KEY,
  legacyWorkspaceKey?: string
): [StudioFormState, Dispatch<SetStateAction<StudioFormState>>, () => void] {
  const initialFactoryRef = useRef(createInitialState);
  initialFactoryRef.current = createInitialState;

  const skipNextPersistRef = useRef(false);

  const [form, setForm] = useState<StudioFormState>(() => {
    const base = createInitialState();
    const savedForm = readStoredForm(storageKey, legacyWorkspaceKey);
    return hydrateStoredForm(savedForm, base);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // Ignore quota or private-browsing storage errors
    }
  }, [form, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (event.newValue === null) {
        skipNextPersistRef.current = true;
        setForm(initialFactoryRef.current());
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as Partial<StudioFormState>;
        if (parsed && typeof parsed === "object") {
          skipNextPersistRef.current = true;
          setForm(hydrateStoredForm(parsed, initialFactoryRef.current()));
        }
      } catch {
        // Ignore malformed cross-tab payloads
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const resetPersistedForm = useCallback(() => {
    skipNextPersistRef.current = true;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
    }
    setForm(initialFactoryRef.current());
  }, [storageKey]);

  return [form, setForm, resetPersistedForm];
}
