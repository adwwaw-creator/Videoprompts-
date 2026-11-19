import { AudioTagId, EngineId, EngineSpec, GenerationMode, WanVariant } from "../types/prompt";

export interface WanVariantSpec {
  id: WanVariant;
  name: string;
  modelRepo: string;
  fps: number;
  modes: GenerationMode[];
  defaultCfg: number;
  defaultSteps: number;
  aspectOptions: string[];
  durationOptions: { value: number; frames: number; label: string }[];
  note: Record<"ar" | "fr" | "en", string>;
}

export const WAN_VARIANTS: Record<WanVariant, WanVariantSpec> = {
  a14b: {
    id: "a14b",
    name: "WAN 2.2 A14B (MoE)",
    modelRepo: "Wan-AI/Wan2.2-T2V-A14B",
    fps: 16,
    modes: ["t2v", "i2v", "flf2v", "s2v"],
    defaultCfg: 5.0,
    defaultSteps: 30,
    aspectOptions: [
      "16:9 (1280x720)",
      "9:16 (720x1280)",
      "16:9 (832x480)",
      "9:16 (480x832)",
      "1:1 (1024x1024)",
    ],
    durationOptions: [
      { value: 5, frames: 81, label: "5s (81 frames @ 16fps · Optimal A14B)" },
      { value: 8, frames: 129, label: "8s (129 frames @ 16fps · Extended)" },
      { value: 10, frames: 161, label: "10s (161 frames @ 16fps · Extended)" },
      { value: 15, frames: 241, label: "15s (241 frames @ 16fps · Multi-Cut)" },
    ],
    note: {
      ar: "مسار MoE بقدرة 14B نشطة (16fps) · يدعم T2V و I2V و FLF2V بدقة 480p و 720p.",
      fr: "Architecture MoE 14B active (16fps) · Supporte T2V, I2V et FLF2V en 480p et 720p.",
      en: "14B active MoE architecture (16fps) · Supports T2V, I2V, and FLF2V at 480p/720p.",
    },
  },
  ti2v_5b: {
    id: "ti2v_5b",
    name: "WAN 2.2 TI2V-5B (Unified 24fps)",
    modelRepo: "Wan-AI/Wan2.2-TI2V-5B",
    fps: 24,
    modes: ["t2v", "i2v"],
    defaultCfg: 5.0,
    defaultSteps: 50,
    aspectOptions: [
      "16:9 (1280x704)",
      "9:16 (704x1280)",
      "1:1 (1024x1024)",
    ],
    durationOptions: [
      { value: 5, frames: 121, label: "5s (121 frames @ 24fps · Optimal)" },
      { value: 8, frames: 193, label: "8s (193 frames @ 24fps · Extended)" },
      { value: 10, frames: 241, label: "10s (241 frames @ 24fps · Multi-Cut)" },
    ],
    note: {
      ar: "نموذج موحد خفيف (24fps · مضاعفات 32 مثل 1280×704) · مثالي لكروت 24GB VRAM.",
      fr: "Modèle unifié rapide (24fps · résolutions 1280×704) · Optimisé GPU 24 Go VRAM.",
      en: "Unified 5B dense model (24fps · 32-aligned 1280x704) · Ideal for 24GB local GPUs.",
    },
  },
};

