'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Athlete = { id: string; name: string; position?: string }

type PlacedAthlete = {
  athleteId: string
  name: string
  role: string
  x: number // percentage 0-100
  y: number // percentage 0-100
}

const SECTIONS = ['Opener', 'Stunts', 'Pyramid', 'Tumbling Pass', 'Dance', 'Cheer', 'Closer']

const ROLES = ['Flyer', 'Main Base', 'Side Base', 'Back Spot', 'Front Spot', 'Tumbler', 'Front Row', 'Back Row', 'Left Side', 'Right Side', 'Center']

const roleColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Flyer':      { bg: 'rgba(220,38,38,0.25)',   border: 'rgba(220,38,38,0.6)',   text: '#fca5a5', dot: '#dc2626' },
  'Main Base':  { bg: 'rgba(37,99,235,0.25)',   border: 'rgba(37,99,235,0.6)',   text: '#93c5fd', dot: '#2563eb' },
  'Side Base':  { bg: 'rgba(29,78,216,0.2)',    border: 'rgba(59,130,246,0.5)',  text: '#bfdbfe', dot: '#3b82f6' },
  'Back Spot':  { bg: 'rgba(124,58,237,0.25)',  border: 'rgba(124,58,237,0.6)',  text: '#c4b5fd', dot: '#7c3aed' },
  'Front Spot': { bg: 'rgba(109,40,217,0.2)',   border: 'rgba(139,92,246,0.5)', text: '#ddd6fe', dot: '#8b5cf6' },
  'Tumbler':    { bg: 'rgba(234,179,8,0.2)',    border: 'rgba(234,179,8,0.5)',  text: '#fde68a', dot: '#eab308' },
  'Front Row':  { bg: 'rgba(5,150,105,0.2)',    border: 'rgba(5,150,105,0.5)',  text: '#6ee7b7', dot: '#059669' },
  'Back Row':   { bg: 'rgba(4,120,87,0.2)',     border: 'rgba(4,120,87,0.5)',   text: '#a7f3d0', dot: '#047857' },
  'Left Side':  { bg: 'rgba(249,115,22,0.2)',   border: 'rgba(249,115,22,0.5)', text: '#fed7aa', dot: '#f97316' },
  'Right Side': { bg: 'rgba(234,88,12,0.2)',    border: 'rgba(234,88,12,0.5)',  text: '#ffedd5', dot: '#ea580c' },
  'Center':     { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)',text: '#e5e7eb', dot: '#9ca3af' },
}

function getRoleColor(role: string) {
  return roleColors[role] || roleColors['Center']
}

