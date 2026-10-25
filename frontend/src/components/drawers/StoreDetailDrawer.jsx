import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Trophy, MapPin, Phone, DollarSign, ThumbsUp, Meh, ThumbsDown, ZoomIn, Bookmark, Share2, Check, Utensils, MessageSquare } from 'lucide-react'
import { checkStoreOpenStatus } from '@/utils/timeUtils'
import ImageViewerModal from '@/components/modals/ImageViewerModal'
import { getSafeGoogleMapsUrl } from '@/utils/googleMapsUrl'
import { canShareStore, storePath } from '@/utils/storeUrl'
import { FOOD_FALLBACK_IMAGE, STORE_FALLBACK_IMAGE } from '@/utils/imageAssets'
import { DetailDrawerSkeleton } from '@/components/ui'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export default function StoreDetailDrawer({
  activeStore,
  isLoadingStore = false,
  setActiveStore,
  onClose,
  handleSubmitRating,
  handleReportClosedToday,
  handleToggleSaveStore
}) {
  const [submittingClosedReport, setSubmittingClosedReport] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [submittingSave, setSubmittingSave] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [shareFeedback, setShareFeedback] = useState('')
  const [activeTab, setActiveTab] = useState('menu')
  const [prevStoreId, setPrevStoreId] = useState(activeStore?.id)
  const menuScrollRef = useRef(null)
  const savedMenuScrollTop = useRef(0)

  if (activeStore?.id !== prevStoreId) {
    setPrevStoreId(activeStore?.id)
    setActiveTab('menu')
  }

  useEffect(() => {
    savedMenuScrollTop.current = 0
  }, [activeStore?.id])

  const handleSwitchToReviews = useCallback(() => {
    if (menuScrollRef.current) {
      savedMenuScrollTop.current = menuScrollRef.current.scrollTop
    }
    setActiveTab('reviews')
  }, [])

  const handleSwitchToMenu = useCallback(() => {
    setActiveTab('menu')
    requestAnimationFrame(() => {
      if (menuScrollRef.current) {
        menuScrollRef.current.scrollTop = savedMenuScrollTop.current
      }
    })
  }, [])

  const hasRatingDistribution =
    typeof activeStore?.countVerySatisfied === 'number' &&
    typeof activeStore?.countNormal === 'number' &&
    typeof activeStore?.countNotSatisfied === 'number'

  const totalRatings = hasRatingDistribution
    ? (activeStore.totalVotes ?? (activeStore.countVerySatisfied + activeStore.countNormal + activeStore.countNotSatisfied))
    : 0

  const handleRatingClick = async (ratingLevel) => {
    if (submittingRating || !handleSubmitRating) return
    setSubmittingRating(true)
    try {
      await handleSubmitRating(activeStore.id, ratingLevel)
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleSaveClick = async (e) => {
    e.stopPropagation()
    if (submittingSave || !handleToggleSaveStore) return
    setSubmittingSave(true)
    try {
      await handleToggleSaveStore(activeStore.id)
    } finally {
      setSubmittingSave(false)
    }
  }

  const containerRef = useRef(null)
  const drawerRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previousActiveElementRef = useRef(null)

  const closeDrawer = useCallback(() => (onClose ? onClose() : setActiveStore(null)), [onClose, setActiveStore])

  // 1. Focus restoration & body scroll lock with background isolation
  useEffect(() => {
    if (!activeStore) return undefined

    // Capture currently focused element before drawer opens for restoration upon close
    if (typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement
    }

    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Mark background siblings as inert and aria-hidden
    const affectedElements = []
    if (typeof document !== 'undefined') {
      const siblings = Array.from(document.body.children)
      for (const el of siblings) {
        if (containerRef.current && (el === containerRef.current || el.contains(containerRef.current))) continue
        if (
          el.tagName === 'SCRIPT' ||
          el.tagName === 'STYLE' ||
          el.id === 'credential_picker_container' ||
          el.id?.startsWith('credential_picker') ||
          el.id === 'fb-root' ||
          el.querySelector?.('#credential_picker_container, [src*="accounts.google.com"], [src*="facebook.com"]')
        ) continue

        const prevAriaHidden = el.getAttribute('aria-hidden')
        const prevInert = el.hasAttribute('inert')

        el.setAttribute('aria-hidden', 'true')
        el.setAttribute('inert', '')

        affectedElements.push({ el, prevAriaHidden, prevInert })
      }
    }

    // Set initial focus to close button immediately, with short fallback check
    if (closeButtonRef.current) {
      closeButtonRef.current.focus()
    } else if (drawerRef.current) {
      drawerRef.current.focus()
    }
    const focusTimer = setTimeout(() => {
      if (!drawerRef.current?.contains(document.activeElement)) {
        if (closeButtonRef.current) closeButtonRef.current.focus()
        else drawerRef.current?.focus()
      }
    }, 20)

    // Cleanup when closing / unmounting
    return () => {
      clearTimeout(focusTimer)
      if (typeof document !== 'undefined') {
        // Restore background elements
        for (const { el, prevAriaHidden, prevInert } of affectedElements) {
          if (prevAriaHidden === null) {
            el.removeAttribute('aria-hidden')
          } else {
            el.setAttribute('aria-hidden', prevAriaHidden)
          }
          if (!prevInert) {
            el.removeAttribute('inert')
          }
        }

        // Restore body scroll
        document.body.style.overflow = originalOverflow

        // Restore focus to opener button
        const prev = previousActiveElementRef.current
        if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
          prev.focus()
        } else {
          const fallback = document.querySelector('main, [role="main"], #root')
          if (fallback && typeof fallback.focus === 'function') {
            if (!fallback.hasAttribute('tabindex')) {
              fallback.setAttribute('tabindex', '-1')
            }
            fallback.focus({ preventScroll: true })
          }
        }
      }
    }
  }, [activeStore, isLoadingStore])

  // 2. Nested overlay management (when ImageViewerModal is open)
  useEffect(() => {
    if (!drawerRef.current) return
    if (previewImage) {
      drawerRef.current.setAttribute('aria-hidden', 'true')
      drawerRef.current.setAttribute('inert', '')
    } else {
      drawerRef.current.removeAttribute('aria-hidden')
      drawerRef.current.removeAttribute('inert')
    }
  }, [previewImage])

  // 3. Keyboard focus trap & Escape handling
  useEffect(() => {
    if (!activeStore && !isLoadingStore) return undefined

    const handleKeyDown = (event) => {
      // If image lightbox is open, let it handle Escape
      if (previewImage) return

      // If focus is inside a child dialog (like AuthModal or ConfirmActionModal), let that dialog handle Escape
      if (
        !drawerRef.current?.contains(document.activeElement) &&
        document.querySelector('[role="dialog"]:not([aria-labelledby="store-detail-title"])')
      ) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeDrawer()
        return
      }

      if (event.key === 'Tab') {
        if (!drawerRef.current) return
        const focusableItems = Array.from(drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
        if (focusableItems.length === 0) {
          event.preventDefault()
          drawerRef.current.focus()
          return
        }

        const firstElement = focusableItems[0]
        const lastElement = focusableItems[focusableItems.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [activeStore, isLoadingStore, previewImage, closeDrawer])

  // Share feedback clear timeout
  useEffect(() => {
    if (!shareFeedback) return undefined
    const timeoutId = window.setTimeout(() => setShareFeedback(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [shareFeedback])

  if (isLoadingStore && !activeStore) {
    return createPortal(
      <div
        ref={containerRef}
        onClick={(e) => {
          if (e.target === containerRef.current) closeDrawer()
        }}
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-label="Đang tải chi tiết quán ăn"
      >
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="relative w-full max-w-2xl bg-white border-l-4 border-black h-full flex flex-col shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] outline-none overflow-hidden"
        >
          {/* Header with Close Button */}
          <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#f7f6f2] shrink-0">
            <span className="font-black text-xs uppercase tracking-wider text-black">Đang tải thông tin quán...</span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDrawer}
              aria-label="Đóng chi tiết quán"
              className="p-2 border-2 border-black rounded-lg bg-white hover:bg-[#ff3e3e] hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DetailDrawerSkeleton />
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (!activeStore) return null

  const statusInfo = checkStoreOpenStatus(activeStore)
  const safeMapUrl = getSafeGoogleMapsUrl(activeStore.mapUrl, activeStore.latitude, activeStore.longitude)
  const isShareable = canShareStore(activeStore)

  const copyShareUrl = async (url) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return
    }

    const input = document.createElement('textarea')
    input.value = url
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) throw new Error('Copy command failed')
  }

  const handleShareStore = async (event) => {
    event.stopPropagation()
    if (!isShareable) return

    const url = new URL(storePath(activeStore), window.location.origin).toString()
    const shareData = {
      title: activeStore.name,
      text: `Khám phá ${activeStore.name} trên Cần Giuộc Food Tour`,
      url
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setShareFeedback('Đã chia sẻ')
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    try {
      await copyShareUrl(url)
      setShareFeedback('Đã sao chép liên kết')
    } catch {
      setShareFeedback('Không thể sao chép liên kết')
    }
  }

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-black/60 flex justify-end items-end sm:items-stretch"
    >
      {/* Close click backdrop */}
      <div
        className="fixed inset-0 bg-black/60 cursor-pointer"
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* Drawer content (Bottom-sheet on mobile, Right slide-in on desktop) */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết quán ${activeStore.name}`}
        aria-labelledby="store-detail-title"
        aria-describedby={activeStore.addressLine ? 'store-detail-address' : undefined}
        tabIndex={-1}
        className="w-full sm:max-w-lg lg:max-w-2xl xl:max-w-3xl bg-white border-t-4 sm:border-t-0 sm:border-l-4 border-black h-[90vh] sm:h-full rounded-t-3xl sm:rounded-none flex flex-col relative z-10 shadow-2xl animate-slide-in-right outline-none focus:outline-none overflow-hidden"
      >
        {/* Sticky Top Action Bar (Stays visible on top-right at all scroll positions) */}
        <div className="sticky top-3 right-3 z-50 flex h-0 items-start justify-end gap-2 px-4 pointer-events-none">
          {isShareable && (
            <div className="relative pointer-events-auto">
              <button
                type="button"
                onClick={handleShareStore}
                className="min-w-11 min-h-11 w-11 h-11 shrink-0 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-[#fff9db] text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                title="Chia sẻ quán ăn"
                aria-label={`Chia sẻ ${activeStore.name}`}
              >
                {shareFeedback.startsWith('Đã') ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
              {shareFeedback && (
                <span
                  role="status"
                  className="absolute top-12 right-0 whitespace-nowrap rounded-lg border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {shareFeedback}
                </span>
              )}
            </div>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              closeDrawer()
            }}
            className="min-w-11 min-h-11 w-11 h-11 shrink-0 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-neutral-100 text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] pointer-events-auto focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
            title="Đóng cửa sổ chi tiết (Phím Esc)"
            aria-label="Đóng cửa sổ chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Drag Handle Indicator */}
        <div
          className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-2 shrink-0 sm:hidden"
          aria-hidden="true"
        />

        {/* Scrollable Content Region (Scrolls independently above dedicated footer) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {/* Header Image banner (Accessible button to open store banner image preview) */}
          <button
            type="button"
            onClick={() =>
              setPreviewImage({
                src: activeStore.bannerImageUrl || STORE_FALLBACK_IMAGE,
                alt: activeStore.name,
                caption: `Ảnh Quán Ăn: ${activeStore.name}`
              })
            }
            className="h-56 sm:h-64 lg:h-72 w-full text-left relative bg-neutral-200 border-b-4 border-black shrink-0 group cursor-pointer block p-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
            aria-label={`Xem ảnh phóng to của quán ${activeStore.name}`}
            title="Bấm để xem phóng to ảnh quán ăn"
          >
            <img
              src={activeStore.bannerImageUrl || STORE_FALLBACK_IMAGE}
              alt={activeStore.name}
              className="w-full h-full object-cover group-hover:brightness-90 transition-all"
            />
            {/* Floating Zoom Badge */}
            <div className="absolute top-4 left-4 pointer-events-none" aria-hidden="true">
              <span className="brutalist-badge bg-black/70 text-white text-[10px] px-2.5 py-1 border border-white flex items-center gap-1 backdrop-blur-xs">
                <ZoomIn className="w-3.5 h-3.5" /> Bấm Để Phóng To Ảnh Banner
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-6 sm:right-6 flex items-end justify-between bg-white border-2 border-black rounded-xl p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <span className="brutalist-badge bg-[#ff3e3e] text-white">
                  {activeStore.categoryName || 'Live Spot'}
                </span>
                <h2 id="store-detail-title" className="text-base sm:text-lg lg:text-xl font-black text-black truncate">
                  <span className="sr-only">Chi tiết quán </span>
                  {activeStore.name}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div
                  className="flex items-center gap-1.5 bg-[#fff9db] text-black border-2 border-black rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  title="Số lượng người dùng đã lưu quán này"
                  aria-label={`${activeStore.savedCount || 0} người đã lưu quán này`}
                >
                  <Bookmark className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#ff3e3e] fill-[#ff3e3e]" aria-hidden="true" />
                  <span>{activeStore.savedCount || 0} người đã lưu</span>
                </div>
                <div
                  className="flex items-center gap-1 bg-white border-2 border-black rounded-full px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  aria-label={`Tỷ lệ hài lòng ${activeStore.satisfactionRate}% trên tổng số ${activeStore.totalVotes} đánh giá`}
                >
                  <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                  <span>{activeStore.satisfactionRate}%</span>
                  <span className="text-[9px] text-neutral-500 font-semibold">({activeStore.totalVotes})</span>
                </div>
              </div>
            </div>
          </button>

          {/* Main Content Info (Two-Column on Desktop lg+, Single Column on Mobile/Tablet) */}
          <div className="p-4 sm:p-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* Left Column (5 cols on lg+): Status, Details & Operational Actions */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                {/* Status indicators */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#f7f6f2] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 border-black shrink-0 ${
                        statusInfo.isOpen ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-black text-black">
                      {statusInfo.statusText} {statusInfo.isOpen ? '& Đang Phục Vụ' : ''}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-neutral-700">
                    {activeStore.openTime || 'N/A'} - {activeStore.closeTime || 'N/A'}
                  </span>
                </div>

                {/* Details layout list */}
                <div className="space-y-4 brutalist-card p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {/* Address Section */}
                  <div id="store-detail-address" className="space-y-3">
                    {/* Row 1: Address header & text with MapPin icon */}
                    <div className="flex items-start gap-3 text-black">
                      <div className="w-8 h-8 rounded-lg bg-[#fff0f0] border-2 border-black flex items-center justify-center shrink-0 mt-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                        <MapPin className="w-4 h-4 text-[#ff3e3e]" aria-hidden="true" />
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                            Địa Chỉ Chi Tiết
                          </span>
                          <p
                            id="store-detail-address-text"
                            className="text-xs sm:text-sm font-semibold text-neutral-900 leading-relaxed min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]"
                          >
                            {activeStore.addressLine || 'Địa chỉ chưa cập nhật'}
                          </p>
                        </div>

                        {safeMapUrl && (
                          <div className="pt-0.5">
                            <a
                              href={safeMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 bg-white hover:bg-[#fff9db] text-black border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                              title="Mở chỉ đường trên Google Maps trong tab mới"
                              aria-label={`Xem địa chỉ ${activeStore.name} trên Google Maps (mở trong tab mới)`}
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#ff3e3e]" aria-hidden="true" />
                              <span>Xem trên Google Maps</span>
                              <span className="text-neutral-500 font-bold ml-0.5">↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Landmark Note (Independent full-width row, left edge aligns with MapPin icon) */}
                    {activeStore.landmarkNote && (
                      <div
                        id="store-detail-landmark"
                        className="w-full bg-[#fff9db] border-2 border-black rounded-lg p-2.5 text-[11px] font-bold text-neutral-800 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]"
                      >
                        <span className="text-[#ff3e3e] font-black mr-1">📍 Chỉ dẫn:</span>
                        “ {activeStore.landmarkNote} ”
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                    <Phone className="w-4 h-4 text-neutral-500 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-extrabold uppercase text-neutral-700">Số Điện Thoại</p>
                      {activeStore.phoneNumber ? (
                        <a
                          href={`tel:${activeStore.phoneNumber.replace(/\s+/g, '')}`}
                          className="font-bold text-neutral-800 hover:text-[#ff3e3e] underline transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                          aria-label={`Gọi số ${activeStore.phoneNumber}`}
                        >
                          {activeStore.phoneNumber}
                        </a>
                      ) : (
                        <p className="font-bold text-neutral-600">Không có số liên hệ</p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                    <DollarSign className="w-4 h-4 text-[#ff3e3e] shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-extrabold uppercase text-neutral-700">Khoảng Giá</p>
                      <p className="font-black text-[#c92a2a] text-sm">
                        {activeStore.priceMin?.toLocaleString()}đ - {activeStore.priceMax?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Report Store Closed Section */}
                {isShareable && (
                  <div className="space-y-3 bg-[#fff5f5] p-4 border-2 border-red-500 rounded-xl shadow-[3px_3px_0px_0px_#111111]">
                    <div className="flex flex-col justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                          Báo Quán Nghỉ Hôm Nay
                        </p>
                        <p className="text-[10px] text-red-700 font-semibold leading-normal">
                          Yêu cầu bật GPS để xác thực khoảng cách dưới 100m.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (submittingClosedReport) return
                          setSubmittingClosedReport(true)
                          try {
                            await handleReportClosedToday(activeStore.id)
                          } finally {
                            setSubmittingClosedReport(false)
                          }
                        }}
                        disabled={submittingClosedReport}
                        className="brutalist-btn-red min-h-11 px-4 text-[10px] font-black uppercase shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                        aria-label={`Báo quán ${activeStore.name} nghỉ hôm nay (yêu cầu định vị GPS dưới 100m)`}
                      >
                        {submittingClosedReport ? 'Đang Kiểm Tra GPS...' : 'Báo Đóng Cửa'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Menu & Reviews (Tabs on Desktop lg+, Stacked on Mobile) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Desktop Tabs Header (hidden on mobile, visible on lg+) */}
                <div
                  role="tablist"
                  aria-label="Phân loại nội dung chi tiết quán"
                  className="hidden lg:grid grid-cols-2 gap-2 border-b-2 border-black pb-2 w-full lg:sticky lg:top-0 lg:z-10 bg-white pt-1"
                >
                  <button
                    type="button"
                    id="tab-menu"
                    role="tab"
                    aria-selected={activeTab === 'menu'}
                    aria-controls="tabpanel-menu"
                    tabIndex={activeTab === 'menu' ? 0 : -1}
                    onClick={handleSwitchToMenu}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault()
                        handleSwitchToReviews()
                        document.getElementById('tab-reviews')?.focus()
                      }
                    }}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border-2 border-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
                      activeTab === 'menu'
                        ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <Utensils className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Thực Đơn</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                        activeTab === 'menu' ? 'bg-black/20 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {activeStore.foodItems?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="tab-reviews"
                    role="tab"
                    aria-selected={activeTab === 'reviews'}
                    aria-controls="tabpanel-reviews"
                    tabIndex={activeTab === 'reviews' ? 0 : -1}
                    onClick={handleSwitchToReviews}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault()
                        handleSwitchToMenu()
                        document.getElementById('tab-menu')?.focus()
                      }
                    }}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border-2 border-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
                      activeTab === 'reviews'
                        ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Đánh Giá</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                        activeTab === 'reviews' ? 'bg-black/20 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {activeStore.satisfactionRate || 0}%
                    </span>
                  </button>
                </div>

                {/* Tab Panel 1: Thực Đơn Món Ăn */}
                {/* On mobile: always block; On desktop: block when menu tab active, hidden otherwise */}
                <div
                  role="tabpanel"
                  id="tabpanel-menu"
                  aria-labelledby="tab-menu"
                  tabIndex={0}
                  className={`space-y-3 focus:outline-none ${
                    activeTab === 'menu' ? 'block' : 'block lg:hidden'
                  }`}
                >
                  {/* Mobile Heading (hidden on desktop since tab header is visible) */}
                  <div className="flex items-center justify-between lg:hidden pt-2 border-t-2 border-black">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
                      Thực Đơn Quán Ăn
                    </h3>
                    {activeStore.foodItems?.length > 0 && (
                      <span className="text-[11px] font-black text-neutral-500 bg-neutral-100 border border-neutral-300 rounded-md px-2 py-0.5">
                        {activeStore.foodItems.length} món
                      </span>
                    )}
                  </div>

                  {/* Menu Items List */}
                  {!activeStore.foodItems || activeStore.foodItems.length === 0 ? (
                    <div className="p-6 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-neutral-600">Chưa có món ăn nào trong thực đơn.</p>
                      <p className="text-[11px] text-neutral-400">Các món ăn của quán sẽ được cập nhật sớm nhất.</p>
                    </div>
                  ) : (
                    <div
                      id="store-menu-scroll-container"
                      ref={menuScrollRef}
                      tabIndex={0}
                      aria-label="Danh sách món ăn của quán"
                      className="space-y-3 lg:max-h-[calc(100vh-25rem)] lg:min-h-[220px] lg:overflow-y-auto lg:pr-1.5 focus:outline-none [scrollbar-width:thin] [scrollbar-color:#000000_#f1f1f1]"
                    >
                      {activeStore.foodItems.map((food) => (
                        <button
                          type="button"
                          key={food.id}
                          onClick={() =>
                            setPreviewImage({
                              src: food.imageUrl || FOOD_FALLBACK_IMAGE,
                              alt: food.name,
                              caption: `Món: ${food.name} (${food.price?.toLocaleString()}đ)`
                            })
                          }
                          className="w-full text-left flex gap-3 sm:gap-4 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group/food focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                          aria-label={`Xem ảnh phóng to món ${food.name}, giá ${food.price?.toLocaleString()}đ`}
                          title="Bấm để phóng to ảnh món ăn này"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={food.imageUrl || FOOD_FALLBACK_IMAGE}
                              alt={food.name}
                              loading="lazy"
                              className="w-16 h-16 sm:w-18 sm:h-18 border-2 border-black rounded-lg object-cover group-hover/food:brightness-90 transition-all"
                            />
                            <div
                              className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover/food:opacity-100 transition-opacity pointer-events-none"
                              aria-hidden="true"
                            >
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-black text-black group-hover/food:text-[#ff3e3e] transition-colors line-clamp-1">
                                {food.name}
                              </p>
                              <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5 leading-snug">
                                {food.description}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm font-black text-[#c92a2a] mt-1">
                              {food.price?.toLocaleString()}đ
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tab Panel 2: Đánh Giá & Tương Tác Thực Khách */}
                {/* On mobile: stacked after menu; On desktop: block when reviews tab active, hidden otherwise */}
                {isShareable && (
                  <div
                    role="tabpanel"
                    id="tabpanel-reviews"
                    aria-labelledby="tab-reviews"
                    tabIndex={0}
                    className={`space-y-4 focus:outline-none ${
                      activeTab === 'reviews' ? 'block' : 'block lg:hidden'
                    }`}
                  >
                    {/* Mobile Heading */}
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black lg:hidden pt-3 border-t-2 border-black">
                      Tương Tác & Đánh Giá
                    </h3>

                    {/* Review stats overview card */}
                    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                        Tổng quan đánh giá cộng đồng
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#fff9db] border-2 border-black rounded-lg p-3 text-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center justify-center gap-1.5 text-yellow-600 mb-0.5">
                            <Trophy className="w-5 h-5 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                            <span className="text-xl font-black text-black">{activeStore.satisfactionRate}%</span>
                          </div>
                          <p className="text-[10px] font-extrabold uppercase text-neutral-700">Tỷ lệ hài lòng</p>
                          <p className="text-[9px] text-neutral-500 font-semibold mt-0.5">({activeStore.totalVotes} lượt đánh giá)</p>
                        </div>

                        <div className="bg-[#f0f9ff] border-2 border-black rounded-lg p-3 text-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center justify-center gap-1.5 text-sky-600 mb-0.5">
                            <Bookmark className="w-5 h-5 fill-[#ff3e3e] text-[#ff3e3e]" aria-hidden="true" />
                            <span className="text-xl font-black text-black">{activeStore.savedCount || 0}</span>
                          </div>
                          <p className="text-[10px] font-extrabold uppercase text-neutral-700">Người Đã Lưu</p>
                          <p className="text-[9px] text-neutral-500 font-semibold mt-0.5">Yêu thích quán này</p>
                        </div>
                      </div>

                      {/* 3-level rating distribution breakdown */}
                      {hasRatingDistribution ? (
                        <div className="pt-3 border-t-2 border-black/10 space-y-2.5" id="store-rating-distribution">
                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                            Chi tiết mức độ hài lòng ({totalRatings} đánh giá)
                          </p>
                          <div className="space-y-2">
                            {/* Rất hợp */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-emerald-700">
                                  <ThumbsUp className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" aria-hidden="true" />
                                  <span>Rất hợp</span>
                                </span>
                                <span className="text-neutral-700 font-black">
                                  {activeStore.countVerySatisfied} ({totalRatings > 0 ? Math.round((activeStore.countVerySatisfied / totalRatings) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${totalRatings > 0 ? (activeStore.countVerySatisfied / totalRatings) * 100 : 0}%` }}
                                  role="progressbar"
                                  aria-valuenow={activeStore.countVerySatisfied}
                                  aria-valuemin={0}
                                  aria-valuemax={totalRatings}
                                  aria-label={`Rất hợp: ${activeStore.countVerySatisfied} lượt`}
                                />
                              </div>
                            </div>

                            {/* Bình thường */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-amber-700">
                                  <Meh className="w-3.5 h-3.5 fill-amber-100 text-amber-600" aria-hidden="true" />
                                  <span>Bình thường</span>
                                </span>
                                <span className="text-neutral-700 font-black">
                                  {activeStore.countNormal} ({totalRatings > 0 ? Math.round((activeStore.countNormal / totalRatings) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${totalRatings > 0 ? (activeStore.countNormal / totalRatings) * 100 : 0}%` }}
                                  role="progressbar"
                                  aria-valuenow={activeStore.countNormal}
                                  aria-valuemin={0}
                                  aria-valuemax={totalRatings}
                                  aria-label={`Bình thường: ${activeStore.countNormal} lượt`}
                                />
                              </div>
                            </div>

                            {/* Chưa hợp */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-red-700">
                                  <ThumbsDown className="w-3.5 h-3.5 fill-red-100 text-red-600" aria-hidden="true" />
                                  <span>Chưa hợp</span>
                                </span>
                                <span className="text-neutral-700 font-black">
                                  {activeStore.countNotSatisfied} ({totalRatings > 0 ? Math.round((activeStore.countNotSatisfied / totalRatings) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${totalRatings > 0 ? (activeStore.countNotSatisfied / totalRatings) * 100 : 0}%` }}
                                  role="progressbar"
                                  aria-valuenow={activeStore.countNotSatisfied}
                                  aria-valuemin={0}
                                  aria-valuemax={totalRatings}
                                  aria-label={`Chưa hợp: ${activeStore.countNotSatisfied} lượt`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-dashed border-neutral-200 text-center">
                          <p className="text-[11px] text-neutral-400 italic font-medium">
                            DEFERRED — Rating distribution requires verified data contract
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Community review guidance note directing to unified action footer */}
                    <div className="p-3.5 bg-[#f7f6f2] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5">
                      <span className="text-base select-none" aria-hidden="true">💡</span>
                      <p className="text-xs text-neutral-700 font-semibold leading-relaxed">
                        Đánh giá nhanh trải nghiệm tại quán hoặc lưu vào danh sách yêu thích tại thanh tương tác cố định ở chân trang.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Drawer Action Footer (Stable, never obscures content, 4 peer interaction buttons) */}
        {(handleSubmitRating || handleToggleSaveStore) && (
          <footer
            id="store-detail-footer"
            className="shrink-0 bg-white border-t-2 border-black p-2.5 sm:p-3 lg:p-3.5 px-3 sm:px-4 lg:px-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-3">
              {/* Left Group: 3 Quick Rating Buttons */}
              {handleSubmitRating && (
                <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
                  <span className="text-[11px] font-black uppercase text-neutral-500 tracking-wider hidden xl:inline shrink-0 mr-1">
                    Đánh giá:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:w-[390px] shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRatingClick('VERY_SATISFIED')}
                      disabled={submittingRating}
                      className="w-full min-w-0 min-h-11 h-11 py-2 px-1.5 sm:px-2.5 bg-white text-emerald-600 border-2 border-black rounded-full font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-emerald-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 select-none"
                      title={`Đánh giá Rất Hợp cho quán ${activeStore.name}`}
                      aria-label={`Đánh giá Rất Hợp cho quán ${activeStore.name}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-emerald-100 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span className="truncate">Rất hợp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRatingClick('NORMAL')}
                      disabled={submittingRating}
                      className="w-full min-w-0 min-h-11 h-11 py-2 px-1.5 sm:px-2.5 bg-white text-neutral-700 border-2 border-black rounded-full font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-neutral-100 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 select-none"
                      title={`Đánh giá Bình Thường cho quán ${activeStore.name}`}
                      aria-label={`Đánh giá Bình Thường cho quán ${activeStore.name}`}
                    >
                      <Meh className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-neutral-100 text-neutral-700 shrink-0" aria-hidden="true" />
                      <span className="truncate">Bình thường</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRatingClick('NOT_SATISFIED')}
                      disabled={submittingRating}
                      className="w-full min-w-0 min-h-11 h-11 py-2 px-1.5 sm:px-2.5 bg-white text-red-600 border-2 border-black rounded-full font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 hover:bg-red-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 select-none"
                      title={`Đánh giá Chưa Hợp cho quán ${activeStore.name}`}
                      aria-label={`Đánh giá Chưa Hợp cho quán ${activeStore.name}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-red-100 text-red-600 shrink-0" aria-hidden="true" />
                      <span className="truncate">Chưa hợp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Right Group: Bookmark / Save Store Button */}
              {handleToggleSaveStore && (
                <div className="w-full lg:w-auto lg:shrink-0 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={submittingSave}
                    className={`w-full lg:w-auto min-h-11 h-11 px-4 sm:px-5 py-2.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
                      activeStore.isSaved
                        ? 'bg-[#ff3e3e] text-white hover:bg-[#e03131]'
                        : 'bg-white text-black hover:bg-[#fff9db]'
                    }`}
                    title={activeStore.isSaved ? 'Bỏ lưu quán này' : 'Lưu quán này'}
                    aria-label={activeStore.isSaved ? `Bỏ lưu quán ${activeStore.name}` : `Lưu quán ${activeStore.name}`}
                  >
                    <Bookmark className={`w-4 h-4 ${activeStore.isSaved ? 'fill-white text-white' : 'text-black'}`} aria-hidden="true" />
                    <span>{activeStore.isSaved ? 'Đã Lưu' : 'Lưu Quán'}</span>
                  </button>
                </div>
              )}
            </div>
          </footer>
        )}
      </div>

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <ImageViewerModal
          src={previewImage.src}
          alt={previewImage.alt}
          caption={previewImage.caption}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>,
    document.body
  )
}
