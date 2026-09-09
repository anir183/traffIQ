import { useEffect, useRef, useState } from "react";

interface UseListPageSizeOptions {
  min?: number;
  max?: number;
}

const SUBPIXEL_EPSILON = 0.5;
const FIT_SAFETY_MARGIN = 2;

export function useListPageSize<T extends HTMLElement>(
  { min = 3, max = 50 }: UseListPageSizeOptions = {},
  recomputeKey: unknown,
) {
  const containerRef = useRef<T | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(max);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const compute = () => {
      if (disposed) return;
      const rows = container.querySelectorAll<HTMLElement>("[data-sm-row]");
      if (rows.length === 0) return;

      const first = rows[0];
      const firstRect = first.getBoundingClientRect();
      const rowHeight = firstRect.height;
      if (rowHeight <= 0) return;

      const firstTop = firstRect.top;
      let step = rowHeight;
      for (let i = 1; i < rows.length; i++) {
        const gap = rows[i].getBoundingClientRect().top - firstTop;
        if (gap > SUBPIXEL_EPSILON) step = Math.min(step, gap);
      }
      if (step <= 0) return;

      const available =
        container.clientHeight -
        (firstTop - container.getBoundingClientRect().top);
      if (available <= 0) return;

      const fit =
        Math.floor((available - rowHeight - FIT_SAFETY_MARGIN) / step) + 1;
      const next = Math.min(max, Math.max(min, fit));

      setRowsPerPage((prev) => (prev === next ? prev : next));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    void document.fonts.ready.then(compute);

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [min, max, recomputeKey]);

  return { containerRef, rowsPerPage };
}
