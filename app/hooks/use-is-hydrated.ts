import { useSyncExternalStore } from "react";

export const useIsHydrated = () => {
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  return isHydrated;
};
