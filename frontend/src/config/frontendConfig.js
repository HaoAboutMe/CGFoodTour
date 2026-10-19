const developmentApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const frontendConfig = Object.freeze({
  apiBase: (import.meta.env.DEV ? developmentApiBase : '/api').replace(/\/+$/, ''),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID || ''
})
