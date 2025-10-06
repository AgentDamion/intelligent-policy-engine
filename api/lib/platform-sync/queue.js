// Simple in-memory queue for platform sync jobs
// In production, replace with Redis, Bull, or your preferred queue system

export class SyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(job) {
    this.queue.push({
      ...job,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    });
    console.log(`Queued sync job: ${job.syncType} for submission ${job.submissionId}`);
  }

  dequeue() {
    return this.queue.shift();
  }

  peek() {
    return this.queue[0];
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }

  // Get queue status for monitoring
  getStatus() {
    return {
      size: this.queue.length,
      processing: this.processing,
      nextJob: this.peek()
    };
  }
}

// Global queue instance
export const syncQueue = new SyncQueue();