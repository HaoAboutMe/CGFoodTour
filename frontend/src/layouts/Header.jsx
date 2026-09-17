import React, { useState, useRef, useEffect } from 'react'
import { Shield, LogOut, Menu, X, User, Store, ChevronDown, Info } from 'lucide-react'
import logo1024 from '@/assets/logo_1024.webp'

export default function Header({
  switchTab,
  activeTab,
  currentUser,
  isAdmin,
  getUserRoleString,
  handleLogout,
  setShowAuthModal,
  setAuthMode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleNavClick = (tab) => {
    switchTab(tab)
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fullName = currentUser
    ? [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.username
    : ''

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo (Left) */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={() => handleNavClick('explore')}
        >
          <img
            src={logo1024}
            alt="Cần Giuộc Food Tour"
            className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover bg-white select-none shrink-0"
          />
          <span className="font-black text-black tracking-tight text-lg sm:text-xl">
            CầnGiuộc
            <span className="text-[#ff3e3e] font-black text-[10px] sm:text-sm ml-1 px-1.5 sm:px-2 py-0.5 border-2 border-black rounded-full bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tracking-wider uppercase">
              FoodTour
            </span>
          </span>
        </div>

        {/* Desktop Center Nav */}
        <nav className="hidden md:flex items-center justify-center gap-3 shrink-0">
          <button
            onClick={() => switchTab('explore')}
            className={`brutalist-badge cursor-pointer px-5 py-1.5 text-xs font-black transition-all ${
              activeTab === 'explore'
                ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
            }`}
          >
            Khám Phá Ẩm Thực
          </button>
          <button
            onClick={() => switchTab('cs2-spinner')}
            className={`brutalist-badge cursor-pointer px-5 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'cs2-spinner'
                ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
            }`}
          >
            Vòng Xoay Quán Ăn
          </button>
          <button
            onClick={() => switchTab('about')}
            className={`brutalist-badge cursor-pointer px-5 py-1.5 text-xs font-black transition-all ${
              activeTab === 'about'
                ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
            }`}
          >
            Về Chúng Tôi
          </button>
        </nav>

        {/* Desktop & Mobile Right Actions (User Avatar & Dropdown / Auth Button) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Pill Button */}
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] rounded-full cursor-pointer transition-all"
              >
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'
                  }
                  alt="avatar"
                  className="w-7 h-7 border-2 border-black object-cover rounded-full"
                />
                <span className="hidden sm:inline font-black text-xs text-black max-w-[120px] truncate">
                  {fullName}
                </span>
                <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Neo-Brutalist Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 z-50 animate-fade-in-up space-y-3">
                  {/* User Profile Summary Card */}
                  <div className="bg-[#f7f6f2] border-2 border-black rounded-xl p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <img
                      src={
                        currentUser.avatarUrl ||
                        'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'
                      }
                      alt="avatar"
                      className="w-12 h-12 border-2 border-black object-cover rounded-full shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-black truncate">{fullName}</p>
                      <p className="font-extrabold text-[11px] text-[#ff3e3e] truncate">
                        @{currentUser.username || 'username'}
                      </p>
                      <p className="font-bold text-[10px] text-neutral-600 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="h-0.5 bg-black" />

                  {/* Navigation Links inside Dropdown */}
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleNavClick('profile')}
                      className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'profile'
                          ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>Thông Tin Tài Khoản</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('my-stores')}
                      className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'my-stores'
                          ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      <Store className="w-4 h-4 shrink-0" />
                      <span>Quán Ăn Của Tôi</span>
                    </button>

                    {isAdmin && isAdmin() && (
                      <button
                        onClick={() => handleNavClick('admin')}
                        className={`w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                          activeTab === 'admin'
                            ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-neutral-900 text-white hover:bg-black'
                        }`}
                      >
                        <Shield className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e] shrink-0" />
                        <span>Bảng Quản Trị Hệ Thống</span>
                      </button>
                    )}
                  </div>

                  <div className="h-0.5 bg-black" />

                  {/* Logout Action */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-3 py-2 border-2 border-black rounded-xl font-black text-xs flex items-center gap-2.5 bg-white text-[#ff3e3e] hover:bg-[#ffebeb] transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng Xuất Tài Khoản</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setShowAuthModal(true)
                setAuthMode('login')
              }}
              className="brutalist-btn-red text-[11px] py-1.5 px-3.5 font-black flex items-center gap-1"
            >
              Đăng Nhập ↗
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
