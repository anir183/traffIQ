import { useEffect, useRef, useState } from 'react'

interface UseListPageSizeOptions {
  min?: number
  max?: number
}

export function useListPageSize<T extends HTMLElement>(
  { min = 3, max = 20 }: UseListPageSizeOptions = {},
  recomputeKey: unknown,
) {
  const containerRef = useRef<T | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState(max)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const compute = () => {
      const firstRow = container.querySelector<HTMLElement>('[data-sm-row]')
      if (!firstRow) return
      const rowHeight = firstRow.getBoundingClientRect().height
      if (rowHeight <= 0) return

      const containerTop = container.getBoundingClientRect().top
      const firstRowTop = firstRow.getBoundingClientRect().top
      const available = container.clientHeight - (firstRowTop - containerTop)
      if (available <= 0) return

      const fit = Math.floor(available / rowHeight)
      const next = Math.min(max, Math.max(min, fit))

      setRowsPerPage((prev) => (prev === next ? prev : next))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [min, max, recomputeKey])

  return { containerRef, rowsPerPage }
}