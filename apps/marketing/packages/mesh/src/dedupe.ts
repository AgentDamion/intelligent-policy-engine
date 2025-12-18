export interface DedupeStore {
  hasProcessed(eventId: string, handlerName: string): Promise<boolean>
  markProcessed(eventId: string, handlerName: string): Promise<void>
}

export class InMemoryDedupeStore implements DedupeStore {
  private readonly seen = new Set<string>()

  async hasProcessed(eventId: string, handlerName: string): Promise<boolean> {
    return this.seen.has(this.buildKey(eventId, handlerName))
  }

  async markProcessed(eventId: string, handlerName: string): Promise<void> {
    this.seen.add(this.buildKey(eventId, handlerName))
  }

  private buildKey(eventId: string, handlerName: string) {
    return `${handlerName}:${eventId}`
  }
}

