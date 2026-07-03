import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/setup', label: 'Plan Setup', step: 1 },
  { to: '/data', label: 'Data', step: 2 },
  { to: '/results', label: 'Payout Results', step: 3 },
  { to: '/dashboard', label: 'Dashboard', step: 4 },
]

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
              IC
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-slate-900">
                IC Payout Tool
              </div>
              <div className="text-xs leading-tight text-slate-500">
                Incentive Compensation · v1
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                <span className="mr-1.5 text-xs text-slate-400">
                  {item.step}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3 text-center text-xs text-slate-400">
          Client-side only · all data held in browser memory · no data leaves
          your machine
        </div>
      </footer>
    </div>
  )
}
