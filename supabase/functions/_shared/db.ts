import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates a Supabase client instance authorized with the user's JWT.
 * @param req The incoming Deno Request object.
 * @returns A Supabase client instance.
 */
export function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Get the JWT token from the Authorization header
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Create the client, providing the JWT to enable RLS (Row Level Security)
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return supabase;
}

/**
 * Gets the authenticated user ID from the JWT payload.
 * NOTE: This is an unverified payload access. Rely on RLS for security.
 * @param req The incoming Deno Request object.
 * @returns The user ID (uid).
 */
export function getUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  try {
    const token = authHeader.replace('Bearer ', '');
    // Decode the payload (second part of the JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null; // 'sub' field holds the user ID (uid)
  } catch (_e) {
    return null;
  }
}
