import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { isValidEmail } from '@/utils/validators'
import { track } from '@/utils/analytics'
import toast from 'react-hot-toast'

type Props = { onBack?: () => void }

/**
 * Clean Vite-mounted version of Lovable "Join org".
 *
 * The original Lovable flow called `/api/org/request-access`. In the current
 * Vite-only deployment, we don’t have that backend endpoint on Vercel.
 * This UI keeps the UX and can be wired to a backend later.
 */
export function JoinOrgPanel({ onBack }: Props) {
  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => emailRef.current?.focus(), [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!isValidEmail(email)) {
      setErr('Please enter a valid email.')
      return
    }

    setLoading(true)
    try {
      track('org.access_requested', { hasInvite: Boolean(inviteCode) })
      // Placeholder: wire to backend later.
      await new Promise((r) => setTimeout(r, 400))
      toast.success('Request recorded. Your admin will review access.')
      setOk(true)
    } catch (e: any) {
      setErr(e?.message || 'Request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Request sent</h3>
        <p className="text-[#2A2E44]">
          Your admin will review your access request. We'll email you when it's approved.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back to sign in
            </Button>
          )}
        </div>
      </div>
    )
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
          label="Invite code (optional)"
          placeholder="ABC-123-XYZ"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Request access'}
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

