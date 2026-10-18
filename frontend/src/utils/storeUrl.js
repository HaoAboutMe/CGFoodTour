export function slugifyStoreName(value) {
  const slug = String(value || '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '')
  return slug || 'quan-an'
}

export function storePath(store) {
  return `/quan/${encodeURIComponent(store.id)}/${slugifyStoreName(store.name)}`
}

export function canShareStore(store) {
  return store?.status === 'APPROVED'
}
