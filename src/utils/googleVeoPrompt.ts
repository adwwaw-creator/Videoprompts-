import {
  GoogleVideoDetail,
  GoogleVideoLanguage,
  GoogleVideoModel,
  StudioFormState,
} from "../types/prompt";

export type { GoogleVideoModel };

export const GOOGLE_VEO_LANGUAGES: {
  id: GoogleVideoLanguage;
  native: string;
}[] = [
  { id: "English", native: "English" },
  { id: "Arabic", native: "العربية" },
  { id: "French", native: "Français" },
  { id: "Spanish", native: "Español" },
  { id: "German", native: "Deutsch" },
  { id: "Italian", native: "Italiano" },
  { id: "Portuguese", native: "Português" },
  { id: "Turkish", native: "Türkçe" },
  { id: "Japanese", native: "日本語" },
  { id: "Korean", native: "한국어" },
  { id: "Chinese", native: "中文" },
  { id: "Hindi", native: "हिन्दी" },
];

export interface GoogleVideoPromptInput {
  model: GoogleVideoModel;
  idea: string;
  subject?: string;
  environment?: string;
  action?: string;
  camera?: string;
  lighting?: string;
  style?: string;
  duration?: 4 | 6 | 8;
  aspectRatio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p";
  audio?: boolean;
  dialogue?: string;
  soundEffects?: string;
  negativePrompt?: string;
  language?: GoogleVideoLanguage;
  detail?: GoogleVideoDetail;
}

export interface GoogleVideoPromptResult {
  model: GoogleVideoModel;
  prompt: string;
  settings: {
    duration: 4 | 6 | 8;
    aspectRatio: "16:9" | "9:16";
    resolution: "720p" | "1080p";
    audio: boolean;
    language: GoogleVideoLanguage;
  };
  meta: {
    promptChars: number;
    maxPromptChars: number;
    warnings: string[];
  };
}

/* ============================================================
   قواعد خاصة بكل موديل
   ============================================================ */
export const MODEL_RULES: Record<GoogleVideoModel, string> = {
  "veo-3.1": `
GOOGLE VEO 3.1 (FULL):
- Model supports rich cinematic direction with native synchronized audio.
- Use precise physical motion, realistic interactions and natural physics.
- Describe subject appearance, materials and continuity carefully.
- Full camera language is allowed: lenses, movement, framing, focus.
- Audio direction (dialogue, ambience, SFX) is supported natively.
- Avoid overloading the prompt; keep the main action unambiguous.
`,
  "veo-3.1-fast": `
GOOGLE VEO 3.1 FAST:
- Optimized for short, direct, high-signal prompts.
- Prioritize ONE main subject and ONE primary action.
- Use simple, direct camera and lighting instructions.
- Avoid complex scene changes, multi-shot sequences and heavy detail.
- Do NOT rely on complex dialogue or layered audio direction.
- Keep total prompt compact; remove decorative language.
`,
};

/* ============================================================
   إعدادات كل موديل (قيم افتراضية وآمنة)
   ============================================================ */
export const MODEL_CAPABILITIES: Record<
  GoogleVideoModel,
  {
    maxPromptChars: number;
    supportedDurations: Array<4 | 6 | 8>;
    supportedResolutions: Array<"720p" | "1080p">;
    supportedAspectRatios: Array<"16:9" | "9:16">;
    audioReliable: boolean;
  }
> = {
  "veo-3.1": {
    maxPromptChars: 4000,
    supportedDurations: [4, 6, 8],
    supportedResolutions: ["720p", "1080p"],
    supportedAspectRatios: ["16:9", "9:16"],
    audioReliable: true,
  },
  "veo-3.1-fast": {
    maxPromptChars: 1200,
    supportedDurations: [4, 6, 8],
    supportedResolutions: ["720p", "1080p"],
    supportedAspectRatios: ["16:9", "9:16"],
    audioReliable: false,
  },
};

/* ============================================================
   مساعدات داخلية
   ============================================================ */
function clampToSupported<T extends string | number>(
  value: T,
  supported: T[],
  fallback: T,
  label: string,
  warnings: string[]
): T {
  if (!supported.includes(value)) {
    warnings.push(
      `Unsupported ${label} "${value}" for the selected model. Using "${fallback}".`
    );
    return fallback;
  }
  return value;
}

