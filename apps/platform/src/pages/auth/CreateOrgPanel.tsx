import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { isValidEmail } from '@/utils/validators'
import { track } from '@/utils/analytics'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

type Props = { onBack?: () => void }

/**
 * Clean Vite-mounted version of Lovable "Create org".
 *
 * In the current platform, org creation happens in `/onboarding` after auth.
 * This panel signs the user up, then routes them into onboarding.
 */
export function CreateOrgPanel({ onBack }: Props) {
  const emailRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => emailRef.current?.focus(), [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (!isValidEmail(email)) {
      setErr('Please enter a valid email.')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      track('auth.signup_submitted')
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // If email confirmation is enabled, there may be no session yet.
      if (!data.session) {
        toast.success('Account created! Check your email to verify, then sign in.')
        onBack?.()
        return
      }

      toast.success('Account created! Let’s set up your organization.')
      navigate('/onboarding')
    } catch (e: any) {
      setErr(e?.message || 'Could not create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-4">
        <Input
          ref={emailRef}
          type="email"
          label="Work email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err && !isValidEmail(email) ? 'Invalid email' : undefined}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={err && password.length < 8 ? 'Minimum 8 characters' : undefined}
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            Back to sign in
          </Button>
        )}
      </div>
    </form>
  )
}

