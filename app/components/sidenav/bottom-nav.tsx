import { NavLink } from "react-router";
import { NAV_ITEMS } from "./nav-config";

export function BottomNav() {
  return (
    <nav
      aria-label="Główna nawigacja"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex h-16 border-t border-[var(--gray-a4)] bg-[var(--color-background)] pb-[env(safe-area-inset-bottom)]"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          prefetch="intent"
          {...(exact ? { end: true } : {})}
          className={({ isActive }) =>
            [
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
              isActive
                ? "text-[var(--accent-11)]"
                : "text-[var(--gray-10)] hover:text-[var(--gray-12)]",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex items-center justify-center rounded-full px-4 py-1 transition-colors ${
                  isActive ? "bg-[var(--accent-a3)]" : "bg-transparent"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
