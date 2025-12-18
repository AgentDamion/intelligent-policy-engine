/**
 * Webhook Publisher - SIEM-ready event publishing with signing and rate limiting
 */

import { supabase } from '@/integrations/supabase/client';

export interface WebhookEvent {
  eventName: string;
  payload: any;
  context: {
    tenantId: string;
    agencyId: string;
    clientId?: string;
    actorId?: string;
  };
}

export interface WebhookConfig {
  url: string;
  secret: string;
  isActive: boolean;
  eventTypes: string[];
  rateLimit: number; // events per second
}

export interface WebhookDelivery {
  id: string;
  eventName: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: string;
  nextRetry?: string;
  response?: {
    status: number;
    body: string;
  };
}

class WebhookPublisher {
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();

  /**
   * Publish event to configured webhook endpoints
   */
  async publish(event: WebhookEvent): Promise<void> {
    try {
      // Get active webhook configurations for tenant
      const configs = await this.getWebhookConfigs(event.context.tenantId);
      
      for (const config of configs) {
        // Check if event type is enabled
        if (!config.eventTypes.includes(event.eventName)) {
          continue;
        }

        // Apply rate limiting
        if (!this.checkRateLimit(config.url, config.rateLimit)) {
          console.warn(`Rate limit exceeded for webhook: ${config.url}`);
          continue;
        }

        // Deliver webhook
        await this.deliverWebhook(event, config);
      }
    } catch (error) {
      console.error('Failed to publish webhook event:', error);
    }
  }

  private async getWebhookConfigs(tenantId: string): Promise<WebhookConfig[]> {
    try {
      // Mock configuration - in production would fetch from DB
      return [
        {
          url: 'https://customer-siem.example.com/webhooks',
          secret: 'webhook-secret-key',
          isActive: true,
          eventTypes: [
            'submission_created',
            'decision_recorded',
            'export_ready',
            'lock_taken',
            'lock_released',
            'access_suspended'
          ],
          rateLimit: 10 // 10 events per second
        }
      ];
    } catch (error) {
      console.error('Failed to fetch webhook configs:', error);
      return [];
    }
  }

  private checkRateLimit(url: string, limit: number): boolean {
    const now = Date.now();
    const windowMs = 1000; // 1 second window
    
    const limiter = this.rateLimiters.get(url);
    
    if (!limiter || now > limiter.resetTime) {
      // Reset or initialize rate limiter
      this.rateLimiters.set(url, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (limiter.count >= limit) {
      return false;
    }
    
    limiter.count++;
    return true;
  }

  private async deliverWebhook(event: WebhookEvent, config: WebhookConfig): Promise<void> {
    const deliveryId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      // Prepare payload with security headers
      const payload = {
        id: deliveryId,
        timestamp,
        event: event.eventName,
        data: this.sanitizePayload(event.payload),
        context: {
          tenantId: event.context.tenantId,
          agencyId: event.context.agencyId,
          clientId: event.context.clientId,
          actorId: this.redactActorId(event.context.actorId)
        }
      };

      const body = JSON.stringify(payload);
      const signature = await this.generateSignature(body, config.secret);

      // Store delivery attempt
      await this.recordDeliveryAttempt(deliveryId, {
        eventName: event.eventName,
        url: config.url,
        status: 'pending',
        attempts: 1
      });

      // Make HTTP request
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ACM-Signature': signature,
          'X-ACM-Event': event.eventName,
          'X-ACM-Delivery': deliveryId,
          'User-Agent': 'aicomply.io/webhook-publisher'
        },
        body
      });

      // Update delivery status
      await this.updateDeliveryStatus(deliveryId, {
        status: response.ok ? 'success' : 'failed',
        response: {
          status: response.status,
          body: await response.text().catch(() => '')
        }
      });

