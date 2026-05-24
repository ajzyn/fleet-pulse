import { Container } from "@radix-ui/themes";
import type { ReactNode } from "react";

export function Root({ children }: { children: ReactNode }) {
  return (
    <Container size="4" p="4">
      {children}
    </Container>
  );
}
