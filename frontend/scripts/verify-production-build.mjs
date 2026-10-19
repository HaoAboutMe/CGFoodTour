import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST_DIRECTORY = fileURLToPath(new URL('../dist/', import.meta.url))
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.map'])
const FORBIDDEN = [
  { label: 'localhost API URL', pattern: /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api/i },
  { label: 'Google OAuth placeholder', pattern: /YOUR_GOOGLE_CLIENT_ID/i },
  { label: 'Facebook OAuth placeholder', pattern: /YOUR_(?:FB_ID|FACEBOOK_APP_ID)/i },
  { label: 'generic unreplaced placeholder', pattern: /CHANGE_ME/i },
  { label: 'embedded JWT-like token', pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  { label: 'embedded private key', pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ }
]

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return nested.flat()
}

const violations = []
for (const file of await listFiles(DIST_DIRECTORY)) {
  if (!TEXT_EXTENSIONS.has(extname(file))) continue
  const content = await readFile(file, 'utf8')
  for (const forbidden of FORBIDDEN) {
    if (forbidden.pattern.test(content)) violations.push(`${forbidden.label}: ${file}`)
  }
}

if (violations.length > 0) {
  throw new Error(`Production artifact verification failed:\n${violations.join('\n')}`)
}

console.log('Production artifact verification passed')
