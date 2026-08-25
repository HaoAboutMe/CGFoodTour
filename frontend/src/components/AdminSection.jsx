import React from 'react'
import { Edit2, Trash2, Shield, X, Users, MessageSquare } from 'lucide-react'

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
  handleAdminUserEditSubmit
}) {
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5/12) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Category Creator */}
          <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 text-black">
              Thêm Danh Mục Mới
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Giá (VND)</label>
                  <input
                    type="number"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(parseInt(e.target.value) || 0)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold block text-neutral-700">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={foodImage}
                    onChange={(e) => setFoodImage(e.target.value)}
                    className="brutalist-input"
                  />
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
          {/* Submissions Pending list */}
          <div className="brutalist-card bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
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
                    className="p-4 bg-[#f7f6f2] border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm text-black">{st.name}</p>
                      <p className="text-xs font-semibold text-neutral-600">Người gửi: {st.ownerUsername || 'N/A'}</p>
                      <p className="text-[10px] text-neutral-500 font-semibold">Địa chỉ: {st.addressLine}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAdminApprove(st.id)}
                        className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] hover:bg-emerald-100 cursor-pointer shadow-none py-1.5 px-3 font-black text-[10px]"
                      >
                        Duyệt (Approve)
                      </button>
                      <button
                        onClick={() => handleAdminReject(st.id)}
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

      {/* Admin Edit User Modal */}
      {editingUser && (
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
        </div>
      )}
    </div>
  )
}
