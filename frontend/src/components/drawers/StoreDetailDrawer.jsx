import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Trophy, MapPin, Phone, DollarSign, ThumbsUp, Meh, ThumbsDown, ZoomIn, Bookmark, Share2, Check } from 'lucide-react'
import { checkStoreOpenStatus } from '@/utils/timeUtils'
import ImageViewerModal from '@/components/modals/ImageViewerModal'
import { getSafeGoogleMapsUrl } from '@/utils/googleMapsUrl'
import { canShareStore, storePath } from '@/utils/storeUrl'
import { FOOD_FALLBACK_IMAGE, STORE_FALLBACK_IMAGE } from '@/utils/imageAssets'

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
  setActiveStore,
  onClose,
  handleSubmitRating,
  handleReportClosedToday,
  handleToggleSaveStore
}) {
  const [submittingClosedReport, setSubmittingClosedReport] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [shareFeedback, setShareFeedback] = useState('')

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
  }, [activeStore])

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
    if (!activeStore) return undefined

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
  }, [activeStore, previewImage, closeDrawer])

  // Share feedback clear timeout
  useEffect(() => {
    if (!shareFeedback) return undefined
    const timeoutId = window.setTimeout(() => setShareFeedback(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [shareFeedback])

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
        className="w-full sm:max-w-lg bg-white border-t-4 sm:border-t-0 sm:border-l-4 border-black h-[90vh] sm:h-full rounded-t-3xl sm:rounded-none overflow-y-auto no-scrollbar relative z-10 shadow-2xl animate-slide-in-right outline-none focus:outline-none"
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

        <div>
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
            className="h-56 w-full text-left relative bg-neutral-200 border-b-4 border-black shrink-0 group cursor-pointer block p-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
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

            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <span className="brutalist-badge bg-[#ff3e3e] text-white">
                  {activeStore.categoryName || 'Live Spot'}
                </span>
                <h2 id="store-detail-title" className="text-lg md:text-xl font-black text-black truncate">
                  <span className="sr-only">Chi tiết quán </span>
                  {activeStore.name}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div
                  className="flex items-center gap-1.5 bg-[#fff9db] text-black border-2 border-black rounded-full px-3 py-1 text-xs sm:text-sm font-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  title="Số lượng người dùng đã lưu quán này"
                  aria-label={`${activeStore.savedCount || 0} người đã lưu quán này`}
                >
                  <Bookmark className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e]" aria-hidden="true" />
                  <span>{activeStore.savedCount || 0} người đã lưu</span>
                </div>
                <div
                  className="flex items-center gap-1 bg-white border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  aria-label={`Tỷ lệ hài lòng ${activeStore.satisfactionRate}% trên tổng số ${activeStore.totalVotes} đánh giá`}
                >
                  <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                  <span>{activeStore.satisfactionRate}%</span>
                  <span className="text-[9px] text-neutral-500 font-semibold">({activeStore.totalVotes})</span>
                </div>
              </div>
            </div>
          </button>

          {/* Main Content Info */}
          <div className="p-6 space-y-6">
            {/* Status indicators */}
            <div className="flex items-center justify-between p-4 bg-[#f7f6f2] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 border-black ${
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
              <div className="flex items-start gap-3 text-xs text-black">
                <MapPin className="w-4 h-4 text-[#ff3e3e] shrink-0 mt-0.5" aria-hidden="true" />
                <div id="store-detail-address" className="space-y-1">
                  <p className="font-extrabold text-sm uppercase">Địa Chỉ Chi Tiết</p>
                  {safeMapUrl ? (
                    <a
                      href={safeMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-neutral-800 hover:text-[#ff3e3e] underline block transition-colors leading-snug focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      title="Bấm để mở địa chỉ chi tiết trên Google Maps (mở trong tab mới)"
                      aria-label={`Xem địa chỉ ${activeStore.addressLine || 'quán'} trên Google Maps (mở trong tab mới)`}
                    >
                      {activeStore.addressLine || 'Địa chỉ chưa cập nhật'} ↗
                    </a>
                  ) : (
                    <p className="font-bold text-neutral-600">{activeStore.addressLine || 'Địa chỉ chưa cập nhật'}</p>
                  )}
                  {activeStore.landmarkNote && (
                    <p className="text-[#ff3e3e] italic font-black">“ {activeStore.landmarkNote} ”</p>
                  )}
                  {safeMapUrl && (
                    <a
                      href={safeMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded mt-1 shadow-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      aria-label="Xem địa chỉ chi tiết trên Google Maps (mở trong tab mới)"
                    >
                      Xem địa chỉ chi tiết trên Google Maps
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                <Phone className="w-4 h-4 text-neutral-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-extrabold uppercase">Số Điện Thoại</p>
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

              <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                <DollarSign className="w-4 h-4 text-[#ff3e3e] shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-extrabold uppercase">Khoảng Giá</p>
                  <p className="font-black text-[#ff3e3e]">
                    {activeStore.priceMin?.toLocaleString()}đ - {activeStore.priceMax?.toLocaleString()}đ
                  </p>
                </div>
              </div>
            </div>

            {/* Food Items menu (Accessible buttons to open food image preview) */}
            <div className="space-y-4 pt-6 border-t-2 border-black">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                Thực Đơn Quán Ăn
              </h3>
              {!activeStore.foodItems || activeStore.foodItems.length === 0 ? (
                <p className="text-xs text-neutral-500 italic font-semibold">Chưa có món ăn nào được đăng.</p>
              ) : (
                <div className="space-y-4">
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
                      className="w-full text-left flex gap-4 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group/food focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      aria-label={`Xem ảnh phóng to món ${food.name}, giá ${food.price?.toLocaleString()}đ`}
                      title="Bấm để phóng to ảnh món ăn này"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={food.imageUrl || FOOD_FALLBACK_IMAGE}
                          alt={food.name}
                          loading="lazy"
                          className="w-16 h-16 border-2 border-black rounded-lg object-cover group-hover/food:brightness-90 transition-all"
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
                          <p className="text-xs font-black text-black group-hover/food:text-[#ff3e3e] transition-colors">
                            {food.name}
                          </p>
                          <p className="text-[10px] text-neutral-600 truncate mt-0.5">{food.description}</p>
                        </div>
                        <p className="text-xs font-black text-[#ff3e3e]">
                          {food.price?.toLocaleString()}đ
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Public interactions are available only for approved stores */}
            {isShareable && (
              <div className="space-y-4 pt-6 border-t-2 border-black">
                <h3 className="text-sm font-black uppercase tracking-wider text-black">Tương Tác & Đánh Giá</h3>

                {/* 1-Touch rating pills */}
                <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[11px] font-black text-black uppercase tracking-wider">
                    Đánh giá nhanh về quán ăn này?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitRating(activeStore.id, 'VERY_SATISFIED')}
                      className="flex-1 min-h-11 py-2 px-2 bg-white text-emerald-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      aria-label={`Đánh giá Ngon cho quán ${activeStore.name}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 fill-emerald-100" aria-hidden="true" /> Ngon
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitRating(activeStore.id, 'NORMAL')}
                      className="flex-1 min-h-11 py-2 px-2 bg-white text-neutral-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      aria-label={`Đánh giá Bình Thường cho quán ${activeStore.name}`}
                    >
                      <Meh className="w-3.5 h-3.5 fill-neutral-100" aria-hidden="true" /> Bình Thường
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitRating(activeStore.id, 'NOT_SATISFIED')}
                      className="flex-1 min-h-11 py-2 px-2 bg-white text-red-600 border-2 border-black rounded-full font-extrabold text-[10px] flex items-center justify-center gap-1.5 hover:bg-red-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2"
                      aria-label={`Đánh giá Không Ngon cho quán ${activeStore.name}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 fill-red-100" aria-hidden="true" /> Không Ngon
                    </button>
                  </div>
                </div>

                {/* Report Store Closed Section */}
                <div className="space-y-3 bg-[#fff5f5] p-4 border-2 border-red-500 rounded-xl shadow-[3px_3px_0px_0px_#111111]">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
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
              </div>
            )}
          </div>
        </div>

        {/* 📌 Floating Bookmark Action Button (Inside drawer container for full keyboard focus accessibility) */}
        {isShareable && handleToggleSaveStore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSaveStore(activeStore.id)
            }}
            className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 min-h-11 flex items-center gap-2 border-3 border-black rounded-full px-4 py-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all select-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
              activeStore.isSaved
                ? 'bg-[#ff3e3e] text-white'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
            title={activeStore.isSaved ? 'Bỏ lưu quán này' : 'Lưu quán này'}
            aria-label={activeStore.isSaved ? `Bỏ lưu quán ${activeStore.name}` : `Lưu quán ${activeStore.name}`}
          >
            <Bookmark className={`w-5 h-5 ${activeStore.isSaved ? 'fill-white text-white' : 'text-black'}`} />
            <span className="text-xs font-black uppercase tracking-wider">
              {activeStore.isSaved ? 'Đã Lưu' : 'Lưu Quán'}
            </span>
          </button>
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
