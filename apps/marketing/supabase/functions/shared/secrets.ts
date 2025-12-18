export type SecretScope = 'global' | 'enterprise' | 'partner'

export interface SecretDescriptor {
  key: string
  scope: SecretScope
  enterpriseId?: string
  partnerId?: string
}

export interface SecretsBroker {
  getSecret(descriptor: SecretDescriptor): Promise<string | null>
  setSecret?(descriptor: SecretDescriptor, value: string): Promise<void>
  deleteSecret?(descriptor: SecretDescriptor): Promise<void>
  rotateSecret?(descriptor: SecretDescriptor): Promise<string | null>
}

class EnvSecretsBroker implements SecretsBroker {
  async getSecret(descriptor: SecretDescriptor): Promise<string | null> {
    const candidates = this.buildEnvKeys(descriptor)
    for (const key of candidates) {
      const value = Deno.env.get(key)
      if (value) return value
    }
    return null
  }

  async setSecret(): Promise<void> {
    throw new Error('EnvSecretsBroker.setSecret is not supported in local mode')
  }

  async deleteSecret(): Promise<void> {
    throw new Error('EnvSecretsBroker.deleteSecret is not supported in local mode')
  }

  async rotateSecret(descriptor: SecretDescriptor): Promise<string | null> {
    const existing = await this.getSecret(descriptor)
    if (!existing) return null
    return existing
  }

  private buildEnvKeys(descriptor: SecretDescriptor): string[] {
    const normalizedKey = descriptor.key.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const keys: string[] = []
    if (descriptor.scope === 'enterprise' && descriptor.enterpriseId) {
      keys.push(`ENTERPRISE_${descriptor.enterpriseId.toUpperCase()}_${normalizedKey}`)
    }
    if (descriptor.scope === 'partner' && descriptor.partnerId) {
      keys.push(`PARTNER_${descriptor.partnerId.toUpperCase()}_${normalizedKey}`)
    }
    keys.push(`GLOBAL_${normalizedKey}`)
    return keys
  }
}

let cachedBroker: SecretsBroker | null = null

export function createSecretsBroker(): SecretsBroker {
  if (cachedBroker) return cachedBroker
  // Future: swap with external vault implementation via feature flag/env.
  cachedBroker = new EnvSecretsBroker()
  return cachedBroker
}

