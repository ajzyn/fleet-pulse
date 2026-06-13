import { useEffect, useRef } from "react";

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
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, rootMargin },
    );
    observer.observe(trigger);
    return () => {
      observer.disconnect();
    };
  }, [disabled, onLoadMore, rootMargin]);

  return <div ref={triggerRef} aria-hidden style={{ height: 1 }} />;
}
