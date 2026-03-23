'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Athlete = {
  id: string
  name: string
  age: number | null
  position: string
  email: string
  phone: string
  parent_name: string
  parent_phone: string
  injury_status: string
}

const emptyForm = (): Omit<Athlete, 'id'> => ({
  name: '',
  age: null,
  position: '',
  email: '',
  phone: '',
  parent_name: '',
  parent_phone: '',
  injury_status: 'Healthy',
})

const injuryColors: Record<string, string> = {
  Healthy: 'bg-green-600/20 text-green-400 border border-green-600/30',
  Injured: 'bg-red-600/20 text-red-400 border border-red-600/30',
  'Modified Training': 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
}

export default function MyTeamPage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('athletes').select('*').order('name')
    if (data) setAthletes(data)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editId) {
      await supabase.from('athletes').update(form).eq('id', editId)
    } else {
      await supabase.from('athletes').insert({ ...form, user_id: user.id })
    }

    setShowForm(false)
    setForm(emptyForm())
    setEditId(null)
    setSaving(false)
    load()
  }

  async function remove(id: string) {
    await supabase.from('athletes').delete().eq('id', id)
    setConfirmDelete(null)
    setExpanded(null)
    load()
  }

  function startEdit(a: Athlete) {
    setForm({
      name: a.name, age: a.age, position: a.position, email: a.email,
      phone: a.phone, parent_name: a.parent_name, parent_phone: a.parent_phone,
      injury_status: a.injury_status,
    })
    setEditId(a.id)
    setShowForm(true)
    setExpanded(null)
  }

  function field(key: keyof Omit<Athlete, 'id'>, label: string, type = 'text', placeholder = '') {
    return (
      <div key={key}>
        <label className="block text-xs text-gray-400 mb-1">{label}</label>
        <input
          type={type}
          placeholder={placeholder}
          value={(form as any)[key] ?? ''}
          onChange={e => setForm(prev => ({
            ...prev,
            [key]: type === 'number' ? (parseInt(e.target.value) || null) : e.target.value,
          }))}
          className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
    )
  }

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.position || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">My Team</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Starlings 2026 · {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm()); setEditId(null) }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
        >
          + Add Athlete
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input
          type="text"
          placeholder="Search by name or position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4 text-lg">
            {editId ? 'Edit Athlete' : 'Add New Athlete'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name', 'Full Name *', 'text', 'Athlete name')}
            {field('age', 'Age', 'number', '16')}
            {field('position', 'Position', 'text', 'e.g. Flyer, Base')}
            {field('email', 'Athlete Email', 'email', 'athlete@example.com')}
            {field('phone', 'Athlete Phone', 'text', '+27 82 000 0000')}
            {field('parent_name', 'Parent / Guardian Name', 'text', 'Parent name')}
            {field('parent_phone', 'Parent Phone', 'text', '+27 82 000 0000')}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Injury Status</label>
              <select
                value={form.injury_status}
                onChange={e => setForm(prev => ({ ...prev, injury_status: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option>Healthy</option>
                <option>Injured</option>
                <option>Modified Training</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Athlete'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm()); setEditId(null) }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Athlete list */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400">
            {search ? 'No athletes match your search.' : 'No athletes yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((athlete, i) => (
            <div key={athlete.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition"
                onClick={() => setExpanded(expanded === athlete.id ? null : athlete.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                    {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{athlete.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {[athlete.position, athlete.age ? `Age ${athlete.age}` : null].filter(Boolean).join(' · ') || 'No details yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium hidden sm:inline ${injuryColors[athlete.injury_status] || injuryColors['Healthy']}`}>
                    {athlete.injury_status}
                  </span>
                  <span className="text-gray-500 text-xs">{expanded === athlete.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === athlete.id && (
                <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Position', value: athlete.position },
                      { label: 'Age', value: athlete.age ? `${athlete.age}` : null },
                      { label: 'Email', value: athlete.email },
                      { label: 'Phone', value: athlete.phone },
                      { label: 'Parent / Guardian', value: athlete.parent_name },
                      { label: 'Parent Phone', value: athlete.parent_phone },
                    ].map(item => item.value ? (
                      <div key={item.label}>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className="text-white text-sm mt-0.5">{item.value}</p>
                      </div>
                    ) : null)}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Injury Status</p>
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${injuryColors[athlete.injury_status] || injuryColors['Healthy']}`}>
                        {athlete.injury_status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {confirmDelete === athlete.id ? (
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-red-400 text-sm">Remove {athlete.name}?</p>
                      <button onClick={() => remove(athlete.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition">
                        Yes, Remove
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm transition">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(athlete)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition">
                        ✏️ Edit
                      </button>
                      <button onClick={() => setConfirmDelete(athlete.id)}
                        className="bg-red-900/40 hover:bg-red-800/60 text-red-400 px-4 py-2 rounded-xl text-sm transition">
                        🗑 Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
