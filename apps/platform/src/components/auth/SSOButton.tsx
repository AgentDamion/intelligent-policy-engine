import React from 'react'
import { Button } from '@/components/ui/button'

export interface SSOButtonProps {
  provider: 'google' | 'microsoft' | 'okta'
  onClick: () => void
  fullWidth?: boolean
}

const providerConfig = {
  google: { label: 'Continue with Google' },
  microsoft: { label: 'Continue with Microsoft' },
  okta: { label: 'Continue with Okta (SAML)' },
} as const

export const SSOButton: React.FC<SSOButtonProps> = ({ provider, onClick, fullWidth = false }) => {
  const config = providerConfig[provider]
  return (
    <Button variant="secondary" onClick={onClick} className={fullWidth ? 'w-full' : ''} aria-label={config.label}>
      {config.label}
    </Button>
  )
}

