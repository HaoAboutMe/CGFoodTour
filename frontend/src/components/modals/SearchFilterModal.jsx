import React, { useState, useEffect, useRef, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import CategoryIcon from '@/components/common/CategoryIcon'

/**
 * Normalizes Vietnamese text by stripping accents and diacritics for search.
 */
function normalizeVietnamese(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * SearchFilterModal
 *
 * Dedicated mobile/tablet (< 1024px) Search & Filter screen.
 * Implements:
 * 1. Main SearchFilter View:
 *    - Search input for name, address, landmark
 *    - Quick toggles (Gần Tôi, Đang Mở Cửa)
 *    - Single-row Category selector entry (`Danh mục món ăn — Tất cả danh mục >`)
 * 2. Dedicated Category Picker:
 *    - Subview with Back / Done actions
 *    - Instant accent-insensitive search
 *    - Scalable for 100–300+ categories without nested scrolling
 *    - Multi-select by category ID with count badge and clear action
 *    - Curated initial suggestions when no search keyword is entered
 * 3. Strict Draft / Apply Lifecycle:
 *    - Draft modifications stay isolated until "Áp Dụng" is clicked on Main View.
 *    - Cancel / Escape / Back discards all draft changes.
 */
export default function SearchFilterModal(props) {
  if (!props.isOpen) return null
  return <SearchFilterDialog {...props} />
}

function SearchFilterDialog({
  onClose,
  onApply,
  appliedQuery,
  appliedFilters,
  searchQuery = '',
  selectedCategoryIds = [],
  openNow = false,
  nearMe = false,
  userCoords = null,
  categories = [],
  categoryFacets = {},
  totalStoreCount = 0
}) {
  const dialogId = useId()
  const titleId = useId()
  const searchInputRef = useRef(null)
  const categorySearchInputRef = useRef(null)
  const openCategoryBtnRef = useRef(null)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Current view: 'main' or 'categoryPicker'
  const [currentView, setCurrentView] = useState('main')

  // Normalize initial values from props
  const initialQuery = appliedQuery !== undefined ? appliedQuery : searchQuery
  const initialCategoryIds = appliedFilters?.categoryIds !== undefined
    ? appliedFilters.categoryIds
    : selectedCategoryIds
  const initialOpenNow = appliedFilters?.openNow !== undefined
    ? Boolean(appliedFilters.openNow)
    : Boolean(openNow)
  const initialNearMe = appliedFilters?.nearMe !== undefined
    ? Boolean(appliedFilters.nearMe)
    : Boolean(nearMe)
  const initialCoords = (appliedFilters?.latitude != null && appliedFilters?.longitude != null)
    ? { lat: appliedFilters.latitude, lng: appliedFilters.longitude }
    : userCoords

  // Draft Filter States
  const [draftQuery, setDraftQuery] = useState(initialQuery || '')
  const [draftCategoryIds, setDraftCategoryIds] = useState(
    Array.isArray(initialCategoryIds) ? [...initialCategoryIds] : []
  )
  const [draftOpenNow, setDraftOpenNow] = useState(initialOpenNow)
  const [draftNearMe, setDraftNearMe] = useState(initialNearMe)
  const [draftCoords, setDraftCoords] = useState(initialCoords)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')

  // Category Search keyword within Category Picker
  const [categorySearchKeyword, setCategorySearchKeyword] = useState('')

  // Map of categories by ID for quick lookups
  const categoryMap = useMemo(() => {
    const map = new Map()
    categories.forEach((cat) => {
      map.set(cat.id, cat)
    })
    return map
  }, [categories])

  // Selected category names for summary row in Main View
  const selectedCategoryNames = useMemo(() => {
    return draftCategoryIds
      .map((id) => categoryMap.get(id)?.name)
      .filter(Boolean)
  }, [draftCategoryIds, categoryMap])

  // Filter categories by Vietnamese search keyword
  const filteredCategories = useMemo(() => {
    if (!categorySearchKeyword.trim()) return []
    const normalizedQuery = normalizeVietnamese(categorySearchKeyword)
    return categories.filter((cat) => {
      const normalizedName = normalizeVietnamese(cat.name)
      return normalizedName.includes(normalizedQuery)
    })
  }, [categories, categorySearchKeyword])

  // Curated initial suggestions when keyword is empty (first 12 categories)
  const suggestedCategories = useMemo(() => {
    return categories.slice(0, 12)
  }, [categories])

  // Body scroll lock and keyboard navigation
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Autofocus search input on open
    const focusTimer = setTimeout(() => {
      if (currentView === 'main') {
        searchInputRef.current?.focus()
      } else if (currentView === 'categoryPicker') {
        categorySearchInputRef.current?.focus()
      }
    }, 60)

    // History popstate integration
    const historyStateKey = `cgSearchOpen_${dialogId}`
    window.history.pushState({ [historyStateKey]: true, view: currentView }, '')

    const handlePopState = () => {
      if (currentView === 'categoryPicker') {
        setCurrentView('main')
      } else {
        onClose?.()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (currentView === 'categoryPicker') {
          setCurrentView('main')
          openCategoryBtnRef.current?.focus()
        } else {
          onClose?.()
        }
      }

      // Focus trap inside dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      clearTimeout(focusTimer)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, dialogId, currentView])

  // Geolocation trigger for Near Me draft
  const handleToggleNearMe = () => {
    if (draftNearMe) {
      setDraftNearMe(false)
      setLocationError('')
      return
    }

    if (draftCoords) {
      setDraftNearMe(true)
      return
    }

    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }

    setLocationError('')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setDraftCoords(coords)
        setDraftNearMe(true)
        setLocationLoading(false)
        setLocationError('')
      },
      (err) => {
        console.warn('Geolocation unavailable:', err)
        setLocationError('Không thể lấy vị trí. Vui lòng bật định vị GPS.')
        setDraftNearMe(false)
        setLocationLoading(false)
      },
      { timeout: 8000 }
    )
  }

  // Toggle Category selection in draft
  const handleToggleCategory = (catId) => {
    if (catId === null) {
      // Clear all categories
      setDraftCategoryIds([])
      return
    }

    setDraftCategoryIds((prev) => {
      const exists = prev.includes(catId)
      return exists ? prev.filter((id) => id !== catId) : [...prev, catId]
    })
  }

  // Reset all drafts to blank defaults
  const handleResetDraft = () => {
    setDraftQuery('')
    setDraftCategoryIds([])
    setDraftOpenNow(false)
    setDraftNearMe(false)
    setCategorySearchKeyword('')
    setLocationError('')
  }

  // Commit draft to applied filters
  const handleApply = (e) => {
    e?.preventDefault()
    const committedQuery = draftQuery.trim()
    const committedFilters = {
      categoryIds: draftCategoryIds,
      openNow: draftOpenNow,
      nearMe: draftNearMe,
      latitude: draftNearMe && draftCoords?.lat != null ? draftCoords.lat : null,
      longitude: draftNearMe && draftCoords?.lng != null ? draftCoords.lng : null
    }
    onApply?.(committedQuery, committedFilters)
    onClose?.()
  }

  // Calculate active draft filters count
  const activeDraftCount =
    (draftQuery.trim() ? 1 : 0) +
    (draftCategoryIds.length > 0 ? 1 : 0) +
    (draftOpenNow ? 1 : 0) +
    (draftNearMe ? 1 : 0)

  // Safe category facet count helper
  const getCategoryCount = (catId) => {
    if (!catId) return totalStoreCount
    return Number(categoryFacets[catId] || 0)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center animate-fade-in p-0 md:p-4"
      onClick={() => onClose?.()}
    >
      <div
        ref={dialogRef}
        id="search-filter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white md:border-4 md:border-black md:rounded-3xl md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* VIEW 1: MAIN SEARCH & FILTER VIEW                                         */}
        {/* ========================================================================= */}
        {currentView === 'main' && (
          <>
            {/* Top Header Bar */}
            <div className="pt-[max(0.75rem,env(safe-area-inset-top,0px))] px-4 sm:px-6 pb-3 border-b-3 border-black bg-[#fff9db] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] sm:text-xs">
                  <Sparkles className="w-3 h-3 inline mr-1 align-middle" /> Tìm Kiếm
                </span>
                <h2
                  id={titleId}
                  className="text-base sm:text-lg font-black uppercase text-black truncate tracking-tight"
                >
                  Bộ Lọc & Tìm Kiếm Quán Ăn
                </h2>
              </div>

              <button
                ref={closeButtonRef}
                id="search-filter-close-btn"
                type="button"
                onClick={() => onClose?.()}
                aria-label="Đóng cửa sổ tìm kiếm"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full border-2 border-black bg-white hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
              {/* 1. Main Search Input (Supports store name, addressLine, landmarkNote) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="search-filter-query-input"
                  className="block font-black text-xs uppercase tracking-wider text-black"
                >
                  Từ Khóa Tìm Kiếm:
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    id="search-filter-query-input"
                    type="text"
                    placeholder="Tìm tên quán ăn, địa chỉ, khu vực..."
                    aria-label="Tìm tên quán ăn, địa chỉ, khu vực"
                    value={draftQuery}
                    onChange={(e) => setDraftQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApply(e)
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#ff3e3e] focus:outline-none placeholder:text-neutral-400"
                  />
                  {draftQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftQuery('')
                        searchInputRef.current?.focus()
                      }}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-neutral-500">
                  Hỗ trợ tìm theo tên quán, số nhà, tên đường, chợ, ngã ba, mốc địa chỉ tại Cần Giuộc.
                </p>
              </div>

              {/* 2. Quick Filters (Gần Tôi & Đang Mở Cửa) */}
              <div className="space-y-2">
                <span className="block font-black text-xs uppercase tracking-wider text-black">
                  Lọc Nhanh Trạng Thái:
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 📍 Gần Tôi */}
                  <button
                    type="button"
                    id="modal-filter-near-me-btn"
                    onClick={handleToggleNearMe}
                    disabled={locationLoading}
                    aria-pressed={draftNearMe}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border-2 border-black transition-all cursor-pointer select-none ${
                      draftNearMe
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                        : 'bg-[#f7f6f2] hover:bg-neutral-100 text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <MapPin className={`w-4 h-4 ${draftNearMe ? 'text-[#ff3e3e]' : 'text-black'}`} />
                    <span>Gần Tôi (GPS 10km)</span>
                    {locationLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1" />}
                  </button>

                  {/* 🟢 Đang Mở Cửa */}
                  <button
                    type="button"
                    id="modal-filter-open-now-btn"
                    onClick={() => setDraftOpenNow(!draftOpenNow)}
                    aria-pressed={draftOpenNow}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border-2 border-black transition-all cursor-pointer select-none ${
                      draftOpenNow
                        ? 'bg-[#e6fcf5] text-[#0ca678] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                        : 'bg-[#f7f6f2] hover:bg-neutral-100 text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${draftOpenNow ? 'text-[#0ca678]' : 'text-black'}`} />
                    <span>Đang Mở Cửa</span>
                  </button>
                </div>

                {locationError && (
                  <div role="alert" className="border-2 border-red-500 bg-red-50 p-2.5 rounded-lg text-xs font-bold text-red-700 flex items-center justify-between gap-2">
                    <span>{locationError}</span>
                    <button
                      type="button"
                      onClick={() => setLocationError('')}
                      aria-label="Đóng thông báo vị trí"
                      className="min-h-[32px] min-w-[32px] flex items-center justify-center border border-red-500 rounded bg-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Redesigned Category Selection: Single Row Entry Point */}
              <div className="space-y-1.5">
                <span className="block font-black text-xs uppercase tracking-wider text-black">
                  Danh Mục Món Ăn:
                </span>
                <button
                  ref={openCategoryBtnRef}
                  type="button"
                  id="open-category-picker-btn"
                  onClick={() => setCurrentView('categoryPicker')}
                  aria-label="Mở bảng chọn danh mục món ăn"
                  className="w-full p-3.5 rounded-xl border-2 border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg border-2 border-black bg-[#fff9db] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-5 h-5 text-black" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-black uppercase text-neutral-500">
                        Danh Mục Món Ăn ({categories.length})
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="font-black text-sm text-black">
                          {draftCategoryIds.length === 0
                            ? 'Tất cả danh mục'
                            : `${draftCategoryIds.length} danh mục đã chọn`}
                        </span>
                        {/* Summary Badges: Up to 2 badges */}
                        {selectedCategoryNames.slice(0, 2).map((name) => (
                          <span
                            key={name}
                            className="inline-block text-[10px] font-black bg-[#f7f6f2] border border-black rounded px-1.5 py-0.5 truncate max-w-[110px]"
                          >
                            {name}
                          </span>
                        ))}
                        {selectedCategoryNames.length > 2 && (
                          <span className="text-[10px] font-black text-neutral-500">
                            +{selectedCategoryNames.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-black shrink-0" />
                </button>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="border-t-3 border-black bg-white p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                id="search-filter-reset-btn"
                onClick={handleResetDraft}
                disabled={activeDraftCount === 0}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer ${
                  activeDraftCount > 0
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-black shadow-[1.5px_1.5px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px]'
                    : 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>

              <button
                type="button"
                id="search-filter-apply-btn"
                onClick={handleApply}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 bg-[#ff3e3e] hover:bg-[#e03131] text-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>
                  {activeDraftCount > 0
                    ? `Áp Dụng (${activeDraftCount} bộ lọc) ↗`
                    : 'Xem Tất Cả Quán Ăn ↗'}
                </span>
              </button>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DEDICATED CATEGORY PICKER SUBVIEW                                  */}
        {/* ========================================================================= */}
        {currentView === 'categoryPicker' && (
          <div className="flex flex-col h-full overflow-hidden animate-fade-in">
            {/* Category Picker Header */}
            <div className="pt-[max(0.75rem,env(safe-area-inset-top,0px))] px-4 sm:px-6 pb-3 border-b-3 border-black bg-[#fff9db] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                id="category-picker-back-btn"
                onClick={() => {
                  setCurrentView('main')
                  openCategoryBtnRef.current?.focus()
                }}
                aria-label="Quay lại bộ lọc chính"
                className="min-h-[44px] px-3 py-1.5 rounded-full border-2 border-black bg-white hover:bg-neutral-100 font-black text-xs flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-black" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-sm sm:text-base font-black uppercase text-black truncate tracking-tight">
                  Chọn Danh Mục
                </h3>
                {draftCategoryIds.length > 0 && (
                  <span
                    id="category-selected-count-badge"
                    className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] shrink-0"
                  >
                    {draftCategoryIds.length} đã chọn
                  </span>
                )}
              </div>

              <button
                type="button"
                id="category-picker-done-btn"
                onClick={() => {
                  setCurrentView('main')
                  openCategoryBtnRef.current?.focus()
                }}
                aria-label="Hoàn tất chọn danh mục"
                className="min-h-[44px] px-3.5 py-1.5 rounded-full border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
              >
                <span>Xong</span>
              </button>
            </div>

            {/* Category Picker Search & Filter Controls */}
            <div className="p-3.5 sm:p-4 border-b-2 border-neutral-200 bg-white space-y-2.5 shrink-0">
              {/* Category Search Input */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={categorySearchInputRef}
                  id="category-search-filter-input"
                  type="text"
                  placeholder={`Tìm kiếm trong ${categories.length} danh mục (vd: phở, bún, cháo)...`}
                  aria-label="Tìm kiếm danh mục món ăn theo tên"
                  value={categorySearchKeyword}
                  onChange={(e) => setCategorySearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f7f6f2] border-2 border-black rounded-xl text-sm font-bold text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff3e3e] shadow-[1.5px_1.5px_0px_0px_#111]"
                />
                {categorySearchKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategorySearchKeyword('')
                      categorySearchInputRef.current?.focus()
                    }}
                    aria-label="Xóa từ khóa lọc danh mục"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Selection Bar & Clear Action */}
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-neutral-600">
                  {categorySearchKeyword.trim()
                    ? `Kết quả tìm kiếm (${filteredCategories.length})`
                    : draftCategoryIds.length > 0
                    ? `Đang chọn ${draftCategoryIds.length} danh mục`
                    : 'Gợi ý danh mục:'}
                </span>

                {draftCategoryIds.length > 0 && (
                  <button
                    type="button"
                    id="category-clear-selection-btn"
                    onClick={() => handleToggleCategory(null)}
                    className="text-[#c92a2a] hover:underline cursor-pointer uppercase text-[11px]"
                  >
                    Bỏ chọn tất cả ({draftCategoryIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Primary Scrollable List (Avoids nested scrollbars!) */}
            <div
              role="group"
              aria-label="Danh sách danh mục món ăn có thể chọn"
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f7f6f2]"
            >
              {/* Option 0: Tất Cả Danh Mục (When no keyword is entered) */}
              {!categorySearchKeyword.trim() && (
                <button
                  type="button"
                  id="category-all-btn"
                  onClick={() => handleToggleCategory(null)}
                  aria-pressed={draftCategoryIds.length === 0}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-black flex items-center justify-between gap-3 transition-all cursor-pointer text-left select-none ${
                    draftCategoryIds.length === 0
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_#111] font-black'
                      : 'bg-white hover:bg-neutral-50 text-black font-bold shadow-[1.5px_1.5px_0px_0px_#111]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded border-2 border-black flex items-center justify-center shrink-0 ${
                        draftCategoryIds.length === 0 ? 'bg-white text-[#ff3e3e]' : 'bg-transparent'
                      }`}
                    >
                      {draftCategoryIds.length === 0 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-black truncate">Tất Cả Danh Mục Món</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black shrink-0 ${
                      draftCategoryIds.length === 0 ? 'bg-white text-[#ff3e3e]' : 'bg-[#f7f6f2] text-black'
                    }`}
                  >
                    {totalStoreCount}
                  </span>
                </button>
              )}

              {/* Case 1: When user searched with keyword */}
              {categorySearchKeyword.trim() ? (
                <>
                  {filteredCategories.map((cat) => {
                    const isSelected = draftCategoryIds.includes(cat.id)
                    const count = getCategoryCount(cat.id)

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        data-category-item="true"
                        onClick={() => handleToggleCategory(cat.id)}
                        aria-pressed={isSelected}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-black flex items-center justify-between gap-3 transition-all cursor-pointer text-left select-none ${
                          isSelected
                            ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_#111] font-black'
                            : 'bg-white hover:bg-neutral-50 text-black font-bold shadow-[1.5px_1.5px_0px_0px_#111]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded border-2 border-black flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} />
                          <span className="text-xs sm:text-sm truncate">{cat.name}</span>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black shrink-0 ${
                            isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-[#f7f6f2] text-black'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-10 px-4 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_#111] space-y-3">
                      <div className="w-12 h-12 rounded-full border-2 border-black bg-[#fff9db] flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6 text-black" />
                      </div>
                      <p className="font-black text-sm text-black">
                        Không tìm thấy danh mục nào phù hợp với "{categorySearchKeyword}"
                      </p>
                      <p className="text-xs text-neutral-500 font-semibold max-w-xs mx-auto">
                        Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem các danh mục gợi ý.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearchKeyword('')
                          categorySearchInputRef.current?.focus()
                        }}
                        className="brutalist-btn-red text-xs py-2 px-4 font-black"
                      >
                        Xóa từ khóa tìm kiếm
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Case 2: When no keyword is entered - Show selected items + curated suggestions */
                <>
                  {/* Selected Categories Section (If any) */}
                  {draftCategoryIds.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-black uppercase text-neutral-500 block px-1">
                        Danh mục đang chọn ({draftCategoryIds.length}):
                      </span>
                      {draftCategoryIds.map((id) => {
                        const cat = categoryMap.get(id)
                        if (!cat) return null
                        const count = getCategoryCount(cat.id)

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            data-category-item="true"
                            onClick={() => handleToggleCategory(cat.id)}
                            aria-pressed={true}
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-black bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_#111] font-black flex items-center justify-between gap-3 transition-all cursor-pointer text-left select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-5 h-5 rounded border-2 border-black bg-white text-[#ff3e3e] flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} />
                              <span className="text-xs sm:text-sm truncate">{cat.name}</span>
                            </div>

                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-black bg-white text-[#ff3e3e] shrink-0">
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Curated Suggested Categories Section */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-black uppercase text-neutral-500 block px-1">
                      Gợi ý danh mục:
                    </span>
                    {suggestedCategories
                      .filter((cat) => !draftCategoryIds.includes(cat.id))
                      .map((cat) => {
                        const count = getCategoryCount(cat.id)

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            data-category-item="true"
                            onClick={() => handleToggleCategory(cat.id)}
                            aria-pressed={false}
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-neutral-50 text-black font-bold shadow-[1.5px_1.5px_0px_0px_#111] flex items-center justify-between gap-3 transition-all cursor-pointer text-left select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-5 h-5 rounded border-2 border-black bg-transparent flex items-center justify-center shrink-0" />
                              <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} />
                              <span className="text-xs sm:text-sm truncate">{cat.name}</span>
                            </div>

                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-black bg-[#f7f6f2] text-black shrink-0">
                              {count}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </>
              )}
            </div>

            {/* Category Picker Sticky Footer */}
            <div className="border-t-3 border-black bg-white p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                id="category-picker-done-footer-btn"
                onClick={() => {
                  setCurrentView('main')
                  openCategoryBtnRef.current?.focus()
                }}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 bg-[#ff3e3e] hover:bg-[#e03131] text-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>
                  Hoàn Tất Lựa Chọn (
                  {draftCategoryIds.length > 0 ? `${draftCategoryIds.length} đã chọn` : 'Tất cả'}
                  ) ↗
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
