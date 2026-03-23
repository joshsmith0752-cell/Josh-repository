'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Athlete = { id: string; name: string }
type SkillStatus = 'Not Started' | 'In Progress' | 'Achieved'
type Skill = { id: string; athlete_id: string; category: string; skill_name: string; status: SkillStatus }

const CATEGORIES = {
  Tumbling: ['Forward Roll', 'Cartwheel', 'Round Off', 'Back Walkover', 'Back Handspring', 'Tuck', 'Pike', 'Layout', 'Full Twist'],
  Stunting: ['Prep Level', 'Extension', 'Lib', 'Heel Stretch', 'Scorpion', 'Bow & Arrow', 'Rewind', 'Tick Tock'],
  Jumps: ['Spread Eagle', 'Toe Touch', 'Herkie', 'Pike', 'Hurdler', 'Double Hook', 'Right/Left Side Hurdler'],
  Pyramids: ['2-High Pyramid', 'Connected Lib', 'Suspended Roll', 'Twisting Dismount'],
  Dance: ['Kick Line', 'Routine Choreo', 'Arm Motions', 'Crowd Leading'],
}

const statusStyles: Record<SkillStatus, string> = {
  'Not Started': 'bg-gray-700 text-gray-300',
  'In Progress': 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/40',
  'Achieved': 'bg-green-600/30 text-green-300 border border-green-600/40',
}

const nextStatus: Record<SkillStatus, SkillStatus> = {
  'Not Started': 'In Progress',
  'In Progress': 'Achieved',
  'Achieved': 'Not Started',
}

export default function SkillsPage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [activeCategory, setActiveCategory] = useState('Tumbling')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadAthletes() }, [])
  useEffect(() => { if (selectedAthlete) loadSkills(selectedAthlete) }, [selectedAthlete])

  async function loadAthletes() {
    const { data } = await supabase.from('athletes').select('id, name').order('name')
    if (data) {
      setAthletes(data)
      if (data.length > 0) setSelectedAthlete(data[0].id)
    }
  }

  async function loadSkills(athleteId: string) {
    setLoading(true)
    const { data } = await supabase.from('skills').select('*').eq('athlete_id', athleteId)
    if (data) setSkills(data)
    setLoading(false)
  }

  function getSkillStatus(athleteId: string, category: string, skillName: string): SkillStatus {
    const s = skills.find(s => s.athlete_id === athleteId && s.category === category && s.skill_name === skillName)
    return s?.status ?? 'Not Started'
  }

  async function toggleSkill(category: string, skillName: string) {
    if (!selectedAthlete) return
    const current = getSkillStatus(selectedAthlete, category, skillName)
    const next = nextStatus[current]

    const existing = skills.find(s => s.athlete_id === selectedAthlete && s.category === category && s.skill_name === skillName)

    if (existing) {
      await supabase.from('skills').update({ status: next }).eq('id', existing.id)
      setSkills(prev => prev.map(s => s.id === existing.id ? { ...s, status: next } : s))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('skills')
        .insert({ athlete_id: selectedAthlete, category, skill_name: skillName, status: next, user_id: user!.id })
        .select().single()
      if (data) setSkills(prev => [...prev, data])
    }
  }

  function categoryProgress(category: string) {
    const skillNames = CATEGORIES[category as keyof typeof CATEGORIES]
    const achieved = skillNames.filter(s => getSkillStatus(selectedAthlete!, category, s) === 'Achieved').length
    return { achieved, total: skillNames.length }
  }

  const selectedName = athletes.find(a => a.id === selectedAthlete)?.name

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Skills Tracker</h2>
        <p className="text-gray-400 text-sm mt-0.5">Tap a skill to cycle: Not Started → In Progress → Achieved</p>
      </div>

      {/* Athlete selector */}
      {athletes.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">No athletes found. Add athletes to the Roster first.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            {athletes.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAthlete(a.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  selectedAthlete === a.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          {selectedAthlete && !loading && (
            <>
              {/* Category tabs */}
              <div className="flex gap-2 flex-wrap mb-5">
                {Object.keys(CATEGORIES).map(cat => {
                  const { achieved, total } = categoryProgress(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        activeCategory === cat
                          ? 'bg-gray-700 text-white border border-gray-500'
                          : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                      <span className={`text-xs ${achieved === total ? 'text-green-400' : 'text-gray-500'}`}>
                        {achieved}/{total}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Overall progress bar */}
              {(() => {
                const total = Object.values(CATEGORIES).flat().length
                const achieved = Object.entries(CATEGORIES).reduce((acc, [cat, skillNames]) =>
                  acc + skillNames.filter(s => getSkillStatus(selectedAthlete, cat, s) === 'Achieved').length, 0)
                const pct = Math.round((achieved / total) * 100)
                return (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{selectedName}'s overall progress</span>
                      <span>{achieved}/{total} skills achieved ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}

              {/* Skills grid */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700">
                  <h3 className="text-white font-bold">{activeCategory}</h3>
                </div>
                {CATEGORIES[activeCategory as keyof typeof CATEGORIES].map((skillName, i, arr) => {
                  const status = getSkillStatus(selectedAthlete, activeCategory, skillName)
                  return (
                    <div
                      key={skillName}
                      onClick={() => toggleSkill(activeCategory, skillName)}
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/40 transition ${
                        i < arr.length - 1 ? 'border-b border-gray-700' : ''
                      }`}
                    >
                      <span className="text-white text-sm">{skillName}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
                        {status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
