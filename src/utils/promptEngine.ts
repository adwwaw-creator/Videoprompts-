import {
  AUDIO_DESIGN_TAGS,
  ENGINES,
  HAILUO_CAMERA_BRACKETS,
  PHYSICS_HINTS,
  WAN_VARIANTS,
} from "../data/engines";
import {
  EngineId,
  GenerationMode,
  ShotItem,
  StudioFormState,
  WanVariant,
} from "../types/prompt";
import {
  compileGoogleVeoFromStudio,
  GoogleVideoPromptResult,
} from "./googleVeoPrompt";
import { SmartSceneGuard } from "./smartSceneGuard";

const DEFAULT_SHOT_ROLES = [
  {
    role: "Establishing Wide / Reveal",
    camera: "Slow cinematic push-in",
    description: "Establish subject and atmospheric scale with smooth initial motion.",
  },
  {
    role: "Macro Texture & Detail",
    camera: "Extreme macro tracking glide",
    description: "Cut to close-up highlighting intricate material textures and light reflections.",
  },
  {
    role: "Dynamic Orbit / Action Peak",
    camera: "Smooth orbital arc movement",
    description: "Capture the peak physical motion from a dramatic angle with shallow depth of field.",
  },
  {
    role: "Hero Final Pose & Lighting",
    camera: "Locked-off hero frame with subtle pull-back",
    description: "Settle into the iconic final composition as rim light sweeps across the silhouette.",
  },
];

export function getExactFrameCount(
  engine: EngineId,
  durationSec: number,
  wanVariant: WanVariant = "a14b"
): number {
  if (engine === "wan22") {
    const variantSpec = WAN_VARIANTS[wanVariant];
    const match = variantSpec.durationOptions.find((d) => d.value === durationSec);
    if (match) return match.frames;
    return wanVariant === "ti2v_5b" ? 193 : 129;
  }
  if (engine === "minimax") {
    return durationSec <= 6 ? 151 : 251;
  }
  if (engine === "hunyuan") {
    return durationSec <= 5 ? 129 : 193;
  }
  if (engine === "ltx") {
    if (durationSec <= 4) return 97;
    if (durationSec <= 5) return 121;
    return 161;
  }
  if (engine === "veo") {
    return Math.max(24, Math.round((durationSec || 8) * 24));
  }
  return 1;
}

export function getEngineFps(engine: EngineId, wanVariant: WanVariant = "a14b"): number {
  if (engine === "wan22") {
    return WAN_VARIANTS[wanVariant].fps;
  }
  if (engine === "minimax") {
    return 25;
  }
  return 24;
}

export function buildDefaultShots(count: number, existing: ShotItem[] = []): ShotItem[] {
  const safeCount = Math.max(1, Math.min(4, count));
  const shots: ShotItem[] = [];
  for (let i = 0; i < safeCount; i++) {
    const template = DEFAULT_SHOT_ROLES[i] || DEFAULT_SHOT_ROLES[0];
    const prev = existing[i];
    shots.push({
      id: i + 1,
      role: template.role,
      camera: prev?.camera ?? "",
      description: prev?.description ?? "",
    });
  }
  return shots;
}

export function buildSmartNegative(
  engine: EngineId,
  mode: GenerationMode,
  category: string
): string {
  if (engine === "flux1" || engine === "minimax") {
    return "";
  }

  const baseVideo = [
    "blurry",
    "low resolution",
    "temporal flickering",
    "frame jitter",
    "morphing geometry",
    "inconsistent object volume",
    "deformed textures",
    "unwanted camera shake",
    "oversaturated neon artifacts",
    "plastic skin",
    "watermark",
    "text overlay",
    "subtitles",
    "MPEG compression blocks",
  ];

  const baseImage = [
    "lowres",
    "bad anatomy",
    "bad proportions",
    "extra fingers",
    "mutated hands",
    "blurry background",
    "plastic skin",
    "oversharpened",
    "chromatic aberration artifacts",
    "watermark",
    "signature",
    "text overlay",
    "JPEG artifacts",
  ];

  const byCategory: Record<string, string[]> = {
    "Luxury Product Advertisement": [
      "cheap plastic material",
      "dull specular highlights",
      "asymmetrical bottle",
    ],
    "Technology Commercial": [
      "melting ports",
      "warped screen bezels",
      "flickering LEDs",
    ],
    "Perfume Advertisement": [
      "cloudy glass",
      "distorted liquid refraction",
      "warped cap",
    ],
    "Automotive Commercial": [
      "oval wheels",
      "rubber car body",
      "warped road lines",
    ],
    "Fashion Editorial Film": [
      "extra fingers",
      "mutated hands",
      "garment clipping",
      "uncanny face",
    ],
    "Real Estate & Luxury Hospitality": [
      "warped architectural lines",
      "slanted walls",
      "unnatural water ripples",
    ],
    "Cyberpunk & Sci-Fi Cinema": [
      "flat lighting",
      "muddy shadows",
      "broken perspective",
    ],
    "Moroccan Architectural & Documentary": [
      "warped zellige geometry",
      "broken arches",
      "unnatural water waves",
    ],
    "Anime & Stylized Makoto Shinkai": [
      "3D CGI uncanny look",
      "muddy lineart",
      "inconsistent cel shading",
    ],
    "Food & Macro Beverage": [
      "unappetizing grey tones",
      "unnatural fluid gravity",
      "static steam",
    ],
    "Vocal & Music Performance": [
      "lip desync",
      "static mouth",
      "warped teeth",
      "uncanny eyes",
      "frozen expression",
    ],
    "Editorial Portrait Photography": [
      "airbrushed wax skin",
      "asymmetric eyes",
      "artificial studio glare",
    ],
  };

  const isVideo = ENGINES[engine].kind === "video";
  const base = isVideo ? baseVideo : baseImage;

  const modeExtra =
    mode === "i2v" || mode === "flf2v" || mode === "img2img" || mode === "s2v"
      ? ["identity drift", "subject redesign", "background hallucination", "sudden cut"]
      : ["empty background", "missing hero subject"];

  return [...base, ...(byCategory[category] || []), ...modeExtra].join(", ");
}

