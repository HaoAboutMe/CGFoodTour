import React from 'react'
import { Shield, LogOut, Lock } from 'lucide-react'

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
  return (
    <header className="fixed top-0 inset-x-0 z-40 px-4 py-3 bg-white border-b-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => switchTab('explore')}>
          <div className="w-10 h-10 bg-[#ff3e3e] text-white border-2 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
            C
          </div>
          <span className="font-black text-black tracking-tight text-xl">
            CầnGiuộc<span className="text-[#ff3e3e] font-black text-sm ml-1 px-2 py-0.5 border-2 border-black bg-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] tracking-wider uppercase">FoodTour</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => switchTab('explore')}
            className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all ${
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
                className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all ${
                  activeTab === 'profile'
                    ? 'bg-[#ff3e3e] text-white border-[#ff3e3e] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                    : 'bg-white text-black border-black hover:bg-neutral-50 shadow-none'
                }`}
              >
                Tài Khoản
              </button>

              <button
                onClick={() => switchTab('my-stores')}
                className={`brutalist-badge cursor-pointer px-3.5 py-1 text-[11px] font-black transition-all ${
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
              className={`brutalist-badge cursor-pointer px-3 py-0.5 text-[11px] font-black flex items-center gap-1.5 transition-all ${
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

        {/* User Section / Action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-[#f7f6f2] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={currentUser.avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                alt="avatar"
                className="w-7 h-7 border-2 border-black object-cover"
              />
              <div className="text-left hidden sm:block min-w-0 max-w-[120px]">
                <p className="text-xs font-black text-black truncate leading-none">{currentUser.username}</p>
                <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-wide">
                  {getUserRoleString(currentUser)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 border-2 border-transparent hover:border-black hover:bg-white text-neutral-600 hover:text-[#ff3e3e] transition-all cursor-pointer"
                title="Đăng Xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowAuthModal(true)
                setAuthMode('login')
              }}
              className="brutalist-btn-red text-xs py-1.5 px-4 font-black flex items-center gap-1.5"
            >
              Đăng Nhập ↗
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
