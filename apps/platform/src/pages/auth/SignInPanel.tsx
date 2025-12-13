import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { Divider } from '@/components/ui/Divider'
import { SSOButton } from '@/components/auth/SSOButton'
import { isValidEmail } from '@/utils/validators'
import { track } from '@/utils/analytics'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getPlatformOrigin } from '@/utils/platformOrigin'

export function SignInPanel() {
  const platformOrigin = getPlatformOrigin()
  const emailRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => emailRef.current?.focus(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (!isValidEmail(email)) {
      setErr('Please enter a valid email.')
      return
    }
    if (!useMagicLink && password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }

    try {
      setLoading(true)
      track('auth.signin_submitted', { useMagicLink, remember })

      if (useMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${platformOrigin}/login` },
        })
        if (error) throw error
        toast.success('Magic link sent. Check your email.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sso = async (provider: 'google' | 'microsoft' | 'okta') => {
    track('auth.sso_clicked', { provider })

    if (provider === 'okta') {
      toast('Okta/SAML coming soon for this deployment.')
      return
    }

    const supabaseProvider = provider === 'microsoft' ? 'azure' : 'google'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider as any,
      options: { redirectTo: `${platformOrigin}/login` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-3">
        <SSOButton provider="google" fullWidth onClick={() => void sso('google')} />
        <SSOButton provider="microsoft" fullWidth onClick={() => void sso('microsoft')} />
        <SSOButton provider="okta" fullWidth onClick={() => void sso('okta')} />
      </div>

      <Divider text="or" />

      <div className="grid gap-4">
        <Input
          ref={emailRef}
          type="email"
          label="Email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err && !isValidEmail(email) ? 'Invalid email' : undefined}
        />
        {!useMagicLink && (
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={err && password.length < 8 ? 'Minimum 8 characters' : undefined}
          />
        )}
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-[#6C54FF]"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => toast('Password reset is coming soon.')}
          >
            Forgot password?
          </button>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button type="button" variant="secondary" disabled={loading} className="w-full" onClick={() => setUseMagicLink((s) => !s)}>
            {useMagicLink ? 'Use password' : 'Use magic link'}
          </Button>
        </div>
      </div>
    </form>
  )
}

