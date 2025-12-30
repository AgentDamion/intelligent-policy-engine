export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function getDynamicCorsHeaders(origin: string | null, allowedOrigin: string | null = null): Record<string, string> {
  const headers = { ...corsHeaders };
  
  if (allowedOrigin && origin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (allowedOrigin === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else {
    // If no match, default to a safe value or the first allowed origin
    // For pharma compliance, we should strictly match the allowed origin
    headers['Access-Control-Allow-Origin'] = allowedOrigin || 'null';
  }
  
  return headers;
}

export function handleCors(req: Request): boolean {
  return req.method === 'OPTIONS';
}

export function respond(data: any, status: number = 200, headers: Record<string, string> = corsHeaders): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' }
    }
  );
}
