'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Competition = {
  id: string
  name: string
  date: string
  location: string
  division: string
  score: number | null
  placement: string
  judges_notes: string
}

const empty = (): Omit<Competition, 'id'> => ({
  name: '', date: '', location: '', division: '',
  score: null, placement: '', judges_notes: '',
})

export default function CompetitionsPage() {
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('competitions').select('*').order('date', { ascending: false })
    if (data) setCompetitions(data)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editId) {
      await supabase.from('competitions').update(form).eq('id', editId)
    } else {
      await supabase.from('competitions').insert({ ...form, user_id: user.id })
    }

    setShowForm(false)
    setForm(empty())
    setEditId(null)
    setSaving(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this competition?')) return
    await supabase.from('competitions').delete().eq('id', id)
    load()
  }

  function startEdit(c: Competition) {
    setForm({ name: c.name, date: c.date, location: c.location, division: c.division,
      score: c.score, placement: c.placement, judges_notes: c.judges_notes })
    setEditId(c.id)
    setShowForm(true)
  }

  function placementColor(p: string) {
    if (p === '1st') return 'text-yellow-400'
    if (p === '2nd') return 'text-gray-300'
    if (p === '3rd') return 'text-orange-400'
    return 'text-white'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Competition Log</h2>
          <p className="text-gray-400 text-sm mt-0.5">{competitions.length} competition{competitions.length !== 1 ? 's' : ''} logged</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(empty()); setEditId(null) }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
        >
          + Add Competition
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4">{editId ? 'Edit' : 'New'} Competition</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Competition Name', key: 'name', type: 'text', placeholder: 'Nationals 2025' },
              { label: 'Date', key: 'date', type: 'date', placeholder: '' },
              { label: 'Location', key: 'location', type: 'text', placeholder: 'Orlando, FL' },
              { label: 'Division', key: 'division', type: 'text', placeholder: 'L5 Senior Coed' },
              { label: 'Score', key: 'score', type: 'number', placeholder: '94.5' },
              { label: 'Placement', key: 'placement', type: 'text', placeholder: '1st' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as any)[field.key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || null : e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-1">Judge's Notes</label>
            <textarea
              rows={3}
              placeholder="Notes from judges..."
              value={form.judges_notes}
              onChange={e => setForm(prev => ({ ...prev, judges_notes: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving || !form.name}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-xl text-sm transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {competitions.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-400">No competitions logged yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map(c => (
            <div key={c.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <div className="text-white font-bold">{c.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {c.date ? new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {c.location || '—'} · {c.division || '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.placement && (
                    <span className={`font-extrabold text-lg ${placementColor(c.placement)}`}>{c.placement}</span>
                  )}
                  {c.score != null && (
                    <span className="text-gray-300 text-sm font-medium">{c.score} pts</span>
                  )}
                  <span className="text-gray-500 text-xs">{expanded === c.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                  {c.judges_notes ? (
                    <div className="bg-gray-900 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Judge's Notes</p>
                      <p className="text-gray-300 text-sm">{c.judges_notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No judge's notes.</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition">
                      Edit
                    </button>
                    <button onClick={() => remove(c.id)}
                      className="bg-red-900/50 hover:bg-red-800 text-red-300 px-4 py-2 rounded-xl text-sm transition">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
