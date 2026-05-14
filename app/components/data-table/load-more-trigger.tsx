import { useEffect, useRef } from "react";
import { useScrollElement } from "./context";

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  disabled?: boolean;
  rootMargin?: string;
}

export function LoadMoreTrigger({
  onLoadMore,
  disabled = false,
  rootMargin = "300px",
}: LoadMoreTriggerProps) {
  const scrollEl = useScrollElement();
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const trigger = triggerRef.current;
    if (!trigger || !scrollEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: scrollEl, rootMargin },
    );
    observer.observe(trigger);
    return () => {
      observer.disconnect();
    };
  }, [disabled, onLoadMore, rootMargin, scrollEl]);

  return <div ref={triggerRef} aria-hidden style={{ height: 1 }} />;
}
