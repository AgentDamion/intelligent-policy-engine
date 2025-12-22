import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function readEnvFile(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const out: Record<string, string> = {}
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.next') continue
      out.push(...walk(p))
    } else {
      out.push(p)
    }
  }
  return out
}

function extractReferencedFunctions(rootDir: string): Set<string> {
  const names = new Set<string>()
  const files = walk(rootDir)

  for (const file of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue
    let text: string
    try {
      text = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }

    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue

      // supabase.functions.invoke('name'
      const invokeRe = /supabase\.functions\.invoke\(\s*['"]([^'"]+)['"]/g
      let m: RegExpExecArray | null
      while ((m = invokeRe.exec(line))) {
        const before = line.slice(0, m.index)
        if (before.includes('//')) continue
        names.add(m[1])
      }

      // /functions/v1/name
      const v1Re = /\/functions\/v1\/([a-zA-Z0-9_-]+)/g
      while ((m = v1Re.exec(line))) {
        const before = line.slice(0, m.index)
        if (before.includes('//')) continue
        names.add(m[1])
      }
    }
  }

  return names
}

test('referenced Edge Functions exist in canonical supabase/functions (marketing + platform)', async () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
  const marketingSrc = path.join(repoRoot, 'apps', 'marketing', 'src')
  const platformSrc = path.join(repoRoot, 'apps', 'platform', 'src')
  const functionsRoot = path.join(repoRoot, 'supabase', 'functions')

  const names = new Set<string>()
  for (const n of extractReferencedFunctions(marketingSrc)) names.add(n)
  for (const n of extractReferencedFunctions(platformSrc)) names.add(n)

  const referenced = [...names].sort()
  expect(referenced.length).toBeGreaterThan(0)

  const existing = new Set(
    fs
      .readdirSync(functionsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name),
  )

  const missing = referenced.filter((fn) => !existing.has(fn))
  expect(missing, `Missing Edge Functions under supabase/functions: ${missing.join(', ')}`).toEqual([])
})


