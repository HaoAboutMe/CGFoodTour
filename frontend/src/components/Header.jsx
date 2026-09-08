import React, { useState } from 'react'
import { Shield, LogOut, Menu, X } from 'lucide-react'

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

  const handleNavClick = (tab) => {
    switchTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Top bar on Mobile: Logo & Action Buttons */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => handleNavClick('explore')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#ff3e3e] text-white border-2 border-black rounded-lg flex items-center justify-center font-black text-lg sm:text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
              C
            </div>
            <span className="font-black text-black tracking-tight text-lg sm:text-xl">
              CầnGiuộc<span className="text-[#ff3e3e] font-black text-[10px] sm:text-sm ml-1 px-1.5 sm:px-2 py-0.5 border-2 border-black rounded-full bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tracking-wider uppercase">FoodTour</span>
            </span>
          </div>

          {/* User Section & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#f7f6f2] border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full">
                <img
                  src={currentUser.avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                  alt="avatar"
                  className="w-6 h-6 border-2 border-black object-cover rounded-full"
                />
                <button
                  onClick={handleLogout}
                  className="p-1 border border-transparent hover:border-black hover:bg-white text-neutral-600 hover:text-[#ff3e3e] transition-all cursor-pointer rounded-full"
                  title="Đăng Xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true)
                  setAuthMode('login')
                }}
                className="brutalist-btn-red text-[11px] py-1 px-3 font-black flex items-center gap-1"
              >
                Đăng Nhập ↗
              </button>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 bg-white border-2 border-black rounded-lg text-black hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#ff3e3e]" /> : <Menu className="w-5 h-5 text-black" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Items */}
        <nav className="hidden md:flex items-center justify-center gap-2 shrink-0">
          <button
            onClick={() => switchTab('explore')}
            className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all shrink-0 ${
              activeTab === 'explore'
                ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
            }`}
          >
            Khám Phá
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => switchTab('profile')}
                className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                    : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
                }`}
              >
                Tài Khoản
              </button>

              <button
                onClick={() => switchTab('my-stores')}
                className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all shrink-0 ${
                  activeTab === 'my-stores'
                    ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                    : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
                }`}
              >
                Quán Ăn Của Tôi
              </button>
            </>
          )}

          {isAdmin() && (
            <button
              onClick={() => switchTab('admin')}
              className={`brutalist-badge cursor-pointer px-3 py-1 text-[11px] font-black flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-black text-white border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#ff3e3e] fill-[#ff3e3e]" />
              Quản Trị
            </button>
          )}
        </nav>

        {/* Collapsible Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="w-full md:hidden pt-3 border-t-2 border-black mt-1 flex flex-col gap-2 animate-fade-in-up">
            <button
              onClick={() => handleNavClick('explore')}
              className={`w-full text-left brutalist-badge cursor-pointer px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'explore'
                  ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black border-black hover:bg-neutral-50'
              }`}
            >
              🔍 Khám Phá Ẩm Thực
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full text-left brutalist-badge cursor-pointer px-4 py-2 text-xs font-black transition-all ${
                    activeTab === 'profile'
                      ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black border-black hover:bg-neutral-50'
                  }`}
                >
                  👤 Thông Tin Tài Khoản
                </button>

                <button
                  onClick={() => handleNavClick('my-stores')}
                  className={`w-full text-left brutalist-badge cursor-pointer px-4 py-2 text-xs font-black transition-all ${
                    activeTab === 'my-stores'
                      ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black border-black hover:bg-neutral-50'
                  }`}
                >
                  🏪 Quán Ăn Của Tôi
                </button>
              </>
            )}

            {isAdmin() && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full text-left brutalist-badge cursor-pointer px-4 py-2 text-xs font-black flex items-center gap-2 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black border-black hover:bg-neutral-50'
                }`}
              >
                <Shield className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e]" />
                🛡️ Bảng Quản Trị Hệ Thống
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

