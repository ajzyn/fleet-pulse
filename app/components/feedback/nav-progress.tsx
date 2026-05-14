import { Theme } from "@radix-ui/themes";
import { createPortal } from "react-dom";
import { useNavigation } from "react-router";
import { useIsHydrated } from "~/hooks/use-is-hydrated";

export function NavProgress() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";
  const isHydrated = useIsHydrated();

  if (!isHydrated || !isLoading) return null;

  return createPortal(
    <Theme>
      <div
        className={`fixed top-0 left-0 right-0 z-[100] h-0.5 bg-[var(--accent-9)] transition-opacity opacity-100 animate-pulse"`}
      />
    </Theme>,
    document.body,
  );
}
