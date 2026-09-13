import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Shuffle,
  Volume2,
  VolumeX,
  Trophy,
  MapPin,
  Sparkles,
  Search,
  Check,
  Filter,
  Layers,
  Store,
  DollarSign,
  AlertCircle,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import CategoryIcon from './CategoryIcon'
import StoreCard from './StoreCard'

// Rarity level generator helper
const getStoreRarity = (store) => {
  if (!store) {
    return { name: 'Quốc Dân', color: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', tier: 'INDUSTRIAL' }
  }
  const price = store.avgPrice || store.priceMin || 35000
  const rating = store.satisfactionRate || 85
  if (rating >= 95 || price >= 120000) {
    return { name: 'Đặc Biệt', color: '#eab308', border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400', tier: 'CLASSIFIED' }
  }
  if (rating >= 88 || price >= 60000) {
    return { name: 'Ngon Lành', color: '#ec4899', border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400', tier: 'RESTRICTED' }
  }
  if (price >= 35000) {
    return { name: 'Bình Dân', color: '#a855f7', border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', tier: 'MIL-SPEC' }
  }
  return { name: 'Quốc Dân', color: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', tier: 'INDUSTRIAL' }
}

export default function CS2CaseOpener({
  stores = [],
  categories = [],
  setActiveStore
}) {
  // Safe Array Defensive Guards
  const safeStores = useMemo(() => (Array.isArray(stores) ? stores.filter(Boolean) : []), [stores])
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories.filter(Boolean) : []), [categories])

  // Spin Modes: 'filter' (Mode A: Filter Categories & Budget) or 'custom' (Mode B: Multi-Select Stores Grid)
  const [spinMode, setSpinMode] = useState('filter')

  // Mode A Filters: Multi-Category Selection (array of category IDs)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]) // Empty = ALL
  const [selectedBudget, setSelectedBudget] = useState('ALL')
  const [onlyOpenStores, setOnlyOpenStores] = useState(false)

  // Mode B Selected Stores & Mode B Category Filter
  const [selectedStoreIds, setSelectedStoreIds] = useState([])
  const [modeBCategoryFilter, setModeBCategoryFilter] = useState('ALL')
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(true) // Open by default for Mode B

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Reel & Animation States
  const [reelItems, setReelItems] = useState([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winnerStore, setWinnerStore] = useState(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [transformX, setTransformX] = useState(0)

  // Web Audio Context reference
  const audioCtxRef = useRef(null)
  const reelContainerRef = useRef(null)

  // Initialize Web Audio API
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e)
    }
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    }
  }, [])

  // Synthetic mechanical click sound tick
  const playTickSound = () => {
    if (!soundEnabled || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(650, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.035)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.035)
    } catch (e) {
      // Audio fallback
    }
  }

  // Multi-Category Selection Handlers for Mode A
  const toggleCategorySelection = (catId) => {
    if (!catId) return
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const handleSelectAllCategories = () => {
    setSelectedCategoryIds(safeCategories.map((c) => c.id || c.name).filter(Boolean))
  }

  const handleClearCategories = () => {
    setSelectedCategoryIds([])
  }

  // Filter stores according to active criteria
  const eligibleStores = useMemo(() => {
    if (spinMode === 'custom') {
      if (selectedStoreIds.length === 0) return []
      return safeStores.filter((s) => s && selectedStoreIds.includes(s.id))
    }

    // Mode A: Multi-Category & Budget filter
    return safeStores.filter((s) => {
      if (!s) return false

      // Multi-Category filter
      if (selectedCategoryIds.length > 0) {
        const matchesCat =
          (s.categoryId && selectedCategoryIds.includes(s.categoryId)) ||
          (s.categoryName && selectedCategoryIds.includes(s.categoryName))
        if (!matchesCat) return false
      }

      // Budget filter
      const price = s.avgPrice || s.priceMin || 35000
      if (selectedBudget === 'LOW' && price > 50000) return false
      if (selectedBudget === 'MID' && (price < 50000 || price > 100000)) return false
      if (selectedBudget === 'HIGH' && (price < 100000 || price > 150000)) return false
      if (selectedBudget === 'LUXURY' && price < 150000) return false

      // Open status filter
      if (onlyOpenStores && s.isOpen === false) return false

      return true
    })
  }, [safeStores, spinMode, selectedCategoryIds, selectedBudget, onlyOpenStores, selectedStoreIds])

  // Filtered store list for Mode B Explore-style Store Grid Picker (with Category & Search Filter)
  const searchableStores = useMemo(() => {
    let result = safeStores

    // Category filter in Mode B
    if (modeBCategoryFilter !== 'ALL') {
      result = result.filter(
        (s) => s && (s.categoryId === modeBCategoryFilter || s.categoryName === modeBCategoryFilter)
      )
    }

    // Search query filter in Mode B
    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s &&
          ((s.name && s.name.toLowerCase().includes(q)) ||
            (s.categoryName && s.categoryName.toLowerCase().includes(q)))
      )
    }
    return result
  }, [safeStores, modeBCategoryFilter, storeSearchQuery])

  // Multi-select store handlers for Mode B
  const toggleStoreSelection = (id) => {
    if (!id) return
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllStores = () => {
    setSelectedStoreIds(searchableStores.map((s) => s.id).filter(Boolean))
  }

  const handleClearStoreSelection = () => {
    setSelectedStoreIds([])
  }

  // Initial reel setup
  useEffect(() => {
    if (safeStores.length > 0) {
      const pool = safeStores
      const initialReel = []
      for (let i = 0; i < 40; i++) {
        const randomItem = pool[i % pool.length]
        if (randomItem) {
          initialReel.push({ ...randomItem, reelKey: `idle-${i}` })
        }
      }
      setReelItems(initialReel)
    }
  }, [safeStores])

  // START REEL SPIN
  const handleStartSpin = () => {
    if (isSpinning) return

    // Validation checks
    if (spinMode === 'custom' && selectedStoreIds.length < 2) {
      alert('⚠️ Vui lòng tích chọn từ 2 quán trở lên để bắt đầu quay!')
      return
    }

    if (eligibleStores.length === 0) {
      alert('⚠️ Không tìm thấy quán ăn phù hợp với bộ lọc hiện tại! Vui lòng chọn lại danh mục hoặc mở rộng bộ lọc.')
      return
    }

    // 1. Pick SINGLE winner store randomly from eligible pool
    const winner = eligibleStores[Math.floor(Math.random() * eligibleStores.length)]
    if (!winner) return
    setWinnerStore(winner)

    // 2. Construct 65-card reel sequence
    const winningIndex = 50 // Winner card position in sequence
    const newReel = []

    for (let i = 0; i < 65; i++) {
      if (i === winningIndex) {
        newReel.push({ ...winner, reelKey: `win-${i}` })
      } else {
        // Random chance (4%) to inject Mystery Card
        const isMystery = Math.random() < 0.04
        if (isMystery) {
          newReel.push({
            id: `mystery-${i}`,
            name: '★ MÓN BÍ ẨN ★',
            categoryName: 'Đặc Biệt',
            isMystery: true,
            reelKey: `mystery-${i}`
          })
        } else {
          const randStore = eligibleStores[Math.floor(Math.random() * eligibleStores.length)]
          if (randStore) {
            newReel.push({ ...randStore, reelKey: `reel-${i}-${Math.random()}` })
          }
        }
      }
    }

    setReelItems(newReel)
    setIsSpinning(true)
    setShowWinnerModal(false)

    // 3. Calculate target transform offset
    // Card width = 280px, gap = 16px -> total step = 296px
    const cardStep = 296
    const containerWidth = reelContainerRef.current ? reelContainerRef.current.offsetWidth : 800
    // Center needle position alignment
    const centerOffset = containerWidth / 2 - 280 / 2
    // Slight random offset inside winner card for organic feel (-60px to +60px)
    const randomOffsetInsideCard = (Math.random() - 0.5) * 120
    const targetOffset = winningIndex * cardStep - centerOffset + randomOffsetInsideCard

    // Reset to start position first
    setTransformX(0)

    // Trigger transform animation on next frame
    requestAnimationFrame(() => {
      setTimeout(() => {
        setTransformX(targetOffset)
      }, 50)
    })

    // 4. Audio Ticks interval simulation
    let elapsed = 0
    const totalDuration = 4800 // 4.8 seconds spin duration
    let tickDelay = 50

    const scheduleNextTick = () => {
      if (elapsed >= totalDuration) return
      playTickSound()

      const progress = elapsed / totalDuration
      tickDelay = 40 + Math.pow(progress, 3) * 450
      elapsed += tickDelay

      setTimeout(scheduleNextTick, tickDelay)
    }

    scheduleNextTick()

    // 5. Spin Completion Handler
    setTimeout(() => {
      setIsSpinning(false)
      setShowWinnerModal(true)
      if (soundEnabled) {
        playTickSound()
      }
    }, totalDuration + 200)
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full max-w-5xl mx-auto bg-[#f7f6f2] text-black brutalist-card border-4 border-black p-4 sm:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden rounded-2xl">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#ff3e3e]"></div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#ff3e3e] text-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Shuffle className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="brutalist-badge bg-[#ff3e3e] text-white border-black text-[10px] font-black uppercase tracking-wider">
                  GOURMET SPINNER
                </span>
                <span className="text-xs font-bold text-neutral-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Chọn Ngẫu Nhiên Quán Ngon
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2 mt-0.5">
                🎲 Vòng Xoay Quán Ăn
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mute/Unmute Audio Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh quay' : 'Bật âm thanh quay'}
              className="p-2.5 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-600" />
                  <span>Âm Thanh ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                  <span>Âm Thanh OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 🎯 MAIN REEL DISPLAY CONTAINER (StoreCard Size) */}
        <div className="relative w-full bg-white border-4 border-black rounded-2xl p-4 overflow-hidden shadow-[inner_0_0_15px_rgba(0,0,0,0.1)]">
          {/* Top Target Needle Indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[18px] border-t-[#ff3e3e] drop-shadow-[0_2px_6px_rgba(255,62,62,0.8)]"></div>
            <div className="w-1.5 h-[370px] bg-gradient-to-b from-[#ff3e3e] via-yellow-400 to-[#ff3e3e] shadow-[0_0_10px_#ff3e3e]"></div>
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[18px] border-b-[#ff3e3e] drop-shadow-[0_-2px_6px_rgba(255,62,62,0.8)]"></div>
          </div>

          {/* Reel Track Wrapper */}
          <div ref={reelContainerRef} className="w-full overflow-hidden py-4">
            <div
              className="flex gap-4 items-center"
              style={{
                transform: `translateX(-${transformX}px)`,
                transition: isSpinning ? 'transform 4.8s cubic-bezier(0.12, 0.8, 0.25, 1)' : 'none'
              }}
            >
              {reelItems.map((item, index) => {
                if (!item) return null
                if (item.isMystery) {
                  return (
                    <div
                      key={item.reelKey || index}
                      className="w-[280px] h-[340px] shrink-0 bg-gradient-to-b from-yellow-400 via-amber-300 to-yellow-500 border-4 border-black rounded-xl p-6 flex flex-col justify-between items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden pointer-events-none select-none"
                    >
                      <span className="brutalist-badge bg-black text-yellow-400 border border-black text-xs font-black uppercase tracking-wider">
                        ★ BÍ ẨN ★
                      </span>
                      <div className="w-24 h-24 rounded-full bg-black/20 border-4 border-black flex items-center justify-center animate-bounce my-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-4xl font-black text-black">?</span>
                      </div>
                      <div className="w-full border-t-2 border-black pt-2 bg-black/10 rounded-lg p-2">
                        <p className="text-sm font-black text-black truncate uppercase">MÓN BÍ ẨN BẤT NGỜ</p>
                        <p className="text-xs font-bold text-neutral-800 uppercase">Jackpot Pick</p>
                      </div>
                    </div>
                  )
                }

                const rarity = getStoreRarity(item)
                return (
                  <div
                    key={item.reelKey || index}
                    className="w-[280px] shrink-0 border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white relative group flex flex-col justify-between pointer-events-none select-none"
                    style={{ height: '340px' }}
                  >
                    {/* Render 100% identical StoreCard from Explore */}
                    <div className="flex-1 overflow-hidden pointer-events-none">
                      <StoreCard store={item} setActiveStore={setActiveStore} viewMode="grid" />
                    </div>

                    {/* Rarity Bottom Accent Bar */}
                    <div
                      className="w-full py-1 px-3 flex items-center justify-between text-[10px] font-black text-white shrink-0 border-t-2 border-black"
                      style={{ backgroundColor: rarity.color }}
                    >
                      <span className="uppercase tracking-wider">{rarity.name}</span>
                      <span className="opacity-90 font-bold">{rarity.tier}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 🎛️ CONTROLS & MULTI-CATEGORY FILTER BAR SECTION */}
        <div className="space-y-5 bg-white p-4 sm:p-6 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Mode Switch Tabs */}
          <div className="flex border-3 border-black rounded-xl overflow-hidden bg-black p-1 gap-1">
            <button
              onClick={() => setSpinMode('filter')}
              disabled={isSpinning}
              className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                spinMode === 'filter'
                  ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" /> Mode A: Quay Theo Danh Mục & Ngân Sách
            </button>
            <button
              onClick={() => setSpinMode('custom')}
              disabled={isSpinning}
              className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                spinMode === 'custom'
                  ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" /> Mode B: Tự Chọn Quán Phân Vân ({selectedStoreIds.length})
            </button>
          </div>

          {/* MODE A: MULTI-CATEGORY CHIPS & BUDGET FILTERS */}
          {spinMode === 'filter' && (
            <div className="space-y-4">
              {/* Multi-Category Selection Chips Grid */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-neutral-200 pb-2">
                  <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#ff3e3e]" /> Chọn Danh Mục Món (Chọn được nhiều món cùng lúc)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllCategories}
                      disabled={isSpinning}
                      className="px-2.5 py-1 text-[11px] font-black bg-[#f7f6f2] hover:bg-neutral-200 text-black border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      Chọn Tất Cả
                    </button>
                    <button
                      onClick={handleClearCategories}
                      disabled={isSpinning}
                      className="px-2.5 py-1 text-[11px] font-black bg-[#f7f6f2] hover:bg-red-100 text-red-600 border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      Xóa Chọn
                    </button>
                  </div>
                </div>

                {/* Category Chips Container */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleClearCategories}
                    disabled={isSpinning}
                    className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedCategoryIds.length === 0
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    <span>🌐 Tất Cả Món</span>
                  </button>

                  {safeCategories.map((c) => {
                    if (!c) return null
                    const catId = c.id || c.name
                    const isSelected = selectedCategoryIds.includes(catId)
                    return (
                      <button
                        key={c.id || c.name}
                        onClick={() => toggleCategorySelection(catId)}
                        disabled={isSpinning}
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        <CategoryIcon iconName={c.icon || 'utensils'} className="w-3.5 h-3.5" />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget & Open Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t-2 border-neutral-200">
                {/* Budget Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-green-600" /> Tình Trạng Ví (Ngân Sách)
                  </label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    disabled={isSpinning}
                    className="w-full brutalist-select bg-[#f7f6f2] text-black text-xs font-extrabold p-2.5 border-2 border-black rounded-xl focus:ring-0 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <option value="ALL">💸 Mới Nhận Lương (Tất Cả Mức Giá)</option>
                    <option value="LOW">💔 Hết Tiền Rồi (&lt; 50.000đ)</option>
                    <option value="MID">🪙 Ví Vừa Vừa (50k - 100k)</option>
                    <option value="HIGH">🥩 Rủ Bạn Sang (100k - 150k)</option>
                    <option value="LUXURY">👑 Đại Gia (&gt; 150.000đ)</option>
                  </select>
                </div>

                {/* Status Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                    🟢 Trạng Thái Hoạt Động
                  </label>
                  <button
                    onClick={() => setOnlyOpenStores(!onlyOpenStores)}
                    disabled={isSpinning}
                    className={`w-full p-2.5 border-2 border-black rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      onlyOpenStores ? 'bg-green-600 text-white' : 'bg-[#f7f6f2] text-neutral-700'
                    }`}
                  >
                    <span>Chỉ quay quán đang mở cửa</span>
                    {onlyOpenStores ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: MULTI-SELECT SPECIFIC STORES (EXPLORE-STYLE STORE CARD GRID & CATEGORY FILTER) */}
          {spinMode === 'custom' && (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f7f6f2] p-3.5 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2">
                  <span className="brutalist-badge bg-[#ff3e3e] text-white text-xs font-black px-3 py-1 border-black">
                    ĐÃ CHỌN {selectedStoreIds.length} / {safeStores.length} QUÁN
                  </span>
                  {selectedStoreIds.length < 2 && (
                    <span className="text-xs font-black text-[#ff3e3e] flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Vui lòng tích chọn từ 2 quán trở lên!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllStores}
                    disabled={isSpinning}
                    className="px-3 py-1.5 text-xs font-black bg-white hover:bg-neutral-100 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Chọn Tất Cả ({searchableStores.length})
                  </button>
                  <button
                    onClick={handleClearStoreSelection}
                    disabled={isSpinning}
                    className="px-3 py-1.5 text-xs font-black bg-white hover:bg-red-50 text-[#ff3e3e] rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Xóa Chọn
                  </button>
                  <button
                    onClick={() => setIsStorePickerOpen(!isStorePickerOpen)}
                    disabled={isSpinning}
                    className="px-3.5 py-1.5 text-xs font-black bg-[#ff3e3e] text-white rounded-lg border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {isStorePickerOpen ? 'Thu Gọn Danh Sách Lưới' : 'Mở Danh Sách Lưới Quán'} <ChevronDown className={`w-4 h-4 transition-transform ${isStorePickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* MODE B STORE PICKER GRID CONTAINER */}
              {isStorePickerOpen && (
                <div className="space-y-4 bg-[#f7f6f2] p-4 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {/* Category Filter Chips Bar for Mode B */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-[#ff3e3e]" /> Lọc Quán Theo Danh Mục:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setModeBCategoryFilter('ALL')}
                        disabled={isSpinning}
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          modeBCategoryFilter === 'ALL'
                            ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        🌐 Tất Cả ({safeStores.length})
                      </button>

                      {safeCategories.map((c) => {
                        if (!c) return null
                        const catId = c.id || c.name
                        const isSelected = modeBCategoryFilter === catId
                        const catStoreCount = safeStores.filter(
                          (s) => s && (s.categoryId === catId || s.categoryName === catId)
                        ).length

                        return (
                          <button
                            key={c.id || c.name}
                            onClick={() => setModeBCategoryFilter(catId)}
                            disabled={isSpinning}
                            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                          >
                            <CategoryIcon iconName={c.icon || 'utensils'} className="w-3.5 h-3.5" />
                            <span>{c.name} ({catStoreCount})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Search Bar for Mode B */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên quán..."
                      value={storeSearchQuery}
                      onChange={(e) => setStoreSearchQuery(e.target.value)}
                      className="w-full bg-white text-black text-xs font-black pl-10 pr-4 py-2.5 border-2 border-black rounded-xl focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  {/* COMPACT STORE CARD SELECTION 2-COLUMN GRID (SCROLLABLE UNDER SEARCH BAR) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto p-2 border-2 border-black/10 rounded-xl bg-[#eae9e4]">
                    {searchableStores.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-neutral-500 font-bold border-2 border-dashed border-neutral-300 rounded-xl bg-white">
                        Không tìm thấy quán ăn nào khớp với từ khóa/danh mục đã lọc.
                      </div>
                    ) : (
                      searchableStores.map((s) => {
                        if (!s) return null
                        const isSelected = selectedStoreIds.includes(s.id)
                        return (
                          <div
                            key={s.id}
                            className={`relative rounded-xl transition-all ${
                              isSelected
                                ? 'border-3 border-[#ff3e3e] shadow-[4px_4px_0px_0px_#ff3e3e] bg-red-50/40 translate-x-[-1px] translate-y-[-1px]'
                                : 'hover:translate-x-[-1px] hover:translate-y-[-1px]'
                            }`}
                          >
                            {/* Selection Checkbox Pill Badge Button (Click ONLY toggles selection) */}
                            <div className="absolute top-2.5 right-18 sm:right-22 z-20">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleStoreSelection(s.id)
                                }}
                                title={isSelected ? 'Bỏ chọn quán này' : 'Chọn quán này vào vòng xoay'}
                                className={`px-2 py-0.5 border-2 border-black rounded-full font-black text-[9px] sm:text-[10px] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${
                                  isSelected
                                    ? 'bg-[#ff3e3e] text-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] animate-scale-up'
                                    : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" /> Đã Chọn
                                  </>
                                ) : (
                                  <>+ Tích Chọn</>
                                )}
                              </button>
                            </div>

                            {/* Render StoreCard Component (Click opens Store Details Drawer) */}
                            <div className="h-full">
                              <StoreCard store={s} setActiveStore={setActiveStore} viewMode="compact" />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN SPIN BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleStartSpin}
              disabled={isSpinning || (spinMode === 'custom' && selectedStoreIds.length < 2)}
              className="w-full py-4 brutalist-btn-red text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              {isSpinning ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang Quay Chọn Quán...</span>
                </>
              ) : (
                <>
                  <Shuffle className="w-6 h-6 animate-spin-slow" />
                  <span>🎲 QUAY CHỌN QUÁN NGAY ({eligibleStores.length} Quán)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🏆 SINGLE WINNER SHOWCASE MODAL POPUP */}
      {showWinnerModal && winnerStore && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#f7f6f2] border-4 border-black rounded-2xl p-6 text-center space-y-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-scale-up">
            {/* Top Header */}
            <div className="space-y-1 border-b-2 border-black pb-3">
              <span className="brutalist-badge bg-[#ff3e3e] text-white text-xs font-black uppercase rounded-full border border-black tracking-wider inline-block px-3 py-1">
                ★ CHÚC MỪNG BẠN ★
              </span>
              <h3 className="text-2xl font-black uppercase text-black tracking-tight mt-1">
                MÓN ĂN HÔM NAY CỦA BẠN!
              </h3>
            </div>

            {/* Winner Card Showcase (Direct StoreCard Component Render) */}
            <div className="w-full text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden border-2 border-black bg-white">
              <StoreCard store={winnerStore} setActiveStore={setActiveStore} viewMode="grid" />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowWinnerModal(false)
                  if (setActiveStore) setActiveStore(winnerStore)
                }}
                className="w-full py-3 brutalist-btn-red text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                Xem Chi Tiết Quán Này ↗
              </button>

              <button
                onClick={() => setShowWinnerModal(false)}
                className="w-full py-2.5 brutalist-btn-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Quay Lại Vòng Xoay 🎲
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
