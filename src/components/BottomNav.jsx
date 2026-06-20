import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/home',      icon: 'home',        label: '홈' },
  { to: '/petitions', icon: 'description', label: '청원' },
  { to: '/profile',   icon: 'person',      label: '내정보' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant">
      <div className="flex justify-around items-center h-16 w-full max-w-[768px] mx-auto">
        {tabs.map(({ to, icon, label }) => {
          const active = pathname === to || (to === '/home' && pathname.startsWith('/post'))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 ${
                active
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="font-label-sm text-label-sm">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
