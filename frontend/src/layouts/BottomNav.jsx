import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Compass, Dices, Bookmark, User, LogIn, LogOut, Store, Shield, Info, X } from 'lucide-react'
import { AVATAR_FALLBACK_IMAGE } from '@/utils/imageAssets'

export default function BottomNav({
  activeTab,
  switchTab,
  currentUser,
  isUserAdmin,
  handleLogout,
  setShowAuthModal,
  setAuthMode
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const accountTriggerRef = useRef(null)
  const sheetRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Auto hide/show BottomNav on scroll (disabled while account menu is open)
  useEffect(() => {
    if (isAccountMenuOpen) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Always show at top of page
      if (currentScrollY <= 60) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // Scroll down -> hide
      if (currentScrollY > lastScrollY + 12) {
        setIsVisible(false)
      }
      // Scroll up -> show
      else if (currentScrollY < lastScrollY - 12) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, isAccountMenuOpen])

  // Scroll lock and focus management when Account Menu opens
  useEffect(() => {
    if (isAccountMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      // Focus close button on open
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsAccountMenuOpen(false)
          accountTriggerRef.current?.focus()
        }

        // Focus trap
        if (e.key === 'Tab' && sheetRef.current) {
          const focusables = sheetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (!focusables.length) return
          const first = focusables[0]
          const last = focusables[focusables.length - 1]

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.body.style.overflow = originalOverflow
        document.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isAccountMenuOpen])

  const handleTabClick = (tabKey) => {
    setIsVisible(true)
    setIsAccountMenuOpen(false)
    switchTab(tabKey)
  }

  const handleAccountTabClick = () => {
    setIsVisible(true)
    if (!currentUser) {
      // Anonymous user: open authentication modal directly
      setAuthMode('login')
      setShowAuthModal(true)
      return
    }
    // Authenticated user: toggle Neo-Brutalist account sheet
    setIsAccountMenuOpen((prev) => !prev)
  }

  const handleMenuNavigate = useCallback((tabKey) => {
    setIsAccountMenuOpen(false)
    switchTab(tabKey)
    accountTriggerRef.current?.focus()
  }, [switchTab])

  const handleMenuLogout = useCallback(() => {
    setIsAccountMenuOpen(false)
    if (typeof handleLogout === 'function') {
      handleLogout()
    }
  }, [handleLogout])

  const fullName = currentUser
    ? [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.username
    : ''

  const isAccountActive =
    currentUser &&
    (activeTab === 'profile' ||
      activeTab === 'my-stores' ||
      activeTab === 'admin' ||
      activeTab === 'about' ||
      isAccountMenuOpen)

  const isStoreOwner =
    currentUser?.role === 'STORE_OWNER' ||
    (Array.isArray(currentUser?.roles) &&
      currentUser.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'STORE_OWNER'))

  const isBarVisible = isAccountMenuOpen || isVisible

  return (
    <>
      {/* 4-Tab Mobile Bottom Navigation Bar */}
      <nav
        role="navigation"
        aria-label="Thanh điều hướng dưới di động"
        className={`fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t-4 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none transition-transform duration-300 ease-in-out ${
          isBarVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 1. Explore Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('explore')}
          aria-current={activeTab === 'explore' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
              : 'text-neutral-700 hover:bg-neutral-100 font-bold border-2 border-transparent'
          }`}
        >
          <Compass className="w-5 h-5 shrink-0" />
          <span className="text-[10px] sm:text-xs tracking-tight mt-0.5">Khám Phá</span>
        </button>

        {/* 2. CS2 Spinner Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('cs2-spinner')}
          aria-current={activeTab === 'cs2-spinner' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'cs2-spinner'
              ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
              : 'text-neutral-700 hover:bg-neutral-100 font-bold border-2 border-transparent'
          }`}
        >
          <Dices className="w-5 h-5 shrink-0" />
          <span className="text-[10px] sm:text-xs tracking-tight mt-0.5">Vòng Xoay</span>
        </button>

        {/* 3. Saved Stores Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('saved')}
          aria-current={activeTab === 'saved' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
              : 'text-neutral-700 hover:bg-neutral-100 font-bold border-2 border-transparent'
          }`}
        >
          <Bookmark className="w-5 h-5 shrink-0" />
          <span className="text-[10px] sm:text-xs tracking-tight mt-0.5">Đã Lưu</span>
        </button>

        {/* 4. Account / Login Tab */}
        <button
          ref={accountTriggerRef}
          type="button"
          onClick={handleAccountTabClick}
          aria-haspopup={currentUser ? 'dialog' : undefined}
          aria-expanded={currentUser ? isAccountMenuOpen : undefined}
          aria-label={currentUser ? `Tài khoản ${fullName}` : 'Đăng nhập tài khoản'}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isAccountActive
              ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
              : 'text-neutral-700 hover:bg-neutral-100 font-bold border-2 border-transparent'
          }`}
        >
          {currentUser ? (
            <>
              <User className="w-5 h-5 shrink-0" />
              <span className="text-[10px] sm:text-xs tracking-tight mt-0.5 truncate max-w-[68px]">Tài Khoản</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 text-[#ff3e3e] shrink-0" />
              <span className="text-[10px] sm:text-xs tracking-tight mt-0.5 font-black text-[#ff3e3e]">Đăng Nhập</span>
            </>
          )}
        </button>
      </nav>

      {/* Authenticated Mobile Account Menu / Bottom Sheet */}
      {currentUser && isAccountMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-fade-in lg:hidden"
          onClick={() => setIsAccountMenuOpen(false)}
        >
          <div
            ref={sheetRef}
            id="mobile-account-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu tài khoản"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border-t-4 border-black rounded-t-3xl shadow-[0px_-6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 max-h-[85dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] space-y-3.5"
          >
            {/* Visual Sheet Pull Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 border border-neutral-400 rounded-full mx-auto" />

            {/* Sheet Title & Close Action */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5">
              <span className="font-black text-sm uppercase tracking-wider text-black">
                Menu Tài Khoản
              </span>
              <button
                ref={closeButtonRef}
                id="mobile-account-sheet-close-btn"
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false)
                  accountTriggerRef.current?.focus()
                }}
                aria-label="Đóng menu tài khoản"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* User Profile Summary Card */}
            <div className="bg-[#f7f6f2] border-2 border-black rounded-2xl p-3.5 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={currentUser.avatarUrl || AVATAR_FALLBACK_IMAGE}
                alt="avatar"
                width="48"
                height="48"
                className="w-12 h-12 border-2 border-black object-cover rounded-full shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-sm text-black truncate">{fullName}</p>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_0px_#111] shrink-0 ${
                      isUserAdmin
                        ? 'bg-black text-white'
                        : isStoreOwner
                        ? 'bg-amber-300 text-black'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {isUserAdmin ? 'Quản Trị' : isStoreOwner ? 'Chủ Quán' : 'Thành Viên'}
                  </span>
                </div>
                <p className="font-extrabold text-[11px] text-[#c92a2a] truncate mt-0.5">
                  @{currentUser.username || 'username'}
                </p>
                <p className="font-semibold text-[10px] text-neutral-600 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Navigation Routes */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleMenuNavigate('profile')}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 border-2 border-black rounded-xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Thông Tin Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuNavigate('my-stores')}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 border-2 border-black rounded-xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'my-stores'
                    ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>Quán Ăn Của Tôi</span>
              </button>

              {isUserAdmin && (
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('admin')}
                  className={`w-full min-h-[44px] text-left px-3.5 py-2.5 border-2 border-black rounded-xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-neutral-900 text-white hover:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <Shield className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e] shrink-0" />
                  <span>Bảng Quản Trị Hệ Thống</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleMenuNavigate('about')}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 border-2 border-black rounded-xl font-black text-xs flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>Về Chúng Tôi</span>
              </button>
            </div>

            <div className="h-0.5 bg-black" aria-hidden="true" />

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={handleMenuLogout}
              className="w-full min-h-[44px] text-left px-3.5 py-2.5 border-2 border-black rounded-xl font-black text-xs flex items-center gap-3 bg-white text-[#c92a2a] hover:bg-[#ffebeb] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Đăng Xuất Tài Khoản</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
