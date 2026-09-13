import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  className = '',
  buttonClassName = '',
  dropdownAlign = 'left', // 'left' | 'right'
  width = 'w-48 sm:w-52' // Fixed default width to prevent layout shifts
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative inline-block ${width} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white text-black border-2 border-black rounded-full px-4 py-2 text-xs font-black uppercase flex items-center justify-between gap-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
          isOpen ? 'bg-[#fff9f9] border-[#ff3e3e] shadow-[3px_3px_0px_0px_#ff3e3e]' : ''
        } ${buttonClassName}`}
      >
        <span className="truncate flex-1 text-left">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#ff3e3e]' : 'text-black'}`} />
      </button>

      {/* Floating Popup Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border-3 border-black rounded-2xl p-1.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full min-w-[200px] max-h-64 overflow-y-auto space-y-1 ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#ff3e3e] text-white font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black'
                    : 'text-black hover:bg-[#f7f6f2] hover:text-[#ff3e3e]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[3]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
