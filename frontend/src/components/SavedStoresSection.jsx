import React, { useState, useMemo } from 'react'
import { Bookmark, Search, Store, MapPin, Clock, ExternalLink, Trash2, Heart, ShieldAlert } from 'lucide-react'
import { checkStoreOpenStatus } from '@/utils/timeUtils'

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
  onNavigateExplore
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSaveHandler = onToggleSave || handleToggleSaveStore
  const requireLoginHandler = onRequireLogin || (() => {
    if (setAuthMode) setAuthMode('login')
    if (setShowAuthModal) setShowAuthModal(true)
  })

  // Defensive array handling, APPROVED status filtering & search query
  const filteredStores = useMemo(() => {
    if (!Array.isArray(savedStores)) return []
    const approvedList = savedStores.filter((s) => s && s.status === 'APPROVED')
    if (!searchQuery.trim()) return approvedList

    const q = searchQuery.toLowerCase()
    return approvedList.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
        (s.addressLine && s.addressLine.toLowerCase().includes(q))
    )
  }, [savedStores, searchQuery])

  // Unauthenticated Fallback Screen
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md brutalist-card bg-white p-6 sm:p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
          <div className="w-16 h-16 bg-[#ff3e3e] text-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-black">Quán Ăn Đã Lưu Cá Nhân</h2>
            <p className="text-xs font-bold text-neutral-600">
              Vui lòng đăng nhập để xem và quản lý danh sách các quán ăn yêu thích đã lưu của riêng bạn.
            </p>
          </div>
          <button
            onClick={requireLoginHandler}
            className="brutalist-btn-red text-xs py-3 px-6 w-full font-black flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <span>Đăng Nhập Ngay</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in-up">
      {/* Top Banner Header */}
      <section className="brutalist-card bg-white p-5 sm:p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#ff3e3e] text-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Bookmark className="w-6 h-6 fill-white" />
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
                Quán Ăn Đã Lưu ({savedStores.length})
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-bold text-neutral-600 max-w-2xl">
              Danh sách quán ăn bạn đã đánh dấu lưu lại để thưởng thức tại Cần Giuộc.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm quán đã lưu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brutalist-input brutalist-input-has-icon text-xs py-2.5 bg-white w-full"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs font-black uppercase text-neutral-500 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Đang tải danh sách quán đã lưu...
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            const status = checkStoreOpenStatus(store)
            return (
              <div
                key={store.id}
                className="brutalist-card bg-white p-3.5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between gap-3 group relative select-none"
              >
                {/* Image Banner Container */}
                <div
                  onClick={() => setActiveStore && setActiveStore(store)}
                  className="h-40 w-full relative rounded-xl border-2 border-black overflow-hidden bg-neutral-200 cursor-pointer"
                >
                  <img
                    src={
                      store.bannerImageUrl ||
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80'
                    }
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Status Overlay */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-black border border-black rounded-md flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    status.isOpen ? 'bg-emerald-400 text-black' : 'bg-red-400 text-white'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-black animate-pulse' : 'bg-white'}`} />
                    <span>{status.statusText}</span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="brutalist-badge bg-white text-black border border-black text-[9px] py-0.5 px-2 font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {store.categoryName || 'Ẩm thực'}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => setActiveStore && setActiveStore(store)}
                      className="font-black text-sm uppercase text-black group-hover:text-[#ff3e3e] cursor-pointer line-clamp-2 leading-snug break-words"
                    >
                      {store.name}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-600 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0" />
                      <span className="truncate">{store.addressLine || 'Cần Giuộc, Long An'}</span>
                    </p>
                  </div>

                  {/* Operational Hours & Price */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700 pt-2 border-t border-neutral-200">
                    <span className="flex items-center gap-1 text-neutral-600">
                      <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span>{store.openTime || '06:00'} - {store.closeTime || '22:00'}</span>
                    </span>
                    <span className="font-black text-[#ff3e3e]">
                      {store.priceMin?.toLocaleString()}đ - {store.priceMax?.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveStore && setActiveStore(store)}
                    className="flex-1 px-3 py-2 bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    <span>Xem Chi Tiết</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleSaveHandler && toggleSaveHandler(store.id)}
                    className="px-3 py-2 bg-[#ff3e3e] hover:bg-red-600 text-white border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0"
                    title="Bỏ lưu quán ăn này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bỏ Lưu</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#f7f6f2] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Heart className="w-8 h-8 text-[#ff3e3e]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase text-black">Chưa Có Quán Ăn Nào Đã Lưu</h3>
            <p className="text-xs font-bold text-neutral-600">
              {searchQuery
                ? 'Không tìm thấy quán đã lưu phù hợp với từ khóa.'
                : 'Bạn chưa lưu quán ăn nào. Hãy bấm lưu biểu tượng Bookmark khi khám phá các quán ăn yêu thích tại Cần Giuộc!'}
            </p>
          </div>
          {onNavigateExplore && (
            <button
              onClick={onNavigateExplore}
              className="brutalist-btn-red text-xs py-3 px-6 w-full font-black flex items-center justify-center gap-2 uppercase"
            >
              <Store className="w-4 h-4" />
              <span>Khám Phá Quán Ăn Ngay</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
