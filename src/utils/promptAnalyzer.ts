import { ENGINES } from "../data/engines";
import { PromptQualityIssue, PromptQualityReport, StudioFormState } from "../types/prompt";
import { SmartSceneGuard } from "./smartSceneGuard";

const STOPWORDS = new Set([
  "the", "and", "with", "for", "from", "into", "onto", "that", "this", "shot",
  "camera", "light", "lighting", "motion", "frame", "scene", "over", "under",
  "slow", "cinematic", "very", "more", "some", "across", "within", "while",
]);

export function analyzePromptQuality(
  state: StudioFormState,
  compiledPrompt: string
): PromptQualityReport {
  const issues: PromptQualityIssue[] = [];
  const spec = ENGINES[state.engine];

  // 1. Word Repetition Check (on user creative fields)
  const creativeBlob = [
    state.subject,
    state.environment,
    state.action,
    state.extra,
    ...state.shots.slice(0, state.shotsCount).map((s) => s.description),
  ]
    .join(" ")
    .toLowerCase();

  const words = creativeBlob
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const repeatedWords = Object.entries(freq)
    .filter(([, count]) => count >= 4)
    .map(([word]) => word);

  if (repeatedWords.length > 0) {
    issues.push({
      id: "repetition",
      severity: "warning",
      title: {
        ar: "تكرار كلمات مفتاحية",
        fr: "Répétition de mots-clés",
        en: "Keyword repetition detected",
      },
      detail: {
        ar: `الكلمات المكررة (${repeatedWords.slice(0, 4).join(", ")}) قد تُربك المشفر النصي.`,
        fr: `Les mots répétés (${repeatedWords.slice(0, 4).join(", ")}) peuvent saturer l'encodeur.`,
        en: `Repeated terms (${repeatedWords.slice(0, 4).join(", ")}) can dilute encoder attention.`,
      },
    });
  }

  // 2. Motion Conflict Check
  let motionScore = 25;
  const camLower = `${state.camera} ${state.cameraMovement}`.toLowerCase();
  const actLower = state.action.toLowerCase();
  const isStaticCam = camLower.includes("static") || camLower.includes("locked-off");
  const isDynamicAction =
    actLower.includes("sprint") ||
    actLower.includes("chase") ||
    actLower.includes("fpv") ||
    actLower.includes("rapid") ||
    state.motionScale >= 9;

  if (isStaticCam && isDynamicAction) {
    motionScore -= 12;
    issues.push({
      id: "motion-conflict",
      severity: "warning",
      title: {
        ar: "تعارض بين ثبات الكاميرا وشدة الحركة",
        fr: "Conflit caméra fixe vs mouvement rapide",
        en: "Static camera vs. high-energy motion conflict",
      },
      detail: {
        ar: "اخترت كاميرا ثابتة (Static) مع حركة عالية الشدة؛ يُنصح بتفعيل Dolly أو Tracking أو خفض شدة الحركة.",
        fr: "Une caméra fixe contraste avec un mouvement rapide. Utilisez un suivi (Tracking) ou réduisez l'intensité.",
        en: "Locked-off camera conflicts with intense motion. Switch to Tracking/Dolly or lower Motion Scale.",
      },
    });
  }

  if (spec.kind === "video" && state.motionScale > 7) {
    motionScore -= 6;
    issues.push({
      id: "high-motion-morph",
      severity: "info",
      title: {
        ar: "شدة حركة مرتفعة (> 7/10)",
        fr: "Intensité de mouvement élevée (> 7/10)",
        en: "High Motion Scale (> 7/10)",
      },
      detail: {
        ar: "القيم فوق 7 قد تسبب تشوه الأجسام الدقيقة؛ الأفضل لـ WAN 2.2 البقاء بين 5 و 7.",
        fr: "Au-dessus de 7, des artefacts de morphing peuvent apparaître sur les détails fins.",
        en: "Values above 7 increase morphing risk; 5–7 yields optimal temporal stability.",
      },
    });
  }

  // 3. Scene Clarity & Specificity Check
  let clarityScore = 25;
  const subjectWords = state.subject.trim().split(/\s+/).filter(Boolean).length;
  const envWords = state.environment.trim().split(/\s+/).filter(Boolean).length;
  const actionWords = state.action.trim().split(/\s+/).filter(Boolean).length;

  if (subjectWords < 5) {
    clarityScore -= 9;
    issues.push({
      id: "vague-subject",
      severity: "warning",
      title: {
        ar: "وصف الموضوع الرئيسي موجز جداً",
        fr: "Description du sujet trop brève",
        en: "Subject description is too brief",
      },
      detail: {
        ar: "أضف تفاصيل الخامة واللون والحجم للموضوع الرئيسي لرفع الدقة البصرية.",
        fr: "Précisez les matériaux, textures et couleurs du sujet principal.",
        en: "Add material finish, texture, and proportions to anchor the encoder.",
      },
    });
  }

  if ((state.mode === "t2v" || state.mode === "t2i") && envWords < 4) {
    clarityScore -= 8;
    issues.push({
      id: "vague-env",
      severity: "warning",
      title: {
        ar: "غموض في وصف البيئة المحيطة",
        fr: "Environnement peu détaillé",
        en: "Environment lacks spatial depth",
      },
      detail: {
        ar: "وصف الخلفية والعمق المكاني يمنع الفراغ البصري في المشهد.",
        fr: "Décrivez l'arrière-plan et la profondeur pour éviter un décor vide.",
        en: "Specify background architecture and depth cues for richer composition.",
      },
    });
  }

  if (actionWords < 4) {
    clarityScore -= 6;
  }

  // 4. Continuity & Physics / Negative Alignment
  let continuityScore = 25;
  if (spec.supportsNegative && state.negative.trim().split(",").length < 4) {
    continuityScore -= 8;
    issues.push({
      id: "weak-negative",
      severity: "info",
      title: {
        ar: "الـ Negative Prompt ضعيف أو قصير",
        fr: "Prompt négatif trop court",
        en: "Sparse Negative Prompt",
      },
      detail: {
        ar: "أعد التوليد الذكي للـ Negative Prompt لمنع التشوهات الزمنية والضبابية.",
        fr: "Utilisez la régénération intelligente pour bloquer le scintillement.",
        en: "Use Smart Regen to include temporal flicker and geometry guards.",
      },
    });
  }

  if (state.physicsHints.length === 0 && spec.kind === "video") {
    continuityScore -= 6;
    issues.push({
      id: "no-physics",
      severity: "info",
      title: {
        ar: "لم يتم تفعيل أي موجه فيزيائي",
        fr: "Aucun indice micro-physique activé",
        en: "No Micro-Physics Hints selected",
      },
      detail: {
        ar: "تفعيل Gravity أو Fluid أو Camera Inertia يرفع واقعية حركة الفيديو.",
        fr: "Activez au moins 2 indices physiques pour une cinématique réaliste.",
        en: "Enable 2+ Physics Hints for more believable inertia and lighting.",
      },
    });
  }

  const strippedCompiledPrompt = SmartSceneGuard.strip(compiledPrompt);

  if (/[\u0600-\u06FF]/.test(strippedCompiledPrompt)) {
    continuityScore -= 10;
    issues.push({
      id: "arabic-in-output",
      severity: "warning",
      title: {
        ar: "يوجد نص عربي داخل البرومبت النهائي",
        fr: "Texte non-anglais dans le prompt final",
        en: "Non-English characters detected in prompt",
      },
      detail: {
        ar: "محركات الفيديو المفتوحة تفهم الإنجليزية بدقة أعلى؛ استخدم زر التحسين الذكي للترجمة.",
        fr: "Les encodeurs open-source performent mieux en anglais; utilisez l'optimiseur IA.",
        en: "Open-source encoders perform best in English; click AI Enhance to translate.",
      },
    });
  }

  // 5. Duration-to-Shots Pacing & Positive Length Sweet Spot (80-120 words for Wan 2.2)
  let pacingScore = 25;
  if (spec.kind === "video" && state.shotsCount > 1) {
    const secPerShot = state.duration / state.shotsCount;
    if (secPerShot < 2.0) {
      pacingScore -= 12;
      issues.push({
        id: "rushed-pacing",
        severity: "warning",
        title: {
          ar: "عدم تناسب مدة المشهد مع عدد اللقطات",
          fr: "Rythme trop rapide par plan",
          en: "Duration-to-shots pacing is too compressed",
        },
        detail: {
          ar: `معدل ${secPerShot.toFixed(1)} ثانية لكل لقطة قصير جداً؛ زد المدة أو قلل عدد اللقطات.`,
          fr: `${secPerShot.toFixed(1)}s par plan est trop court; augmentez la durée ou réduisez les coupes.`,
          en: `${secPerShot.toFixed(1)}s per cut is too brief for smooth transitions; increase duration or reduce shots.`,
        },
      });
    }
  }

  const positiveSection = strippedCompiledPrompt
    .split("NEGATIVE PROMPT:")[0]
    .split("AUDIO & SOUND DESIGN:")[0]
    .trim();
  const positiveWordCount = positiveSection
    ? positiveSection.split(/\s+/).filter(Boolean).length
    : 0;

  if (state.engine === "wan22" && positiveWordCount > 130) {
    pacingScore -= 8;
    issues.push({
      id: "wan-too-long",
      severity: "info",
      title: {
        ar: `طول البرومبت الإيجابي (${positiveWordCount} كلمة)`,
        fr: `Longueur du prompt positif (${positiveWordCount} mots)`,
        en: `Positive prompt length (${positiveWordCount} words)`,
      },
      detail: {
        ar: "المثالي لـ Wan 2.2 هو 80–120 كلمة؛ الكلمات الزائدة عن 120 قد يُضعف المحرك تركيزه عليها.",
        fr: "L'idéal pour Wan 2.2 est 80–120 mots ; au-delà, l'encodeur dilue les détails finaux.",
        en: "Optimal Wan 2.2 length is 80–120 words; excess tokens above 120 can dilute attention.",
      },
    });
  } else if (state.engine === "minimax" && positiveWordCount > 115) {
    pacingScore -= 6;
    issues.push({
      id: "minimax-too-long",
      severity: "info",
      title: {
        ar: `طول برومبت Hailuo 02 (${positiveWordCount} كلمة)`,
        fr: `Longueur Hailuo 02 (${positiveWordCount} mots)`,
        en: `Hailuo 02 prompt length (${positiveWordCount} words)`,
      },
      detail: {
        ar: "يفضّل MiniMax Hailuo 02 نثراً مركزاً بين 60 و 100 كلمة مع أمر حركة الكاميرا بين أقواس [Push in].",
        fr: "MiniMax Hailuo 02 préfère 60 à 100 mots directs avec une directive caméra [Push in].",
        en: "MiniMax Hailuo 02 performs best with 60–100 crisp words and a [Camera] bracket command.",
      },
    });
  } else if (spec.kind === "video" && positiveWordCount > 0 && positiveWordCount < 45) {
    pacingScore -= 6;
    issues.push({
      id: "wan-too-short",
      severity: "info",
      title: {
        ar: `البرومبت قصير نسبياً (${positiveWordCount} كلمة)`,
        fr: `Prompt relativement court (${positiveWordCount} mots)`,
        en: `Prompt is relatively brief (${positiveWordCount} words)`,
      },
      detail: {
        ar: "للوصول للطول المثالي (80–120 كلمة)، أضف تفاصيل للخامات أو الضوء أو موجهات الفيزياء.",
        fr: "Pour viser la zone idéale (80–120 mots), enrichissez la lumière et les textures.",
        en: "To reach the 80–120 word sweet spot, add texture, atmosphere, or micro-physics details.",
      },
    });
  }

  const totalScore = Math.max(
    15,
    Math.min(100, clarityScore + continuityScore + pacingScore + motionScore)
  );

  return {
    score: totalScore,
    repeatedWords,
    issues,
    breakdown: {
      clarity: Math.max(0, clarityScore),
      continuity: Math.max(0, continuityScore),
      pacing: Math.max(0, pacingScore),
      motionCoherence: Math.max(0, motionScore),
    },
  };
}
