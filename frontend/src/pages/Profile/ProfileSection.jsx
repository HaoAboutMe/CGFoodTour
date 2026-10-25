import React, { useState } from 'react'
import { Camera, User, Eye, EyeOff, CheckCircle2, Calendar, Mail, KeyRound } from 'lucide-react'
import { AVATAR_FALLBACK_IMAGE } from '@/utils/imageAssets'

export default function ProfileSection({
  currentUser,
  avatarPreview,
  avatarFile,
  onAvatarFileChange,
  handleUploadAvatar,
  handleCancelAvatarSelection,
  uploadingAvatar,
  upUsername,
  setUpUsername,
  upFirstname,
  setUpFirstname,
  upLastname,
  setUpLastname,
  upDob,
  setUpDob,
  handleUpdateProfile,
  pwdOld,
  setPwdOld,
  pwdNew,
  setPwdNew,
  handleChangePassword,
  loading
}) {
  const [showPwdOld, setShowPwdOld] = useState(false)
  const [showPwdNew, setShowPwdNew] = useState(false)

  const isUserAdmin = currentUser?.roles?.includes('ADMIN')

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up pb-16">
        <div className="p-8 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-4">
          <div className="h-8 w-64 bg-neutral-200 border-2 border-black rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 p-6 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-4">
            <div className="h-24 w-24 rounded-full bg-neutral-200 border-2 border-black mx-auto animate-pulse" />
            <div className="h-10 w-full bg-neutral-200 border-2 border-black rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-neutral-200 border-2 border-black rounded-xl animate-pulse" />
          </div>
          <div className="lg:col-span-5 p-6 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-4">
            <div className="h-10 w-full bg-neutral-200 border-2 border-black rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-neutral-200 border-2 border-black rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER */}
      {/* ========================================================================= */}
      <section
        className="bg-[#c92a2a] text-white border-4 border-black p-6 sm:p-8 lg:p-10 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
        aria-label="Thông tin tài khoản"
      >
        <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none select-none text-white hidden sm:block">
          <User className="w-56 h-56" />
        </div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3 py-1 shadow-[2px_2px_0px_0px_#111]">
              👤 Cấu Hình Tài Khoản
            </span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#111] ${
              isUserAdmin ? 'bg-black text-white' : 'bg-emerald-300 text-black'
            }`}>
              {isUserAdmin ? 'Quản Trị Viên' : 'Thành Viên Ẩm Thực'}
            </span>
            {currentUser?.emailVerified && (
              <span className="text-[10px] font-black px-2 py-0.5 bg-white text-emerald-800 border-2 border-black rounded-full flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_#111]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã xác thực email</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-tight">
            Quản Lý Cá Nhân
          </h1>
          <p className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed">
            Cập nhật thông tin cá nhân, thay đổi ảnh đại diện và quản lý mật khẩu bảo vệ tài khoản của bạn.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN RESPONSIVE LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Profile Info & Avatar Upload (7 cols) */}
        {/* ======================================================================= */}
        <section
          className="lg:col-span-7 brutalist-card p-6 sm:p-8 space-y-7 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          aria-labelledby="profile-info-heading"
        >
          <div className="border-b-3 border-black pb-3 flex items-center justify-between gap-2">
            <h2
              id="profile-info-heading"
              className="text-lg sm:text-xl font-black uppercase tracking-wide flex items-center gap-2.5 text-black"
            >
              <User className="w-5 h-5 text-[#c92a2a]" />
              <span>Thông Tin Cá Nhân</span>
            </h2>
          </div>

          {/* Avatar Upload Container */}
          <form
            onSubmit={handleUploadAvatar}
            className="flex flex-col sm:flex-row items-center gap-5 bg-[#f7f6f2] p-5 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            aria-label="Tải lên ảnh đại diện"
          >
            <div className="relative group shrink-0">
              <img
                src={avatarPreview || currentUser?.avatarUrl || AVATAR_FALLBACK_IMAGE}
                alt="Ảnh đại diện của bạn"
                className="w-24 h-24 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] object-cover bg-white"
              />
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-20">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <label
                  htmlFor="profile-avatar-input"
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-black rounded-2xl"
                  title="Thay đổi ảnh đại diện"
                  aria-label="Chọn tập tin ảnh đại diện"
                >
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    id="profile-avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={onAvatarFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
              <div>
                <p className="font-black text-sm text-black truncate">
                  {avatarFile ? avatarFile.name : 'Ảnh đại diện hiện tại'}
                </p>
                <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                  Định dạng JPEG, PNG, WEBP. Dung lượng tối đa 2MB.
                </p>
              </div>

              {avatarFile && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={uploadingAvatar}
                    className="brutalist-btn-red py-2 px-4 text-xs font-black flex items-center gap-1.5 rounded-xl shadow-[2px_2px_0px_0px_#111] disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang Tải...</span>
                      </>
                    ) : (
                      <span>Lưu Ảnh Mới ↗</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={handleCancelAvatarSelection}
                    className="brutalist-btn-white py-2 px-4 text-xs font-black rounded-xl shadow-[2px_2px_0px_0px_#111] disabled:opacity-50 cursor-pointer"
                  >
                    Hủy Chọn
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Update Info Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-5" noValidate>
            {/* Email Field (Read-Only) */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-email-readonly"
                className="text-xs uppercase font-extrabold tracking-wider text-black flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Địa Chỉ Email Đăng Ký</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-bold lowercase">không thể thay đổi</span>
              </label>
              <input
                id="profile-email-readonly"
                type="email"
                readOnly
                disabled
                value={currentUser?.email || ''}
                className="brutalist-input bg-neutral-100 text-neutral-700 font-bold cursor-not-allowed select-all border-2 border-neutral-400 rounded-xl py-2.5"
                aria-describedby="profile-email-hint"
              />
              <span id="profile-email-hint" className="sr-only">Địa chỉ email liên kết với tài khoản không thể chỉnh sửa</span>
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="profile-username" className="text-xs uppercase font-extrabold tracking-wider block text-black">
                Username <span className="text-[#c92a2a]">*</span>
              </label>
              <input
                id="profile-username"
                type="text"
                required
                maxLength={20}
                value={upUsername}
                onChange={(e) => setUpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="brutalist-input border-2 border-black rounded-xl py-2.5 font-bold"
                placeholder="foodlover"
                aria-required="true"
              />
              <p className="text-[10px] text-neutral-500 font-semibold">
                Chỉ sử dụng chữ thường không dấu, số và dấu gạch dưới (tối đa 20 ký tự).
              </p>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-firstname" className="text-xs uppercase font-extrabold tracking-wider block text-black">
                  Họ
                </label>
                <input
                  id="profile-firstname"
                  type="text"
                  maxLength={30}
                  value={upFirstname}
                  onChange={(e) => setUpFirstname(e.target.value)}
                  className="brutalist-input border-2 border-black rounded-xl py-2.5 font-bold"
                  placeholder="Nguyễn"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="profile-lastname" className="text-xs uppercase font-extrabold tracking-wider block text-black">
                  Tên
                </label>
                <input
                  id="profile-lastname"
                  type="text"
                  maxLength={30}
                  value={upLastname}
                  onChange={(e) => setUpLastname(e.target.value)}
                  className="brutalist-input border-2 border-black rounded-xl py-2.5 font-bold"
                  placeholder="Văn A"
                />
              </div>
            </div>

            {/* Date of Birth Field */}
            <div className="space-y-1.5">
              <label htmlFor="profile-dob" className="text-xs uppercase font-extrabold tracking-wider text-black flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Ngày Sinh <span className="text-[#c92a2a]">*</span></span>
              </label>
              <input
                id="profile-dob"
                type="date"
                required
                value={upDob}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                onChange={(e) => setUpDob(e.target.value)}
                className="brutalist-input border-2 border-black rounded-xl py-2.5 font-bold"
                aria-required="true"
              />
              <p className="text-[10px] text-neutral-500 font-semibold">
                Yêu cầu độ tuổi từ 18 tuổi trở lên theo điều khoản dịch vụ.
              </p>
            </div>

            <button
              type="submit"
              className="w-full brutalist-btn-red py-3 px-6 text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#111] uppercase tracking-wide cursor-pointer mt-3"
            >
              Lưu Thay Đổi Thông Tin ↗
            </button>
          </form>
        </section>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Change Password Form (5 cols) */}
        {/* ======================================================================= */}
        <section
          className="lg:col-span-5 brutalist-card p-6 sm:p-8 space-y-6 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          aria-labelledby="profile-security-heading"
        >
          <div className="border-b-3 border-black pb-3">
            <h2
              id="profile-security-heading"
              className="text-lg sm:text-xl font-black uppercase tracking-wide flex items-center gap-2.5 text-black"
            >
              <KeyRound className="w-5 h-5 text-[#c92a2a]" />
              <span>Đổi Mật Khẩu</span>
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5" noValidate>
            {/* Current Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="profile-pwd-old" className="text-xs uppercase font-extrabold tracking-wider block text-black">
                Mật Khẩu Hiện Tại <span className="text-[#c92a2a]">*</span>
              </label>
              <div className="relative">
                <input
                  id="profile-pwd-old"
                  type={showPwdOld ? 'text' : 'password'}
                  required
                  value={pwdOld}
                  onChange={(e) => setPwdOld(e.target.value)}
                  className="brutalist-input pr-10 border-2 border-black rounded-xl py-2.5 font-bold"
                  placeholder="••••••••"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPwdOld(!showPwdOld)}
                  aria-label={showPwdOld ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black p-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] rounded"
                >
                  {showPwdOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="profile-pwd-new" className="text-xs uppercase font-extrabold tracking-wider block text-black">
                Mật Khẩu Mới <span className="text-[#c92a2a]">*</span>
              </label>
              <div className="relative">
                <input
                  id="profile-pwd-new"
                  type={showPwdNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={72}
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="brutalist-input pr-10 border-2 border-black rounded-xl py-2.5 font-bold"
                  placeholder="••••••••"
                  aria-required="true"
                  aria-describedby="profile-pwd-new-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPwdNew(!showPwdNew)}
                  aria-label={showPwdNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black p-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] rounded"
                >
                  {showPwdNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p id="profile-pwd-new-hint" className="text-[10px] text-neutral-500 font-semibold">
                Độ dài mật khẩu yêu cầu từ 8 đến 72 ký tự.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !pwdOld || !pwdNew || pwdNew.length < 8 || pwdNew.length > 72}
              className="w-full brutalist-btn-red py-3 px-6 text-xs sm:text-sm font-black rounded-xl shadow-[3px_3px_0px_0px_#111] uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới ↗'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
