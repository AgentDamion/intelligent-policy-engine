import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { SSOButton } from '@/components/auth/SSOButton';
import { startOAuth, startSAML, signIn } from '@/services/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/validators';
import { track } from '@/utils/analytics';

export function SignInPanel() {
  const emailRef = useRef<HTMLInputElement>(null);
  const { setSession } = useAuth() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => emailRef.current?.focus(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!isValidEmail(email)) {
      setErr('Please enter a valid email.');
      return;
    }
    if (!useMagicLink && password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      track('auth.signin_submitted', { useMagicLink, remember });

      const session = await signIn({ email, password, useMagicLink, remember });
      setSession(session);

      if (session?.mfaRequired) {
        window.location.assign('/auth/mfa');
        return;
      }
      window.location.assign('/'); // to Home/Dashboard
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sso = async (provider: 'google' | 'microsoft' | 'okta') => {
    track('auth.sso_clicked', { provider });
    if (provider === 'okta') return startSAML();
    return startOAuth(provider as 'google' | 'microsoft');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-3">
        <SSOButton provider="google" fullWidth onClick={() => sso('google')} />
        <SSOButton provider="microsoft" fullWidth onClick={() => sso('microsoft')} />
        <SSOButton provider="okta" fullWidth onClick={() => sso('okta')} />
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
            onClick={() => alert('Reset link sent (stub).')}
          >
            Forgot password?
          </button>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Sign in
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setUseMagicLink((s) => !s)}
          >
            {useMagicLink ? 'Use password' : 'Use magic link'}
          </Button>
        </div>
      </div>
    </form>
  );
}