function cleanSegment(text: string): string {
  return (text || "").trim().replace(/[.,;\s]+$/, "");
}

function capitalizeFirst(text: string): string {
  const s = (text || "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function normalizeProse(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*,/g, ",")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

export interface CompiledPromptResult {
  fullPrompt: string;
  positiveOnly: string;
  negativeOnly: string;
  audioBlock: string;
  words: number;
  positiveWords: number;
  chars: number;
  tokens: number;
  veoMeta?: GoogleVideoPromptResult["meta"];
  veoSettings?: GoogleVideoPromptResult["settings"];
}

export function compileEnginePrompt(state: StudioFormState): CompiledPromptResult {
  if (state.engine === "veo") {
    const veoRes = compileGoogleVeoFromStudio(state);
    const guardEnabled = state.smartSceneGuard !== false;
    const finalVeoPrompt = guardEnabled
      ? SmartSceneGuard.apply(veoRes.prompt, SmartSceneGuard.resolveProvider(state.engine))
      : veoRes.prompt;
    const words = finalVeoPrompt.trim().split(/\s+/).filter(Boolean).length;
    const positiveWords = veoRes.prompt.trim().split(/\s+/).filter(Boolean).length;
    return {
      fullPrompt: finalVeoPrompt,
      positiveOnly: finalVeoPrompt,
      negativeOnly: state.negative.trim(),
      audioBlock: "",
      words,
      positiveWords,
      chars: finalVeoPrompt.length,
      tokens: Math.round(words * 1.32),
      veoMeta: {
        ...veoRes.meta,
        promptChars: finalVeoPrompt.length,
      },
      veoSettings: veoRes.settings,
    };
  }
  const spec = ENGINES[state.engine];
  const promptFormat = state.promptFormat || "official";
  const subject = cleanSegment(state.subject);
  const environment = cleanSegment(state.environment);
  const action = cleanSegment(state.action);
  const extra = cleanSegment(state.extra);
  const camera = cleanSegment(state.camera);
  const light = cleanSegment(state.light);
  const style = cleanSegment(state.style);
  const category = cleanSegment(state.category);
  const lora = state.loraTags.trim();
  const negative = spec.supportsNegative ? state.negative.trim() : "";

  const physicsPhrases = PHYSICS_HINTS.filter((h) =>
    state.physicsHints.includes(h.id)
  ).map((h) => h.phrase);
  const combinedMicro = [extra, ...physicsPhrases].filter(Boolean).join(", ");

  const audioPhrases = AUDIO_DESIGN_TAGS.filter((t) =>
    state.audioTags.includes(t.id)
  ).map((t) => t.phrase);
  const audioLine = [cleanSegment(state.audioDescription), ...audioPhrases]
    .filter(Boolean)
    .join("; ");
  const audioBlock =
    spec.kind === "video" && state.includeAudio && audioLine
      ? `AUDIO & SOUND DESIGN:\n${audioLine}.`
      : "";

  const motionDesc =
    state.motionScale <= 3
      ? "subtle, gentle physical movement"
      : state.motionScale <= 7
        ? "smooth, natural motion with realistic inertia"
        : "dynamic, high-energy cinematic motion";

  const exactFrames = getExactFrameCount(state.engine, state.duration, state.wanVariant);
  const fps = getEngineFps(state.engine, state.wanVariant);
  const hasShotContent = state.shots
    .slice(0, state.shotsCount)
    .some((s) => cleanSegment(s?.camera || "") || cleanSegment(s?.description || ""));
  const effectiveShotsCount =
    state.shotsCount > 1 && hasShotContent ? state.shotsCount : 1;

  const lead = [category ? `${capitalizeFirst(category)} style` : "", style]
    .filter(Boolean)
    .join(", ");
  const camSentence = camera ? `Camera: ${camera}.` : "";
  const lightSentence = light ? `Lighting: ${light}.` : "";
  const subjEnv = [capitalizeFirst(subject), environment].filter(Boolean).join(", ");

  let positive = "";

  if (promptFormat === "official") {
    if (state.engine === "wan22") {
      const microTail = combinedMicro ? ` ${capitalizeFirst(combinedMicro)}.` : "";

      if (state.mode === "i2v") {
        positive = [
          `Keeping the subject, composition and lighting of the reference image${subject ? ` (${subject})` : ""}${action ? `, ${action}` : ""}, ${motionDesc}.`,
          camSentence,
          lightSentence,
          microTail.trim(),
          lead ? `${lead}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      } else if (state.mode === "s2v") {
        positive = [
          `Audio-driven vocal performance keeping the character identity from the reference image${subject ? ` (${subject})` : ""}${environment ? `, set ${environment}` : ""}.`,
          `${action ? `${capitalizeFirst(action)}, ` : ""}synchronized lip-sync and facial micro-expressions, ${motionDesc}.`,
          camSentence,
          lightSentence,
          microTail.trim(),
          lead ? `${lead}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      } else if (state.mode === "flf2v") {
        positive = [
          `A seamless transition from the first frame to the last frame${subject ? `: ${subject}` : ""}.`,
          action ? `${capitalizeFirst(action)}, ${motionDesc}.` : `${capitalizeFirst(motionDesc)}.`,
          camSentence,
          lightSentence,
          microTail.trim(),
          lead ? `${lead}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      } else if (effectiveShotsCount <= 1) {
        positive = [
          lead ? `${lead}.` : "",
          subjEnv ? `${subjEnv}.` : "",
          action ? `${capitalizeFirst(action)}, ${motionDesc}.` : "",
          camSentence,
          lightSentence,
          microTail.trim(),
        ]
          .filter(Boolean)
          .join(" ");
      } else {
        const parts: string[] = [];
        for (let i = 0; i < effectiveShotsCount; i++) {
          const shot = state.shots[i];
          const shotCam = cleanSegment(shot?.camera || "") || camera;
          const shotDesc = cleanSegment(shot?.description || "");
          if (i === 0) {
            parts.push(
              [
                `Shot 1: ${subjEnv}.`,
                action ? `${capitalizeFirst(action)}, ${motionDesc}.` : "",
                shotDesc ? `${capitalizeFirst(shotDesc)}.` : "",
                shotCam ? `Camera: ${shotCam}.` : "",
              ]
                .filter(Boolean)
                .join(" ")
            );
          } else {
            parts.push(
              [
                `Cut to shot ${i + 1}: ${shotDesc ? `${capitalizeFirst(shotDesc)}.` : ""}`,
                shotCam ? `Camera: ${shotCam}.` : "",
              ]
                .filter(Boolean)
                .join(" ")
            );
          }
        }
        positive = [
          lead ? `${lead}.` : "",
          parts.join(" "),
          light ? `Consistent lighting across all shots: ${light}.` : "",
          microTail.trim(),
        ]
          .filter(Boolean)
          .join(" ");
      }
      if (lora) positive = `${lora} ${positive}`;
      positive = normalizeProse(positive);
    } else if (state.engine === "minimax") {
      const customCmds = (state.minimaxCameraCommands || []).filter(Boolean).slice(0, 3);
      const bracketCam =
        customCmds.length > 0
          ? `[${customCmds.join(", ")}]`
          : HAILUO_CAMERA_BRACKETS[state.cameraMovement] ||
            (camera ? `[${camera}]` : "");
      const customDirective = cleanSegment(state.minimaxCustomDirective || "");
      const modePrefix =
        state.mode === "i2v"
          ? "Preserving the exact subject identity and lighting of the first reference frame, "
          : state.mode === "flf2v"
            ? "Smoothly bridging from the first reference frame to the target last frame, "
            : "";
      const sequenceLine =
        effectiveShotsCount > 1
          ? state.shots
              .slice(0, effectiveShotsCount)
              .map((s, idx) => {
                const sCam = cleanSegment(s.camera) || camera;
                const sDesc = cleanSegment(s.description) || action;
                return idx === 0
                  ? `${capitalizeFirst(action || sDesc)}`
                  : `then ${sDesc}${sCam ? ` (${sCam})` : ""}`;
              })
              .filter(Boolean)
              .join(", ")
          : action
            ? `${capitalizeFirst(action)}`
            : "";
      const tailDetails = [customDirective, combinedMicro].filter(Boolean).join(", ");
      positive = normalizeProse(
        [
          `${bracketCam ? `${bracketCam} ` : ""}${modePrefix}${subjEnv}.`,
          sequenceLine ? `${sequenceLine}, ${motionDesc}.` : "",
          camera ? `${camera}.` : "",
          light ? `${light}.` : "",
          style ? `${style}.` : "",
          tailDetails ? `${capitalizeFirst(tailDetails)}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } else if (state.engine === "hunyuan") {
      const prefix =
        state.mode === "i2v"
          ? "Anchored to the reference frame, preserving subject identity and scene lighting, "
          : "";
      const seq =
        effectiveShotsCount > 1
          ? state.shots
              .slice(0, effectiveShotsCount)
              .map((s, idx) => {
                const sCam = cleanSegment(s.camera) || camera;
                const sDesc = cleanSegment(s.description) || action;
                const body = idx === 0 ? capitalizeFirst(action || sDesc) : sDesc;
                return sCam ? `${body} (${sCam})` : body;
              })
              .filter(Boolean)
              .join(", transitioning to ")
          : [action, camera ? `Camera: ${camera}` : ""].filter(Boolean).join(". ");
      positive = normalizeProse(
        [
          lora,
          `${prefix}${[capitalizeFirst(category), style].filter(Boolean).join(", ")}${category || style ? "." : ""}`,
          subject
            ? `${capitalizeFirst(subject)}${environment ? ` set in ${environment}` : ""}.`
            : environment
              ? `${capitalizeFirst(environment)}.`
              : "",
          seq ? `${capitalizeFirst(seq)}, ${motionDesc}.` : "",
          lightSentence,
          combinedMicro ? `${capitalizeFirst(combinedMicro)}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } else if (state.engine === "ltx") {
      const modeIntro =
        state.mode === "i2v"
          ? "Animate the reference image smoothly while preserving exact composition."
          : state.mode === "flf2v"
            ? "Smoothly interpolate motion between the first frame and last frame."
            : "";
      positive = normalizeProse(
        [
          modeIntro,
          camera ? `${camera}.` : "",
          subject
            ? `${capitalizeFirst(subject)}${environment ? ` in ${environment}` : ""}.`
            : environment
              ? `${capitalizeFirst(environment)}.`
              : "",
          action ? `${capitalizeFirst(action)}, ${motionDesc}.` : "",
          light ? `${light}.` : "",
          style ? `${style}.` : "",
          combinedMicro ? `${capitalizeFirst(combinedMicro)}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } else if (state.engine === "flux1") {
      const parts: string[] = [];
      if (lora) parts.push(lora);
      if (category) parts.push(`${category} photograph.`);
      if (subjEnv) parts.push(`${subjEnv}.`);
      if (action) parts.push(`${capitalizeFirst(action)}.`);
      if (camera) parts.push(`Framed with ${camera}.`);
      if (light) parts.push(`Illuminated by ${light}.`);
      if (style) parts.push(`${style}.`);
      if (combinedMicro) parts.push(`Fine material and optical details: ${combinedMicro}.`);
      positive = normalizeProse(parts.join(" "));
    } else {
      const tags: string[] = [];
      if (lora) tags.push(lora);
      tags.push("masterpiece", "best quality", "highly detailed");
      if (subject) tags.push(`(${subject}:1.2)`);
      if (environment) tags.push(environment);
      if (action) tags.push(`(${action}:1.1)`);
      if (camera) tags.push(camera);
      if (light) tags.push(light);
      if (style) tags.push(style);
      if (combinedMicro) tags.push(combinedMicro);
      positive = tags.filter(Boolean).join(", ");
    }
  } else {
    // Structured studio production brief format
    if (state.engine === "wan22") {
      const variantLabel = state.wanVariant === "ti2v_5b" ? "WAN 2.2 TI2V-5B" : "WAN 2.2 A14B";
      positive += `[${variantLabel} · ${state.aspect} · ${state.duration}s (${exactFrames} frames @ ${fps}fps) · Seed ${state.seed}]\n`;
      if (style || category) {
        positive += `${[style, category].filter(Boolean).join(". ")}.\n\n`;
      }

      if (state.mode === "t2v") {
        positive += `HERO SUBJECT & SCENE ARCHITECTURE:\n`;
        positive += `${[subject, environment ? `Set within ${environment}` : ""].filter(Boolean).join(". ")}.\n`;
        if (light || combinedMicro) {
          positive += `${light ? `Lighting & Atmosphere: ${light}.` : ""}${combinedMicro ? ` Micro-physics: ${combinedMicro}.` : ""}\n\n`;
        } else {
          positive += `\n`;
        }
      } else if (state.mode === "i2v") {
        positive += `IMAGE-TO-VIDEO CONTINUITY LOCK:\n`;
        positive += `Anchor strictly to the input reference frame. Preserve exact subject geometry, surface shaders, facial/product identity, and lighting direction.${subject ? ` Subject focus: ${subject}.` : ""}\n\n`;
      } else if (state.mode === "s2v") {
        positive += `AUDIO-DRIVEN SPEECH / VOCAL PERFORMANCE (Wan2.2-S2V-14B):\n`;
        positive += `Synchronize lip articulation, jaw cadence, and emotional facial expressions directly to the reference audio stem while preserving character identity.${subject ? ` Performer: ${subject}.` : ""}\n\n`;
      } else {
        positive += `FIRST-TO-LAST FRAME TEMPORAL BRIDGE:\n`;
        positive += `Interpolate seamlessly from the starting reference frame to the target end frame with coherent 3D spatial transformation.${subject ? ` ${subject}.` : ""}\n\n`;
      }

      if (effectiveShotsCount <= 1) {
        positive += `CONTINUOUS TEMPORAL SEQUENCE (0.0s - ${state.duration}.0s):\n`;
        if (action) positive += `Action: ${action}.\n`;
        positive += `${camera ? `Cinematography: ${camera}. ` : ""}Motion dynamics (${state.motionScale}/10): ${motionDesc}.\n`;
        if (light || combinedMicro) {
          positive += `${light ? `Lighting behavior: ${light}.` : ""}${combinedMicro ? ` ${combinedMicro}.` : ""}\n\n`;
        } else {
          positive += `\n`;
        }
      } else {
        positive += `MULTI-SHOT STORYBOARD BREAKDOWN (${effectiveShotsCount} Cuts across ${state.duration}s):\n`;
        const seg = state.duration / effectiveShotsCount;
        for (let i = 0; i < effectiveShotsCount; i++) {
          const s = (i * seg).toFixed(1);
          const e = ((i + 1) * seg).toFixed(1);
          const shot = state.shots[i];
          const customCam = cleanSegment(shot?.camera || "") || camera;
          const customDesc = cleanSegment(shot?.description || "") || action;
          positive += `• SHOT ${i + 1} [${s}s - ${e}s]: `;
          if (i === 0) {
            positive += `${[action, customDesc, camera ? `Camera: ${camera}` : ""].filter(Boolean).join(". ")}.\n`;
          } else {
            positive += `${[customDesc, customCam ? `Camera: ${customCam}` : ""].filter(Boolean).join(". ")}.\n`;
          }
        }
        if (light || combinedMicro) {
          positive += `${light ? `Global Lighting & Micro-Physics: Maintain ${light} across all cuts.` : "Micro-Physics:"}${combinedMicro ? ` ${combinedMicro}.` : ""}\n\n`;
        } else {
          positive += `\n`;
        }
      }

      positive += `MOTION & TEMPORAL QUALITY:\n`;
      positive += `${capitalizeFirst(motionDesc)}, natural acceleration and deceleration curves, consistent 3D volume, zero temporal flickering, realistic depth of field.`;
    } else if (state.engine === "minimax") {
      const customCmds = (state.minimaxCameraCommands || []).filter(Boolean).slice(0, 3);
      const bracketCam =
        customCmds.length > 0
          ? `[${customCmds.join(", ")}]`
          : HAILUO_CAMERA_BRACKETS[state.cameraMovement] ||
            (camera ? `[${camera}]` : "");
      const resLabel = state.minimaxResolution || (state.aspect.includes("1080p") ? "1080P" : "768P");
      const customDirective = cleanSegment(state.minimaxCustomDirective || "");
      positive += `[MINIMAX HAILUO 02 · ${resLabel} · ${state.duration}s (${exactFrames} frames @ 25fps) · Optimizer ${state.minimaxPromptOptimizer ? "ON" : "OFF"}]\n`;
      if (bracketCam || camera) {
        positive += `Camera Directive: ${[bracketCam, camera ? `(${camera})` : ""].filter(Boolean).join(" ")}\n`;
      }
      if (subjEnv) {
        positive += `Subject & Environment: ${subjEnv}.\n`;
      }
      if (state.mode === "i2v") {
        positive += `First-Frame Anchor: Maintain exact visual continuity from the uploaded first frame.\n`;
      } else if (state.mode === "flf2v") {
        positive += `First-Last-Frame Bridge: Transition coherently between the uploaded first and last frames.\n`;
      }
      if (effectiveShotsCount > 1) {
        positive += `Temporal Beats:\n`;
        for (let i = 0; i < effectiveShotsCount; i++) {
          const shot = state.shots[i];
          const sCam = cleanSegment(shot?.camera || "") || camera;
          const sDesc = cleanSegment(shot?.description || "") || action;
          positive += `• Beat ${i + 1}: ${i === 0 ? action || sDesc : sDesc}${sCam ? ` [${sCam}]` : ""}\n`;
        }
      } else if (action) {
        positive += `Physical Motion: ${action}, ${motionDesc}.\n`;
      }
      if (customDirective) {
        positive += `Hailuo Physics & Nuance: ${customDirective}.\n`;
      }
      if (light || style || combinedMicro) {
        positive += `Lighting & Grade: ${[light, style, combinedMicro].filter(Boolean).join(". ")}.`;
      }
    } else if (state.engine === "hunyuan") {
      positive += `[HUNYUANVIDEO · ${state.aspect} · ${state.duration}s (${exactFrames} frames) · Guidance ${state.cfgScale} · Seed ${state.seed}]\n`;
      if (category || style) {
        positive += `${[category, style ? `captured in ${style}` : ""].filter(Boolean).join(", ")}. `;
      }
      if (state.mode === "i2v") {
        positive += `Anchored directly to the reference frame, maintaining subject identity and background continuity. `;
      }
      positive += `${subject}${environment ? ` positioned within ${environment}` : ""}.\n\n`;

      if (effectiveShotsCount > 1) {
        const seg = state.duration / effectiveShotsCount;
        positive += `Sequence Progression:\n`;
        for (let i = 0; i < effectiveShotsCount; i++) {
          const s = (i * seg).toFixed(1);
          const e = ((i + 1) * seg).toFixed(1);
          const shot = state.shots[i];
          const sCam = cleanSegment(shot?.camera || "") || camera;
          const sDesc = cleanSegment(shot?.description || "") || action;
          positive += `Segment ${i + 1} (${s}s-${e}s): ${i === 0 ? action || sDesc : sDesc}${sCam ? ` Captured with ${sCam}` : ""}.\n`;
        }
        positive += "\n";
      } else if (action || camera) {
        positive += `${action ? `Temporal Action: ${action}. ` : ""}${camera ? `Camera Trajectory: ${camera}.` : ""}\n\n`;
      }

      positive += `Lighting & Physics: ${[light, motionDesc].filter(Boolean).join(". ")}.${combinedMicro ? ` Physical nuances: ${combinedMicro}.` : ""}`;
    } else if (state.engine === "ltx") {
      positive += `[LTX-VIDEO 0.9.5 · ${state.aspect} · ${state.duration}s (${exactFrames} frames) · CFG ${state.cfgScale} · Seed ${state.seed}]\n`;
      if (state.mode === "i2v") {
        positive += `Animate the reference image smoothly while preserving exact composition. `;
      } else if (state.mode === "flf2v") {
        positive += `Smoothly interpolate motion between start frame and end frame. `;
      }
      positive += [
        camera ? `${camera}.` : "",
        `${subject}${environment ? ` in ${environment}` : ""}.`,
        action ? `${action}.` : "",
        light ? `${light}.` : "",
        style ? `${style}.` : "",
        combinedMicro ? `${combinedMicro}.` : "",
        `${motionDesc}.`,
      ]
        .filter(Boolean)
        .join(" ");
    } else if (state.engine === "flux1") {
      const parts: string[] = [];
      if (lora) parts.push(lora);
      if (category) parts.push(`${category} photograph.`);
      if (subjEnv) parts.push(`${subjEnv}.`);
      if (action) parts.push(`${action}.`);
      if (camera) parts.push(`Framed with ${camera}.`);
      if (light) parts.push(`Illuminated by ${light}.`);
      if (style) parts.push(`${style}.`);
      if (combinedMicro) parts.push(`Fine material and optical details: ${combinedMicro}.`);
      positive = parts.join(" ");
    } else {
      const tags: string[] = [];
      if (lora) tags.push(lora);
      tags.push("masterpiece", "best quality", "highly detailed");
      if (subject) tags.push(`(${subject}:1.2)`);
      if (environment) tags.push(environment);
      if (action) tags.push(`(${action}:1.1)`);
      if (camera) tags.push(camera);
      if (light) tags.push(light);
      if (style) tags.push(style);
      if (combinedMicro) tags.push(combinedMicro);
      positive = `[SDXL · ${state.aspect} · CFG ${state.cfgScale} · ${state.steps} Steps · Seed ${state.seed}]\n${tags.filter(Boolean).join(", ")}`;
    }
  }

  const basePositive = positive.trim();
  const guardEnabled = spec.kind === "video" && state.smartSceneGuard !== false;
  const positiveOnly =
    guardEnabled && basePositive
      ? SmartSceneGuard.apply(basePositive, SmartSceneGuard.resolveProvider(state.engine))
      : basePositive;
  const sections = [positiveOnly];
  if (audioBlock) sections.push(audioBlock);
  if (spec.supportsNegative && negative) sections.push(`NEGATIVE PROMPT:\n${negative}`);
  const fullPrompt = sections.join("\n\n");

  const words = fullPrompt.trim().split(/\s+/).filter(Boolean).length;
  const positiveWords = basePositive
    ? basePositive.split(/\s+/).filter(Boolean).length
    : 0;
  return {
    fullPrompt,
    positiveOnly,
    negativeOnly: negative,
    audioBlock,
    words,
    positiveWords,
    chars: fullPrompt.length,
    tokens: Math.round(words * 1.32),
  };
}

export function buildComfyExportPayload(
  state: StudioFormState,
  positiveOnly: string,
  negativeOnly: string
) {
  const spec = ENGINES[state.engine];
  const resMatch = state.aspect.match(/\((\d+)x(\d+)\)/);
  const width = resMatch ? Number(resMatch[1]) : 1280;
  const height = resMatch ? Number(resMatch[2]) : 720;
  const numFrames = getExactFrameCount(state.engine, state.duration, state.wanVariant);
  const fps = getEngineFps(state.engine, state.wanVariant);

  return {
    generator: "VideoPrompts Studio",
    timestamp: new Date().toISOString(),
    target_tool: {
      id: spec.id,
      name: spec.name,
      ...(state.engine === "wan22"
        ? {
            variant: state.wanVariant,
            checkpoint:
              state.mode === "s2v"
                ? "Wan-AI/Wan2.2-S2V-14B"
                : WAN_VARIANTS[state.wanVariant].modelRepo,
          }
        : state.engine === "minimax"
          ? {
              model: "MiniMax-Hailuo-02",
              resolution: state.minimaxResolution || (state.aspect.includes("1080p") ? "1080P" : "768P"),
              prompt_optimizer: Boolean(state.minimaxPromptOptimizer),
              camera_commands: state.minimaxCameraCommands || [],
            }
          : state.engine === "veo"
            ? {
                model:
                  state.veoModel === "veo-3.1-fast"
                    ? "veo-3.1-fast-generate-preview"
                    : "veo-3.1-generate-preview",
                resolution: state.veoResolution || "1080p",
                audio: Boolean(state.includeAudio),
                detail: state.veoDetail || "professional",
                language: state.veoLanguage || "English",
              }
            : {}),
      vendor: spec.vendor,
      encoder: spec.encoder,
      kind: spec.kind,
    },
    engine_params: {
      mode: state.mode,
      aspect_ratio: state.aspect,
      width,
      height,
      ...(spec.kind === "video"
        ? {
            duration_sec: state.duration,
            fps,
            num_frames: numFrames,
            motion_scale: state.motionScale,
            shots_count: state.shotsCount,
          }
        : {}),
      cfg_scale: state.cfgScale,
      steps: state.steps,
      seed: state.seed,
      seed_locked: state.seedLocked,
    },
    prompts: {
      positive: positiveOnly,
      ...(spec.supportsNegative ? { negative: negativeOnly } : {}),
      ...(spec.kind === "video" && state.includeAudio
        ? {
            audio_design: [
              state.audioDescription.trim(),
              ...AUDIO_DESIGN_TAGS.filter((t) =>
                state.audioTags.includes(t.id)
              ).map((t) => t.phrase),
            ]
              .filter(Boolean)
              .join("; "),
          }
        : {}),
    },
  };
}

export function buildPythonPipelineScript(
  state: StudioFormState,
  positiveOnly: string,
  negativeOnly: string
): string {
  const spec = ENGINES[state.engine];
  const resMatch = state.aspect.match(/\((\d+)x(\d+)\)/);
  const width = resMatch ? Number(resMatch[1]) : 1280;
  const height = resMatch ? Number(resMatch[2]) : 720;
  const numFrames = getExactFrameCount(state.engine, state.duration, state.wanVariant);
  const fps = getEngineFps(state.engine, state.wanVariant);

  const safePos = JSON.stringify(positiveOnly);
  const safeNeg = JSON.stringify(negativeOnly);

  if (state.engine === "wan22") {
    const modelId =
      state.mode === "s2v"
        ? "Wan-AI/Wan2.2-S2V-14B"
        : state.wanVariant === "ti2v_5b"
          ? "Wan-AI/Wan2.2-TI2V-5B-Diffusers"
          : state.mode === "i2v"
            ? "Wan-AI/Wan2.2-I2V-A14B-Diffusers"
            : "Wan-AI/Wan2.2-T2V-A14B-Diffusers";
    return `import torch
from diffusers import WanPipeline
from diffusers.utils import export_to_video

# Variant: ${WAN_VARIANTS[state.wanVariant].name}
pipe = WanPipeline.from_pretrained("${modelId}", torch_dtype=torch.bfloat16)
pipe.to("cuda")

generator = torch.Generator(device="cuda").manual_seed(${state.seed})

prompt = ${safePos}
negative_prompt = ${safeNeg}

frames = pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    height=${height},
    width=${width},
    num_frames=${numFrames},
    guidance_scale=${state.cfgScale.toFixed(1)},
    num_inference_steps=${state.steps},
    generator=generator,
).frames[0]

export_to_video(frames, "wan22_${state.wanVariant}_${state.seed}.mp4", fps=${fps})
`;
  }

  if (state.engine === "minimax") {
    const resolution =
      state.duration >= 10
        ? "768P"
        : state.minimaxResolution || (state.aspect.includes("1080p") ? "1080P" : "768P");
    const firstFrameLine =
      state.mode === "i2v" || state.mode === "flf2v"
        ? `    "first_frame_image": "path/to/first_frame.jpg",\n`
        : "";
    const lastFrameLine =
      state.mode === "flf2v"
        ? `    "last_frame_image": "path/to/last_frame.jpg",\n`
        : "";
    return `import os
import requests

# MiniMax Hailuo 02 Video Generation API (${state.mode.toUpperCase()})
API_KEY = os.environ["MINIMAX_API_KEY"]

payload = {
    "model": "MiniMax-Hailuo-02",
    "prompt": ${safePos},
    "duration": ${state.duration},
    "resolution": "${resolution}",
    "prompt_optimizer": ${state.minimaxPromptOptimizer ? "True" : "False"},
${firstFrameLine}${lastFrameLine}}

response = requests.post(
    "https://api.minimax.io/v1/video_generation",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json=payload,
    timeout=60,
)
print(response.json())
`;
  }

  if (state.engine === "veo") {
    const veoModelId =
      state.veoModel === "veo-3.1-fast"
        ? "veo-3.1-fast-generate-preview"
        : "veo-3.1-generate-preview";
    const veoRes = state.veoResolution || "1080p";
    const veoAspect = state.aspect.includes("9:16") ? "9:16" : "16:9";
    const veoDuration =
      state.duration === 4 || state.duration === 6 || state.duration === 8
        ? state.duration
        : 8;
    return `from google import genai
from google.genai import types

# Google Veo 3.1 SDK (${veoModelId})
client = genai.Client()

prompt = ${safePos}
negative_prompt = ${safeNeg}

operation = client.models.generate_videos(
    model="${veoModelId}",
    prompt=prompt,
    config=types.GenerateVideosConfig(
        aspect_ratio="${veoAspect}",
        resolution="${veoRes}",
        duration_seconds=${veoDuration},
        negative_prompt=negative_prompt or None,
    ),
)
print("Started Veo generation:", operation.name)
`;
  }

  if (state.engine === "hunyuan") {
    return `import torch
from diffusers import HunyuanVideoPipeline
from diffusers.utils import export_to_video

pipe = HunyuanVideoPipeline.from_pretrained("hunyuanvideo-community/HunyuanVideo", torch_dtype=torch.bfloat16)
pipe.vae.enable_tiling()
pipe.to("cuda")

generator = torch.Generator(device="cuda").manual_seed(${state.seed})

prompt = ${safePos}

frames = pipe(
    prompt=prompt,
    height=${height},
    width=${width},
    num_frames=${numFrames},
    num_inference_steps=${state.steps},
    generator=generator,
).frames[0]

export_to_video(frames, "hunyuan_output_${state.seed}.mp4", fps=24)
`;
  }

  if (state.engine === "ltx") {
    return `import torch
from diffusers import LTXPipeline
from diffusers.utils import export_to_video

pipe = LTXPipeline.from_pretrained("Lightricks/LTX-Video-0.9.5", torch_dtype=torch.bfloat16)
pipe.to("cuda")

generator = torch.Generator(device="cuda").manual_seed(${state.seed})

prompt = ${safePos}
negative_prompt = ${safeNeg}

frames = pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    width=${width},
    height=${height},
    num_frames=${numFrames},
    guidance_scale=${state.cfgScale.toFixed(1)},
    num_inference_steps=${state.steps},
    generator=generator,
).frames[0]

export_to_video(frames, "ltx_output_${state.seed}.mp4", fps=24)
`;
  }

  if (state.engine === "flux1") {
    return `import torch
from diffusers import FluxPipeline

pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.bfloat16)
pipe.enable_model_cpu_offload()

generator = torch.Generator("cpu").manual_seed(${state.seed})

prompt = ${safePos}

image = pipe(
    prompt=prompt,
    height=${height},
    width=${width},
    guidance_scale=${state.cfgScale.toFixed(1)},
    num_inference_steps=${state.steps},
    max_sequence_length=512,
    generator=generator,
).images[0]

image.save("flux1_output_${state.seed}.png")
`;
  }

  return `import torch
from diffusers import StableDiffusionXLPipeline

pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16",
    use_safetensors=True,
)
pipe.to("cuda")

generator = torch.Generator(device="cuda").manual_seed(${state.seed})

prompt = ${safePos}
negative_prompt = ${safeNeg}

image = pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    height=${height},
    width=${width},
    guidance_scale=${state.cfgScale.toFixed(1)},
    num_inference_steps=${state.steps},
    generator=generator,
).images[0]

image.save("${spec.id}_output_${state.seed}.png")
`;
}
