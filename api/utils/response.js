export function successResponse(data, meta = {}, statusCode = 200) {
  return {
    statusCode,
    body: {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.1',
        ...meta
      }
    }
  };
}

export function errorResponse(code, message, options = {}) {
  const {
    actionable = '',
    supportCode = '',
    documentation = '',
    retryAfterSeconds,
    statusCode = 400,
    meta = {}
  } = options;

  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message,
        actionable,
        supportCode,
        documentation,
        retryAfterSeconds
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.1',
        ...meta
      }
    }
  };
}

