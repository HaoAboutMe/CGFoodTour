import React, { useEffect, useRef } from 'react'
import { CalendarDays, Filter, RotateCcw, Search, X } from 'lucide-react'
import { HISTORY_GROUP_OPTIONS } from './storeHistoryPresentation'

export default function OwnerStoreHistoryFilters({
  query,
  setQuery,
  group,
  setGroup,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  hasActiveFilters,
  clearFilters,
  mobileOpen = false,
  onMobileClose
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!mobileOpen || !panelRef.current) return undefined
    const previousFocus = document.activeElement
    const panel = panelRef.current
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = [...panel.querySelectorAll(focusableSelector)]
    focusable[0]?.focus()

    const trapFocus = (event) => {
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', trapFocus)
    return () => {
      panel.removeEventListener('keydown', trapFocus)
      previousFocus?.focus?.()
    }
  }, [mobileOpen])

  return (
    <section
      ref={panelRef}
      aria-label="Bộ lọc lịch sử quán"
      aria-modal={mobileOpen ? 'true' : undefined}
      role={mobileOpen ? 'dialog' : undefined}
      className={`${mobileOpen ? 'fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 block max-h-[75dvh] overflow-y-auto' : 'hidden'} rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0_0_#111] md:static md:block md:max-h-none md:overflow-visible md:p-5`}
    >
      <div className="mb-4 flex items-center justify-between md:hidden">
        <h3 className="text-base font-black uppercase">Bộ lọc lịch sử</h3>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Đóng bộ lọc lịch sử"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.5fr)_minmax(13rem,1fr)_minmax(10rem,.75fr)_minmax(10rem,.75fr)_auto] xl:items-end">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-extrabold text-neutral-700">Tìm theo tên quán</span>
          <span className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={100}
              placeholder="Ví dụ: Bánh xèo Bà Mười"
              className="min-h-11 w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600"
            />
          </span>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-extrabold text-neutral-700">Nhóm hoạt động</span>
          <span className="relative block">
            <Filter aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              className="min-h-11 w-full appearance-none rounded-xl border-2 border-black bg-white py-2 pl-10 pr-8 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600"
            >
              {HISTORY_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </span>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-neutral-700">
            <CalendarDays aria-hidden="true" className="h-4 w-4" /> Từ ngày
          </span>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            className="min-h-11 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-neutral-700">
            <CalendarDays aria-hidden="true" className="h-4 w-4" /> Đến ngày
          </span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            className="min-h-11 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 text-xs font-black uppercase shadow-[2px_2px_0_0_#111] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Xóa lọc
          </button>
        )}
      </div>
    </section>
  )
}
