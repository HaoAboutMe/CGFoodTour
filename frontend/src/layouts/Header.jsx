import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Shield, LogOut, User, Store, ChevronDown, Bookmark, Compass, Dices, Info } from 'lucide-react'
import logo128 from '@/assets/logo-128.webp'
import { AVATAR_FALLBACK_IMAGE } from '@/utils/imageAssets'

export default function Header({
  switchTab,
  activeTab,
  currentUser,
  isAdmin,
  handleLogout,
  setShowAuthModal,
  setAuthMode
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)

  const handleNavClick = useCallback((tab) => {
    switchTab(tab)
    setUserDropdownOpen(false)
  }, [switchTab])

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && userDropdownOpen) {
        setUserDropdownOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userDropdownOpen])

  const fullName = currentUser
    ? [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.username
    : ''

  const isUserAdmin = typeof isAdmin === 'function' ? isAdmin() : !!isAdmin

  const navItems = [
    { id: 'explore', label: 'Khám Phá Ẩm Thực', icon: Compass },
    { id: 'cs2-spinner', label: 'Vòng Xoay Quán Ăn', icon: Dices },
    { id: 'saved', label: 'Quán Đã Lưu', icon: Bookmark },
    { id: 'about', label: 'Về Chúng Tôi', icon: Info }
  ]

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 lg:gap-4">
        {/* Brand Logo & Name (Left) */}
        <button
          type="button"
          onClick={() => handleNavClick('explore')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 text-left bg-transparent border-0 p-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Trang chủ Cần Giuộc Food Tour"
        >
          <img
            src={logo128}
            width="40"
            height="40"
            alt=""
            aria-hidden="true"
            className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover bg-white select-none shrink-0"
          />
          <span className="font-black text-black tracking-tight text-lg sm:text-xl flex items-center">
            CầnGiuộc
            <span className="text-[#c92a2a] font-black text-[10px] sm:text-xs ml-1.5 px-2 py-0.5 border-2 border-black rounded-full bg-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] tracking-wider uppercase">
              FoodTour
            </span>
          </span>
        </button>

        {/* Desktop Center Navigation Links */}
        <nav
          className="hidden md:flex items-center justify-center gap-2 lg:gap-3 shrink-0"
          aria-label="Điều hướng chính"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`cursor-pointer px-4 lg:px-5 py-2 text-xs font-black tracking-wide rounded-full border-2 border-black transition-all flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-[#c92a2a] text-white shadow-[2.5px_2.5px_0px_0px_#111111] -translate-x-[1px] -translate-y-[1px]'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px]'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-700'}`} />}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right Actions (User Avatar & Dropdown / Login Button) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Pill Button */}
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={userDropdownOpen}
                aria-label={`Menu tài khoản của ${fullName}`}
                className={`flex items-center gap-2 bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black px-2.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] rounded-full cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ${
                  activeTab === 'profile' || activeTab === 'my-stores'
                    ? 'ring-2 ring-black bg-neutral-100'
                    : ''
                }`}
              >
                <img
                  src={currentUser.avatarUrl || AVATAR_FALLBACK_IMAGE}
                  alt="avatar"
                  width="28"
                  height="28"
                  className="w-7 h-7 border-2 border-black object-cover rounded-full shrink-0"
                />
                <span className="hidden sm:inline font-black text-xs text-black max-w-[120px] lg:max-w-[140px] truncate">
                  {fullName}
                </span>
                {isUserAdmin && (
                  <span className="hidden lg:inline text-[9px] font-black uppercase px-1.5 py-0.2 bg-black text-white rounded">
                    Admin
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-black transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Neo-Brutalist Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Menu tài khoản"
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 z-50 animate-fade-in-up space-y-3"
                >
                  {/* User Profile Summary Card */}
                  <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_0px_#111] shrink-0 ${
                          isUserAdmin ? 'bg-black text-white' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isUserAdmin ? 'Quản Trị' : 'Thành Viên'}
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

                  <div className="h-0.5 bg-black" aria-hidden="true" />

                  {/* Navigation Links inside Dropdown */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleNavClick('saved')}
                      className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                        activeTab === 'saved'
                          ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 shrink-0" />
                      <span>Quán Ăn Đã Lưu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavClick('profile')}
                      className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                        activeTab === 'profile'
                          ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>Thông Tin Tài Khoản</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavClick('my-stores')}
                      className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                        activeTab === 'my-stores'
                          ? 'bg-[#c92a2a] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <Store className="w-4 h-4 shrink-0" />
                      <span>Quán Ăn Của Tôi</span>
                    </button>

                    {isUserAdmin && (
                      <button
                        type="button"
                        onClick={() => handleNavClick('admin')}
                        className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                          activeTab === 'admin'
                            ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-neutral-900 text-white hover:bg-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <Shield className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e] shrink-0" />
                        <span>Bảng Quản Trị Hệ Thống</span>
                      </button>
                    )}
                  </div>

                  <div className="h-0.5 bg-black" aria-hidden="true" />

                  {/* Logout Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 bg-white text-[#c92a2a] hover:bg-[#ffebeb] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng Xuất Tài Khoản</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(true)
                setAuthMode('login')
              }}
              className="brutalist-btn-red text-xs py-2 px-4 font-black flex items-center gap-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <span>Đăng Nhập</span>
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
