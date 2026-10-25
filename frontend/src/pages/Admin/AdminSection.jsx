import React, { useEffect, useState } from 'react'
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
  Menu,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  DollarSign,
  MapPin,
  Trophy,
  ZoomIn,
  LayoutGrid,
  List
} from 'lucide-react'
import StoreActionModal from '@/components/modals/StoreActionModal'
import AccountStatusModal from '@/components/modals/AccountStatusModal'
import ConfirmActionModal from '@/components/modals/ConfirmActionModal'
import { NativeSelect, Input, MetricCardSkeleton, TableSkeleton } from '@/components/ui'
import CategoryIcon from '@/components/common/CategoryIcon'
import CategoryIconPicker from '@/components/common/CategoryIconPicker'
import ImageViewerModal from '@/components/modals/ImageViewerModal'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { getSafeGoogleMapsUrl } from '@/utils/googleMapsUrl'
import { AVATAR_FALLBACK_IMAGE, FOOD_FALLBACK_IMAGE, STORE_FALLBACK_IMAGE } from '@/utils/imageAssets'

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
  stores = [],
  adminPendingStores = [],
  adminStoreSummary = {},
  handleAdminApprove,
  handleAdminReject,
  handleHideStore,
  handleRecoverStore,
  handleRejectRecoveryRequest,
  handleHardDeleteStore,
  adminUsersList = [],
  handleOpenAdminEditUser,
  handleAdminDeleteUser,
  handleAdminDisableUser,
  handleAdminEnableUser,
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
  loadGlobalData,
  loadingStores = false,
  loadingUsers = false,
  adminUsersPage = { page: 0, totalPages: 1, totalElements: 0 },
  adminStoresPage = { page: 0, totalPages: 1, totalElements: 0 }
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard') // dashboard, stores, users, categories
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [rejectingStore, setRejectingStore] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingStore, setViewingStore] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('fa-bread-slice')
  const [storeStatusFilter, setStoreStatusFilter] = useState('ALL')
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('ALL')
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [storeViewMode, setStoreViewMode] = useState('table') // 'table' | 'cards'
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [categorySortBy, setCategorySortBy] = useState('ID_ASC')
  const [storesPage, setStoresPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [accountActionUser, setAccountActionUser] = useState(null)
  const [accountActionType, setAccountActionType] = useState(null)
  const [expandedUserIds, setExpandedUserIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [adminActionModalStore, setAdminActionModalStore] = useState(null)
  const [adminActionModalType, setAdminActionModalType] = useState(null)
  const [storeActionLoading, setStoreActionLoading] = useState(false)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const drawerDialogRef = useDialogFocus(Boolean(viewingStore), () => setViewingStore(null))

  function loadStorePage(page) {
    loadAdminPendingStores({
      page,
      status: storeStatusFilter,
      categoryId: storeCategoryFilter,
      query: storeSearchQuery.trim()
    })
  }

  function loadUserPage(page) {
    loadAdminUsers({ page, role: userRoleFilter, query: userSearchQuery.trim() })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStoresPage(1)
      loadStorePage(0)
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeStatusFilter, storeCategoryFilter, storeSearchQuery])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUsersPage(1)
      loadUserPage(0)
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoleFilter, userSearchQuery])

  useEffect(() => {
    if (!viewingStore) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [viewingStore])

  const toggleExpandUser = (userId) => {
    setExpandedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleAdminActionConfirm = async ({ reason }) => {
    if (!adminActionModalStore || !adminActionModalType || storeActionLoading) return
    setStoreActionLoading(true)
    const storeId = adminActionModalStore.id
    let resData = false
    try {
      if (adminActionModalType === 'APPROVE') {
        if (handleAdminApprove) resData = await handleAdminApprove(storeId)
      } else if (adminActionModalType === 'HIDE') {
        if (handleHideStore) resData = await handleHideStore(storeId, reason)
      } else if (adminActionModalType === 'RECOVER') {
        if (handleRecoverStore) resData = await handleRecoverStore(storeId, reason)
      } else if (adminActionModalType === 'REJECT_RECOVERY_REQUEST') {
        if (handleRejectRecoveryRequest) resData = await handleRejectRecoveryRequest(storeId, reason)
      } else if (adminActionModalType === 'HARD_DELETE') {
        if (handleHardDeleteStore) resData = await handleHardDeleteStore(storeId, reason)
      }
    } finally {
      setStoreActionLoading(false)
    }
    if (resData !== false) {
      if (adminActionModalType === 'HARD_DELETE' && viewingStore?.id === storeId) {
        setViewingStore(null)
      } else if (viewingStore?.id === storeId && typeof resData === 'object') {
        setViewingStore(resData)
      }
      setAdminActionModalStore(null)
      setAdminActionModalType(null)
    }
  }

  const closeAccountActionModal = () => {
    setAccountActionUser(null)
    setAccountActionType(null)
  }

  const handleAccountActionConfirm = async ({ reason }) => {
    if (!accountActionUser || !accountActionType) return false
    if (accountActionType === 'DISABLE') {
      return handleAdminDisableUser(accountActionUser, reason)
    }
    return handleAdminEnableUser(accountActionUser)
  }

  // Numbered pagination buttons helper
  const renderPaginationButtons = (currentPage, totalPages, onPageChange) => {
    const pages = []
    const maxButtons = 5
    let start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center gap-1.5">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg font-black text-xs border-2 border-black transition-all cursor-pointer ${
              p === currentPage
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
            }`}
            aria-label={`Trang ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="space-y-8 animate-fade-in-up" role="status" aria-busy="true" aria-label="Đang tải Admin Dashboard">
        <div className="p-8 brutalist-card bg-neutral-900 text-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-4">
          <div className="h-8 w-64 brutalist-skeleton" />
          <div className="h-4 w-96 brutalist-skeleton" />
        </div>
        <div
          role="status"
          aria-busy="true"
          aria-label="Đang tải các chỉ số thống kê"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    )
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
  const pendingCount = Number(adminStoreSummary.pending ?? adminPendingStores.length)
  const recoveryCount = Number(adminStoreSummary.recoveryRequested ?? stores.filter((s) => s.recoveryRequested).length)
  const totalNeedsAttention = pendingCount + recoveryCount
  const approvedStoresCount = Number(adminStoreSummary.approved ?? stores.filter((s) => s.status === 'APPROVED').length)
  const totalUsersCount = Number(adminUsersPage?.totalElements ?? adminUsersList.length)
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
          aria-label={mobileSidebarOpen ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
          className="p-1.5 bg-white text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ADMIN SIDEBAR (FIXED/STICKY LEFT PANEL) */}
      <aside
        className={`fixed md:static top-0 left-0 z-50 h-full w-64 xl:w-72 bg-white border-r-4 border-black shadow-[6px_0px_0px_0px_rgba(0,0,0,1)] md:shadow-none flex flex-col justify-between transition-transform duration-300 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-5 border-b-4 border-black bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#ff3e3e] text-white border-3 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                C
              </div>
              <div>
                <h1 className="font-black text-base uppercase tracking-tight text-black leading-none">
                  Cần Giuộc
                </h1>
                <span className="text-[10px] font-black uppercase text-[#ff3e3e] tracking-widest block mt-0.5">
                  Admin Portal
                </span>
              </div>
            </div>
            {totalNeedsAttention > 0 && (
              <span
                className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] px-2 py-0.5 border-2 border-black animate-pulse"
                title={`${totalNeedsAttention} tác vụ cần xử lý gấp`}
              >
                {totalNeedsAttention}
              </span>
            )}
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="p-4 space-y-2.5 flex-1 overflow-y-auto" aria-label="Thanh điều hướng quản trị">
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
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-black ${
                  activeAdminTab === 'dashboard' ? 'bg-white text-[#ff3e3e]' : 'bg-[#ff3e3e] text-white'
                }`}
              >
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
              <span>Quán Ăn</span>
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
              <span>Danh Mục</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500">({totalCategoriesCount})</span>
          </button>
        </nav>

        {/* SIDEBAR FOOTER (ADMIN ACCOUNT & ACTIONS) */}
        <div className="p-4 border-t-4 border-black bg-[#f7f6f2] space-y-3 shrink-0">
          {/* Admin User Card (Clicking card previews avatar) */}
          <div
            onClick={() =>
              setPreviewImage({
                src: currentUser?.avatarUrl || AVATAR_FALLBACK_IMAGE,
                alt: adminFullName,
                caption: `Avatar Admin: ${adminFullName} (${currentUser?.email || ''})`
              })
            }
            className="bg-white p-3 border-2 border-black rounded-xl flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-neutral-50 transition-all group"
            title="Bấm để xem ảnh đại diện Admin"
          >
            <img
              src={currentUser?.avatarUrl || AVATAR_FALLBACK_IMAGE}
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full border-2 border-black object-cover shrink-0 group-hover:brightness-90 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-xs text-black truncate group-hover:text-[#ff3e3e] transition-colors">{adminFullName}</p>
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 space-y-6 sm:space-y-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. DASHBOARD PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
            {/* Header Banner */}
            <div className="bg-[#ff3e3e] text-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none select-none text-white hidden sm:block">
                <Shield className="w-44 h-44" />
              </div>
              <div className="relative z-10 space-y-2 max-w-xl">
                <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3 py-1">
                  Tổng Quan Quản Trị
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
            {loadingStores ? (
              <div
                role="status"
                aria-busy="true"
                aria-label="Đang tải các chỉ số thống kê"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                <span className="sr-only">Đang tải các chỉ số thống kê...</span>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Pending */}
              <div
                onClick={() => {
                  setStoreStatusFilter('PENDING')
                  setActiveAdminTab('stores')
                }}
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer group space-y-3"
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
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer group space-y-3"
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
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer group space-y-3"
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
                className="brutalist-card bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer group space-y-3"
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
            )}

            {/* Needs Attention Table Panel */}
            <div className="brutalist-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-3">
                <div>
                  <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#ff3e3e]" /> Tác Vụ Cần Xử Lý Gấp
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500">
                    Danh sách quán ăn mới đăng ký chờ duyệt hoặc yêu cầu mở lại quán.
                  </p>
                </div>
                <button
                  onClick={() => setActiveAdminTab('stores')}
                  className="brutalist-btn-white py-1.5 px-3 text-xs font-black self-start sm:self-auto cursor-pointer"
                >
                  Xem Tất Cả Quán ↗
                </button>
              </div>

              {loadingStores ? (
                <div role="status" aria-busy="true" className="space-y-3">
                  <span className="sr-only">Đang tải tác vụ cần xử lý...</span>
                  <TableSkeleton cols={4} rows={3} />
                </div>
              ) : pendingCount + recoveryCount === 0 ? (
                <div className="bg-[#e6fcf5] border-2 border-black p-6 rounded-xl text-center space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="w-8 h-8 text-[#0ca678] mx-auto" />
                  <p className="font-extrabold text-sm text-black">Không có tác vụ nào đang chờ xử lý!</p>
                  <p className="text-xs text-neutral-600">Tất cả các quán ăn đã được kiểm duyệt hoặc ở trạng thái hoạt động ổn định.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-2 border-black rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f7f6f2] border-b-2 border-black">
                      <tr className="text-black">
                        <th scope="col" className="p-3.5 font-black uppercase">Quán Ăn</th>
                        <th scope="col" className="p-3.5 font-black uppercase">Chủ Quán</th>
                        <th scope="col" className="p-3.5 font-black uppercase">Loại Yêu Cầu</th>
                        <th scope="col" className="p-3.5 font-black uppercase text-right">Duyệt Nhanh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-neutral-200 bg-white">
                      {/* Pending stores */}
                      {adminPendingStores.map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                          <td
                            onClick={() => setViewingStore(st)}
                            className="p-3.5 cursor-pointer group"
                            title="Bấm để xem chi tiết quán ăn"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                alt={st.name}
                                className="w-11 h-11 border-2 border-black object-cover rounded-lg shrink-0 group-hover:brightness-95 transition-all"
                              />
                              <div>
                                <p className="font-extrabold text-black text-sm group-hover:text-[#ff3e3e] transition-colors">{st.name}</p>
                                <p className="text-[11px] text-neutral-500 font-semibold">{st.addressLine || 'Chưa có địa chỉ'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-neutral-700">
                            {st.ownerUsername || st.ownerEmail || 'N/A'}
                          </td>
                          <td className="p-3.5">
                            <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[10px]">
                              PENDING (Đăng ký mới)
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="whitespace-nowrap flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingStore(st)}
                                className="py-1 px-2.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                                title="Xem Chi Tiết Quán Ăn"
                              >
                                Chi Tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('APPROVE')
                                }}
                                className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingStore(st)
                                  setRejectionReason('')
                                  setTimeout(() => setRejectingStore(st), 250)
                                }}
                                className="py-1 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                              >
                                Từ Chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Recovery requested stores */}
                      {stores.filter((s) => s.recoveryRequested).map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                          <td
                            onClick={() => setViewingStore(st)}
                            className="p-3.5 cursor-pointer group"
                            title="Bấm để xem chi tiết quán ăn"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                alt={st.name}
                                className="w-11 h-11 border-2 border-black object-cover rounded-lg shrink-0 group-hover:brightness-95 transition-all"
                              />
                              <div>
                                <p className="font-extrabold text-black text-sm group-hover:text-[#ff3e3e] transition-colors">{st.name}</p>
                                <p className="text-[10px] text-indigo-700 italic">Lý do xin mở: “{st.recoveryRequestReason}”</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-neutral-700">
                            {st.ownerUsername || st.ownerEmail || 'N/A'}
                          </td>
                          <td className="p-3.5">
                            <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[10px]">
                              RECOVERY (Yêu cầu khôi phục)
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingStore(st)}
                                className="py-1 px-2.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                                title="Xem Chi Tiết Quán Ăn"
                              >
                                Chi Tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('RECOVER')
                                }}
                                className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                              >
                                Duyệt KP
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                                }}
                                className="py-1 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
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
          <div className="brutalist-card bg-white p-5 lg:p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                  <Store className="w-6 h-6 text-[#ff3e3e]" /> Quản Lý Tất Cả Quán Ăn
                </h2>
                <p className="text-xs font-semibold text-neutral-500">
                  Duyệt quán mới, quản lý quán bị ẩn và duyệt yêu cầu mở lại quán.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0" role="toolbar" aria-label="Bộ lọc trạng thái quán">
                <span className="text-xs font-black uppercase text-neutral-500 shrink-0">Lọc:</span>
                {[
                  { id: 'ALL', label: 'Tất Cả' },
                  { id: 'PENDING', label: 'Chờ Duyệt', badge: pendingCount },
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

            {/* Search Input, Category Filter & View Mode Toggle */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 max-w-md">
                <Input
                  id="admin-store-search"
                  aria-label="Tìm theo tên quán, địa chỉ, chủ quán"
                  placeholder="Tìm theo tên quán, địa chỉ, chủ quán..."
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  leftAdornment={<Search className="w-4 h-4 text-neutral-400" />}
                  className="text-xs border-2 border-black"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label htmlFor="admin-store-category-filter" className="text-xs font-black uppercase text-neutral-500 shrink-0">
                    Danh Mục:
                  </label>
                  <NativeSelect
                    id="admin-store-category-filter"
                    aria-label="Lọc quán theo danh mục"
                    value={storeCategoryFilter}
                    onChange={(e) => setStoreCategoryFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Tất Cả Danh Mục' },
                      ...categories.map((c) => ({ value: String(c.id), label: c.name }))
                    ]}
                    containerClassName="w-44 sm:w-52"
                    className="rounded-full text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                {/* View Mode Toggle (Table View vs Card View) */}
                <div className="flex items-center border-2 border-black rounded-lg overflow-hidden bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <button
                    type="button"
                    onClick={() => setStoreViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      storeViewMode === 'table'
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                    title="Hiển thị dạng Bảng Quản Trị (Table View)"
                    aria-label="Chuyển sang chế độ xem dạng Bảng"
                    aria-pressed={storeViewMode === 'table'}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bảng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreViewMode('cards')}
                    className={`px-3 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      storeViewMode === 'cards'
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                    title="Hiển thị dạng Lưới Thẻ (Card View)"
                    aria-label="Chuyển sang chế độ xem dạng Lưới Thẻ"
                    aria-pressed={storeViewMode === 'cards'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lưới thẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stores Data Presentation */}
            {(() => {
              const filteredStores = stores.filter((s) => {
                if (storeStatusFilter === 'RECOVERY_REQUESTED') return s.recoveryRequested
                if (storeStatusFilter !== 'ALL' && s.status !== storeStatusFilter) return false
                if (storeCategoryFilter !== 'ALL' && String(s.categoryId) !== storeCategoryFilter) return false
                if (!storeSearchQuery.trim()) return true
                const q = storeSearchQuery.toLowerCase()
                return (
                  (s.name && s.name.toLowerCase().includes(q)) ||
                  (s.addressLine && s.addressLine.toLowerCase().includes(q)) ||
                  (s.ownerUsername && s.ownerUsername.toLowerCase().includes(q)) ||
                  (s.ownerEmail && s.ownerEmail.toLowerCase().includes(q))
                )
              })
              const totalStoresPages = Math.max(1, adminStoresPage.totalPages || 1)
              const currentPageStores = filteredStores

              if (loadingStores) {
                return (
                  <div role="status" aria-busy="true" className="space-y-4">
                    <span className="sr-only">Đang tải danh sách quán ăn...</span>
                    <TableSkeleton cols={6} rows={5} />
                  </div>
                )
              }

              if (currentPageStores.length === 0) {
                return (
                  <div className="p-8 text-center bg-[#f7f6f2] border-2 border-dashed border-black rounded-xl space-y-2">
                    <Store className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="font-black text-sm text-black uppercase">Không tìm thấy quán ăn nào</p>
                    <p className="text-xs text-neutral-500">
                      Thử thay đổi bộ lọc trạng thái, danh mục hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-6">
                  {/* VIEW 1: DESKTOP WIDE DATA TABLE */}
                  {storeViewMode === 'table' ? (
                    <div className="overflow-x-auto border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                      <table className="w-full text-left text-xs border-collapse min-w-[830px]">
                        <thead className="bg-[#f7f6f2] border-b-3 border-black text-black select-none">
                          <tr>
                            <th scope="col" className="px-3 py-3 font-black uppercase min-w-[200px]">Quán Ăn</th>
                            <th scope="col" className="px-3 py-3 font-black uppercase min-w-[110px]">Chủ Quán</th>
                            <th scope="col" className="px-3 py-3 font-black uppercase min-w-[110px]">Giờ & Giá</th>
                            <th scope="col" className="px-3 py-3 font-black uppercase min-w-[125px]">Trạng Thái</th>
                            <th scope="col" className="px-3 py-3 font-black uppercase min-w-[70px]">Đánh Giá</th>
                            <th scope="col" className="px-3 py-3 font-black uppercase text-right min-w-[215px]">Thao Tác Quản Trị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-neutral-200 bg-white">
                          {currentPageStores.map((st) => (
                            <tr key={st.id} className="hover:bg-neutral-50/80 transition-colors">
                              {/* 1. Store Info */}
                              <td className="px-3 py-3">
                                <div className="flex items-start gap-2.5">
                                  <div
                                    onClick={() => setViewingStore(st)}
                                    className="w-12 h-12 border-2 border-black rounded-lg overflow-hidden shrink-0 cursor-pointer relative group/thumb"
                                    title="Xem chi tiết quán ăn"
                                  >
                                    <img
                                      src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                      alt={st.name}
                                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                      <ZoomIn className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => setViewingStore(st)}
                                      className="font-black text-black text-sm hover:text-[#ff3e3e] transition-colors text-left line-clamp-2 cursor-pointer leading-snug"
                                    >
                                      {st.name}
                                    </button>
                                    <p className="text-[11px] text-neutral-600 line-clamp-1">{st.addressLine || 'Chưa cập nhật địa chỉ'}</p>
                                    <span className="brutalist-badge bg-[#f7f6f2] text-black border-black text-[9px] font-black inline-flex items-center gap-1">
                                      {st.categoryName || 'Quán ăn'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Owner */}
                              <td className="px-3 py-3">
                                <p className="font-extrabold text-black text-xs">@{st.ownerUsername || 'N/A'}</p>
                                <p className="text-[10px] text-neutral-500 font-semibold truncate max-w-[130px]">{st.ownerEmail || 'N/A'}</p>
                                {st.phoneNumber && (
                                  <p className="text-[10px] text-neutral-600 font-bold flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-neutral-400" /> {st.phoneNumber}
                                  </p>
                                )}
                              </td>

                              {/* 3. Hours & Price */}
                              <td className="px-3 py-3">
                                <p className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span>{st.openTime || 'N/A'} – {st.closeTime || 'N/A'}</span>
                                </p>
                                <p className="text-[11px] font-black text-[#ff3e3e] flex items-center gap-1 mt-0.5">
                                  <DollarSign className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0" />
                                  <span>
                                    {st.priceMin ? `${st.priceMin.toLocaleString()}đ` : 'N/A'} – {st.priceMax ? `${st.priceMax.toLocaleString()}đ` : 'N/A'}
                                  </span>
                                </p>
                              </td>

                              {/* 4. Status */}
                              <td className="px-3 py-3">
                                {st.status === 'APPROVED' ? (
                                  <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]">
                                    Đã Duyệt
                                  </span>
                                ) : st.status === 'HIDDEN' ? (
                                  <div className="space-y-1">
                                    <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309]">
                                      Đang Ẩn
                                    </span>
                                    {st.recoveryRequested && (
                                      <div className="text-[10px] font-bold text-indigo-900 bg-indigo-50 p-1.5 border border-indigo-300 rounded italic mt-1 max-w-[150px] line-clamp-2">
                                        Xin mở: “{st.recoveryRequestReason}”
                                      </div>
                                    )}
                                  </div>
                                ) : st.status === 'REJECTED' ? (
                                  <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]">
                                    Từ Chối
                                  </span>
                                ) : (
                                  <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca]">
                                    Chờ Duyệt
                                  </span>
                                )}
                              </td>

                              {/* 5. Satisfaction */}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                  <span className="font-black text-black text-xs">{st.satisfactionRate || 100}%</span>
                                </div>
                                <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                                  ({st.totalVotes || 0} lượt)
                                </span>
                              </td>

                              {/* 6. Admin Actions */}
                              <td className="px-3 py-3 text-right">
                                <div className="whitespace-nowrap flex items-center justify-end gap-1.5">
                                  {/* Detail Button */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingStore(st)}
                                    className="py-1 px-2 bg-white hover:bg-neutral-100 text-black font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                    title="Xem chi tiết toàn bộ quán"
                                  >
                                    Chi Tiết
                                  </button>

                                  {/* Approve / Reject for PENDING */}
                                  {st.status === 'PENDING' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminActionModalStore(st)
                                          setAdminActionModalType('APPROVE')
                                        }}
                                        className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                      >
                                        Duyệt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingStore(st)
                                          setRejectionReason('')
                                          setTimeout(() => setRejectingStore(st), 250)
                                        }}
                                        className="py-1 px-2.5 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                      >
                                        Từ Chối
                                      </button>
                                    </>
                                  )}

                                  {/* Recovery approval for HIDDEN + recoveryRequested */}
                                  {st.status === 'HIDDEN' && st.recoveryRequested && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminActionModalStore(st)
                                          setAdminActionModalType('RECOVER')
                                        }}
                                        className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                      >
                                        Duyệt KP
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminActionModalStore(st)
                                          setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                                        }}
                                        className="py-1 px-2.5 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                      >
                                        Từ Chối KP
                                      </button>
                                    </>
                                  )}

                                  {/* Hide store for APPROVED */}
                                  {st.status === 'APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminActionModalStore(st)
                                        setAdminActionModalType('HIDE')
                                      }}
                                      className="py-1 px-2.5 bg-[#fab005] hover:bg-[#e69c00] text-black font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                      <EyeOff className="w-3.5 h-3.5" /> Ẩn Quán
                                    </button>
                                  )}

                                  {/* Unhide store for HIDDEN without recovery */}
                                  {st.status === 'HIDDEN' && !st.recoveryRequested && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminActionModalStore(st)
                                        setAdminActionModalType('RECOVER')
                                      }}
                                      className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" /> Hiện Quán
                                    </button>
                                  )}

                                  {/* Safe Action Separation Divider */}
                                  <div className="w-[1px] h-5 bg-neutral-300 mx-1 hidden sm:block" />

                                  {/* Dangerous Action: Hard Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminActionModalStore(st)
                                      setAdminActionModalType('HARD_DELETE')
                                    }}
                                    className="p-1.5 bg-white hover:bg-red-50 text-red-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                                    title="Xóa vĩnh viễn quán khỏi hệ thống"
                                    aria-label={`Xóa vĩnh viễn quán ${st.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* VIEW 2: CARD GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentPageStores.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setViewingStore(st)}
                          className="brutalist-card bg-white overflow-hidden flex flex-col justify-between h-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer group"
                        >
                          <div>
                            <div className="h-40 w-full border-b-2 border-black relative bg-neutral-200 overflow-hidden">
                              <img
                                src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                alt={st.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2">
                                <span className="brutalist-badge bg-white text-black text-[10px]">
                                  {st.categoryName || 'Quán ăn'}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 flex items-center gap-1 bg-white border border-black rounded-full px-2 py-0.5 text-[10px] font-black text-black">
                                <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span>{st.satisfactionRate || 100}%</span>
                              </div>
                            </div>

                            <div className="p-4 space-y-2">
                              <h4 className="font-extrabold text-base text-black line-clamp-2 group-hover:text-[#ff3e3e] transition-colors leading-snug">
                                {st.name}
                              </h4>
                              <p className="text-xs text-neutral-600 line-clamp-1">Địa chỉ: {st.addressLine || 'Chưa cập nhật'}</p>
                              <p className="text-[11px] text-neutral-500 font-semibold">
                                Chủ quán: <span className="font-bold text-black">@{st.ownerUsername || 'N/A'}</span>
                              </p>

                              <div className="pt-1">
                                {st.status === 'APPROVED' ? (
                                  <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]">
                                    Đã Duyệt (Công khai)
                                  </span>
                                ) : st.status === 'HIDDEN' ? (
                                  <div className="space-y-1">
                                    <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309]">
                                      Đang Ẩn
                                    </span>
                                    {st.recoveryRequested && (
                                      <div className="text-[10px] font-bold text-indigo-900 bg-indigo-50 p-1.5 border border-indigo-300 rounded italic mt-1">
                                        Yêu cầu khôi phục: “{st.recoveryRequestReason}”
                                      </div>
                                    )}
                                  </div>
                                ) : st.status === 'REJECTED' ? (
                                  <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]">
                                    Bị Từ Chối
                                  </span>
                                ) : (
                                  <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca]">
                                    Chờ Duyệt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-[#f7f6f2] border-t-2 border-black flex items-center justify-between gap-2 shrink-0"
                          >
                            <button
                              type="button"
                              onClick={() => setViewingStore(st)}
                              className="py-1 px-2.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                            >
                              Chi Tiết
                            </button>

                            <div className="flex items-center gap-1.5">
                              {st.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setAdminActionModalStore(st)
                                      setAdminActionModalType('APPROVE')
                                    }}
                                    className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => {
                                      setViewingStore(st)
                                      setRejectionReason('')
                                      setTimeout(() => setRejectingStore(st), 250)
                                    }}
                                    className="py-1 px-2.5 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    Từ Chối
                                  </button>
                                </>
                              )}

                              {st.status === 'HIDDEN' && st.recoveryRequested && (
                                <>
                                  <button
                                    onClick={() => {
                                      setAdminActionModalStore(st)
                                      setAdminActionModalType('RECOVER')
                                    }}
                                    className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    Duyệt KP
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAdminActionModalStore(st)
                                      setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                                    }}
                                    className="py-1 px-2.5 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    Từ Chối KP
                                  </button>
                                </>
                              )}

                              {st.status === 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    setAdminActionModalStore(st)
                                    setAdminActionModalType('HIDE')
                                  }}
                                  className="py-1 px-2.5 bg-[#fab005] hover:bg-[#e69c00] text-black font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                                >
                                  <EyeOff className="w-3.5 h-3.5" /> Ẩn
                                </button>
                              )}

                              {st.status === 'HIDDEN' && !st.recoveryRequested && (
                                <button
                                  onClick={() => {
                                    setAdminActionModalStore(st)
                                    setAdminActionModalType('RECOVER')
                                  }}
                                  className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Hiện
                                </button>
                              )}

                              {/* Hard Delete */}
                              <button
                                onClick={() => {
                                  setAdminActionModalStore(st)
                                  setAdminActionModalType('HARD_DELETE')
                                }}
                                className="w-7 h-7 bg-white hover:bg-red-50 text-red-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 ml-1"
                                title="Xóa Vĩnh Viễn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stores Numbered Pagination Bar */}
                  {totalStoresPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-black font-black text-xs">
                      <button
                        disabled={storesPage === 1}
                        onClick={() => {
                          const next = Math.max(1, storesPage - 1)
                          setStoresPage(next)
                          loadStorePage(next - 1)
                        }}
                        className="px-3.5 py-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                      >
                        ◄ Trang Trước
                      </button>

                      <div className="flex items-center gap-3">
                        {renderPaginationButtons(storesPage, totalStoresPages, (p) => {
                          setStoresPage(p)
                          loadStorePage(p - 1)
                        })}
                        <span className="text-neutral-500 font-extrabold text-[11px] hidden md:inline">
                          ({adminStoresPage.totalElements ?? filteredStores.length} quán)
                        </span>
                      </div>

                      <button
                        disabled={storesPage >= totalStoresPages}
                        onClick={() => {
                          const next = Math.min(totalStoresPages, storesPage + 1)
                          setStoresPage(next)
                          loadStorePage(next - 1)
                        }}
                        className="px-3.5 py-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                      >
                        Trang Sau ►
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
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

              {/* Search user & Role Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <label htmlFor="admin-user-role-filter" className="text-xs font-black uppercase text-neutral-500 shrink-0">
                    Vai Trò:
                  </label>
                  <NativeSelect
                    id="admin-user-role-filter"
                    aria-label="Lọc người dùng theo vai trò"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Tất Cả Roles' },
                      { value: 'ADMIN', label: 'ADMIN (Quản trị)' },
                      { value: 'USER', label: 'USER (Người dùng)' }
                    ]}
                    containerClassName="w-40 sm:w-48"
                    className="rounded-full text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    id="admin-user-search"
                    aria-label="Tìm username, email"
                    placeholder="Tìm username, email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    leftAdornment={<Search className="w-4 h-4 text-neutral-400" />}
                    className="text-xs border-2 border-black"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const filteredUsers = adminUsersList.filter((u) => {
                if (userRoleFilter !== 'ALL') {
                  const roles = (u.roles || []).map((r) => (typeof r === 'string' ? r : r.name))
                  if (!roles.includes(userRoleFilter)) return false
                }
                if (!userSearchQuery.trim()) return true
                const q = userSearchQuery.toLowerCase()
                return (
                  (u.username && u.username.toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.firstname && u.firstname.toLowerCase().includes(q)) ||
                  (u.lastname && u.lastname.toLowerCase().includes(q))
                )
              })
              const totalUsersPages = Math.max(1, adminUsersPage.totalPages || 1)
              const currentPageUsers = filteredUsers

              if (loadingUsers) {
                return (
                  <div role="status" aria-busy="true" className="space-y-4">
                    <span className="sr-only">Đang tải danh sách tài khoản...</span>
                    <TableSkeleton cols={5} rows={5} />
                  </div>
                )
              }

              if (currentPageUsers.length === 0) {
                return (
                  <div className="p-8 text-center bg-[#f7f6f2] border-2 border-dashed border-black rounded-xl space-y-2">
                    <Users className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="font-black text-sm text-black uppercase">Không tìm thấy tài khoản nào</p>
                    <p className="text-xs text-neutral-500">Thử tìm kiếm với từ khóa khác hoặc điều chỉnh vai trò.</p>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  <div className="overflow-x-auto border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                      <thead className="bg-[#f7f6f2] border-b-3 border-black text-black select-none">
                        <tr>
                          <th scope="col" className="p-3.5 pl-4 pr-4 font-black uppercase w-36 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <span className="w-5 shrink-0" aria-hidden="true" />
                              <span>Ảnh</span>
                            </div>
                          </th>
                          <th scope="col" className="p-3.5 pl-8 font-black uppercase min-w-[220px]">Tài Khoản</th>
                          <th scope="col" className="p-3.5 font-black uppercase min-w-[130px]">Họ Và Tên</th>
                          <th scope="col" className="p-3.5 font-black uppercase min-w-[110px]">Vai Trò (Roles)</th>
                          <th scope="col" className="p-3.5 font-black uppercase text-right min-w-[240px]">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-neutral-200 bg-white">
                        {currentPageUsers.map((u) => {
                          const isExpanded = expandedUserIds.includes(u.id)
                          const userStores = stores.filter((st) => {
                            return (
                              (st.ownerId && u.id && st.ownerId.toString() === u.id.toString()) ||
                              (st.ownerEmail && u.email && st.ownerEmail.toLowerCase() === u.email.toLowerCase())
                            )
                          })

                          return (
                            <React.Fragment key={u.id}>
                              <tr
                                onClick={() => toggleExpandUser(u.id)}
                                className="hover:bg-red-50/40 transition-colors cursor-pointer group select-none"
                                title="Bấm để mở rộng cây thư mục các quán ăn của người dùng"
                              >
                                <td className="p-3.5 pl-4 pr-4 w-36 min-w-[140px]">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleExpandUser(u.id)
                                      }}
                                      className="p-1 hover:bg-neutral-200 rounded transition-colors text-black cursor-pointer shrink-0"
                                      aria-label={isExpanded ? 'Thu gọn danh sách quán' : 'Mở rộng danh sách quán'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-[#ff3e3e]" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black" />
                                      )}
                                    </button>
                                    <img
                                      src={u.avatarUrl || AVATAR_FALLBACK_IMAGE}
                                      alt="avatar"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewImage({
                                          src: u.avatarUrl || AVATAR_FALLBACK_IMAGE,
                                          alt: u.username,
                                          caption: `Avatar Người Dùng: @${u.username} (${u.email || 'N/A'})`
                                        })
                                      }}
                                      className="w-9 h-9 border-2 border-black object-cover rounded-full group-hover:brightness-90 transition-all cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                      title="Bấm để xem ảnh avatar lớn"
                                    />
                                  </div>
                                </td>
                                <td className="p-3.5 pl-8 min-w-[220px]">
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-black text-sm group-hover:text-[#ff3e3e] transition-colors">@{u.username}</p>
                                    {userStores.length > 0 && (
                                      <span className="brutalist-badge bg-[#fff9db] text-black border-black text-[9px] font-black px-1.5 py-0.2">
                                        {userStores.length} Quán
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-500 font-semibold">{u.email}</p>
                                  <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded ${u.enabled ? 'bg-[#e6fcf5] text-[#087f5b]' : u.emailVerified ? 'bg-[#fff5f5] text-[#c92a2a]' : 'bg-[#fff9db] text-[#b45309]'}`}>
                                    {u.enabled ? 'Hoạt động' : u.emailVerified ? 'Đã khóa' : 'Chờ xác thực'}
                                  </span>
                                </td>
                                <td className="p-3.5 font-bold text-neutral-700">
                                  {[u.firstname, u.lastname].filter(Boolean).join(' ') || 'Chưa nhập'}
                                </td>
                                <td className="p-3.5">
                                  <div className="flex flex-wrap gap-1">
                                    {(u.roles || []).map((r, idx) => (
                                      <span
                                        key={idx}
                                        className={`brutalist-badge border-black shadow-none py-0.5 px-2 text-[9px] ${
                                          (typeof r === 'string' ? r : r.name) === 'ADMIN'
                                            ? 'bg-black text-white'
                                            : 'bg-[#f7f6f2] text-black'
                                        }`}
                                      >
                                        {typeof r === 'string' ? r : r.name}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="whitespace-nowrap flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandUser(u.id)}
                                      className="py-1.5 px-2 bg-[#f7f6f2] hover:bg-neutral-200 text-black font-black text-[10px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1 cursor-pointer transition-all"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="w-3.5 h-3.5 text-[#ff3e3e]" />
                                          <span>Thu Gọn</span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-3.5 h-3.5" />
                                          <span>Xem Quán ({userStores.length})</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAdminEditUser(u)}
                                      className="px-2 py-1.5 bg-white hover:bg-neutral-100 text-black font-black text-[10px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer transition-all"
                                      title="Sửa vai trò người dùng"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Sửa Roles</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAccountActionUser(u)
                                        setAccountActionType(u.enabled ? 'DISABLE' : 'ENABLE')
                                      }}
                                      disabled={u.id === currentUser?.id || (!u.enabled && !u.emailVerified)}
                                      className={`px-2.5 py-1.5 inline-flex items-center justify-center text-black font-black text-[10px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                                        u.enabled
                                          ? 'bg-amber-300 hover:bg-amber-400'
                                          : 'bg-emerald-300 hover:bg-emerald-400'
                                      }`}
                                    >
                                      {u.enabled ? 'Khóa' : 'Mở khóa'}
                                    </button>

                                    {/* Dangerous Action: Hard Delete User */}
                                    <div className="w-[1px] h-5 bg-neutral-300 mx-0.5 hidden sm:block" />
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget({ type: 'USER', item: u })}
                                      disabled={u.id === currentUser?.id}
                                      className="px-2 py-1.5 bg-[#fff5f5] hover:bg-[#ffe0e0] text-[#ff3e3e] font-black text-[10px] uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Xóa tài khoản người dùng"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Nested User Stores Tree Branch Accordion */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} className="p-3 bg-[#f7f6f2] border-b-2 border-black">
                                    <div className="bg-white p-4 border-2 border-black rounded-xl space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-fade-in-up">
                                      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Folder className="w-4 h-4 text-[#ff3e3e]" />
                                          <span className="font-black text-xs uppercase text-black">
                                            Cây Thư Mục Quán Ăn Của @{u.username} ({userStores.length} quán)
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => toggleExpandUser(u.id)}
                                          className="text-[10px] font-black text-neutral-500 hover:text-black cursor-pointer flex items-center gap-1"
                                        >
                                          <X className="w-3.5 h-3.5 text-neutral-500" />
                                          <span>Đóng</span>
                                        </button>
                                      </div>

                                      {userStores.length === 0 ? (
                                        <div className="p-3 bg-[#f7f6f2] border border-black rounded-lg text-center text-xs font-bold text-neutral-500">
                                          Tài khoản người dùng này chưa đăng ký quán ăn nào trên hệ thống.
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {userStores.map((st) => {
                                            const renderStatusBadge = (status, isRecovery) => {
                                              if (isRecovery) {
                                                return <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[9px] font-black">Xin Khôi Phục</span>
                                              }
                                              switch (status) {
                                                case 'APPROVED':
                                                  return <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] text-[9px] font-black">Đã Duyệt</span>
                                                case 'PENDING':
                                                  return <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[9px] font-black">Chờ Duyệt</span>
                                                case 'REJECTED':
                                                  return <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] text-[9px] font-black">Từ Chối</span>
                                                case 'HIDDEN':
                                                  return <span className="brutalist-badge bg-neutral-200 text-neutral-700 border-neutral-400 text-[9px] font-black">Đã Ẩn</span>
                                                default:
                                                  return <span className="brutalist-badge bg-neutral-100 text-black text-[9px] font-black">{status}</span>
                                              }
                                            }

                                            return (
                                              <div
                                                key={st.id}
                                                onClick={() => setViewingStore(st)}
                                                className="bg-[#f7f6f2] hover:bg-[#fff9db] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group flex flex-col justify-between space-y-2.5"
                                                title="Nhấp vào để xem chi tiết quán ăn"
                                              >
                                                <div className="flex items-start gap-2.5">
                                                  <img
                                                    src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                                    alt={st.name}
                                                    className="w-12 h-12 border-2 border-black object-cover rounded-lg shrink-0 group-hover:brightness-95 transition-all"
                                                  />
                                                  <div className="min-w-0 flex-1 space-y-1">
                                                    <p className="font-black text-black text-xs truncate group-hover:text-[#ff3e3e] transition-colors">{st.name}</p>
                                                    {renderStatusBadge(st.status, st.recoveryRequested)}
                                                  </div>
                                                </div>

                                                <div className="pt-2 border-t border-neutral-300 flex items-center justify-between text-[10px] font-semibold text-neutral-600">
                                                  <div className="flex items-center gap-1 min-w-0 truncate">
                                                    <MapPin className="w-3 h-3 text-[#ff3e3e] shrink-0" />
                                                    <span className="truncate">{st.addressLine || 'Chưa cập nhật địa chỉ'}</span>
                                                  </div>
                                                  <span className="font-black text-[#ff3e3e] group-hover:underline flex items-center gap-0.5 shrink-0 ml-1">
                                                    Chi tiết <ChevronRight className="w-3 h-3" />
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Users Numbered Pagination Bar */}
                  {totalUsersPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-black font-black text-xs">
                      <button
                        disabled={usersPage === 1}
                        onClick={() => {
                          const next = Math.max(1, usersPage - 1)
                          setUsersPage(next)
                          loadUserPage(next - 1)
                        }}
                        className="px-3.5 py-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                      >
                        ◄ Trang Trước
                      </button>

                      <div className="flex items-center gap-3">
                        {renderPaginationButtons(usersPage, totalUsersPages, (p) => {
                          setUsersPage(p)
                          loadUserPage(p - 1)
                        })}
                        <span className="text-neutral-500 font-extrabold text-[11px] hidden md:inline">
                          ({adminUsersPage.totalElements ?? filteredUsers.length} tài khoản)
                        </span>
                      </div>

                      <button
                        disabled={usersPage >= totalUsersPages}
                        onClick={() => {
                          const next = Math.min(totalUsersPages, usersPage + 1)
                          setUsersPage(next)
                          loadUserPage(next - 1)
                        }}
                        className="px-3.5 py-1.5 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                      >
                        Trang Sau ►
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. CATEGORIES PANEL */}
        {/* ========================================================================= */}
        {activeAdminTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
            {/* Left Column (4/12): Add Category */}
            <div className="lg:col-span-4 space-y-8">
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
                      maxLength={50}
                      placeholder="Ví dụ: Bánh Mì"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <CategoryIconPicker
                      value={catIcon}
                      onChange={(iconId) => setCatIcon(iconId)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full brutalist-btn-red text-xs py-2.5 cursor-pointer"
                  >
                    Tạo Danh Mục Mới ↗
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (8/12): Categories List */}
            <div className="lg:col-span-8 space-y-8">
              <div className="brutalist-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-2">
                  <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                    <Folder className="w-5 h-5 text-[#ff3e3e]" /> Danh Sách Danh Mục Ẩm Thực
                  </h3>
                  <div className="flex items-center gap-2">
                    <label htmlFor="admin-category-sort-by" className="text-xs font-black uppercase text-neutral-500 shrink-0">
                      Sắp xếp:
                    </label>
                    <NativeSelect
                      id="admin-category-sort-by"
                      aria-label="Sắp xếp danh sách danh mục"
                      value={categorySortBy}
                      onChange={(e) => setCategorySortBy(e.target.value)}
                      options={[
                        { value: 'ID_ASC', label: 'ID Tăng Dần (1-9)' },
                        { value: 'ID_DESC', label: 'ID Giảm Dần (9-1)' },
                        { value: 'NAME_ASC', label: 'Tên A → Z' },
                        { value: 'NAME_DESC', label: 'Tên Z → A' }
                      ]}
                      containerClassName="w-44 sm:w-52"
                      className="rounded-full text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f7f6f2] border-b-3 border-black text-black select-none">
                      <tr>
                        <th scope="col" className="p-3.5 font-black uppercase">ID</th>
                        <th scope="col" className="p-3.5 font-black uppercase">Icon</th>
                        <th scope="col" className="p-3.5 font-black uppercase">Tên Danh Mục</th>
                        <th scope="col" className="p-3.5 font-black uppercase text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-neutral-200 bg-white">
                      {[...categories]
                        .sort((a, b) => {
                          if (categorySortBy === 'ID_ASC') return a.id - b.id
                          if (categorySortBy === 'ID_DESC') return b.id - a.id
                          if (categorySortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '', 'vi')
                          if (categorySortBy === 'NAME_DESC') return (b.name || '').localeCompare(a.name || '', 'vi')
                          return 0
                        })
                        .map((cat) => (
                          <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-3.5 font-extrabold text-black">#{cat.id}</td>
                            <td className="p-3.5">
                              <div className="w-8 h-8 border-2 border-black bg-[#f7f6f2] flex items-center justify-center rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
                                <CategoryIcon icon={cat.icon || cat.iconUrl} name={cat.name} className="w-4 h-4" />
                              </div>
                            </td>
                            <td className="p-3.5 font-extrabold text-black text-sm">{cat.name}</td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
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
                                  type="button"
                                  onClick={() => setDeleteTarget({ type: 'CATEGORY', item: cat })}
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
        key={adminActionModalStore ? `${adminActionModalType}-${adminActionModalStore.id}` : 'admin-store-action-closed'}
        isOpen={!!adminActionModalStore}
        actionType={adminActionModalType}
        store={adminActionModalStore}
        isStaffOrAdmin={true}
        loading={storeActionLoading}
        onClose={() => setAdminActionModalStore(null)}
        onConfirm={handleAdminActionConfirm}
      />

      {accountActionUser && accountActionType && (
        <AccountStatusModal
          key={`${accountActionType}-${accountActionUser.id}`}
          user={accountActionUser}
          actionType={accountActionType}
          onClose={closeAccountActionModal}
          onConfirm={handleAccountActionConfirm}
        />
      )}

      <ConfirmActionModal
        key={deleteTarget ? `${deleteTarget.type}-${deleteTarget.item.id}` : 'delete-closed'}
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'USER' ? 'Xóa tài khoản người dùng' : 'Xóa danh mục'}
        description={deleteTarget?.type === 'USER'
          ? `Toàn bộ tài khoản @${deleteTarget.item.username} và dữ liệu công khai liên quan sẽ bị xóa. Audit xóa tài khoản vẫn được giữ theo chính sách hệ thống.`
          : `Danh mục "${deleteTarget?.item.name || ''}" sẽ bị xóa. Thao tác sẽ thất bại nếu vẫn còn quán đang sử dụng danh mục này.`}
        confirmLabel={deleteTarget?.type === 'USER' ? 'Xóa tài khoản' : 'Xóa danh mục'}
        expectedText={deleteTarget?.type === 'USER' ? deleteTarget.item.username : ''}
        reasonRequired={deleteTarget?.type === 'USER'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={({ confirmation, reason }) => deleteTarget?.type === 'USER'
          ? handleAdminDeleteUser(deleteTarget.item, confirmation, reason)
          : handleDeleteCategory(deleteTarget.item.id)}
      />

      {/* Admin Rejection Modal */}
      {rejectingStore && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Từ Chối Xét Duyệt Quán" className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative border-4 border-black">
            <button
              onClick={() => {
                if (!rejectSubmitting) setRejectingStore(null)
              }}
              disabled={rejectSubmitting}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
              aria-label="Đóng cửa sổ từ chối"
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
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!rejectionReason.trim() || rejectSubmitting) return
                  setRejectSubmitting(true)
                  try {
                    const res = await handleAdminReject(rejectingStore.id, rejectionReason.trim())
                    if (res !== false) {
                      setRejectingStore(null)
                      setViewingStore(null)
                      setRejectionReason('')
                    }
                  } finally {
                    setRejectSubmitting(false)
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Lý do từ chối</label>
                  <textarea
                    required
                    disabled={rejectSubmitting}
                    placeholder="Vui lòng nhập lý do từ chối chi tiết gửi đến chủ quán..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="brutalist-input w-full disabled:opacity-60"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t-2 border-neutral-100">
                  <button
                    type="button"
                    disabled={rejectSubmitting}
                    onClick={() => setRejectingStore(null)}
                    className="brutalist-btn-white text-xs py-1.5 px-4 cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!rejectionReason.trim() || rejectSubmitting}
                    className="brutalist-btn-red text-xs py-1.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {rejectSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Từ Chối'}
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
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              aria-label="Đóng cửa sổ chỉnh sửa tài khoản"
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
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
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
                    className="brutalist-btn-white text-xs py-1.5 px-4 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="brutalist-btn-red text-xs py-1.5 px-4 cursor-pointer"
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
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              aria-label="Đóng cửa sổ chỉnh sửa danh mục"
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
                  handleUpdateCategory(editingCategory.id, {
                    name: editCatName.trim(),
                    icon: editCatIcon
                  })
                  setEditingCategory(null)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên Danh Mục</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <CategoryIconPicker
                    value={editCatIcon}
                    onChange={(iconId) => setEditCatIcon(iconId)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t-2 border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="brutalist-btn-white text-xs py-1.5 px-4 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="brutalist-btn-red text-xs py-1.5 px-4 cursor-pointer"
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

      {/* Admin Store Detail Drawer Modal (2-Column Desktop Experience) */}
      {viewingStore && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" role="dialog" aria-modal="true" aria-label={`Chi tiết quán ${viewingStore.name}`}>
          <div className="absolute inset-0" onClick={() => setViewingStore(null)} />
          <div ref={drawerDialogRef} tabIndex={-1} className="w-full max-w-lg lg:max-w-3xl xl:max-w-4xl bg-white border-l-4 border-black h-full overflow-hidden relative z-10 shadow-2xl flex flex-col justify-between animate-fade-in-up outline-hidden">
            {/* Header Top Bar with Close Button */}
            <div className="p-4 bg-white border-b-3 border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#ff3e3e]" />
                <span className="font-black text-xs uppercase tracking-wider text-black">
                  Chi Tiết Quán Ăn (Hệ Thống Quản Trị)
                </span>
              </div>
              <button
                onClick={() => setViewingStore(null)}
                className="p-2 bg-white border-2 border-black rounded-full hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer z-10"
                title="Đóng cửa sổ chi tiết"
                aria-label="Đóng cửa sổ chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Main Content: Responsive 2-Column Desktop Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-black">
              {/* LEFT COLUMN: Store Header, Banner, Address, Hours, Owner Audit */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Header Image Banner */}
                <div
                  onClick={() =>
                    setPreviewImage({
                      src: viewingStore.bannerImageUrl || STORE_FALLBACK_IMAGE,
                      alt: viewingStore.name,
                      caption: `Ảnh Banner Quán: ${viewingStore.name}`
                    })
                  }
                  className="h-52 w-full relative bg-neutral-200 border-3 border-black rounded-xl overflow-hidden shrink-0 group cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  title="Bấm để xem phóng to ảnh quán ăn"
                >
                  <img
                    src={viewingStore.bannerImageUrl || STORE_FALLBACK_IMAGE}
                    alt={viewingStore.name}
                    className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                  />
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="brutalist-badge bg-black/75 text-white text-[10px] px-2.5 py-1 border border-white flex items-center gap-1 backdrop-blur-xs">
                      <ZoomIn className="w-3.5 h-3.5" /> Bấm để phóng to ảnh
                    </span>
                  </div>
                </div>

                {/* Title & Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="brutalist-badge bg-[#ff3e3e] text-white">
                      {viewingStore.categoryName || 'Quán Ăn'}
                    </span>
                    <div className="flex items-center gap-1 bg-white border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{viewingStore.satisfactionRate || 100}%</span>
                      <span className="text-[9px] text-neutral-500 font-semibold">({viewingStore.totalVotes || 0})</span>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-black leading-snug">{viewingStore.name}</h2>
                </div>

                {/* Details layout list (Address, Phone, Hours, Price Range) */}
                <div className="space-y-4 brutalist-card p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black rounded-xl">
                  {/* Address & Google Maps */}
                  <div className="flex items-start gap-3 text-xs text-black">
                    <MapPin className="w-4 h-4 text-[#ff3e3e] shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-extrabold text-sm uppercase">Địa Chỉ Chi Tiết</p>
                      {getSafeGoogleMapsUrl(viewingStore.mapUrl, viewingStore.latitude, viewingStore.longitude) ? (
                        <a
                          href={getSafeGoogleMapsUrl(viewingStore.mapUrl, viewingStore.latitude, viewingStore.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-neutral-800 hover:text-[#ff3e3e] underline block transition-colors leading-snug"
                          title="Bấm để mở địa chỉ chi tiết trên Google Maps"
                        >
                          {viewingStore.addressLine || 'Địa chỉ chưa cập nhật'} ↗
                        </a>
                      ) : (
                        <p className="font-bold text-neutral-600">{viewingStore.addressLine || 'Địa chỉ chưa cập nhật'}</p>
                      )}
                      {viewingStore.landmarkNote && (
                        <p className="text-[#ff3e3e] italic font-black">“ {viewingStore.landmarkNote} ”</p>
                      )}
                      {getSafeGoogleMapsUrl(viewingStore.mapUrl, viewingStore.latitude, viewingStore.longitude) && (
                        <a
                          href={getSafeGoogleMapsUrl(viewingStore.mapUrl, viewingStore.latitude, viewingStore.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded-lg mt-1 shadow-xs transition-colors cursor-pointer"
                        >
                          Xem địa chỉ chi tiết trên Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                    <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                    <div>
                      <p className="font-extrabold uppercase">Số Điện Thoại</p>
                      <p className="font-bold text-neutral-600">{viewingStore.phoneNumber || 'Không có số liên hệ'}</p>
                    </div>
                  </div>

                  {/* Opening Hours */}
                  <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                    <Clock className="w-4 h-4 text-[#ff3e3e] shrink-0" />
                    <div>
                      <p className="font-extrabold uppercase">Giờ Mở Cửa & Đóng Cửa</p>
                      <p className="font-bold text-neutral-600">
                        {viewingStore.openTime || 'N/A'} - {viewingStore.closeTime || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center gap-3 text-xs text-black border-t-2 border-neutral-100 pt-3">
                    <DollarSign className="w-4 h-4 text-[#ff3e3e] shrink-0" />
                    <div>
                      <p className="font-extrabold uppercase">Khoảng Giá Món Ăn</p>
                      <p className="font-black text-[#ff3e3e]">
                        {viewingStore.priceMin ? `${viewingStore.priceMin.toLocaleString()}đ` : 'N/A'} - {viewingStore.priceMax ? `${viewingStore.priceMax.toLocaleString()}đ` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Audit & Owner Information Section */}
                <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs uppercase font-black text-black tracking-wider border-b border-neutral-300 pb-2">
                    🛡️ Thông Tin Kiểm Duyệt & Chủ Quán
                  </h4>
                  <div className="text-xs space-y-2 font-semibold text-neutral-800">
                    <p className="flex justify-between">
                      <span className="font-extrabold text-neutral-500">Chủ quán / Người đăng:</span>
                      <span className="font-black text-black">@{viewingStore.ownerUsername || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-extrabold text-neutral-500">Email liên hệ:</span>
                      <span className="font-black text-black">{viewingStore.ownerEmail || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between items-center pt-1 border-t border-neutral-200">
                      <span className="font-extrabold text-neutral-500">Trạng thái hiện tại:</span>
                      {viewingStore.status === 'APPROVED' ? (
                        <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] text-[10px]">
                          Đã Duyệt (Công khai)
                        </span>
                      ) : viewingStore.status === 'HIDDEN' ? (
                        <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[10px]">
                          Đang Ẩn
                        </span>
                      ) : viewingStore.status === 'REJECTED' ? (
                        <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] text-[10px]">
                          Bị Từ Chối
                        </span>
                      ) : (
                        <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[10px]">
                          Chờ Duyệt
                        </span>
                      )}
                    </p>

                    {/* Recovery Requested Alert */}
                    {viewingStore.recoveryRequested && (
                      <div className="bg-[#fff9db] border-2 border-[#b45309] p-3 rounded-lg mt-2 space-y-1">
                        <p className="text-[11px] font-black text-[#b45309] uppercase flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" /> Yêu Cầu Khôi Phục:
                        </p>
                        <p className="text-xs font-bold text-neutral-800 italic">
                          “{viewingStore.recoveryRequestReason || 'Không có lý do giải trình.'}”
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Description, Food Menu & Actions */}
              <div className="p-6 space-y-6 overflow-y-auto flex flex-col justify-between bg-neutral-50/50">
                <div className="space-y-6">
                  {/* Store Description */}
                  {viewingStore.description && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Mô Tả Quán Ăn</h3>
                      <p className="text-xs font-semibold text-neutral-800 leading-relaxed bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] whitespace-pre-line">
                        {viewingStore.description}
                      </p>
                    </div>
                  )}

                  {/* Food Items Menu */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-1.5 border-b-2 border-black pb-2">
                      🍽️ Thực Đơn Quán Ăn ({viewingStore.foodItems?.length || 0} Món)
                    </h3>
                    {!viewingStore.foodItems || viewingStore.foodItems.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic font-semibold p-4 bg-white border border-dashed border-neutral-300 rounded-lg text-center">
                        Chưa có món ăn nào được đăng ký trong thực đơn.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {viewingStore.foodItems.map((food) => (
                          <div
                            key={food.id}
                            onClick={() =>
                              setPreviewImage({
                                src: food.imageUrl || FOOD_FALLBACK_IMAGE,
                                alt: food.name,
                                caption: `Món: ${food.name} (${food.price?.toLocaleString()}đ)`
                              })
                            }
                            className="flex gap-4 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group/food"
                            title="Bấm để phóng to ảnh món ăn này"
                          >
                            <div className="relative shrink-0">
                              <img
                                src={food.imageUrl || FOOD_FALLBACK_IMAGE}
                                alt={food.name}
                                className="w-16 h-16 border-2 border-black rounded-lg object-cover group-hover/food:brightness-90 transition-all"
                              />
                              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover/food:opacity-100 transition-opacity pointer-events-none">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                              <div>
                                <p className="text-xs font-black text-black group-hover/food:text-[#ff3e3e] transition-colors">{food.name}</p>
                                <p className="text-[10px] text-neutral-600 truncate mt-0.5">{food.description || 'Không có mô tả món'}</p>
                              </div>
                              <p className="text-xs font-black text-[#ff3e3e]">
                                {food.price?.toLocaleString()}đ
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Admin Action Buttons Box */}
                <div className="pt-4 border-t-2 border-black space-y-2">
                  <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Thao Tác Admin Trực Tiếp:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {viewingStore.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminActionModalStore(viewingStore)
                            setAdminActionModalType('APPROVE')
                          }}
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          Duyệt Quán
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectionReason('')
                            setRejectingStore(viewingStore)
                          }}
                          className="flex-1 py-2 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          Từ Chối
                        </button>
                      </>
                    )}

                    {viewingStore.status === 'HIDDEN' && viewingStore.recoveryRequested && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminActionModalStore(viewingStore)
                            setAdminActionModalType('RECOVER')
                          }}
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          Duyệt Khôi Phục
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminActionModalStore(viewingStore)
                            setAdminActionModalType('REJECT_RECOVERY_REQUEST')
                          }}
                          className="flex-1 py-2 px-3 bg-[#ff3e3e] hover:bg-[#e03535] text-white font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        >
                          Từ Chối KP
                        </button>
                      </>
                    )}

                    {viewingStore.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminActionModalStore(viewingStore)
                          setAdminActionModalType('HIDE')
                        }}
                        className="flex-1 py-2 px-3 bg-[#fab005] hover:bg-[#e69c00] text-black font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <EyeOff className="w-4 h-4" /> Ẩn Quán
                      </button>
                    )}

                    {viewingStore.status === 'HIDDEN' && !viewingStore.recoveryRequested && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminActionModalStore(viewingStore)
                          setAdminActionModalType('RECOVER')
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" /> Hiện Quán
                      </button>
                    )}

                    {/* Dangerous Action: Hard Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        setAdminActionModalStore(viewingStore)
                        setAdminActionModalType('HARD_DELETE')
                      }}
                      className="py-2 px-3 bg-white hover:bg-red-50 text-red-600 font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Xóa Vĩnh Viễn Quán"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa Quán
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <ImageViewerModal
          src={previewImage.src}
          alt={previewImage.alt}
          caption={previewImage.caption}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}