export const ENGINES: Record<EngineId, EngineSpec> = {
  wan22: {
    id: "wan22",
    name: "WAN 2.2",
    vendor: "Alibaba",
    kind: "video",
    encoder: "umT5-XXL",
    modes: ["t2v", "i2v", "flf2v", "s2v"],
    supportsNegative: true,
    supportsStoryboard: true,
    defaultMode: "t2v",
    defaultDuration: 8,
    defaultCfg: 5.0,
    defaultSteps: 30,
    aspectOptions: WAN_VARIANTS.a14b.aspectOptions,
    durationOptions: WAN_VARIANTS.a14b.durationOptions.map(({ value, label }) => ({
      value,
      label,
    })),
    recommendedSummary: {
      ar: "محرك الفيديو السينمائي المفتوح المصدر من علي بابا. يدعم مساري A14B و TI2V-5B بمشفر umT5-XXL.",
      fr: "Moteur vidéo open-source d'Alibaba avec variantes A14B et TI2V-5B sous encodeur umT5-XXL.",
      en: "Alibaba's open-source video suite supporting both A14B MoE and TI2V-5B unified pipelines.",
    },
    bestPractices: {
      ar: [
        "حافظ على شدة الحركة بين 5 و 7 لتجنب تشوه الكتلة والأجسام.",
        "اختر TI2V-5B لمعدل 24fps سريع على بطاقات محلية بدقة 1280×704، وA14B لأعلى جودة سينمائية.",
        "استخدم قاعدة 4n+1 للإطارات وتقطيع المشاهد للمشاهد الإعلانية.",
      ],
      fr: [
        "Gardez l'intensité de mouvement entre 5 et 7 pour éviter le morphing.",
        "Utilisez TI2V-5B pour du 24fps rapide (1280×704) et A14B pour la fidélité cinéma.",
        "Respectez la règle 4n+1 frames et le découpage multi-plans.",
      ],
      en: [
        "Keep Motion Scale between 5 and 7 to prevent structural morphing.",
        "Use TI2V-5B for fast 24fps 1280x704 output, or A14B for maximum cinematic fidelity.",
        "Follow exact 4n+1 frame counts and multi-shot storyboards for commercial cuts.",
      ],
    },
  },
  minimax: {
    id: "minimax",
    name: "MiniMax Hailuo 02",
    vendor: "MiniMax",
    kind: "video",
    encoder: "Hailuo-02 Motion DiT",
    modes: ["t2v", "i2v", "flf2v"],
    supportsNegative: false,
    supportsStoryboard: true,
    defaultMode: "t2v",
    defaultDuration: 6,
    defaultCfg: 7.0,
    defaultSteps: 30,
    aspectOptions: [
      "16:9 (1920x1080 · 1080p)",
      "16:9 (1366x768 · 768p)",
      "9:16 (768x1366 · Vertical)",
      "1:1 (1024x1024)",
    ],
    durationOptions: [
      { value: 6, label: "6s (151 frames @ 25fps · 1080p / 768p)" },
      { value: 10, label: "10s (251 frames @ 25fps · 768p Extended)" },
    ],
    recommendedSummary: {
      ar: "محرك MiniMax Hailuo 02 الرائد في الفيزياء الدقيقة والتحكم السينمائي بالكاميرا عبر أوامر الأقواس [Camera]. يدعم T2V و I2V و FLF2V.",
      fr: "Moteur MiniMax Hailuo 02 réputé pour sa physique fluide et ses directives caméra entre crochets [Camera].",
      en: "MiniMax Hailuo 02 excels at extreme physical realism and bracketed camera directives [Push in], supporting T2V, I2V, and FLF2V.",
    },
    bestPractices: {
      ar: [
        "استخدم أوامر الكاميرا بين أقواس مثل [Slow push in] أو [Orbit] أو [Tracking shot] في بداية الوصف.",
        "Hailuo 02 لا يعتمد على Negative Prompt؛ صف ما تريد ظهوره بوضوح وإيجابية (60 إلى 100 كلمة).",
        "استخدم مدة 6 ثوانٍ لدقة 1080p فائقة الوضوح، و10 ثوانٍ للمشاهد الممتدة بدقة 768p.",
      ],
      fr: [
        "Placez les directives caméra entre crochets comme [Slow push in] ou [Tracking shot] au début.",
        "Hailuo 02 n'utilise pas de prompt négatif ; formulez des descriptions positives concises (60–100 mots).",
        "Choisissez 6s pour du 1080p natif ou 10s en 768p étendu.",
      ],
      en: [
        "Lead with explicit bracketed camera commands such as [Slow push in], [Orbit], or [Tracking shot].",
        "Hailuo 02 ignores negative prompts—keep descriptions affirmative, physical, and concise (60–100 words).",
        "Use 6s duration for crisp 1080p fidelity, or 10s for extended 768p multi-beat sequences.",
      ],
    },
  },
  veo: {
    id: "veo",
    name: "Google Veo 3.1",
    vendor: "Google DeepMind",
    kind: "video",
    encoder: "Veo 3.1 / Veo 3.1 Fast",
    modes: ["t2v", "i2v", "flf2v"],
    supportsNegative: true,
    supportsStoryboard: true,
    defaultMode: "t2v",
    defaultDuration: 8,
    defaultCfg: 7.0,
    defaultSteps: 30,
    aspectOptions: [
      "16:9 (1920x1080 · 1080p)",
      "9:16 (1080x1920 · Vertical)",
      "16:9 (1280x720 · 720p)",
    ],
    durationOptions: [
      { value: 4, label: "4s (Single Shot)" },
      { value: 6, label: "6s (2-Beat Sequence)" },
      { value: 8, label: "8s (3-Shot Full Direction)" },
    ],
    recommendedSummary: {
      ar: "محرك فيديو Google Veo 3.1 و Veo 3.1 Fast مع التحقق التلقائي من المدة والدقة، تقطيع اللقطات، الصوت المتزامن، وفحص الأمان.",
      fr: "Moteur Google Veo 3.1 & Fast avec validation automatique (durée, résolution, audio), découpage en plans et sécurité.",
      en: "Google DeepMind Veo 3.1 & Veo 3.1 Fast with capability validation, automatic shot breakdown, native audio, and safety screening.",
    },
    bestPractices: {
      ar: [
        "استخدم veo-3.1 الكامل للمشاهد متعددة اللقطات والصوت والحوار المتزامن (حتى 4000 حرف).",
        "استخدم veo-3.1-fast للبرومبتات السريعة المركّزة بموضوع واحد وحركة واحدة (≤ 1200 حرف وبدون صوت طبقي).",
        "يتحقق النظام تلقائياً من المدة (4/6/8 ثوانٍ) والدقة (720p/1080p) ونسبة العرض (16:9 / 9:16) والكلمات المحظورة.",
      ],
      fr: [
        "Utilisez veo-3.1 pour les scènes multi-plans et l'audio synchronisé natif (jusqu'à 4000 caractères).",
        "Utilisez veo-3.1-fast pour des prompts directs à un seul sujet/action (≤ 1200 caractères).",
        "Validation automatique de la durée (4/6/8s), résolution (720p/1080p), ratio et contraintes négatives.",
      ],
      en: [
        "Use veo-3.1 (Full) for multi-shot sequences and reliable native synchronized audio (up to 4000 chars).",
        "Use veo-3.1-fast for concise single-subject, single-action prompts (≤ 1200 chars; audio auto-disabled).",
        "Duration (4/6/8s), resolution (720p/1080p), aspect ratio (16:9/9:16), and safety constraints are validated automatically.",
      ],
    },
  },
  hunyuan: {
    id: "hunyuan",
    name: "HunyuanVideo",
    vendor: "Tencent",
    kind: "video",
    encoder: "Llama-3 + CLIP-L",
    modes: ["t2v", "i2v"],
    supportsNegative: true,
    supportsStoryboard: true,
    defaultMode: "t2v",
    defaultDuration: 5,
    defaultCfg: 6.0,
    defaultSteps: 30,
    aspectOptions: [
      "16:9 (1280x720)",
      "9:16 (720x1280)",
      "4:3 (960x720)",
      "1:1 (960x960)",
    ],
    durationOptions: [
      { value: 5, label: "5s (129 frames @ 24fps · 4n+1)" },
      { value: 8, label: "8s (193 frames @ 24fps · 4n+1)" },
    ],
    recommendedSummary: {
      ar: "نموذج الفيديو العملاق من Tencent بمشفر Llama-3. يتفوق في تناسق الإضاءة الواقعية وحركة البشر والمركبات.",
      fr: "Modèle vidéo open-source de Tencent avec encodeur Llama-3. Idéal pour la cohérence temporelle et l'éclairage réaliste.",
      en: "Tencent's open-source video model powered by a Llama-3 text encoder. Excels at human motion, lighting coherence, and realism.",
    },
    bestPractices: {
      ar: [
        "اكتب جملاً طبيعية مترابطة لأن مشفر Llama-3 يفهم السياق النحوي الكامل.",
        "حدد اتجاه الحركة ومسار الكاميرا بوضوح في بداية الوصف.",
        "استخدم Embedded Guidance حول 6.0 و 30–50 خطوة استدلال.",
      ],
      fr: [
        "Rédigez des phrases naturelles complètes adaptées à l'encodeur Llama-3.",
        "Précisez explicitement la trajectoire caméra dès l'ouverture du prompt.",
        "Maintenez le Guidance autour de 6.0 avec 30 à 50 étapes.",
      ],
      en: [
        "Write cohesive natural sentences tailored for the Llama-3 MLLM encoder.",
        "State camera trajectory and subject direction early in the prompt.",
        "Use embedded guidance around 6.0 with 30–50 sampling steps.",
      ],
    },
  },
  ltx: {
    id: "ltx",
    name: "LTX-Video 0.9.5",
    vendor: "Lightricks",
    kind: "video",
    encoder: "T5-XXL",
    modes: ["t2v", "i2v", "flf2v"],
    supportsNegative: true,
    supportsStoryboard: false,
    defaultMode: "t2v",
    defaultDuration: 5,
    defaultCfg: 3.5,
    defaultSteps: 25,
    aspectOptions: [
      "16:9 (1216x704)",
      "9:16 (704x1216)",
      "3:2 (1152x768)",
      "1:1 (896x896)",
    ],
    durationOptions: [
      { value: 4, label: "4s (97 frames @ 24fps · 8n+1)" },
      { value: 5, label: "5s (121 frames @ 24fps · 8n+1)" },
      { value: 7, label: "7s (161 frames @ 24fps · 8n+1)" },
    ],
    recommendedSummary: {
      ar: "نموذج فيديو فائق السرعة مناسب للتشغيل المحلي و ComfyUI. يفضل الوصف الزمني المباشر والموجز بدون تعقيد.",
      fr: "Modèle vidéo DiT ultra-rapide pour ComfyUI local. Préfère des séquences chronologiques directes et précises.",
      en: "High-speed DiT video generator ideal for local ComfyUI workflows. Performs best with direct chronological action descriptions.",
    },
    bestPractices: {
      ar: [
        "الأبعاد المثالية تكون من مضاعفات 32 (مثل 1216×704).",
        "استخدم أفعال حركة واضحة ومباشرة في لقطة واحدة متصلة.",
        "CFG منخفض (3.0 إلى 4.0) يعطي أفضل تماسك دون تشبع لوني.",
      ],
      fr: [
        "Utilisez des résolutions multiples de 32 (ex: 1216×704).",
        "Privilégiez un plan continu avec des verbes d'action chronologiques.",
        "Un CFG bas (3.0–4.0) évite la sur-saturation des textures.",
      ],
      en: [
        "Stick to resolutions divisible by 32 (such as 1216x704).",
        "Keep prompts focused on one continuous shot with clear chronological verbs.",
        "Keep CFG low (3.0–4.0) to prevent oversaturation and artifacts.",
      ],
    },
  },
  flux1: {
    id: "flux1",
    name: "FLUX.1 [dev / schnell]",
    vendor: "Black Forest Labs",
    kind: "image",
    encoder: "T5-XXL + CLIP-L",
    modes: ["t2i", "img2img"],
    supportsNegative: false,
    supportsStoryboard: false,
    defaultMode: "t2i",
    defaultDuration: 0,
    defaultCfg: 3.5,
    defaultSteps: 28,
    aspectOptions: [
      "16:9 (1344x768)",
      "4:3 (1152x896)",
      "1:1 (1024x1024)",
      "3:4 (896x1152)",
      "9:16 (768x1344)",
    ],
    durationOptions: [],
    recommendedSummary: {
      ar: "المعيار المفتوح المصدر لتوليد الصور الواقعية والنصوص المدمجة. لا يستخدم Negative Prompt بل يعتمد على النثر البصري الدقيق.",
      fr: "Référence open-source pour la photographie réaliste et le rendu typographique. N'utilise pas de prompt négatif.",
      en: "Open-weights image benchmark for photorealism and typography. Uses rich descriptive prose rather than negative prompts or tag weights.",
    },
    bestPractices: {
      ar: [
        "تجنب حشو كلمات الجودة المكررة (مثل 8k, masterpiece) واستبدلها بوصف العدسة والإضاءة.",
        "FLUX.1 لا يعتمد على Negative Prompt تقليدي؛ وجّه المشهد بوصف إيجابي صريح.",
        "أضف كلمات تفعيل LoRA في بداية البرومبت عند الحاجة.",
      ],
      fr: [
        "Évitez les tags génériques (masterpiece, 8k) et décrivez plutôt l'optique et la lumière.",
        "FLUX.1 n'utilise pas de prompt négatif ; formulez tout positivement.",
        "Placez vos mots-clés LoRA au début du prompt si nécessaire.",
      ],
      en: [
        "Avoid generic quality tag-spam; describe real lens focal length, lighting, and surface materials.",
        "FLUX.1 ignores traditional negative prompts—describe what should appear affirmatively.",
        "Place LoRA trigger words at the start of the prompt when targeting custom LoRAs.",
      ],
    },
  },
  sdxl: {
    id: "sdxl",
    name: "SDXL / Illustrious",
    vendor: "Stability & Community",
    kind: "image",
    encoder: "Dual CLIP (ViT-L + OpenCLIP)",
    modes: ["t2i", "img2img"],
    supportsNegative: true,
    supportsStoryboard: false,
    defaultMode: "t2i",
    defaultDuration: 0,
    defaultCfg: 7.0,
    defaultSteps: 30,
    aspectOptions: [
      "1:1 (1024x1024)",
      "16:9 (1344x768)",
      "4:3 (1152x896)",
      "3:4 (896x1152)",
      "9:16 (768x1344)",
    ],
    durationOptions: [],
    recommendedSummary: {
      ar: "منظومة الصور المفتوحة المصدر الأكثر دعماً للنماذج المجتمعية و LoRA. يدعم الأوزان النسبية (tag:1.2) و Negative Prompt التفصيلي.",
      fr: "Écosystème d'image open-source le plus modulaire pour les modèles communautaires. Supporte la pondération (tag:1.2).",
      en: "Highly modular open-source image ecosystem supporting weighted tags (keyword:1.2), community checkpoints, and structured negative prompts.",
    },
    bestPractices: {
      ar: [
        "استخدم أوزان التركيز مثل (volumetric lighting:1.15) لرفع أولوية العناصر المهمة.",
        "اضبط CFG بين 5.5 و 7.5 للحصول على توازن مثالي بين الالتزام والجمالية.",
        "استفد من Negative Prompt التفصيلي لتنقية التشوهات التشريحية والضوضاء.",
      ],
      fr: [
        "Utilisez la pondération comme (volumetric lighting:1.15) pour prioriser les éléments clés.",
        "Réglez le CFG entre 5.5 et 7.5 pour un équilibre fidélité/texture.",
        "Exploitez le prompt négatif détaillé pour filtrer les artefacts.",
      ],
      en: [
        "Apply attention weights like (volumetric lighting:1.15) to emphasize key visual traits.",
        "Keep CFG between 5.5 and 7.5 for optimal prompt adherence without burning contrast.",
        "Use structured negative prompts to suppress anatomical and texture artifacts.",
      ],
    },
  },
};

