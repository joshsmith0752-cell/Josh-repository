'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '📊' },
  { href: '/my-team',      label: 'My Team',      icon: '👥' },
  { href: '/attendance',   label: 'Attendance',   icon: '✅' },
  { href: '/skills',       label: 'Skills',       icon: '⭐' },
  { href: '/practices',    label: 'Practices',    icon: '📋' },
  { href: '/competitions', label: 'Competitions', icon: '🏆' },
  { href: '/routine',      label: 'Routine',      icon: '💃' },
  { href: '/icu-rules',    label: 'ICU Rules',    icon: '📖' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLinks = () => (
    <>
      {navItems.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen flex-col border-r border-[rgba(60,60,80,0.5)] bg-[rgba(10,11,16,0.6)] backdrop-blur-md">
        <div className="px-6 py-6 border-b border-[rgba(60,60,80,0.4)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/50">
              <span className="text-lg">📣</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">CheerHub</h1>
              <p className="text-gray-500 text-xs">Team Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLinks />
        </nav>
        <div className="px-4 py-4 border-t border-[rgba(60,60,80,0.4)]">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[rgba(10,11,16,0.75)] backdrop-blur-md border-b border-[rgba(60,60,80,0.5)] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow shadow-red-600/50">
            <span>📣</span>
          </div>
          <h1 className="text-lg font-extrabold text-white">CheerHub</h1>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition">
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-[rgba(10,11,16,0.85)] backdrop-blur-md border-r border-[rgba(60,60,80,0.5)] flex flex-col pt-16">
            <nav className="flex-1 px-4 py-6 space-y-1"><NavLinks /></nav>
            <div className="px-4 py-4 border-t border-[rgba(60,60,80,0.4)]">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
