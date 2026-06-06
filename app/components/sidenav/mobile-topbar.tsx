import { PersonIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Text } from "@radix-ui/themes";
import { DropdownMenu } from "radix-ui";
import { Link } from "react-router";
import { DropdownMenuContent } from "../dropdown-menu/content";
import { ThemeToggle } from "../theme-toggle/theme-toggle";

export function MobileTopbar() {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[var(--gray-a4)] bg-[var(--color-background)] px-4 h-12">
      <Link to="/" className="text-[var(--gray-12)] no-underline">
        <Text color="iris" size="4" weight="bold">
          FleetPulse
        </Text>
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton size="2" variant="soft" color="gray" aria-label="Konto i ustawienia">
            <PersonIcon width="18" height="18" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenuContent align="end">
          <Flex align="center" justify="between" gap="4" px="2" py="1">
            <Text size="2" color="gray">
              Motyw
            </Text>
            <ThemeToggle />
          </Flex>
        </DropdownMenuContent>
      </DropdownMenu.Root>
    </header>
  );
}
