import { useEffect, useState, type ReactNode, type MouseEvent } from 'react'
export type RouteName = 'home' | 'plan' | 'trip' | 'vehicles' | 'analytics'
const PATHS: Record<RouteName, string> = { home: '/', plan: '/plan', trip: '/trip', vehicles: '/vehicles', analytics: '/analytics' }
function parse(): RouteName {
  const h = window.location.hash.replace(/^#/, '') || '/'
  const hit = (Object.keys(PATHS) as RouteName[]).find((k) => PATHS[k] === h)
  return hit ?? 'home'
}
export function navigate(to: RouteName) {
  const target = `#${PATHS[to]}`
  if (window.location.hash === target) return
  window.location.hash = target
}
export function useRoute() {
  const [route, setRoute] = useState<RouteName>(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
export function Link({ to, className, children, onClick }: { to: RouteName; className?: string; children: ReactNode; onClick?: () => void }) {
  return <a href={`#${PATHS[to]}`} className={className} onClick={(e: MouseEvent) => { onClick?.(); if (e.metaKey || e.ctrlKey) return }}>{children}</a>
}
