"use client";

import { useSyncExternalStore } from "react";

const KEY = "mia.assetsVisible";
const EVT = "mia:assets-toggle";

function readVisible(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) !== "0";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVT, onChange);
  };
}

/**
 * Show / hide monetary "Total Asset" values across the dashboard.
 * State is persisted to localStorage and synced across components in the same
 * tab (custom event) and across tabs (storage event).
 *
 * Uses `useSyncExternalStore` so SSR returns a stable snapshot and the client
 * subscribes to localStorage without effect-driven setState.
 */
export function useAssetsVisible(): {
  visible: boolean;
  toggle: () => void;
  /** False during SSR + the first client paint — guards against a flash. */
  mounted: boolean;
} {
  // Server snapshot: assume visible. Client snapshot: read localStorage.
  const visible = useSyncExternalStore(subscribe, readVisible, () => true);
  // Distinguish hydration: on the server `useSyncExternalStore` returns the
  // server snapshot; the client picks the real value on first paint.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const toggle = () => {
    const next = !readVisible();
    window.localStorage.setItem(KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(EVT));
  };

  return { visible, toggle, mounted };
}
