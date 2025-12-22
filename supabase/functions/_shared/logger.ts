/**
 * Structured logging utility for Supabase Edge Functions
 * Sends logs to Logtail for centralized logging
 */

interface LogContext {
  userId?: string;
  workspaceId?: string;
  enterpriseId?: string;
  functionName?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: LogContext;
  timestamp: string;
  function?: string;
}

const LOGTAIL_ENDPOINT = "https://in.logtail.com";
let logtailToken: string | null = null;

/**
 * Initialize logger with Logtail token
 */
export function initLogger(token?: string) {
  logtailToken = token || Deno.env.get("LOGTAIL_TOKEN") || null;
  
  if (!logtailToken) {
    console.warn("Logtail token not configured. Logs will only be sent to console.");
  }
}

/**
 * Send log entry to Logtail
 */
async function sendToLogtail(entry: LogEntry) {
  if (!logtailToken) {
    // Fallback to console if Logtail not configured
    const logMethod = entry.level === "error" ? console.error :
                     entry.level === "warn" ? console.warn :
                     entry.level === "debug" ? console.debug :
                     console.log;
    logMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context);
    return;
  }

  try {
    const response = await fetch(`${LOGTAIL_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${logtailToken}`,
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      console.error(`Failed to send log to Logtail: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending log to Logtail:", error);
    // Fallback to console
    const logMethod = entry.level === "error" ? console.error :
                     entry.level === "warn" ? console.warn :
                     entry.level === "debug" ? console.debug :
                     console.log;
    logMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context);
  }
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogEntry["level"],
  message: string,
  context?: LogContext
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    function: Deno.env.get("SUPABASE_FUNCTION_NAME") || "unknown",
  };
}

/**
 * Log an info message
 */
export async function logInfo(message: string, context?: LogContext) {
  const entry = createLogEntry("info", message, context);
  await sendToLogtail(entry);
}

/**
 * Log a warning message
 */
export async function logWarn(message: string, context?: LogContext) {
  const entry = createLogEntry("warn", message, context);
  await sendToLogtail(entry);
}

/**
 * Log an error message
 */
export async function logError(message: string, error?: Error | any, context?: LogContext) {
  const errorContext: LogContext = {
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  const entry = createLogEntry("error", message, errorContext);
  await sendToLogtail(entry);
}

/**
 * Log a debug message (only in development)
 */
export async function logDebug(message: string, context?: LogContext) {
  if (Deno.env.get("ENVIRONMENT") === "development" || Deno.env.get("ENV") === "development") {
    const entry = createLogEntry("debug", message, context);
    await sendToLogtail(entry);
  }
}

/**
 * Measure execution time
 */
export function measureTime(label: string): () => Promise<void> {
  const startTime = Date.now();
  
  return async () => {
    const duration = Date.now() - startTime;
    await logInfo(`Performance: ${label}`, { duration: `${duration}ms` });
  };
}

