import React, { useEffect, useState } from 'react'
import { AlertCircle, ClipboardList, Filter, Loader2, PlusCircle, RotateCcw, X } from 'lucide-react'
import OwnerStoreHistoryFilters from './OwnerStoreHistoryFilters'
import StoreHistoryTimeline from './StoreHistoryTimeline'
import useOwnerStoreHistory from './useOwnerStoreHistory'

function HistorySkeleton() {
  return (
    <div aria-label="Đang tải lịch sử quán" className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4">
          <div className="h-9 w-9 rounded-full brutalist-skeleton sm:h-11 sm:w-11" />
          <div className="h-32 rounded-2xl brutalist-skeleton" />
        </div>
      ))}
    </div>
  )
}

export default function OwnerStoreHistorySection({ makeRequest, invalidationKey, onCreateStore, onViewStore, onEditStore, onManageStore }) {
  const history = useOwnerStoreHistory(makeRequest, invalidationKey)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    if (!mobileFiltersOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileFiltersOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileFiltersOpen])

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] animate-fade-in-up md:pb-6">
      <header className="relative overflow-hidden rounded-2xl border-3 border-black bg-white p-5 shadow-[5px_5px_0_0_#111] sm:p-7">
        <ClipboardList aria-hidden="true" className="absolute -bottom-7 right-3 h-32 w-32 text-neutral-200 sm:h-40 sm:w-40" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full border-2 border-black bg-[var(--color-brand)] px-3 py-1 text-xs font-black uppercase text-black">Hành trình kiểm duyệt</span>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight sm:text-4xl">Lịch sử quán</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-neutral-600 sm:text-base">
            Theo dõi quá trình gửi duyệt, chỉnh sửa, phê duyệt, từ chối, ẩn và khôi phục các quán của bạn.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          aria-expanded={mobileFiltersOpen}
          className="flex min-h-11 items-center gap-2 rounded-full border-2 border-black bg-white px-4 text-xs font-black uppercase shadow-[2px_2px_0_0_#111]"
        >
          <Filter aria-hidden="true" className="h-4 w-4" /> Bộ lọc
        </button>
        {history.group !== 'ALL' && (
          <span className="rounded-full border-2 border-black bg-[var(--color-warning-bg)] px-3 py-2 text-xs font-black">
            Đang lọc hoạt động
          </span>
        )}
        {(history.fromDate || history.toDate) && (
          <span className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black">Có khoảng ngày</span>
        )}
        {history.query && (
          <span className="max-w-full truncate rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black">“{history.query}”</span>
        )}
        {history.hasActiveFilters && (
          <button type="button" onClick={history.clearFilters} aria-label="Xóa toàn bộ bộ lọc" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      {mobileFiltersOpen && (
        <button
          type="button"
          aria-label="Đóng bộ lọc"
          onClick={() => setMobileFiltersOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <OwnerStoreHistoryFilters
        query={history.query} setQuery={history.setQuery}
        group={history.group} setGroup={history.setGroup}
        fromDate={history.fromDate} setFromDate={history.setFromDate}
        toDate={history.toDate} setToDate={history.setToDate}
        hasActiveFilters={history.hasActiveFilters} clearFilters={history.clearFilters}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />

      {!history.loading && !history.error && (
        <p className="text-sm font-bold text-neutral-600" role="status" aria-live="polite">
          {history.pageInfo.totalElements.toLocaleString('vi-VN')} hoạt động được tìm thấy
        </p>
      )}

      {history.loading ? (
        <HistorySkeleton />
      ) : history.error ? (
        <div role="alert" className="rounded-2xl border-2 border-[var(--color-danger-text)] bg-[var(--color-danger-bg)] p-6 text-center shadow-[3px_3px_0_0_#111]">
          <AlertCircle aria-hidden="true" className="mx-auto h-10 w-10 text-[var(--color-danger-text)]" />
          <h3 className="mt-3 text-lg font-black">Chưa thể tải lịch sử quán</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-700">{history.error}</p>
          <button type="button" onClick={history.retry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-black bg-white px-5 text-xs font-black uppercase shadow-[2px_2px_0_0_#111]">
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Thử lại
          </button>
        </div>
      ) : history.events.length === 0 ? (
        <div className="rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0_0_#111] sm:p-12">
          <ClipboardList aria-hidden="true" className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-4 text-xl font-black uppercase">{history.hasActiveFilters ? 'Không có hoạt động phù hợp' : 'Bạn chưa đăng quán nào'}</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-neutral-600">
            {history.hasActiveFilters
              ? 'Hãy thay đổi hoặc xóa bộ lọc để xem những hoạt động khác.'
              : 'Khi bạn gửi quán đầu tiên, toàn bộ quá trình kiểm duyệt sẽ xuất hiện tại đây.'}
          </p>
          {history.hasActiveFilters ? (
            <button type="button" onClick={history.clearFilters} className="brutalist-btn-white mt-5 min-h-11 text-xs">
              <RotateCcw aria-hidden="true" className="h-4 w-4" /> Xóa bộ lọc
            </button>
          ) : (
            <button type="button" onClick={onCreateStore} className="brutalist-btn-red mt-5 min-h-11 text-xs">
              <PlusCircle aria-hidden="true" className="h-4 w-4" /> Đăng quán đầu tiên
            </button>
          )}
        </div>
      ) : (
        <StoreHistoryTimeline events={history.events} onViewStore={onViewStore} onEditStore={onEditStore} onManageStore={onManageStore} />
      )}

      {!history.loading && !history.error && history.events.length > 0 && !history.pageInfo.last && (
        <div className="flex justify-center pb-6">
          <button type="button" onClick={history.loadMore} disabled={history.loadingMore} className="brutalist-btn-white min-h-11 min-w-40 text-xs disabled:cursor-not-allowed disabled:opacity-60">
            {history.loadingMore ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {history.loadingMore ? 'Đang tải...' : `Xem thêm (${history.events.length}/${history.pageInfo.totalElements})`}
          </button>
        </div>
      )}
    </div>
  )
}
