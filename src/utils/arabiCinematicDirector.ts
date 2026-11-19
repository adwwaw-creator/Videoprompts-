export type DirectorEngineId =
  | "veo"
  | "wan"
  | "minimax"
  | "kling"
  | "runway"
  | "pika"
  | "luma"
  | "sora"
  | "hailuo"
  | "generic";

export type DirectorGenreId =
  | "cinematic"
  | "documentary"
  | "anime"
  | "noir"
  | "scifi"
  | "fantasy"
  | "horror"
  | "commercial"
  | "vlog";

export type DirectorShotTypeId =
  | "establishing"
  | "wide"
  | "medium"
  | "closeup"
  | "extreme_closeup"
  | "tracking"
  | "dolly"
  | "crane"
  | "aerial"
  | "pov"
  | "over_shoulder"
  | "dutch"
  | "handheld"
  | "static";

export type DirectorCameraMovementId =
  | "push_in"
  | "pull_out"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "orbit"
  | "arc"
  | "zoom_in"
  | "zoom_out"
  | "tracking_forward"
  | "handheld_follow"
  | "whip_pan"
  | "vertigo";

export type DirectorGradingId =
  | "teal_orange"
  | "bleach_bypass"
  | "warm_vintage"
  | "cold_cyber"
  | "natural"
  | "monochrome"
  | "sepia"
  | "pastel"
  | "neon"
  | "golden_hour";

export type DirectorMoodId =
  | "epic"
  | "intimate"
  | "tense"
  | "joyful"
  | "melancholic"
  | "mysterious"
  | "heroic"
  | "serene"
  | "chaotic"
  | "nostalgic";

export type DirectorLanguageId = "en" | "ar" | "fr" | "es";
export type DirectorOutputFormat = "markdown" | "json" | "plain";

export interface TimelineBeat {
  start: number;
  end: number;
  role: string;
}

export interface DirectorEnhanceOptions {
  prompt: string;
  duration?: number;
  engine?: DirectorEngineId | string;
  aspectRatio?: string;
  fps?: number;
  genre?: DirectorGenreId | null;
  shotType?: DirectorShotTypeId | null;
  cameraMovements?: DirectorCameraMovementId[];
  lens?: string | null;
  mood?: DirectorMoodId | null;
  grading?: DirectorGradingId | null;
  lightingStyle?: string | null;
  audioStyle?: string | null;
  camera?: boolean;
  physics?: boolean;
  lighting?: boolean;
  sound?: boolean;
  continuity?: boolean;
  timeline?: boolean;
  beats?: TimelineBeat[] | null;
  negatives?: string[];
  references?: string[];
  language?: DirectorLanguageId;
  format?: DirectorOutputFormat;
}

export const DEFAULT_TIMELINE_BEATS: TimelineBeat[] = [
  { start: 0, end: 0.25, role: "Establishing shot — set scene, context, mood" },
  { start: 0.25, end: 0.65, role: "Main cinematic action — core narrative beat" },
  { start: 0.65, end: 0.85, role: "Rising tension — build to climax" },
  { start: 0.85, end: 1, role: "Visual climax and resolution — memorable ending" },
];

export const DEFAULT_DIRECTOR_NEGATIVES: string[] = [
  "No visual glitches",
  "No inconsistent character identity",
  "No sudden camera jumps",
  "No random scene transitions",
  "No morphing artifacts",
  "No flicker",
];

const CONFIG = {
  defaultDuration: 15,
  defaultFPS: 24,
  defaultAspectRatio: "16:9",
  quality: "Ultra Cinematic",
  maxDuration: 120,
  minDuration: 1,
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9", "2.39:1"] as const,
  supportedFPS: [24, 25, 30, 48, 60] as const,
};

const ENGINES: Record<DirectorEngineId, string> = {
  veo: "Google Veo",
  wan: "WAN",
  minimax: "MiniMax",
  kling: "Kling",
  runway: "Runway",
  pika: "Pika",
  luma: "Luma Dream Machine",
  sora: "OpenAI Sora",
  hailuo: "Hailuo AI",
  generic: "Universal Video AI",
};

const GENRES: Record<
  DirectorGenreId,
  { name: string; arName: string; instructions: string; grading: string }