export const ENGINE_ORDER: EngineId[] = ["wan22", "minimax", "veo", "hunyuan", "ltx", "flux1", "sdxl"];

export const HAILUO_CAMERA_BRACKETS: Record<string, string> = {
  "Dolly Push-In": "[Push in]",
  "Orbit 180°": "[Orbit]",
  "Tracking": "[Tracking shot]",
  "Crane": "[Crane down]",
  "Macro Probe": "[Macro push in]",
  "Dynamic Zoom": "[Zoom in]",
  "Handheld": "[Handheld follow]",
  "Static + Rack": "[Static shot, rack focus]",
};

export interface HailuoCameraCommand {
  id: string;
  cmd: string;
  labels: Record<"ar" | "fr" | "en", string>;
}

export const HAILUO_OFFICIAL_COMMANDS: HailuoCameraCommand[] = [
  { id: "push_in", cmd: "Push in", labels: { ar: "تقدم تدريجي (Push in)", fr: "Travelling avant", en: "Push in" } },
  { id: "pull_out", cmd: "Pull out", labels: { ar: "تراجع للخلف (Pull out)", fr: "Travelling arrière", en: "Pull out" } },
  { id: "orbit", cmd: "Orbit", labels: { ar: "دوران مداري (Orbit)", fr: "Orbite 360°", en: "Orbit" } },
  { id: "tracking", cmd: "Tracking shot", labels: { ar: "تتبع جانبي (Tracking)", fr: "Plan de suivi", en: "Tracking shot" } },
  { id: "pan_left", cmd: "Pan left", labels: { ar: "مسح لليسار (Pan left)", fr: "Panoramique gauche", en: "Pan left" } },
  { id: "pan_right", cmd: "Pan right", labels: { ar: "مسح لليمين (Pan right)", fr: "Panoramique droite", en: "Pan right" } },
  { id: "tilt_up", cmd: "Tilt up", labels: { ar: "إمالة للأعلى (Tilt up)", fr: "Inclinaison haut", en: "Tilt up" } },
  { id: "tilt_down", cmd: "Tilt down", labels: { ar: "إمالة للأسفل (Tilt down)", fr: "Inclinaison bas", en: "Tilt down" } },
  { id: "pedestal_up", cmd: "Pedestal up", labels: { ar: "رفع الكاميرا (Pedestal up)", fr: "Élévation haut", en: "Pedestal up" } },
  { id: "zoom_in", cmd: "Zoom in", labels: { ar: "تقريب بصري (Zoom in)", fr: "Zoom avant", en: "Zoom in" } },
  { id: "zoom_out", cmd: "Zoom out", labels: { ar: "توسيع بصري (Zoom out)", fr: "Zoom arrière", en: "Zoom out" } },
  { id: "static", cmd: "Static shot", labels: { ar: "لقطة ثابتة (Static)", fr: "Plan fixe", en: "Static shot" } },
];

