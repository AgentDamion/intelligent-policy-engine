/**
 * Sentry error tracking utility for Supabase Edge Functions
 * Uses Deno-compatible Sentry SDK
 */

interface SentryConfig {
  dsn?: string;
  environment?: string;
}

let sentryInitialized = false;

/**
 * Initialize Sentry for error tracking
 */
export async function initSentry(config?: SentryConfig) {
  const dsn = config?.dsn || Deno.env.get("SENTRY_DSN");
  const environment = config?.environment || Deno.env.get("ENVIRONMENT") || "production";

  if (!dsn) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  try {
    // Import Sentry SDK for Deno
    const Sentry = await import("https://deno.land/x/sentry/index.ts");
    
    Sentry.init({
      dsn,
      environment,
      tracesSampleRate: 1.0,
    });

    sentryInitialized = true;
    console.log("Sentry initialized for environment:", environment);
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Capture an exception and send to Sentry
 */
export async function captureException(
  error: Error,
  context?: Record<string, any>
) {
  if (!sentryInitialized) {
    console.error("Sentry not initialized. Error:", error);
    return;
  }

  try {
    const Sentry = await import("https://deno.land/x/sentry/index.ts");
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (err) {
    console.error("Failed to capture exception in Sentry:", err);
    console.error("Original error:", error);
  }
}

/**
 * Capture a message and send to Sentry
 */
export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>
) {
  if (!sentryInitialized) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  try {
    const Sentry = await import("https://deno.land/x/sentry/index.ts");
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } catch (err) {
    console.error("Failed to capture message in Sentry:", err);
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

/**
 * Set user context for Sentry
 */
export async function setUser(user: { id?: string; email?: string; [key: string]: any }) {
  if (!sentryInitialized) return;

  try {
    const Sentry = await import("https://deno.land/x/sentry/index.ts");
    Sentry.setUser(user);
  } catch (err) {
    console.error("Failed to set Sentry user:", err);
  }
}