export default function RoutinePage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [activeSection, setActiveSection] = useState('Opener')
  const [placements, setPlacements] = useState<Record<string, PlacedAthlete[]>>({})
  const [routineName, setRoutineName] = useState('Starlings 2026')
  const [saved, setSaved] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('Flyer')
  const [pendingAthlete, setPendingAthlete] = useState<Athlete | null>(null)
  const floorRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAthletes() }, [])

  useEffect(() => {
    const stored = localStorage.getItem('cheerhub_routine_v2')
    if (stored) {
      const parsed = JSON.parse(stored)
      setRoutineName(parsed.routineName || 'Starlings 2026')
      setPlacements(parsed.placements || {})
    }
  }, [])

  async function loadAthletes() {
    const { data } = await supabase.from('athletes').select('id, name, position').order('name')
    if (data) setAthletes(data)
  }

  function currentPlacements(): PlacedAthlete[] {
    return placements[activeSection] || []
  }

  function placedIds(): Set<string> {
    return new Set(currentPlacements().map(p => p.athleteId))
  }

  // Click on floor to place selected athlete
  function handleFloorClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!pendingAthlete) return
    const rect = floorRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPlacement: PlacedAthlete = {
      athleteId: pendingAthlete.id,
      name: pendingAthlete.name,
      role: selectedRole,
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(4, Math.min(96, y)),
    }

    setPlacements(prev => ({
      ...prev,
      [activeSection]: [...(prev[activeSection] || []), newPlacement],
    }))
    setPendingAthlete(null)
  }

  // Drag placed athlete on the floor
  function handleAthleteMouseDown(e: React.MouseEvent, athleteId: string) {
    e.stopPropagation()
    setDraggingId(athleteId)

    const onMove = (me: MouseEvent) => {
      if (!floorRef.current) return
      const rect = floorRef.current.getBoundingClientRect()
      const x = Math.max(4, Math.min(96, ((me.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(4, Math.min(96, ((me.clientY - rect.top) / rect.height) * 100))

      setPlacements(prev => ({
        ...prev,
        [activeSection]: (prev[activeSection] || []).map(p =>
          p.athleteId === athleteId ? { ...p, x, y } : p
        ),
      }))
    }

    const onUp = () => {
      setDraggingId(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function removeFromFloor(athleteId: string) {
    setPlacements(prev => ({
      ...prev,
      [activeSection]: (prev[activeSection] || []).filter(p => p.athleteId !== athleteId),
    }))
  }

  function clearSection() {
    setPlacements(prev => ({ ...prev, [activeSection]: [] }))
  }

  function saveRoutine() {
    localStorage.setItem('cheerhub_routine_v2', JSON.stringify({ routineName, placements }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const placed = placedIds()
  const current = currentPlacements()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <input
            value={routineName}
            onChange={e => setRoutineName(e.target.value)}
            className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-red-500 focus:outline-none pb-0.5"
          />
          <p className="text-gray-400 text-sm mt-1">Click an athlete → select role → click on the floor to place</p>
        </div>
        <button onClick={saveRoutine}
          className="btn-red px-5 py-2 text-sm">
          {saved ? '✓ Saved!' : 'Save Routine'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSection === s
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                : 'card text-gray-400 hover:text-white hover:bg-gray-700'
            }`}>
            {s}
            {placements[s]?.length > 0 && (
              <span className="ml-2 bg-red-900/60 text-red-300 text-xs px-1.5 rounded-full">
                {placements[s].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left panel — roster + role picker */}
        <div className="xl:col-span-1 space-y-4">

          {/* Role selector */}
          <div className="card rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Select Role</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => {
                const c = getRoleColor(role)
                return (
                  <button key={role} onClick={() => setSelectedRole(role)}
                    style={selectedRole === role ? { background: c.bg, borderColor: c.border, color: c.text, border: '1px solid' } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedRole === role ? '' : 'card text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}>
                    {role}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pending placement indicator */}
          {pendingAthlete && (
            <div className="card border-red-700 rounded-2xl p-4 text-center bg-red-900/20">
              <p className="text-red-200 text-sm font-semibold">📍 Placing</p>
              <p className="text-white font-bold mt-1">{pendingAthlete.name}</p>
              <p className="text-red-300 text-xs mt-0.5">as {selectedRole}</p>
              <p className="text-gray-400 text-xs mt-2">Click anywhere on the floor</p>
              <button onClick={() => setPendingAthlete(null)}
                className="mt-2 text-xs text-gray-500 hover:text-red-400 transition">Cancel</button>
            </div>
          )}

          {/* Athlete roster */}
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-white font-bold text-sm">Roster</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {athletes.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">No athletes found.</p>
              ) : athletes.map((athlete, i) => {
                const isPlaced = placed.has(athlete.id)
                const isPending = pendingAthlete?.id === athlete.id
                return (
                  <div key={athlete.id}
                    onClick={() => !isPlaced && setPendingAthlete(isPending ? null : athlete)}
                    className={`flex items-center justify-between px-4 py-3 transition cursor-pointer ${
                      i < athletes.length - 1 ? 'border-b border-gray-700' : ''
                    } ${isPlaced ? 'opacity-40 cursor-default' : isPending ? 'bg-red-600/20' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isPending ? 'bg-red-600 text-white' : 'bg-white/10 text-white'
                      }`}>
                        {athlete.name.charAt(0)}
                      </div>
                      <span className="text-white text-sm">{athlete.name}</span>
                    </div>
                    {isPlaced
                      ? <span className="text-xs text-gray-500">On floor</span>
                      : isPending
                        ? <span className="text-xs text-red-400">Placing...</span>
                        : <span className="text-xs text-gray-500">+ Place</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="card rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Legend</p>
            <div className="space-y-1.5">
              {['Flyer', 'Main Base', 'Back Spot', 'Tumbler', 'Front Row'].map(role => {
                const c = getRoleColor(role)
                return (
                  <div key={role} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.dot }} />
                    <span className="text-xs text-gray-300">{role}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel — visual floor */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">{activeSection} — Floor View</h3>
            {current.length > 0 && (
              <button onClick={clearSection}
                className="text-xs text-gray-400 hover:text-red-400 transition px-3 py-1 bg-gray-700 rounded-lg">
                Clear section
              </button>
            )}
          </div>

          {/* The floor */}
          <div
            ref={floorRef}
            onClick={handleFloorClick}
            className={`relative rounded-2xl overflow-hidden select-none ${pendingAthlete ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{
              width: '100%',
              paddingBottom: '62%',
              background: 'linear-gradient(180deg, rgba(220,38,38,0.05) 0%, rgba(0,0,0,0.3) 100%)',
              border: pendingAthlete ? '2px dashed rgba(220,38,38,0.6)' : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Floor markings */}
            <div className="absolute inset-0">
              {/* Center line */}
              <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-white/5" />
              {/* Horizontal thirds */}
              <div className="absolute left-[10%] right-[10%] top-1/3 h-px bg-white/5" />
              <div className="absolute left-[10%] right-[10%] top-2/3 h-px bg-white/5" />
              {/* Border inner */}
              <div className="absolute inset-[8%] border border-white/5 rounded-xl" />
              {/* Floor label */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/10 text-xs font-semibold tracking-widest uppercase">
                Performance Floor
              </div>
              {/* Audience label */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/15 text-xs tracking-widest uppercase">
                Judges / Audience
              </div>
            </div>

            {/* Placed athletes */}
            {current.map(p => {
              const c = getRoleColor(p.role)
              const isDragging = draggingId === p.athleteId
              return (
                <div
                  key={p.athleteId}
                  onMouseDown={e => handleAthleteMouseDown(e, p.athleteId)}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isDragging ? 50 : 10,
                    userSelect: 'none',
                  }}
                  className="group"
                >
                  {/* Dot */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-transform group-hover:scale-110"
                    style={{
                      background: c.bg,
                      border: `2px solid ${c.border}`,
                      color: c.text,
                      boxShadow: `0 0 12px ${c.dot}40`,
                    }}
                  >
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Name label */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-center pointer-events-none"
                    style={{ minWidth: '60px' }}
                  >
                    <span className="text-white text-xs font-medium drop-shadow-lg block leading-tight">
                      {p.name.split(' ')[0]}
                    </span>
                    <span className="text-xs leading-tight block" style={{ color: c.text, fontSize: '10px' }}>
                      {p.role}
                    </span>
                  </div>
                  {/* Remove button */}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); removeFromFloor(p.athleteId) }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-xs items-center justify-center hidden group-hover:flex leading-none"
                    style={{ fontSize: '10px' }}
                  >×</button>
                </div>
              )
            })}

            {/* Empty state */}
            {current.length === 0 && !pendingAthlete && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-20">📍</div>
                  <p className="text-white/20 text-sm">Select an athlete from the roster,<br />then click to place them on the floor</p>
                </div>
              </div>
            )}

            {/* Placing hint */}
            {pendingAthlete && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-red-600/80 rounded-xl px-4 py-2">
                  <p className="text-white text-sm font-semibold">Click to place {pendingAthlete.name.split(' ')[0]}</p>
                </div>
              </div>
            )}
          </div>

          {/* Placed list summary */}
          {current.length > 0 && (
            <div className="mt-4 glass rounded-2xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">
                {activeSection} — {current.length} athlete{current.length !== 1 ? 's' : ''} placed
              </p>
              <div className="flex flex-wrap gap-2">
                {current.map(p => {
                  const c = getRoleColor(p.role)
                  return (
                    <div key={p.athleteId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                      {p.name.split(' ')[0]} · {p.role}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
