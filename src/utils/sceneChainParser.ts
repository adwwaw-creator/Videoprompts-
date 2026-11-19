import {
  EngineId,
  SceneChainContext,
  SceneChainItem,
  SceneChainState,
  StudioFormState,
} from "../types/prompt";

const HEADER_REGEX =
  /^\s*(?:={2,}\s*)?(?:المشهد|مشهد|Scene|Scène|Shot|SHOT)\s*(\d+)\s*(?:[:\-—–]\s*(.+?))?(?:\s*={2,})?\s*$/i;

function cleanTrailingMarkers(title: string): {
  idea: string;
  engineHint?: string;
} {
  let clean = title.replace(/={2,}\s*$/g, "").trim();
  let engineHint: string | undefined;
  const parenMatch = clean.match(/\(([^()]+)\)\s*$/);
  if (parenMatch) {
    engineHint = parenMatch[1].trim();
    clean = clean.slice(0, parenMatch.index).trim();
  }
  return { idea: clean, engineHint };
}

function summarizeIdea(promptText: string, order: number): string {
  const firstLine =
    promptText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith("[")) || "";
  const cleaned = firstLine
    .replace(/^(SUBJECT|CINEMATOGRAPHY|STYLE|ACTION|SHOT\s*\d+)\s*:\s*/i, "")
    .trim();
  if (!cleaned) return `#${order}`;
  const words = cleaned.split(/\s+/).slice(0, 7).join(" ");
  return words.length < cleaned.length ? `${words}…` : words;
}

function splitPositiveNegative(prompt: string): {
  positiveOnly: string;
  negativeOnly: string;
} {
  const negMatch = prompt.match(/\n?NEGATIVE(?:\s+PROMPT|\s+CONSTRAINTS)?\s*:\s*([\s\S]*)$/i);
  if (!negMatch || negMatch.index === undefined) {
    return { positiveOnly: prompt.trim(), negativeOnly: "" };
  }
  return {
    positiveOnly: prompt.slice(0, negMatch.index).trim(),
    negativeOnly: negMatch[1].trim(),
  };
}

function extractContinuityHandoff(rawPrompt: string): {
  prompt: string;
  continuityState?: string;
} {
  const match = rawPrompt.match(
    /\n*CONTINUITY HANDOFF FOR NEXT SCENE:\s*([\s\S]*)$/i
  );
  if (!match || match.index === undefined) {
    return { prompt: rawPrompt.trim() };
  }
  const prompt = rawPrompt.slice(0, match.index).trim();
  const continuityState = match[1].trim();
  return continuityState ? { prompt, continuityState } : { prompt };
}

function extractField(text: string, labelPattern: RegExp): string {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(labelPattern);
    if (m && m[1]?.trim()) {
      return m[1].trim();
    }
  }
  return "";
}

function detectEngine(hint: string | undefined, fallback: EngineId): EngineId {
  if (!hint) return fallback;
  const lower = hint.toLowerCase();
  if (lower.includes("minimax") || lower.includes("hailuo")) return "minimax";
  if (lower.includes("veo") || lower.includes("google")) return "veo";
  if (lower.includes("wan")) return "wan22";
  if (lower.includes("hunyuan")) return "hunyuan";
  if (lower.includes("ltx")) return "ltx";
  if (lower.includes("flux")) return "flux1";
  if (lower.includes("sdxl")) return "sdxl";
  return fallback;
}

