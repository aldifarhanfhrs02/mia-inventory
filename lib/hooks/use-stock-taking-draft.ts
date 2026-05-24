"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "mia.stockTakingDraft";
const EVT = "mia:stock-taking-draft";

interface DraftShape {
  actuals: Record<string, string>;
  savedAt: number;
}

const EMPTY: DraftShape = { actuals: {}, savedAt: 0 };

function read(): DraftShape {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as DraftShape;
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.actuals &&
      typeof parsed.actuals === "object"
    ) {
      return {
        actuals: parsed.actuals,
        savedAt: Number(parsed.savedAt) || 0,
      };
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * `useSyncExternalStore` needs a stable snapshot reference between renders. We
 * memo by the raw JSON string so two reads that decode to the same value
 * compare equal.
 */
let cachedRaw: string | null = null;
let cachedSnapshot: DraftShape = EMPTY;
function snapshot(): DraftShape {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = read();
  return cachedSnapshot;
}

function subscribe(onChange: () => void): () => void {
  const handler = () => {
    // Invalidate the cache so the next snapshot() returns the fresh value.
    cachedRaw = null;
    onChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(EVT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVT, handler);
  };
}

/**
 * Persistent draft for the Stock Taking audit. Survives a page reload — the
 * floor walk can take 30–60 minutes so a refresh shouldn't wipe progress.
 *
 *   • `actuals` is keyed by `part.id`; the value is the raw string the user
 *     typed (so we don't lose the "" / "0" distinction).
 *   • `setActual` writes through to localStorage immediately.
 *   • `clear()` wipes the draft entirely (used by the "Buang" banner button
 *     and the "Buang draft setelah export" checkbox).
 *   • `mounted` mirrors `use-assets-visible.ts` — false during SSR / first
 *     paint, so callers can suppress the draft banner until the client picks
 *     the real value.
 */
export function useStockTakingDraft(): {
  actuals: Record<string, string>;
  setActual: (partId: string, value: string) => void;
  clear: () => void;
  savedAt: number | null;
  mounted: boolean;
} {
  const draft = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setActual = useCallback((partId: string, value: string) => {
    const current = read();
    const next: DraftShape = {
      actuals: { ...current.actuals, [partId]: value },
      savedAt: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cachedRaw = null;
    window.dispatchEvent(new Event(EVT));
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(KEY);
    cachedRaw = null;
    window.dispatchEvent(new Event(EVT));
  }, []);

  return {
    actuals: draft.actuals,
    setActual,
    clear,
    savedAt: draft.savedAt || null,
    mounted,
  };
}
