import type { EngineId } from "../types/prompt";
import { CinematicPromptRules } from "./cinematicPromptRules";

export type SmartSceneGuardProvider = "wan" | "minimax" | "veo" | "universal";

export interface IsolatedSceneItem {
  sceneId: string;
  jobId: string;
  prompt: string;
  independent: true;
}

export const SmartSceneGuard = {
  version: "2.0",

  isolationRules: `[SMART SCENE ISOLATION — STRICT MODE]

SCENE INDEPENDENCE:
Treat this generation as an independent cinematic scene.
Never import, reuse, or blend unrelated previous scenes.
Do not carry over previous backgrounds, characters, objects,
lighting setups, or camera compositions.

ENVIRONMENT LOCK:
Maintain one coherent environment throughout this shot.
No unexpected location changes or background replacement.

CHARACTER LOCK:
Preserve the identity, face, clothing, body proportions,
and appearance of every reference character.
No duplication, replacement, or identity drift.

TEMPORAL STABILITY:
No ghosting, residual frames, double exposure,
frame blending, flickering, visual trails, or unwanted morphing.

CAMERA CONTINUITY:
Follow only the camera movements requested by the user.
Maintain realistic camera physics and spatial continuity.
No unintended cuts or sudden camera jumps.

OBJECT CONSISTENCY:
Keep objects in their correct positions.
Do not introduce unrelated objects or duplicate existing objects.

SCENE BOUNDARIES:
One coherent shot unless multiple scenes are explicitly requested.
Keep intentional camera movements and transitions.
Do not blend unrelated scenes or environments.

FINAL FRAME:
End the requested scene naturally.
Do not introduce another scene at the end.

PRIORITY:
Preserve the user's original creative idea.
These instructions must not override the requested action.

[END SMART SCENE ISOLATION]`,

  negativeRules: `Avoid: scene blending, previous scene residue,
unrelated backgrounds, ghosting, double exposure,
duplicated characters, duplicated objects, flickering,
temporal artifacts, unwanted transitions, visual trails,
identity drift, environment morphing, camera jumps,
random scene changes, residual frames.`,

  negativeTokens: [
    "scene blending",
    "previous scene residue",
    "unrelated backgrounds",
    "ghosting",
    "double exposure",
    "duplicated characters",
    "duplicated objects",
    "flickering",
    "temporal artifacts",
    "unwanted transitions",
    "visual trails",
    "identity drift",
    "environment morphing",
    "camera jumps",
    "random scene changes",
    "residual frames",
  ],

  providerRules: {
    wan: `[WAN TEMPORAL CONTROL]
Maintain stable frame-to-frame composition.
Preserve reference image identity.
Use smooth continuous motion.
Avoid unintended temporal blending.`,

    minimax: `[MINIMAX SHOT CONTROL]
Maintain one coherent cinematic shot.
Preserve subject and environment consistency.
No unexpected scene transitions.
Maintain natural camera and object motion.`,

    veo: `[VEO SCENE CONTROL]
Maintain a single continuous cinematic scene with consistent subject identity, natural lighting continuity, and coherent camera motion.`,

    universal: `[UNIVERSAL VIDEO CONSISTENCY]
Maintain visual and temporal consistency.`,
  } satisfies Record<SmartSceneGuardProvider, string>,

  organicVisualDirectives: {
    wan: "Single continuous shot with stable frame-to-frame geometry and consistent subject identity.",
    minimax: "One continuous single-take cinematic shot preserving subject identity and spatial continuity.",
    veo: "Single continuous cinematic take with consistent subject identity and coherent camera motion.",
    universal: "Continuous single-take shot with consistent environment and temporal stability.",
  } satisfies Record<SmartSceneGuardProvider, string>,

  resolveProvider(engine: EngineId | string): SmartSceneGuardProvider {
    const lower = String(engine || "").toLowerCase();
    if (lower.includes("wan")) return "wan";
    if (lower.includes("minimax") || lower.includes("hailuo")) return "minimax";
    if (lower.includes("veo") || lower.includes("google")) return "veo";
    return "universal";
  },

  apply(
    prompt: string,
    provider: string = "universal",
    includeRawBlocks: boolean = false
  ): string {
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("A valid video prompt is required.");
    }

    const cleaned = this.strip(prompt);
    const providerKey = this.resolveProvider(provider);

    if (includeRawBlocks) {
      return [
        cleaned,
        CinematicPromptRules.build(providerKey),
        this.providerRules[providerKey],
        this.isolationRules,
        this.negativeRules,
      ].join("\n\n");
    }

    const directive = this.organicVisualDirectives[providerKey];
    if (
      cleaned.toLowerCase().includes("single-take") ||
      cleaned.toLowerCase().includes("continuous shot") ||
      cleaned.toLowerCase().includes("continuous cinematic take")
    ) {
      return cleaned;
    }

    return `${cleaned} ${directive}`.trim();
  },

  applyWithinLimit(
    prompt: string,
    provider: string = "universal",
    maxChars: number = 2200
  ): string {
    const applied = this.apply(prompt, provider, false);
    if (applied.length <= maxChars) return applied;
    return `${applied.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
  },

  getGuardMetadataBlock(provider: string = "universal"): string {
    const providerKey = this.resolveProvider(provider);
    return [
      CinematicPromptRules.build(providerKey),
      this.providerRules[providerKey],
      this.isolationRules,
    ].join("\n\n");
  },

  mergeNegativePrompt(baseNegative: string): string {
    const existing = (baseNegative || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const existingLower = new Set(existing.map((s) => s.toLowerCase()));

    for (const token of this.negativeTokens) {
      if (!existingLower.has(token.toLowerCase())) {
        existing.push(token);
      }
    }
    return existing.join(", ");
  },

  strip(prompt: string): string {
    if (!prompt || typeof prompt !== "string") return "";
    return CinematicPromptRules.strip(prompt)
      .replace(
        /\n*\[(?:WAN TEMPORAL CONTROL|MINIMAX SHOT CONTROL|VEO SCENE CONTROL|UNIVERSAL VIDEO CONSISTENCY)\][\s\S]*?(?=\n+\[SMART SCENE ISOLATION — STRICT MODE\]|\n+AUDIO & SOUND DESIGN:|\n+NEGATIVE PROMPT:|$)/g,
        ""
      )
      .replace(
        /\n*\[SMART SCENE ISOLATION — STRICT MODE\][\s\S]*?\[END SMART SCENE ISOLATION\](?:\s*\n+Avoid:\s*scene blending,[\s\S]*?residual frames\.)?/g,
        ""
      )
      .replace(/\n*\[SMART SCENE COMPACT CONTINUITY[^\]]*\][\s\S]*?(?=\n\n|$)/gi, "")
      .replace(/\[SYSTEM LEVEL SCENE ISOLATION[^\]]*\]/gi, "")
      .replace(/\[MINIMAX CINEMATIC PROMPT\]|\[END MINIMAX PROMPT\]/gi, "")
      .replace(/\n*\[SMART SCENE ISOLATION — STRICT MODE\][\s\S]*$/g, "")
      .replace(/\n*Avoid:\s*scene blending,[\s\S]*?residual frames\./g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  separateScenes(
    scenes: string[],
    provider: string = "universal"
  ): IsolatedSceneItem[] {
    if (!Array.isArray(scenes)) {
      throw new Error("Scenes must be an array.");
    }

    const baseTs = Date.now();
    return scenes.map((scene, index) => ({
      sceneId: `scene_${index + 1}`,
      jobId: `sg_${baseTs}_${index + 1}_${Math.random().toString(36).slice(2, 7)}`,
      prompt: this.apply(scene, provider, false),
      independent: true,
    }));
  },
};
