import { NavLink } from "react-router";
import { NAV_ITEMS } from "./nav-config";

interface SidenavListProps {
  onItemClick?: () => void;
}

export default function SidenavList({ onItemClick }: SidenavListProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          prefetch="intent"
          className={({ isActive }) =>
            [
              "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-[var(--gray-a3)] text-[var(--gray-12)]"
                : "text-[var(--gray-11)] hover:bg-[var(--gray-a2)] hover:text-[var(--gray-12)]",
            ].join(" ")
          }
          {...(exact ? { end: true } : {})}
          onClick={onItemClick}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
