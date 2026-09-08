import React, { useState } from 'react'
import { Sparkles, RefreshCw, Compass, Utensils, Coffee, IceCream, LayoutGrid, ListFilter, Search } from 'lucide-react'
import StoreCard from './StoreCard'
import WidgetsSection from './WidgetsSection'

function getCategoryIcon(iconName) {
  const name = iconName ? iconName.toLowerCase() : ''
  if (name.includes('utensils') || name.includes('bowl')) return <Utensils className="w-4 h-4" />
  if (name.includes('coffee') || name.includes('beer') || name.includes('glass')) return <Coffee className="w-4 h-4" />
  if (name.includes('ice-cream') || name.includes('cookie')) return <IceCream className="w-4 h-4" />
  return <Compass className="w-4 h-4" />
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
  loadLeaderboard,
  leaderboard,
}) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'compact'

  // Filtered stores
  const approvedStores = stores.filter((st) => st.status === 'APPROVED')
  const filteredStores = approvedStores.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.addressLine && st.addressLine.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory
      ? st.categoryId === selectedCategory.id
      : true

    return matchesSearch && matchesCategory
  })

  // Calculate store count per category
  const categoryStoreCount = (catId) => {
    if (!catId) return approvedStores.length
    return approvedStores.filter((st) => st.categoryId === catId).length
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      {/* Compact Hero Banner */}
      <div className="brutalist-card bg-white p-4 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="brutalist-badge bg-[#ff3e3e] text-white">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 align-middle" /> Cần Giuộc Food Tour
            </span>
            <span className="brutalist-badge bg-[#fff9db] text-black border-black">
              🔥 {approvedStores.length} Địa điểm đang phục vụ
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Bản Đồ Ẩm Thực Cần Giuộc
          </h1>
          <p className="text-neutral-600 text-xs sm:text-sm font-semibold max-w-xl">
            Khám phá đặc sản địa phương, đánh giá thực tế từ cộng đồng foodie, cập nhật trạng thái mở cửa theo thời gian thực.
          </p>
        </div>

        {/* View Mode Switcher & Quick Stats */}
        <div className="flex items-center gap-2 bg-[#f7f6f2] p-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
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
      <div className="brutalist-card bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Tìm tên món ăn, quán ăn, tên đường tại Cần Giuộc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="brutalist-input pl-10"
          />
        </div>

        {/* Complete Category Badges (No vertical scrolling needed!) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-neutral-500">
              Tất Cả Danh Mục ({categories.length + 1}):
            </span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] uppercase font-black text-[#ff3e3e] hover:underline"
              >
                Xóa bộ lọc ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 border-2 border-black rounded-full text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-neutral-50'
              }`}
            >
              <span>🍽️ Tất Cả Món</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === null ? 'bg-white text-[#ff3e3e]' : 'bg-neutral-100 text-black'}`}>
                {approvedStores.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = categoryStoreCount(cat.id)
              const isSelected = selectedCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 border-2 border-black rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                      : 'bg-white text-black hover:bg-neutral-50'
                  }`}
                >
                  {getCategoryIcon(cat.icon || cat.iconUrl)}
                  <span>{cat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-[#f7f6f2] text-black border border-black'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bento Layout: Store Cards & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Store Items Grid / List (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#ff3e3e]">LIVE STALLS</span>
              <h2 className="text-lg sm:text-xl font-black text-black">
                {selectedCategory ? `Danh Mục: ${selectedCategory.name}` : 'Quán Ăn Nổi Bật'} ({filteredStores.length})
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

          {filteredStores.length === 0 ? (
            <div className="brutalist-card bg-white p-8 sm:p-12 text-center text-neutral-600 space-y-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Compass className="w-10 h-10 mx-auto text-[#ff3e3e] animate-pulse" />
              <p className="text-sm font-black text-black uppercase">Không tìm thấy quán ăn phù hợp</p>
              <p className="text-xs text-neutral-600 font-semibold">
                Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác nhé!
              </p>
            </div>
          ) : viewMode === 'compact' ? (
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  setActiveStore={setActiveStore}
                  viewMode="compact"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  setActiveStore={setActiveStore}
                  viewMode="grid"
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Widgets (4/12) */}
        <WidgetsSection
          handleRandomPick={handleRandomPick}
          rollingRandom={rollingRandom}
          randomResult={randomResult}
          setRandomResult={setRandomResult}
          setActiveStore={setActiveStore}
          loadLeaderboard={loadLeaderboard}
          leaderboard={leaderboard}
          stores={stores}
        />
      </div>
    </div>
  )
}
