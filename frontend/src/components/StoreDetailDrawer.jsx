import React from 'react'
import { X, Trophy, MapPin, Phone, DollarSign, ThumbsUp, Meh, ThumbsDown } from 'lucide-react'

export default function StoreDetailDrawer({
  activeStore,
  setActiveStore,
  handleSubmitRating,
  handleReportClosedToday,
  gpsLat,
  setGpsLat,
  gpsLng,
  setGpsLng
}) {
  if (!activeStore) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
      {/* Close click backdrop */}
      <div className="absolute inset-0" onClick={() => setActiveStore(null)} />

      {/* Drawer content (Right slide) */}
      <div className="w-full max-w-lg bg-white border-l-4 border-black h-full overflow-y-auto relative z-10 shadow-2xl flex flex-col justify-between animate-slide-in-right">
        <div>
          {/* Header Image banner */}
          <div className="h-56 w-full relative bg-neutral-200 border-b-4 border-black shrink-0">
            <img
              src={
                activeStore.bannerImageUrl ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
              }
              alt={activeStore.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setActiveStore(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black rounded-full hover:bg-neutral-100 text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-1 min-w-0">
                <span className="brutalist-badge bg-[#ff3e3e] text-white">
                  {activeStore.categoryName || 'Live Spot'}
                </span>
                <h2 className="text-lg md:text-xl font-black text-black truncate">{activeStore.name}</h2>
              </div>
              <div className="flex items-center gap-1 bg-white border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{activeStore.satisfactionRate}%</span>
                <span className="text-[9px] text-neutral-500 font-semibold">({activeStore.totalVotes})</span>
              </div>
            </div>
          </div>

          {/* Main Content Info */}
          <div className="p-6 space-y-6">
            {/* Status indicators */}
            <div className="flex items-center justify-between p-4 bg-[#f7f6f2] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border-2 border-black ${
                    activeStore.isReportedClosed ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-black text-black">
                  {activeStore.isReportedClosed ? 'Báo Đóng Cửa Hôm Nay' : 'Đang Mở Cửa & Phục Vụ'}
                </span>
              </div>
              <span className="text-[11px] font-black text-neutral-700">
                {activeStore.openTime || 'N/A'} - {activeStore.closeTime || 'N/A'}
              </span>
            </div>

            {/* Details layout list */}
            <div className="space-y-4 brutalist-card p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start gap-3 text-xs text-black">
                <MapPin className="w-4 h-4 text-[#ff3e3e] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-sm uppercase">Địa Chỉ Chi Tiết</p>
                  <p className="font-bold text-neutral-600">{activeStore.addressLine || 'Địa chỉ chưa cập nhật'}</p>
                  {activeStore.landmarkNote && (
                    <p className="text-[#ff3e3e] italic font-black">“ {activeStore.landmarkNote} ”</p>
                  )}
                  {activeStore.latitude && activeStore.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeStore.latitude},${activeStore.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-black hover:text-[#ff3e3e] underline"
                    >
                      Bản Đồ Google Maps ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                <div>
                  <p className="font-extrabold uppercase">Số Điện Thoại</p>
                  <p className="font-bold text-neutral-600">{activeStore.phoneNumber || 'Không có số liên hệ'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                <DollarSign className="w-4 h-4 text-[#ff3e3e] shrink-0" />
                <div>
                  <p className="font-extrabold uppercase">Khoảng Giá</p>
                  <p className="font-black text-[#ff3e3e]">
                    {activeStore.priceMin?.toLocaleString()}đ - {activeStore.priceMax?.toLocaleString()}đ
                  </p>
                </div>
              </div>
            </div>

            {/* Food Items menu */}
            <div className="space-y-4 pt-6 border-t-2 border-black">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                🍽️ Thực Đơn Quán Ăn
              </h3>
              {!activeStore.foodItems || activeStore.foodItems.length === 0 ? (
                <p className="text-xs text-neutral-500 italic font-semibold">Chưa có món ăn nào được đăng.</p>
              ) : (
                <div className="space-y-4">
                  {activeStore.foodItems.map((food) => (
                    <div
                      key={food.id}
                      className="flex gap-4 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <img
                        src={
                          food.imageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'
                        }
                        alt={food.name}
                        className="w-16 h-16 border-2 border-black rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-black text-black">{food.name}</p>
                          <p className="text-[10px] text-neutral-600 truncate mt-0.5">{food.description}</p>
                        </div>
                        <p className="text-xs font-black text-[#ff3e3e]">
                          {food.price?.toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rating & Closed Reports block */}
            <div className="space-y-4 pt-6 border-t-2 border-black">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">💬 Tương Tác & Đánh Giá</h3>

              {/* 1-Touch rating pills */}
              <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[11px] font-black text-black uppercase tracking-wider">Đánh giá nhanh về quán ăn này?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitRating(activeStore.id, 'VERY_SATISFIED')}
                    className="flex-1 py-2 bg-white text-emerald-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 fill-emerald-100" /> Ngon
                  </button>
                  <button
                    onClick={() => handleSubmitRating(activeStore.id, 'NORMAL')}
                    className="flex-1 py-2 bg-white text-neutral-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Meh className="w-3.5 h-3.5 fill-neutral-100" /> Bình Thường
                  </button>
                  <button
                    onClick={() => handleSubmitRating(activeStore.id, 'NOT_SATISFIED')}
                    className="flex-1 py-2 bg-white text-red-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-red-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 fill-red-100" /> Không Ngon
                  </button>
                </div>
              </div>

              {/* Report Store Closed Section */}
              <div className="space-y-3 bg-[#fff5f5] p-4 border-2 border-red-500 rounded-xl shadow-[3px_3px_0px_0px_#111111]">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">Báo Quán Nghỉ Hôm Nay</p>
                    <p className="text-[10px] text-red-700 font-semibold leading-normal">
                      Yêu cầu bật GPS để xác thực khoảng cách dưới 100m.
                    </p>
                  </div>
                  <button
                    onClick={() => handleReportClosedToday(activeStore.id)}
                    className="brutalist-btn-red text-[10px] font-black uppercase shrink-0"
                  >
                    Báo Đóng Cửa 📍
                  </button>
                </div>

                {/* Simulated GPS Coordinate Inputs for testing */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-red-200 text-[10px]">
                  <div>
                    <label className="text-red-700 font-bold block mb-1">Vĩ Độ Của Bạn</label>
                    <input
                      type="text"
                      value={gpsLat}
                      onChange={(e) => setGpsLat(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded px-2 py-1 text-black font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-red-700 font-bold block mb-1">Kinh Độ Của Bạn</label>
                    <input
                      type="text"
                      value={gpsLng}
                      onChange={(e) => setGpsLng(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded px-2 py-1 text-black font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
