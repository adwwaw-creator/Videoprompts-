import { User } from "firebase/auth";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Language, WorkspaceTab } from "../types/prompt";

const VISITOR_HASH_KEY = "arabiprompt_visitor_hash_v1";
const SESSION_VISIT_KEY = "arabiprompt_session_visit_v1";
export const BOOTSTRAPPED_ADMIN_EMAIL = "adwwaw@gmail.com";

export interface RecentVisitRecord {
  id: string;
  visitorHash: string;
  dateKey: string;
  lang: Language;
  path: WorkspaceTab;
  createdAtMs: number;
}

export interface AdminVisitorStats {
  totalVisits: number;
  todayVisits: number;
  uniqueRecentVisitors: number;
  langCounts: Record<Language, number>;
  recentVisits: RecentVisitRecord[];
  lastUpdatedAt: number;
}

function generateSafeId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, "");
}

function getOrCreateVisitorHash(): string {
  try {
    const existing = localStorage.getItem(VISITOR_HASH_KEY);
    if (existing && /^[a-zA-Z0-9_\-]{8,64}$/.test(existing)) {
      return existing;
    }
    const created = generateSafeId("vis").slice(0, 48);
    localStorage.setItem(VISITOR_HASH_KEY, created);
    return created;
  } catch {
    return generateSafeId("vis").slice(0, 48);
  }
}

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function recordSiteVisit(
  lang: Language,
  path: WorkspaceTab
): Promise<void> {
  try {
    if (sessionStorage.getItem(SESSION_VISIT_KEY)) {
      return;
    }
  } catch {
    // ignore storage errors
  }

  const visitId = generateSafeId("visit").slice(0, 64);
  const visitorHash = getOrCreateVisitorHash();
  const dateKey = getTodayDateKey();
  const safeLang: Language =
    lang === "ar" || lang === "fr" || lang === "en" ? lang : "ar";
  const safePath: WorkspaceTab =
    path === "portal" || path === "studio" || path === "guide" || path === "history"
      ? path
      : "studio";

  const visitPath = `visits/${visitId}`;
  try {
    await setDoc(doc(db, "visits", visitId), {
      visitorHash,
      dateKey,
      lang: safeLang,
      path: safePath,
      createdAt: serverTimestamp(),
    });
    try {
      sessionStorage.setItem(SESSION_VISIT_KEY, visitId);
    } catch {
      // ignore storage errors
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, visitPath);
  }
}

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) {
    return false;
  }
  if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, "admins", user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function fetchAdminExactCounts(): Promise<{
  totalVisits: number;
  todayVisits: number;
}> {
  const todayKey = getTodayDateKey();
  const visitsCol = collection(db, "visits");
  try {
    const [totalSnap, todaySnap] = await Promise.all([
      getCountFromServer(visitsCol),
      getCountFromServer(query(visitsCol, where("dateKey", "==", todayKey))),
    ]);
    return {
      totalVisits: totalSnap.data().count,
      todayVisits: todaySnap.data().count,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "visits");
  }
}

export function subscribeAdminVisitorStats(
  onUpdate: (stats: AdminVisitorStats) => void,
  onError?: (err: Error) => void
): () => void {
  const recentQuery = query(
    collection(db, "visits"),
    orderBy("createdAt", "desc"),
    limit(200)
  );

  const unsubscribe = onSnapshot(
    recentQuery,
    async (snapshot) => {
      try {
        const uniqueSet = new Set<string>();
        const langCounts: Record<Language, number> = { ar: 0, fr: 0, en: 0 };
        const recentVisits: RecentVisitRecord[] = [];
        const todayKey = getTodayDateKey();
        let fallbackTodayCount = 0;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const visitorHash =
            typeof data.visitorHash === "string" ? data.visitorHash : docSnap.id;
          uniqueSet.add(visitorHash);

          const docLang: Language =
            data.lang === "fr" || data.lang === "en" ? data.lang : "ar";
          langCounts[docLang] += 1;

          const docDateKey =
            typeof data.dateKey === "string" ? data.dateKey : todayKey;
          if (docDateKey === todayKey) {
            fallbackTodayCount += 1;
          }

          const ts = data.createdAt as Timestamp | undefined;
          const createdAtMs =
            ts && typeof ts.toMillis === "function" ? ts.toMillis() : Date.now();

          const docPath: WorkspaceTab =
            data.path === "portal" ||
            data.path === "guide" ||
            data.path === "history"
              ? data.path
              : "studio";

          if (recentVisits.length < 15) {
            recentVisits.push({
              id: docSnap.id,
              visitorHash,
              dateKey: docDateKey,
              lang: docLang,
              path: docPath,
              createdAtMs,
            });
          }
        });

        const baseStats: AdminVisitorStats = {
          totalVisits: snapshot.size,
          todayVisits: fallbackTodayCount,
          uniqueRecentVisitors: uniqueSet.size,
          langCounts,
          recentVisits,
          lastUpdatedAt: Date.now(),
        };
        onUpdate(baseStats);

        try {
          const exact = await fetchAdminExactCounts();
          onUpdate({
            ...baseStats,
            totalVisits: Math.max(exact.totalVisits, snapshot.size),
            todayVisits: Math.max(exact.todayVisits, fallbackTodayCount),
            lastUpdatedAt: Date.now(),
          });
        } catch {
          // Keep snapshot counts if aggregation fails
        }
      } catch (err) {
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, "visits");
      } catch (wrapped) {
        if (onError) {
          onError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      }
    }
  );

  return unsubscribe;
}