export const CATEGORIES = [
  "Luxury Product Advertisement",
  "Perfume Advertisement",
  "Automotive Commercial",
  "Technology Commercial",
  "Food & Macro Beverage",
  "Fashion Editorial Film",
  "Real Estate & Luxury Hospitality",
  "Cyberpunk & Sci-Fi Cinema",
  "Moroccan Architectural & Documentary",
  "Vocal & Music Performance",
  "Anime & Stylized Makoto Shinkai",
  "Editorial Portrait Photography",
];

export const CAMERA_MOVEMENTS = [
  { id: "dolly", label: "Dolly Push-In", prompt: "Slow cinematic dolly push-in" },
  { id: "orbit", label: "Orbit 180°", prompt: "Smooth 180-degree orbital arc shot on gimbal" },
  { id: "tracking", label: "Tracking", prompt: "Smooth lateral crab-tracking shot parallel to subject" },
  { id: "crane", label: "Crane", prompt: "Top-down crane bird's-eye descending shot" },
  { id: "macro", label: "Macro Probe", prompt: "Extreme macro probe-lens tracking glide, shallow depth of field" },
  { id: "zoom", label: "Dynamic Zoom", prompt: "Controlled cinematic slow optical push-zoom" },
  { id: "handheld", label: "Handheld", prompt: "Handheld 35mm documentary subtle organic breathing motion" },
  { id: "static", label: "Static + Rack", prompt: "Static locked-off tripod frame with subtle rack focus" },
];

