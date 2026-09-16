import React, { useState } from 'react'
import { Search, Check } from 'lucide-react'
import { AVAILABLE_CATEGORY_ICONS } from './CategoryIcon'

export default function CategoryIconPicker({ value, onChange, className = '' }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIcons = AVAILABLE_CATEGORY_ICONS.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.label.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.includes(q))
    )
  })

  return (
    <div className={`space-y-3 bg-[#f7f6f2] p-4 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b-2 border-neutral-200 pb-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <label className="text-[11px] uppercase font-black text-black whitespace-nowrap">
            Chọn Icon
          </label>
          <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-extrabold whitespace-nowrap">
            {AVAILABLE_CATEGORY_ICONS.length} Icons
          </span>
        </div>
        {value && (
          <div className="text-[11px] font-black text-[#ff3e3e] whitespace-nowrap truncate">
            Đã chọn: <span className="underline">{AVAILABLE_CATEGORY_ICONS.find(i => i.id === value)?.label || value}</span>
          </div>
        )}
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm icon (ví dụ: bún, phở, bánh mì, trà sữa, bia, lẩu...)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="brutalist-input pl-9 text-xs py-2 bg-white"
        />
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Visual Icons Grid (Icon Only) */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-52 overflow-y-auto p-1.5 border-2 border-black rounded-xl bg-white">
        {filteredIcons.length === 0 ? (
          <div className="col-span-full p-4 text-center text-xs font-bold text-neutral-500">
            Không tìm thấy icon phù hợp với "{searchQuery}"
          </div>
        ) : (
          filteredIcons.map((item) => {
            const isSelected = value === item.id
            const IconComponent = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`aspect-square p-2 rounded-xl border-2 border-black flex items-center justify-center transition-all cursor-pointer select-none group relative ${
                  isSelected
                    ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                    : 'bg-[#f7f6f2] text-black hover:bg-[#fff5f5] hover:border-[#ff3e3e] hover:-translate-y-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                }`}
                title={item.label}
              >
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#ff3e3e] rounded-full flex items-center justify-center border border-black shadow-xs z-10">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${isSelected ? 'text-white' : 'text-black'}`} />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
