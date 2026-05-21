import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True once running on the client. Used to defer rendering of values that
 * differ between server and client (theme, locale-sensitive output) without
 * a setState-in-effect, which avoids cascading renders.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