export const CAMERA_LENSES = [
  { id: "24mm", label: "24mm Anamorphic", prompt: "24mm wide anamorphic lens" },
  { id: "35mm", label: "35mm Cinema", prompt: "35mm cinema prime lens" },
  { id: "50mm", label: "50mm Prime", prompt: "50mm f/1.4 prime lens" },
  { id: "85mm", label: "85mm Portrait", prompt: "85mm f/1.2 portrait prime lens" },
  { id: "100mm", label: "100mm Macro", prompt: "100mm macro cinema lens" },
];

export const CAMERA_OPTIONS = [
  "Slow cinematic dolly push-in, 50mm prime lens",
  "Extreme macro probe-lens tracking shot, shallow depth of field",
  "Smooth 180-degree orbital arc shot on gimbal",
  "Low-angle heroic dolly tracking shot, 24mm wide anamorphic",
  "Smooth lateral crab-tracking shot parallel to subject",
  "Top-down crane bird's-eye descending shot",
  "Handheld 35mm documentary subtle organic breathing motion",
  "Static locked-off tripod frame with subtle rack focus",
  "Medium editorial portrait framing, 85mm f/1.4 prime lens",
];

export const LIGHTING_PALETTES = [
  {
    id: "gold-noir",
    label: "Luxury Gold & Noir",
    colors: ["#141417", "#D4A34B"],
    value: "Chiaroscuro luxury black and warm metallic gold key lighting",
  },
  {
    id: "cyan-amber",
    label: "Cyan & Neon Amber",
    colors: ["#06B6D4", "#F59E0B"],
    value: "Electric cyan and warm neon amber rim lighting, high contrast",
  },
  {
    id: "daylight",
    label: "Volumetric Daylight",
    colors: ["#E2E8F0", "#FDE68A"],
    value: "Soft diffused volumetric window daylight with Tyndall dust rays",
  },
  {
    id: "crimson",
    label: "Crimson Cyberpunk",
    colors: ["#DC2626", "#1E1B4B"],
    value: "Dramatic crimson neon and deep shadow cyberpunk lighting",
  },
  {
    id: "golden-hour",
    label: "Golden Hour Flare",
    colors: ["#EA580C", "#FACC15"],
    value: "Golden hour warm low-sun backlighting with anamorphic flares",
  },
  {
    id: "high-key",
    label: "Clean Studio Softbox",
    colors: ["#F8FAFC", "#94A3B8"],
    value: "Clean high-key commercial studio softbox lighting",
  },
];

