'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DashboardPage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [practices, setPractices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [a, s, c, sk, p] = await Promise.all([
      supabase.from('athletes').select('*'),
      supabase.from('sessions').select('*, attendance(*)').order('date', { ascending: false }),
      supabase.from('competitions').select('*').order('date', { ascending: false }),
      supabase.from('skills').select('*'),
      supabase.from('practices').select('*').eq('is_template', false).order('date', { ascending: true }),
    ])
    setAthletes(a.data || [])
    setSessions(s.data || [])
    setCompetitions(c.data || [])
    setSkills(sk.data || [])
    setPractices(p.data || [])
    setLoading(false)
  }

  const totalAthletes = athletes.length
  const healthyCount = athletes.filter(a => a.injury_status === 'Healthy').length
  const injuredCount = athletes.filter(a => a.injury_status === 'Injured').length
  const modifiedCount = athletes.filter(a => a.injury_status === 'Modified Training').length

  const todaySession = sessions.find(s => s.date === todayStr)
  const todayPresent = todaySession?.attendance?.filter((a: any) => a.status === 'Present').length ?? null

  const last5 = sessions.slice(0, 5)
  const avgAttendance = last5.length > 0
    ? Math.round(last5.reduce((acc, s) => acc + (s.attendance?.filter((a: any) => a.status === 'Present').length || 0), 0) / last5.length)
    : 0

  const achievedSkills = skills.filter(s => s.status === 'Achieved').length
  const skillPct = totalAthletes > 0 ? Math.round((achievedSkills / (totalAthletes * 27)) * 100) : 0

  // Week view — Mon to Sun of current week
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  function practicesOnDay(d: Date) {
    const str = d.toISOString().split('T')[0]
    return practices.filter(p => p.date === str)
  }

  function sessionOnDay(d: Date) {
    const str = d.toISOString().split('T')[0]
    return sessions.find(s => s.date === str)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading dashboard...
      </div>
    </div>
  )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Starlings 2026 · {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Today callout */}
      <motion.div variants={item}>
        {todaySession ? (
          <div className="card p-5 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: 'rgba(185,28,28,0.4)' }}>
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
              <p className="text-gray-500 text-sm">Tap below to start taking attendance</p>
            </div>
            <Link href="/attendance" className="btn-red px-4 py-2 text-sm">Mark Attendance</Link>
          </div>
        )}
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Athletes', value: totalAthletes, sub: `${healthyCount} healthy`, icon: '👥', href: '/my-team', highlight: injuredCount > 0 ? `⚠️ ${injuredCount} injured` : null },
          { label: 'Avg Attendance', value: `${avgAttendance}`, sub: 'last 5 sessions', icon: '✅', href: '/attendance', highlight: null },
          { label: 'Skills', value: `${skillPct}%`, sub: `${achievedSkills} achieved`, icon: '⭐', href: '/skills', highlight: null },
          { label: 'Competitions', value: competitions.length, sub: competitions[0] ? `Last: ${competitions[0].placement || '—'}` : 'None yet', icon: '🏆', href: '/competitions', highlight: null },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}
            className="card p-5 hover:border-gray-500 transition group block">
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-extrabold text-white group-hover:text-red-400 transition">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            <div className="text-xs mt-0.5">
              {stat.highlight
                ? <span className="text-yellow-500">{stat.highlight}</span>
                : <span className="text-gray-600">{stat.sub}</span>
              }
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Weekly calendar */}
      <motion.div variants={item} className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">This Week</h3>
          <Link href="/practices" className="text-xs text-gray-500 hover:text-red-400 transition">Plan practices →</Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => {
            const isToday = d.toISOString().split('T')[0] === todayStr
            const hasPractice = practicesOnDay(d).length > 0
            const hasAttendance = !!sessionOnDay(d)
            const isPast = d < today && !isToday
            return (
              <div key={i} className={`rounded-xl p-2 text-center transition ${isToday ? 'bg-red-600/20 border border-red-600/50' : 'bg-white/5'}`}>
                <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-red-400' : 'text-gray-500'}`}>{DAYS[(i + 1) % 7]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : isPast ? 'text-gray-600' : 'text-gray-300'}`}>
                  {d.getDate()}
                </p>
                <div className="flex justify-center gap-1 mt-1.5">
                  {hasPractice && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Practice planned" />}
                  {hasAttendance && <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Attendance taken" />}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"/><span className="text-xs text-gray-500">Practice planned</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400"/><span className="text-xs text-gray-500">Attendance taken</span></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Team health */}
        <motion.div variants={item} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Team Health</h3>
            <Link href="/my-team" className="text-xs text-gray-500 hover:text-red-400 transition">Full roster →</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Healthy', count: healthyCount, color: 'bg-green-600' },
              { label: 'Injured', count: injuredCount, color: 'bg-red-600' },
              { label: 'Modified', count: modifiedCount, color: 'bg-yellow-500' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{row.label}</span>
                  <span className="font-semibold text-white">{row.count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${row.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: totalAthletes > 0 ? `${(row.count / totalAthletes) * 100}%` : '0%' }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          {injuredCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Currently Injured</p>
              {athletes.filter(a => a.injury_status === 'Injured').map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-white">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent sessions */}
        <motion.div variants={item} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Recent Sessions</h3>
            <Link href="/attendance" className="text-xs text-gray-500 hover:text-red-400 transition">All sessions →</Link>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No sessions recorded yet</p>
              <Link href="/attendance" className="btn-red px-4 py-2 text-sm inline-block">Start Tracking</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {sessions.slice(0, 6).map((session, i) => {
                const present = session.attendance?.filter((a: any) => a.status === 'Present').length || 0
                const pct = totalAthletes > 0 ? Math.round((present / totalAthletes) * 100) : 0
                return (
                  <div key={session.id} className={`flex items-center justify-between py-3 ${i < 5 ? 'border-b border-white/10' : ''}`}>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-gray-500 text-xs">{present}/{totalAthletes} present</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Competition results */}
        <motion.div variants={item} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Competition Results</h3>
            <Link href="/competitions" className="text-xs text-gray-500 hover:text-red-400 transition">All results →</Link>
          </div>
          {competitions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No competitions logged yet</p>
              <Link href="/competitions" className="btn-red px-4 py-2 text-sm inline-block">Add Competition</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {competitions.slice(0, 4).map((c, i) => (
                <div key={c.id} className={`flex items-center justify-between py-3 ${i < 3 ? 'border-b border-white/10' : ''}`}>
                  <div>
                    <p className="text-white text-sm font-semibold">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.division || '—'} · {c.location || '—'}</p>
                  </div>
                  <div className="text-right">
                    {c.placement && (
                      <p className={`font-extrabold ${c.placement==='1st'?'text-yellow-400':c.placement==='2nd'?'text-gray-300':c.placement==='3rd'?'text-orange-400':'text-white'}`}>
                        {c.placement}
                      </p>
                    )}
                    {c.score != null && <p className="text-gray-500 text-xs">{c.score} pts</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={item} className="card p-5">
          <h3 className="text-white font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Mark Attendance', icon: '✅', href: '/attendance', desc: "Today's practice" },
              { label: 'Add Athlete', icon: '👤', href: '/my-team', desc: 'Update roster' },
              { label: 'Log Competition', icon: '🏆', href: '/competitions', desc: 'Record results' },
              { label: 'Update Skills', icon: '⭐', href: '/skills', desc: 'Track progress' },
              { label: 'Plan Practice', icon: '📋', href: '/practices', desc: 'Build a session' },
              { label: 'Build Routine', icon: '💃', href: '/routine', desc: 'Place athletes' },
            ].map(action => (
              <Link key={action.label} href={action.href}
                className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition group">
                <span className="text-xl mt-0.5">{action.icon}</span>
                <div>
                  <p className="text-white text-xs font-semibold group-hover:text-red-400 transition leading-tight">{action.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
