const PLACEHOLDER_MARKERS = ['CHANGE_ME', 'YOUR_', 'PLACEHOLDER']

function requirePublicBuildValue(env, name) {
  const value = env[name]?.trim()
  if (!value) throw new Error(`Missing required frontend build variable: ${name}`)
  const normalized = value.toUpperCase()
  if (PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker))) {
    throw new Error(`Frontend build variable ${name} still contains a placeholder`)
  }
  return value
}

export function validateProductionBuildEnvironment(env) {
  requirePublicBuildValue(env, 'VITE_GOOGLE_CLIENT_ID')
  requirePublicBuildValue(env, 'VITE_FACEBOOK_APP_ID')

  const apiBase = env.VITE_API_BASE_URL?.trim()
  if (apiBase && apiBase !== '/api') {
    throw new Error('Production VITE_API_BASE_URL must be omitted or set to /api for same-origin deployment')
  }
}
