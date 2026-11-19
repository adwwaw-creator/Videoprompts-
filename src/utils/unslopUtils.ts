export interface UnslopResult {
  cleaned: string;
  removedCount: number;
  wordsSaved: number;
  changed: boolean;
}

const SLOP_PHRASES: RegExp[] = [
  // Conversational LLM preambles / meta text
  /^(?:sure|certainly|here(?:'s| is)(?: your| the| an?)?(?: refined| enhanced| final)?(?: video| image)? prompt:?)\s*/gim,
  /^(?:prompt|video prompt|output|generated prompt):\s*/gim,

  // Multi-word LLM clichés and over-descriptive padding
  /\b(?:a\s+)?(?:visual\s+)?feast\s+for\s+the\s+eyes\b/gi,
  /\b(?:a\s+)?(?:delicate|mesmerizing|captivating|intricate)\s+(?:dance|interplay|tapestry|symphony)\s+of\b/gi,
  /\b(?:a\s+)?testament\s+to\b/gi,
  /\b(?:evoking|creating|conveying|exuding|radiating)\s+(?:a|an)\s+(?:deep\s+|profound\s+|palpable\s+)?(?:sense|aura|feeling|atmosphere)\s+of\b/gi,
  /\bbathed\s+in\s+(?:a|an)\s+(?:ethereal|otherworldly|magical|mesmerizing|dreamlike)\s+(?:glow|light|radiance)\b/gi,
  /\bin\s+a\s+world\s+where\b/gi,
  /\b(?:seamlessly|harmoniously|effortlessly)\s+(?:blending|merging|weaving|combining)\b/gi,
  /\b(?:adding|contributing)\s+to\s+the\s+overall\s+(?:atmosphere|mood|aesthetic|ambiance)\b/gi,
  /\benhancing\s+the\s+(?:overall\s+)?(?:mood|atmosphere|visual\s+appeal|drama)\b/gi,
  /\bcreating\s+a\s+(?:stunning|dramatic|breathtaking|cinematic|visually\s+striking)\s+(?:effect|contrast|spectacle|composition)\b/gi,
  /\bcapturing\s+the\s+(?:true\s+)?essence\s+of\b/gi,
  /\bcan\s+be\s+seen\b/gi,
  /\bis\s+clearly\s+visible\s+in\s+the\s+background\b/gi,
  /\bserves\s+as\s+(?:a|the)\s+(?:stunning\s+|dramatic\s+)?backdrop\b/gi,
  /\bwith\s+a\s+(?:subtle\s+)?touch\s+of\b/gi,
  /\b(?:meticulously|masterfully|exquisitely|intricately)\s+(?:crafted|rendered|detailed|designed|composed)\b/gi,
  /\b(?:visually\s+(?:arresting|striking|stunning|captivating))\b/gi,
  /\b(?:best|top|highest|insane|unbelievable)\s+(?:quality|detail)\b/gi,
  /\b(?:richly|hyper|ultra|insanely|incredibly|impossibly)\s*[- ]?\s*detailed\b/gi,
  /\baward[- ]winning\b/gi,

  // Standalone buzzword & filler adjectives
  /\b(?:breathtaking|awe[- ]inspiring|jaw[- ]dropping|mind[- ]blowing|soul[- ]stirring|heart[- ]stopping|earth[- ]shattering)\b/gi,
  /\b(?:stunning|magnificent|extraordinary|unbelievable|mesmerizing|captivating|enchanting|spellbinding|hypnotic|transcendent|otherworldly|ethereal|phantasmagoric)\b/gi,
  /\bmasterpiece\b/gi,

  // Empty filler adverbs
  /\b(?:truly|incredibly|extremely|remarkably|astonishingly|undeniably|effortlessly|masterfully|exquisitely|impeccably|vividly|basically|essentially|literally|really|very|quite)\b/gi,
];

const SCENE_GUARD_START_REGEX =
  /\n*(?=\[(?:WAN TEMPORAL CONTROL|MINIMAX SHOT CONTROL|UNIVERSAL VIDEO CONSISTENCY|SMART SCENE ISOLATION — STRICT MODE)\])/;

function cleanNarrativeSegment(segment: string): {
  text: string;
  removedCount: number;
} {
  if (!segment.trim()) {
    return { text: "", removedCount: 0 };
  }

  // Temporarily protect bracketed camera directives like [Push in], [Orbit], [Tracking shot]
  const protectedTags: string[] = [];
  let working = segment.replace(/\[[^\]]{1,48}\]/g, (match) => {
    const token = `__PROTECTED_TAG_${protectedTags.length}__`;
    protectedTags.push(match);
    return token;
  });

  // Remove markdown bold/italic wrappers without altering content
  working = working.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");

  let removedCount = 0;

  for (const regex of SLOP_PHRASES) {
    working = working.replace(regex, (matched) => {
      if (matched.trim()) removedCount += 1;
      return " ";
    });
  }

  // Remove consecutive duplicate words (case-insensitive), e.g., "the the" or "soft soft"
  working = working.replace(/\b([a-zA-Z]{2,})\s+\1\b/gi, (_m, word: string) => {
    removedCount += 1;
    return word;
  });

  // Clean line-by-line punctuation and capitalization artifacts while keeping structure
  const cleanedLines = working.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";

    // Preserve section label prefixes such as "SUBJECT:", "ENVIRONMENT:", "Shot 1:"
    const labelMatch = trimmed.match(/^([A-Z][A-Z0-9 &/_-]{1,32}:|Shot\s+\d+:)\s*(.*)$/);
    const prefix = labelMatch ? `${labelMatch[1]} ` : "";
    let body = labelMatch ? labelMatch[2] : trimmed;

    body = body
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([,.;:])\s*[,;]+/g, "$1")
      .replace(/,\s*\./g, ".")
      .replace(/\b(a|an|the|in|on|at|with|of|for|to|from|into|by|as)\s*,\s*/gi, "$1 ")
      .replace(/(__PROTECTED_TAG_\d+__)\s*,\s*/g, "$1 ")
      .replace(/\s*,\s*,+\s*/g, ", ")
      .replace(/^[,\s.;:-]+/, "")
      .replace(/[,\s]+$/, "")
      // Fix orphaned indefinite article spacing
      .replace(/\b([Aa])n?\s{2,}/g, "$1 ")
      // Fix "a" before vowel or "an" before consonant after adjective removal
      .replace(/\ba\s+([aeiouAEIOU][a-z])/g, "an $1")
      .replace(/\ban\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z])/g, (m, next: string) => {
        if (/^(honest|hour|honor|heir)/i.test(next)) return m;
        return `a ${next}`;
      })
      .replace(/\s{2,}/g, " ")
      .trim();

    if (body && /^[a-z]/.test(body) && !prefix.includes("Shot")) {
      // Capitalize start of standalone sentences/lines
      if (!prefix || prefix.endsWith(": ")) {
        body = body.charAt(0).toUpperCase() + body.slice(1);
      }
    }

    // Capitalize letters right after sentence-ending punctuation
    body = body.replace(/([.!?]\s+)([a-z])/g, (_m, p1: string, ch: string) => `${p1}${ch.toUpperCase()}`);

    return `${prefix}${body}`.trim();
  });

  let restored = cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Restore protected bracketed camera commands
  restored = restored.replace(/__PROTECTED_TAG_(\d+)__/g, (_m, idxStr: string) => {
    const idx = Number(idxStr);
    return protectedTags[idx] ?? "";
  });

  return { text: restored, removedCount };
}

