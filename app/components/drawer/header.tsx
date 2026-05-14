import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Flex, Heading, IconButton, Separator } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

export function Header({ children }: PropsWithChildren) {
  return (
    <>
      <Flex align="center" justify="between" gap="2" px="4" py="3">
        <Flex align="center" gap="2">
          {children}
        </Flex>
        <Dialog.Close asChild>
          <IconButton variant="ghost" color="gray" aria-label="Close">
            <Cross1Icon />
          </IconButton>
        </Dialog.Close>
      </Flex>
      <Separator size="4" mb="4" />
    </>
  );
}

export function Title({ children }: PropsWithChildren) {
  return (
    <Dialog.Title asChild>
      <Heading size="4" weight="medium">
        {children}
      </Heading>
    </Dialog.Title>
  );
}
