export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleCors(req: Request): boolean {
  return req.method === 'OPTIONS';
}

export function respond(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