export function parseSceneChainTxt(
  rawText: string,
  currentForm: StudioFormState
): SceneChainState | null {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const lines = normalized.split("\n");
  const parsedBlocks: Array<{
    order: number;
    idea: string;
    promptLines: string[];
    engineHint?: string;
  }> = [];

  let currentBlock: {
    order: number;
    idea: string;
    promptLines: string[];
    engineHint?: string;
  } | null = null;

  for (const line of lines) {
    const match = line.match(HEADER_REGEX);
    if (match) {
      if (currentBlock && currentBlock.promptLines.join("\n").trim()) {
        parsedBlocks.push(currentBlock);
      }
      const parsedOrder = Number(match[1]) || parsedBlocks.length + 1;
      const rawTitle = match[2] ? cleanTrailingMarkers(match[2]) : { idea: "" };
      currentBlock = {
        order: parsedOrder,
        idea: rawTitle.idea,
        promptLines: [],
        engineHint: rawTitle.engineHint,
      };
    } else if (currentBlock) {
      currentBlock.promptLines.push(line);
    }
  }

  if (currentBlock && currentBlock.promptLines.join("\n").trim()) {
    parsedBlocks.push(currentBlock);
  }

  // Fallback if no explicit scene headers were present: split on '---' or blank lines
  if (parsedBlocks.length === 0) {
    const hasDividers = /\n\s*-{3,}\s*\n/.test(normalized);
    const chunks = (
      hasDividers
        ? normalized.split(/\n\s*-{3,}\s*\n/)
        : normalized.split(/\n\s*\n+/)
    )
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    if (chunks.length === 0) return null;

    chunks.forEach((chunk, idx) => {
      parsedBlocks.push({
        order: idx + 1,
        idea: summarizeIdea(chunk, idx + 1),
        promptLines: [chunk],
      });
    });
  }

  const now = Date.now();
  const scenes: SceneChainItem[] = parsedBlocks
    .map((block, idx): SceneChainItem | null => {
      const rawPrompt = block.promptLines.join("\n").trim();
      if (!rawPrompt) return null;
      const { prompt, continuityState } = extractContinuityHandoff(rawPrompt);
      if (!prompt) return null;
      const order = idx + 1;
      const { positiveOnly, negativeOnly } = splitPositiveNegative(prompt);
      return {
        id: now + idx,
        order,
        idea: block.idea || summarizeIdea(prompt, order),
        prompt,
        positiveOnly,
        negativeOnly,
        engine: detectEngine(block.engineHint, currentForm.engine),
        createdAt: now + idx,
        sceneId: `scene_${order}`,
        ...(continuityState ? { continuityState } : {}),
      };
    })
    .filter((item): item is SceneChainItem => item !== null);

  if (scenes.length === 0) return null;

  const firstPrompt = scenes[0].prompt;
  const seedMatch = firstPrompt.match(/\bseed\s*[:=]\s*(\d+)/i);
  const extractedSeed = seedMatch ? Number(seedMatch[1]) : currentForm.seed;

  const baseContext: SceneChainContext = {
    engine: scenes[0].engine,
    style:
      extractField(firstPrompt, /^(?:STYLE(?:\s*&\s*AMBIANCE)?|VISUAL STYLE)\s*:\s*(.+)$/i) ||
      currentForm.style ||
      "Cinematic photorealistic",
    character:
      extractField(firstPrompt, /^(?:MAIN\s+)?SUBJECT\s*:\s*(.+)$/i) ||
      currentForm.subject ||
      scenes[0].idea,
    environment:
      extractField(firstPrompt, /^(?:ENVIRONMENT|CONTEXT)\s*:\s*(.+)$/i) ||
      currentForm.environment,
    camera:
      extractField(firstPrompt, /^(?:CAMERA|CINEMATOGRAPHY)\s*:\s*(.+)$/i) ||
      currentForm.camera,
    lighting:
      extractField(firstPrompt, /^LIGHTING\s*:\s*(.+)$/i) || currentForm.light,
    seed: Number.isFinite(extractedSeed) ? extractedSeed : currentForm.seed,
  };

  return {
    baseContext,
    scenes,
  };
}

export function parseSceneChainInput(
  rawText: string,
  currentForm: StudioFormState
): SceneChainState | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as
        | Partial<SceneChainState>
        | Partial<SceneChainItem>[];
      const rawScenes = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.scenes)
          ? parsed.scenes
          : null;

      if (rawScenes && rawScenes.length > 0) {
        const now = Date.now();
        const scenes: SceneChainItem[] = rawScenes
          .map((item, idx): SceneChainItem | null => {
            const prompt = typeof item?.prompt === "string" ? item.prompt.trim() : "";
            if (!prompt) return null;
            const order =
              typeof item.order === "number" && item.order > 0
                ? item.order
                : idx + 1;
            const { positiveOnly, negativeOnly } = splitPositiveNegative(prompt);
            return {
              id: typeof item.id === "number" ? item.id : now + idx,
              order,
              idea:
                typeof item.idea === "string" && item.idea.trim()
                  ? item.idea.trim()
                  : summarizeIdea(prompt, order),
              prompt,
              positiveOnly:
                typeof item.positiveOnly === "string" && item.positiveOnly.trim()
                  ? item.positiveOnly
                  : positiveOnly,
              negativeOnly:
                typeof item.negativeOnly === "string"
                  ? item.negativeOnly
                  : negativeOnly,
              engine:
                typeof item.engine === "string"
                  ? detectEngine(item.engine, currentForm.engine)
                  : currentForm.engine,
              createdAt:
                typeof item.createdAt === "number" ? item.createdAt : now + idx,
              sceneId:
                typeof item.sceneId === "string" && item.sceneId.trim()
                  ? item.sceneId
                  : `scene_${order}`,
              ...(typeof item.jobId === "string" && item.jobId.trim()
                ? { jobId: item.jobId }
                : {}),
              ...(typeof item.continuityState === "string" && item.continuityState.trim()
                ? { continuityState: item.continuityState }
                : {}),
            };
          })
          .filter((item): item is SceneChainItem => item !== null);

        if (scenes.length > 0) {
          const rawCtx = !Array.isArray(parsed) ? parsed?.baseContext : null;
          const baseContext: SceneChainContext = {
            engine: rawCtx?.engine
              ? detectEngine(rawCtx.engine, scenes[0].engine)
              : scenes[0].engine,
            style:
              typeof rawCtx?.style === "string" && rawCtx.style.trim()
                ? rawCtx.style
                : currentForm.style || "Cinematic photorealistic",
            character:
              typeof rawCtx?.character === "string" && rawCtx.character.trim()
                ? rawCtx.character
                : currentForm.subject || scenes[0].idea,
            environment:
              typeof rawCtx?.environment === "string"
                ? rawCtx.environment
                : currentForm.environment,
            camera:
              typeof rawCtx?.camera === "string"
                ? rawCtx.camera
                : currentForm.camera,
            lighting:
              typeof rawCtx?.lighting === "string"
                ? rawCtx.lighting
                : currentForm.light,
            seed:
              typeof rawCtx?.seed === "number" && Number.isFinite(rawCtx.seed)
                ? rawCtx.seed
                : currentForm.seed,
          };
          return { baseContext, scenes };
        }
      }
    } catch {
      // Fallback to TXT parsing if JSON is malformed
    }
  }

  return parseSceneChainTxt(rawText, currentForm);
}
