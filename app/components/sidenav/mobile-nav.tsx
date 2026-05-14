import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { IconButton, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Drawer } from "../drawer";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { SidenavList } from "./sidenav-list";

export function MobileNav() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsOpen(false);
  }

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[var(--gray-a4)] bg-[var(--color-background)] px-4 h-12">
        <Link to="/" className="text-[var(--gray-12)] no-underline">
          <Text color="iris" size="4" weight="bold">
            FleetPulse
          </Text>
        </Link>
        <IconButton
          size="3"
          variant="ghost"
          color="gray"
          onClick={() => {
            setIsOpen(true);
          }}
          aria-label="Open navigation"
        >
          <HamburgerMenuIcon width="24" height="24" />
        </IconButton>
      </header>

      <Drawer.Root open={isOpen} onOpenChange={setIsOpen} side="right" size="sm">
        <Drawer.Header>
          <Drawer.Title>Navigation</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <SidenavList />
        </Drawer.Body>
        <Drawer.Footer>
          <ThemeToggle />
        </Drawer.Footer>
      </Drawer.Root>
    </>
  );
}
