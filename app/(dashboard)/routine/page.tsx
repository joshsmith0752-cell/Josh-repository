'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Athlete = { id: string; name: string; position?: string }

const SECTIONS = ['Opener', 'Stunts', 'Pyramid', 'Tumbling Pass', 'Dance', 'Cheer', 'Closer']

const POSITIONS = [
  'Base', 'Main Base', 'Side Base', 'Back Spot', 'Front Spot', 'Flyer',
  'Tumbler', 'Back Tumbler', 'Front Row', 'Back Row', 'Left Side', 'Right Side',
]

type Formation = Record<string, string> // athleteId -> position

export default function RoutinePage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [activeSection, setActiveSection] = useState('Opener')
  const [formations, setFormations] = useState<Record<string, Formation>>({})
  const [routineName, setRoutineName] = useState('2025 Routine')
  const [saved, setSaved] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => { loadAthletes() }, [])

  async function loadAthletes() {
    const { data } = await supabase.from('athletes').select('id, name, position').order('name')
    if (data) setAthletes(data)
  }

  function getFormation(section: string): Formation {
    return formations[section] || {}
  }

  function setPosition(section: string, athleteId: string, position: string) {
    setFormations(prev => ({
      ...prev,
      [section]: { ...getFormation(section), [athleteId]: position }
    }))
  }

  function removeFromSection(section: string, athleteId: string) {
    setFormations(prev => {
      const updated = { ...getFormation(section) }
      delete updated[athleteId]
      return { ...prev, [section]: updated }
    })
  }

  function getAthletePosition(section: string, athleteId: string) {
    return formations[section]?.[athleteId] || null
  }

  function athletesInSection(section: string) {
    const f = getFormation(section)
    return athletes.filter(a => f[a.id])
  }

  function unassignedAthletes(section: string) {
    const f = getFormation(section)
    return athletes.filter(a => !f[a.id])
  }

  function positionColor(pos: string) {
    if (pos.includes('Flyer')) return 'bg-red-600/30 border-red-500/50 text-red-200'
    if (pos.includes('Base')) return 'bg-blue-600/30 border-blue-500/50 text-blue-200'
    if (pos.includes('Spot')) return 'bg-purple-600/30 border-purple-500/50 text-purple-200'
    if (pos.includes('Tumbl')) return 'bg-yellow-600/30 border-yellow-500/50 text-yellow-200'
    return 'bg-gray-700 border-gray-600 text-gray-200'
  }

  function saveRoutine() {
    localStorage.setItem('cheerhub_routine', JSON.stringify({ routineName, formations }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    const saved = localStorage.getItem('cheerhub_routine')
    if (saved) {
      const parsed = JSON.parse(saved)
      setRoutineName(parsed.routineName || '2025 Routine')
      setFormations(parsed.formations || {})
    }
  }, [])

  const currentFormation = getFormation(activeSection)
  const assigned = athletesInSection(activeSection)
  const unassigned = unassignedAthletes(activeSection)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <input
            value={routineName}
            onChange={e => setRoutineName(e.target.value)}
            className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-gray-600 focus:border-red-500 focus:outline-none pb-0.5"
          />
          <p className="text-gray-400 text-sm mt-1">Assign athletes to positions for each section</p>
        </div>
        <button
          onClick={saveRoutine}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition"
        >
          {saved ? '✓ Saved!' : 'Save Routine'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSection === s
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {s}
            {formations[s] && Object.keys(formations[s]).length > 0 && (
              <span className="ml-2 bg-red-900/60 text-red-300 text-xs px-1.5 rounded-full">
                {Object.keys(formations[s]).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Formation board */}
        <div>
          <h3 className="text-white font-bold mb-3">{activeSection} — Formation</h3>
          {assigned.length === 0 ? (
            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">No athletes assigned yet.<br />Pick from the roster on the right.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assigned.map(athlete => {
                const pos = currentFormation[athlete.id]
                return (
                  <div key={athlete.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${positionColor(pos)}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-900/50 rounded-full flex items-center justify-center text-sm font-bold">
                        {athlete.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{athlete.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={pos}
                        onChange={e => setPosition(activeSection, athlete.id, e.target.value)}
                        className="bg-gray-900/60 border border-gray-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <button
                        onClick={() => removeFromSection(activeSection, athlete.id)}
                        className="text-gray-500 hover:text-red-400 transition text-lg leading-none"
                      >×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Position legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'Flyer', cls: 'bg-red-600/20 text-red-300 border border-red-600/30' },
              { label: 'Base', cls: 'bg-blue-600/20 text-blue-300 border border-blue-600/30' },
              { label: 'Spotter', cls: 'bg-purple-600/20 text-purple-300 border border-purple-600/30' },
              { label: 'Tumbler', cls: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' },
            ].map(l => (
              <span key={l.label} className={`text-xs px-2 py-0.5 rounded-full ${l.cls}`}>{l.label}</span>
            ))}
          </div>
        </div>

        {/* Roster panel */}
        <div>
          <h3 className="text-white font-bold mb-3">Roster — Add to {activeSection}</h3>
          {athletes.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">No athletes found. Add athletes to the Roster first.</p>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              {athletes.map((athlete, i) => {
                const isAssigned = !!currentFormation[athlete.id]
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center justify-between px-4 py-3 transition ${
                      i < athletes.length - 1 ? 'border-b border-gray-700' : ''
                    } ${isAssigned ? 'opacity-40' : 'hover:bg-gray-700/40'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {athlete.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-white text-sm font-medium">{athlete.name}</span>
                        {athlete.position && (
                          <span className="text-gray-500 text-xs ml-2">{athlete.position}</span>
                        )}
                      </div>
                    </div>
                    {isAssigned ? (
                      <span className="text-xs text-gray-500">Assigned</span>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) setPosition(activeSection, athlete.id, e.target.value)
                          e.target.value = ''
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>+ Assign</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
