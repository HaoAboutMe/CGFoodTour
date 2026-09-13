import React from 'react'
import { Trophy, MapPin, Clock } from 'lucide-react'
import { checkStoreOpenStatus } from '../utils/timeUtils'

export default function StoreCard({ store, setActiveStore, viewMode = 'grid' }) {
  if (!store) return null
  const statusInfo = checkStoreOpenStatus(store)

  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => setActiveStore && setActiveStore(store)}
        className="brutalist-card bg-white cursor-pointer p-3 relative flex flex-col justify-between gap-2.5 w-full rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#111111] transition-all select-none group h-full"
      >
        {/* Category Badge pinned to Top-Right Corner */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-white text-black border-2 border-black rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#111111] whitespace-nowrap">
            {store.categoryName || 'Ẩm thực'}
          </span>
        </div>

        {/* Top Section: Image + Red Bold Name & Address */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-16 sm:pr-20">
          <div className="relative shrink-0">
            <img
              src={
                store.bannerImageUrl ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=60'
              }
              alt={store.name}
              className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-black rounded-lg object-cover"
            />
            {!statusInfo.isOpen && (
              <div className="absolute inset-0 bg-red-900/80 rounded-lg flex items-center justify-center text-[8px] font-black text-white text-center uppercase p-0.5 leading-tight border border-black">
                {statusInfo.statusText || 'HẾT GIỜ PHỤC VỤ'}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1 pt-0.5">
            {/* FULL Red Bold Store Name */}
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#ff3e3e] leading-snug line-clamp-2 break-words">
              {store.name}
            </h3>

            {/* FULL Store Address */}
            <div className="flex items-start gap-1 text-[11px] font-bold text-neutral-800 break-words">
              <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
              <span className="break-words text-neutral-700 line-clamp-1">{store.addressLine || 'Cần Giuộc, Long An'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Row: Price Range & Opening Hours + Rating Badge */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-200 text-[10px] font-black text-black">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <div className="flex items-center gap-1 text-neutral-600">
              <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>
                {store.openTime || '06:00'}–{store.closeTime || '22:00'}
              </span>
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
    )
  }

  return (
    <div
      onClick={() => setActiveStore(store)}
      className="brutalist-card bg-white cursor-pointer overflow-hidden flex flex-col justify-between group relative w-full h-full min-h-[340px]"
    >
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* Banner Image */}
        <div className="h-36 sm:h-40 w-full relative bg-neutral-200 border-b-2 border-black shrink-0">
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

          {/* Real-time Closed Status Overlay Badge on Image */}
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
            {/* FULL Store Name */}
            <h3 className="text-xs sm:text-sm font-black uppercase text-black leading-snug break-words flex-1 group-hover:text-[#ff3e3e]">
              {store.name}
            </h3>
            <span className="brutalist-badge bg-[#f7f6f2] text-black border-2 border-black text-[9px] py-0.5 px-2 shrink-0 whitespace-nowrap shadow-[1px_1px_0px_0px_#111111]">
              {store.categoryName || 'Ẩm thực'}
            </span>
          </div>

          {/* FULL Store Address */}
          <div className="flex items-start gap-1.5 text-[11px] font-bold text-neutral-600 break-words mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
            <span className="break-words text-black">{store.addressLine || 'Cần Giuộc, Long An'}</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Horizontal Row with Opening Time & Price Min-Max */}
      <div className="p-3 bg-[#f7f6f2] border-t-2 border-black text-[11px] font-bold text-neutral-700 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-black">
            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-[10px]">
              {store.openTime || '06:00'} - {store.closeTime || '22:00'}
            </span>
          </div>
          <div className="font-black text-xs text-[#ff3e3e]">
            {store.priceMin?.toLocaleString()}đ - {store.priceMax?.toLocaleString()}đ
          </div>
        </div>
      </div>
    </div>
  )
}

