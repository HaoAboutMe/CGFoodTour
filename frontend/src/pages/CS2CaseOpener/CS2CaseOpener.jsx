import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Globe,
  Target,
  Folder,
  Store,
  Dices,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  MapPin,
  Search,
  Check,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  Star,
  DollarSign,
  Clock,
  Trash2,
  X
} from 'lucide-react'
import CategoryIcon from '@/components/common/CategoryIcon'
import StoreCard from '@/components/common/StoreCard'
import { checkStoreOpenStatus } from '@/utils/timeUtils'

const getStoreImageUrl = (store) => {
  if (!store) return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80'
  return (
    store.bannerImageUrl ||
    store.imageUrl ||
    store.avatarUrl ||
    store.bannerUrl ||
    store.image ||
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80'
  )
}

export default function CS2CaseOpener({
  stores = [],
  categories = [],
  setActiveStore
}) {
  // Safe Array Defensive Guards
  const safeStores = useMemo(() => (Array.isArray(stores) ? stores.filter(Boolean) : []), [stores])
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories.filter(Boolean) : []), [categories])

  // Spin Modes: 'ALL', 'SINGLE_CAT', 'MULTI_CAT', 'CUSTOM_STORES'
  const [spinMode, setSpinMode] = useState('ALL')

  // Filters state per mode
  const [selectedSingleCategoryId, setSelectedSingleCategoryId] = useState('')
  const [selectedMultiCategoryIds, setSelectedMultiCategoryIds] = useState([])
  const [selectedStoreIds, setSelectedStoreIds] = useState([])
  const [onlyOpenStores, setOnlyOpenStores] = useState(false)

  // Mode 4 Filters: Search & Category Filter Modal
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [customCategoryFilter, setCustomCategoryFilter] = useState('ALL')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 3D Carousel Stage Engine States
  const [isSpinning, setIsSpinning] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [reelPool, setReelPool] = useState([])
  const [winnerStore, setWinnerStore] = useState(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Web Audio Context & Element references
  const audioCtxRef = useRef(null)
  const animationRef = useRef(null)
  const lastTickIndexRef = useRef(0)
  const wheelStageRef = useRef(null)

  // Initialize Web Audio API for ticking sound
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Play crisp tick sound during rotation
  const playTickSound = () => {
    if (!soundEnabled || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03)

      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.03)
    } catch (e) {
      // Audio fallback silent guard
    }
  }

  // Filter stores according to active spin mode criteria
  const eligibleStores = useMemo(() => {
    if (spinMode === 'CUSTOM_STORES') {
      if (selectedStoreIds.length === 0) return []
      return safeStores.filter((s) => s && selectedStoreIds.includes(s.id))
    }

    if (spinMode === 'SINGLE_CAT') {
      if (!selectedSingleCategoryId) return safeStores
      return safeStores.filter(
        (s) => s && (s.categoryId === selectedSingleCategoryId || s.categoryName === selectedSingleCategoryId)
      )
    }

    if (spinMode === 'MULTI_CAT') {
      if (selectedMultiCategoryIds.length === 0) return safeStores
      return safeStores.filter(
        (s) =>
          s &&
          ((s.categoryId && selectedMultiCategoryIds.includes(s.categoryId)) ||
            (s.categoryName && selectedMultiCategoryIds.includes(s.categoryName)))
      )
    }

    // Default Mode: 'ALL'
    return safeStores.filter((s) => {
      if (!s) return false
      if (onlyOpenStores && !checkStoreOpenStatus(s).isOpen) return false
      return true
    })
  }, [safeStores, spinMode, selectedSingleCategoryId, selectedMultiCategoryIds, selectedStoreIds, onlyOpenStores])

  // Mode 4 Custom Store Picker filtered list
  const searchableStores = useMemo(() => {
    let list = safeStores

    if (customCategoryFilter !== 'ALL') {
      list = list.filter(
        (s) => s && (s.categoryId === customCategoryFilter || s.categoryName === customCategoryFilter)
      )
    }

    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase()
      list = list.filter(
        (s) =>
          s &&
          ((s.name && s.name.toLowerCase().includes(q)) ||
            (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
            (s.address && s.address.toLowerCase().includes(q)) ||
            (s.addressLine && s.addressLine.toLowerCase().includes(q)))
      )
    }
    return list
  }, [safeStores, customCategoryFilter, storeSearchQuery])

  // Pre-fill initial 3D Carousel Reel when eligible stores or mode changes
  useEffect(() => {
    if (eligibleStores.length > 0) {
      const initialPool = []
      for (let i = 0; i < 30; i++) {
        initialPool.push(eligibleStores[i % eligibleStores.length])
      }
      setReelPool(initialPool)
      setCarouselIndex(0)
      setValidationError('')
    } else {
      setReelPool([])
    }
  }, [eligibleStores])

  // Multi-Category Selection Handlers (Mode 3)
  const toggleMultiCategory = (catId) => {
    if (!catId) return
    setSelectedMultiCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  // Custom Store Selection Handlers (Mode 4)
  const toggleCustomStoreSelection = (id) => {
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

  // Handle 3D Carousel Spin Execution
  const handleStartSpin = () => {
    if (isSpinning) return

    if (eligibleStores.length === 0) {
      if (spinMode === 'CUSTOM_STORES') {
        setValidationError('Vui lòng chọn ít nhất 1 quán ăn trong danh sách phía dưới để tiến hành quay!')
      } else if (spinMode === 'SINGLE_CAT') {
        setValidationError('Vui lòng chọn 1 danh mục có chứa quán ăn để quay!')
      } else if (spinMode === 'MULTI_CAT') {
        setValidationError('Vui lòng chọn ít nhất 1 danh mục chứa quán ăn để quay!')
      } else {
        setValidationError('Không có quán ăn nào khả dụng để quay!')
      }
      return
    }

    setValidationError('')
    setIsSpinning(true)
    setWinnerStore(null)
    setShowWinnerModal(false)

    // Auto-scroll smooth focus to center 3D wheel stage
    if (wheelStageRef.current) {
      wheelStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Build random 3D Reel with 50 items ending at winning store
    const pool = eligibleStores
    const targetWinner = pool[Math.floor(Math.random() * pool.length)]
    
    const newReel = []
    const totalSpinItems = 50
    for (let i = 0; i < totalSpinItems; i++) {
      if (i === totalSpinItems - 3) {
        newReel.push(targetWinner)
      } else {
        newReel.push(pool[Math.floor(Math.random() * pool.length)])
      }
    }
    setReelPool(newReel)

    // Physics Animation Easing (Cubic Deceleration)
    const targetIndex = totalSpinItems - 3
    const startTime = performance.now()
    const duration = 5000 // 5 seconds spin

    lastTickIndexRef.current = 0

    const animateSpin = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Quartic Ease-Out curve for dramatic slow-down
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const currentIndex = easeOut * targetIndex

      setCarouselIndex(currentIndex)

      // Play tick sound when passing discrete integer index threshold
      const flooredIndex = Math.floor(currentIndex)
      if (flooredIndex !== lastTickIndexRef.current) {
        lastTickIndexRef.current = flooredIndex
        playTickSound()
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateSpin)
      } else {
        // Spin finished
        setIsSpinning(false)
        setWinnerStore(targetWinner)
        setTimeout(() => {
          setShowWinnerModal(true)
        }, 400)
      }
    }

    animationRef.current = requestAnimationFrame(animateSpin)
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-black pb-24 space-y-6 pt-4 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Banner Header */}
        <section className="brutalist-card bg-white p-6 sm:p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-[#ff3e3e] text-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Dices className="w-6 h-6 animate-spin-slow" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                  Vòng Xoay Quán Ăn 3D
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 max-w-2xl">
                Không biết hôm nay ăn gì tại Cần Giuộc? Hãy để Vòng Xoay Thẻ 3D đưa ra quyết định ẩm thực hoàn hảo nhất cho bạn!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Sound Toggle Button */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2.5 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
                  soundEnabled ? 'bg-white text-black hover:bg-neutral-100' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ff3e3e]" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Âm Thanh: Bật' : 'Âm Thanh: Tắt'}</span>
              </button>

              {/* Total eligible stores counter badge */}
              <div className="px-4 py-2.5 bg-[#f7f6f2] text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Store className="w-4 h-4 text-[#ff3e3e]" />
                <span>Quán Sẵn Sàng: {eligibleStores.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3D CARD CAROUSEL STAGE DISPLAY */}
        {/* ========================================================================= */}
        <div ref={wheelStageRef} className="brutalist-card bg-white p-6 sm:p-10 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden rounded-3xl">
          {/* Top Spotlight Decorative Beam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 bg-gradient-to-b from-[#ff3e3e]/15 via-[#ff3e3e]/5 to-transparent blur-2xl pointer-events-none" />

          {/* Center Stage Pointer Pin Indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-8 h-8 bg-[#ff3e3e] text-white border-2 border-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,62,62,0.8)] animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#ff3e3e] to-transparent" />
          </div>

          {/* 3D Carousel Perspective Container */}
          <div className="relative h-64 sm:h-72 flex items-center justify-center perspective-[1200px] overflow-hidden my-4">
            {reelPool.length > 0 ? (
              reelPool.map((store, index) => {
                const offset = index - carouselIndex
                // Render only items visible within +/- 4 cards radius
                if (Math.abs(offset) > 4) return null

                const absOffset = Math.abs(offset)
                const translateX = offset * 150
                const translateZ = 120 - absOffset * 70
                const rotateY = offset * -18
                const scale = Math.max(0.7, 1.1 - absOffset * 0.12)
                const opacity = Math.max(0.25, 1 - absOffset * 0.22)
                const isCenter = absOffset < 0.5

                return (
                  <div
                    key={`${store.id}-${index}`}
                    className="absolute transition-transform duration-75 ease-out"
                    style={{
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity: opacity,
                      zIndex: Math.round(100 - absOffset * 10)
                    }}
                  >
                    <div
                      className={`w-48 sm:w-56 bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                        isCenter
                          ? 'border-[#ff3e3e] ring-4 ring-[#ff3e3e]/40 shadow-[0_0_30px_rgba(255,62,62,0.6)] bg-white'
                          : 'blur-[0.8px]'
                      }`}
                    >
                      {(() => {
                        const status = checkStoreOpenStatus(store)
                        return (
                          <div className="space-y-3 text-center">
                            <div className="relative h-24 sm:h-28 w-full border-2 border-black rounded-xl overflow-hidden bg-neutral-100">
                              <img
                                src={getStoreImageUrl(store)}
                                alt={store.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80'
                                }}
                                className="w-full h-full object-cover"
                              />
                              <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] font-black border border-black rounded-md flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                status.isOpen
                                  ? 'bg-emerald-400 text-black'
                                  : 'bg-red-400 text-white'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-black animate-pulse' : 'bg-white'}`} />
                                <span>{status.statusText}</span>
                              </div>
                            </div>

                            <div>
                              <p className="font-black text-xs uppercase text-neutral-500 truncate">
                                {store.categoryName || 'Ẩm Thực Cần Giuộc'}
                              </p>
                              <h3 className="font-black text-sm text-black truncate mt-0.5">
                                {store.name}
                              </h3>
                            </div>

                            <div className="flex items-center justify-center text-[11px] font-extrabold pt-2 border-t-2 border-neutral-100">
                              <span className="text-neutral-600 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-[#ff3e3e] shrink-0" />
                                <span className="truncate">{store.addressLine || store.address || store.fullAddress || 'Cần Giuộc, Long An'}</span>
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center p-8 bg-[#f7f6f2] border-3 border-black rounded-2xl text-black space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
                <Filter className="w-8 h-8 text-[#ff3e3e] mx-auto animate-bounce" />
                <p className="font-black text-sm uppercase">Chưa có quán ăn phù hợp với chế độ lọc này</p>
                <p className="text-xs font-bold text-neutral-600">Vui lòng thay đổi chế độ hoặc chọn lại danh mục / quán ăn phía dưới</p>
              </div>
            )}
          </div>

          {/* Validation Error Message Box */}
          {validationError && (
            <div className="mb-4 p-3 bg-[#fff5f5] border-2 border-[#ff3e3e] rounded-xl text-[#ff3e3e] text-xs font-black flex items-center justify-center gap-2 max-w-lg mx-auto text-center shadow-[2px_2px_0px_0px_rgba(255,62,62,1)]">
              <XCircle className="w-4 h-4 text-[#ff3e3e] shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Spin Button */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={handleStartSpin}
              disabled={isSpinning || eligibleStores.length === 0}
              className={`brutalist-btn-red text-sm sm:text-base py-3.5 px-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-all ${
                isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
            >
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'ĐANG QUAY 3D...' : 'QUAY NGAY BÂY GIỜ'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 DISTINCT SPIN FILTER MODES SELECTOR */}
        {/* ========================================================================= */}
        <div className="brutalist-card bg-white p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-4 border-black space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
            <div>
              <h2 className="text-lg font-black uppercase text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#ff3e3e]" /> Chọn Chế Độ Quay Món
              </h2>
              <p className="text-xs font-bold text-neutral-600 mt-0.5">
                Lựa chọn phương thức quay linh hoạt theo nhu cầu ẩm thực của bạn
              </p>
            </div>

            {/* Open store only filter toggle */}
            <label className="cursor-pointer px-3.5 py-1.5 bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black rounded-xl text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none shrink-0">
              <input
                type="checkbox"
                checked={onlyOpenStores}
                onChange={(e) => setOnlyOpenStores(e.target.checked)}
                className="w-4 h-4 accent-[#ff3e3e]"
              />
              <span>Chỉ quay quán đang mở cửa</span>
            </label>
          </div>

          {/* Mode Tabs Buttons Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Mode 1: ALL */}
            <button
              onClick={() => {
                setSpinMode('ALL')
                setValidationError('')
              }}
              className={`p-4 border-3 border-black rounded-xl font-black text-xs text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                spinMode === 'ALL'
                  ? 'bg-[#ff3e3e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Globe className={`w-5 h-5 ${spinMode === 'ALL' ? 'text-white' : 'text-neutral-500'}`} />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-current rounded-md">
                  Chế độ 1
                </span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">Tất Cả Quán & Danh Mục</p>
                <p className={`text-[11px] font-bold mt-1 ${spinMode === 'ALL' ? 'text-white/90' : 'text-neutral-500'}`}>
                  Quay ngẫu nhiên trên toàn hệ thống Cần Giuộc
                </p>
              </div>
            </button>

            {/* Mode 2: SINGLE_CAT */}
            <button
              onClick={() => {
                setSpinMode('SINGLE_CAT')
                setValidationError('')
              }}
              className={`p-4 border-3 border-black rounded-xl font-black text-xs text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                spinMode === 'SINGLE_CAT'
                  ? 'bg-[#ff3e3e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Target className={`w-5 h-5 ${spinMode === 'SINGLE_CAT' ? 'text-white' : 'text-neutral-500'}`} />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-current rounded-md">
                  Chế độ 2
                </span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">1 Danh Mục Tự Chọn</p>
                <p className={`text-[11px] font-bold mt-1 ${spinMode === 'SINGLE_CAT' ? 'text-white/90' : 'text-neutral-500'}`}>
                  Chỉ quay trong đúng 1 danh mục bạn chọn
                </p>
              </div>
            </button>

            {/* Mode 3: MULTI_CAT */}
            <button
              onClick={() => {
                setSpinMode('MULTI_CAT')
                setValidationError('')
              }}
              className={`p-4 border-3 border-black rounded-xl font-black text-xs text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                spinMode === 'MULTI_CAT'
                  ? 'bg-[#ff3e3e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Folder className={`w-5 h-5 ${spinMode === 'MULTI_CAT' ? 'text-white' : 'text-neutral-500'}`} />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-current rounded-md">
                  Chế độ 3
                </span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">Nhiều Danh Mục Tự Chọn</p>
                <p className={`text-[11px] font-bold mt-1 ${spinMode === 'MULTI_CAT' ? 'text-white/90' : 'text-neutral-500'}`}>
                  Chọn kết hợp 2 hoặc nhiều danh mục quay
                </p>
              </div>
            </button>

            {/* Mode 4: CUSTOM_STORES */}
            <button
              onClick={() => {
                setSpinMode('CUSTOM_STORES')
                setValidationError('')
              }}
              className={`p-4 border-3 border-black rounded-xl font-black text-xs text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                spinMode === 'CUSTOM_STORES'
                  ? 'bg-[#ff3e3e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Store className={`w-5 h-5 ${spinMode === 'CUSTOM_STORES' ? 'text-white' : 'text-neutral-500'}`} />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-current rounded-md">
                  Chế độ 4
                </span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">Tùy Chọn Các Quán Cụ Thể</p>
                <p className={`text-[11px] font-bold mt-1 ${spinMode === 'CUSTOM_STORES' ? 'text-white/90' : 'text-neutral-500'}`}>
                  Tự chọn danh sách các quán A, B, C mong muốn
                </p>
              </div>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* DETAILED CONTROLS FOR EACH MODE */}
          {/* ========================================================================= */}

          {/* Mode 1: ALL */}
          {spinMode === 'ALL' && (
            <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#ff3e3e] shrink-0" />
                <span className="font-extrabold text-xs text-black">
                  Hệ thống sẽ lấy tất cả <span className="font-black text-[#ff3e3e]">{safeStores.length} quán ăn</span> tại Cần Giuộc vào danh sách quay ngẫu nhiên.
                </span>
              </div>
            </div>
          )}

          {/* Mode 2: SINGLE_CAT */}
          {spinMode === 'SINGLE_CAT' && (
            <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-black block text-black flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#ff3e3e]" /> Chọn 1 Danh Mục Để Quay:
                </label>
                {selectedSingleCategoryId && (
                  <button
                    onClick={() => setSelectedSingleCategoryId('')}
                    className="text-[11px] font-black text-[#ff3e3e] hover:underline cursor-pointer"
                  >
                    Xóa chọn danh mục
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {safeCategories.map((cat) => {
                  const catId = cat.id || cat.name
                  const isSelected = selectedSingleCategoryId === catId
                  return (
                    <button
                      key={catId}
                      onClick={() => setSelectedSingleCategoryId(catId)}
                      className={`px-3.5 py-2 border-2 border-black rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mode 3: MULTI_CAT */}
          {spinMode === 'MULTI_CAT' && (
            <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-neutral-200 pb-2">
                <label className="text-xs uppercase font-black block text-black flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#ff3e3e]" /> Chọn Nhiều Danh Mục Để Kết Hợp Quay:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMultiCategoryIds(safeCategories.map((c) => c.id || c.name))}
                    className="px-2.5 py-1 bg-white border border-black rounded-lg font-black text-[11px] uppercase hover:bg-neutral-100 cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={() => setSelectedMultiCategoryIds([])}
                    className="px-2.5 py-1 bg-white border border-black rounded-lg font-black text-[11px] text-[#ff3e3e] uppercase hover:bg-red-50 cursor-pointer"
                  >
                    Xóa chọn
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {safeCategories.map((cat) => {
                  const catId = cat.id || cat.name
                  const isSelected = selectedMultiCategoryIds.includes(catId)
                  return (
                    <button
                      key={catId}
                      onClick={() => toggleMultiCategory(catId)}
                      className={`px-3.5 py-2 border-2 border-black rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                      <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mode 4: CUSTOM_STORES */}
          {spinMode === 'CUSTOM_STORES' && (
            <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-4 sm:p-5 space-y-5">
              {/* TOP PINNED SECTION: Selected Stores Bar (Independent of search/category filter) */}
              {selectedStoreIds.length > 0 && (
                <div className="bg-amber-50/90 border-3 border-black rounded-2xl p-4 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-black/10 pb-2">
                    <h3 className="text-xs font-black uppercase text-black flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ff3e3e]" />
                      Các Quán Đã Được Chọn Để Đưa Vào Vòng Quay ({selectedStoreIds.length} quán)
                    </h3>
                    <button
                      onClick={handleClearStoreSelection}
                      className="text-[11px] font-black text-[#ff3e3e] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa tất cả</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1">
                    {selectedStoreIds.map((id) => {
                      const s = safeStores.find((item) => item.id === id)
                      if (!s) return null
                      return (
                        <div
                          key={s.id}
                          className="bg-[#ff3e3e] text-white border-2 border-black rounded-xl p-1.5 pr-2.5 flex items-center gap-2 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <img
                            src={getStoreImageUrl(s)}
                            alt={s.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=60'
                            }}
                            className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                          />
                          <span className="truncate max-w-[130px] sm:max-w-[180px]">{s.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCustomStoreSelection(s.id)
                            }}
                            className="p-0.5 hover:bg-white/20 text-neutral-300 hover:text-white rounded-md cursor-pointer shrink-0 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SEARCH BAR & CATEGORY MODAL SELECTOR BAR */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* Full-width Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên quán, địa chỉ, món ăn..."
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    className="brutalist-input brutalist-input-has-icon text-xs py-2.5 bg-white w-full"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Category Filter Modal Trigger Button */}
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2.5 bg-white border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#ff3e3e]" />
                    <span>
                      {customCategoryFilter === 'ALL'
                        ? 'Tất cả danh mục'
                        : safeCategories.find((c) => (c.id || c.name) === customCategoryFilter)?.name || 'Danh mục đã chọn'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90" />
                </button>

                {/* Select / Clear All Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSelectAllStores}
                    className="px-3 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Chọn tất cả ({searchableStores.length})
                  </button>
                </div>
              </div>

              {/* HORIZONTAL CARDS STORE GRID (Image Left, Info Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {searchableStores.length > 0 ? (
                  searchableStores.map((s) => {
                    const isSelected = selectedStoreIds.includes(s.id)
                    const openStatus = checkStoreOpenStatus(s)
                    return (
                      <div
                        key={s.id}
                        className={`p-3 border-3 border-black rounded-2xl transition-all flex items-start gap-3 relative select-none ${
                          isSelected
                            ? 'bg-red-50/80 border-[#ff3e3e] shadow-[4px_4px_0px_0px_rgba(255,62,62,1)]'
                            : 'bg-white hover:bg-neutral-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {/* Left Image (Clicking opens details drawer) */}
                        <div
                          onClick={() => setActiveStore && setActiveStore(s)}
                          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative rounded-xl border-2 border-black overflow-hidden bg-neutral-200 cursor-pointer group"
                        >
                          <img
                            src={getStoreImageUrl(s)}
                            alt={s.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=60'
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className={`absolute top-1 right-1 flex items-center gap-1 border border-black rounded-md px-1.5 py-0.5 text-[9px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            openStatus.isOpen ? 'bg-emerald-400 text-black' : 'bg-red-400 text-white'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-black animate-pulse' : 'bg-white'}`} />
                            <span>{openStatus.statusText}</span>
                          </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 gap-1">
                          {/* Row 1: Category Badge & Selection Checkbox */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="brutalist-badge bg-[#f7f6f2] text-black border border-black text-[9px] py-0.5 px-2 font-black uppercase truncate max-w-[120px]">
                              {s.categoryName || 'Ẩm thực'}
                            </span>

                            {/* Separate Checkbox Button for Toggling Selection ONLY */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCustomStoreSelection(s.id)
                              }}
                              className={`px-3 py-1 rounded-lg border-2 border-black font-black text-[11px] uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${
                                isSelected
                                  ? 'bg-[#ff3e3e] text-white border-black'
                                  : 'bg-white text-black hover:bg-neutral-100'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Đã Chọn</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span>Chọn Quay</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Row 2: Store Name */}
                          <h4
                            onClick={() => setActiveStore && setActiveStore(s)}
                            className="text-xs sm:text-sm font-black uppercase text-black hover:text-[#ff3e3e] cursor-pointer line-clamp-2 leading-snug break-words"
                          >
                            {s.name}
                          </h4>

                          {/* Row 3: Address & View Detail Action */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200 text-[10px]">
                            <div className="flex items-center gap-1 text-neutral-600 truncate min-w-0 font-semibold">
                              <MapPin className="w-3 h-3 text-[#ff3e3e] shrink-0" />
                              <span className="truncate">{s.addressLine || s.address || s.fullAddress || 'Cần Giuộc, Long An'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveStore && setActiveStore(s)}
                              className="text-[10px] font-black text-black hover:text-[#ff3e3e] flex items-center gap-0.5 hover:underline cursor-pointer shrink-0"
                            >
                              <span>Chi tiết</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full p-8 text-center text-xs font-bold text-neutral-500 bg-white border-2 border-black rounded-xl space-y-2">
                    <Search className="w-6 h-6 text-neutral-400 mx-auto" />
                    <p className="font-black text-sm text-black">Không tìm thấy quán ăn nào phù hợp</p>
                    <p className="text-neutral-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY FILTER MODAL FOR MODE 4 */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-lg brutalist-card bg-white p-6 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative space-y-4 rounded-2xl">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b-3 border-black pb-3">
              <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#ff3e3e]" /> Chọn Danh Mục Để Lọc Quán
              </h3>
              <p className="text-xs font-bold text-neutral-600 mt-0.5">
                Lọc danh sách các quán phía dưới theo thể loại món ăn
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1">
              <button
                onClick={() => {
                  setCustomCategoryFilter('ALL')
                  setIsCategoryModalOpen(false)
                }}
                className={`p-3 border-2 border-black rounded-xl font-black text-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  customCategoryFilter === 'ALL'
                    ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#f7f6f2] text-black hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Tất cả</span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border border-current shrink-0">
                  {safeStores.length}
                </span>
              </button>

              {safeCategories.map((cat) => {
                const catId = cat.id || cat.name
                const isSelected = customCategoryFilter === catId
                const count = safeStores.filter(
                  (s) => s && (s.categoryId === catId || s.categoryName === catId)
                ).length

                return (
                  <button
                    key={catId}
                    onClick={() => {
                      setCustomCategoryFilter(catId)
                      setIsCategoryModalOpen(false)
                    }}
                    className={`p-3 border-2 border-black rounded-xl font-black text-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-neutral-50 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} className="w-4 h-4 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border border-current shrink-0 ${
                      isSelected ? 'bg-white text-[#ff3e3e]' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* WINNER CELEBRATION MODAL */}
      {/* ========================================================================= */}
      {showWinnerModal && winnerStore && createPortal(
        (() => {
          const winnerStatus = checkStoreOpenStatus(winnerStore)
          return (
            <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 animate-fade-in-up">
              <div className="w-full max-w-md brutalist-card bg-white p-6 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative space-y-5 rounded-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Winner Header Badge */}
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ff3e3e] text-white border-2 border-black rounded-full text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy className="w-4 h-4 text-yellow-300" />
                    <span>KẾT QUẢ VÒNG XOAY 3D</span>
                  </div>
                  <h2 className="text-xl font-black uppercase text-black">
                    Món Ăn Dành Cho Bạn Hôm Nay!
                  </h2>
                </div>

                {/* Winner Store Card Details */}
                <div className="bg-[#f7f6f2] border-2 border-black rounded-2xl p-4 space-y-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="relative h-40 w-full border-2 border-black rounded-xl overflow-hidden bg-neutral-200">
                    <img
                      src={getStoreImageUrl(winnerStore)}
                      alt={winnerStore.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-black border-2 border-black rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      winnerStatus.isOpen
                        ? 'bg-emerald-400 text-black'
                        : 'bg-red-400 text-white'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${winnerStatus.isOpen ? 'bg-black animate-pulse' : 'bg-white'}`} />
                      <span>{winnerStatus.statusText}</span>
                    </div>
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 bg-white border border-black text-black font-black text-[10px] uppercase rounded-full">
                      {winnerStore.categoryName || 'Ẩm Thực Cần Giuộc'}
                    </span>
                    <h3 className="font-black text-lg text-black mt-1">
                      {winnerStore.name}
                    </h3>
                    <p className="text-xs font-extrabold text-neutral-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0" />
                      <span>{winnerStore.addressLine || winnerStore.address || winnerStore.fullAddress || 'Cần Giuộc, Long An'}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-black pt-3 border-t-2 border-neutral-200">
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#ff3e3e]" />
                      <span>Trạng thái hoạt động:</span>
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border-2 border-black font-black text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${
                      winnerStatus.isOpen
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                        : 'bg-red-100 text-red-800 border-red-600'
                    }`}>
                      {winnerStatus.statusText}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowWinnerModal(false)
                      if (setActiveStore) {
                        setActiveStore(winnerStore)
                      }
                    }}
                    className="flex-1 brutalist-btn-red text-xs py-3 font-black flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Xem Chi Tiết Quán ↗</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWinnerModal(false)
                      handleStartSpin()
                    }}
                    className="brutalist-btn-white text-xs py-3 px-4 font-black flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Quay Lại</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })(),
        document.body
      )}
    </div>
  )
}
