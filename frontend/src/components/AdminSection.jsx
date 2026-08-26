import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Edit2, Trash2, Shield, X, Users, Utensils, Coffee, IceCream, Compass, Folder, PlusCircle } from 'lucide-react'

export default function AdminSection({
  isUserAdmin,
  switchTab,
  catName,
  setCatName,
  catIcon,
  setCatIcon,
  handleCreateCategory,
  foodStoreId,
  setFoodStoreId,
  stores,
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
  adminPendingStores,
  handleAdminApprove,
  handleAdminReject,
  adminUsersList,
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
  const [activeAdminTab, setActiveAdminTab] = useState('users')
  const [rejectingStore, setRejectingStore] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingStore, setViewingStore] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('fa-bread-slice')
  const [uploadingFood, setUploadingFood] = useState(false)

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

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-[#ff3e3e] text-white border-3 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <Shield className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="brutalist-badge bg-white text-black">Admin Room</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Hệ Thống Quản Trị
          </h2>
          <p className="text-sm font-semibold max-w-xl text-white/90">
            Moderate submitted spots, create food categories, edit registered user accounts, and maintain global tour configurations.
          </p>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-4 border-b-3 border-black pb-2">
        <button
          onClick={() => {
            setActiveAdminTab('users')
            if (loadAdminUsers) loadAdminUsers()
          }}
          className={`px-6 py-2.5 text-xs font-black uppercase transition-all border-3 border-black ${
            activeAdminTab === 'users'
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          Người Dùng
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('requests')
            if (loadAdminPendingStores) loadAdminPendingStores()
          }}
          className={`px-6 py-2.5 text-xs font-black uppercase transition-all border-3 border-black flex items-center gap-2 ${
            activeAdminTab === 'requests'
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          Yêu Cầu Phê Duyệt
          {adminPendingStores.length > 0 && (
            <span className="bg-[#ff3e3e] text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse border border-black">
              {adminPendingStores.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('categories')
            if (loadGlobalData) loadGlobalData()
          }}
          className={`px-6 py-2.5 text-xs font-black uppercase transition-all border-3 border-black ${
            activeAdminTab === 'categories'
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          Danh Mục
        </button>
      </div>

      {activeAdminTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Add Food Item (Admin bypass) */}
            <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
                Thêm Món Ăn Cho Quán (Admin)
              </h3>
              <form onSubmit={handleCreateFoodItem} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Chọn Quán Ăn</label>
                  <select
                    required
                    value={foodStoreId}
                    onChange={(e) => setFoodStoreId(e.target.value)}
                    className="brutalist-input"
                  >
                    <option value="">-- Chọn quán ăn --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên Món Ăn</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bánh Mì Chả Cá"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="brutalist-input"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Giá (VND)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={foodPrice === 0 ? '' : foodPrice / 1000}
                        onChange={(e) => setFoodPrice(e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0)}
                        className="brutalist-input pr-16"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                        .000đ
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Hình Ảnh Món Ăn</label>
                    
                    {/* Image Preview & Upload Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f7f6f2] p-3 border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {foodImage && (
                        <div className="w-16 h-16 border-2 border-black overflow-hidden bg-neutral-200 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <img src={foodImage} alt="Food Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="w-full flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer brutalist-btn-white py-1 px-3 text-xs font-black uppercase text-center flex-1 sm:flex-initial">
                            {uploadingFood ? 'Đang Tải Lên...' : 'Chọn Ảnh Từ Thiết Bị'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingFood}
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {foodImage && (
                            <button
                              type="button"
                              onClick={() => setFoodImage('')}
                              className="brutalist-btn-red py-1 px-3 text-xs font-black uppercase"
                            >
                              Xóa Ảnh
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-neutral-500">Tải lên Cloudinary tự động.</p>
                      </div>
                    </div>

                    {/* Text fallback input */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Hoặc nhập URL hình ảnh trực tiếp:</span>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={foodImage}
                        onChange={(e) => setFoodImage(e.target.value)}
                        className="brutalist-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Mô Tả Món Ăn</label>
                  <textarea
                    placeholder="Mô tả hương vị..."
                    value={foodDesc}
                    onChange={(e) => setFoodDesc(e.target.value)}
                    className="brutalist-input"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full brutalist-btn-white text-xs py-2.5"
                >
                  Thêm Món Ăn
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Registered Accounts list */}
            <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff3e3e]" /> Danh Sách Tài Khoản
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-black border-b-3 border-black">
                      <th className="pb-3 font-black uppercase">Ảnh</th>
                      <th className="pb-3 font-black uppercase">Tài Khoản</th>
                      <th className="pb-3 font-black uppercase">Vai Trò (Roles)</th>
                      <th className="pb-3 font-black uppercase text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-neutral-200">
                    {adminUsersList.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3">
                          <img
                            src={u.avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                            alt="avatar"
                            className="w-8 h-8 border-2 border-black object-cover"
                          />
                        </td>
                        <td className="py-3">
                          <p className="font-extrabold text-black">{u.username}</p>
                          <p className="text-[10px] text-neutral-500 font-semibold">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.roles || []).map((r, idx) => (
                              <span
                                key={idx}
                                className="brutalist-badge bg-[#f7f6f2] text-black border-black shadow-none py-0.5 px-1.5 text-[8px]"
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
                              className="p-1.5 border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdminDeleteUser(u.id)}
                              className="p-1.5 border-2 border-black bg-[#fff5f5] text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'requests' && (
        /* Requests/Yêu Cầu Tab (Full Width / Max width centered) */
        <div className="brutalist-card bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
            Yêu Cầu Đang Chờ Phê Duyệt
          </h3>
          {adminPendingStores.length === 0 ? (
            <p className="text-xs text-neutral-500 font-semibold bg-[#f7f6f2] p-4 border-2 border-dashed border-neutral-300 rounded text-center">
              Không có yêu cầu duyệt quán ăn nào tại thời điểm này.
            </p>
          ) : (
            <div className="space-y-4">
              {adminPendingStores.map((st) => (
                <div
                  key={st.id}
                  className="p-4 bg-[#f7f6f2] border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up"
                >
                  <div className="flex gap-4 items-center flex-1 min-w-0">
                    {/* Thumbnail Image */}
                    <img
                      src={st.bannerImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60'}
                      alt={st.name}
                      className="w-16 h-16 border-2 border-black object-cover shrink-0 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-black truncate">{st.name}</p>
                      <p className="text-xs font-semibold text-neutral-600 truncate">
                        Người gửi: <span className="font-extrabold text-black">{st.ownerUsername || 'N/A'}</span> 
                        {st.ownerLastname || st.ownerFirstname ? ` (${[st.ownerLastname, st.ownerFirstname].filter(Boolean).join(' ')})` : ''}
                      </p>
                      {st.ownerEmail && (
                        <p className="text-xs font-semibold text-neutral-500 truncate">
                          Email: <span className="font-bold text-black">{st.ownerEmail}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-500 font-semibold truncate">Địa chỉ: {st.addressLine}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingStore(st)}
                      className="brutalist-badge bg-white text-black border-black hover:bg-neutral-100 cursor-pointer shadow-none py-1.5 px-3 font-black text-[10px]"
                    >
                      Xem Chi Tiết
                    </button>
                    <button
                      onClick={() => handleAdminApprove(st.id)}
                      className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] hover:bg-emerald-100 cursor-pointer shadow-none py-1.5 px-3 font-black text-[10px]"
                    >
                      Duyệt (Approve)
                    </button>
                    <button
                      onClick={() => {
                        setViewingStore(st)
                        setRejectionReason('')
                        setTimeout(() => {
                          setRejectingStore(st)
                        }, 250)
                      }}
                      className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] hover:bg-red-100 cursor-pointer shadow-none py-1.5 px-3 font-black text-[10px]"
                    >
                      Từ Chối (Reject)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5/12): Add New Category */}
          <div className="lg:col-span-5 space-y-8">
            <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black flex items-center gap-2">
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
                  Tạo Danh Mục
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (7/12): List Categories */}
          <div className="lg:col-span-7 space-y-8">
            <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#ff3e3e]" /> Danh Sách Danh Mục
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
                        <td className="py-3 font-extrabold text-black">#{cat.id}</td>
                        <td className="py-3">
                          <div className="w-8 h-8 border-2 border-black bg-[#f7f6f2] flex items-center justify-center rounded-sm">
                            {getCategoryIcon(cat.icon || cat.iconUrl)}
                          </div>
                        </td>
                        <td className="py-3 font-extrabold text-black text-sm">{cat.name}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(cat)
                                setEditCatName(cat.name)
                                setEditCatIcon(cat.icon || cat.iconUrl || 'fa-bread-slice')
                              }}
                              className="p-1.5 border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 border-2 border-black bg-[#fff5f5] text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
            </div>
          </div>
        </div>
      )}

      {/* Admin Rejection Modal */}
      {rejectingStore && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            <button
              onClick={() => setRejectingStore(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
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

      {/* Admin Store Detail Modal */}
      {viewingStore && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={() => setViewingStore(null)} />

          {/* Drawer content (Right slide) */}
          <div className="w-full max-w-lg bg-white border-l-3 border-black h-full overflow-hidden relative z-10 shadow-2xl flex flex-col justify-between animate-fade-in-up">
            <div className="flex-1 overflow-y-auto">
              {/* Header Image banner */}
              <div className="h-56 w-full relative bg-neutral-200 border-b-3 border-black shrink-0">
                <img
                  src={
                    viewingStore.bannerImageUrl ||
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
                  }
                  alt={viewingStore.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setViewingStore(null)}
                  className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-1 min-w-0">
                    <span className="brutalist-badge bg-[#ff3e3e] text-white">
                      {viewingStore.categoryName || 'Chờ Duyệt'}
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-black truncate">{viewingStore.name}</h2>
                  </div>
                </div>
              </div>

              {/* Main Scrollable Info */}
              <div className="p-6 space-y-6">
                {/* Info Block 1: Sender Info */}
                <div className="space-y-3 bg-[#f7f6f2] p-4 border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Thông Tin Người Đăng</h4>
                  <div className="text-xs space-y-1.5 font-semibold text-neutral-700">
                    <p>
                      <span className="font-extrabold text-black">Username:</span> {viewingStore.ownerUsername || 'N/A'}
                    </p>
                    <p>
                      <span className="font-extrabold text-black">Họ và tên:</span> {[viewingStore.ownerLastname, viewingStore.ownerFirstname].filter(Boolean).join(' ') || 'Chưa cập nhật'}
                    </p>
                    <p>
                      <span className="font-extrabold text-black">Email:</span> {viewingStore.ownerEmail || 'N/A'}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      <span className="font-extrabold text-neutral-500">ID:</span> {viewingStore.ownerId || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Info Block 2: Store details list */}
                <div className="space-y-4 brutalist-card p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Thông Tin Quán Ăn</h4>

                  <div className="text-xs space-y-3 font-semibold text-neutral-700">
                    <div>
                      <p className="font-extrabold text-black uppercase tracking-wider text-[10px] mb-0.5">Địa Chỉ Chi Tiết</p>
                      <p>{viewingStore.addressLine}</p>
                      {viewingStore.landmarkNote && (
                        <p className="text-[#ff3e3e] italic font-black">“ {viewingStore.landmarkNote} ”</p>
                      )}
                      {viewingStore.latitude && viewingStore.longitude && (
                        <p className="text-[10px] text-neutral-500">Tọa độ GPS: {viewingStore.latitude}, {viewingStore.longitude}</p>
                      )}
                    </div>

                    <div className="border-t border-neutral-200 pt-2">
                      <p className="font-extrabold text-black uppercase tracking-wider text-[10px] mb-0.5">Số Điện Thoại</p>
                      <p>{viewingStore.phoneNumber || 'Không có số liên hệ'}</p>
                    </div>

                    <div className="border-t border-neutral-200 pt-2">
                      <p className="font-extrabold text-black uppercase tracking-wider text-[10px] mb-0.5">Thời Gian Mở Cửa</p>
                      <p>{viewingStore.openTime} - {viewingStore.closeTime}</p>
                    </div>

                    <div className="border-t border-neutral-200 pt-2">
                      <p className="font-extrabold text-black uppercase tracking-wider text-[10px] mb-0.5">Khoảng Giá</p>
                      <p className="font-black text-[#ff3e3e]">
                        {viewingStore.priceMin?.toLocaleString()}đ - {viewingStore.priceMax?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Block 3: Dishes Menu */}
                <div className="space-y-4 pt-6 border-t-3 border-black">
                  <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Thực Đơn Đã Đăng ({viewingStore.foodItems?.length || 0})</h4>
                  {!viewingStore.foodItems || viewingStore.foodItems.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Chưa có món ăn nào được đăng kèm.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewingStore.foodItems.map((food) => (
                        <div key={food.id} className="flex gap-4 p-3 bg-white border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <img
                            src={food.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'}
                            alt={food.name}
                            className="w-16 h-16 border-2 border-black object-cover rounded shrink-0"
                          />
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-black text-black truncate">{food.name}</p>
                              <p className="text-[10px] text-neutral-500 truncate mt-0.5">{food.description}</p>
                            </div>
                            <p className="text-xs font-black text-[#ff3e3e]">{food.price?.toLocaleString()}đ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Moderation Actions Footer Toolbar */}
            <div className="p-4 bg-white border-t-3 border-black sticky bottom-0 flex gap-2 shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => {
                  setRejectingStore(viewingStore)
                  setRejectionReason('')
                }}
                className="flex-1 brutalist-btn-red text-xs py-2"
              >
                Từ Chối
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleAdminApprove(viewingStore.id)
                  setViewingStore(null)
                }}
                className="flex-1 py-2 bg-[#e6fcf5] text-[#0ca678] border-3 border-black font-black text-xs hover:bg-emerald-100 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-center"
              >
                Phê Duyệt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Edit User Modal */}
      {editingUser && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
                Chỉnh Sửa Thành Viên (Admin Access)
              </h3>

              <form onSubmit={handleAdminUserEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Username</label>
                  <input
                    type="text"
                    required
                    value={adminUserUsername}
                    onChange={(e) => setAdminUserUsername(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Họ</label>
                    <input
                      type="text"
                      value={adminUserFirst}
                      onChange={(e) => setAdminUserFirst(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold block text-neutral-700">Tên</label>
                    <input
                      type="text"
                      value={adminUserLast}
                      onChange={(e) => setAdminUserLast(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Ngày Sinh</label>
                  <input
                    type="date"
                    value={adminUserDob}
                    onChange={(e) => setAdminUserDob(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Phân Quyền (Roles)</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={adminUserRoles.USER}
                        onChange={(e) => setAdminUserRoles({ ...adminUserRoles, USER: e.target.checked })}
                        className="w-4 h-4 border-2 border-black rounded text-[#ff3e3e] focus:ring-0"
                      />
                      USER
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={adminUserRoles.ADMIN}
                        onChange={(e) => setAdminUserRoles({ ...adminUserRoles, ADMIN: e.target.checked })}
                        className="w-4 h-4 border-2 border-black rounded text-[#ff3e3e] focus:ring-0"
                      />
                      ADMIN
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
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Category Edit Modal */}
      {editingCategory && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="w-full max-w-md brutalist-card bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-fade-in-up">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
                Chỉnh Sửa Danh Mục
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!editCatName.trim()) return
                  const success = await handleUpdateCategory(editingCategory.id, editCatName.trim(), editCatIcon)
                  if (success) {
                    setEditingCategory(null)
                  }
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
                    className="brutalist-input w-full font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Icon Hiển Thị</label>
                  <select
                    value={editCatIcon}
                    onChange={(e) => setEditCatIcon(e.target.value)}
                    className="brutalist-input w-full font-bold"
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
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