export function cleanPromptWithUnslop(rawText: string): UnslopResult {
  const input = String(rawText || "");
  if (!input.trim()) {
    return { cleaned: "", removedCount: 0, wordsSaved: 0, changed: false };
  }

  // Separate NEGATIVE PROMPT block so negative constraints stay intact
  const negSplitIdx = input.indexOf("NEGATIVE PROMPT:");
  const headSection = negSplitIdx !== -1 ? input.slice(0, negSplitIdx).trimEnd() : input;
  const negSection = negSplitIdx !== -1 ? input.slice(negSplitIdx).trim() : "";

  // Separate SmartSceneGuard rules so scene isolation guard blocks stay intact
  const guardMatch = headSection.match(SCENE_GUARD_START_REGEX);
  const guardIdx = guardMatch?.index ?? -1;
  const narrativeAndAudio =
    guardIdx !== -1 ? headSection.slice(0, guardIdx).trimEnd() : headSection;
  const guardSection = guardIdx !== -1 ? headSection.slice(guardIdx).trim() : "";

  // Separate AUDIO & SOUND DESIGN section if present
  const audioMatch = narrativeAndAudio.match(/\n{2,}AUDIO & SOUND DESIGN:\n?/);
  const audioIdx = audioMatch?.index ?? -1;
  const mainBody =
    audioIdx !== -1 ? narrativeAndAudio.slice(0, audioIdx).trim() : narrativeAndAudio;
  const audioBody =
    audioIdx !== -1 && audioMatch
      ? narrativeAndAudio.slice(audioIdx + audioMatch[0].length).trim()
      : "";

  const cleanedMain = cleanNarrativeSegment(mainBody);
  const cleanedAudio = audioBody
    ? cleanNarrativeSegment(audioBody)
    : { text: "", removedCount: 0 };

  const rebuiltParts = [
    cleanedMain.text,
    cleanedAudio.text ? `AUDIO & SOUND DESIGN:\n${cleanedAudio.text}` : "",
    guardSection,
    negSection,
  ].filter(Boolean);

  const cleaned = rebuiltParts.join("\n\n").trim();

  const wordsBefore = input.trim().split(/\s+/).filter(Boolean).length;
  const wordsAfter = cleaned ? cleaned.split(/\s+/).filter(Boolean).length : 0;

  return {
    cleaned,
    removedCount: cleanedMain.removedCount + cleanedAudio.removedCount,
    wordsSaved: Math.max(0, wordsBefore - wordsAfter),
    changed: cleaned !== input.trim(),
  };
}

export function unslopPrompt(rawText: string): string {
  return cleanPromptWithUnslop(rawText).cleaned;
}
