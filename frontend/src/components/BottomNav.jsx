import React, { useState, useEffect } from 'react'
import { Compass, Dices, Store, Shield, Info, User, LogIn } from 'lucide-react'

export default function BottomNav({
  activeTab,
  switchTab,
  currentUser,
  isUserAdmin,
  setShowAuthModal,
  setAuthMode
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Auto hide/show BottomNav on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Always show at top of page
      if (currentScrollY <= 60) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // Scroll down -> hide
      if (currentScrollY > lastScrollY + 10) {
        setIsVisible(false)
      }
      // Scroll up -> show
      else if (currentScrollY < lastScrollY - 10) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Reset visibility when changing tabs
  useEffect(() => {
    setIsVisible(true)
  }, [activeTab])

  const handleTabClick = (tabKey, requiresAuth = false) => {
    if (requiresAuth && !currentUser) {
      setAuthMode('login')
      setShowAuthModal(true)
      return
    }
    switchTab(tabKey)
  }

  return (
    <nav className={`fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t-4 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] px-1 py-1.5 flex items-center justify-around select-none transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* 1. Explore Tab */}
      <button
        onClick={() => handleTabClick('explore')}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'explore'
            ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
            : 'text-neutral-700 hover:bg-neutral-100 font-bold'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">Khám Phá</span>
      </button>

      {/* 2. CS2 Spinner Tab */}
      <button
        onClick={() => handleTabClick('cs2-spinner')}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'cs2-spinner'
            ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
            : 'text-neutral-700 hover:bg-neutral-100 font-bold'
        }`}
      >
        <Dices className="w-5 h-5" />
        <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">Vòng Xoay</span>
      </button>

      {/* 3. My Stores Tab */}
      <button
        onClick={() => handleTabClick('my-stores', true)}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'my-stores'
            ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
            : 'text-neutral-700 hover:bg-neutral-100 font-bold'
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate max-w-[56px]">Quán Tôi</span>
      </button>

      {/* 4. About Tab */}
      <button
        onClick={() => handleTabClick('about')}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'about'
            ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
            : 'text-neutral-700 hover:bg-neutral-100 font-bold'
        }`}
      >
        <Info className="w-5 h-5" />
        <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate max-w-[56px]">Về Chúng Tôi</span>
      </button>

      {/* 5. Admin Dashboard Tab (Only displayed for Admin users) */}
      {isUserAdmin && (
        <button
          onClick={() => handleTabClick('admin', true)}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
              : 'text-indigo-950 bg-indigo-50 border border-indigo-300 font-extrabold'
          }`}
        >
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">Admin</span>
        </button>
      )}

      {/* 6. Profile / Auth Tab */}
      <button
        onClick={() => handleTabClick('profile', true)}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-[#ff3e3e] text-white border-2 border-black shadow-[2px_2px_0px_0px_#111111] -translate-y-0.5 font-black'
            : 'text-neutral-700 hover:bg-neutral-100 font-bold'
        }`}
      >
        {currentUser ? (
          <>
            <User className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate max-w-[54px]">Tài Khoản</span>
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5 text-[#ff3e3e]" />
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 font-black text-[#ff3e3e]">Đăng Nhập</span>
          </>
        )}
      </button>
    </nav>
  )
}
