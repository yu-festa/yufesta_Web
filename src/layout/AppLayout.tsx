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
    if (!shell || !dock) return

    const updateDockHeight = () => {
      shell.style.setProperty('--app-dock-height', `${dock.getBoundingClientRect().height}px`)
    }

    updateDockHeight()
    const observer = new ResizeObserver(updateDockHeight)
    observer.observe(dock)
    return () => observer.disconnect()
  }, [bottomNavigation, fixedInput])

  return (
    <div ref={shellRef} className={`app-shell${header ? ' app-shell--has-header' : ''}`}>
      {header && (
        <header className="app-header">
          <div className="app-header-content">{header}</div>
        </header>
      )}

      <main className={`app-content${padded ? '' : ' app-content--full-bleed'}`}>
        {children}
      </main>

      {(fixedInput || bottomNavigation) && (
        <div ref={dockRef} className="app-bottom-dock">
          {fixedInput && <div className="app-fixed-input">{fixedInput}</div>}
          {bottomNavigation && <div className="app-bottom-navigation">{bottomNavigation}</div>}
        </div>
      )}
    </div>
  )
}
