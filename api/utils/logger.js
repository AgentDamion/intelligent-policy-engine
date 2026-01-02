/**
 * Minimal structured logger. Avoids leaking secrets; accepts context.
 */
const LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

export function log(level, message, context = {}) {
  if (!LEVELS.includes(level)) level = 'INFO';
  const { error, ...rest } = context || {};
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...rest
  };
  if (error) {
    payload.error = {
      message: error.message,
      stack: error.stack
    };
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export const logger = {
  debug: (msg, ctx) => log('DEBUG', msg, ctx),
  info: (msg, ctx) => log('INFO', msg, ctx),
  warn: (msg, ctx) => log('WARN', msg, ctx),
  error: (msg, ctx) => log('ERROR', msg, ctx),
  critical: (msg, ctx) => log('CRITICAL', msg, ctx)
};

