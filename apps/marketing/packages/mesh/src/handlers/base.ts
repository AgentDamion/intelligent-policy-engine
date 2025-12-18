import { InMemoryDedupeStore, type DedupeStore } from '../dedupe'
import { ConsoleLogger, type MeshLogger } from '../logger'
import type { HandlerContext, HandlerResult, MeshEvent, Timeline } from '../types'

export interface HandlerOptions<TPayload = unknown> {
  name: string
  dedupe?: DedupeStore
  logger?: MeshLogger
  traceIdFactory?: () => string
  process: (event: MeshEvent<TPayload>, context: HandlerContext) => Promise<void>
  onSuccess?: (event: MeshEvent<TPayload>, context: HandlerContext) => Promise<void> | void
  onFailure?: (
    event: MeshEvent<TPayload>,
    context: HandlerContext,
    error: unknown
  ) => Promise<void> | void
}

class SimpleTimeline implements Timeline {
  private readonly origin = performance.now()
  private readonly entries: Record<string, number> = {}

  mark(label: string): void {
    this.entries[label] = performance.now() - this.origin
  }

  measurements(): Record<string, number> {
    return { ...this.entries }
  }
}

export interface OutboxHandler<TPayload = unknown> {
  handle(event: MeshEvent<TPayload>): Promise<HandlerResult>
}

export function createOutboxHandler<TPayload = unknown>(options: HandlerOptions<TPayload>): OutboxHandler<TPayload> {
  const dedupe = options.dedupe ?? new InMemoryDedupeStore()
  const rootLogger = options.logger?.child?.({ handler: options.name }) ?? new ConsoleLogger({ handler: options.name })

  return {
    async handle(event: MeshEvent<TPayload>): Promise<HandlerResult> {
      const traceId = (options.traceIdFactory ? options.traceIdFactory() : crypto.randomUUID?.()) ?? generateFallbackTraceId()
      const timeline = new SimpleTimeline()
      const logger = rootLogger.child?.({ traceId }) ?? rootLogger
      const context: HandlerContext = {
        traceId,
        startedAt: Date.now(),
        attempts: event.attempts ?? 0,
        logger,
        timeline,
      }

      timeline.mark('start')

      if (await dedupe.hasProcessed(event.id, options.name)) {
        logger.info('Skipping duplicate event', { eventId: event.id, eventType: event.eventType })
        return {
          status: 'skipped',
          traceId,
          durationMs: Date.now() - context.startedAt,
          attempts: event.attempts ?? 0,
        }
      }

      try {
        await options.process(event, context)
        timeline.mark('processed')

        await dedupe.markProcessed(event.id, options.name)

        if (options.onSuccess) {
          await options.onSuccess(event, context)
        }

        logger.info('Event processed', {
          eventId: event.id,
          eventType: event.eventType,
          durationMs: Date.now() - context.startedAt,
          marks: timeline.measurements(),
        })

        return {
          status: 'processed',
          traceId,
          durationMs: Date.now() - context.startedAt,
          attempts: event.attempts ?? 0,
        }
      } catch (error) {
        timeline.mark('failed')
        logger.error('Event handler failed', {
          eventId: event.id,
          eventType: event.eventType,
          error: serializeError(error),
        })

        if (options.onFailure) {
          await options.onFailure(event, context, error)
        }

        return {
          status: 'failed',
          traceId,
          durationMs: Date.now() - context.startedAt,
          attempts: event.attempts ?? 0,
          error: error instanceof Error ? error : new Error(String(error)),
        }
      }
    },
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { message: String(error) }
}

function generateFallbackTraceId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

