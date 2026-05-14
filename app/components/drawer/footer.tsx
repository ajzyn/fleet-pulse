import { Flex, Separator } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

export function Footer({ children }: PropsWithChildren) {
  return (
    <>
      <Separator size="4" />
      <Flex align="center" justify="end" gap="2" px="4" py="3">
        {children}
      </Flex>
    </>
  );
}