> = {
  cinematic: {
    name: "Cinematic Film",
    arName: "فيلم سينمائي",
    instructions:
      "Feature-film quality. Dramatic composition, shallow depth of field, anamorphic lens character, film grain.",
    grading: "Teal & orange, high contrast, filmic LUT",
  },
  documentary: {
    name: "Documentary",
    arName: "وثائقي",
    instructions:
      "Naturalistic handheld feel, observational framing, authentic lighting, minimal stylization.",
    grading: "Neutral, true-to-life colors, subtle contrast",
  },
  anime: {
    name: "Anime / Animation",
    arName: "أنمي / رسوم متحركة",
    instructions:
      "Stylized cel-shaded visuals, expressive motion, dynamic poses, vibrant palette.",
    grading: "Saturated, high-key lighting, soft shadows",
  },
  noir: {
    name: "Film Noir",
    arName: "فيلم نوار",
    instructions:
      "High-contrast black & white, hard shadows, venetian blinds, dramatic silhouettes.",
    grading: "Monochrome, deep blacks, silver highlights",
  },
  scifi: {
    name: "Sci-Fi / Futuristic",
    arName: "خيال علمي",
    instructions:
      "Futuristic technology, volumetric light, holographic UI, sleek surfaces, atmospheric haze.",
    grading: "Cyan/magenta accents, cool tones, neon highlights",
  },
  fantasy: {
    name: "Fantasy / Epic",
    arName: "فانتازيا / ملحمي",
    instructions:
      "Mythical landscapes, magical atmosphere, epic scale, painterly realism.",
    grading: "Warm golden hour, rich earthy tones, ethereal glow",
  },
  horror: {
    name: "Horror / Thriller",
    arName: "رعب / تشويق",
    instructions:
      "Unsettling atmosphere, negative space, creeping camera, deep shadows, practical lighting sources.",
    grading: "Desaturated, crushed blacks, cold tint",
  },
  commercial: {
    name: "Commercial / Product",
    arName: "إعلان تجاري / منتج",
    instructions:
      "Clean studio lighting, macro detail, smooth slider moves, immaculate product presentation.",
    grading: "Bright, clean, brand-accurate colors",
  },
  vlog: {
    name: "Vlog / Lifestyle",
    arName: "فلوق / أسلوب حياة",
    instructions:
      "Authentic handheld, natural light, candid moments, intimate framing.",
    grading: "Warm, natural, slightly desaturated",
  },
};

const SHOT_TYPES: Record<DirectorShotTypeId, string> = {
  establishing: "Wide establishing shot revealing the full scene and environment",
  wide: "Wide shot showing subject within full environment context",
  medium: "Medium shot framing subject from waist up",
  closeup: "Close-up shot emphasizing facial detail and emotion",
  extreme_closeup: "Extreme close-up on a specific detail (eyes, hands, object)",
  tracking: "Tracking shot following the subject's movement",
  dolly: "Dolly shot moving toward or away from the subject",
  crane: "Crane/jib shot rising or descending through space",
  aerial: "Aerial drone shot providing bird's-eye perspective",
  pov: "Point-of-view shot from the character's perspective",
  over_shoulder: "Over-the-shoulder shot creating intimacy",
  dutch: "Dutch angle tilted shot creating tension",
  handheld: "Handheld shot with natural movement and imperfection",
  static: "Locked-off static shot on tripod",
};

const CAMERA_MOVEMENTS: Record<DirectorCameraMovementId, string> = {
  push_in: "Slow push in toward subject",
  pull_out: "Gradual pull out revealing context",
  pan_left: "Smooth pan to the left",
  pan_right: "Smooth pan to the right",
  tilt_up: "Tilt up to reveal height",
  tilt_down: "Tilt down to reveal detail",
  orbit: "Orbit around subject",
  arc: "Arc movement around subject",
  zoom_in: "Optical zoom in",
  zoom_out: "Optical zoom out",
  tracking_forward: "Tracking forward with subject",
  handheld_follow: "Handheld follow cam behind subject",
  whip_pan: "Fast whip pan transition",
  vertigo: "Vertigo/dolly zoom effect",
};

const GRADING_PRESETS: Record<DirectorGradingId, string> = {
  teal_orange: "Teal & orange blockbuster look",
  bleach_bypass: "Bleach bypass high-contrast desaturated",
  warm_vintage: "Warm vintage film with soft highlights",
  cold_cyber: "Cold cyan/blue cyberpunk palette",
  natural: "Natural true-to-life color reproduction",
  monochrome: "Black and white monochrome",
  sepia: "Sepia-toned nostalgic look",
  pastel: "Soft pastel dreamy palette",
  neon: "Vibrant neon club lighting",
  golden_hour: "Golden hour warm sunlight",
};

