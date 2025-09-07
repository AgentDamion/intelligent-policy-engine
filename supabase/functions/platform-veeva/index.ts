import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { VeevaAdapter } from "./adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  try {
    const url = new URL(req.url)
    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
      return json({ platform: 'veeva', status: 'ok' })
    }
    if (req.method === 'POST' && url.pathname.endsWith('/upload')) {
      const body = await req.json()
      const creds = CredentialManager.fromEnv('veeva')
      if (!creds) return json({ error: 'Missing VEEVA_* env' }, 400)
      const cfg: PlatformConfig = { name: 'veeva', endpoints: { base_url: creds.endpoints.base_url } }
      const adapter = new VeevaAdapter(creds, cfg)
      await adapter.authenticate(creds)
      const result = await adapter.uploadFile(body)
      return json(result)
    }
    return json({ message: 'Veeva adapter ready' })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } })
}


