import { useEffect, useState } from "react";

interface UseFixedVirtualizerOptions {
  count: number;
  itemHeight: number;
  getScrollElement: () => HTMLElement | null;
  overscan?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  key: number;
}

export function useFixedVirtualizer({
  count,
  itemHeight,
  getScrollElement,
  overscan = 24,
}: UseFixedVirtualizerOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(1000); // Sensible default for SSR or initial render

  useEffect(() => {
    const el = getScrollElement();
    if (!el) return;

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setViewportHeight(entries[0].contentRect.height);
      }
    });

    el.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [getScrollElement]);

  const totalSize = count * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    count - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
  );

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      key: i,
    });
  }

  return {
    virtualItems,
    totalSize,
  };
}
