'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Athlete = { id: string; name: string }
type AttendanceStatus = 'Present' | 'Absent' | 'Late'
type AttendanceMap = Record<string, AttendanceStatus>

export default function AttendancePage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadAthletes()
  }, [])

  useEffect(() => {
    if (athletes.length > 0) loadSession()
  }, [date, athletes])

  async function loadAthletes() {
    const { data } = await supabase.from('athletes').select('id, name').order('name')
    if (data) {
      setAthletes(data)
      const defaults: AttendanceMap = {}
      data.forEach(a => { defaults[a.id] = 'Present' })
      setAttendance(defaults)
    }
  }

  async function loadSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: session } = await supabase
      .from('sessions')
      .select('id, notes')
      .eq('date', date)
      .eq('user_id', user.id)
      .single()

    if (session) {
      setSessionId(session.id)
      setNotes(session.notes || '')
      const { data: records } = await supabase
        .from('attendance')
        .select('athlete_id, status')
        .eq('session_id', session.id)

      if (records) {
        const map: AttendanceMap = {}
        athletes.forEach(a => { map[a.id] = 'Present' })
        records.forEach(r => { map[r.athlete_id] = r.status as AttendanceStatus })
        setAttendance(map)
      }
    } else {
      setSessionId(null)
      setNotes('')
      const defaults: AttendanceMap = {}
      athletes.forEach(a => { defaults[a.id] = 'Present' })
      setAttendance(defaults)
    }
  }

  function toggle(athleteId: string) {
    setAttendance(prev => {
      const current = prev[athleteId]
      const next: AttendanceStatus =
        current === 'Present' ? 'Absent' : current === 'Absent' ? 'Late' : 'Present'
      return { ...prev, [athleteId]: next }
    })
  }

  async function saveSession() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let sid = sessionId
    if (!sid) {
      const { data } = await supabase
        .from('sessions')
        .insert({ date, user_id: user.id, notes })
        .select('id')
        .single()
      sid = data?.id
      setSessionId(sid!)
    } else {
      await supabase.from('sessions').update({ notes }).eq('id', sid)
    }

    if (!sid) return

    await supabase.from('attendance').delete().eq('session_id', sid)
    const records = Object.entries(attendance).map(([athlete_id, status]) => ({
      session_id: sid,
      athlete_id,
      status,
    }))
    await supabase.from('attendance').insert(records)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length
  const absentCount = Object.values(attendance).filter(s => s === 'Absent').length
  const lateCount = Object.values(attendance).filter(s => s === 'Late').length

  const statusStyles: Record<AttendanceStatus, string> = {
    Present: 'bg-green-600 text-white',
    Absent: 'bg-red-600 text-white',
    Late: 'bg-yellow-500 text-white',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance</h2>
          <p className="text-gray-400 text-sm mt-0.5">Tap an athlete to cycle: Present → Absent → Late</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Present', count: presentCount, color: 'text-green-400' },
          { label: 'Absent',  count: absentCount,  color: 'text-red-400' },
          { label: 'Late',    count: lateCount,    color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-gray-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {athletes.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">No athletes found. Add athletes to the Roster first.</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-4">
          {athletes.map((athlete, i) => (
            <div
              key={athlete.id}
              className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/50 transition ${
                i < athletes.length - 1 ? 'border-b border-gray-700' : ''
              }`}
              onClick={() => toggle(athlete.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {athlete.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">{athlete.name}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[attendance[athlete.id] || 'Present']}`}>
                {attendance[athlete.id] || 'Present'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Session notes (optional)..."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      <button
        onClick={saveSession}
        disabled={saving || athletes.length === 0}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Attendance'}
      </button>
    </div>
  )
}
