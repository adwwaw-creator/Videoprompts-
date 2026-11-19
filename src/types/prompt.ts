import type { DirectorEnhanceOptions } from "../utils/arabiCinematicDirector";

export type Language = "ar" | "fr" | "en";
export type ThemeMode = "dark" | "light";
export type WorkspaceTab =
  | "generator"
  | "portal"
  | "director"
  | "studio"
  | "guide"
  | "history"
  | "about"
  | "privacy"
  | "terms"
  | "contact";

export type EngineId = "wan22" | "minimax" | "veo" | "hunyuan" | "ltx" | "flux1" | "sdxl";
export type WanVariant = "a14b" | "ti2v_5b";
export type GoogleVideoModel = "veo-3.1" | "veo-3.1-fast";
export type GoogleVideoDetail = "short" | "balanced" | "professional";
export type GoogleVideoLanguage =
  | "English"
  | "Arabic"
  | "French"
  | "Spanish"
  | "German"
  | "Italian"
  | "Portuguese"
  | "Turkish"
  | "Japanese"
  | "Korean"
  | "Chinese"
  | "Hindi";

export type GenerationMode = "t2v" | "i2v" | "flf2v" | "s2v" | "film" | "t2i" | "img2img";

export type AIProvider = "gemini" | "ollama";
export type PromptFormat = "official" | "structured";

export interface ShotItem {
  id: number;
  role: string;
  camera: string;
  description: string;
}

export interface ReferenceImageState {
  dataUrl: string;
  base64: string;
  mimeType: string;
  fileName: string;
  width: number;
  height: number;
  detectedAspect: string;
}

export type PhysicsHintId =
  | "gravity"
  | "fluid"
  | "volumetric"
  | "subsurface"
  | "inertia"
  | "caustics";

export type AudioTagId =
  | "bass"
  | "whoosh"
  | "clicks"
  | "music"
  | "ambient"
  | "foley";

export interface StudioFormState {
  engine: EngineId;
  wanVariant: WanVariant;
  promptFormat: PromptFormat;
  mode: GenerationMode;
  category: string;
  subject: string;
  environment: string;
  action: string;
  camera: string;
  cameraMovement: string;
  cameraLens: string;
  light: string;
  style: string;
  extra: string;
  aspect: string;
  duration: number;
  motionScale: number;
  shotsCount: number;
  shots: ShotItem[];
  cfgScale: number;
  steps: number;
  loraTags: string;
  seed: number;
  seedLocked: boolean;
  physicsHints: PhysicsHintId[];
  includeAudio: boolean;
  audioTags: AudioTagId[];
  audioDescription: string;
  negative: string;
  negativeEdited: boolean;
  aiProvider: AIProvider;
  ollamaModel: string;
  minimaxResolution: "1080P" | "768P";
  minimaxCameraCommands: string[];
  minimaxCustomDirective: string;
  minimaxPromptOptimizer: boolean;
  veoModel: GoogleVideoModel;
  veoResolution: "720p" | "1080p";
  veoDialogue: string;
  veoSoundEffects: string;
  veoDetail: GoogleVideoDetail;
  veoLanguage: GoogleVideoLanguage;
  smartSceneGuard?: boolean;
}

export interface HistoryEntry {
  id: string;
  engine: EngineId;
  wanVariant?: WanVariant;
  mode: GenerationMode;
  category: string;
  shotsCount: number;
  title: string;
  time: string;
  timestamp: number;
  isFavorite?: boolean;
  prompt: string;
  positiveOnly: string;
  negativeOnly: string;
  source?: "studio" | "generator_v1" | "director_v2";
  stateSnapshot?: Partial<StudioFormState>;
  generatorSnapshot?: {
    result: VideoGeneratorResult;
    idea: string;
  };
  directorSnapshot?: {
    options: DirectorEnhanceOptions;
    output: string;
  };
}

export interface PresetItem {
  id: string;
  engine: EngineId;
  vertical: string;
  labels: Record<Language, string>;
  data: Partial<StudioFormState>;
}

export interface EngineSpec {
  id: EngineId;
  name: string;
  vendor: string;
  kind: "video" | "image";
  encoder: string;
  modes: GenerationMode[];
  supportsNegative: boolean;
  supportsStoryboard: boolean;
  defaultMode: GenerationMode;
  defaultDuration: number;
  defaultCfg: number;
  defaultSteps: number;
  aspectOptions: string[];
  durationOptions: { value: number; label: string }[];
  recommendedSummary: Record<Language, string>;
  bestPractices: Record<Language, string[]>;
}

export interface PromptQualityIssue {
  id: string;
  severity: "warning" | "info";
  title: Record<Language, string>;
  detail: Record<Language, string>;
}

export interface PromptQualityReport {
  score: number;
  repeatedWords: string[];
  issues: PromptQualityIssue[];
  breakdown: {
    clarity: number;
    continuity: number;
    pacing: number;
    motionCoherence: number;
  };
}

export interface SceneChainContext {
  engine: EngineId;
  style: string;
  character: string;
  environment: string;
  camera: string;
  lighting: string;
  seed: number;
}

export interface SceneChainItem {
  id: number;
  order: number;
  idea: string;
  prompt: string;
  positiveOnly: string;
  negativeOnly: string;
  engine: EngineId;
  createdAt: number;
  jobId?: string;
  sceneId?: string;
  continuityState?: string;
}

export interface SceneChainState {
  baseContext: SceneChainContext | null;
  scenes: SceneChainItem[];
}

// Video Prompt Generator v1.0 Types (10 + 20 up to 30 film scenes)
export type VideoGeneratorModel = "wan" | "minimax" | "google";
export type VideoGeneratorMode = "normal" | "film" | "film_10";
export type VideoGeneratorLang = "ar" | "en";

export interface VideoGeneratorRequest {
  idea: string;
  model: VideoGeneratorModel;
  mode: VideoGeneratorMode;
  scenes: number;
  shotLen: number;
  style: string;
  lang: VideoGeneratorLang;
  allowMinimaxMerge?: boolean;
}

export interface VideoGeneratorScene {
  sceneNumber: number;
  narrativeBeat: string;
  prompt: string;
}

export interface VideoGeneratorConsistencyNotes {
  character: string;
  palette: string;
  lens: string;
}

export interface VideoGeneratorResult {
  version: string;
  model: VideoGeneratorModel;
  mode: VideoGeneratorMode;
  style: string;
  lang: VideoGeneratorLang;
  shotLen: number;
  singlePrompt: string;
  scenes: VideoGeneratorScene[];
  consistencyNotes: VideoGeneratorConsistencyNotes | null;
  formattedOutput: string;
}

export interface SavedSequenceEntry {
  id: string;
  title: string;
  idea: string;
  model: VideoGeneratorModel;
  mode: VideoGeneratorMode;
  style: string;
  lang: VideoGeneratorLang;
  shotLen: number;
  scenes: VideoGeneratorScene[];
  consistencyNotes: VideoGeneratorConsistencyNotes | null;
  formattedOutput: string;
  createdAt: number;
  isFavorite: boolean;
}
