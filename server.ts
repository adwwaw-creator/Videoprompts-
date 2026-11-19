import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerPort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--port" && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    } else if (args[i].startsWith("--port=")) {
      const parsed = Number(args[i].slice("--port=".length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0) return envPort;
  return 3000;
}

const PORT = resolveServerPort();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function safeParseJson<T = Record<string, unknown>>(raw: string): T {
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
    throw new Error("Invalid JSON returned by upstream AI service.");
  }
}

async function safeReadUpstreamJson<T = Record<string, unknown>>(
  res: globalThis.Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Upstream returned HTTP ${res.status} with non-JSON response.`);
  }
}

interface ParsedApiError {
  httpStatus: number;
  apiStatus: string;
  retryDelay: string | null;
  message: string;
}

function parseUpstreamGeminiError(err: unknown, fallbackMessage: string): ParsedApiError {
  const raw = err instanceof Error ? err.message : String(err || fallbackMessage);
  let code = 500;
  let apiStatus = "UNKNOWN";
  let retryDelay: string | null = null;
  let message = raw || fallbackMessage;

  const jsonStart = raw.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: {
          code?: number;
          status?: string;
          message?: string;
          details?: Array<{ retryDelay?: string }>;
        };
      };
      if (parsed?.error) {
        if (typeof parsed.error.code === "number") code = parsed.error.code;
        if (typeof parsed.error.status === "string") apiStatus = parsed.error.status;
        if (typeof parsed.error.message === "string") {
          message = parsed.error.message.split("\n")[0].trim();
        }
        const retryDetail = parsed.error.details?.find((d) => typeof d?.retryDelay === "string");
        if (retryDetail?.retryDelay) retryDelay = retryDetail.retryDelay;
      }
    } catch {
      // keep raw fallback
    }
  }

  if (apiStatus === "RESOURCE_EXHAUSTED" || code === 429 || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      httpStatus: 429,
      apiStatus: "RESOURCE_EXHAUSTED",
      retryDelay,
      message:
        "Gemini Free Tier daily quota exceeded. Select a billing-enabled API key in Settings > Secrets or retry later.",
    };
  }
  if (apiStatus === "PERMISSION_DENIED" || code === 403 || raw.includes("PERMISSION_DENIED")) {
    return {
      httpStatus: 403,
      apiStatus: "PERMISSION_DENIED",
      retryDelay: null,
      message:
        "Gemini API permission denied. Please check your API key in Settings > Secrets.",
    };
  }
  if (apiStatus === "INVALID_ARGUMENT" || raw.includes("API_KEY_INVALID")) {
    return {
      httpStatus: 400,
      apiStatus: "API_KEY_INVALID",
      retryDelay: null,
      message:
        "Invalid Gemini API key. Please check your API key in Settings > Secrets.",
    };
  }
  if (apiStatus === "NOT_FOUND" || code === 404) {
    return {
      httpStatus: 404,
      apiStatus: "NOT_FOUND",
      retryDelay: null,
      message: "Requested Gemini model was not found.",
    };
  }
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return {
      httpStatus: 500,
      apiStatus: "MISSING_KEY",
      retryDelay: null,
      message: "Gemini API key is not configured in Settings > Secrets.",
    };
  }

  return {
    httpStatus: code >= 400 && code < 600 ? code : 500,
    apiStatus,
    retryDelay,
    message: message || fallbackMessage,
  };
}

function sendAiError(
  res: express.Response,
  err: unknown,
  fallbackMessage: string,
  extra?: Record<string, unknown>
) {
  const parsed = parseUpstreamGeminiError(err, fallbackMessage);
  const safeStatus =
    parsed.httpStatus === 403
      ? 400
      : parsed.httpStatus === 502 || parsed.httpStatus === 503 || parsed.httpStatus === 504
        ? 500
        : parsed.httpStatus;
  res.status(safeStatus).json({
    ...(extra || {}),
    error: parsed.message,
    apiStatus: parsed.apiStatus,
    retryDelay: parsed.retryDelay,
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms (UNAVAILABLE)`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  request: {
    contents: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["contents"];
    config?: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["config"];
  },
  options?: { primaryTimeoutMs?: number; fallbackTimeoutMs?: number }
) {
  const models = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"] as const;
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const baseConfig = request.config ?? {};
      const effectiveConfig =
        model === "gemini-4-hydrogen" && !baseConfig.thinkingConfig
          ? { ...baseConfig, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : baseConfig;
      const timeoutMs =
        i === 0
          ? options?.primaryTimeoutMs ?? 25_000
          : options?.fallbackTimeoutMs ?? 38_000;
      return await withTimeout(
        ai.models.generateContent({
          model,
          contents: request.contents,
          ...(Object.keys(effectiveConfig).length > 0
            ? { config: effectiveConfig }
            : {}),
        }),
        timeoutMs,
        model
      );
    } catch (err: unknown) {
      lastError = err;
      const raw = err instanceof Error ? err.message : String(err || "");
      const parsed = parseUpstreamGeminiError(err, "Gemini request failed.");
      const isRecoverableCapacity =
        parsed.httpStatus === 429 ||
        parsed.httpStatus === 503 ||
        parsed.httpStatus === 504 ||
        parsed.apiStatus === "RESOURCE_EXHAUSTED" ||
        parsed.apiStatus === "UNAVAILABLE" ||
        raw.includes("timed out");
      if (isRecoverableCapacity && i < models.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

const VIDEO_PROMPT_GENERATOR_SYSTEM_PROMPT = `
================================================================
SYSTEM PROMPT — VIDEO PROMPT GENERATOR
الإصدار: 1.0
يدعم: Wan 2.2 | MiniMax (Hailuo) | Google Veo
الأنماط: برومبت عادي (normal) | فيلم 10 مشاهد (film_10 / 10 Scenes) | فيلم مخصص (film)
================================================================

【1】الدور
أنت "مولّد برومبتات فيديو" محترف. مهمتك تحويل فكرة العميل
(بلغة عربية أو إنجليزية) إلى برومبت واحد أو تسلسل برومبتات
جاهزة للصق مباشرة في محرك التوليد المحدد.
لا تشرح، لا تعلّق، لا تكتب مقدمات. أخرج البرومبت فقط.

【2】المدخلات المتوقعة
- IDEA       : فكرة الفيديو (نص حر)
- MODEL      : wan | minimax | google
- MODE       : normal | film_10 (10 Scenes) | film
- SCENES     : عدد المشاهد (10 افتراضيًا، وقابل للتوسيع حتى 30 مشهدًا)
- SHOT_LEN   : مدة المشهد بالثواني (افتراضي 5)
- STYLE      : الأسلوب البصري (سينمائي / وثائقي / نوار / ...)
- LANG       : لغة المخرجات (ar | en) — افتراضي ar

【3】قواعد النمط = normal (برومبت عادي)
- أنتج برومبتًا واحدًا فقط.
- وصف واحد لمشهد واحد متواصل (بدون قطع أو انتقالات).
- اتبع صيغة الموديل المختار (انظر القسم 5).
- الطول: 40–80 كلمة.
- إذا MODEL = wan: أضف في النهاية "--duration {SHOT_LEN}".

【4】قواعد النمط = film / film_10 (فيلم — تسلسل مشاهد)
- في نمط film_10 (10 Scenes): أنتج 10 برومبتات مرقّمة متتالية بدقة (SCENE 1/10 حتى SCENE 10/10) لجميع المحركات بدون استثناء.
- في نمط film: أنتج {SCENES} برومبتًا مرقّمًا متتاليًا بالعدد المحدد بدقة (من 2 حتى 30 مشهدًا) لجميع المحركات.
- كل مشهد = لحظة سردية واحدة فقط متصلة زمنيًا وبصريًا بالمشهد السابق.
- التزم بدليل الاستمرارية (SERIES / FILM CONTINUITY BIBLE): عامل الفكرة الأساسية والنمط كمرجع بصري ثابت للمشروع، واحفظ ملامح الشخصية وملابسها وأدواتها ولوحة الألوان والعدسة واتجاه الشاشة. تتبع حالة بداية كل مشهد ونهايته دون تكرار الحدث السابق أو ترحيل أي تأثيرات عابرة أو تشويه متبادل بين اللقطات؛ ليبقى كل مشهد قابلاً للتوليد بشكل مستقل.
- للتسلسلات الطويلة (8 إلى 30 مشهدًا)، وزّع القوس الدرامي بدقة عبر المشاهد المتتالية، مع الحفاظ على تصاعد منطقي وعدم تكرار الأحداث:
  (1 تأسيس العالم والشخصية → 2 الحدث المحفّز → 3 الانطلاق والتقصي → 4 العقبة الأولى → 5 الاكتشاف المحوري → 6 تصاعد التوتر → 7 نقطة التحول → 8 الذروة الدرامية → 9 ما بعد الذروة → 10+ الخاتمة البصرية).
- حافظ على إيجاز بصري مركّز لكل مشهد (45–70 كلمة) مع ثبات ملامح الشخصية وملابسها وأدواتها ولوحة الألوان والعدسة في كل برومبت دون انقطاع.
- بعد كل مشهد أضف ذيل الاتساق الثابت:
  "(consistent character design, same color palette, same lens, 35mm film grain, cinematic grading)"
- في نهاية المخرجات أضف قسم CONSISTENCY NOTES يشرح في 3 أسطر: وصف الشخصية الرئيسية، لوحة الألوان، العدسة.
- التزم دائمًا بعدد المشاهد الكامل {SCENES} في المخرجات المرقّمة لجميع الموديلات (wan و minimax و google).

【5】صيغة المخرجات حسب الموديل
▸ WAN 2.2
[الموضوع] + [الحركة] + [البيئة] + [الإضاءة] + [زاوية الكاميرا] + [حركة الكاميرا] + [الأسلوب] + --duration {N}

▸ MINIMAX (Hailuo)
وصف بصري كثيف + مزاج + إضاءة + حركة كاميرا.
يدعم تعدد اللقطات داخل المقطع الواحد بصيغة زمنية:
[Shot 1] ... [Shot 2] at 00:0X
المدة الإجمالية القصوى لكل مقطع: 15 ثانية.

▸ GOOGLE (Veo)
وصف سينمائي طبيعي + تعليمات إضاءة + عدسة + مزاج.
لا يستخدم وسومًا تقنية أو --duration. جملة واحدة إلى ثلاث جمل.

【6】قواعد خاصة بـ film / film_10 حسب الموديل
- WAN 2.2:
  كل مشهد من المشاهد الـ {SCENES} = برومبت منفصل تمامًا بلقطة واحدة متواصلة. لا تكتب أي انتقال أو cut داخل البرومبت.
  أضف "--duration {SHOT_LEN}" في نهاية وصف المشهد قبل ذيل الاتساق، ثم أضف التنبيه السطري:
  "→ انسخ هذا المشهد منفردًا في Wan 2.2" (أو "→ Copy this scene individually into Wan 2.2" إذا LANG = en).
- MINIMAX:
  أنتج جميع المشاهد الـ {SCENES} مرقّمة بالكامل (SCENE 1/{SCENES} إلى SCENE {SCENES}/{SCENES}).
  عند تفعيل ALLOW_MERGE_TWO_SHOTS=true يُسمح بدمج لقطتين داخل نفس المشهد باستخدام [Shot 1] ... [Shot 2] at 00:0X على ألا تتجاوز مدة المقطع الواحد 15 ثانية؛ وإلا اجعل كل مشهد لقطة مركّزة واحدة ضمن ≤ 15 ثانية.
- GOOGLE (Veo):
  كل مشهد من المشاهد الـ {SCENES} = برومبت منفصل. أضف تعليمة الاتساق في أعلى كل مشهد:
  "Maintain: same character, same palette, same lens."
  ولا تستخدم أي وسوم تقنية أو --duration.

【7】صيغة الإخراج النهائية
- في نمط normal: أخرج برومبتًا واحدًا فقط جاهزًا للصق.
- في نمط film_10 أو film: أخرج المشاهد من SCENE 1/{SCENES} حتى SCENE {SCENES}/{SCENES} متبوعة بقسم --- CONSISTENCY NOTES --- (Character, Palette, Lens).

【8】قيود صارمة
- إذا LANG = en، التزم بالإنجليزية الخالصة داخل كل برومبت، وإذا LANG = ar التزم بالعربية السينمائية في الحقول المطلوبة مع إبقاء ذيل الاتساق وقوس [Shot 1] وتعليمة Maintain/duration بصيغتها القياسية المتوافقة مع المحركات.
- لا تتجاوز 15 ثانية في أي برومبت MiniMax.
- لا تصف أكثر من مشهد واحد في برومبت Wan عادي أو داخل المشهد الواحد من تسلسل Wan.
- إذا كانت الفكرة غامضة، املأ الفراغات بافتراضات سينمائية معقولة دون سؤال المستخدم.
`;

async function startServer() {
  const app = express();
  app.disable("etag");
  const httpServer = http.createServer(app);

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.use("/api", (req, res, next) => {
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const hasBody =
        Number(req.headers["content-length"] || 0) > 0 ||
        Boolean(req.headers["transfer-encoding"]);
      if (hasBody && !req.is("application/json")) {
        res.status(415).json({
          success: false,
          error: "Content-Type must be application/json",
        });
        return;
      }
    }
    next();
  });

  app.use(express.json({ limit: "15mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Test server-side Gemini connection
  app.post("/api/ai/test", async (_req, res) => {
    try {
      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: "Reply with the single word OK.",
      });
      res.json({ ok: true, reply: (response.text ?? "OK").trim() });
    } catch (err: unknown) {
      sendAiError(res, err, "Connection test failed.", { ok: false });
    }
  });

  // AI Director Mode: turn a single user brief into a complete production setup
  app.post("/api/ai/director", async (req, res) => {
    try {
      const { brief = "", engine = "wan22", wanVariant = "a14b" } = req.body ?? {};
      if (!String(brief).trim()) {
        res.status(400).json({ error: "Please enter a creative brief for AI Director." });
        return;
      }

      const safeVariantLabel = String(wanVariant || "a14b").toUpperCase();
      const systemInstruction = `You are an elite AI Commercial Film Director and Prompt Engineer for generative video & image engines (specializing in Alibaba WAN 2.2 ${safeVariantLabel}, MiniMax Hailuo 02, Google Veo 3.1 / Veo 3.1 Fast, HunyuanVideo, LTX-Video, FLUX.1, and SDXL).
The user will give a short creative brief or raw idea in any global language (Arabic, Darija, French, English, Spanish, German, Italian, Portuguese, Turkish, Japanese, Korean, Chinese, Hindi, etc.).
Design the entire production in English and return strictly valid JSON matching the schema:
- category: pick the best fit from ["Luxury Product Advertisement","Technology Commercial","Perfume Advertisement","Automotive Commercial","Fashion Editorial Film","Cyberpunk & Sci-Fi Cinema","Moroccan Architectural & Documentary","Anime & Stylized Makoto Shinkai","Food & Macro Beverage","Editorial Portrait Photography","Real Estate & Luxury Hospitality","Vocal & Music Performance"]
- duration: integer seconds matching the brief (prefer 4, 5, 6, 8, or 10; default 8)
- subject: rich English description of the hero subject and materials
- environment: rich English description of the setting, architecture, and depth
- action: physically accurate fluid primary motion (or pose for image engines)
- extra: micro-physics details (droplets, dust motes, refraction, inertia)
- cameraMovement: pick one of ["Dolly Push-In","Orbit 180°","Tracking","Crane","Macro Probe","Dynamic Zoom","Handheld","Static + Rack"]
- lens: pick one of ["24mm Anamorphic","35mm Cinema","50mm Prime","85mm Portrait","100mm Macro"]
- lightingMood: rich English lighting and color grade description
- style: pick the closest visual aesthetic from ["Ultra-realistic 8K commercial shot on ARRI Alexa 65, Kodak Vision3 500T film grain","Premium luxury editorial film, crisp micro-contrast, ray-traced reflections","Photorealistic Unreal Engine 5.4 product visualization, Octane Render","Late-90s Sci-Fi Matrix green-tinted nostalgic 35mm celluloid aesthetic","Makoto Shinkai inspired hyper-detailed anime atmospheric lighting","Leica SL2 medium-format editorial photography, natural skin texture, subtle grain"]
- physicsHints: array of 1 to 3 IDs from ["gravity","fluid","volumetric","subsurface","inertia","caustics"]
- audioTags: array of 1 to 3 IDs from ["bass","whoosh","clicks","music","ambient","foley"] (empty array for image engines)
- audioDesign: synchronized sound design & foley description (empty string for image engines)
- dialogue: brief natural spoken dialogue line if the scene benefits from speech (otherwise empty string)
- soundEffects: concrete ambient & foley sound effects for Google Veo 3.1 (empty string for image engines)
- minimaxCameraCommands: array of 1 to 2 bracket commands from ["Push in","Pull out","Orbit","Tracking shot","Pan left","Pan right","Tilt up","Tilt down","Pedestal up","Zoom in","Zoom out","Static shot"]
- shots: array of 3 sequential storyboard shots, each with { camera, description }
- negative: tailored negative prompt suppressing artifacts specific to this subject and category (empty string for flux1 or minimax)`;

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: `Target Engine: ${engine} (${wanVariant}). Creative Brief: ${brief}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              duration: { type: Type.INTEGER },
              subject: { type: Type.STRING },
              environment: { type: Type.STRING },
              action: { type: Type.STRING },
              extra: { type: Type.STRING },
              cameraMovement: { type: Type.STRING },
              lens: { type: Type.STRING },
              lightingMood: { type: Type.STRING },
              style: { type: Type.STRING },
              physicsHints: { type: Type.ARRAY, items: { type: Type.STRING } },
              audioTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              audioDesign: { type: Type.STRING },
              dialogue: { type: Type.STRING },
              soundEffects: { type: Type.STRING },
              minimaxCameraCommands: { type: Type.ARRAY, items: { type: Type.STRING } },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    camera: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["camera", "description"],
                },
              },
              negative: { type: Type.STRING },
            },
            required: [
              "category",
              "duration",
              "subject",
              "environment",
              "action",
              "extra",
              "cameraMovement",
              "lens",
              "lightingMood",
              "style",
              "physicsHints",
              "audioTags",
              "audioDesign",
              "dialogue",
              "soundEffects",
              "minimaxCameraCommands",
              "shots",
              "negative",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = safeParseJson(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "AI Director failed.");
    }
  });

  // Enhance & translate raw multilingual prompt idea into engineered English prompt fields
  app.post("/api/ai/enhance", async (req, res) => {
    try {
      const {
        engine = "wan22",
        mode = "t2v",
        category = "",
        subject = "",
        environment = "",
        action = "",
        style = "",
        light = "",
        camera = "",
        extra = "",
      } = req.body ?? {};

      if (!String(subject).trim() && !String(action).trim()) {
        res.status(400).json({
          error: "Please provide at least a subject or motion/action description.",
        });
        return;
      }

      const engineGuidance: Record<string, string> = {
        wan22:
          "Target engine: Alibaba Wan 2.2 (umT5-XXL text encoder). Emphasize micro-physics, fluid inertia, light refraction, camera movement curves, and temporal continuity.",
        minimax:
          "Target engine: MiniMax Hailuo 02 (Hailuo-02 Motion DiT). Keep subject, environment, and action crisp, physically grounded, and 60–100 words total with affirmative visual wording and zero negative clauses.",
        veo:
          "Target engine: Google Veo 3.1 / Veo 3.1 Fast. Structure precise cinematography (lens, framing, focus), concrete subject materials & continuity, physically plausible primary action, atmospheric context, and native synchronized audio/SFX cues (keep Fast prompts concise and single-shot).",
        hunyuan:
          "Target engine: Tencent HunyuanVideo (Llama-3 + CLIP-L encoder). Emphasize clear spatial relationships, realistic physical motion, coherent lighting transitions, and natural cinematic phrasing.",
        ltx:
          "Target engine: Lightricks LTX-Video (T5-XXL encoder). Keep action verbs crisp, sequential, and direct with explicit camera trajectory and immediate scene clarity.",
        flux1:
          "Target engine: Black Forest Labs FLUX.1 [dev/schnell] (T5-XXL + CLIP-L). Write rich natural-language photographic or artistic prose; focus on material textures, lens optics, composition, and lighting without tag-spam.",
        sdxl:
          "Target engine: SDXL / Illustrious (Dual CLIP). Use crisp descriptive phrases suitable for tag-weighted prompting, emphasizing subject details, material finish, lens framing, and lighting contrast.",
      };

      const isImageEngine = engine === "flux1" || engine === "sdxl";
      const isRefVideoMode = mode === "i2v" || mode === "flf2v";

      const systemInstruction = `You are an elite AI Prompt Engineer for open-source generative models.
${engineGuidance[engine] || engineGuidance.wan22}
Convert the user's raw input (which may be in any global language: Arabic, Moroccan Darija, French, English, Spanish, German, Italian, Portuguese, Turkish, Japanese, Korean, Chinese, Hindi, etc.) into concise, concrete English prompt components following the formula: subject + scene + motion + aesthetics.
If any input fields like environment, action, camera, lighting, or style are empty, creatively complete them from the user's main idea!
Use concrete physical visual verbs—avoid abstract hype words or tag-spam filler.
${isRefVideoMode ? "Because the mode uses a reference image (I2V / FLF2V), leave 'environment' empty (\"\") and focus 'action' strictly on physically natural motion preserving the frame." : ""}
${isImageEngine ? "For image engines, 'action' should describe pose, dynamic gesture, or frozen-in-time motion/energy." : "For video engines, 'action' must describe 1–2 sentences of physically accurate, continuous temporal motion."}
Also recommend the best-matching production parameters and full scene direction:
- category: pick from ["Luxury Product Advertisement","Technology Commercial","Perfume Advertisement","Automotive Commercial","Fashion Editorial Film","Cyberpunk & Sci-Fi Cinema","Moroccan Architectural & Documentary","Anime & Stylized Makoto Shinkai","Food & Macro Beverage","Editorial Portrait Photography","Real Estate & Luxury Hospitality","Vocal & Music Performance"]
- duration: integer seconds matching the scene (4, 5, 6, 8, or 10)
- cameraMovement: pick one of ["Dolly Push-In","Orbit 180°","Tracking","Crane","Macro Probe","Dynamic Zoom","Handheld","Static + Rack"]
- lens: pick one of ["24mm Anamorphic","35mm Cinema","50mm Prime","85mm Portrait","100mm Macro"]
- lightingMood: rich English lighting and color grade description
- style: pick the closest aesthetic from ["Ultra-realistic 8K commercial shot on ARRI Alexa 65, Kodak Vision3 500T film grain","Premium luxury editorial film, crisp micro-contrast, ray-traced reflections","Photorealistic Unreal Engine 5.4 product visualization, Octane Render","Late-90s Sci-Fi Matrix green-tinted nostalgic 35mm celluloid aesthetic","Makoto Shinkai inspired hyper-detailed anime atmospheric lighting","Leica SL2 medium-format editorial photography, natural skin texture, subtle grain"]
- physicsHints: array of 1 to 3 IDs from ["gravity","fluid","volumetric","subsurface","inertia","caustics"]
- audioTags: array of 1 to 3 IDs from ["bass","whoosh","clicks","music","ambient","foley"] (empty array for image engines)
- audioDesign: synchronized sound design / foley phrase (empty string for image engines)
- dialogue: concise spoken dialogue line if appropriate (empty string if silent)
- soundEffects: concrete SFX & ambient audio cues for Google Veo 3.1 (empty string for image engines)
- minimaxCameraCommands: array of 1 to 2 bracket commands from ["Push in","Pull out","Orbit","Tracking shot","Pan left","Pan right","Tilt up","Tilt down","Pedestal up","Zoom in","Zoom out","Static shot"]
- shots: array of 3 sequential storyboard shots, each with { camera, description }
- negative: concise tailored negative prompt (empty string for flux1 or minimax)
Return strictly valid JSON matching the schema.`;

      const userPayload = `Mode: ${mode}
Category: ${category}
Raw Subject: ${subject}
Raw Environment: ${environment}
Raw Motion/Pose: ${action}
Desired Camera/Lens: ${camera}
Desired Lighting: ${light}
Desired Style/Grade: ${style}
Additional Micro-details: ${extra}`;

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: userPayload,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "Detailed English subject description",
              },
              environment: {
                type: Type.STRING,
                description: "Detailed English environment and spatial architecture",
              },
              action: {
                type: Type.STRING,
                description:
                  "Physically accurate fluid motion (video) or dynamic pose/frozen action (image)",
              },
              extra: {
                type: Type.STRING,
                description:
                  "Micro-physics, surface textures, lens optics, and atmospheric details",
              },
              category: { type: Type.STRING },
              duration: { type: Type.INTEGER },
              cameraMovement: { type: Type.STRING },
              lens: { type: Type.STRING },
              lightingMood: { type: Type.STRING },
              style: { type: Type.STRING },
              physicsHints: { type: Type.ARRAY, items: { type: Type.STRING } },
              audioTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              audioDesign: { type: Type.STRING },
              dialogue: { type: Type.STRING },
              soundEffects: { type: Type.STRING },
              minimaxCameraCommands: { type: Type.ARRAY, items: { type: Type.STRING } },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    camera: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["camera", "description"],
                },
              },
              negative: { type: Type.STRING },
            },
            required: [
              "subject",
              "environment",
              "action",
              "extra",
              "category",
              "duration",
              "cameraMovement",
              "lens",
              "lightingMood",
              "style",
              "physicsHints",
              "audioTags",
              "audioDesign",
              "dialogue",
              "soundEffects",
              "minimaxCameraCommands",
              "shots",
              "negative",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = safeParseJson(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "AI enhancement failed.");
    }
  });

  // Analyze uploaded reference image for I2V / FLF2V / Img2Img motion & composition prompt
  app.post("/api/ai/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", engine = "wan22" } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "Missing image data." });
        return;
      }

      const isImageEngine = engine === "flux1" || engine === "sdxl";
      const promptText = isImageEngine
        ? `Analyze this reference image for Image-to-Image generation (${engine}). Extract exact subject identity, setting, lighting, and artistic details in English.`
        : `Analyze this reference frame for an Image-to-Video (${engine}) generation. Describe the exact subject in frame, a realistic cinematic physical motion that animates this exact scene naturally without breaking composition, the environment, and visible lighting/atmospheric micro-details.`;

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "Concise description of the exact subject in frame",
              },
              environment: {
                type: Type.STRING,
                description: "Description of the visible environment and background",
              },
              action: {
                type: Type.STRING,
                description:
                  "Realistic cinematic physical motion or pose variation",
              },
              extra: {
                type: Type.STRING,
                description: "Lighting, lens, and atmospheric details visible in the image",
              },
            },
            required: ["subject", "environment", "action", "extra"],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = safeParseJson(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "Image analysis failed.");
    }
  });

  // Analyze First + Last frame transition for FLF2V
  app.post("/api/ai/analyze-transition", async (req, res) => {
    try {
      const {
        firstImageBase64,
        firstMimeType = "image/jpeg",
        lastImageBase64,
        lastMimeType = "image/jpeg",
      } = req.body ?? {};
      if (!firstImageBase64 || !lastImageBase64) {
        res.status(400).json({ error: "Both first and last frames are required." });
        return;
      }

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: {
          parts: [
            { text: "FIRST frame:" },
            { inlineData: { mimeType: firstMimeType, data: firstImageBase64 } },
            { text: "LAST frame:" },
            { inlineData: { mimeType: lastMimeType, data: lastImageBase64 } },
            {
              text: "You write video transition prompts for First-Last-Frame (FLF2V) models. Describe the physically plausible motion and camera move that transforms the first frame into the last frame cleanly. Return JSON.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              action: { type: Type.STRING },
              extra: { type: Type.STRING },
            },
            required: ["subject", "action", "extra"],
          },
        },
      });

      const parsed = safeParseJson((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "Transition analysis failed.");
    }
  });

  // Fit positive prompt into the 80-120 word sweet spot (90-110 words)
  app.post("/api/ai/fit-length", async (req, res) => {
    try {
      const { prompt = "" } = req.body ?? {};
      const clean = String(prompt).trim();
      if (!clean) {
        res.status(400).json({ error: "Prompt text is required." });
        return;
      }
      const words = clean.split(/\s+/).filter(Boolean).length;
      const directive =
        words < 80
          ? "expand with concrete visual, lighting, and physical texture details"
          : "cut redundancy while keeping every concrete visual fact";

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: `Rewrite this video prompt as one natural English paragraph of 90–110 words. Keep every concrete visual fact; ${directive}.\n\nPrompt:\n${clean}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
            },
            required: ["prompt"],
          },
        },
      });

      const parsed = safeParseJson((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "Length calibration failed.");
    }
  });

  // Convert engineered prompt into MiniMax Hailuo 02 or Google Veo 3.1 syntax
  app.post("/api/ai/convert-format", async (req, res) => {
    try {
      const { prompt = "", target = "hailuo02", isSinger = false } = req.body ?? {};
      const clean = String(prompt).trim();
      if (!clean) {
        res.status(400).json({ error: "Prompt text is required." });
        return;
      }

      const systemInstruction =
        target === "veo31"
          ? `Convert the prompt into Google Veo 3.1 format using the structure: [Cinematography: camera + shot] + [Subject] + [Action] + [Context] + [Style & Ambiance] + [Audio: dialogue/SFX/ambient]. ${isSinger ? "Explicitly describe lip-sync motion and vocal emotion." : ""} Target 80–150 natural English words.`
          : `Convert the prompt into MiniMax Hailuo 02 format: [camera movement] + [subject action] + [environment] + [style keywords]. Target 60–100 concise English words. Avoid any negative prompt clauses.`;

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: clean,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
            },
            required: ["prompt"],
          },
        },
      });

      const parsed = safeParseJson((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err: unknown) {
      sendAiError(res, err, "Format conversion failed.");
    }
  });

  // Sequential Scene Chain: generate opening scene prompt from baseContext + idea (server-side Gemini)
  app.post("/api/ai/first-scene", async (req, res) => {
    try {
      const {
        engine = "wan22",
        style = "",
        character = "",
        environment = "",
        camera = "",
        idea = "",
      } = req.body ?? {};

      const cleanIdea = String(idea || "").trim();
      if (!cleanIdea) {
        res.status(400).json({ error: "Please enter an opening scene idea." });
        return;
      }

      const isImageEngine = engine === "flux1" || engine === "sdxl";
      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: `Target Engine: ${engine}
Visual Style: ${style || "Cinematic photorealistic"}
Character / Subject: ${character || "Infer from the idea"}
Environment: ${environment || "Infer from the idea"}
Camera / Lens: ${camera || "Cinematic 35mm camera"}
Opening Scene Idea: "${cleanIdea}"`,
        config: {
          systemInstruction: `You are an elite AI ${isImageEngine ? "Image" : "Video"} Prompt Engineer. Transform the user's opening scene idea and fixed base context into a detailed, production-ready English prompt tailored for ${engine} (lighting, camera movement, framing, materials, atmosphere, mood). Return ONLY the prompt text.`,
        },
      });

      res.json({ prompt: (response.text ?? "").trim() });
    } catch (err: unknown) {
      sendAiError(res, err, "Opening scene generation failed.");
    }
  });

  // Video Prompt Generator v1.0 (Wan 2.2 | MiniMax Hailuo | Google Veo, Normal | Film 10 | Custom Film 2–30 Scenes)
  app.post("/api/ai/video-generator", async (req, res) => {
    try {
      const {
        idea = "",
        model = "wan",
        mode = "normal",
        scenes = 10,
        shotLen = 5,
        style = "cinematic",
        lang = "ar",
        allowMinimaxMerge = false,
        previousScenes = [],
        previousConsistencyNotes = null,
      } = req.body ?? {};

      const cleanIdea = String(idea).trim();
      if (!cleanIdea) {
        res.status(400).json({ error: "IDEA is required to generate a video prompt." });
        return;
      }

      const validModel: "wan" | "minimax" | "google" =
        model === "minimax" || model === "google" ? model : "wan";
      const requestedMode: "normal" | "film_10" | "film" =
        mode === "film_10" ? "film_10" : mode === "film" ? "film" : "normal";
      const isFilmMode = requestedMode === "film" || requestedMode === "film_10";
      const validScenes = Math.max(2, Math.min(30, Number(scenes) || 10));
      const lockedScenes =
        isFilmMode && Array.isArray(previousScenes)
          ? previousScenes
              .slice(0, Math.max(0, validScenes - 1))
              .filter(
                (scene: unknown): scene is { narrativeBeat?: unknown; prompt: string } =>
                  Boolean(scene) &&
                  typeof (scene as { prompt?: unknown }).prompt === "string"
              )
              .map((scene, index: number) => ({
                sceneNumber: index + 1,
                narrativeBeat: String(scene.narrativeBeat || "").slice(0, 300),
                prompt: String(scene.prompt).slice(0, 12000),
              }))
          : [];
      const scenesToGenerate = Math.max(1, validScenes - lockedScenes.length);
      const rawShotLen = Math.max(2, Math.min(20, Number(shotLen) || 5));
      const validShotLen = validModel === "minimax" ? Math.min(15, rawShotLen) : rawShotLen;
      const validStyle = String(style || "cinematic").trim() || "cinematic";
      const validLang: "ar" | "en" = lang === "en" ? "en" : "ar";

      const ai = getGeminiClient();
      const userPrompt = `INPUT PARAMETERS:
IDEA = "${cleanIdea}"
MODEL = ${validModel}
MODE = ${requestedMode}
${
  isFilmMode
    ? `SCENES = ${validScenes}
NEW_SCENES_TO_GENERATE = ${scenesToGenerate}
FIRST_NEW_SCENE_NUMBER = ${lockedScenes.length + 1}`
    : ""
}
${
  lockedScenes.length
    ? `LOCKED_PREVIOUS_SCENES (preserve exactly; do not regenerate or rewrite):
${JSON.stringify(lockedScenes)}
PREVIOUS_CONSISTENCY_NOTES: ${JSON.stringify(previousConsistencyNotes || {})}`
    : ""
}
SHOT_LEN = ${validShotLen}
STYLE = ${validStyle}
LANG = ${validLang}
${validModel === "minimax" && isFilmMode ? `ALLOW_MERGE_TWO_SHOTS = ${Boolean(allowMinimaxMerge)}` : ""}

Return strictly valid JSON matching the schema:
- If MODE = normal: populate "singlePrompt" (40–80 words, single continuous shot, exact model syntax; for wan, end with "--duration ${validShotLen}"; for minimax, use [Shot 1] / [Shot 2] at 00:0X within max 15s; for google, 1–3 natural sentences with no technical tags). Leave "scenes" as [] and "consistencyNotes" with empty strings.
- If MODE = film or film_10: populate "scenes" with EXACTLY ${scenesToGenerate} NEW sequential items (sceneNumber ${lockedScenes.length + 1} through ${validScenes}, zero skipped numbers). The first ${lockedScenes.length} scenes are already locked and must not be generated again. Continue their exact story, visual state, character appearance, wardrobe, props, location, palette and lens. Keep each scene prompt concise and vivid (45–70 words) so all ${validScenes} scenes preserve complete detail and continuity without truncation:
  - "sceneNumber": ${lockedScenes.length + 1}..${validScenes}
  - "narrativeBeat": short label in ${validLang === "ar" ? "Arabic" : "English"} describing this exact narrative beat
  - "prompt": ready-to-paste scene prompt following all Section 4, Section 5, and Section 6 rules:
    * For google: start with "Maintain: same character, same palette, same lens." and write 1–3 natural cinematic sentences (NO --duration tag), ending with "(consistent character design, same color palette, same lens, 35mm film grain, cinematic grading)".
    * For wan: single continuous shot with NO cut/transition wording inside the prompt, ending with "--duration ${validShotLen}" followed by "(consistent character design, same color palette, same lens, 35mm film grain, cinematic grading)".
    * For minimax: stay strictly within 15s total duration; if ALLOW_MERGE_TWO_SHOTS is true use [Shot 1] ... [Shot 2] at 00:0X, otherwise a dense single-beat prompt, ending with "(consistent character design, same color palette, same lens, 35mm film grain, cinematic grading)".
  - Also populate "consistencyNotes": { "character": "...", "palette": "...", "lens": "..." }.`;

      const response = await generateWithModelFallback(
        ai,
        {
          contents: userPrompt,
          config: {
            systemInstruction: VIDEO_PROMPT_GENERATOR_SYSTEM_PROMPT,
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                singlePrompt: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  minItems: isFilmMode ? scenesToGenerate : 0,
                  maxItems: isFilmMode ? scenesToGenerate : 30,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      narrativeBeat: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                    },
                    required: ["sceneNumber", "narrativeBeat", "prompt"],
                  },
                },
                consistencyNotes: {
                  type: Type.OBJECT,
                  properties: {
                    character: { type: Type.STRING },
                    palette: { type: Type.STRING },
                    lens: { type: Type.STRING },
                  },
                  required: ["character", "palette", "lens"],
                },
              },
              required: ["singlePrompt", "scenes", "consistencyNotes"],
            },
          },
        },
        {
          primaryTimeoutMs: isFilmMode ? 48_000 : 25_000,
          fallbackTimeoutMs: isFilmMode ? 55_000 : 38_000,
        }
      );

      const parsed = safeParseJson<{
        singlePrompt?: string;
        scenes?: Array<{ sceneNumber?: number; narrativeBeat?: string; prompt?: string }>;
        consistencyNotes?: { character?: string; palette?: string; lens?: string };
      }>((response.text ?? "{}").trim());

      const lineRule = "────────────────────────";
      const consistencyTail =
        "(consistent character design, same color palette, same lens, 35mm film grain, cinematic grading)";

      if (!isFilmMode) {
        let singlePrompt = String(parsed.singlePrompt || "").trim();
        if (validModel === "wan" && !/--duration\s+\d+/i.test(singlePrompt)) {
          singlePrompt = `${singlePrompt} --duration ${validShotLen}`;
        }
        const formattedOutput = `${lineRule}\nPROMPT:\n${singlePrompt}\n${lineRule}`;
        res.json({
          version: "1.0",
          model: validModel,
          mode: requestedMode,
          style: validStyle,
          lang: validLang,
          shotLen: validShotLen,
          singlePrompt,
          scenes: [],
          consistencyNotes: null,
          formattedOutput,
        });
        return;
      }

      const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
      if (rawScenes.length < scenesToGenerate) {
        res.status(500).json({
          error: `The model returned ${rawScenes.length} of ${scenesToGenerate} requested new scenes. Please retry; no incomplete film was saved.`,
        });
        return;
      }

      const normalizedNewScenes = rawScenes.slice(0, scenesToGenerate).map((sc, idx) => {
        const sceneNum = lockedScenes.length + idx + 1;
        let promptBody = String(sc.prompt || "").trim();

        promptBody = promptBody
          .replace(/\n?→.*?(Wan 2\.2).*$/gm, "")
          .replace(
            /\s*\(consistent character design,\s*same color palette,\s*same lens,\s*35mm film grain,\s*cinematic grading\)\s*/gi,
            ""
          )
          .trim();

        if (validModel === "google") {
          promptBody = promptBody.replace(/\s*--duration\s+\d+/gi, "").trim();
          if (!/^Maintain:/i.test(promptBody)) {
            promptBody = `Maintain: same character, same palette, same lens.\n${promptBody}`;
          }
        }
        if (validModel === "wan" && !/--duration\s+\d+/i.test(promptBody)) {
          promptBody = `${promptBody} --duration ${validShotLen}`;
        }

        promptBody = `${promptBody}\n${consistencyTail}`;

        if (validModel === "wan") {
          const wanReminder =
            validLang === "ar"
              ? "→ انسخ هذا المشهد منفردًا في Wan 2.2"
              : "→ Copy this scene individually into Wan 2.2";
          promptBody = `${promptBody}\n${wanReminder}`;
        }

        return {
          sceneNumber: sceneNum,
          narrativeBeat: String(sc.narrativeBeat || "").trim(),
          prompt: promptBody,
        };
      });

      const notes = {
        character: String(
          parsed.consistencyNotes?.character || previousConsistencyNotes?.character || ""
        ).trim(),
        palette: String(
          parsed.consistencyNotes?.palette || previousConsistencyNotes?.palette || ""
        ).trim(),
        lens: String(
          parsed.consistencyNotes?.lens || previousConsistencyNotes?.lens || ""
        ).trim(),
      };
      const normalizedScenes = [...lockedScenes, ...normalizedNewScenes];

      const sceneBlocks = normalizedScenes
        .map((sc) => `SCENE ${sc.sceneNumber}/${normalizedScenes.length}\n${sc.prompt}`)
        .join("\n\n");

      const formattedOutput = `${lineRule}
FILM PROMPT SEQUENCE — ${normalizedScenes.length} SCENES
MODEL: ${validModel} | STYLE: ${validStyle}

${sceneBlocks}

--- CONSISTENCY NOTES ---
Character: ${notes.character}
Palette: ${notes.palette}
Lens: ${notes.lens}
${lineRule}`;

      res.json({
        version: "1.0",
        model: validModel,
        mode: requestedMode,
        style: validStyle,
        lang: validLang,
        shotLen: validShotLen,
        singlePrompt: "",
        scenes: normalizedScenes,
        consistencyNotes: notes,
        formattedOutput,
      });
    } catch (err: unknown) {
      sendAiError(res, err, "Video Prompt Generator failed.");
    }
  });

  // Sequential Scene Chain: generate the next continuous prompt preserving character, style, environment, seed, and continuityState
  app.post("/api/ai/next-scene", async (req, res) => {
    try {
      const {
        engine = "wan22",
        wanVariant = "a14b",
        mode = "t2v",
        sceneOrder = 2,
        baseContext = {},
        previousPrompt = "",
        previousIdea = "",
        previousEndingState = "",
        newIdea = "",
        jobId = "",
        sceneGuardEnabled = true,
        sceneGuardProvider = "universal",
        sceneGuardRules = "",
      } = req.body ?? {};

      const cleanNewIdea = String(newIdea || "").trim();
      if (!cleanNewIdea) {
        res.status(400).json({ error: "Please enter the idea for the next scene." });
        return;
      }

      const isImageEngine = engine === "flux1" || engine === "sdxl";
      const activeJobId =
        String(jobId || "").trim() ||
        `sg_chain_${sceneOrder}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const guardRulesBlock = String(sceneGuardRules || "").trim();
      const useGuardContext = sceneGuardEnabled !== false && !isImageEngine;
      const systemInstruction = `You are an elite AI Continuity Screenwriter and Prompt Engineer for generative ${isImageEngine ? "image" : "video"} models (currently targeting ${engine}${engine === "wan22" ? ` ${wanVariant}` : ""}, mode: ${mode}).
Your task is to write Scene #${sceneOrder} (Independent Job ID: ${activeJobId}) in an ongoing visual sequence so it preserves visual continuity for the locked hero character and aesthetic while keeping each shot cleanly isolated without residual artifacts.

STRICT CONTINUITY RULES:
1. Keep the EXACT same hero character/subject identity (appearance, age, clothing, materials, colors) from the Base Context.
2. Keep the EXACT same visual style, color palette, lens language, and lighting mood unless the new idea explicitly moves to an adjacent area.
3. Begin the motion/pose seamlessly continuing from where the previous scene ended ("Continuing seamlessly from the previous shot...").
4. Change ONLY the event/action/beat according to the user's new scene idea (which may be written in Arabic, Darija, French, English, or any global language).
5. Maintain a SERIES CONTINUITY BIBLE: track the scene start/end state, character position and pose, gaze, prop placement, screen direction, time of day, and unresolved action. Preserve recurring visual facts, but do not carry temporary effects or repeat the previous action without a story reason.
6. Continue an action seamlessly only when the new scene is the same moment. If the user requests a time or location change, create a motivated transition while preserving character and visual identity.
7. Do not invent characters, props, dialogue, backstory, or events that conflict with the user's story.
8. Output all generated prompt fields in crisp, production-ready English (and keep dialogue in the requested/natural language if needed).
9. Return a concise continuityState describing the final visible state of this scene: character pose and screen position, gaze, prop positions, environment state, lighting/time, camera direction, and any unfinished action. This state will guide the next scene.
10. Return strictly valid JSON matching the schema.${
        useGuardContext
          ? `\n\nSMART SCENE GUARD ISOLATION DIRECTIVE (Provider: ${sceneGuardProvider}):
- Treat Scene #${sceneOrder} as an independent cinematic shot with zero ghosting, zero residual frames, zero unintended scene blending, and zero duplicated characters or objects carried over unintentionally.
- Do NOT copy meta-tags like "[SMART SCENE ISOLATION — STRICT MODE]", "[CINEMATIC PRODUCTION RULES]", or "Avoid: scene blending..." into your JSON fields; express the shot cleanly and let the prompt compiler attach the isolation block.`
          : ""
      }`;

      const userPayload = `=== FIXED BASE CONTEXT (MUST BE PRESERVED) ===
Engine: ${engine}
Independent Generation Job ID: ${activeJobId}
Character / Hero Subject: ${baseContext?.character || "Infer from previous prompt"}
Visual Style: ${baseContext?.style || "Preserve previous scene style"}
Environment: ${baseContext?.environment || "Preserve or logically transition from previous scene"}
Camera / Lens: ${baseContext?.camera || "Consistent cinematic framing"}
Lighting: ${baseContext?.lighting || "Consistent lighting"}
Locked Seed: ${baseContext?.seed ?? ""}

=== PREVIOUS SCENE (#${Math.max(1, Number(sceneOrder) - 1)}) ===
Previous Idea: ${previousIdea}
Previous Full Prompt:
${previousPrompt}
Previous Ending State (highest-priority handoff):
${previousEndingState || "Infer only from the previous scene prompt; do not invent details."}${
        useGuardContext && guardRulesBlock
          ? `\n\n=== SMART SCENE GUARD ISOLATION CONTEXT ===\n${guardRulesBlock}`
          : ""
      }

=== CONTINUITY STATE REQUIREMENTS ===
Treat the base context as the canonical film/series visual bible. Keep recurring character and production design consistent. Resolve continuity using the previous scene ending state, but obey any explicit time jump, location change, costume change, or story development in the new idea. Each scene must be independently renderable and must not contain residual frames or unintended elements from the previous generation.

=== NEW SCENE (#${sceneOrder}) USER IDEA ===
"${cleanNewIdea}"`;

      const ai = getGeminiClient();
      const response = await generateWithModelFallback(ai, {
        contents: userPayload,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transitionNote: {
                type: Type.STRING,
                description: "Short motivated transition phrase connecting the previous scene to this scene",
              },
              continuityState: {
                type: Type.STRING,
                description:
                  "Concise final-state handoff for the next scene: character pose and screen position, gaze, prop positions, environment state, lighting/time, camera direction, and unfinished action",
              },
              subject: {
                type: Type.STRING,
                description: "Consistent hero character/subject description preserving exact appearance & outfit",
              },
              environment: {
                type: Type.STRING,
                description: "Consistent or logically connected environment",
              },
              action: {
                type: Type.STRING,
                description: "New continuous physical motion / pose starting seamlessly from previous scene",
              },
              extra: {
                type: Type.STRING,
                description: "Micro-physics, surface continuity, and atmospheric details",
              },
              cameraMovement: { type: Type.STRING },
              lens: { type: Type.STRING },
              lightingMood: { type: Type.STRING },
              style: { type: Type.STRING },
              dialogue: { type: Type.STRING },
              soundEffects: { type: Type.STRING },
              minimaxCameraCommands: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              "transitionNote",
              "continuityState",
              "subject",
              "environment",
              "action",
              "extra",
              "cameraMovement",
              "lens",
              "lightingMood",
              "style",
              "dialogue",
              "soundEffects",
              "minimaxCameraCommands",
            ],
          },
        },
      });

      const parsed = safeParseJson((response.text ?? "{}").trim());
      res.json({ ...parsed, jobId: activeJobId });
    } catch (err: unknown) {
      sendAiError(res, err, "Next scene generation failed.");
    }
  });

  const normalizeMiniMaxApiKey = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    if (!cleaned) return null;
    const lower = cleaned.toLowerCase();
    if (
      cleaned === "MY_MINIMAX_API_KEY" ||
      lower.includes("placeholder") ||
      lower.startsWith("your_") ||
      lower.startsWith("<") ||
      cleaned.length < 12
    ) {
      return null;
    }
    return cleaned;
  };

  // MiniMax Hailuo 02 Video Generation & Status Proxy
  app.post("/api/minimax/generate", async (req, res) => {
    try {
      const {
        jobId,
        prompt = "",
        duration = 6,
        resolution = "1080P",
        promptOptimizer = true,
        firstFrameDataUrl = "",
        lastFrameDataUrl = "",
      } = req.body ?? {};

      const cleanPrompt = String(prompt).trim();
      if (!cleanPrompt) {
        res.status(400).json({ error: "MiniMax prompt cannot be empty." });
        return;
      }

      const activeJobId =
        typeof jobId === "string" && jobId.trim()
          ? jobId.trim()
          : `sg_minimax_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const validDuration = Number(duration) === 10 ? 10 : 6;
      const validResolution =
        validDuration === 10
          ? "768P"
          : resolution === "768P"
            ? "768P"
            : "1080P";

      const handoffPayload = {
        mode: "handoff" as const,
        configured: false,
        jobId: activeJobId,
        launchUrl: "https://hailuoai.video/create",
        payloadPreview: {
          job_id: activeJobId,
          model: "MiniMax-Hailuo-02",
          duration: validDuration,
          resolution: validResolution,
          prompt_optimizer: Boolean(promptOptimizer),
          hasFirstFrame: Boolean(firstFrameDataUrl),
          hasLastFrame: Boolean(lastFrameDataUrl),
        },
      };

      const apiKey = normalizeMiniMaxApiKey(process.env.MINIMAX_API_KEY);
      if (!apiKey) {
        res.json(handoffPayload);
        return;
      }

      const payload: Record<string, unknown> = {
        model: "MiniMax-Hailuo-02",
        prompt: cleanPrompt,
        duration: validDuration,
        resolution: validResolution,
        prompt_optimizer: Boolean(promptOptimizer),
      };
      if (firstFrameDataUrl) {
        payload.first_frame_image = String(firstFrameDataUrl);
      }
      if (lastFrameDataUrl) {
        payload.last_frame_image = String(lastFrameDataUrl);
      }

      const mmRes = await fetch("https://api.minimax.io/v1/video_generation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(payload),
      });
      const mmData = await safeReadUpstreamJson<{
        task_id?: string;
        base_resp?: { status_code?: number; status_msg?: string };
      }>(mmRes);

      const statusMsg = String(mmData?.base_resp?.status_msg || "");
      const isAuthFailure =
        mmRes.status === 401 ||
        mmRes.status === 403 ||
        mmData?.base_resp?.status_code === 1004 ||
        /login fail|authorization|secret key|invalid.*(?:api)?\s*key/i.test(
          statusMsg
        );

      if (isAuthFailure) {
        res.json({ ...handoffPayload, authFallback: true });
        return;
      }

      if (
        !mmRes.ok ||
        (mmData.base_resp?.status_code && mmData.base_resp.status_code !== 0) ||
        !mmData.task_id
      ) {
        throw new Error(
          statusMsg || `MiniMax API returned HTTP ${mmRes.status}`
        );
      }

      res.json({
        mode: "api",
        configured: true,
        jobId: activeJobId,
        taskId: mmData.task_id,
        duration: validDuration,
        resolution: validResolution,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "MiniMax generation failed.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/minimax/status/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const apiKey = normalizeMiniMaxApiKey(process.env.MINIMAX_API_KEY);
      if (!apiKey) {
        res.status(400).json({ error: "MINIMAX_API_KEY is not configured." });
        return;
      }

      const queryRes = await fetch(
        `https://api.minimax.io/v1/query/video_generation?task_id=${encodeURIComponent(
          taskId
        )}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        }
      );
      const queryData = await safeReadUpstreamJson<{
        status?: string;
        file_id?: string;
        base_resp?: { status_code?: number; status_msg?: string };
      }>(queryRes);

      if (
        !queryRes.ok ||
        (queryData.base_resp?.status_code && queryData.base_resp.status_code !== 0)
      ) {
        throw new Error(
          queryData?.base_resp?.status_msg ||
            `MiniMax status query returned HTTP ${queryRes.status}`
        );
      }

      let videoUrl = "";
      if (queryData.status === "Success" && queryData.file_id) {
        const fileRes = await fetch(
          `https://api.minimax.io/v1/files/retrieve?file_id=${encodeURIComponent(
            queryData.file_id
          )}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(15_000),
          }
        );
        if (!fileRes.ok) {
          throw new Error(`MiniMax file retrieve returned HTTP ${fileRes.status}`);
        }
        const fileData = await safeReadUpstreamJson<{
          file?: { download_url?: string };
        }>(fileRes);
        videoUrl = fileData?.file?.download_url || "";
      }

      res.json({
        status: queryData.status || "Processing",
        fileId: queryData.file_id || null,
        videoUrl: videoUrl || null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "MiniMax status query failed.";
      res.status(500).json({ error: message });
    }
  });

  // Contact & compliance inquiry endpoint
  app.post("/api/contact", (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const subject = String(req.body?.subject || "General").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || name.length < 2) {
      res.status(400).json({ error: "Please provide your name." });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }
    if (!message || message.length < 10) {
      res.status(400).json({ error: "Message must be at least 10 characters." });
      return;
    }

    res.json({
      ok: true,
      receivedAt: new Date().toISOString(),
      subject: subject.slice(0, 120),
    });
  });

  // API 404 handler
  app.use("/api", (_req, res) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
    });
  });

  // Serve Google AdSense verification and crawler files reliably in both dev & prod
  app.get("/ads.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send("google.com, pub-3312377428939400, DIRECT, f08c47fec0942fa0\n");
  });

  const resolvePublicOrigin = (req: express.Request): string => {
    const envUrl = (process.env.APP_URL || "").trim();
    if (
      envUrl &&
      /^https?:\/\//i.test(envUrl) &&
      !envUrl.includes("MY_APP_URL")
    ) {
      return envUrl.replace(/\/+$/, "");
    }
    const rawHost = (
      req.get("x-forwarded-host") ||
      req.get("host") ||
      ""
    )
      .split(",")[0]
      ?.trim();
    if (
      rawHost &&
      !rawHost.startsWith("localhost") &&
      !rawHost.startsWith("127.0.0.1") &&
      !rawHost.startsWith("0.0.0.0") &&
      /^[a-zA-Z0-9.-]+(:\d+)?$/.test(rawHost)
    ) {
      const rawProto = (
        req.get("x-forwarded-proto") ||
        req.protocol ||
        "https"
      )
        .split(",")[0]
        ?.trim()
        .toLowerCase();
      const proto = rawProto === "http" || rawProto === "https" ? rawProto : "https";
      return `${proto}://${rawHost}`;
    }
    return "https://videoprompts.ai.studio";
  };

  const setNoCacheHtmlHeaders = (res: express.Response) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.removeHeader("ETag");
  };

  app.get("/robots.txt", (req, res) => {
    const origin = resolvePublicOrigin(req);
    res.type("text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      [
        "User-agent: Mediapartners-Google",
        "Allow: /",
        "",
        "User-agent: AdsBot-Google",
        "Allow: /",
        "",
        "User-agent: Googlebot",
        "Allow: /",
        "",
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
      ].join("\n")
    );
  });

  app.get("/sitemap.xml", (req, res) => {
    const origin = resolvePublicOrigin(req);
    res.type("application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n  <url><loc>${origin}/guide</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n  <url><loc>${origin}/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n  <url><loc>${origin}/privacy</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n  <url><loc>${origin}/terms</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n  <url><loc>${origin}/contact</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>\n`
    );
  });

  const distDir = path.resolve(__dirname, "dist");
  const indexPath = path.join(distDir, "index.html");
  const isTsxDev =
    process.env.npm_lifecycle_event === "dev" ||
    process.execArgv.some((arg) => arg.includes("tsx")) ||
    process.argv.some((arg) => arg.includes("tsx"));
  const isStartScript =
    process.env.npm_lifecycle_event === "start" ||
    process.env.npm_lifecycle_event === "start:tsx";
  const useProductionDist =
    process.env.NODE_ENV === "production" ||
    (isStartScript && fs.existsSync(indexPath)) ||
    (!isTsxDev && fs.existsSync(indexPath));

  if (!useProductionDist) {
    const disableHmr = process.env.DISABLE_HMR === "true";
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
        ...(disableHmr ? { ws: false } : {}),
      },
      appType: "spa",
    });

    if (disableHmr) {
      // Prevent Vite's dev client from attempting WebSocket connections when HMR is disabled,
      // while preserving CSS style injection and module exports expected by dev transforms.
      app.get("/@vite/client", (_req, res) => {
        res.type("application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}
export class ErrorOverlay extends HTMLElement {}
`);
      });
    }

    app.use((req, res, next) => {
      if (req.method === "GET" && (req.headers.accept || "").includes("text/html")) {
        setNoCacheHtmlHeaders(res);
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        index: false,
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            setNoCacheHtmlHeaders(res);
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          } else {
            res.setHeader("Cache-Control", "no-cache, must-revalidate");
          }
        },
      })
    );

    app.get("*", (req, res) => {
      setNoCacheHtmlHeaders(res);

      if (fs.existsSync(indexPath)) {
        const rawHtml = fs.readFileSync(indexPath, "utf-8");
        const origin = resolvePublicOrigin(req);
        const html = rawHtml.replaceAll(
          "https://videoprompts.ai.studio",
          origin
        );
        res.type("html").send(html);
        return;
      }
      res
        .status(503)
        .type("text/plain")
        .send("Build output missing. Run npm run build.");
    });
  }

  // Global error handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("Application error:", err);
      if (res.headersSent) {
        return next(err);
      }

      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
          success: false,
          error: "Invalid JSON request body.",
        });
        return;
      }

      const status =
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status?: unknown }).status === "number"
          ? (err as { status: number }).status
          : 500;

      if (status === 413) {
        res.status(413).json({
          success: false,
          error: "Request payload too large.",
        });
        return;
      }

      res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        error: "Internal server error",
      });
    }
  );

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`VideoPrompts Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
