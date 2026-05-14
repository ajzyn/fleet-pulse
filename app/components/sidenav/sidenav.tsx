import { Text } from "@radix-ui/themes";
import { Link } from "react-router";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { SidenavList } from "./sidenav-list";

export function Sidenav() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--gray-a4)] px-3 py-4 sticky top-0 h-screen">
      <div className="px-2 mb-6">
        <Link to="/" className="text-[var(--gray-12)] no-underline">
          <Text color="iris" size="4" weight="bold">
            FleetPulse
          </Text>
        </Link>
      </div>
      <SidenavList />
      <div className="mt-auto ml-auto pt-4 px-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
