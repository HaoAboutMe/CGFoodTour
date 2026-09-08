import React from 'react'
import { Trophy, MapPin, Clock } from 'lucide-react'

export default function StoreCard({ store, setActiveStore }) {
  return (
    <div
      onClick={() => setActiveStore(store)}
      className="brutalist-card bg-white cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Banner Image */}
        <div className="h-44 w-full relative bg-neutral-200 border-b-2 border-black shrink-0">
          <img
            src={
              store.bannerImageUrl ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
            }
            alt={store.name}
            className="w-full h-full object-cover"
          />

          {/* Ratings Badge Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span>{store.satisfactionRate}%</span>
            <span className="text-[9px] text-neutral-500 font-semibold">({store.totalVotes})</span>
          </div>

          {/* Verification/Closed status overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {store.isReportedClosed ? (
              <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] shadow-none">
                Đóng Cửa Hôm Nay
              </span>
            ) : (
              <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] shadow-none">
                Đang Mở
              </span>
            )}
            <span className="brutalist-badge bg-white text-black border-black shadow-none">
              {store.categoryName || 'Dishes'}
            </span>
          </div>
        </div>

        {/* Info Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-black uppercase text-black line-clamp-1 group-hover:text-[#ff3e3e]">
              {store.name}
            </h3>
            <p className="text-xs text-neutral-600 font-semibold line-clamp-2 mt-1">
              {store.landmarkNote || 'Không có mô tả chi tiết vị trí.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-[#f7f6f2] border-t-2 border-black space-y-2 text-xs font-bold text-neutral-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0" />
          <span className="truncate text-black">{store.addressLine || 'Cần Giuộc, Long An'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-black">
              {store.openTime || '06:00'} - {store.closeTime || '22:00'}
            </span>
          </div>
          <div className="font-extrabold text-[#ff3e3e]">
            {store.priceMin?.toLocaleString()}đ - {store.priceMax?.toLocaleString()}đ
          </div>
        </div>
      </div>
    </div>
  )
}
