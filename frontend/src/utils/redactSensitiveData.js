const SENSITIVE_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'confirmpassword',
  'otp',
  'token',
  'idtoken',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'appsecret'
])

const REDACTED = '[REDACTED]'

function isSensitiveKey(key) {
  const normalized = String(key).replace(/[-_\s]/g, '').toLowerCase()
  return SENSITIVE_KEYS.has(normalized) || normalized.endsWith('password') || normalized.endsWith('token')
}

function fileMetadata(value) {
  return {
    name: value.name,
    type: value.type,
    size: value.size
  }
}

export function redactSensitiveData(value, seen = new WeakSet()) {
  if (value == null || typeof value !== 'object') return value

  if (typeof File !== 'undefined' && value instanceof File) {
    return fileMetadata(value)
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const result = {}
    for (const [key, entry] of value.entries()) {
      result[key] = isSensitiveKey(key)
        ? REDACTED
        : (typeof File !== 'undefined' && entry instanceof File ? fileMetadata(entry) : entry)
    }
    return result
  }

  if (seen.has(value)) return '[CIRCULAR]'
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen))
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    isSensitiveKey(key) ? REDACTED : redactSensitiveData(entry, seen)
  ]))
}

export { REDACTED }
