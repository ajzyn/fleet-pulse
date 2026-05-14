import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Theme } from "@radix-ui/themes";
import type { ReactNode } from "react";

export type DrawerSize = "sm" | "md" | "lg";
export type DrawerSide = "right" | "bottom";

const rightSizeClass: Record<DrawerSize, string> = {
  sm: "max-w-[380px]",
  md: "max-w-[480px]",
  lg: "max-w-[640px]",
};

const bottomSizeClass: Record<DrawerSize, string> = {
  sm: "max-h-[40dvh]",
  md: "max-h-[60dvh]",
  lg: "max-h-[80dvh]",
};

const positionClass: Record<DrawerSide, string> = {
  right: "top-0 right-0 h-dvh w-full",
  bottom: "bottom-0 left-0 right-0 w-full rounded-t-lg h-fit",
};

interface RootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: DrawerSize;
  side?: DrawerSide;
  children: ReactNode;
}

export function Root({ open, onOpenChange, size = "md", side = "right", children }: RootProps) {
  const sizeCls = side === "right" ? rightSizeClass[size] : bottomSizeClass[size];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Theme>
          <Dialog.Content
            className={`fixed z-50 ${positionClass[side]} ${sizeCls} outline-none`}
            aria-describedby={undefined}
            style={side === "bottom" ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
          >
            <Flex
              direction="column"
              height="100%"
              className="bg-[var(--color-panel-solid)] shadow-xl"
            >
              {side === "bottom" && (
                <Box className="mx-auto mt-2 h-1 w-9 rounded-full bg-[var(--gray-a7)]" />
              )}
              {children}
            </Flex>
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
