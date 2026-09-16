import React from 'react'
import { Trophy, MapPin, Clock } from 'lucide-react'
import { checkStoreOpenStatus } from '../utils/timeUtils'

function StoreCard({ store, setActiveStore, viewMode = 'grid' }) {
  if (!store) return null
  const statusInfo = checkStoreOpenStatus(store)

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 1. MOBILE DEDICATED HORIZONTAL CARD (md:hidden) */}
      {/* ========================================================================= */}
      <div
        onClick={() => setActiveStore && setActiveStore(store)}
        className="md:hidden brutalist-card bg-white cursor-pointer p-2.5 relative flex items-center gap-3 w-full rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#111111] transition-all select-none group"
      >
        {/* Left: Square Image with Badges */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative rounded-lg border-2 border-black overflow-hidden bg-neutral-200">
          <img
            src={
              store.bannerImageUrl ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=60'
            }
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Rating Badge Overlay (Top-Right) */}
          <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-white border border-black rounded-full px-1.5 py-0.2 text-[9px] font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Trophy className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span>{store.satisfactionRate}%</span>
          </div>

          {/* Real-time Status Badge Overlay (Bottom) */}
          {!statusInfo.isOpen ? (
            <div className="absolute inset-x-0 bottom-0 bg-red-900/90 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-wider border-t border-black">
              {statusInfo.statusText || 'HẾT GIỜ'}
            </div>
          ) : (
            <div className="absolute bottom-1 left-1 bg-[#e6fcf5] text-[#0ca678] border border-black rounded px-1 py-0.2 text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_#111]">
              ĐANG MỞ
            </div>
          )}
        </div>

        {/* Right: Comprehensive Store Details (No cramped truncated text) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 gap-1">
          {/* Row 1: Category Tag & Distance */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="brutalist-badge bg-[#f7f6f2] text-black border border-black text-[8px] sm:text-[9px] py-0.2 px-1.5 font-black uppercase shadow-[1px_1px_0px_0px_#111111] truncate max-w-[120px]">
              {store.categoryName || 'Ẩm thực'}
            </span>
            {store.distanceKm && (
              <span className="text-[9px] font-extrabold text-[#ff3e3e] shrink-0">
                📍 {store.distanceKm} km
              </span>
            )}
          </div>

          {/* Row 2: Full Store Name (2 lines, clear & bold) */}
          <h3 className="text-xs sm:text-sm font-black uppercase text-black group-hover:text-[#ff3e3e] line-clamp-2 leading-snug break-words">
            {store.name}
          </h3>

          {/* Row 3: Store Address */}
          <div className="flex items-start gap-1 text-[10px] sm:text-[11px] font-semibold text-neutral-600 break-words">
            <MapPin className="w-3 h-3 text-[#ff3e3e] shrink-0 mt-0.5" />
            <span className="break-words text-neutral-800 line-clamp-1">{store.addressLine || 'Cần Giuộc, Long An'}</span>
          </div>

          {/* Row 4: Service Hours & Price Range */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-200 text-[9px] sm:text-[10px] font-bold text-neutral-700">
            <div className="flex items-center gap-1 text-neutral-600">
              <Clock className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
              <span>{store.openTime || '06:00'}–{store.closeTime || '22:00'}</span>
            </div>
            <div className="font-black text-[10px] sm:text-[11px] text-[#ff3e3e] truncate">
              {store.priceMin?.toLocaleString()}đ–{store.priceMax?.toLocaleString()}đ
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 2. DESKTOP ORIGINAL CARDS (hidden md:flex) - 100% INTACT */}
      {/* ========================================================================= */}
      {viewMode === 'compact' ? (
        <div
          onClick={() => setActiveStore && setActiveStore(store)}
          className="hidden md:flex brutalist-card bg-white cursor-pointer p-3 relative flex-col justify-between gap-2.5 w-full rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#111111] transition-all select-none group h-full"
        >
          {/* Category Badge pinned to Top-Right Corner */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-white text-black border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#111111] whitespace-nowrap">
              {store.categoryName || 'Ẩm thực'}
            </span>
          </div>

          {/* Top Section: Image + Red Bold Name & Address */}
          <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-20">
            <div className="relative shrink-0">
              <img
                src={
                  store.bannerImageUrl ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=60'
                }
                alt={store.name}
                className="w-16 h-16 border-2 border-black rounded-lg object-cover"
              />
              {!statusInfo.isOpen && (
                <div className="absolute inset-0 bg-red-900/80 rounded-lg flex items-center justify-center text-[8px] font-black text-white text-center uppercase p-0.5 leading-tight border border-black">
                  {statusInfo.statusText || 'HẾT GIỜ PHỤC VỤ'}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <h3 className="text-sm font-black uppercase text-[#ff3e3e] leading-snug line-clamp-2 break-words">
                {store.name}
              </h3>
              <div className="flex items-start gap-1 text-[11px] font-bold text-neutral-800 break-words">
                <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
                <span className="break-words text-neutral-700 line-clamp-1">{store.addressLine || 'Cần Giuộc, Long An'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Horizontal Row */}
          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-200 text-[10px] font-black text-black">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <div className="flex items-center gap-1 text-neutral-600">
                <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                <span>{store.openTime || '06:00'}–{store.closeTime || '22:00'}</span>
              </div>
              <span className="text-neutral-300 font-bold">•</span>
              <div className="font-black text-[#ff3e3e] truncate">
                {store.priceMin?.toLocaleString()}đ–{store.priceMax?.toLocaleString()}đ
              </div>
            </div>

            <div className="flex items-center gap-0.5 bg-white border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black text-black shadow-[1px_1px_0px_0px_#111111] shrink-0">
              <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-400 shrink-0" />
              <span>{store.satisfactionRate}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setActiveStore(store)}
          className="hidden md:flex brutalist-card bg-white cursor-pointer overflow-hidden flex-col justify-between group relative w-full h-full min-h-[340px]"
        >
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Banner Image */}
            <div className="h-40 w-full relative bg-neutral-200 border-b-2 border-black shrink-0">
              <img
                src={
                  store.bannerImageUrl ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
                }
                alt={store.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Ratings Badge Overlay */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white border-2 border-black rounded-full px-2 py-0.5 text-[11px] font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span>{store.satisfactionRate}%</span>
                <span className="text-[8px] text-neutral-500 font-semibold">({store.totalVotes})</span>
              </div>

              {/* Real-time Closed Status Overlay */}
              {!statusInfo.isOpen && (
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="brutalist-badge bg-[#ff3e3e] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_#111111] py-0.5 px-2 text-[9px]">
                    {statusInfo.statusText}
                  </span>
                </div>
              )}
            </div>

            {/* Info Body */}
            <div className="p-3.5 space-y-2 relative flex-1 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-black uppercase text-black leading-snug break-words flex-1 group-hover:text-[#ff3e3e]">
                  {store.name}
                </h3>
                <span className="brutalist-badge bg-[#f7f6f2] text-black border-2 border-black text-[9px] py-0.5 px-2 shrink-0 whitespace-nowrap shadow-[1px_1px_0px_0px_#111111]">
                  {store.categoryName || 'Ẩm thực'}
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] font-bold text-neutral-600 break-words mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
                <span className="break-words text-black">{store.addressLine || 'Cần Giuộc, Long An'}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-[#f7f6f2] border-t-2 border-black text-[11px] font-bold text-neutral-700 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-black">
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-[10px]">{store.openTime || '06:00'} - {store.closeTime || '22:00'}</span>
              </div>
              <div className="font-black text-xs text-[#ff3e3e]">
                {store.priceMin?.toLocaleString()}đ - {store.priceMax?.toLocaleString()}đ
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default React.memo(StoreCard)