export const LIGHT_OPTIONS = LIGHTING_PALETTES.map((p) => p.value);

export const STYLE_OPTIONS = [
  "Ultra-realistic 8K commercial shot on ARRI Alexa 65, Kodak Vision3 500T film grain",
  "Premium luxury editorial film, crisp micro-contrast, ray-traced reflections",
  "Photorealistic Unreal Engine 5.4 product visualization, Octane Render",
  "Late-90s Sci-Fi Matrix green-tinted nostalgic 35mm celluloid aesthetic",
  "Makoto Shinkai inspired hyper-detailed anime atmospheric lighting",
  "Leica SL2 medium-format editorial photography, natural skin texture, subtle grain",
];

export const CATEGORY_DEFAULTS: Record<
  string,
  { camera: string; light: string; style: string; movement: string; lens: string }
> = {
  "Luxury Product Advertisement": {
    camera: CAMERA_OPTIONS[1],
    light: LIGHT_OPTIONS[0],
    style: STYLE_OPTIONS[1],
    movement: "Macro Probe",
    lens: "100mm Macro",
  },
  "Perfume Advertisement": {
    camera: CAMERA_OPTIONS[1],
    light: LIGHT_OPTIONS[0],
    style: STYLE_OPTIONS[1],
    movement: "Macro Probe",
    lens: "100mm Macro",
  },
  "Automotive Commercial": {
    camera: CAMERA_OPTIONS[4],
    light: LIGHT_OPTIONS[4],
    style: STYLE_OPTIONS[0],
    movement: "Tracking",
    lens: "24mm Anamorphic",
  },
  "Technology Commercial": {
    camera: CAMERA_OPTIONS[2],
    light: LIGHT_OPTIONS[1],
    style: STYLE_OPTIONS[2],
    movement: "Orbit 180°",
    lens: "50mm Prime",
  },
  "Food & Macro Beverage": {
    camera: CAMERA_OPTIONS[1],
    light: LIGHT_OPTIONS[2],
    style: STYLE_OPTIONS[0],
    movement: "Macro Probe",
    lens: "100mm Macro",
  },
  "Fashion Editorial Film": {
    camera: CAMERA_OPTIONS[8],
    light: LIGHT_OPTIONS[2],
    style: STYLE_OPTIONS[5],
    movement: "Dolly Push-In",
    lens: "85mm Portrait",
  },
  "Real Estate & Luxury Hospitality": {
    camera: CAMERA_OPTIONS[5],
    light: LIGHT_OPTIONS[4],
    style: STYLE_OPTIONS[0],
    movement: "Crane",
    lens: "24mm Anamorphic",
  },
  "Cyberpunk & Sci-Fi Cinema": {
    camera: CAMERA_OPTIONS[3],
    light: LIGHT_OPTIONS[3],
    style: STYLE_OPTIONS[3],
    movement: "Dolly Push-In",
    lens: "24mm Anamorphic",
  },
  "Moroccan Architectural & Documentary": {
    camera: CAMERA_OPTIONS[5],
    light: LIGHT_OPTIONS[4],
    style: STYLE_OPTIONS[0],
    movement: "Crane",
    lens: "35mm Cinema",
  },
  "Anime & Stylized Makoto Shinkai": {
    camera: CAMERA_OPTIONS[3],
    light: LIGHT_OPTIONS[4],
    style: STYLE_OPTIONS[4],
    movement: "Dolly Push-In",
    lens: "24mm Anamorphic",
  },
  "Editorial Portrait Photography": {
    camera: CAMERA_OPTIONS[8],
    light: LIGHT_OPTIONS[5],
    style: STYLE_OPTIONS[5],
    movement: "Static + Rack",
    lens: "85mm Portrait",
  },
  "Vocal & Music Performance": {
    camera: CAMERA_OPTIONS[0],
    light: LIGHT_OPTIONS[0],
    style: STYLE_OPTIONS[0],
    movement: "Dolly Push-In",
    lens: "50mm Prime",
  },
};

