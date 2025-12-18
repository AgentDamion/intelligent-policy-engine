import { supabase } from '@/integrations/supabase/client';

/**
 * Invoke a Supabase Edge Function with automatic Authorization header injection.
 * 
 * @param fnName - The name of the Edge Function to invoke
 * @param body - The request body to send to the function
 * @returns Promise with data and error (matches supabase.functions.invoke signature)
 */
export async function invokeWithAuth<T = unknown>(
  fnName: string, 
  body: unknown
): Promise<{ data: T | null; error: any }> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return supabase.functions.invoke<T>(fnName, {
    body,
    headers: session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : {}
  });
}
