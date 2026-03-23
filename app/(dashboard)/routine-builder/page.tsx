'use client'

import { useState } from 'react'

const LEVELS = [
  { value: 'Level 1 – Beginner', desc: 'Basic stunts to prep, simple tumbling, no inversions' },
  { value: 'Level 2 – Novice', desc: 'Prep level stunts, back walkovers, no basket tosses' },
  { value: 'Level 3 – Intermediate', desc: 'Extended stunts, limited releases, back handsprings' },
  { value: 'Level 4 – Advanced', desc: 'Full extensions, inversions, standing tucks, basket tosses' },
  { value: 'Level 5 – Elite', desc: 'Advanced inversions, twisting releases, running fulls' },
  { value: 'Level 6 – World', desc: 'Double twisting tumbling, complex pyramids, elite stunting' },
]

const ALL_SECTIONS = ['Opener', 'Stunts', 'Pyramid', 'Tumbling Pass', 'Jumps', 'Dance', 'Cheer', 'Closer']

const FOCUS_OPTIONS = [
  'Maximize difficulty score',
  'Focus on synchronisation and timing',
  'Balance difficulty and execution',
  'Strong crowd engagement and energy',
  'Safe and clean execution first',
  'Showcase our best tumblers',
  'Showcase our best flyers',
]

export default function RoutineBuilderPage() {
  const [level, setLevel] = useState('')
  const [teamSize, setTeamSize] = useState('19')
  const [teamName, setTeamName] = useState('Starlings 2026')
  const [sections, setSections] = useState<string[]>(['Opener', 'Stunts', 'Pyramid', 'Tumbling Pass', 'Dance', 'Closer'])
  const [focus, setFocus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [routine, setRoutine] = useState('')
  const [error, setError] = useState('')

  function toggleSection(s: string) {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function generate() {
    if (!level) { setError('Please select a competition level.'); return }
    if (sections.length === 0) { setError('Please select at least one section.'); return }
    setError(''); setGenerating(true); setRoutine('')

    try {
      const res = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, teamSize: parseInt(teamSize), teamName, sections, focus }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setRoutine(data.routine)
    } catch {
      setError('Something went wrong. Check your API key in .env.local.')
    }
    setGenerating(false)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(routine)
  }

  // Format the AI response into readable blocks
  function formatRoutine(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={i} className="h-2" />

      // Main headers (lines starting with ## or all caps or ending with :)
      if (trimmed.startsWith('##') || trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const clean = trimmed.replace(/\*\*/g, '').replace(/^##\s*/, '')
        return (
          <div key={i} className="mt-5 mb-2">
            <h3 className="text-red-400 font-bold text-base uppercase tracking-wide border-b border-gray-700 pb-1">{clean}</h3>
          </div>
        )
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 text-gray-300 text-sm py-0.5">
            <span className="text-red-500 shrink-0 mt-0.5">•</span>
            <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
          </div>
        )
      }

      // Numbered points
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} className="flex gap-2 text-gray-300 text-sm py-0.5">
            <span className="text-red-400 font-bold shrink-0 w-5">{trimmed.match(/^\d+/)?.[0]}.</span>
            <span>{trimmed.replace(/^\d+\.\s*/, '')}</span>
          </div>
        )
      }

      // Bold inline text
      if (trimmed.includes('**')) {
        const parts = trimmed.split(/\*\*/)
        return (
          <p key={i} className="text-gray-300 text-sm py-0.5">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part)}
          </p>
        )
      }

      return <p key={i} className="text-gray-300 text-sm py-0.5">{trimmed}</p>
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">AI Routine Builder</h2>
        <p className="text-gray-400 text-sm mt-0.5">Set your competition level and let AI build a routine plan for your team</p>
      </div>

      <div className="card p-6 mb-5 space-y-6">
        {/* Team info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Team Name</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)}
              className="input" placeholder="Starlings 2026" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Number of Athletes</label>
            <input type="number" value={teamSize} onChange={e => setTeamSize(e.target.value)}
              className="input" min={1} max={40} />
          </div>
        </div>

        {/* Level selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Competition Level *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LEVELS.map(l => (
              <button key={l.value} onClick={() => setLevel(l.value)}
                className={`text-left px-4 py-3 rounded-xl border transition ${
                  level === l.value
                    ? 'bg-red-600/20 border-red-600 text-white shadow-sm shadow-red-600/20'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                }`}>
                <div className="font-semibold text-sm">{l.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Routine Sections to Include</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SECTIONS.map(s => (
              <button key={s} onClick={() => toggleSection(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  sections.includes(s)
                    ? 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Routine Focus (optional)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {FOCUS_OPTIONS.map(f => (
              <button key={f} onClick={() => setFocus(focus === f ? '' : f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  focus === f
                    ? 'bg-gray-600 border-gray-400 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <input value={focus} onChange={e => setFocus(e.target.value)}
            className="input text-sm" placeholder="Or type a custom focus / special notes..." />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <button onClick={generate} disabled={generating || !level}
          className="btn-red w-full py-3 text-sm uppercase tracking-wide">
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating routine...
            </span>
          ) : '✨ Generate AI Routine'}
        </button>
      </div>

      {/* Output */}
      {routine && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-bold text-lg">Generated Routine Plan</h3>
              <p className="text-gray-400 text-xs mt-0.5">{level} · {teamName} · {teamSize} athletes</p>
            </div>
            <button onClick={copyToClipboard}
              className="btn-grey px-4 py-2 text-xs">
              📋 Copy
            </button>
          </div>

          <div className="space-y-0.5">
            {formatRoutine(routine)}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700 flex gap-3">
            <button onClick={generate} disabled={generating}
              className="btn-red px-4 py-2 text-sm">
              ↺ Regenerate
            </button>
            <button onClick={() => setRoutine('')}
              className="btn-grey px-4 py-2 text-sm">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!routine && !generating && (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">✨</div>
          <p className="text-white font-semibold mb-1">Ready to build your routine</p>
          <p className="text-gray-400 text-sm">Select your competition level above and click Generate</p>
        </div>
      )}
    </div>
  )
}
