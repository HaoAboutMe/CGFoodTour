import React from 'react'
import { Trophy } from 'lucide-react'
import CS2StoreCardCTA from '@/components/common/CS2StoreCardCTA'

export default function WidgetsSection({
  handleRandomPick,
  rollingRandom,
  randomResult,
  setRandomResult,
  setActiveStore,
  loadLeaderboard,
  leaderboard,
  stores = [],
  categories = [],
  switchTab
}) {
  return (
    <div className="lg:col-span-4 space-y-8">
      {/* 🎮 CS2 Case Opener Featured Store Card */}
      <CS2StoreCardCTA switchTab={switchTab} viewMode="grid" />

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
