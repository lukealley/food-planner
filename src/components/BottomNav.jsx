import { NavLink } from 'react-router-dom'
import { Home, UtensilsCrossed, CalendarDays, User, Brain, Wallet } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'

const tabs = [
  { to: '/',        icon: Home,            label: 'Today'   },
  { to: '/log',     icon: UtensilsCrossed, label: 'Log'     },
  { to: '/corcard', icon: Brain,           label: 'Cor-Card' },
  { to: '/budget',  icon: Wallet,          label: 'Budget'  },
  { to: '/history', icon: CalendarDays,    label: 'History' },
  { to: '/profile', icon: User,            label: 'Profile' },
]

export default function BottomNav() {
  const activeUser = useAppStore(s => s.activeUser)
  const t = themes[activeUser]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 safe-bottom z-50 max-w-md mx-auto">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive ? '' : 'text-gray-400'
              }`
            }
            style={({ isActive }) => isActive ? { color: t.navActive } : {}}
          >
            <Icon size={20} />
            <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