const MOODS: Record<DirectorMoodId, string> = {
  epic: "Epic, grand, awe-inspiring",
  intimate: "Intimate, personal, emotional",
  tense: "Tense, suspenseful, uneasy",
  joyful: "Joyful, uplifting, energetic",
  melancholic: "Melancholic, reflective, quiet",
  mysterious: "Mysterious, enigmatic, alluring",
  heroic: "Heroic, triumphant, powerful",
  serene: "Serene, peaceful, meditative",
  chaotic: "Chaotic, frenetic, overwhelming",
  nostalgic: "Nostalgic, warm, memory-like",
};

const LANGUAGES: Record<DirectorLanguageId, { name: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", dir: "ltr" },
  ar: { name: "العربية", dir: "rtl" },
  fr: { name: "Français", dir: "ltr" },
  es: { name: "Español", dir: "ltr" },
};

export const DIRECTOR_UI_LABELS = {
  shotTypes: {
    establishing: { ar: "لقطة تأسيسية شاملة", en: "Establishing Shot" },
    wide: { ar: "لقطة واسعة (Wide)", en: "Wide Shot" },
    medium: { ar: "لقطة متوسطة (Medium)", en: "Medium Shot" },
    closeup: { ar: "لقطة قريبة (Close-up)", en: "Close-Up" },
    extreme_closeup: { ar: "لقطة قريبة جداً (Macro)", en: "Extreme Close-Up" },
    tracking: { ar: "لقطة تتبع (Tracking)", en: "Tracking Shot" },
    dolly: { ar: "دولي (Dolly)", en: "Dolly Shot" },
    crane: { ar: "رافعة / كرين (Crane)", en: "Crane / Jib" },
    aerial: { ar: "جوية / درون (Aerial)", en: "Aerial Drone" },
    pov: { ar: "منظور الشخص الأول (POV)", en: "POV Shot" },
    over_shoulder: { ar: "فوق الكتف (OTS)", en: "Over-the-Shoulder" },
    dutch: { ar: "زاوية مائلة (Dutch)", en: "Dutch Angle" },
    handheld: { ar: "محمولة باليد (Handheld)", en: "Handheld" },
    static: { ar: "ثابتة على ترايبود (Static)", en: "Locked-Off Static" },
  } satisfies Record<DirectorShotTypeId, { ar: string; en: string }>,
  cameraMovements: {
    push_in: { ar: "تقدّم بطيء (Push-in)", en: "Push In" },
    pull_out: { ar: "تراجع تدريجي (Pull-out)", en: "Pull Out" },
    pan_left: { ar: "تحريك أفقي يسار", en: "Pan Left" },
    pan_right: { ar: "تحريك أفقي يمين", en: "Pan Right" },
    tilt_up: { ar: "إمالة للأعلى (Tilt Up)", en: "Tilt Up" },
    tilt_down: { ar: "إمالة للأسفل (Tilt Down)", en: "Tilt Down" },
    orbit: { ar: "دوران كامل (Orbit)", en: "Orbit" },
    arc: { ar: "حركة قوسية (Arc)", en: "Arc" },
    zoom_in: { ar: "تقريب بصري (Zoom In)", en: "Zoom In" },
    zoom_out: { ar: "تبعيد بصري (Zoom Out)", en: "Zoom Out" },
    tracking_forward: { ar: "تتبع للأمام", en: "Tracking Forward" },
    handheld_follow: { ar: "متابعة محمولة خلف الهدف", en: "Handheld Follow" },
    whip_pan: { ar: "تحريك خاطف (Whip Pan)", en: "Whip Pan" },
    vertigo: { ar: "تأثير الدوار (Dolly Zoom)", en: "Vertigo Effect" },
  } satisfies Record<DirectorCameraMovementId, { ar: string; en: string }>,
  grading: {
    teal_orange: { ar: "أزرق وبرتقالي سينمائي", en: "Teal & Orange" },
    bleach_bypass: { ar: "تباين عالٍ باهت (Bleach Bypass)", en: "Bleach Bypass" },
    warm_vintage: { ar: "فيلم كلاسيكي دافئ", en: "Warm Vintage" },
    cold_cyber: { ar: "سيان/سايبربانك بارد", en: "Cold Cyberpunk" },
    natural: { ar: "ألوان طبيعية واقعية", en: "Natural True-to-Life" },
    monochrome: { ar: "أبيض وأسود", en: "Monochrome B&W" },
    sepia: { ar: "سيبيا حنيني", en: "Sepia Nostalgic" },
    pastel: { ar: "باستيل حالم", en: "Soft Pastel" },
    neon: { ar: "نيون نابض", en: "Vibrant Neon" },
    golden_hour: { ar: "الساعة الذهبية", en: "Golden Hour" },
  } satisfies Record<DirectorGradingId, { ar: string; en: string }>,
  moods: {
    epic: { ar: "ملحمي مهيب", en: "Epic & Grand" },
    intimate: { ar: "حميمي وعاطفي", en: "Intimate & Personal" },
    tense: { ar: "متوتر ومشوق", en: "Tense & Suspenseful" },
    joyful: { ar: "مبهج ومفعم بالطاقة", en: "Joyful & Energetic" },
    melancholic: { ar: "شجي وتأملي", en: "Melancholic & Quiet" },
    mysterious: { ar: "غامض وآسر", en: "Mysterious" },
    heroic: { ar: "بطولي منتصر", en: "Heroic & Powerful" },
    serene: { ar: "هادئ ومطمئن", en: "Serene & Peaceful" },
    chaotic: { ar: "فوضوي متسارع", en: "Chaotic & Frenetic" },
    nostalgic: { ar: "دافئ حنيني", en: "Nostalgic" },
  } satisfies Record<DirectorMoodId, { ar: string; en: string }>,
};

