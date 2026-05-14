import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useFetcher, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import type { Appearance } from "~/lib/theme-cookie.server";

export function ThemeToggle() {
  const fetcher = useFetcher();
  const rootData = useRouteLoaderData<typeof rootLoader>("root");

  let appearance: Appearance = rootData?.appearance ?? "dark";
  if (fetcher.formData?.has("appearance")) {
    appearance = fetcher.formData.get("appearance") as Appearance;
  }
  const isDark = appearance === "dark";
  const next: Appearance = isDark ? "light" : "dark";

  return (
    <fetcher.Form method="post" action="/">
      <input type="hidden" name="appearance" value={next} />
      <button
        type="submit"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${next} mode`}
        className="relative inline-flex h-8 w-16 items-center rounded-full border border-[var(--gray-a5)] bg-[var(--gray-a3)] transition-colors hover:bg-[var(--gray-a4)] cursor-pointer"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gray-12)] text-[var(--gray-1)] shadow-md transition-transform ${
            isDark ? "translate-x-8" : "translate-x-0.5"
          }`}
        >
          {isDark ? <MoonIcon width="16" height="16" /> : <SunIcon width="16" height="16" />}
        </span>
      </button>
    </fetcher.Form>
  );
}
