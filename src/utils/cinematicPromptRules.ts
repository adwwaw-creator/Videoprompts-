import type { EngineId } from "../types/prompt";

export type CinematicProvider = "wan" | "minimax" | "veo" | "universal";

const RULE_MARKER = "[CINEMATIC PRODUCTION RULES]";

/**
 * Engine-aware directing rules. Keep each rule concise and avoid forcing cuts,
 * audio, lenses, or timelines that the user did not request.
 */
const PROVIDER_RULES: Record<CinematicProvider, string> = {
  wan: `MODEL PROFILE — WAN 2.2:
- Prefer concrete visual descriptions and one clearly readable primary action.
- Describe motion as a simple cause-and-effect sequence; avoid stacking many simultaneous actions.
- For a single-shot request, keep one continuous camera move and one coherent environment.
- For storyboard requests, make each shot visually distinct and specify only the transition needed.
- Keep prompts signal-rich and concise; avoid contradictory camera, motion, and lighting instructions.
- Do not assume native audio generation; include sound direction only when the selected workflow supports audio.`,
  minimax: `MODEL PROFILE — MINIMAX / HAILUO:
- Prioritize the main subject, its physical action, and the camera movement.
- Use direct, observable motion verbs and a clear beginning, development, and end.
- Avoid excessive micro-actions, multiple competing camera commands, and unnecessary technical jargon.
- Keep one coherent shot unless the user explicitly requests a sequence of shots.
- Do not assume native audio generation; include sound direction only when the selected workflow supports audio.`,
  veo: `MODEL PROFILE — GOOGLE VEO:
- Use natural-language cinematic direction with clear subject, action, setting, and camera intent.
- Describe physical interactions and synchronized sound only when requested and supported by the selected Veo model.
- Keep dialogue exact and assign it to the correct speaker when dialogue is provided.
- For fast generation, prioritize one subject, one primary action, and a simple camera instruction.
- Respect the selected model's duration, aspect ratio, resolution, and audio capabilities; never imply unsupported settings.`,
  universal: `MODEL PROFILE — UNIVERSAL VIDEO:
- Make the subject, setting, primary action, and camera intent unambiguous.
- Prefer observable details over abstract adjectives.
- Keep actions physically plausible and temporally ordered.
- Do not invent dialogue, sound, props, characters, or scene changes that the user did not request.`,
};

export const CinematicPromptRules = {
  version: "1.0.0",

  resolveProvider(engine: EngineId | string): CinematicProvider {
    const value = String(engine || "").toLowerCase();
    if (value.includes("wan")) return "wan";
    if (value.includes("minimax") || value.includes("hailuo")) return "minimax";
    if (value.includes("veo") || value.includes("google")) return "veo";
    return "universal";
  },

  build(engine: EngineId | string): string {
    const provider = this.resolveProvider(engine);
    return `${RULE_MARKER}

${PROVIDER_RULES[provider]}

GLOBAL FILM-DIRECTING RULES:
- SUBJECT: establish the primary subject and preserve its visible identity and defining attributes.
- ENVIRONMENT: establish a coherent location, spatial layout, foreground, background, weather, and important objects only as relevant.
- ACTION: describe one primary action with a readable progression; secondary actions must support, not compete with, it.
- CAMERA: specify framing and movement only when useful; do not combine incompatible movements or angles.
- LIGHT: keep light direction, color, exposure, and reflections coherent throughout the shot.
- PHYSICS: preserve believable gravity, momentum, collisions, fluid motion, cloth, hair, smoke, and environmental interaction when present.
- TEMPORAL ORDER: events must happen in a clear order; use timestamps only when the user requests timed beats or a storyboard needs them.
- CONTINUITY: preserve identity, wardrobe, props, geography, screen direction, and lighting within a continuous shot.
- EDITING: one continuous take by default; use cuts or transitions only when multiple shots are explicitly requested.
- ENDING: finish the requested action naturally; do not append an unrelated event or a new scene.
- FIDELITY: preserve the user's idea and do not add decorative details that change its meaning.

PROMPT CONFLICT CHECK:
Resolve contradictions by prioritizing the user's explicit creative instructions, then the selected model's supported capabilities, then these general production rules.

[END CINEMATIC PRODUCTION RULES]`;
  },

  seriesBibleRules: `SERIES / FILM CONTINUITY BIBLE:
- Treat the supplied base context as the canonical visual bible for the project.
- Preserve recurring character identity, age appearance, face, hairstyle, wardrobe, accessories, and distinctive traits unless the script explicitly changes them.
- Preserve established locations, architecture, geography, color palette, lens language, lighting mood, and recurring props.
- Track each scene's starting state and ending state: character position, pose, gaze, prop placement, screen direction, time of day, and unresolved action.
- The next scene must follow the requested story logic. Continue an action seamlessly only when it is the same moment; otherwise use a motivated time or location transition.
- Do not repeat the previous scene's action, reset character positions without reason, or carry transient effects into a new scene.
- Keep each generated scene independently renderable while preserving the series-level visual identity.
- Do not change established facts or invent backstory, dialogue, characters, or props that conflict with the user's material.`,

  strip(prompt: string): string {
    if (!prompt || typeof prompt !== "string") return "";
    return prompt
      .replace(
        /\n*\[CINEMATIC PRODUCTION RULES\][\s\S]*?\[END CINEMATIC PRODUCTION RULES\]/g,
        ""
      )
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },
};
