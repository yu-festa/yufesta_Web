import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
  header?: ReactNode
  bottomNavigation?: ReactNode
  fixedInput?: ReactNode
  padded?: boolean
}

/** Shared, viewport-height mobile canvas for every page. */
export default function AppLayout({
  children,
  header,
  bottomNavigation,
  fixedInput,
  padded = true,
}: AppLayoutProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const shell = shellRef.current
    const dock = dockRef.current
    if (!shell) return
    if (!dock) {
      shell.style.removeProperty('--app-dock-height')
      return
    }

    const updateDockHeight = () => {
      shell.style.setProperty('--app-dock-height', `${dock.getBoundingClientRect().height}px`)
    }

    updateDockHeight()
    const observer = new ResizeObserver(updateDockHeight)
    observer.observe(dock)
    return () => observer.disconnect()
  }, [bottomNavigation, fixedInput])

  return (
    <div ref={shellRef} data-testid="app-shell" className="relative mx-auto flex min-h-dvh w-full max-w-(--app-max-width) flex-col overflow-x-clip bg-white [--app-dock-height:env(safe-area-inset-bottom,0px)]">
      {header && (
        <header className="sticky top-0 z-40 w-full bg-white pt-[env(safe-area-inset-top,0px)]">
          <div className="min-w-0 px-(--app-content-padding)">{header}</div>
        </header>
      )}

      <main className={`w-full min-w-0 flex-1 pb-[calc(var(--app-dock-height)+var(--app-content-padding))] [overflow-wrap:anywhere] ${header ? 'pt-0' : 'pt-[env(safe-area-inset-top,0px)]'} ${padded ? 'px-(--app-content-padding)' : 'px-0'}`}>
        {children}
      </main>

      {(fixedInput || bottomNavigation) && (
        <div ref={dockRef} className="fixed bottom-0 left-1/2 z-50 flex w-[min(100%,var(--app-max-width))] -translate-x-1/2 flex-col bg-white pb-[env(safe-area-inset-bottom,0px)]">
          {fixedInput && <div className="min-w-0 px-(--app-content-padding)">{fixedInput}</div>}
          {bottomNavigation && <div className="min-w-0 px-(--app-content-padding)">{bottomNavigation}</div>}
        </div>
      )}
    </div>
  )
}
