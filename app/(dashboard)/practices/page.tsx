'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Block = { id: string; label: string; duration_minutes: number; notes: string; sort_order: number }
type Practice = { id: string; title: string; date: string; notes: string; is_template: boolean; blocks?: Block[] }

const DEFAULT_BLOCKS = [
  { label: 'Warm Up', duration_minutes: 10, notes: '', sort_order: 0 },
  { label: 'Stunts', duration_minutes: 25, notes: '', sort_order: 1 },
  { label: 'Tumbling', duration_minutes: 20, notes: '', sort_order: 2 },
  { label: 'Routine Run', duration_minutes: 20, notes: '', sort_order: 3 },
  { label: 'Cool Down', duration_minutes: 5, notes: '', sort_order: 4 },
]

const BLOCK_COLORS = [
  'border-l-red-500', 'border-l-blue-500', 'border-l-yellow-500',
  'border-l-green-500', 'border-l-purple-500', 'border-l-orange-500',
]

export default function PracticesPage() {
  const supabase = createClient()
  const [practices, setPractices] = useState<Practice[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'sessions' | 'templates'>('sessions')

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS.map((b, i) => ({ ...b, id: `new_${i}` })))

  useEffect(() => { load() }, [])

  async function load() {
    const { data: ps } = await supabase.from('practices').select('*').order('date', { ascending: false })
    if (!ps) return
    const withBlocks = await Promise.all(ps.map(async p => {
      const { data: bl } = await supabase.from('practice_blocks').select('*').eq('practice_id', p.id).order('sort_order')
      return { ...p, blocks: bl || [] }
    }))
    setPractices(withBlocks)
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: practice } = await supabase.from('practices')
      .insert({ title, date: isTemplate ? null : date, notes, is_template: isTemplate, user_id: user.id })
      .select().single()

    if (practice) {
      const blockRows = blocks.filter(b => b.label.trim()).map((b, i) => ({
        practice_id: practice.id, label: b.label,
        duration_minutes: b.duration_minutes, notes: b.notes, sort_order: i,
      }))
      if (blockRows.length > 0) await supabase.from('practice_blocks').insert(blockRows)
    }

    setShowForm(false); resetForm(); setSaving(false); load()
  }

  function resetForm() {
    setTitle(''); setDate(new Date().toISOString().split('T')[0])
    setNotes(''); setIsTemplate(false)
    setBlocks(DEFAULT_BLOCKS.map((b, i) => ({ ...b, id: `new_${i}` })))
  }

  async function deletePractice(id: string) {
    if (!confirm('Delete this practice?')) return
    await supabase.from('practice_blocks').delete().eq('practice_id', id)
    await supabase.from('practices').delete().eq('id', id)
    load()
  }

  function addBlock() {
    setBlocks(prev => [...prev, { id: `new_${Date.now()}`, label: '', duration_minutes: 15, notes: '', sort_order: prev.length }])
  }

  function updateBlock(id: string, key: string, value: any) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [key]: value } : b))
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  function totalMinutes(blocks: any[]) {
    return blocks.reduce((acc, b) => acc + (b.duration_minutes || 0), 0)
  }

  const filtered = practices.filter(p => tab === 'templates' ? p.is_template : !p.is_template)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Practice Planner</h2>
          <p className="text-gray-400 text-sm mt-0.5">Plan sessions and save reusable templates</p>
        </div>
        <button onClick={() => { setShowForm(true); resetForm() }} className="btn-red px-4 py-2 text-sm">
          + New Practice
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800 rounded-xl mb-5 w-fit">
        {(['sessions', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${
              tab === t ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'text-gray-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* New Practice Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-white font-bold mb-4 text-lg">New Practice Plan</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Tuesday Stunt Practice" />
            </div>
            {!isTemplate && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setIsTemplate(!isTemplate)}
              className={`w-10 h-6 rounded-full transition-colors relative ${isTemplate ? 'bg-red-600' : 'bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isTemplate ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-300">Save as reusable template</span>
          </div>

          {/* Blocks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                Practice Blocks · {totalMinutes(blocks)} min total
              </label>
              <button onClick={addBlock} className="text-xs text-red-400 hover:text-red-300 transition">+ Add Block</button>
            </div>
            <div className="space-y-2">
              {blocks.map((block, i) => (
                <div key={block.id} className={`bg-gray-800 border-l-4 ${BLOCK_COLORS[i % BLOCK_COLORS.length]} rounded-r-xl p-3`}>
                  <div className="flex gap-2 items-center">
                    <input value={block.label} onChange={e => updateBlock(block.id, 'label', e.target.value)}
                      placeholder="Block name" className="input flex-1 py-1.5 text-sm" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={block.duration_minutes}
                        onChange={e => updateBlock(block.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                        className="input w-16 py-1.5 text-sm text-center" min={1} />
                      <span className="text-gray-500 text-xs">min</span>
                    </div>
                    <button onClick={() => removeBlock(block.id)} className="text-gray-600 hover:text-red-400 transition text-lg leading-none">×</button>
                  </div>
                  <input value={block.notes} onChange={e => updateBlock(block.id, 'notes', e.target.value)}
                    placeholder="Notes for this block..." className="input mt-2 py-1.5 text-xs text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Session Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Overall session notes..." className="input resize-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !title.trim()} className="btn-red px-6 py-2.5 text-sm">
              {saving ? 'Saving...' : 'Save Practice'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-grey px-6 py-2.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Practice list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-white font-semibold mb-1">{tab === 'templates' ? 'No templates yet' : 'No sessions planned yet'}</p>
          <p className="text-gray-400 text-sm">Create your first {tab === 'templates' ? 'template' : 'practice plan'} above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(practice => (
            <div key={practice.id} className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/20 transition"
                onClick={() => setExpanded(expanded === practice.id ? null : practice.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center text-xl shrink-0">📋</div>
                  <div>
                    <p className="text-white font-semibold">{practice.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {practice.is_template ? 'Template' : practice.date
                        ? new Date(practice.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                        : '—'}
                      {practice.blocks && practice.blocks.length > 0 && ` · ${totalMinutes(practice.blocks)} min · ${practice.blocks.length} blocks`}
                    </p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">{expanded === practice.id ? '▲' : '▼'}</span>
              </div>

              {expanded === practice.id && (
                <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                  {practice.blocks && practice.blocks.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {practice.blocks.map((block, i) => (
                        <div key={block.id} className={`bg-gray-800 border-l-4 ${BLOCK_COLORS[i % BLOCK_COLORS.length]} rounded-r-xl px-4 py-3`}>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">{block.label}</span>
                            <span className="text-gray-400 text-xs">{block.duration_minutes} min</span>
                          </div>
                          {block.notes && <p className="text-gray-500 text-xs mt-1">{block.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {practice.notes && (
                    <div className="bg-gray-800 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Session Notes</p>
                      <p className="text-gray-300 text-sm">{practice.notes}</p>
                    </div>
                  )}
                  <button onClick={() => deletePractice(practice.id)}
                    className="bg-red-900/30 hover:bg-red-900/60 text-red-400 font-semibold px-4 py-2 rounded-xl text-sm transition">
                    🗑 Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
