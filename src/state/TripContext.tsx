import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { placeById } from '../data/places'
import { vehicleById, VEHICLES, type Vehicle } from '../data/vehicles'
import { buildRoute } from '../lib/route'
import { planTrip, type Preference, type TripPlan, type Weather } from '../lib/tripEngine'

export type VehicleOverrides = Partial<Pick<Vehicle, 'capacityKwh' | 'practicalRangeKm'>>

type TripState = {
  originId: string | null
  destinationId: string | null
  vehicleId: string
  overrides: Record<string, VehicleOverrides>
  battery: number
  reserve: number
  preference: Preference
  weather: Weather
  pillion: boolean
  preferredStationIds: string[]
}

type Ctx = TripState & {
  set: (patch: Partial<TripState>) => void
  vehicle: Vehicle
  plan: TripPlan | null
  calculate: (patch?: Partial<TripState>) => TripPlan | null
  toast: (msg: string) => void
  toastMsg: string | null
}

const TripCtx = createContext<Ctx | null>(null)

export function resolveVehicle(id: string, overrides: Record<string, VehicleOverrides>): Vehicle {
  return { ...vehicleById(id), ...(overrides[id] ?? {}) }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripState>({
    originId: 'bengaluru',
    destinationId: 'mysuru',
    vehicleId: VEHICLES[0].id,
    overrides: {},
    battery: 78,
    reserve: 15,
    preference: 'efficient',
    weather: 'clear',
    pillion: false,
    preferredStationIds: [],
  })
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const set = useCallback((patch: Partial<TripState>) => setState((s) => ({ ...s, ...patch })), [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout((toast as unknown as { t?: number }).t)
    ;(toast as unknown as { t?: number }).t = window.setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const calculate = useCallback(
    (patch?: Partial<TripState>) => {
      const s = { ...state, ...patch }
      if (patch) setState(s)
      const o = s.originId ? placeById(s.originId) : null
      const d = s.destinationId ? placeById(s.destinationId) : null
      if (!o || !d || o.id === d.id) return null
      const p = planTrip({
        route: buildRoute(o, d),
        vehicle: resolveVehicle(s.vehicleId, s.overrides),
        startSoc: s.battery,
        reserve: s.reserve,
        preference: s.preference,
        weather: s.weather,
        pillion: s.pillion,
        preferredStationIds: s.preferredStationIds,
      })
      setPlan(p)
      return p
    },
    [state],
  )

  const vehicle = useMemo(() => resolveVehicle(state.vehicleId, state.overrides), [state.vehicleId, state.overrides])

  return (
    <TripCtx.Provider value={{ ...state, set, vehicle, plan, calculate, toast, toastMsg }}>
      {children}
    </TripCtx.Provider>
  )
}

export function useTrip() {
  const c = useContext(TripCtx)
  if (!c) throw new Error('useTrip outside provider')
  return c
}