function validateNegativePrompt(np: string, warnings: string[]) {
  const banned = ["sex", "violence", "gore", "weapon", "nudity", "hate"];
  const lower = np.toLowerCase();
  for (const word of banned) {
    if (lower.includes(word)) {
      warnings.push(
        `Negative prompt contains a restricted term ("${word}"). It may be filtered by Veo safety systems.`
      );
      break;
    }
  }
}

function buildShotBreakdown(
  duration: number,
  action: string,
  camera: string
): string {
  if (duration <= 4) {
    return `SHOT 1 (0–${duration}s): ${camera}. ${action}`;
  }
  if (duration <= 6) {
    return [
      `SHOT 1 (0–${Math.round(duration / 2)}s): Establishing — ${camera}. ${action}`,
      `SHOT 2 (${Math.round(duration / 2)}–${duration}s): Continuation — maintain subject consistency.`,
    ].join("\n");
  }
  return [
    `SHOT 1 (0–3s): Establishing — ${camera}. ${action}`,
    `SHOT 2 (3–6s): Development — subject reacts physically, environment responds.`,
    `SHOT 3 (6–${duration}s): Resolution — stable frame, consistent lighting and physics.`,
  ].join("\n");
}

/* ============================================================
   الدالة الرئيسية
   ============================================================ */
export function generateGoogleVideoPrompt(
  input: GoogleVideoPromptInput
): GoogleVideoPromptResult {
  if (!input.idea?.trim()) {
    throw new Error("Please enter a video idea.");
  }

  const warnings: string[] = [];
  const caps = MODEL_CAPABILITIES[input.model];

  const {
    model,
    idea,
    subject = "",
    environment = "",
    action = "",
    camera = "Cinematic tracking shot",
    lighting = "Professional cinematic lighting",
    style = "Photorealistic cinematic",
    duration = 8,
    aspectRatio = "16:9",
    resolution = "1080p",
    audio = true,
    dialogue = "",
    soundEffects = "",
    negativePrompt = "",
    language = "English",
    detail = "professional",
  } = input;

  // ---- التحقق من الإعدادات مقابل قدرات الموديل ----
  const safeDuration = clampToSupported(
    duration,
    caps.supportedDurations,
    8,
    "duration",
    warnings
  );
  const safeResolution = clampToSupported(
    resolution,
    caps.supportedResolutions,
    "720p",
    "resolution",
    warnings
  );
  const safeAspectRatio = clampToSupported(
    aspectRatio,
    caps.supportedAspectRatios,
    "16:9",
    "aspect ratio",
    warnings
  );

  // ---- الصوت: Veo Fast قد لا يعطي نتائج موثوقة للصوت ----
  let effectiveAudio = audio;
  if (audio && !caps.audioReliable) {
    warnings.push(
      "Audio direction may not be reliably honored on veo-3.1-fast. Consider veo-3.1 for audio."
    );
    effectiveAudio = false;
  }

  if (negativePrompt) validateNegativePrompt(negativePrompt, warnings);

  // ---- تعليمات مستوى التفاصيل ----
  const detailInstruction = {
    short: "Use concise, direct cinematic instructions. One clear idea per line.",
    balanced: "Use focused cinematic instructions with a few visual details.",
    professional:
      "Use professional filmmaking language, precise motion direction and rich visual details.",
  }[detail];

  // ---- تعليمات خاصة بموديل Fast ----
  const isFast = model === "veo-3.1-fast";

  // ---- بناء البرومبت ----
  const shotBreakdown =
    !isFast && safeDuration > 4
      ? buildShotBreakdown(safeDuration, action || "primary action", camera)
      : "";

  const prompt = `
You are VideoPrompts' Google Veo video prompt director.

YOUR TASK:
Transform the user's idea into a professional, production-ready
Google Veo video prompt that will be sent to the Veo API as-is.

ORIGINAL IDEA:
${idea}

MAIN SUBJECT:
${subject || "Determine from the original idea."}

ENVIRONMENT:
${environment || "Determine from the original idea."}

MAIN ACTION:
${action || "Develop a logical, physically plausible action from the original idea."}

TARGET MODEL:
${model === "veo-3.1" ? "Google Veo 3.1 (Full)" : "Google Veo 3.1 Fast"}

MODEL-SPECIFIC INSTRUCTIONS:
${MODEL_RULES[model]}

VIDEO SPECIFICATIONS:
- Duration: ${safeDuration} seconds
- Aspect ratio: ${safeAspectRatio}
- Resolution: ${safeResolution}

CINEMATOGRAPHY:
- Camera: ${camera}
- Lighting: ${lighting}
- Visual style: ${style}

PROMPT STRUCTURE (follow this order):
1. CINEMATOGRAPHY — shot type, lens perspective, camera position and movement.
2. SUBJECT — appearance, clothing, materials, distinguishing details.
3. ACTION — exactly what happens, with logical physical timing.
4. CONTEXT — environment, background, atmosphere, interactions.
5. STYLE & AMBIANCE — colors, lighting mood, cinematic quality.
6. CONTINUITY — subject consistency, environment coherence, no contradictions.

${
  shotBreakdown
    ? `SHOT BREAKDOWN (recommended):\n${shotBreakdown}\n`
    : ""
}
AUDIO DIRECTION:
${
  effectiveAudio
    ? `Generate synchronized audio when supported.
- Dialogue: ${dialogue || "No specific dialogue requested."}
- Sound effects: ${soundEffects || "Natural, scene-appropriate SFX."}
- Include suitable ambient audio.`
    : "Do NOT request generated audio. Keep the output purely visual."
}

NEGATIVE CONSTRAINTS:
${
  negativePrompt ||
  "Avoid visual artifacts, flickering, distorted geometry, inconsistent appearance, unintended objects, watermark, text overlays."
}

DETAIL LEVEL:
${detailInstruction}

OUTPUT LANGUAGE:
${language}

IMPORTANT RULES:
- Preserve the original user's idea and intent exactly.
- Improve cinematic quality without changing meaning.
- Do NOT invent unsupported model parameters or API settings.
- Do NOT add unnecessary shots, characters, or actions.
- Keep instructions physically plausible and internally consistent.
- Do NOT confuse prompt text with API parameters.

FINAL RESULT:
Return a polished, copy-ready Google Veo prompt${isFast ? " (keep it under 1200 characters)" : ""}.
${
  !isFast
    ? "Include a concise shot breakdown when multiple actions or scene changes are required."
    : "Do not add multi-shot sequences."
}
`.trim();

  // ---- قص البرومبت إذا تجاوز الحد (Veo Fast) ----
  let finalPrompt = prompt;
  if (finalPrompt.length > caps.maxPromptChars) {
    warnings.push(
      `Prompt exceeded ${caps.maxPromptChars} chars for ${model}. Truncated to fit.`
    );
    finalPrompt =
      finalPrompt.slice(0, caps.maxPromptChars - 20).trimEnd() +
      "\n[TRUNCATED]";
  }

  return {
    model,
    prompt: finalPrompt,
    settings: {
      duration: safeDuration,
      aspectRatio: safeAspectRatio,
      resolution: safeResolution,
      audio: effectiveAudio,
      language,
    },
    meta: {
      promptChars: finalPrompt.length,
      maxPromptChars: caps.maxPromptChars,
      warnings,
    },
  };
}

