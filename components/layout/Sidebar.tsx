'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/roster',      label: 'Roster',      icon: '👥' },
  { href: '/attendance',  label: 'Attendance',   icon: '✅' },
  { href: '/skills',      label: 'Skills',       icon: '⭐' },
  { href: '/practices',   label: 'Practices',    icon: '📋' },
  { href: '/competitions',label: 'Competitions', icon: '🏆' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-gray-800 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-red-500">CheerHub</h1>
        <p className="text-gray-400 text-xs mt-1">Team Management</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