export const PHYSICS_HINTS: {
  id: "gravity" | "fluid" | "volumetric" | "subsurface" | "inertia" | "caustics";
  label: string;
  phrase: string;
}[] = [
  { id: "gravity", label: "Gravity realism", phrase: "physically accurate gravity and weight distribution" },
  { id: "fluid", label: "Fluid dynamics", phrase: "natural fluid viscosity, ripples, and droplet dispersion" },
  { id: "volumetric", label: "Volumetric haze", phrase: "volumetric atmospheric haze with Tyndall light scattering" },
  { id: "subsurface", label: "Subsurface scattering", phrase: "realistic subsurface light scattering on translucent surfaces" },
  { id: "inertia", label: "Camera inertia", phrase: "organic camera inertia with smooth ease-in and ease-out motion" },
  { id: "caustics", label: "Caustic refraction", phrase: "crisp optical glass refraction and specular caustics" },
];

export const AUDIO_DESIGN_TAGS: {
  id: AudioTagId;
  label: string;
  phrase: string;
}[] = [
  { id: "bass", label: "Sub-Bass Impact", phrase: "deep cinematic sub-bass pulse synced to visual reveals" },
  { id: "whoosh", label: "Dynamic Whoosh", phrase: "crisp directional air whoosh transitions between cuts" },
  { id: "clicks", label: "Mechanical Clicks", phrase: "tactile precision metallic and mechanical micro-clicks" },
  { id: "music", label: "Cinematic Score", phrase: "minimalist atmospheric orchestral strings and warm synth swell" },
  { id: "ambient", label: "Spatial Ambient", phrase: "immersive natural room tone and subtle spatial wind" },
  { id: "foley", label: "Liquid & Foley", phrase: "hyper-detailed foley of pouring liquid, glass resonance, and surface texture" },
];