export function extractVeoAspectRatio(aspect: string): "16:9" | "9:16" {
  return aspect.includes("9:16") ? "9:16" : "16:9";
}

export function compileGoogleVeoFromStudio(
  state: StudioFormState
): GoogleVideoPromptResult {
  const ideaText = (state.subject || state.action || "Cinematic scene").trim();
  const safeDur = (
    state.duration === 4 || state.duration === 6 || state.duration === 8
      ? state.duration
      : 8
  ) as 4 | 6 | 8;

  const customShots = state.shots
    .slice(0, state.shotsCount)
    .map((s) => s.description.trim())
    .filter(Boolean)
    .join(" ");

  const resolvedAction = [state.action.trim(), customShots]
    .filter(Boolean)
    .join(" ");

  return generateGoogleVideoPrompt({
    model: state.veoModel || "veo-3.1",
    idea: ideaText,
    subject: state.subject.trim() || undefined,
    environment: state.environment.trim() || undefined,
    action: resolvedAction || undefined,
    camera: state.camera.trim() || undefined,
    lighting: state.light.trim() || undefined,
    style: state.style.trim() || undefined,
    duration: safeDur,
    aspectRatio: extractVeoAspectRatio(state.aspect),
    resolution: state.veoResolution || "1080p",
    audio: state.includeAudio,
    dialogue: state.veoDialogue.trim() || undefined,
    soundEffects:
      state.veoSoundEffects.trim() || state.audioDescription.trim() || undefined,
    negativePrompt: state.negative.trim() || undefined,
    language: state.veoLanguage || "English",
    detail: state.veoDetail || "professional",
  });
}
