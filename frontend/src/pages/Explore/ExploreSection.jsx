import React, { useState } from 'react'
import {
  Sparkles,
  RefreshCw,
  Compass,
  LayoutGrid,
  ListFilter,
  Search,
  MapPin,
  Clock,
  ArrowDown,
  X
} from 'lucide-react'
import StoreCard from '@/components/common/StoreCard'
import CategoryIcon from '@/components/common/CategoryIcon'
import { Input, NativeSelect, StoreCardSkeleton } from '@/components/ui'

export default function ExploreSection({
  stores = [],
  loading = false,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  loadGlobalData,
  setActiveStore,
  handleToggleSaveStore,
  hasMoreServerStores = false,
  loadMoreServerStores,
  loadingMoreStores = false,
  totalStoreCount = 0,
  onServerFiltersChange,
  categoryFacets = {},
  publicFilters,
  onOpenSearch
}) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'compact'
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [visibleCount, setVisibleCount] = useState(9) // Infinite batching starting at 9

  // Fallback local states if publicFilters is not provided
  const [localCategoryIds, setLocalCategoryIds] = useState([])
  const [localNearMe, setLocalNearMe] = useState(false)
  const [localOpenNow, setLocalOpenNow] = useState(false)
  const [localUserCoords, setLocalUserCoords] = useState(null)

  const selectedCategoryIds = publicFilters?.categoryIds !== undefined ? publicFilters.categoryIds : localCategoryIds
  const openNowActive = publicFilters?.openNow !== undefined ? Boolean(publicFilters.openNow) : localOpenNow
  const nearMeActive = publicFilters?.nearMe !== undefined ? Boolean(publicFilters.nearMe) : localNearMe
  const userCoords = (publicFilters?.latitude != null && publicFilters?.longitude != null)
    ? { lat: publicFilters.latitude, lng: publicFilters.longitude }
    : localUserCoords

  const updateFilters = (patch) => {
    if (onServerFiltersChange) {
      onServerFiltersChange({
        categoryIds: patch.categoryIds !== undefined ? patch.categoryIds : selectedCategoryIds,
        openNow: patch.openNow !== undefined ? patch.openNow : openNowActive,
        nearMe: patch.nearMe !== undefined ? patch.nearMe : nearMeActive,
        latitude: patch.latitude !== undefined ? patch.latitude : (patch.nearMe === false ? null : (userCoords?.lat ?? null)),
        longitude: patch.longitude !== undefined ? patch.longitude : (patch.nearMe === false ? null : (userCoords?.lng ?? null)),
      })
    } else {
      if (patch.categoryIds !== undefined) setLocalCategoryIds(patch.categoryIds)
      if (patch.openNow !== undefined) setLocalOpenNow(patch.openNow)
      if (patch.nearMe !== undefined) setLocalNearMe(patch.nearMe)
      if (patch.latitude !== undefined && patch.longitude !== undefined) {
        setLocalUserCoords(patch.latitude != null ? { lat: patch.latitude, lng: patch.longitude } : null)
      }
    }
  }

  // Clear all category selection helper
  function clearCategoryFilter() {
    setSelectedCategory(null)
    updateFilters({ categoryIds: [] })
  }

  // Single-select category handler for Desktop NativeSelect
  function handleSelectCategoryChange(e) {
    const val = e.target.value
    if (!val) {
      clearCategoryFilter()
      return
    }
    const catId = isNaN(Number(val)) ? val : Number(val)
    const found = categories.find((c) => c.id === catId || String(c.id) === String(val))
    setSelectedCategory(found || null)
    updateFilters({ categoryIds: [catId] })
  }

  const currentSelectValue =
    selectedCategoryIds.length === 1
      ? String(selectedCategoryIds[0])
      : selectedCategory?.id
      ? String(selectedCategory?.id)
      : selectedCategoryIds.length > 1
      ? '__multiple__'
      : ''

  // Multi-category toggle helper
  function handleToggleCategory(catId) {
    if (!catId) {
      clearCategoryFilter()
      return
    }
    const currentList = selectedCategoryIds.length === 0 && selectedCategory && selectedCategory.id
      ? [selectedCategory.id]
      : selectedCategoryIds
    const exists = currentList.includes(catId)
    const next = exists ? currentList.filter((id) => id !== catId) : [...currentList, catId]
    if (next.length === 1) {
      const found = categories.find((c) => c.id === next[0])
      setSelectedCategory(found || null)
    } else {
      setSelectedCategory(null)
    }
    updateFilters({ categoryIds: next })
  }

  const approvedStores = stores.filter((st) => st.status === 'APPROVED')

  // GPS Location Trigger
  function handleToggleNearMe() {
    if (nearMeActive) {
      updateFilters({ nearMe: false, latitude: null, longitude: null })
      setLocationError('')
      return
    }

    if (userCoords) {
      updateFilters({ nearMe: true, latitude: userCoords.lat, longitude: userCoords.lng })
      return
    }

    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      return
    }

    setLocationError('')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFilters({
          nearMe: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
        setLocationError('')
        setLocationLoading(false)
      },
      (err) => {
        console.warn('Geolocation was not available:', err)
        setLocationError('Không thể lấy vị trí. Vui lòng cấp quyền GPS rồi thử lại.')
        updateFilters({ nearMe: false, latitude: null, longitude: null })
        setLocationLoading(false)
      },
      { timeout: 8000 }
    )
  }

  // Search, category, open-now, radius and distance sorting are already applied by the backend.
  const sortedStores = approvedStores

  // Infinite Batch Slicing
  const displayedStores = sortedStores.slice(0, visibleCount)
  const hasMore = visibleCount < sortedStores.length || hasMoreServerStores

  function handleLoadMore() {
    if (visibleCount < sortedStores.length) {
      setVisibleCount((prev) => prev + 6)
      return
    }
    if (hasMoreServerStores && loadMoreServerStores) loadMoreServerStores()
  }

  // Calculate store count per category
  const categoryStoreCount = (catId) => {
    if (!catId) return Object.values(categoryFacets).reduce((sum, value) => sum + Number(value || 0), 0)
    return Number(categoryFacets[catId] || 0)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      {/* Compact Hero Banner */}
      <div className="brutalist-card bg-white p-3.5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
            <span className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] sm:text-xs">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1 align-middle" /> Cần Giuộc Food Tour
            </span>
            <span className="brutalist-badge bg-[#fff9db] text-black border-black text-[10px] sm:text-xs">
              {totalStoreCount || approvedStores.length} Địa điểm đang phục vụ
            </span>
          </div>
          <h1 className="text-xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Bản Đồ Ẩm Thực Cần Giuộc
          </h1>
          <p className="text-neutral-600 text-[11px] sm:text-sm font-semibold max-w-xl">
            Khám phá đặc sản địa phương, đánh giá thực tế từ cộng đồng foodie, cập nhật trạng thái mở cửa theo thời gian thực.
          </p>
        </div>

        {/* View Mode Switcher & Quick Stats (Hidden on Mobile, Desktop Only) */}
        <div className="hidden md:flex items-center gap-2 bg-[#f7f6f2] p-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                : 'text-black hover:bg-neutral-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Lưới Nhỏ
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                : 'text-black hover:bg-neutral-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Danh Sách Dày
          </button>
        </div>
      </div>

      {/* Control Panel: Integrated Search & Interactive Category Control Deck */}
      <div className="brutalist-card bg-white p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        {/* Row 1: Desktop Search Bar & Category Select (Hidden on Mobile/Tablet < 1024px) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Tìm tên quán ăn, địa chỉ, khu vực tại Cần Giuộc..."
              aria-label="Tìm kiếm quán ăn, địa chỉ tại Cần Giuộc"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftAdornment={<Search className="w-4 h-4 text-neutral-500" />}
            />
          </div>
          {/* Desktop Category Select (Native Neo-Brutalist Select) */}
          <div className="w-72 shrink-0">
            <NativeSelect
              id="explore-category-select"
              aria-label="Lọc theo danh mục món ăn"
              value={currentSelectValue}
              onChange={handleSelectCategoryChange}
              containerClassName="w-full"
            >
              <option value="">Tất Cả Danh Mục ({totalStoreCount || approvedStores.length})</option>
              {selectedCategoryIds.length > 1 && (
                <option value="__multiple__" disabled>
                  Đã chọn {selectedCategoryIds.length} danh mục
                </option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({categoryStoreCount(cat.id)})
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Row 2: Fast Chips Filter Deck & Applied Filter Indicators */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t-2 border-neutral-100">
          <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">Lọc Nhanh:</span>

          {/* 📍 Gần Tôi Chip */}
          <button
            type="button"
            id="filter-near-me-btn"
            onClick={handleToggleNearMe}
            disabled={locationLoading}
            aria-pressed={nearMeActive}
            aria-label="Lọc quán ăn gần vị trí của tôi"
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer select-none min-h-[38px] ${
              nearMeActive
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-black hover:bg-neutral-50'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${nearMeActive ? 'text-[#ff3e3e]' : 'text-black'}`} />
            <span>Gần Tôi</span>
            {locationLoading && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
          </button>

          {/* 🟢 Đang Mở Cửa Chip */}
          <button
            type="button"
            id="filter-open-now-btn"
            onClick={() => updateFilters({ openNow: !openNowActive })}
            aria-pressed={openNowActive}
            aria-label="Lọc quán đang mở cửa phục vụ"
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer select-none min-h-[38px] ${
              openNowActive
                ? 'bg-[#e6fcf5] text-[#0ca678] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-black hover:bg-neutral-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${openNowActive ? 'text-[#0ca678]' : 'text-black'}`} />
            <span>Đang Mở Cửa</span>
          </button>


          {/* Applied Search Query Badge */}
          {Boolean(searchQuery) && (
            <span
              id="applied-query-badge"
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-black border-2 border-black rounded-full text-xs font-bold shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
            >
              <Search className="w-3 h-3 text-neutral-600" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="ml-1 text-black hover:text-[#ff3e3e] font-black cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}

          {/* Applied Category Filter Badge */}
          {(selectedCategoryIds.length > 0 || selectedCategory !== null) && (
            <span
              id="applied-category-badge"
              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-black border-2 border-black rounded-full text-xs font-bold shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                {selectedCategory
                  ? selectedCategory.name
                  : selectedCategoryIds.length === 1
                  ? (categories.find((c) => c.id === selectedCategoryIds[0])?.name || '1 danh mục')
                  : `${selectedCategoryIds.length} danh mục`}
              </span>
              <button
                type="button"
                onClick={clearCategoryFilter}
                aria-label="Xóa bộ lọc danh mục"
                className="ml-1 text-black hover:text-[#ff3e3e] font-black cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}

          {/* Clear Filters Button */}
          {(nearMeActive || openNowActive || selectedCategoryIds.length > 0 || selectedCategory !== null || Boolean(searchQuery)) && (
            <button
              type="button"
              id="clear-all-filters-btn"
              onClick={() => {
                updateFilters({
                  categoryIds: [],
                  openNow: false,
                  nearMe: false,
                  latitude: null,
                  longitude: null
                })
                setSelectedCategory(null)
                setSearchQuery('')
                setLocationError('')
              }}
              aria-label="Xóa tất cả các bộ lọc hiện tại"
              className="px-3 py-1 rounded-full text-xs font-black text-white bg-[#c92a2a] hover:bg-[#b02525] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-auto min-h-[38px]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa lọc ✕</span>
            </button>
          )}
        </div>

        {locationError && (
          <div role="alert" className="flex items-start justify-between gap-3 border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-700">
            <span>{locationError}</span>
            <button type="button" onClick={() => setLocationError('')} aria-label="Đóng thông báo vị trí" className="min-h-11 min-w-11 border-2 border-red-500 bg-white p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Complete Category Badges (Desktop Only >= 1024px; mobile/tablet uses dedicated SearchFilterModal) */}
        <div className="hidden lg:block pt-2 border-t-2 border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-neutral-500">
              Danh Mục Món Ăn ({categories.length + 1}):
            </span>
            {(selectedCategoryIds.length > 0 || selectedCategory !== null) && (
              <button
                type="button"
                onClick={clearCategoryFilter}
                className="text-[10px] uppercase font-black text-[#c92a2a] hover:underline cursor-pointer"
              >
                Xóa chọn danh mục ✕
              </button>
            )}
          </div>

          {/* 💻 Desktop Categories: Clean wrapped pill grid */}
          <div className="flex flex-wrap items-center gap-2 py-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleToggleCategory(null)
              }}
              className={`px-3.5 py-1.5 border-2 border-black rounded-full text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                selectedCategoryIds.length === 0 && selectedCategory === null
                  ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-neutral-50'
              }`}
            >
              <span>Tất Cả Món</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategoryIds.length === 0 && selectedCategory === null ? 'bg-white text-[#ff3e3e]' : 'bg-neutral-100 text-black'}`}>
                {approvedStores.length}
              </span>
            </button>

            {categories.slice(0, 10).map((cat) => {
              const count = categoryStoreCount(cat.id)
              const isSelected = selectedCategoryIds.includes(cat.id) || selectedCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleToggleCategory(cat.id)
                  }}
                  className={`px-3.5 py-1.5 border-2 border-black rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                      : 'bg-white text-black hover:bg-neutral-50'
                  }`}
                >
                  <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} />
                  <span>{cat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-[#f7f6f2] text-black border border-black'}`}>
                    {count}
                  </span>
                </button>
              )
            })}

            {categories.length > 10 && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenSearch) onOpenSearch()
                }}
                className="px-3.5 py-1.5 border-2 border-dashed border-black rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-neutral-100 hover:bg-neutral-200 text-black cursor-pointer transition-all"
              >
                <span>+ Xem thêm {categories.length - 10} danh mục ↗</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Store Items Grid / List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#ff3e3e]">LIVE STALLS</span>
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center gap-2">
              <span>
                {selectedCategory
                  ? `Danh Mục: ${selectedCategory.name}`
                  : selectedCategoryIds.length > 0
                  ? `Danh Mục: Đã chọn ${selectedCategoryIds.length} danh mục`
                  : 'Quán Ăn Nổi Bật'}
              </span>
              <span className="text-xs font-bold text-neutral-500">({displayedStores.length}/{sortedStores.length})</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop View Switcher in Live Stalls Header */}
            <div className="hidden md:flex items-center gap-1 bg-[#f7f6f2] p-1 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-black hover:bg-neutral-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Lưới Quán
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                aria-pressed={viewMode === 'compact'}
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-black hover:bg-neutral-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" /> Danh Sách
              </button>
            </div>

            <button
              type="button"
              onClick={loadGlobalData}
              className="p-2 rounded-full border-2 border-black bg-white hover:bg-[#ff3e3e] hover:text-white text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              title="Cập Nhật Dữ Liệu"
              aria-label="Cập nhật lại dữ liệu quán ăn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading && stores.length === 0 ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Đang tải danh sách quán ăn"
            className="space-y-4"
          >
            <span className="sr-only">Đang tải danh sách quán ăn...</span>
            {/* 📱 Mobile Skeletons */}
            <div className="md:hidden space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <StoreCardSkeleton key={i} viewMode="mobile" />
              ))}
            </div>
            {/* 💻 Desktop Skeletons */}
            <div className="hidden md:block">
              {viewMode === 'compact' ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <StoreCardSkeleton key={i} viewMode="compact" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <StoreCardSkeleton key={i} viewMode="grid" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : sortedStores.length === 0 ? (
          <div className="brutalist-card bg-white p-8 sm:p-12 text-center text-neutral-600 space-y-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Compass className="w-10 h-10 mx-auto text-[#ff3e3e] animate-pulse" />
            <p className="text-sm font-black text-black uppercase">Không tìm thấy quán ăn phù hợp</p>
            <p className="text-xs text-neutral-600 font-semibold">
              Thử đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc xem sao nhé!
            </p>
          </div>
        ) : (
          <>
            {/* 📱 1. Mobile Display: Clean vertical list of horizontal dedicated cards */}
            <div className="md:hidden space-y-3">
              {displayedStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  setActiveStore={setActiveStore}
                  viewMode="mobile"
                  onToggleSave={handleToggleSaveStore}
                />
              ))}
            </div>

            {/* 💻 2. Desktop Display: Respect Desktop viewMode (Grid 3-4 col or Compact list) */}
            <div className="hidden md:block">
              {viewMode === 'compact' ? (
                <div className="space-y-3">
                  {displayedStores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      setActiveStore={setActiveStore}
                      viewMode="compact"
                      onToggleSave={handleToggleSaveStore}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayedStores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      setActiveStore={setActiveStore}
                      viewMode="grid"
                      onToggleSave={handleToggleSaveStore}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Infinite Stream Batch Load More Button */}
        {hasMore && (
          <div className="text-center pt-6 pb-2">
            <button
              onClick={handleLoadMore}
              disabled={loadingMoreStores}
              className="brutalist-btn-white py-2.5 px-6 text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 mx-auto"
            >
              <ArrowDown className="w-4 h-4 text-[#ff3e3e] animate-bounce" />
              <span>{loadingMoreStores ? 'Đang tải...' : 'Tải Thêm Quán Ngon Lạ'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