export interface SmartKeywordItem {
  id: string;
  keyword: string;
  labels: Record<"ar" | "fr" | "en", string>;
}

export const SMART_KEYWORDS: SmartKeywordItem[] = [
  { id: "photorealistic", keyword: "photorealistic", labels: { ar: "واقعي", fr: "Réaliste", en: "Photorealistic" } },
  { id: "cinematic", keyword: "cinematic", labels: { ar: "سينمائي", fr: "Cinématique", en: "Cinematic" } },
  { id: "anime", keyword: "anime style", labels: { ar: "أنيمي", fr: "Anime", en: "Anime" } },
  { id: "4k", keyword: "4K UHD", labels: { ar: "4K", fr: "4K", en: "4K" } },
  { id: "8k", keyword: "8K ultra-detailed", labels: { ar: "8K فائق الدقة", fr: "8K Ultra HD", en: "8K Ultra" } },
  { id: "luxury", keyword: "luxury commercial aesthetic", labels: { ar: "فخامة إعلانية", fr: "Luxe éditorial", en: "Luxury Ad" } },
  { id: "dramatic", keyword: "dramatic volumetric lighting", labels: { ar: "إضاءة درامية", fr: "Éclairage dramatique", en: "Dramatic Light" } },
  { id: "golden", keyword: "golden hour warm lighting", labels: { ar: "الساعة الذهبية", fr: "Heure dorée", en: "Golden Hour" } },
  { id: "macro", keyword: "extreme macro close-up", labels: { ar: "ماكرو دقيق", fr: "Macro", en: "Macro" } },
  { id: "slowmo", keyword: "smooth slow motion", labels: { ar: "حركة بطيئة", fr: "Ralenti", en: "Slow Motion" } },
  { id: "anamorphic", keyword: "anamorphic lens bokeh", labels: { ar: "عدسة أنامورفيك", fr: "Anamorphique", en: "Anamorphic" } },
  { id: "raytraced", keyword: "ray-traced reflections", labels: { ar: "انعكاسات واقعية", fr: "Reflets réalistes", en: "Ray-Traced" } },
];

export const VIDEO_GENERATOR_STYLES: { id: string; ar: string; fr: string; en: string }[] = [
  { id: "cinematic", ar: "سينمائي (Cinematic)", fr: "Cinématique", en: "Cinematic" },
  { id: "documentary", ar: "وثائقي (Documentary)", fr: "Documentaire", en: "Documentary" },
  { id: "noir", ar: "نوار درامي (Film Noir)", fr: "Film Noir", en: "Film Noir" },
  { id: "luxury commercial", ar: "إعلاني فاخر (Luxury Commercial)", fr: "Pub Luxe", en: "Luxury Commercial" },
  { id: "sci-fi cyberpunk", ar: "خيال علمي (Sci-Fi Cyberpunk)", fr: "Sci-Fi Cyberpunk", en: "Sci-Fi Cyberpunk" },
  { id: "anime makoto shinkai", ar: "أنمي سينمائي (Anime)", fr: "Anime Cinématique", en: "Cinematic Anime" },
];

