import React from 'react'
import { Sparkles, Trophy, Shuffle, ArrowRight } from 'lucide-react'

export default function CS2StoreCardCTA({ switchTab, viewMode = 'grid' }) {
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => switchTab && switchTab('cs2-spinner')}
        className="brutalist-card bg-white text-black cursor-pointer p-3 relative flex items-center justify-between gap-3 w-full border-4 border-black shadow-[5px_5px_0px_0px_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all select-none group rounded-xl"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg bg-[#ff3e3e] text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shuffle className="w-7 h-7 animate-bounce" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="brutalist-badge bg-[#ff3e3e] text-white border border-black text-[9px] font-black uppercase">
                GOURMET SPINNER
              </span>
              <span className="text-[10px] font-bold text-neutral-600">Chọn Ngẫu Nhiên</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black uppercase text-black leading-snug group-hover:text-[#ff3e3e] truncate">
              🎲 Bạn không biết ăn món gì? Thử vận may!
            </h3>
            <p className="text-[11px] font-semibold text-neutral-600 line-clamp-1">
              Vòng xoay quán ăn ngẫu nhiên chốt kèo cực nhanh.
            </p>
          </div>
        </div>

        <button className="py-2 px-3 brutalist-btn-red text-xs uppercase shrink-0 flex items-center gap-1">
          Quay Ngay 🎲 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => switchTab && switchTab('cs2-spinner')}
      className="brutalist-card bg-white text-black cursor-pointer overflow-hidden flex flex-col justify-between group relative w-full h-full min-h-[340px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all rounded-2xl"
    >
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* Banner Graphic Header */}
        <div className="h-36 sm:h-40 w-full relative bg-[#f7f6f2] border-b-4 border-black shrink-0 overflow-hidden flex items-center justify-center">
          <div className="relative z-10 text-center space-y-1">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ff3e3e] text-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
              <Shuffle className="w-9 h-9 animate-spin-slow" />
            </div>
          </div>

          <div className="absolute top-2.5 left-2.5">
            <span className="brutalist-badge bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] py-0.5 px-2.5 text-[9px] font-black uppercase">
              GOURMET SPINNER
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white text-black border-2 border-black rounded-full px-2 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>Chốt Kèo Ngon</span>
          </div>
        </div>

        {/* Info Body */}
        <div className="p-4 space-y-2 relative flex-1 flex flex-col justify-between bg-white">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black uppercase text-black leading-snug group-hover:text-[#ff3e3e] transition-colors">
                🎲 Vòng Xoay Quán Ăn
              </h3>
              <span className="brutalist-badge bg-[#f7f6f2] text-black border border-black text-[9px] py-0.5 px-2 shrink-0 font-black">
                Pick Món Ngon
              </span>
            </div>

            <p className="text-xs font-bold text-neutral-600 leading-relaxed">
              Không biết hôm nay ăn gì? Bấm để quay ngẫu nhiên quán ngon phù hợp với khẩu vị và ngân sách của bạn!
            </p>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-black text-[#ff3e3e] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#ff3e3e]" /> Chọn nhiều danh mục & tích 2-3 quán phân vân
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="p-3 bg-[#f7f6f2] border-t-2 border-black shrink-0">
        <button className="w-full py-2.5 brutalist-btn-red text-xs uppercase flex items-center justify-center gap-2">
          <span>Thử Vận May Quán Ăn 🎲 ↗</span>
        </button>
      </div>
    </div>
  )
}
