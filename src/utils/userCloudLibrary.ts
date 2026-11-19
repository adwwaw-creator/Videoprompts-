import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  EngineId,
  GenerationMode,
  HistoryEntry,
  SavedSequenceEntry,
  VideoGeneratorLang,
  VideoGeneratorMode,
  VideoGeneratorModel,
  VideoGeneratorScene,
} from "../types/prompt";

const VALID_ENGINES = new Set<EngineId>([
  "wan22",
  "minimax",
  "veo",
  "hunyuan",
  "ltx",
  "flux1",
  "sdxl",
]);

const VALID_MODES = new Set<GenerationMode>([
  "t2v",
  "i2v",
  "flf2v",
  "s2v",
  "film",
  "t2i",
  "img2img",
]);

const VALID_SOURCES = new Set<"studio" | "generator_v1" | "director_v2">([
  "studio",
  "generator_v1",
  "director_v2",
]);

const VALID_SEQ_MODELS = new Set<VideoGeneratorModel>([
  "wan",
  "minimax",
  "google",
]);

const VALID_SEQ_MODES = new Set<VideoGeneratorMode>([
  "normal",
  "film",
  "film_10",
]);

const VALID_SEQ_LANGS = new Set<VideoGeneratorLang>(["ar", "en"]);

// Deduplicate concurrent profile upserts per UID to prevent double-create races
const inFlightProfileUpserts = new Map<string, Promise<void>>();

