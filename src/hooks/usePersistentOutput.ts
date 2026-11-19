import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

export const LAST_OUTPUT_STORAGE_KEY = "videoprompts_last_output_v1";

export function extractOutputParts(fullPrompt: string): {
  positiveOnly: string;
  negativeOnly: string;
} {
  const splitParts = fullPrompt.split("NEGATIVE PROMPT:");
  const rawBody = (splitParts[0] || "").trim();
  const positiveOnly = rawBody
    .split(/\n{2,}AUDIO & SOUND DESIGN:\n?/)[0]
    .trim();
  const negativeOnly = (splitParts[1] || "").trim();
  return { positiveOnly, negativeOnly };
}

function readStoredOutput(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/**
 * Persists `outputText` to localStorage whenever it changes and automatically
 * recovers the last saved prompt session on page refresh.
 */
export function usePersistentOutput(
  fallback: string | (() => string) = "",
  storageKey = LAST_OUTPUT_STORAGE_KEY
): [string, Dispatch<SetStateAction<string>>, () => void] {
  const [outputText, setOutputText] = useState<string>(() => {
    const saved = readStoredOutput(storageKey);
    if (saved !== null) {
      return saved;
    }
    return typeof fallback === "function" ? fallback() : fallback;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (outputText.trim().length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, outputText);
      }
    } catch {
      // Ignore storage quota or private-mode access errors
    }
  }, [outputText, storageKey]);

  const clearPersistedOutput = useCallback(() => {
    setOutputText("");
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage access errors
    }
  }, [storageKey]);

  return [outputText, setOutputText, clearPersistedOutput];
}
