'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } },
      })
      if (error) { setError(error.message); setLoading(false) }
      else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setLoading(false); setMode('login')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 shadow-lg shadow-red-600/50">
            <span className="text-3xl">📣</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">CheerHub</h1>
          <p className="text-gray-400 mt-1 text-sm">Team Management Platform</p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl shadow-2xl overflow-hidden" style={{ borderColor: 'rgba(185,28,28,0.35)' }}>
          {/* Tabs */}
          <div className="flex border-b border-[rgba(60,60,80,0.5)]">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-red-600 text-white shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Coach Sarah Johnson" required className="input" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="coach@example.com" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} className="input" />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            {success && (
              <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-xl px-4 py-3">{success}</div>
            )}

            <button type="submit" disabled={loading} className="btn-red w-full py-3 text-sm uppercase tracking-wide">
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">CheerHub © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
