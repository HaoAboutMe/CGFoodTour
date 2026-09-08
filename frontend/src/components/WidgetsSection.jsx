import React from 'react'
import { Shuffle, Loader2, Trophy, MapPin } from 'lucide-react'

export default function WidgetsSection({
  handleRandomPick,
  rollingRandom,
  randomResult,
  setRandomResult,
  setActiveStore,
  loadLeaderboard,
  leaderboard,
  stores
}) {
  return (
    <div className="lg:col-span-4 space-y-8">
      {/* 🎲 Random Picker Widget */}
      <div className="brutalist-card bg-white p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="space-y-1 border-b-2 border-black pb-2">
          <span className="brutalist-badge bg-[#ff3e3e] text-white">Gourmet Spinner</span>
          <h3 className="text-lg font-black uppercase text-black flex items-center gap-2 mt-1">
            <Shuffle className="w-5 h-5 text-[#ff3e3e]" /> Chọn Ngẫu Nhiên
          </h3>
        </div>
        <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
          Không biết hôm nay ăn gì? Bấm nút để quay ngẫu nhiên một quán ngon đang mở cửa!
        </p>

        <button
          onClick={handleRandomPick}
          disabled={rollingRandom}
          className="w-full brutalist-btn-red text-xs py-3 tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {rollingRandom ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Đang Tìm Quán...
            </>
          ) : (
            'Quay Chọn Quán Ngon 🎲'
          )}
        </button>

        {/* Random pick result animation box */}
        {randomResult && (
          <div className="p-4 bg-[#f7f6f2] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-fade-in-up space-y-3">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-sm font-black uppercase text-black line-clamp-1">{randomResult.name}</h4>
              <span className="brutalist-badge bg-white text-black border-black shrink-0">
                {randomResult.categoryName}
              </span>
            </div>
            <div className="space-y-1 text-xs font-bold text-neutral-700">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-black font-extrabold">{randomResult.satisfactionRate}% Hài Lòng</span>
                <span className="text-neutral-500">({randomResult.totalVotes} lượt vote)</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#ff3e3e]" />
                <span className="text-neutral-600 truncate">{randomResult.addressLine}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveStore(randomResult)
                  setRandomResult(null)
                }}
                className="flex-1 brutalist-btn-white py-1.5 px-2 text-[10px] font-black uppercase"
              >
                Xem Chi Tiết ↗
              </button>
              <button
                onClick={() => setRandomResult(null)}
                className="p-1.5 border-2 border-black rounded-full bg-white hover:bg-neutral-100 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🏆 Leaderboard Widget */}
      <div className="brutalist-card bg-white p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="space-y-1">
            <span className="brutalist-badge bg-[#ff3e3e] text-white">Top Ratings</span>
            <h3 className="text-lg font-black uppercase text-black flex items-center gap-2 mt-1">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Bảng Xếp Hạng
            </h3>
          </div>
          <button
            onClick={loadLeaderboard}
            className="brutalist-badge bg-white text-black border-black hover:bg-neutral-50 cursor-pointer shadow-none"
          >
            Tải Lại
          </button>
        </div>

        <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
          Các quán ăn được đánh giá hài lòng cao nhất (tối thiểu 10 lượt vote để lên bảng).
        </p>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs border-2 border-dashed border-neutral-300 rounded font-bold bg-[#f7f6f2]">
            Bấm "Tải Lại" để hiển thị danh sách quán ngon hàng đầu.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((s, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    const selected = stores.find((store) => store.id === s.id)
                    if (selected) setActiveStore(selected)
                  }}
                  className="flex items-center justify-between p-2.5 bg-[#f7f6f2] border-2 border-black rounded hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-black text-black shrink-0 w-6 text-center">{medal}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-black truncate">{s.name}</p>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide truncate">{s.categoryName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#ff3e3e]">{s.satisfactionRate}%</p>
                    <p className="text-[9px] font-bold text-neutral-500">{s.totalVotes} vote</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
