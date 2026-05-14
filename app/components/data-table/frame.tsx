import { useState, type PropsWithChildren, type ReactNode } from "react";
import { ScrollCtx } from "./context";

interface FrameProps {
  height?: string;
  children: ReactNode;
}

export function Frame({ height = "calc(100vh - 220px)", children }: FrameProps) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-4)",
        boxShadow: "inset 0 0 0 1px var(--gray-a6)",
        overflow: "hidden",
        height,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

export function Viewport({ children }: PropsWithChildren) {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  return (
    <ScrollCtx.Provider value={scrollEl}>
      <div ref={setScrollEl} style={{ width: "100%", height: "100%", overflow: "auto" }}>
        {children}
      </div>
    </ScrollCtx.Provider>
  );
}
