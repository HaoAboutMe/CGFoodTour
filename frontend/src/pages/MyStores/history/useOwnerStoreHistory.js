/* oxlint-disable react/set-state-in-effect -- effects intentionally synchronize debounced filters and remote history state */
import { useCallback, useEffect, useRef, useState } from 'react'

const EMPTY_PAGE = {
  page: 0,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
}

function dateBoundary(value, endOfDay = false) {
  if (!value) return ''
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${value}T${time}+07:00`).toISOString()
}

export default function useOwnerStoreHistory(makeRequest, invalidationKey = '') {
  const requestRef = useRef(makeRequest)
  const requestSequence = useRef(0)
  const [events, setEvents] = useState([])
  const [pageInfo, setPageInfo] = useState(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [group, setGroup] = useState('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    requestRef.current = makeRequest
  }, [makeRequest])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const loadPage = useCallback(async (page = 0, append = false) => {
    const requestId = ++requestSequence.current
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), size: '20', group })
    if (debouncedQuery) params.set('query', debouncedQuery)
    if (fromDate) params.set('from', dateBoundary(fromDate))
    if (toDate) params.set('to', dateBoundary(toDate, true))

    try {
      const response = await requestRef.current('GET', `/v1/stores/mine/history?${params.toString()}`)
      if (requestId !== requestSequence.current) return
      if (!response.success || !response.data?.result) {
        setError('Không thể tải lịch sử quán. Vui lòng thử lại.')
        return
      }

      const result = response.data.result
      const content = Array.isArray(result.content) ? result.content : []
      setEvents((previous) => {
        if (!append) return content
        return [...new Map([...previous, ...content].map((event) => [event.eventId, event])).values()]
      })
      setPageInfo({
        page: result.page ?? page,
        totalElements: result.totalElements ?? content.length,
        totalPages: result.totalPages ?? 1,
        first: result.first ?? page === 0,
        last: result.last ?? true
      })
    } catch {
      if (requestId === requestSequence.current) {
        setError('Không thể tải lịch sử quán. Vui lòng kiểm tra kết nối và thử lại.')
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [debouncedQuery, fromDate, group, toDate])

  useEffect(() => {
    loadPage(0, false)
  }, [invalidationKey, loadPage])

  const clearFilters = () => {
    setQuery('')
    setDebouncedQuery('')
    setGroup('ALL')
    setFromDate('')
    setToDate('')
  }

  return {
    events,
    pageInfo,
    loading,
    loadingMore,
    error,
    query,
    setQuery,
    group,
    setGroup,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearFilters,
    retry: () => loadPage(0, false),
    loadMore: () => loadPage((pageInfo.page || 0) + 1, true),
    hasActiveFilters: Boolean(query || group !== 'ALL' || fromDate || toDate)
  }
}
