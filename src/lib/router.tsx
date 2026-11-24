import { useEffect, useState, type ReactNode, type MouseEvent } from 'react'

export type RouteName = 'home' | 'plan' | 'trip' | 'vehicles' | 'analytics'

const PATHS: Record<RouteName, string> = {
  home: '/',
  plan: '/plan',
  trip: '/trip',
  vehicles: '/vehicles',
  analytics: '/analytics',
}

function routeFromPath(path: string): RouteName | null {
  const normalised = path.replace(/\/+$/, '') || '/'
  return (Object.keys(PATHS) as RouteName[]).find((key) => PATHS[key] === normalised) ?? null
}

/**
 * Support both clean browser paths (e.g. /plan) and the older hash URLs
 * (e.g. /#/plan), so existing bookmarks continue to work.
 */
function parse(): RouteName {
  const hashPath = window.location.hash.replace(/^#/, '')
  return routeFromPath(hashPath) ?? routeFromPath(window.location.pathname) ?? 'home'
}

export function navigate(to: RouteName) {
  const target = PATHS[to]
  if (window.location.pathname !== target || window.location.hash) {
    window.history.pushState({}, '', target)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useRoute() {
  const [route, setRoute] = useState<RouteName>(parse)

  useEffect(() => {
    const onLocationChange = () => {
      setRoute(parse())
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('hashchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
    }
  }, [])

  return route
}

export function Link({
  to,
  className,
  children,
  onClick,
}: {
  to: RouteName
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={PATHS[to]}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        onClick?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