function sanitize(str: unknown): string {
  return String(str ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function validate(options: Partial<DirectorEnhanceOptions>): string[] {
  const errors: string[] = [];

  if (!options.prompt || !String(options.prompt).trim()) {
    errors.push("Prompt is required and cannot be empty.");
  }

  if (options.duration !== undefined) {
    const duration = Number(options.duration);
    if (Number.isNaN(duration)) {
      errors.push("Duration must be a number.");
    } else if (duration < CONFIG.minDuration || duration > CONFIG.maxDuration) {
      errors.push(
        `Duration must be between ${CONFIG.minDuration} and ${CONFIG.maxDuration} seconds.`
      );
    }
  }

  if (
    options.aspectRatio &&
    !(CONFIG.supportedAspectRatios as readonly string[]).includes(options.aspectRatio)
  ) {
    errors.push(
      `Unsupported aspect ratio. Use one of: ${CONFIG.supportedAspectRatios.join(", ")}`
    );
  }

  if (
    options.fps !== undefined &&
    !(CONFIG.supportedFPS as readonly number[]).includes(Number(options.fps))
  ) {
    errors.push(`Unsupported FPS. Use one of: ${CONFIG.supportedFPS.join(", ")}`);
  }

  if (
    options.engine &&
    !ENGINES[String(options.engine).toLowerCase() as DirectorEngineId]
  ) {
    errors.push(`Unknown engine. Available: ${Object.keys(ENGINES).join(", ")}`);
  }

  return errors;
}

function buildTimeline(duration: number, beats?: TimelineBeat[] | null): string {
  const timelineBeats =
    Array.isArray(beats) && beats.length > 0 ? beats : DEFAULT_TIMELINE_BEATS;

  return timelineBeats
    .map((part) => {
      const start = Math.round(duration * part.start * 10) / 10;
      const end = Math.round(duration * part.end * 10) / 10;
      return `${start}s → ${end}s: ${sanitize(part.role)}`;
    })
    .join("\n");
}

function buildCameraModule(opts: {
  shotType?: DirectorShotTypeId | null;
  cameraMovements?: DirectorCameraMovementId[];
  lens?: string | null;
}): string {
  const { shotType, cameraMovements, lens } = opts;
  const lines = ["CAMERA DIRECTION:"];

  if (shotType && SHOT_TYPES[shotType]) {
    lines.push(`- Primary shot: ${SHOT_TYPES[shotType]}`);
  }

  if (Array.isArray(cameraMovements) && cameraMovements.length > 0) {
    const moves = cameraMovements
      .filter((m) => CAMERA_MOVEMENTS[m])
      .map((m) => CAMERA_MOVEMENTS[m]);
    if (moves.length) lines.push(`- Movement: ${moves.join("; ")}`);
  }

  if (lens && sanitize(lens)) {
    lines.push(`- Lens: ${sanitize(lens)}`);
  }

  lines.push(
    "- Professional cinematic camera language.",
    "- Smooth intentional camera movement with natural acceleration/deceleration.",
    "- Consistent framing and spatial orientation.",
    "- No random camera movement."
  );

  return lines.join("\n");
}

function buildPhysicsModule(): string {
  return [
    "PHYSICAL REALISM:",
    "- Physically plausible object movement.",
    "- Realistic gravity, water, wind, smoke, and particles.",
    "- Natural interaction between characters and environment.",
    "- No impossible transformations.",
  ].join("\n");
}

function buildLightingModule(lightingStyle?: string | null): string {
  const lines = [
    "CINEMATIC LIGHTING:",
    "- Physically coherent lighting.",
    "- Natural shadows and reflections.",
    "- Consistent exposure and color temperature.",
    "- Professional cinematic color grading.",
  ];
  if (lightingStyle && sanitize(lightingStyle)) {
    lines.push(`- Style: ${sanitize(lightingStyle)}`);
  }
  return lines.join("\n");
}

function buildContinuityModule(): string {
  return [
    "CONTINUITY CONTROL:",
    "- Maintain same characters, clothing, objects, environment, architecture, and spatial relationships.",
    "- Preserve visual identity across every frame.",
    "- No duplicated subjects.",
    "- No object morphing.",
    "- No unexplained scene changes.",
    "- No flickering or temporal inconsistency.",
  ].join("\n");
}

function buildAudioModule(audioStyle?: string | null): string {
  const lines = [
    "AUDIO DIRECTION:",
    "- Natural synchronized environmental sound.",
    "- Realistic ambience, weather, and environmental effects.",
    "- No unnecessary dialogue or music.",
  ];
  if (audioStyle && sanitize(audioStyle)) {
    lines.push(`- Style: ${sanitize(audioStyle)}`);
  }
  return lines.join("\n");
}

function buildGenreModule(genre?: DirectorGenreId | null): string {
  if (!genre || !GENRES[genre]) return "";
  const g = GENRES[genre];
  return [
    `GENRE STYLING (${g.name}):`,
    `- ${g.instructions}`,
    `- Color grading: ${g.grading}`,
  ].join("\n");
}

function buildMoodModule(mood?: DirectorMoodId | null): string {
  if (!mood || !MOODS[mood]) return "";
  return [
    "MOOD & ATMOSPHERE:",
    `- ${MOODS[mood]}`,
    "- Emotional tone must be consistent throughout.",
  ].join("\n");
}

function buildGradingModule(grading?: DirectorGradingId | null): string {
  if (!grading || !GRADING_PRESETS[grading]) return "";
  return ["COLOR GRADING:", `- ${GRADING_PRESETS[grading]}`].join("\n");
}

function buildNegativeModule(negatives?: string[]): string {
  const custom = Array.isArray(negatives)
    ? negatives.map(sanitize).filter(Boolean)
    : [];
  const all = [...new Set([...DEFAULT_DIRECTOR_NEGATIVES, ...custom])];

  return ["NEGATIVE PROMPT (avoid):", ...all.map((n) => `- ${n}`)].join("\n");
}

function buildReferenceModule(refs?: string[]): string {
  if (!Array.isArray(refs)) return "";
  const cleaned = refs.map(sanitize).filter(Boolean);
  if (cleaned.length === 0) return "";
  return [
    "REFERENCE FRAMES:",
    ...cleaned.map((r, i) => `- Ref ${i + 1}: ${r}`),
  ].join("\n");
}

function formatOutput(
  text: string,
  format: DirectorOutputFormat | string,
  meta: {
    engine: string;
    duration: number;
    fps: number;
    aspect: string;
    modules: string[];
    prompt: string;
  }
): string {
  switch (String(format).toLowerCase()) {
    case "json":
      return JSON.stringify(
        {
          version: "2.0",
          engine: meta.engine,
          duration: meta.duration,
          fps: meta.fps,
          aspectRatio: meta.aspect,
          prompt: meta.prompt,
          modules: meta.modules,
          fullPrompt: text,
        },
        null,
        2
      );

    case "plain":
      return text.replace(/\[([^\]]+)\]/g, "== $1 ==");

    case "markdown":
    default:
      return text;
  }
}

function enhance(options: DirectorEnhanceOptions): string {
  const errors = validate(options);
  if (errors.length) {
    throw new Error("Validation failed:\n- " + errors.join("\n- "));
  }

  const {
    prompt,
    duration = CONFIG.defaultDuration,
    engine = "generic",
    aspectRatio = CONFIG.defaultAspectRatio,
    fps = CONFIG.defaultFPS,
    genre = null,
    shotType = null,
    cameraMovements = [],
    lens = null,
    mood = null,
    grading = null,
    lightingStyle = null,
    audioStyle = null,
    camera = true,
    physics = true,
    lighting = true,
    sound = true,
    continuity = true,
    timeline = true,
    beats = null,
    negatives = [],
    references = [],
    language = "en",
    format = "markdown",
  } = options;

  const safeDuration = Math.min(
    CONFIG.maxDuration,
    Math.max(CONFIG.minDuration, Number(duration) || CONFIG.defaultDuration)
  );

  const selectedEngine =
    ENGINES[String(engine).toLowerCase() as DirectorEngineId] || ENGINES.generic;

  const safeAspect = (CONFIG.supportedAspectRatios as readonly string[]).includes(
    aspectRatio
  )
    ? aspectRatio
    : CONFIG.defaultAspectRatio;

  const safeFps = (CONFIG.supportedFPS as readonly number[]).includes(Number(fps))
    ? Number(fps)
    : CONFIG.defaultFPS;

  const cleanPrompt = sanitize(prompt);

  const modules: string[] = [];

  if (genre) {
    const m = buildGenreModule(genre);
    if (m) modules.push(m);
  }

  if (mood) {
    const m = buildMoodModule(mood);
    if (m) modules.push(m);
  }

  if (camera) {
    modules.push(buildCameraModule({ shotType, cameraMovements, lens }));
  }

  if (physics) modules.push(buildPhysicsModule());
  if (lighting) modules.push(buildLightingModule(lightingStyle));
  if (continuity) modules.push(buildContinuityModule());
  if (sound) modules.push(buildAudioModule(audioStyle));

  if (grading) {
    const m = buildGradingModule(grading);
    if (m) modules.push(m);
  }

  const timelineBlock = timeline
    ? [
        "TEMPORAL DIRECTING:",
        buildTimeline(safeDuration, beats),
        "",
        "The timeline describes one coherent scene.",
        "Preserve the original idea and action.",
        "Do not introduce unrelated events.",
        "Transitions must be physically and visually coherent.",
      ].join("\n")
    : "";

  const negativesBlock = buildNegativeModule(negatives);
  const referencesBlock = buildReferenceModule(references);

  const output = [
    "[VIDEOPROMPTS CINEMATIC DIRECTOR v2.0]",
    "",
    "VIDEO ENGINE: " + selectedEngine,
    "DURATION: " + safeDuration + " seconds",
    "FRAME RATE: " + safeFps + " FPS",
    "ASPECT RATIO: " + safeAspect,
    "LANGUAGE: " + (LANGUAGES[language]?.name || "English"),
    "",
    "[ORIGINAL CREATIVE IDEA]",
    cleanPrompt,
    "",
    "[DIRECTOR'S INSTRUCTIONS]",
    modules.filter(Boolean).join("\n\n"),
    "",
    timelineBlock,
    "",
    referencesBlock,
    "",
    "[VISUAL QUALITY]",
    "Ultra-realistic cinematic image.",
    "Professional composition.",
    "Natural motion blur.",
    "Detailed environmental textures.",
    "Consistent depth and perspective.",
    "High-quality temporal coherence.",
    "",
    negativesBlock,
    "",
    "[END OF CINEMATIC DIRECTOR]",
  ]
    .filter((block, idx, arr) => {
      if (block === "" && arr[idx - 1] === "") return false;
      return true;
    })
    .join("\n")
    .trim();

  return formatOutput(output, format, {
    engine: selectedEngine,
    duration: safeDuration,
    fps: safeFps,
    aspect: safeAspect,
    modules,
    prompt: cleanPrompt,
  });
}

export const ArabiCinematicDirector = {
  version: "2.0",
  enhance,
  buildTimeline,
  validate,
  sanitize,
  formatOutput,
  engines: ENGINES,
  genres: GENRES,
  shotTypes: SHOT_TYPES,
  cameraMovements: CAMERA_MOVEMENTS,
  gradingPresets: GRADING_PRESETS,
  moods: MOODS,
  languages: LANGUAGES,
  config: CONFIG,
};

export default ArabiCinematicDirector;
