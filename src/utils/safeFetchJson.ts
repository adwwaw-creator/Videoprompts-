import type { Language } from "../types/prompt";

export async function safeFetchJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit,
  lang: Language = "en"
): Promise<T> {
  const res = await fetch(input, init);
  const rawText = await res.text();
  const trimmed = rawText.trim();

  let parsed: (T & { error?: string }) | null = null;
  if (trimmed && !trimmed.startsWith("<")) {
    try {
      parsed = JSON.parse(trimmed) as T & { error?: string };
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    if (
      trimmed.startsWith("<") ||
      res.status === 502 ||
      res.status === 503 ||
      res.status === 504
    ) {
      throw new Error(
        lang === "ar"
          ? `انتهت مهلة الاتصال بالخادم أو يجري إعادة تشغيله حالياً (HTTP ${res.status}). يرجى المحاولة مرة أخرى بعد لحظات.`
          : lang === "fr"
            ? `Le serveur met trop de temps à répondre ou redémarre (HTTP ${res.status}). Veuillez réessayer dans quelques secondes.`
            : `Server timed out or is warming up (HTTP ${res.status}). Please retry in a few seconds.`
      );
    }
    throw new Error(
      lang === "ar"
        ? `استجابة غير صالحة من الخادم (HTTP ${res.status}).`
        : `Invalid response from server (HTTP ${res.status}).`
    );
  }

  if (!res.ok) {
    throw new Error(
      parsed.error ||
        (lang === "ar"
          ? `فشل الطلب (HTTP ${res.status}).`
          : `Request failed (HTTP ${res.status}).`)
    );
  }

  return parsed;
}
