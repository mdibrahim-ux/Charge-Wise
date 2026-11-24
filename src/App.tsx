import { CheckCircle2 } from 'lucide-react'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { useRoute } from './lib/router'
import { Analytics } from './pages/Analytics'
import { Landing } from './pages/Landing'
import { LivePlanner } from './pages/LivePlanner'
import { Vehicles } from './pages/Vehicles'
import { TripProvider, useTrip } from './state/TripContext'

document.title = 'ChargeWise — Every Journey. Fully Charged.'

function Shell() {
  const route = useRoute()
  const { toastMsg } = useTrip()
  const Page = { home: Landing, plan: LivePlanner, trip: LivePlanner, vehicles: Vehicles, analytics: Analytics }[route]
  return (
    <div className="min-h-screen bg-ink-900 text-snow">
      <Nav route={route} />
      <main key={route} className="animate-fade-up">
        <Page />
      </main>
      {route !== 'plan' && route !== 'trip' && <Footer />}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-[2000] flex -translate-x-1/2 animate-fade-up items-center gap-2.5 rounded-xl border-2 border-black bg-ink-750 px-4 py-3 text-sm font-semibold shadow-pop" role="status">
          <CheckCircle2 size={16} className="text-lime-ink" /> {toastMsg}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <TripProvider>
      <Shell />
    </TripProvider>
  )
}
