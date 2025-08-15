const fs = require('fs');
const path = require('path');

const candidates = [
  'server-railway.js',
  'server-supabase-fixed.js',
  'server-supabase-clean.js',
  'server-supabase.js',
  'server-clean.js',
  'server.js',
  'simple-server.js'
];

const here = __dirname;
const chosen = candidates.find(f => fs.existsSync(path.join(here, f)));

if (!chosen) {
  console.error('[api] No server file found in apps/api. Looked for:\n' + candidates.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}

console.log('[api] starting', chosen, '...');
require(path.join(here, chosen));