export function sanitizeDocId(raw: string, prefix = "item"): string {
  const cleaned = String(raw || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
  if (cleaned.length >= 1) return cleaned;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clip(value: string | undefined | null, maxLen: number): string {
  return String(value ?? "").trim().slice(0, maxLen);
}

function clipNonEmpty(
  value: string | undefined | null,
  fallback: string,
  maxLen: number
): string {
  const cleaned = clip(value, maxLen);
  return cleaned.length > 0 ? cleaned : fallback.slice(0, maxLen);
}

function toEpochMs(value: unknown, fallback: number): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.uid || !user.emailVerified || !user.email) return;
  const uid = sanitizeDocId(user.uid, "user");
  const existingPromise = inFlightProfileUpserts.get(uid);
  if (existingPromise) {
    return existingPromise;
  }

  const path = `users/${uid}`;
  const ref = doc(db, "users", uid);
  const displayName = clip(
    user.displayName || user.email.split("@")[0] || "User",
    120
  );
  const email = clip(user.email, 200);
  const photoURL = clip(user.photoURL || "", 500);

  const task = (async () => {
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) {
          tx.update(ref, {
            displayName,
            email,
            photoURL,
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.set(ref, {
            uid,
            displayName,
            email,
            photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      inFlightProfileUpserts.delete(uid);
    }
  })();

  inFlightProfileUpserts.set(uid, task);
  return task;
}

export function subscribeUserPrompts(
  uid: string,
  onData: (entries: HistoryEntry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const safeUid = sanitizeDocId(uid, "user");
  const path = `users/${safeUid}/prompts`;
  const q = query(
    collection(db, "users", safeUid, "prompts"),
    where("uid", "==", safeUid),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: HistoryEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const ts = toEpochMs(data.updatedAt ?? data.createdAt, Date.now());
        const engineRaw = String(data.engine || "wan22") as EngineId;
        const modeRaw = String(data.mode || "t2v") as GenerationMode;
        const sourceRaw = String(data.source || "studio") as
          | "studio"
          | "generator_v1"
          | "director_v2";

        return {
          id: docSnap.id,
          engine: VALID_ENGINES.has(engineRaw) ? engineRaw : "wan22",
          mode: VALID_MODES.has(modeRaw) ? modeRaw : "t2v",
          category: String(data.category || "cinematic"),
          shotsCount:
            typeof data.shotsCount === "number" && data.shotsCount >= 1
              ? Math.round(data.shotsCount)
              : 1,
          title: String(data.title || "Saved Prompt"),
          time: new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: ts,
          isFavorite: Boolean(data.isFavorite),
          prompt: String(data.prompt || ""),
          positiveOnly: String(data.positiveOnly || data.prompt || ""),
          negativeOnly: String(data.negativeOnly || ""),
          source: VALID_SOURCES.has(sourceRaw) ? sourceRaw : "studio",
        };
      });

      items.sort((a, b) => b.timestamp - a.timestamp);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export function subscribeUserSequences(
  uid: string,
  onData: (sequences: SavedSequenceEntry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const safeUid = sanitizeDocId(uid, "user");
  const path = `users/${safeUid}/sequences`;
  const q = query(
    collection(db, "users", safeUid, "sequences"),
    where("uid", "==", safeUid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedSequenceEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const ts = toEpochMs(data.updatedAt ?? data.createdAt, Date.now());
        const modelRaw = String(data.model || "wan") as VideoGeneratorModel;
        const modeRaw = String(data.mode || "film_10") as VideoGeneratorMode;
        const langRaw = String(data.lang || "en") as VideoGeneratorLang;
        const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
        const scenes: VideoGeneratorScene[] = rawScenes
          .slice(0, 30)
          .map((sc: Record<string, unknown>, idx: number) => ({
            sceneNumber:
              typeof sc?.sceneNumber === "number"
                ? Math.round(sc.sceneNumber)
                : idx + 1,
            narrativeBeat: String(sc?.narrativeBeat || `Scene ${idx + 1}`),
            prompt: String(sc?.prompt || ""),
          }));

        const notesRaw =
          data.consistencyNotes && typeof data.consistencyNotes === "object"
            ? (data.consistencyNotes as Record<string, unknown>)
            : null;
        const hasNotes =
          notesRaw &&
          (String(notesRaw.character || "").trim() ||
            String(notesRaw.palette || "").trim() ||
            String(notesRaw.lens || "").trim());

        return {
          id: docSnap.id,
          title: String(data.title || "Saved Sequence"),
          idea: String(data.idea || ""),
          model: VALID_SEQ_MODELS.has(modelRaw) ? modelRaw : "wan",
          mode: VALID_SEQ_MODES.has(modeRaw) ? modeRaw : "film_10",
          style: String(data.style || "cinematic"),
          lang: VALID_SEQ_LANGS.has(langRaw) ? langRaw : "en",
          shotLen:
            typeof data.shotLen === "number" && data.shotLen >= 1
              ? Math.round(data.shotLen)
              : 6,
          scenes,
          consistencyNotes: hasNotes
            ? {
                character: String(notesRaw?.character || ""),
                palette: String(notesRaw?.palette || ""),
                lens: String(notesRaw?.lens || ""),
              }
            : null,
          formattedOutput: String(data.formattedOutput || ""),
          createdAt: ts,
          isFavorite: Boolean(data.isFavorite),
        };
      });

      items.sort((a, b) => b.createdAt - a.createdAt);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function savePromptToCloud(
  uid: string,
  entry: HistoryEntry
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(entry.id, "prompt");
  const path = `users/${safeUid}/prompts/${safeId}`;
  const ref = doc(db, "users", safeUid, "prompts", safeId);

  const engine: EngineId = VALID_ENGINES.has(entry.engine)
    ? entry.engine
    : "wan22";
  const mode: GenerationMode = VALID_MODES.has(entry.mode) ? entry.mode : "t2v";
  const source: "studio" | "generator_v1" | "director_v2" =
    entry.source && VALID_SOURCES.has(entry.source) ? entry.source : "studio";
  const shotsCount = Math.max(
    1,
    Math.min(60, Math.round(entry.shotsCount || 1))
  );
  const title = clipNonEmpty(entry.title, "Untitled Prompt", 200);
  const prompt = clipNonEmpty(entry.prompt, title, 20000);
  const positiveOnly = clip(entry.positiveOnly || prompt, 20000);
  const negativeOnly = clip(entry.negativeOnly || "", 4000);
  const category = clip(entry.category || "cinematic", 100);
  const isFavorite = Boolean(entry.isFavorite);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        tx.update(ref, {
          title,
          prompt,
          positiveOnly,
          negativeOnly,
          isFavorite,
          shotsCount,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(ref, {
          uid: safeUid,
          title,
          engine,
          mode,
          category,
          shotsCount,
          source,
          prompt,
          positiveOnly,
          negativeOnly,
          isFavorite,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function togglePromptFavoriteInCloud(
  uid: string,
  promptId: string,
  isFavorite: boolean
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(promptId, "prompt");
  const path = `users/${safeUid}/prompts/${safeId}`;
  const ref = doc(db, "users", safeUid, "prompts", safeId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, {
      isFavorite: Boolean(isFavorite),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deletePromptFromCloud(
  uid: string,
  promptId: string
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(promptId, "prompt");
  const path = `users/${safeUid}/prompts/${safeId}`;
  const ref = doc(db, "users", safeUid, "prompts", safeId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveSequenceToCloud(
  uid: string,
  seq: SavedSequenceEntry
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(seq.id, "seq");
  const path = `users/${safeUid}/sequences/${safeId}`;
  const ref = doc(db, "users", safeUid, "sequences", safeId);

  const model: VideoGeneratorModel = VALID_SEQ_MODELS.has(seq.model)
    ? seq.model
    : "wan";
  const mode: VideoGeneratorMode = VALID_SEQ_MODES.has(seq.mode)
    ? seq.mode
    : "film_10";
  const lang: VideoGeneratorLang = VALID_SEQ_LANGS.has(seq.lang)
    ? seq.lang
    : "en";
  const shotLen = Math.max(1, Math.min(60, Math.round(seq.shotLen || 6)));
  const title = clipNonEmpty(
    seq.title || seq.idea,
    "Untitled Film Sequence",
    200
  );
  const idea = clipNonEmpty(seq.idea || seq.title, title, 2000);
  const style = clip(seq.style || "cinematic", 120);

  const sanitizedScenes: VideoGeneratorScene[] = (
    seq.scenes && seq.scenes.length > 0
      ? seq.scenes.slice(0, 30)
      : [{ sceneNumber: 1, narrativeBeat: "Scene 1", prompt: title }]
  ).map((sc, idx) => ({
    sceneNumber:
      typeof sc.sceneNumber === "number" && Number.isFinite(sc.sceneNumber)
        ? Math.max(1, Math.round(sc.sceneNumber))
        : idx + 1,
    narrativeBeat: clipNonEmpty(sc.narrativeBeat, `Scene ${idx + 1}`, 300),
    prompt: clipNonEmpty(sc.prompt, title, 4000),
  }));

  const consistencyNotes = {
    character: clip(seq.consistencyNotes?.character || "", 1000),
    palette: clip(seq.consistencyNotes?.palette || "", 1000),
    lens: clip(seq.consistencyNotes?.lens || "", 1000),
  };

  const formattedOutput = clipNonEmpty(
    seq.formattedOutput ||
      sanitizedScenes
        .map((s) => `Scene ${s.sceneNumber} — ${s.narrativeBeat}\n${s.prompt}`)
        .join("\n\n"),
    title,
    40000
  );

  const isFavorite = Boolean(seq.isFavorite);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        tx.update(ref, {
          title,
          idea,
          style,
          shotLen,
          scenes: sanitizedScenes,
          consistencyNotes,
          formattedOutput,
          isFavorite,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(ref, {
          uid: safeUid,
          title,
          idea,
          model,
          mode,
          style,
          lang,
          shotLen,
          scenes: sanitizedScenes,
          consistencyNotes,
          formattedOutput,
          isFavorite,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function toggleSequenceFavoriteInCloud(
  uid: string,
  sequenceId: string,
  isFavorite: boolean
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(sequenceId, "seq");
  const path = `users/${safeUid}/sequences/${safeId}`;
  const ref = doc(db, "users", safeUid, "sequences", safeId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, {
      isFavorite: Boolean(isFavorite),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteSequenceFromCloud(
  uid: string,
  sequenceId: string
): Promise<void> {
  const safeUid = sanitizeDocId(uid, "user");
  const safeId = sanitizeDocId(sequenceId, "seq");
  const path = `users/${safeUid}/sequences/${safeId}`;
  const ref = doc(db, "users", safeUid, "sequences", safeId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
