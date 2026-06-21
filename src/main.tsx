import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, Outlet, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Setup } from './pages/Setup'
import { BriefPage } from './pages/BriefPage'
import { Learn } from './pages/Learn'
import { Handbook } from './pages/Handbook'
import { Splash } from './pages/Splash'
import { PageTransition } from './components/PageTransition'
import logoUrl from './lib/logo.png'
import './index.css'

function MainLayout() {
  const location = useLocation()
  const isPractice = location.pathname.startsWith('/practice')

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <nav className="border-b border-ink-light/20 bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain invert" />
            <span className="font-playfair text-xl font-bold tracking-widest text-paper">PYGRIND</span>
            <span className="hidden font-mono-dm text-xs text-ink-light sm:inline-block">| train like an engineer</span>
          </div>
          <div className="flex items-center gap-1">
            <NavItem label="Learn" to="/learn" matchAlso="/practice" />
            <NavItem label="Handbook" to="/handbook" />
            <NavItem label="Setup" to="/setup" icon={<Settings className="h-3.5 w-3.5" />} />
          </div>
        </div>
      </nav>
      <main className="flex flex-1 flex-col">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {!isPractice && (
        <footer className="border-t border-ink-light/20 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between font-mono-dm text-[0.6rem] uppercase text-ink-light">
            <span>© PyGrind</span>
            <a href="https://github.com/galihkjaya/pygrind.git" target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">GitHub →</a>
          </div>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter 
      basename={normalizeBaseName(import.meta.env.BASE_URL)}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* We will route / to Splash, and Setup / Brief next. */}
        <Route element={<Splash />} path="/" />
        <Route element={<PageTransition><Setup /></PageTransition>} path="/setup" />
        <Route element={<PageTransition><BriefPage /></PageTransition>} path="/brief" />
        
        <Route element={<MainLayout />}>
          <Route element={<Learn />} path="/learn" />
          <Route element={<Learn />} path="/practice/:pathId" />
          <Route element={<Handbook />} path="/handbook" />
          <Route element={<Handbook />} path="/handbook/:slug" />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

type NavItemProps = {
  label: string
  to: string
  matchAlso?: string
  icon?: React.ReactNode
}

function NavItem({ label, to, matchAlso, icon }: NavItemProps) {
  const location = useLocation()
  const isManualActive = matchAlso ? location.pathname.startsWith(matchAlso) : false

  return (
    <NavLink
      className={({ isActive }) => {
        const active = isActive || isManualActive
        return `nav-link-ink inline-flex h-9 items-center gap-2 rounded-none px-4 py-2 font-mono-dm text-sm font-semibold transition-colors ${
          active ? 'active text-paper' : 'text-ink-light hover:text-paper'
        }`
      }}
      end={to === '/learn'}
      to={to}
    >
      {icon}
      {label}
    </NavLink>
  )
}

function normalizeBaseName(baseUrl: string) {
  if (!baseUrl || baseUrl === '/') {
    return '/'
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
