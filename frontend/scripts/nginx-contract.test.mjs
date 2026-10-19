import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const nginx = await readFile(new URL('../nginx.conf', import.meta.url), 'utf8')
const headers = await readFile(new URL('../nginx/security-headers.conf', import.meta.url), 'utf8')

test('uses a consistent upload limit and JSON response for oversized payloads', () => {
  assert.match(nginx, /client_max_body_size\s+3m;/)
  assert.match(nginx, /return\s+413\s+'\{"code":1019/)
})

test('overwrites untrusted forwarded-for input at the sole proxy boundary', () => {
  const assignments = nginx.match(/proxy_set_header X-Forwarded-For \$remote_addr;/g) || []
  assert.equal(assignments.length, 2)
  assert.doesNotMatch(nginx, /\$proxy_add_x_forwarded_for/)
})

test('reapplies security headers in locations that define cache headers', () => {
  assert.match(nginx, /location \/assets\/ \{[\s\S]*?include \/etc\/nginx\/snippets\/security-headers\.conf;[\s\S]*?add_header Cache-Control/)
  assert.match(nginx, /location = \/index\.html \{[\s\S]*?include \/etc\/nginx\/snippets\/security-headers\.conf;[\s\S]*?add_header Cache-Control/)
  assert.match(headers, /Content-Security-Policy/)
  assert.match(headers, /fonts\.googleapis\.com/)
  assert.match(headers, /images\.unsplash\.com/)
})
