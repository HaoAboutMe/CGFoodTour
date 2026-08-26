import React from 'react'
import { Sparkles, RefreshCw, Compass, Utensils, Coffee, IceCream } from 'lucide-react'
import StoreCard from './StoreCard'
import WidgetsSection from './WidgetsSection'

function getCategoryIcon(iconName) {
  const name = iconName ? iconName.toLowerCase() : ''
  if (name.includes('utensils') || name.includes('bowl')) return <Utensils className="w-5 h-5" />
  if (name.includes('coffee') || name.includes('beer') || name.includes('glass')) return <Coffee className="w-5 h-5" />
  if (name.includes('ice-cream') || name.includes('cookie')) return <IceCream className="w-5 h-5" />
  return <Compass className="w-5 h-5" />
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
  // Filtered stores
  const filteredStores = stores.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.addressLine && st.addressLine.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory
      ? st.categoryId === selectedCategory.id
      : true

    const isLive = st.status === 'APPROVED'
    return matchesSearch && matchesCategory && isLive
  })

  return (
    <div className="space-y-16 animate-fade-in-up">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <div className="inline-block">
          <span className="brutalist-badge bg-[#ff3e3e] text-white">
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5 align-middle" /> Cần Giuộc Culinary Map
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black">
          Khám Phá Ẩm Thực
        </h1>
        <p className="text-neutral-700 text-sm md:text-base font-semibold leading-relaxed">
          Taste local culinary specialties in Cần Giuộc. Access reviews from community foodies, verify locations, and check live opening times.
        </p>
      </div>

      {/* Search bar & filter container */}
      <div className="max-w-3xl mx-auto">
        <div className="brutalist-card bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm tên quán, địa danh, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brutalist-input"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2.5 border-3 border-black text-xs font-black transition-all ${
                selectedCategory === null
                  ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-neutral-50 active:translate-y-[1px]'
              }`}
            >
              Tất Cả Món
            </button>
            <div className="h-6 w-px bg-neutral-300 hidden md:block" />
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[200px] md:max-w-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 border-3 border-black text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    selectedCategory?.id === cat.id
                      ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black hover:bg-neutral-50 active:translate-y-[1px]'
                  }`}
                >
                  {getCategoryIcon(cat.icon || cat.iconUrl)}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Layout: Main Live Food Tour Grid & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Store Grid Left Column (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00f2fe]">LIVE STALLS</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Active Food Spots ({filteredStores.length})</h2>
            </div>
            <button
              onClick={loadGlobalData}
              className="p-2 rounded-2xl border border-white/5 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {filteredStores.length === 0 ? (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-12 text-center text-neutral-500 space-y-3">
                <Compass className="w-10 h-10 mx-auto text-neutral-600 animate-pulse" />
                <p className="text-sm font-semibold">No food spots match your filters.</p>
                <p className="text-xs text-neutral-600">Be the first to submit a new gourmet spot in Cần Giuộc!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  setActiveStore={setActiveStore}
                />
              ))}
            </div>
          )}
        </div>

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
