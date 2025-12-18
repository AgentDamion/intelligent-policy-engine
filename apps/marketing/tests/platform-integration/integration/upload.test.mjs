import fs from 'node:fs'
import path from 'node:path'

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return { status: res.status, json: JSON.parse(text) } } catch { return { status: res.status, text } }
}

function loadFixture(name) {
  const p = path.resolve(process.cwd(), 'aicomplyr-intelligence/tests/platform-integration/fixtures', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

const fixture = loadFixture('sample-upload.json')

async function run() {
  const base = process.env.FUNCTIONS_BASE_URL || 'http://localhost:54321/functions/v1'

  console.log('Testing Veeva upload...')
  const v = await postJson(`${base}/platform-veeva/upload`, fixture)
  console.log('Veeva response:', v)

  console.log('Testing SharePoint upload...')
  const s = await postJson(`${base}/platform-sharepoint/upload`, fixture)
  console.log('SharePoint response:', s)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})


