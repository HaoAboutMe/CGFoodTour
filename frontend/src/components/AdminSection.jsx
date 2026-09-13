import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  Folder,
  Shield,
  LogOut,
  Compass,
  PlusCircle,
  Edit2,
  Trash2,
  EyeOff,
  RotateCcw,
  X,
  Utensils,
  Coffee,
  IceCream,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import StoreActionModal from './StoreActionModal'

export default function AdminSection({
  isUserAdmin,
  switchTab,
  currentUser,
  handleLogout,
  catName,
  setCatName,
  catIcon,
  setCatIcon,
  handleCreateCategory,
  foodStoreId,
  setFoodStoreId,
  stores = [],
  foodName,
  setFoodName,
  foodPrice,
  setFoodPrice,
  foodImage,
  setFoodImage,
  foodDesc,
  setFoodDesc,
  handleCreateFoodItem,
  handleUploadImage,
  adminPendingStores = [],
  handleAdminApprove,
  handleAdminReject,
  handleHideStore,
  handleRecoverStore,
  handleRejectRecoveryRequest,
  handleHardDeleteStore,
  adminUsersList = [],
  handleOpenAdminEditUser,
  handleAdminDeleteUser,
  editingUser,
  setEditingUser,
  adminUserUsername,
  setAdminUserUsername,
  adminUserFirst,
  setAdminUserFirst,
  adminUserLast,
  setAdminUserLast,
  adminUserDob,
  setAdminUserDob,
  adminUserRoles,
  setAdminUserRoles,
  handleAdminUserEditSubmit,
  categories = [],
  handleUpdateCategory,
  handleDeleteCategory,
  loadAdminUsers,
  loadAdminPendingStores,
  loadGlobalData
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard') // dashboard, stores, users, categories
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [rejectingStore, setRejectingStore] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingStore, setViewingStore] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('fa-bread-slice')
  const [uploadingFood, setUploadingFood] = useState(false)
  const [storeStatusFilter, setStoreStatusFilter] = useState('ALL')
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')

  const [adminActionModalStore, setAdminActionModalStore] = useState(null)
  const [adminActionModalType, setAdminActionModalType] = useState(null)

  const handleAdminActionConfirm = async ({ reason }) => {
    if (!adminActionModalStore || !adminActionModalType) return
    const storeId = adminActionModalStore.id
    let resData = null
    if (adminActionModalType === 'HIDE') {
      if (handleHideStore) resData = await handleHideStore(storeId, reason)
    } else if (adminActionModalType === 'RECOVER') {
      if (handleRecoverStore) resData = await handleRecoverStore(storeId, reason)
    } else if (adminActionModalType === 'REJECT_RECOVERY_REQUEST') {
      if (handleRejectRecoveryRequest) resData = await handleRejectRecoveryRequest(storeId, reason)
    } else if (adminActionModalType === 'HARD_DELETE') {
      if (handleHardDeleteStore) resData = await handleHardDeleteStore(storeId, reason)
    }
    if (resData) {
      if (adminActionModalType === 'HARD_DELETE' && viewingStore?.id === storeId) {
        setViewingStore(null)
      } else if (viewingStore?.id === storeId && typeof resData === 'object') {
        setViewingStore(resData)
      }
      setAdminActionModalStore(null)
      setAdminActionModalType(null)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFood(true)
    const url = await handleUploadImage(file)
    setUploadingFood(false)
    if (url) {
      setFoodImage(url)
    }
  }

  function getCategoryIcon(iconName) {
    const name = iconName ? iconName.toLowerCase() : ''
    if (name.includes('utensils') || name.includes('bowl')) return <Utensils className="w-4 h-4" />
    if (name.includes('coffee') || name.includes('beer') || name.includes('glass')) return <Coffee className="w-4 h-4" />
    if (name.includes('ice-cream') || name.includes('cookie')) return <IceCream className="w-4 h-4" />
    return <Compass className="w-4 h-4" />
  }

  if (!isUserAdmin) {
    return (
      <div className="brutalist-card bg-white max-w-xl mx-auto my-12 p-8 text-center space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-fade-in-up">
        <Shield className="w-12 h-12 text-[#ff3e3e] mx-auto" />
        <h3 className="text-xl font-black uppercase">Từ Chối Truy Cập</h3>
        <p className="text-sm font-semibold text-neutral-600">
          Bạn không có quyền quản trị viên (ADMIN) để truy cập khu vực này.
        </p>
        <button
          onClick={() => switchTab('explore')}
          className="brutalist-btn-red text-xs"
        >
          Quay Lại Trang Chủ
        </button>
      </div>
    )
  }

  // Calculate Metrics
  const pendingCount = adminPendingStores.length
  const recoveryCount = stores.filter(s => s.recoveryRequested).length
  const totalNeedsAttention = pendingCount + recoveryCount
  const approvedStoresCount = stores.filter(s => s.status === 'APPROVED').length
  const totalUsersCount = adminUsersList.length
  const totalCategoriesCount = categories.length

  const adminFullName = currentUser
    ? [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || currentUser.username
    : 'Quản Trị Viên'

  return (
    <div className="fixed inset-0 z-40 bg-[#f7f6f2] text-black font-sans flex overflow-hidden">
      {/* MOBILE SIDEBAR TOGGLE BAR */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-black text-white p-3 flex items-center justify-between border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ff3e3e] border border-white rounded flex items-center justify-center font-black text-white">
            C
          </div>
          <span className="font-black text-sm uppercase tracking-wider text-white">Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 bg-white text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ADMIN SIDEBAR (FIXED LEFT PANEL) */}
      <aside
        className={`fixed md:static top-0 left-0 z-50 h-full w-72 bg-white border-r-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-transform duration-300 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-5 border-b-4 border-black bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#ff3e3e] text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                C
              </div>
              <div>
                <h1 className="font-black text-base uppercase tracking-tight text-black leading-none">
                  Cần Giuộc
                </h1>
                <span className="text-[10px] font-black uppercase text-[#ff3e3e] tracking-widest block mt-0.5">
                  Admin Portal 🛡️
                </span>
              </div>
            </div>
            {totalNeedsAttention > 0 && (
              <span className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] px-2 py-0.5 border-2 border-black animate-pulse">
                {totalNeedsAttention}
              </span>
            )}
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => {
              setActiveAdminTab('dashboard')
              setMobileSidebarOpen(false)
            }}
            className={`w-full text-left px-4 py-3 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between transition-all cursor-pointer ${
              activeAdminTab === 'dashboard'
                ? 'bg-[#ff3e3e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Tổng Quan</span>
            </div>
            {totalNeedsAttention > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-black ${
                activeAdminTab === 'dashboard' ? 'bg-white text-[#ff3e3e]' : 'bg-[#ff3e3e] text-white'
              }`}>
                {totalNeedsAttention}
              </span>
            )}
          </button>

          {/* Stores */}
          <button
            onClick={() => {
              setActiveAdminTab('stores')
              setMobileSidebarOpen(false)
              if (loadGlobalData) loadGlobalData()
              if (loadAdminPendingStores) loadAdminPendingStores()
            }}
            className={`w-full text-left px-4 py-3 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between transition-all cursor-pointer ${
              activeAdminTab === 'stores'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4 shrink-0" />
              <span>Quản Lý Quán Ăn</span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-[#ff3e3e] text-white px-2 py-0.5 rounded-full text-[10px] font-black border border-black">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Users */}
          <button
            onClick={() => {
              setActiveAdminTab('users')
              setMobileSidebarOpen(false)
              if (loadAdminUsers) loadAdminUsers()
            }}
            className={`w-full text-left px-4 py-3 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between transition-all cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>Người Dùng</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500">({totalUsersCount})</span>
          </button>

          {/* Categories */}
          <button
            onClick={() => {
              setActiveAdminTab('categories')
              setMobileSidebarOpen(false)
              if (loadGlobalData) loadGlobalData()
            }}
            className={`w-full text-left px-4 py-3 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between transition-all cursor-pointer ${
              activeAdminTab === 'categories'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 shrink-0" />
              <span>Danh Mục Ẩm Thực</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500">({totalCategoriesCount})</span>
          </button>
        </nav>

        {/* SIDEBAR FOOTER (ADMIN ACCOUNT & ACTIONS) */}
        <div className="p-4 border-t-4 border-black bg-[#f7f6f2] space-y-3 shrink-0">
          {/* Admin User Card */}
          <div className="bg-white p-3 border-2 border-black rounded-xl flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <img
              src={currentUser?.avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full border-2 border-black object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-xs text-black truncate">{adminFullName}</p>
              <p className="font-bold text-[10px] text-neutral-500 truncate">{currentUser?.email}</p>
              <span className="brutalist-badge bg-[#ff3e3e] text-white text-[8px] py-0 px-1 border border-black inline-block mt-0.5">
                ADMIN ROLE
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5">
            <button
              onClick={() => switchTab('explore')}
              className="w-full py-2 px-3 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Compass className="w-4 h-4 text-[#ff3e3e]" />
              Về Trang Khách ↗
            </button>

            {handleLogout && (
              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 bg-[#fff5f5] hover:bg-[#ffe0e0] text-[#ff3e3e] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
                Đăng Xuất
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 pt-16 md:pt-8 space-y-8 overflow-y-auto">
        {/* ========================================================================= */}
        {/* 1. DASHBOARD PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Header Banner */}
            <div className="bg-[#ff3e3e] text-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none select-none text-white hidden sm:block">
                <Shield className="w-44 h-44" />
              </div>
              <div className="relative z-10 space-y-2 max-w-xl">
                <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3 py-1">
                  Dashboard Overview
                </span>
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  Bảng Tổng Quan Quản Trị
                </h2>
                <p className="text-xs sm:text-sm font-extrabold text-white/95 leading-relaxed">
                  Xin chào <span className="underline">{adminFullName}</span>! Theo dõi chỉ số toàn hệ thống và xử lý các tác vụ duyệt quán mới.
                </p>
              </div>
            </div>

            {/* Metric Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Pending */}
              <div
                onClick={() => {
                  setStoreStatusFilter('PENDING')
                  setActiveAdminTab('stores')
                }}
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-500">Quán Chờ Duyệt</span>
                  <div className="w-10 h-10 bg-[#fff9db] border-2 border-black rounded-lg flex items-center justify-center text-[#b45309]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black text-[#ff3e3e]">{pendingCount}</span>
                  <span className="text-[11px] font-black text-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Xem Ngay <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 2: Recovery requested */}
              <div
                onClick={() => {
                  setStoreStatusFilter('RECOVERY_REQUESTED')
                  setActiveAdminTab('stores')
                }}
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-500">Xin Khôi Phục</span>
                  <div className="w-10 h-10 bg-[#eef2ff] border-2 border-black rounded-lg flex items-center justify-center text-[#4338ca]">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black text-[#4338ca]">{recoveryCount}</span>
                  <span className="text-[11px] font-black text-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Xem Ngay <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 3: Approved */}
              <div
                onClick={() => {
                  setStoreStatusFilter('APPROVED')
                  setActiveAdminTab('stores')
                }}
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-500">Quán Đã Duyệt</span>
                  <div className="w-10 h-10 bg-[#e6fcf5] border-2 border-black rounded-lg flex items-center justify-center text-[#0ca678]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black text-[#0ca678]">{approvedStoresCount}</span>
                  <span className="text-[11px] font-black text-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Tất Cả <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 4: Registered Users */}
              <div
                onClick={() => setActiveAdminTab('users')}
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-500">Tài Khoản User</span>
                  <div className="w-10 h-10 bg-[#f7f6f2] border-2 border-black rounded-lg flex items-center justify-center text-black">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-black text-black">{totalUsersCount}</span>
                  <span className="text-[11px] font-black text-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Quản Lý <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Needs Attention Table Panel */}
            <div className="brutalist-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-3">
                <div>
                  <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#ff3e3e]" /> Tác Vụ Cần Xử Lý Gấp (Needs Attention)
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500">
                    Danh sách quán ăn mới đăng ký chờ duyệt hoặc yêu cầu mở lại quán.
                  </p>
                </div>
                <button
                  onClick={() => setActiveAdminTab('stores')}
                  className="brutalist-btn-white py-1 px-3 text-xs font-black self-start sm:self-auto"
                >
                  Xem Tất Cả Quán ↗
                </button>
              </div>

              {(adminPendingStores.length + stores.filter(s => s.recoveryRequested).length) === 0 ? (
                <div className="bg-[#e6fcf5] border-2 border-black p-6 rounded-xl text-center space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="w-8 h-8 text-[#0ca678] mx-auto" />
                  <p className="font-extrabold text-sm text-black">Không có tác vụ nào đang chờ xử lý!</p>
                  <p className="text-xs text-neutral-600">Tất cả các quán ăn đã được kiểm duyệt hoặc ở trạng thái hoạt động ổn định.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-black border-b-2 border-black">
                        <th className="pb-3 font-black uppercase">Quán Ăn</th>
                        <th className="pb-3 font-black uppercase">Chủ Quán</th>
                        <th className="pb-3 font-black uppercase">Loại Yêu Cầu</th>
                        <th className="pb-3 font-black uppercase text-right">Duyệt Nhanh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-neutral-200">
                      {/* Pending stores */}
                      {adminPendingStores.map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={st.bannerImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'}
                                alt={st.name}
                                className="w-10 h-10 border-2 border-black object-cover rounded shrink-0"
                              />
                              <div>
                                <p className="font-extrabold text-black text-sm">{st.name}</p>
                                <p className="text-[10px] text-neutral-500 font-semibold">{st.addressLine}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 font-bold text-neutral-700">
                            {st.ownerUsername || st.ownerEmail || 'N/A'}
                          </td>
                          <td className="py-3.5">
                            <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[10px]">
                              PENDING (Đăng ký mới)
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleAdminApprove(st.id)}
                                className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => {
                                  setViewingStore(st)
                                  setRejectionReason('')
                                  setTimeout(() => setRejectingStore(st), 250)
                                }}
                                className="py-1 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                              >
                                Từ Chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Recovery requested stores */}
                      {stores.filter(s => s.recoveryRequested).map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={st.bannerImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'}
                                alt={st.name}
                                className="w-10 h-10 border-2 border-black object-cover rounded shrink-0"
                              />
                              <div>
                                <p className="font-extrabold text-black text-sm">{st.name}</p>
                                <p className="text-[10px] text-indigo-700 italic">Lý do xin mở: “{st.recoveryRequestReason}”</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 font-bold text-neutral-700">
                            {st.ownerUsername || st.ownerEmail || 'N/A'}
                          </td>
                          <td className="py-3.5">
                            <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[10px]">
                              RECOVERY (Yêu cầu khôi phục)
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('RECOVER')
                                }}
                                className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                              >
                                Duyệt KP
                              </button>
                              <button
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                                }}
                                className="py-1 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                              >
                                Từ Chối KP
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. STORES MANAGEMENT PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'stores' && (
          <div className="brutalist-card bg-white p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                  <Store className="w-6 h-6 text-[#ff3e3e]" /> Quản Lý Tất Cả Quán Ăn
                </h2>
                <p className="text-xs font-semibold text-neutral-500">
                  Duyệt quán mới, quản lý quán bị ẩn và duyệt yêu cầu mở lại quán.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <span className="text-xs font-black uppercase text-neutral-500 shrink-0">Lọc:</span>
                {[
                  { id: 'ALL', label: 'Tất Cả' },
                  { id: 'PENDING', label: 'Chờ Duyệt', badge: adminPendingStores.length },
                  { id: 'RECOVERY_REQUESTED', label: 'Xin KP', badge: stores.filter((s) => s.recoveryRequested).length },
                  { id: 'APPROVED', label: 'Đã Duyệt' },
                  { id: 'HIDDEN', label: 'Đã Ẩn' },
                  { id: 'REJECTED', label: 'Từ Chối' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setStoreStatusFilter(filter.id)}
                    className={`px-3 py-1 text-[11px] font-black uppercase border-2 border-black rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      storeStatusFilter === filter.id
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    <span>{filter.label}</span>
                    {filter.badge > 0 && (
                      <span className="bg-[#ff3e3e] text-white px-1.5 py-0.2 rounded-full text-[9px] font-black animate-pulse border border-black leading-none">
                        {filter.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Tìm theo tên quán, địa chỉ, chủ quán..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="brutalist-input pl-10 text-xs"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores
                .filter((s) => {
                  if (storeStatusFilter === 'RECOVERY_REQUESTED') return s.recoveryRequested
                  if (storeStatusFilter !== 'ALL' && s.status !== storeStatusFilter) return false
                  if (!storeSearchQuery.trim()) return true
                  const q = storeSearchQuery.toLowerCase()
                  return (
                    (s.name && s.name.toLowerCase().includes(q)) ||
                    (s.addressLine && s.addressLine.toLowerCase().includes(q)) ||
                    (s.ownerUsername && s.ownerUsername.toLowerCase().includes(q))
                  )
                })
                .map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setViewingStore(st)}
                    className="brutalist-card bg-white overflow-hidden flex flex-col justify-between h-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="h-36 w-full border-b-2 border-black relative bg-neutral-200 overflow-hidden">
                        <img
                          src={st.bannerImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'}
                          alt={st.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="brutalist-badge bg-white text-black text-[10px]">
                            {st.categoryName || 'Quán ăn'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="font-extrabold text-base text-black line-clamp-1 group-hover:text-[#ff3e3e] transition-colors">{st.name}</h4>
                        <p className="text-xs text-neutral-600 truncate">Địa chỉ: {st.addressLine}</p>
                        <p className="text-[11px] text-neutral-500 font-semibold">Chủ quán: {st.ownerUsername || st.ownerEmail || 'N/A'}</p>

                        <div>
                          {st.status === 'APPROVED' ? (
                            <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]">
                              APPROVED (Công khai)
                            </span>
                          ) : st.status === 'HIDDEN' ? (
                            <div className="space-y-1">
                              <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309]">
                                HIDDEN (Đã Ẩn)
                              </span>
                              {st.recoveryRequested && (
                                <div className="text-[10px] font-bold text-indigo-900 bg-indigo-50 p-1.5 border border-indigo-300 rounded italic mt-1">
                                  Yêu cầu khôi phục: “{st.recoveryRequestReason}”
                                </div>
                              )}
                            </div>
                          ) : st.status === 'REJECTED' ? (
                            <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]">
                              REJECTED (Bị từ chối)
                            </span>
                          ) : (
                            <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca]">
                              PENDING (Chờ duyệt)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 bg-[#f7f6f2] border-t-2 border-black flex items-center justify-end gap-2 shrink-0"
                    >
                      {st.status === 'PENDING' && (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <button
                            onClick={() => handleAdminApprove(st.id)}
                            className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setViewingStore(st)
                              setRejectionReason('')
                              setTimeout(() => setRejectingStore(st), 250)
                            }}
                            className="flex-1 py-1.5 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            Từ Chối
                          </button>
                        </div>
                      )}

                      {st.status === 'HIDDEN' && st.recoveryRequested && (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <button
                            onClick={() => {
                              setAdminActionModalStore(st)
                              setAdminActionModalType('RECOVER')
                            }}
                            className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            Duyệt KP
                          </button>
                          <button
                            onClick={() => {
                              setAdminActionModalStore(st)
                              setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                            }}
                            className="flex-1 py-1.5 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            Từ Chối KP
                          </button>
                        </div>
                      )}

                      {st.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setAdminActionModalStore(st)
                            setAdminActionModalType('HIDE')
                          }}
                          className="py-1.5 px-3 bg-[#fab005] hover:bg-[#e69c00] text-black font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Ẩn Quán
                        </button>
                      )}

                      {st.status === 'HIDDEN' && !st.recoveryRequested && (
                        <button
                          onClick={() => {
                            setAdminActionModalStore(st)
                            setAdminActionModalType('RECOVER')
                          }}
                          className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Hiện Quán
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setAdminActionModalStore(st)
                          setAdminActionModalType('HARD_DELETE')
                        }}
                        className="w-8 h-8 bg-white hover:bg-red-50 text-red-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0"
                        title="Xóa Vĩnh Viễn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. USERS MANAGEMENT PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'users' && (
          <div className="brutalist-card bg-white p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#ff3e3e]" /> Quản Lý Tài Khoản Người Dùng
                </h2>
                <p className="text-xs font-semibold text-neutral-500">
                  Xem danh sách người dùng đăng ký, chỉnh sửa vai trò (roles) và tài khoản.
                </p>
              </div>

              {/* Search user */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm username, email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="brutalist-input pl-10 text-xs"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-black border-b-3 border-black">
                    <th className="pb-3 font-black uppercase">Ảnh</th>
                    <th className="pb-3 font-black uppercase">Tài Khoản</th>
                    <th className="pb-3 font-black uppercase">Họ Và Tên</th>
                    <th className="pb-3 font-black uppercase">Vai Trò (Roles)</th>
                    <th className="pb-3 font-black uppercase text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-neutral-200">
                  {adminUsersList
                    .filter((u) => {
                      if (!userSearchQuery.trim()) return true
                      const q = userSearchQuery.toLowerCase()
                      return (
                        (u.username && u.username.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q))
                      )
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3">
                          <img
                            src={u.avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                            alt="avatar"
                            className="w-9 h-9 border-2 border-black object-cover rounded-full"
                          />
                        </td>
                        <td className="py-3">
                          <p className="font-extrabold text-black text-sm">@{u.username}</p>
                          <p className="text-[10px] text-neutral-500 font-semibold">{u.email}</p>
                        </td>
                        <td className="py-3 font-bold text-neutral-700">
                          {[u.firstname, u.lastname].filter(Boolean).join(' ') || 'Chưa nhập'}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.roles || []).map((r, idx) => (
                              <span
                                key={idx}
                                className="brutalist-badge bg-[#f7f6f2] text-black border-black shadow-none py-0.5 px-2 text-[9px]"
                              >
                                {typeof r === 'string' ? r : r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAdminEditUser(u)}
                              className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Sửa Roles</span>
                            </button>
                            <button
                              onClick={() => handleAdminDeleteUser(u.id)}
                              className="px-2.5 py-1.5 bg-[#fff5f5] hover:bg-[#ffe0e0] text-[#ff3e3e] font-black text-[11px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa User</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. CATEGORIES PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
            {/* Left Column (4/12): Add Category */}
            <div className="lg:col-span-4 space-y-8">
              {/* Add New Category */}
              <div className="brutalist-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 text-black flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-[#ff3e3e]" /> Thêm Danh Mục Mới
                </h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên Danh Mục</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Bánh Mì"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Icon Hiển Thị</label>
                    <select
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      className="brutalist-input"
                    >
                      <option value="fa-utensils">Utensils 🍴 (Nhà hàng)</option>
                      <option value="fa-bread-slice">Bread 🍞 (Bánh mì)</option>
                      <option value="fa-coffee">Coffee ☕ (Cà phê/Nước)</option>
                      <option value="fa-ice-cream">Ice Cream 🍦 (Kem/Tráng miệng)</option>
                      <option value="fa-store">Store 🏪 (Cửa hàng)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full brutalist-btn-red text-xs py-2.5"
                  >
                    Tạo Danh Mục Mới ↗
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (8/12): Categories List */}
            <div className="lg:col-span-8 space-y-8">
              <div className="brutalist-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 text-black flex items-center gap-2">
                  <Folder className="w-5 h-5 text-[#ff3e3e]" /> Danh Sách Danh Mục Ẩm Thực
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-black border-b-3 border-black">
                        <th className="pb-3 font-black uppercase">ID</th>
                        <th className="pb-3 font-black uppercase">Icon</th>
                        <th className="pb-3 font-black uppercase">Tên Danh Mục</th>
                        <th className="pb-3 font-black uppercase text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-neutral-200">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5 font-extrabold text-black">#{cat.id}</td>
                          <td className="py-3.5">
                            <div className="w-8 h-8 border-2 border-black bg-[#f7f6f2] flex items-center justify-center rounded">
                              {getCategoryIcon(cat.icon || cat.iconUrl)}
                            </div>
                          </td>
                          <td className="py-3.5 font-extrabold text-black text-sm">{cat.name}</td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(cat)
                                  setEditCatName(cat.name)
                                  setEditCatIcon(cat.icon || cat.iconUrl || 'fa-bread-slice')
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-2.5 py-1.5 bg-[#fff5f5] hover:bg-[#ffe0e0] text-[#ff3e3e] font-black text-[11px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS PORTALS */}
      {/* ========================================================================= */}

      {/* Store Action Confirm Modal */}
      <StoreActionModal
        isOpen={!!adminActionModalStore}
        actionType={adminActionModalType}
        storeName={adminActionModalStore?.name}
        onClose={() => setAdminActionModalStore(null)}
        onConfirm={handleAdminActionConfirm}
      />

      {/* Admin Rejection Modal */}
      {rejectingStore && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative border-4 border-black">
            <button
              onClick={() => setRejectingStore(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 text-black">
                Từ Chối Xét Duyệt Quán
              </h3>
              <p className="text-xs font-bold text-neutral-600">
                Tên quán: <span className="text-[#ff3e3e] font-black">{rejectingStore.name}</span>
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!rejectionReason.trim()) return
                  handleAdminReject(rejectingStore.id, rejectionReason.trim())
                  setRejectingStore(null)
                  setViewingStore(null)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Lý do từ chối</label>
                  <textarea
                    required
                    placeholder="Vui lòng nhập lý do từ chối chi tiết gửi đến chủ quán..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="brutalist-input w-full"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t-2 border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setRejectingStore(null)}
                    className="brutalist-btn-white text-xs py-1.5 px-4"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!rejectionReason.trim()}
                    className="brutalist-btn-red text-xs py-1.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xác Nhận Từ Chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Edit User Modal */}
      {editingUser && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative border-4 border-black">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 text-black">
                Chỉnh Sửa Tài Khoản
              </h3>
              <form onSubmit={handleAdminUserEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Username</label>
                  <input
                    type="text"
                    required
                    value={adminUserUsername}
                    onChange={(e) => setAdminUserUsername(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Họ</label>
                    <input
                      type="text"
                      value={adminUserFirst}
                      onChange={(e) => setAdminUserFirst(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên</label>
                    <input
                      type="text"
                      value={adminUserLast}
                      onChange={(e) => setAdminUserLast(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Ngày sinh</label>
                  <input
                    type="date"
                    value={adminUserDob}
                    onChange={(e) => setAdminUserDob(e.target.value)}
                    className="brutalist-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Vai Trò (Roles)</label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <label className={`cursor-pointer px-4 py-2 text-xs font-black border-2 border-black rounded-lg transition-all flex items-center gap-2 select-none ${
                      adminUserRoles?.USER ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!adminUserRoles?.USER}
                        onChange={(e) => setAdminUserRoles({ ...adminUserRoles, USER: e.target.checked })}
                        className="w-4 h-4 accent-[#ff3e3e]"
                      />
                      USER (Người Dùng)
                    </label>

                    <label className={`cursor-pointer px-4 py-2 text-xs font-black border-2 border-black rounded-lg transition-all flex items-center gap-2 select-none ${
                      adminUserRoles?.ADMIN ? 'bg-[#ff3e3e] text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!adminUserRoles?.ADMIN}
                        onChange={(e) => setAdminUserRoles({ ...adminUserRoles, ADMIN: e.target.checked })}
                        className="w-4 h-4 accent-black"
                      />
                      ADMIN (Quản Trị Viên)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t-2 border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="brutalist-btn-white text-xs py-1.5 px-4"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="brutalist-btn-red text-xs py-1.5 px-4"
                  >
                    Lưu Thay Đổi ↗
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Category Edit Modal */}
      {editingCategory && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative border-4 border-black">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 text-black">
                Chỉnh Sửa Danh Mục
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!editCatName.trim()) return
                  handleUpdateCategory(editingCategory.id, { name: editCatName, icon: editCatIcon })
                  setEditingCategory(null)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên Danh Mục</label>
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Icon Hiển Thị</label>
                  <select
                    value={editCatIcon}
                    onChange={(e) => setEditCatIcon(e.target.value)}
                    className="brutalist-input"
                  >
                    <option value="fa-utensils">Utensils 🍴 (Nhà hàng)</option>
                    <option value="fa-bread-slice">Bread 🍞 (Bánh mì)</option>
                    <option value="fa-coffee">Coffee ☕ (Cà phê/Nước)</option>
                    <option value="fa-ice-cream">Ice Cream 🍦 (Kem/Tráng miệng)</option>
                    <option value="fa-store">Store 🏪 (Cửa hàng)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t-2 border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="brutalist-btn-white text-xs py-1.5 px-4"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="brutalist-btn-red text-xs py-1.5 px-4"
                  >
                    Lưu Cập Nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Store Detail Drawer Modal */}
      {viewingStore && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="absolute inset-0" onClick={() => setViewingStore(null)} />
          <div className="w-full max-w-lg bg-white border-l-4 border-black h-full overflow-hidden relative z-10 shadow-2xl flex flex-col justify-between animate-fade-in-up">
            <div className="flex-1 overflow-y-auto">
              <div className="h-56 w-full relative bg-neutral-200 border-b-4 border-black shrink-0">
                <img
                  src={viewingStore.bannerImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'}
                  alt={viewingStore.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setViewingStore(null)}
                  className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-1 min-w-0">
                    <span className="brutalist-badge bg-[#ff3e3e] text-white">
                      {viewingStore.categoryName || 'Quán Ăn'}
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-black truncate">{viewingStore.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Thông Tin Người Đăng</h4>
                  <div className="text-xs space-y-1.5 font-semibold text-neutral-700">
                    <p><span className="font-extrabold text-black">Username:</span> {viewingStore.ownerUsername || 'N/A'}</p>
                    <p><span className="font-extrabold text-black">Email:</span> {viewingStore.ownerEmail || 'N/A'}</p>
                    <p><span className="font-extrabold text-black">Địa chỉ quán:</span> {viewingStore.addressLine}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Mô Tả Quán</h4>
                  <p className="text-xs font-semibold text-neutral-800 leading-relaxed bg-white p-3 border-2 border-black rounded-xl">
                    {viewingStore.description || 'Chưa có mô tả.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