      // Schedule retry if failed
      if (!response.ok) {
        await this.scheduleRetry(deliveryId, event, config);
      }

    } catch (error) {
      console.error('Webhook delivery failed:', error);
      
      await this.updateDeliveryStatus(deliveryId, {
        status: 'failed',
        response: {
          status: 0,
          body: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      await this.scheduleRetry(deliveryId, event, config);
    }
  }

  private sanitizePayload(payload: any): any {
    // Remove or redact sensitive information
    const sanitized = { ...payload };
    
    // Redact email addresses
    if (sanitized.email) {
      sanitized.email = this.redactEmail(sanitized.email);
    }
    
    // Remove large binary data
    if (sanitized.fileContent) {
      delete sanitized.fileContent;
      sanitized.fileSize = payload.fileContent?.length || 0;
    }

    // Remove PII from rationale while keeping compliance info
    if (sanitized.rationale) {
      sanitized.rationale = this.redactPII(sanitized.rationale);
    }

    return sanitized;
  }

  private redactEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  private redactActorId(actorId?: string): string {
    if (!actorId) return 'unknown';
    // Return first 8 chars of UUID for correlation without exposing full ID
    return actorId.slice(0, 8) + '••••';
  }

  private redactPII(text: string): string {
    // Simple PII redaction - in production would use more sophisticated detection
    return text
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE_REDACTED]')
      .replace(/\b\d{9}\b/g, '[SSN_REDACTED]');
  }

  private async generateSignature(body: string, secret: string): Promise<string> {
    // Mock signature generation - in production would use crypto.subtle
    const mockSignature = btoa(body + secret).slice(0, 32);
    return `sha256=${mockSignature}`;
  }

  private async recordDeliveryAttempt(deliveryId: string, delivery: Partial<WebhookDelivery>): Promise<void> {
    try {
      await supabase
        .from('audit_events')
        .insert({
          event_type: 'webhook_delivery_attempt',
          entity_type: 'webhook',
          entity_id: deliveryId,
          details: delivery
        });
    } catch (error) {
      console.error('Failed to record webhook delivery attempt:', error);
    }
  }

  private async updateDeliveryStatus(deliveryId: string, updates: Partial<WebhookDelivery>): Promise<void> {
    try {
      await supabase
        .from('audit_events')
        .insert({
          event_type: 'webhook_delivery_result',
          entity_type: 'webhook',
          entity_id: deliveryId,
          details: {
            ...updates,
            updatedAt: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to update webhook delivery status:', error);
    }
  }

  private async scheduleRetry(deliveryId: string, event: WebhookEvent, config: WebhookConfig): Promise<void> {
    // Exponential backoff: 1m, 5m, 25m, 125m (max 3 retries)
    const retryDelays = [60000, 300000, 1500000]; // milliseconds
    
    // This would integrate with a job queue in production
    console.log(`Scheduling retry for webhook delivery ${deliveryId}`);
    
    // Record retry schedule
    await supabase
      .from('audit_events')
      .insert({
        event_type: 'webhook_retry_scheduled',
        entity_type: 'webhook',
        entity_id: deliveryId,
        details: {
          nextRetryAt: new Date(Date.now() + retryDelays[0]).toISOString(),
          maxRetries: 3
        }
      });
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(url: string, secret: string): Promise<{ success: boolean; status: number; message: string }> {
    try {
      const testEvent: WebhookEvent = {
        eventName: 'ping',
        payload: {
          message: 'Webhook configuration test',
          timestamp: new Date().toISOString()
        },
        context: {
          tenantId: 'test',
          agencyId: 'test'
        }
      };

      const body = JSON.stringify(testEvent.payload);
      const signature = await this.generateSignature(body, secret);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ACM-Signature': signature,
          'X-ACM-Event': 'ping',
          'User-Agent': 'aicomply.io/webhook-test'
        },
        body
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Webhook test successful' : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(tenantId: string, limit = 50): Promise<WebhookDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .in('event_type', ['webhook_delivery_attempt', 'webhook_delivery_result'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Group by delivery ID and merge attempt/result records
      const deliveries = new Map<string, WebhookDelivery>();
      
      (data || []).forEach(event => {
        const deliveryId = event.entity_id;
        const details = event.details as any;
        const existing = deliveries.get(deliveryId) || {
          id: deliveryId,
          eventName: details.eventName || 'unknown',
          url: details.url || 'unknown',
          status: 'pending' as const,
          attempts: 0
        };

        if (event.event_type === 'webhook_delivery_attempt') {
          existing.attempts = details.attempts || 1;
        } else if (event.event_type === 'webhook_delivery_result') {
          existing.status = details.status;
          (existing as any).response = details.response;
          (existing as any).lastAttempt = event.created_at;
        }

        deliveries.set(deliveryId, existing);
      });

      return Array.from(deliveries.values());
    } catch (error) {
      console.error('Failed to fetch delivery history:', error);
      return [];
    }
  }
}

export const webhookPublisher = new WebhookPublisher();

// Event name constants
export const WebhookEvents = {
  SUBMISSION_CREATED: 'submission_created',
  DECISION_RECORDED: 'decision_recorded',
  EXPORT_READY: 'export_ready',
  LOCK_TAKEN: 'lock_taken',
  LOCK_RELEASED: 'lock_released',
  ACCESS_SUSPENDED: 'access_suspended',
  INVITE_REDEEMED: 'invite_redeemed',
  AUDIT_EXPORT_REQUESTED: 'audit_export_requested'
} as const;
