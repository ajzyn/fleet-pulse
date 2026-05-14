import { Box } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

export function Body({ children }: PropsWithChildren) {
  return (
    <Box flexGrow="1" px="4" pt="3" pb="6" overflow="auto">
      {children}
    </Box>
  );
}
