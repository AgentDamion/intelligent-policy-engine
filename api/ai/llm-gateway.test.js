import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AiGateway } from './llm-gateway.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AiGateway budget + redaction guard', () => {
  let redis;
  let openai;
  let gateway;
  let req;
  let res;

  beforeEach(() => {
    redis = {
      get: jest.fn(),
      incrbyfloat: jest.fn(),
      expire: jest.fn(),
    };
    openai = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    gateway = new AiGateway({
      redisClient: redis,
      openaiClient: openai,
      maxDailySpend: 50,
    });
    req = {
      user: { tenantId: 'tenant-a', id: 'user-1' },
      body: { messages: [{ role: 'user', content: 'hi' }], model: 'gpt-4o' },
    };
    res = makeRes();
  });

  it('blocks when budget exceeded', async () => {
    redis.get.mockResolvedValue('60.0');

    await gateway.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(openai.chat.completions.create).not.toHaveBeenCalled();
  });

  it('sanitizes PII and forwards when under budget', async () => {
    redis.get.mockResolvedValue('10.0');
    openai.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
      usage: { total_tokens: 120 },
    });
    req.body.messages[0].content = 'Email me at alice@pharma.com';

    await gateway.handle(req, res);

    const callArgs = openai.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('[REDACTED]');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: 'ok' }));
  });
});






