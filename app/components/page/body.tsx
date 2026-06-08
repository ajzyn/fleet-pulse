import type { ReactNode } from "react";

export function Body({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
