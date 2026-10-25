import React, { useState, useMemo } from 'react'
import { Bookmark, Search, LayoutGrid, List, X, Heart, Compass } from 'lucide-react'
import StoreCard from '@/components/common/StoreCard'

export default function SavedStoresSection({
  savedStores = [],
  loading = false,
  onToggleSave,
  handleToggleSaveStore,
  setActiveStore,
  currentUser,
  onRequireLogin,
  setShowAuthModal,
  setAuthMode,
  onNavigateExplore,
  switchTab
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'compact'

  const toggleSaveHandler = onToggleSave || handleToggleSaveStore
  const navigateExplore = onNavigateExplore || (() => switchTab?.('explore'))
  const requireLoginHandler = onRequireLogin || (() => {
    if (setAuthMode) setAuthMode('login')
    if (setShowAuthModal) setShowAuthModal(true)
  })

  // Extract unique category names from saved stores
  const categories = useMemo(() => {
    if (!Array.isArray(savedStores)) return []
    const cats = new Set()
    savedStores.forEach((s) => {
      if (s?.categoryName) cats.add(s.categoryName)
    })
    return Array.from(cats)
  }, [savedStores])

  // Defensive filtering: APPROVED stores + category filter + search query
  const filteredStores = useMemo(() => {
    if (!Array.isArray(savedStores)) return []
    return savedStores.filter((s) => {
      if (!s) return false
      // Only show approved stores
      if (s.status && s.status !== 'APPROVED') return false

      // Category filter
      if (selectedCategory !== 'ALL' && s.categoryName !== selectedCategory) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = s.name?.toLowerCase().includes(q)
        const matchesCategory = s.categoryName?.toLowerCase().includes(q)
        const matchesAddress = s.addressLine?.toLowerCase().includes(q)
        if (!matchesName && !matchesCategory && !matchesAddress) return false
      }

      return true
    })
  }, [savedStores, selectedCategory, searchQuery])

  // Unauthenticated Fallback Screen
  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md brutalist-card bg-white p-6 sm:p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-5">
          <div className="w-16 h-16 bg-[#c92a2a] text-white border-3 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Bookmark className="w-8 h-8 fill-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black">
              Quán Ăn Đã Lưu
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-neutral-600 leading-relaxed">
              Vui lòng đăng nhập để lưu trữ, quản lý và đồng bộ danh sách những quán ăn yêu thích của bạn tại Cần Giuộc.
            </p>
          </div>
          <button
            type="button"
            onClick={requireLoginHandler}
            className="brutalist-btn-red text-xs py-3 px-6 w-full font-black flex items-center justify-center gap-2 uppercase cursor-pointer rounded-xl shadow-[3px_3px_0px_0px_#111]"
          >
            <span>Đăng Nhập Ngay ↗</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER & CONTROLS */}
      {/* ========================================================================= */}
      <section
        className="brutalist-card bg-white p-5 sm:p-7 border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5"
        aria-label="Thông tin quán đã lưu"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title & Subtitle */}
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="p-3 bg-[#c92a2a] text-white border-2 border-black rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Bookmark className="w-6 h-6 fill-white" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
                  Quán Ăn Đã Lưu
                </h1>
                <span className="text-xs font-black px-2.5 py-0.5 bg-black text-white rounded-full border border-black shadow-[1px_1px_0px_0px_#111]">
                  {savedStores.length} quán
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-neutral-600">
                Bộ sưu tập các địa điểm ẩm thực bạn đã đánh dấu để trải nghiệm tại Cần Giuộc.
              </p>
            </div>
          </div>

          {/* Search Input & Desktop View Toggle */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-72">
              <input
                id="saved-stores-search"
                type="text"
                placeholder="Tìm theo tên, địa chỉ, món..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brutalist-input brutalist-input-has-icon text-xs py-2.5 bg-white w-full pr-8 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#111]"
                aria-label="Tìm kiếm trong danh sách quán đã lưu"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop View Mode Toggle (Grid vs Compact) */}
            <div className="hidden md:flex items-center border-2 border-black rounded-xl bg-neutral-100 p-1 shadow-[2px_2px_0px_0px_#111] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_#111]'
                    : 'bg-transparent text-neutral-600 border-transparent hover:text-black'
                }`}
                title="Chế độ lưới ảnh lớn"
                aria-label="Chế độ lưới ảnh lớn"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_#111]'
                    : 'bg-transparent text-neutral-600 border-transparent hover:text-black'
                }`}
                title="Chế độ danh sách thu gọn"
                aria-label="Chế độ danh sách thu gọn"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills (if multiple categories available) */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none" aria-label="Lọc theo danh mục ẩm thực">
            <span className="text-[11px] font-black uppercase text-neutral-600 shrink-0 mr-1">
              Danh mục:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`text-xs font-black px-3 py-1 rounded-full border-2 border-black transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#111]'
                  : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_#111]'
              }`}
            >
              Tất Cả ({savedStores.length})
            </button>
            {categories.map((catName) => {
              const isSelected = selectedCategory === catName
              const count = savedStores.filter((s) => s?.categoryName === catName).length
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategory(catName)}
                  className={`text-xs font-black px-3 py-1 rounded-full border-2 border-black transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_#111]'
                      : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_#111]'
                  }`}
                >
                  {catName} ({count})
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT: STORES GRID / EMPTY / LOADING */}
      {/* ========================================================================= */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="brutalist-card bg-white p-4 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] space-y-3"
            >
              <div className="h-44 bg-neutral-200 border-2 border-black rounded-lg animate-pulse" />
              <div className="h-5 bg-neutral-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredStores.length > 0 ? (
        /* Populated Stores Grid */
        <div
          className={
            viewMode === 'compact'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
          }
        >
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={{ ...store, isSaved: true }}
              setActiveStore={setActiveStore}
              viewMode={viewMode}
              onToggleSave={toggleSaveHandler}
            />
          ))}
        </div>
      ) : savedStores.length > 0 ? (
        /* Search has 0 results */
        <div className="p-8 sm:p-12 text-center bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-amber-100 border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[2.5px_2.5px_0px_0px_#111]">
            <Search className="w-7 h-7 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase text-black">
              Không Tìm Thấy Kết Quả
            </h3>
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              Không có quán đã lưu nào khớp với từ khóa "{searchQuery}"
              {selectedCategory !== 'ALL' && ` trong danh mục ${selectedCategory}`}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('ALL')
            }}
            className="brutalist-btn-white text-xs py-2.5 px-5 font-black uppercase rounded-xl"
          >
            Xóa Bộ Lọc Tìm Kiếm
          </button>
        </div>
      ) : (
        /* Global Empty State: User has saved 0 stores */
        <div className="p-8 sm:p-12 text-center bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#f7f6f2] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Heart className="w-8 h-8 text-[#c92a2a]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black uppercase text-black">
              Chưa Có Quán Ăn Nào Được Lưu
            </h3>
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              Hãy bấm vào biểu tượng Bookmark trên các quán ăn tại Cần Giuộc để lưu lại và xem lại bất cứ lúc nào!
            </p>
          </div>
          <button
            type="button"
            onClick={navigateExplore}
            className="brutalist-btn-red text-xs py-3 px-6 w-full font-black flex items-center justify-center gap-2 uppercase rounded-xl shadow-[3px_3px_0px_0px_#111] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Khám Phá Quán Ăn Ngay ↗</span>
          </button>
        </div>
      )}
    </div>
  )
}
