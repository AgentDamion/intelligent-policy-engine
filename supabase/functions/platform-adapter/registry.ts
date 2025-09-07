import { PlatformAdapter, PlatformConfig, PlatformCapabilities } from './interface.ts'

export class PlatformRegistry {
  private static instance: PlatformRegistry
  private adapters = new Map<string, PlatformAdapter>()
  private configs = new Map<string, PlatformConfig>()
  private capabilities = new Map<string, PlatformCapabilities>()

  private constructor() {}

  public static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry()
    }
    return PlatformRegistry.instance
  }

  registerAdapter(adapter: PlatformAdapter): void {
    const name = adapter.platformName.toLowerCase()
    this.adapters.set(name, adapter)
    this.configs.set(name, adapter.config)
    this.capabilities.set(name, adapter.getCapabilities())
  }

  unregisterAdapter(platformName: string): boolean {
    const name = platformName.toLowerCase()
    const removed = this.adapters.delete(name)
    this.configs.delete(name)
    this.capabilities.delete(name)
    return removed
  }

  getAdapter(platformName: string): PlatformAdapter | undefined {
    return this.adapters.get(platformName.toLowerCase())
  }

  getConfig(platformName: string): PlatformConfig | undefined {
    return this.configs.get(platformName.toLowerCase())
  }

  getCapabilities(platformName: string): PlatformCapabilities | undefined {
    return this.capabilities.get(platformName.toLowerCase())
  }

  listPlatforms(): string[] {
    return Array.from(this.adapters.keys())
  }

  listPlatformsByCapability(capability: keyof PlatformCapabilities): string[] {
    const res: string[] = []
    for (const [name, caps] of this.capabilities.entries()) {
      if ((caps as any)[capability] === true) res.push(name)
    }
    return res
  }

  supportsFeature(platformName: string, feature: string): boolean {
    const caps = this.getCapabilities(platformName)
    return Boolean(caps?.features?.includes(feature))
  }

  clear(): void {
    this.adapters.clear()
    this.configs.clear()
    this.capabilities.clear()
  }
}

export class PlatformFactory {
  private static registry = PlatformRegistry.getInstance()

  static createAdapter(
    platformName: string,
    config: PlatformConfig,
    AdapterClass: new (platformName: string, config: PlatformConfig) => PlatformAdapter,
  ): PlatformAdapter {
    const adapter = new AdapterClass(platformName, config)
    this.registry.registerAdapter(adapter)
    return adapter
  }

  static getOrCreateAdapter(
    platformName: string,
    config: PlatformConfig,
    AdapterClass: new (platformName: string, config: PlatformConfig) => PlatformAdapter,
  ): PlatformAdapter {
    const existing = this.registry.getAdapter(platformName)
    if (existing) return existing
    return this.createAdapter(platformName, config, AdapterClass)
  }
}

export const platformRegistry = PlatformRegistry.getInstance()


