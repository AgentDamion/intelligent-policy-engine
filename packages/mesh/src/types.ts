import type { MeshLogger } from './logger'

export interface MeshEvent<TPayload = unknown> {
  id: string
  eventType: string
  entityType: string
  entityId?: string
  enterpriseId?: string | null
  attempts: number
  payload: TPayload
  publishedAt?: string
  metadata?: Record<string, unknown>
}

export interface HandlerContext {
  traceId: string
  startedAt: number
  attempts: number
  logger: MeshLogger
  timeline: Timeline
}

export interface Timeline {
  mark(label: string): void
  measurements(): Record<string, number>
}

export interface HandlerResult {
  status: 'processed' | 'skipped' | 'failed'
  traceId: string
  durationMs: number
  attempts: number
  error?: Error | null
}

export interface HandlerRuntimeOptions {
  idempotencyKey?: string
}

