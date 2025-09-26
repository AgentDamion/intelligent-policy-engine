import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { RadioCard } from '@/components/auth/RadioCard';
import { RoleChip } from '@/components/auth/RoleChip';
import { Modal } from '@/components/ui/Modal';
import type { CreateOrgPayload, OrgType, RoleKey } from '@/types/auth';
import { createOrg } from '@/services/auth.api';
import { track } from '@/utils/analytics';

const REGIONS = [
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'apac', label: 'APAC' },
];

type Props = { onBack?: () => void };

export function CreateOrgPanel({ onBack }: Props) {
  const orgNameRef = useRef<HTMLInputElement>(null);

  const [orgType, setOrgType] = useState<OrgType>('enterprise');
  const [orgName, setOrgName] = useState('');
  const [region, setRegion] = useState('us');
  const [emailDomain, setEmailDomain] = useState('');
  const [enableSSO, setEnableSSO] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<'google' | 'microsoft' | 'okta' | undefined>();
  const [roles, setRoles] = useState<RoleKey[]>(['admin']);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => orgNameRef.current?.focus(), []);

  const toggleRole = (r: RoleKey) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const ready = useMemo(() => {
    if (!orgName.trim()) return false;
    if (enableSSO && !ssoProvider) return false;
    return true;
  }, [orgName, enableSSO, ssoProvider]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setErr(null);
    setLoading(true);

    const payload: CreateOrgPayload = {
      orgName: orgName.trim(),
      region,
      emailDomain: emailDomain.trim() || undefined,
      enableSSO,
      ssoProvider,
      orgType,
      initialRoles: roles,
    };

    try {
      track('org.type_selected', { type: orgType });
      track('org.sso_enabled', { enabled: enableSSO, provider: ssoProvider || null });
      const res = await createOrg(payload);
      track('org.created', { orgId: res?.orgId || null });
      setSuccess(true);
    } catch (e: any) {
      setErr(e?.message || 'Could not create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-6" noValidate>
        {/* Org Type */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-[#2A2E44]">Organization type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <RadioCard
              value="enterprise"
              selected={orgType === 'enterprise'}
              onSelect={setOrgType}
              title="Enterprise"
              subtitle="You manage partners and approvals."
            />
            <RadioCard
              value="partner"
              selected={orgType === 'partner'}
              onSelect={setOrgType}
              title="Partner"
              subtitle="You work for multiple clients."
            />
            <RadioCard
              value="both"
              selected={orgType === 'both'}
              onSelect={setOrgType}
              title="Both"
              subtitle="Enable context switching."
            />
          </div>
        </section>

        {/* Org Details */}
        <section className="grid gap-4">
          <h3 className="text-sm font-medium text-[#2A2E44]">Organization details</h3>
          <Input
            ref={orgNameRef}
            label="Organization name"
            placeholder="Acme Health"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <Select
            label="Region"
            options={REGIONS}
            value={region}
            onChange={setRegion}
          />
          <Input
            label="Email domain (optional)"
            placeholder="acme.com"
            value={emailDomain}
            onChange={(e) => setEmailDomain(e.target.value)}
            hint="Restrict signups to this domain (optional)."
          />
          <div className="flex items-center gap-3">
            <Toggle checked={enableSSO} onChange={setEnableSSO} label="Enable SSO" />
            {enableSSO && (
              <Select
                label="SSO provider"
                options={[
                  { value: 'google', label: 'Google' },
                  { value: 'microsoft', label: 'Microsoft' },
                  { value: 'okta', label: 'Okta (SAML)' },
                ]}
                value={ssoProvider}
                onChange={(v) => setSsoProvider(v as any)}
              />
            )}
          </div>
        </section>

        {/* Roles */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-[#2A2E44]">Initial roles</h3>
          <div className="flex flex-wrap gap-2">
            <RoleChip
              role="admin"
              selected={roles.includes('admin')}
              onToggle={toggleRole}
              tooltip="Full governance + billing"
            />
            <RoleChip
              role="reviewer"
              selected={roles.includes('reviewer')}
              onToggle={toggleRole}
              tooltip="Approves tools and policies"
            />
            <RoleChip
              role="partnerLead"
              selected={roles.includes('partnerLead')}
              onToggle={toggleRole}
              tooltip="Submits tools and manages client assignments"
            />
          </div>
        </section>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={!ready} loading={loading}>
            Create organization
          </Button>
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack}>
              Back to sign in
            </Button>
          )}
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        open={success}
        title="Organization created"
        onClose={() => {
          setSuccess(false);
          window.location.assign('/auth/mfa'); // next step: MFA config
        }}
        actions={
          <>
            <Button
              variant="primary"
              onClick={() => window.location.assign('/auth/mfa')}
            >
              Configure MFA
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign('/org/invite')}
            >
              Invite teammates
            </Button>
          </>
        }
      >
        <p className="text-[#2A2E44]">
          Next steps: enable multi‑factor authentication and invite your team.
        </p>
      </Modal>
    </>
  );
}