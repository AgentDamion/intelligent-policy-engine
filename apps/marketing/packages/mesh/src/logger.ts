export interface MeshLogger {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  debug?(message: string, context?: Record<string, unknown>): void
  child?(bindings: Record<string, unknown>): MeshLogger
}

export class ConsoleLogger implements MeshLogger {
  constructor(private readonly bindings: Record<string, unknown> = {}) {}

  info(message: string, context: Record<string, unknown> = {}) {
    console.info(message, { ...this.bindings, ...context })
  }

  warn(message: string, context: Record<string, unknown> = {}) {
    console.warn(message, { ...this.bindings, ...context })
  }

  error(message: string, context: Record<string, unknown> = {}) {
    console.error(message, { ...this.bindings, ...context })
  }

  debug(message: string, context: Record<string, unknown> = {}) {
    console.debug(message, { ...this.bindings, ...context })
  }

  child(bindings: Record<string, unknown> = {}): MeshLogger {
    return new ConsoleLogger({ ...this.bindings, ...bindings })
  }
}

