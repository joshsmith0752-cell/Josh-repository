'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Stat = { label: string; value: string | number; sub?: string; color?: string }

export default function DashboardPage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [a, s, c, sk] = await Promise.all([
      supabase.from('athletes').select('*'),
      supabase.from('sessions').select('*, attendance(*)').order('date', { ascending: false }),
      supabase.from('competitions').select('*').order('date', { ascending: false }),
      supabase.from('skills').select('*'),
    ])
    setAthletes(a.data || [])
    setSessions(s.data || [])
    setCompetitions(c.data || [])
    setSkills(sk.data || [])
    setLoading(false)
  }

  // Compute stats
  const totalAthletes = athletes.length
  const healthyAthletes = athletes.filter(a => a.injury_status === 'Healthy').length
  const injuredAthletes = athletes.filter(a => a.injury_status === 'Injured').length

  const todaySession = sessions.find(s => s.date === today)
  const todayPresent = todaySession?.attendance?.filter((a: any) => a.status === 'Present').length ?? null

  const last5Sessions = sessions.slice(0, 5)
  const avgAttendance = last5Sessions.length > 0
    ? Math.round(last5Sessions.reduce((acc, s) => acc + (s.attendance?.filter((a: any) => a.status === 'Present').length || 0), 0) / last5Sessions.length)
    : 0

  const achievedSkills = skills.filter(s => s.status === 'Achieved').length
  const totalSkillsPossible = totalAthletes * 27 // 27 skills across all categories
  const skillPct = totalSkillsPossible > 0 ? Math.round((achievedSkills / totalSkillsPossible) * 100) : 0

  const lastComp = competitions[0]
  const totalComps = competitions.length

  const recentSessions = sessions.slice(0, 5)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Starlings 2026 · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Today's attendance callout */}
      {todaySession ? (
        <div className="card p-5 border-red-700/50 flex items-center justify-between flex-wrap gap-3"
          style={{ borderColor: 'rgba(185,28,28,0.4)' }}>
          <div>
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-1">Today's Practice</p>
            <p className="text-white font-bold text-lg">{todayPresent} / {totalAthletes} athletes present</p>
            <p className="text-gray-400 text-sm">{totalAthletes - (todayPresent ?? 0)} absent or late</p>
          </div>
          <Link href="/attendance" className="btn-red px-4 py-2 text-sm">View Attendance</Link>
        </div>
      ) : (
        <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Today's Practice</p>
            <p className="text-white font-semibold">No session marked yet for today</p>
          </div>
          <Link href="/attendance" className="btn-red px-4 py-2 text-sm">Mark Attendance</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Athletes', value: totalAthletes, sub: `${healthyAthletes} healthy`, icon: '👥', href: '/my-team' },
          { label: 'Avg Attendance', value: `${avgAttendance}`, sub: 'last 5 sessions', icon: '✅', href: '/attendance' },
          { label: 'Skills Achieved', value: `${skillPct}%`, sub: `${achievedSkills} total skills`, icon: '⭐', href: '/skills' },
          { label: 'Competitions', value: totalComps, sub: lastComp ? `Last: ${lastComp.placement || '—'} place` : 'None logged', icon: '🏆', href: '/competitions' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}
            className="card p-5 hover:border-gray-500 transition group block">
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-extrabold text-white group-hover:text-red-400 transition">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1 font-medium">{stat.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team health */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Team Health</h3>
            <Link href="/my-team" className="text-xs text-gray-500 hover:text-red-400 transition">View roster →</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Healthy', count: healthyAthletes, total: totalAthletes, color: 'bg-green-600' },
              { label: 'Injured', count: injuredAthletes, total: totalAthletes, color: 'bg-red-600' },
              { label: 'Modified', count: totalAthletes - healthyAthletes - injuredAthletes, total: totalAthletes, color: 'bg-yellow-600' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{row.label}</span>
                  <span>{row.count} / {row.total}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full transition-all`}
                    style={{ width: row.total > 0 ? `${(row.count / row.total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Injured athletes list */}
          {injuredAthletes > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Currently Injured</p>
              {athletes.filter(a => a.injury_status === 'Injured').map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full" />
                  <span className="text-sm text-white">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Recent Sessions</h3>
            <Link href="/attendance" className="text-xs text-gray-500 hover:text-red-400 transition">View all →</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No sessions yet</p>
              <Link href="/attendance" className="btn-red px-4 py-2 text-sm mt-3 inline-block">Start Tracking</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map(session => {
                const present = session.attendance?.filter((a: any) => a.status === 'Present').length || 0
                const pct = totalAthletes > 0 ? Math.round((present / totalAthletes) * 100) : 0
                return (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-gray-500 text-xs">{present} / {totalAthletes} present</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-600' : pct >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Competition history */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Competition Results</h3>
            <Link href="/competitions" className="text-xs text-gray-500 hover:text-red-400 transition">View all →</Link>
          </div>
          {competitions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No competitions logged yet</p>
              <Link href="/competitions" className="btn-red px-4 py-2 text-sm mt-3 inline-block">Add Competition</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {competitions.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.division || '—'} · {c.location || '—'}</p>
                  </div>
                  <div className="text-right">
                    {c.placement && (
                      <p className={`font-bold text-sm ${c.placement === '1st' ? 'text-yellow-400' : c.placement === '2nd' ? 'text-gray-300' : c.placement === '3rd' ? 'text-orange-400' : 'text-white'}`}>
                        {c.placement}
                      </p>
                    )}
                    {c.score != null && <p className="text-gray-500 text-xs">{c.score} pts</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="text-white font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mark Attendance', icon: '✅', href: '/attendance' },
              { label: 'Add Athlete', icon: '👤', href: '/my-team' },
              { label: 'Log Competition', icon: '🏆', href: '/competitions' },
              { label: 'Update Skills', icon: '⭐', href: '/skills' },
              { label: 'Plan Practice', icon: '📋', href: '/practices' },
              { label: 'Build Routine', icon: '💃', href: '/routine' },
            ].map(action => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-2.5 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl transition group">
                <span className="text-lg">{action.icon}</span>
                <span className="text-gray-300 group-hover:text-white text-xs font-medium transition">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
