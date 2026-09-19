import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  RefreshCw,
  Compass,
  Utensils,
  LayoutGrid,
  ListFilter,
  Search,
  MapPin,
  Clock,
  ArrowDown,
  X,
  SlidersHorizontal
} from 'lucide-react'
import StoreCard from '@/components/common/StoreCard'
import CategoryIcon from '@/components/common/CategoryIcon'
import { checkStoreOpenStatus } from '@/utils/timeUtils'

// Haversine formula to compute distance in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // Distance in km rounded to 1 decimal place
}

export default function ExploreSection({
  stores,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  loadGlobalData,
  setActiveStore,
  handleRandomPick,
  rollingRandom,
  randomResult,
  setRandomResult,
  switchTab,
  loadLeaderboard,
  leaderboard,
  handleToggleSaveStore,
}) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'compact'
  const [nearMeActive, setNearMeActive] = useState(false)
  const [openNowActive, setOpenNowActive] = useState(false)
  const [userCoords, setUserCoords] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(9) // Infinite batching starting at 9
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])

  const categorySheetScrollPos = useRef(0)

  // Prevent background body scroll when Category Sheet is open while preserving scroll position
  useEffect(() => {
    if (showCategorySheet) {
      categorySheetScrollPos.current = window.scrollY || window.pageYOffset || 0
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      if (categorySheetScrollPos.current) {
        window.scrollTo(0, categorySheetScrollPos.current)
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showCategorySheet])

  // Clear all category selection helper
  function clearCategoryFilter() {
    setSelectedCategoryIds([])
    setSelectedCategory(null)
  }

  // Multi-category toggle helper
  function handleToggleCategory(catId) {
    if (!catId) {
      clearCategoryFilter()
      return
    }
    setSelectedCategoryIds((prev) => {
      let currentList = prev
      if (currentList.length === 0 && selectedCategory && selectedCategory.id) {
        currentList = [selectedCategory.id]
      }
      const exists = currentList.includes(catId)
      const next = exists ? currentList.filter((id) => id !== catId) : [...currentList, catId]
      if (next.length === 1) {
        const found = categories.find((c) => c.id === next[0])
        setSelectedCategory(found || null)
      } else {
        setSelectedCategory(null)
      }
      return next
    })
  }

  const approvedStores = stores.filter((st) => st.status === 'APPROVED')

  // GPS Location Trigger
  function handleToggleNearMe() {
    if (nearMeActive) {
      setNearMeActive(false)
      return
    }

    if (userCoords) {
      setNearMeActive(true)
      return
    }

    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNearMeActive(true)
        setLocationLoading(false)
      },
      (err) => {
        console.warn('Geolocation fallback to Can Giuoc Town center:', err)
        setUserCoords({ lat: 10.6035, lng: 106.6047 }) // Default Town Center
        setNearMeActive(true)
        setLocationLoading(false)
      },
      { timeout: 8000 }
    )
  }

  // Filtered stores
  const filteredStores = approvedStores.filter((st) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      st.name.toLowerCase().includes(q) ||
      (st.addressLine && st.addressLine.toLowerCase().includes(q)) ||
      (st.description && st.description.toLowerCase().includes(q))

    const activeCategoryIds =
      selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : selectedCategory
        ? [selectedCategory.id]
        : []

    const matchesCategory =
      activeCategoryIds.length > 0
        ? activeCategoryIds.includes(st.categoryId)
        : true
    const isOpenNow = checkStoreOpenStatus(st).isOpen
    const matchesOpenNow = openNowActive ? isOpenNow : true

    return matchesSearch && matchesCategory && matchesOpenNow
  })

  // Distance calculation per store
  const storesWithDistance = filteredStores.map((st) => {
    let dist = null
    if (userCoords) {
      const storeLat = st.latitude || (10.6035 + (st.id % 7) * 0.004 - 0.01)
      const storeLng = st.longitude || (106.6047 + (st.id % 5) * 0.004 - 0.01)
      dist = getDistanceKm(userCoords.lat, userCoords.lng, storeLat, storeLng)
    }
    return { ...st, distanceKm: dist }
  })

  // Sort stores: If Near Me is active, sort by distance (km).
  const sortedStores = nearMeActive
    ? [...storesWithDistance].sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999))
    : storesWithDistance

  // Infinite Batch Slicing
  const displayedStores = sortedStores.slice(0, visibleCount)
  const hasMore = visibleCount < sortedStores.length

  // Calculate store count per category
  const categoryStoreCount = (catId) => {
    if (!catId) return approvedStores.length
    return approvedStores.filter((st) => st.categoryId === catId).length
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
              {approvedStores.length} Địa điểm đang phục vụ
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

      {/* Control Panel: Integrated Search & Interactive Category Tiles */}
      <div className="brutalist-card bg-white p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Tìm tên món ăn, quán ăn, tên đường tại Cần Giuộc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="brutalist-input brutalist-input-has-icon"
          />
        </div>

        {/* Fast Chips Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t-2 border-neutral-100">
          <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">Lọc Nhanh:</span>
          
          {/* 📍 Gần Tôi Chip */}
          <button
            onClick={handleToggleNearMe}
            disabled={locationLoading}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer select-none ${
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
            onClick={() => setOpenNowActive(!openNowActive)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer select-none ${
              openNowActive
                ? 'bg-[#e6fcf5] text-[#0ca678] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                : 'bg-white text-black hover:bg-neutral-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${openNowActive ? 'text-[#0ca678]' : 'text-black'}`} />
            <span>Đang Mở Cửa</span>
          </button>

          {/* 🏷️ Mở Bộ Lọc 50+ Danh Mục (Multi-Select Filter) */}
          {/* 🏷️ Mở Bộ Lọc 50+ Danh Mục (Multi-Select Filter) */}
          {(() => {
            const hasCategoryFilter = selectedCategoryIds.length > 0 || selectedCategory !== null
            return (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setShowCategorySheet(true)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer select-none shrink-0 ${
                    hasCategoryFilter
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#fff9db] hover:bg-amber-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    {selectedCategoryIds.length > 1
                      ? `Đã Chọn (${selectedCategoryIds.length})`
                      : selectedCategory
                      ? `Đã Chọn (${selectedCategory.name})`
                      : selectedCategoryIds.length === 1
                      ? `Đã Chọn (1)`
                      : `Tất Cả Danh Mục (${categories.length})`}
                  </span>
                  <span className="text-[10px] font-black ml-0.5">▾</span>
                </button>

                {(nearMeActive || openNowActive || hasCategoryFilter) && (
                  <button
                    onClick={() => {
                      setNearMeActive(false)
                      setOpenNowActive(false)
                      clearCategoryFilter()
                    }}
                    className="text-[10px] font-black text-[#ff3e3e] hover:underline px-2 cursor-pointer"
                  >
                    Xóa lọc ✕
                  </button>
                )}
              </>
            )
          })()}
        </div>

        {/* Complete Category Badges */}
        <div className="pt-2 border-t-2 border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-neutral-500">
              Tất Cả Danh Mục ({categories.length + 1}):
            </span>
            {(selectedCategoryIds.length > 0 || selectedCategory !== null) && (
              <button
                onClick={clearCategoryFilter}
                className="text-[10px] uppercase font-black text-[#ff3e3e] hover:underline cursor-pointer"
              >
                Xóa bộ lọc ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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

            {/* Render 6 popular categories first */}
            {categories.slice(0, 6).map((cat) => {
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

            {/* Quick button to open Sheet if more than 6 categories */}
            {categories.length > 6 && (
              <button
                onClick={() => setShowCategorySheet(true)}
                className="px-3.5 py-1.5 border-2 border-dashed border-black rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-neutral-100 hover:bg-neutral-200 text-black cursor-pointer transition-all"
              >
                <span>+ Xem thêm {categories.length - 6} danh mục ↗</span>
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
          <button
            onClick={loadGlobalData}
            className="p-2 rounded-full border-2 border-black bg-white hover:bg-[#ff3e3e] hover:text-white text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            title="Cập Nhật Dữ Liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {sortedStores.length === 0 ? (
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
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="brutalist-btn-white py-2.5 px-6 text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 mx-auto"
            >
              <ArrowDown className="w-4 h-4 text-[#ff3e3e] animate-bounce" />
              <span>Tải Thêm Quán Ngon Lạ ({sortedStores.length - visibleCount} quán nữa)</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🏷️ CATEGORY PICKER BOTTOM SHEET / MODAL (FOR >= 50 CATEGORIES) */}
      {/* ========================================================================= */}
      {showCategorySheet &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="fixed inset-0 bg-black/60 cursor-pointer"
              onClick={() => setShowCategorySheet(false)}
            />

            <div className="relative z-10 bg-white border-t-4 sm:border-4 border-black w-full max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 animate-slide-in-right sm:animate-scale-up mb-0 sm:mb-auto">
              {/* Drag handle for mobile */}
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto sm:hidden shrink-0" />

              {/* Modal Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-black text-base sm:text-lg uppercase text-black">Bộ Lọc Tất Cả Danh Mục ({categories.length})</h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">
                      {selectedCategoryIds.length > 0
                        ? `Đã chọn ${selectedCategoryIds.length} danh mục (Có thể chọn nhiều)`
                        : 'Chọn 1 hoặc nhiều danh mục ẩm thực để lọc nhanh'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCategorySheet(false)}
                  className="p-1.5 rounded-full border-2 border-black bg-white hover:bg-[#ff3e3e] hover:text-white transition-all shadow-[2px_2px_0px_0px_#111] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instant Search input inside category sheet (No autoFocus to prevent auto-scrolling page) */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Gõ tìm danh mục (VD: cơm, phở, bún, chè, hải sản, trà sữa...)"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="brutalist-input brutalist-input-has-icon text-xs py-2"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-black cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categories Grid List (Multi-Select Chips) */}
              <div className="overflow-y-auto max-h-[45vh] pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {/* Option: Tất Cả Món */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleToggleCategory(null)
                  }}
                  className={`p-2.5 rounded-xl border-2 border-black flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
                    selectedCategoryIds.length === 0
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_#111] font-black'
                      : 'bg-[#f7f6f2] hover:bg-neutral-200 text-black font-bold'
                  }`}
                >
                  <span className="text-xs truncate">Tất Cả Món</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${selectedCategoryIds.length === 0 ? 'bg-white text-[#ff3e3e]' : 'bg-white text-black border border-black'}`}>
                    {approvedStores.length}
                  </span>
                </button>

                {/* Filtered categories */}
                {categories
                  .filter((cat) => !categorySearch || cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((cat) => {
                    const count = categoryStoreCount(cat.id)
                    const isSelected = selectedCategoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleToggleCategory(cat.id)
                        }}
                        className={`p-2.5 rounded-xl border-2 border-black flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_#111] font-black'
                            : 'bg-white hover:bg-neutral-100 text-black font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} />
                          <span className="text-xs truncate">{cat.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-[#f7f6f2] text-black border border-black'}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
              </div>

              {/* Apply & Clear Actions Footer */}
              <div className="pt-2 border-t-2 border-black flex items-center justify-between gap-3">
                <button
                  onClick={() => handleToggleCategory(null)}
                  className="text-xs font-black text-[#ff3e3e] hover:underline cursor-pointer"
                >
                  Xóa Bộ Lọc (Tất Cả)
                </button>
                <button
                  onClick={() => setShowCategorySheet(false)}
                  className="brutalist-btn-red py-2 px-5 text-xs font-black"
                >
                  {selectedCategoryIds.length > 0
                    ? `Áp Dụng (${selectedCategoryIds.length} danh mục) ↗`
                    : 'Xem Kết Quả ↗'}
                </button>
              </div>

              {categories.filter((cat) => !categorySearch || cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-xs font-bold">
                  Không tìm thấy danh mục nào với từ khóa "{categorySearch}"
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
