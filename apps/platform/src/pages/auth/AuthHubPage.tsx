import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/Segmented'
import { TeaserCard } from '@/components/auth/TeaserCard'
import { CreateOrgPanel } from './CreateOrgPanel'
import { SignInPanel } from './SignInPanel'
import { JoinOrgPanel } from './JoinOrgPanel'

export default function AuthHubPage() {
  const [mode, setMode] = useState<'signin' | 'create' | 'join'>('signin')

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[480px_1fr] bg-[#F7F8FC] text-[#0F1222]">
      {/* Left / Brand Panel */}
      <aside className="hidden lg:flex flex-col gap-8 p-12 border-r border-[#E7E9F2] bg-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            AI
          </div>
          <span className="text-lg font-semibold">aicomplyr.io</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold">Welcome to aicomplyr.io</h1>
          <p className="text-[#6B7190] mt-2">Sign in to manage governance workflows and agent-powered compliance.</p>
        </div>

        <TeaserCard
          title="Security posture check (preview)"
          body="We’ll evaluate auth + org setup and suggest hardening steps."
          status="neutral"
        />

        <div className="mt-auto text-sm text-[#6B7190]">
          By continuing, you agree to our <a className="underline" href="/legal/terms">Terms</a> &{' '}
          <a className="underline" href="/legal/privacy">Privacy</a>.
        </div>
      </aside>

      {/* Right / Auth Card */}
      <main className="flex items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <div className="px-6 pt-6">
            <Segmented
              ariaLabel="Authentication steps"
              items={[
                { key: 'signin', label: 'Sign in' },
                { key: 'create', label: 'Create org' },
                { key: 'join', label: 'Join org' },
              ]}
              value={mode}
              onChange={(k) => setMode(k as any)}
            />
          </div>

          <div className="p-6">
            {mode === 'signin' && <SignInPanel />}
            {mode === 'create' && <CreateOrgPanel onBack={() => setMode('signin')} />}
            {mode === 'join' && <JoinOrgPanel onBack={() => setMode('signin')} />}
          </div>
        </Card>
      </main>
    </div>
  )
}

