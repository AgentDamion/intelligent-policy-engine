import express from 'express';
import RedisProvider from '../services/cache-providers/redis-provider.js';
import AiGateway from '../ai/llm-gateway.js';
import hierarchicalAuth from '../auth/hierarchical-auth.js';

const router = express.Router();

// Reuse the centralized Redis provider
const redisProvider = new RedisProvider();
const aiGateway = new AiGateway({
  redisProvider,
  maxDailySpend: Number(process.env.MAX_DAILY_SPEND || 50),
});

// Protect the route with existing auth middleware
router.post(
  '/ai/chat',
  hierarchicalAuth.requireAuth ? hierarchicalAuth.requireAuth() : (req, res, next) => next(),
  (req, res) => aiGateway.handle(req, res)
);

export default router;






