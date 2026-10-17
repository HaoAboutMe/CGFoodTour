const ALLOWED_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'google.com',
  'www.google.com',
  'maps.google.com'
])

function hasAllowedPath(url, hostname) {
  if (hostname === 'maps.app.goo.gl') return url.pathname.length > 1
  if (hostname === 'goo.gl') return url.pathname === '/maps' || url.pathname.startsWith('/maps/')
  if (hostname === 'maps.google.com') return true
  return url.pathname === '/maps'
    || url.pathname.startsWith('/maps/')
    || ((url.pathname === '' || url.pathname === '/') && url.searchParams.get('api') === '1')
}

export function isAllowedGoogleMapsUrl(value) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && (!url.port || url.port === '443')
      && ALLOWED_HOSTS.has(hostname)
      && hasAllowedPath(url, hostname)
  } catch {
    return false
  }
}

export function getSafeGoogleMapsUrl(mapUrl, latitude, longitude) {
  if (isAllowedGoogleMapsUrl(mapUrl)) return mapUrl
  if (latitude === null || latitude === undefined || latitude === ''
    || longitude === null || longitude === undefined || longitude === '') {
    return null
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
}
