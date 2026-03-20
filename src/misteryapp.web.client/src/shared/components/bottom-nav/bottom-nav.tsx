import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    match: (p: string) => p === '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <polyline points="9 21 9 12 15 12 15 21" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    match: (p: string) => p === '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    to: '/daily-log',
    label: 'Today',
    match: (p: string) => p === '/daily-log',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/reports/weekly',
    label: 'Reports',
    match: (p: string) => p.startsWith('/reports'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    to: '/bookmarks',
    label: 'Saved',
    match: (p: string) => p === '/bookmarks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed z-50 flex justify-around items-center px-4 py-2"
      style={{
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '600px',
        borderRadius: '999px',
        background: 'rgba(15, 23, 42, 0.60)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {NAV_ITEMS.map(item => {
        const active = item.match(pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200"
            style={{
              color: active ? '#38bdf8' : 'rgba(255,255,255,0.38)',
              filter: active ? 'drop-shadow(0 0 8px rgba(56,189,248,0.8))' : 'none',
              background: active ? 'rgba(56,189,248,0.08)' : 'transparent',
            }}
          >
            {item.icon}
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ color: active ? '#7dd3fc' : 'rgba(255,255,255,0.38)' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
