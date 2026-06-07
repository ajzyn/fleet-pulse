import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";

export function useRevalidateOnInterval(intervalMs: number) {
  const revalidator = useRevalidator();
  const revalidatorRef = useRef(revalidator);

  useEffect(() => {
    revalidatorRef.current = revalidator;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (revalidatorRef.current.state !== "idle") return;
      void revalidatorRef.current.revalidate();
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
}
