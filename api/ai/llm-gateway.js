import OpenAI from 'openai';
import { createHash } from 'crypto';

/**
 * Lightweight Express-friendly LLM gateway with budget + PII guardrails.
 * Dependencies are injected for testability. If no redis/openai client is
 * provided, it will lazily initialize defaults.
 */
export class AiGateway {
  constructor({
    redisProvider,
    redisClient,
    openaiClient,
    maxDailySpend = Number(process.env.MAX_DAILY_SPEND || 50),
    piiPattern = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
  } = {}) {
    this.redisProvider = redisProvider;
    this.redis = redisClient || null;
    this.redisReady = null;
    this.openai =
      openaiClient ||
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    this.maxDailySpend = maxDailySpend;
    this.piiPattern = piiPattern;
  }

  async getRedis() {
    if (this.redis) return this.redis;
    if (!this.redisProvider) {
      throw new Error('Redis provider not configured for AiGateway');
    }
    if (!this.redisReady) {
      this.redisReady = this.redisProvider.connect();
    }
    this.redis = await this.redisReady;
    return this.redis;
  }

  sanitizeMessages(messages = []) {
    return messages.map((msg) => {
      if (typeof msg?.content !== 'string') return msg;
      return {
        ...msg,
        content: msg.content.replace(this.piiPattern, '[REDACTED]'),
      };
    });
  }

  async handle(req, res) {
    try {
      const user = req.user || {};
      const tenantId = user.tenantId || user.enterpriseId || 'unknown-tenant';
      const userId = user.id || user.userId || 'unknown-user';
      const { messages = [], model = 'gpt-4o' } = req.body || {};

      const today = new Date().toISOString().split('T')[0];
      const budgetKey = `budget:${tenantId}:${today}`;
      const redis = await this.getRedis();

      const currentSpendRaw = await redis.get(budgetKey);
      const currentSpend = Number.parseFloat(currentSpendRaw || '0');
      if (Number.isFinite(this.maxDailySpend) && currentSpend >= this.maxDailySpend) {
        return res.status(402).json({
          error: 'Daily budget exceeded. Please contact an administrator.',
        });
      }

      const safeMessages = this.sanitizeMessages(messages);
      const start = Date.now();
      const completion = await this.openai.chat.completions.create({
        model,
        messages: safeMessages,
      });

      const responseContent = completion?.choices?.[0]?.message?.content || '';
      const totalTokens = completion?.usage?.total_tokens || 0;

      // Fire-and-forget audit + spend update
      this.backgroundAuditAndSpend({
        redis,
        budgetKey,
        tenantId,
        userId,
        input: safeMessages,
        output: responseContent,
        tokens: totalTokens,
        model,
        durationMs: Date.now() - start,
      }).catch(() => {});

      return res.json({
        data: responseContent,
        meta: {
          sanitized: true,
          tokens: totalTokens,
          model,
          durationMs: Date.now() - start,
        },
      });
    } catch (error) {
      console.error('[AiGateway] Error handling request', error);
      return res.status(500).json({ error: 'AI service unavailable' });
    }
  }

  async backgroundAuditAndSpend({
    redis,
    budgetKey,
    tenantId,
    userId,
    input,
    output,
    tokens,
    model,
    durationMs,
  }) {
    const estimatedCost = tokens * 0.00003; // Simplified pricing placeholder
    try {
      await redis.incrbyfloat(budgetKey, estimatedCost);
      // Keep key alive for the day plus a small buffer
      await redis.expire(budgetKey, 60 * 60 * 24 + 60);
    } catch (err) {
      console.error('[AiGateway] Failed to update spend', err);
    }

    const auditRecord = {
      type: 'AI_INTERACTION',
      ts: new Date().toISOString(),
      tenantId,
      actor: userId,
      model,
      durationMs,
      tokens,
      costUsd: estimatedCost,
      inputHash: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
      outputHash: createHash('sha256').update(output || '').digest('hex'),
    };

    // Replace with structured logger if available
    console.log(JSON.stringify(auditRecord));
  }
}

export default AiGateway;







