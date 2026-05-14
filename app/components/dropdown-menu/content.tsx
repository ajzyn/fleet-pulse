import { Theme } from "@radix-ui/themes";
import { DropdownMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

type ContentProps = ComponentProps<typeof DropdownMenu.Content>;

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: ContentProps["align"];
  side?: ContentProps["side"];
  sideOffset?: ContentProps["sideOffset"];
  collisionPadding?: ContentProps["collisionPadding"];
}

export function DropdownMenuContent({
  children,
  align = "start",
  side,
  sideOffset = 4,
  collisionPadding = 10,
}: DropdownMenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <Theme>
        <DropdownMenu.Content
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className="rt-PopperContent rt-BaseMenuContent rt-DropdownMenuContent rt-r-size-2 rt-variant-solid"
          {...(side ? { side } : {})}
        >
          <div className="rt-BaseMenuViewport rt-DropdownMenuViewport">{children}</div>
        </DropdownMenu.Content>
      </Theme>
    </DropdownMenu.Portal>
  );
}
