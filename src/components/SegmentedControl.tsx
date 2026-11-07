import { useLayoutEffect, useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

type IndicatorPosition = { left: number; top: number; width: number; height: number }

export function SegmentedControl({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<IndicatorPosition | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const update = () => {
      const active = root.querySelector<HTMLElement>(':scope > button.active')
      if (!active) {
        setIndicator(null)
        return
      }
      const next = { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight }
      setIndicator((current) => current && current.left === next.left && current.top === next.top && current.width === next.width && current.height === next.height ? current : next)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    root.querySelectorAll(':scope > button').forEach((button) => observer.observe(button))
    return () => observer.disconnect()
  }, [children])

  return <div ref={rootRef} className={className} {...props}>
    {indicator && <span className="segmented-indicator" aria-hidden="true" style={{ transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`, width: indicator.width, height: indicator.height }} />}
    {children}
  </div>
}
