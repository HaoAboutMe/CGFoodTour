import React, { useState } from 'react'
import { Camera, Shield, User, Eye, EyeOff } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="p-6 brutalist-card space-y-4">
          <div className="h-6 w-48 brutalist-skeleton" />
          <div className="h-4 w-32 brutalist-skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 brutalist-card space-y-4">
            <div className="h-24 w-24 rounded-full brutalist-skeleton mx-auto" />
            <div className="h-10 w-full brutalist-skeleton" />
            <div className="h-10 w-full brutalist-skeleton" />
            <div className="h-10 w-full brutalist-skeleton" />
          </div>
          <div className="p-6 brutalist-card space-y-4">
            <div className="h-10 w-full brutalist-skeleton" />
            <div className="h-10 w-full brutalist-skeleton" />
            <div className="h-12 w-full brutalist-skeleton" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-[#ff3e3e] text-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none select-none text-white">
          <User className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3 py-1">
            Cấu Hình Tài Khoản
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            Quản Lý Cá Nhân
          </h2>
          <p className="text-sm font-extrabold max-w-xl text-white/95 leading-relaxed">
            Cập nhật thông tin cá nhân, tải lên ảnh đại diện và đổi mật khẩu tài khoản của bạn một cách an toàn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card left */}
        <div className="lg:col-span-7 brutalist-card p-6 space-y-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-2 border-black pb-3">
            <h3 className="text-xl font-black uppercase tracking-wide flex items-center gap-2 text-black">
              <User className="w-5 h-5 text-[#ff3e3e]" /> Thông Tin Cá Nhân
            </h3>
          </div>

          {/* Avatar Upload Container */}
          <form onSubmit={handleUploadAvatar} className="flex flex-col md:flex-row items-center gap-6 bg-[#f7f6f2] p-6 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="relative group shrink-0">
              <img
                src={avatarPreview || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                alt="avatar preview"
                className="w-24 h-24 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] object-cover"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-20">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!uploadingAvatar && (
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-black rounded-lg">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={onAvatarFileChange} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <p className="font-extrabold text-sm text-black">{avatarFile ? avatarFile.name : 'Chọn tập tin hình ảnh đại diện'}</p>
                <p className="text-[11px] text-neutral-500 font-medium">Định dạng JPEG, PNG, WEBP. Tối đa 2MB.</p>
              </div>
              {avatarFile && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <button
                    type="submit"
                    disabled={uploadingAvatar}
                    className="brutalist-btn-red py-1.5 px-4 text-xs font-black flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingAvatar ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang Tải...
                      </>
                    ) : (
                      'Tải Ảnh Đại Diện Mới ↗'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={handleCancelAvatarSelection}
                    className="brutalist-btn-white py-1.5 px-4 text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy Chọn
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Update Info form */}
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Email Field (Read-Only) */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider text-black flex items-center justify-between">
                <span>Địa Chỉ Email Đăng Ký</span>
                <span className="text-[10px] text-neutral-500 font-bold lowercase">🔒 không thể thay đổi</span>
              </label>
              <input
                type="email"
                readOnly
                disabled
                value={currentUser?.email || ''}
                className="brutalist-input bg-[#f7f6f2] text-neutral-600 font-bold cursor-not-allowed select-all border-neutral-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Username</label>
              <input
                type="text"
                required
                maxLength={20}
                value={upUsername}
                onChange={(e) => setUpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="brutalist-input"
                placeholder="foodlover"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Họ</label>
                <input
                  type="text"
                  maxLength={30}
                  value={upFirstname}
                  onChange={(e) => setUpFirstname(e.target.value)}
                  className="brutalist-input"
                  placeholder="Nguyễn"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Tên</label>
                <input
                  type="text"
                  maxLength={30}
                  value={upLastname}
                  onChange={(e) => setUpLastname(e.target.value)}
                  className="brutalist-input"
                  placeholder="Văn A"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Ngày Sinh</label>
              <input
                type="date"
                required
                value={upDob}
                onChange={(e) => setUpDob(e.target.value)}
                className="brutalist-input"
              />
            </div>
            <button
              type="submit"
              className="w-full brutalist-btn-red py-3 text-sm font-black mt-2"
            >
              Lưu Thay Đổi Thông Tin ↗
            </button>
          </form>
        </div>

        {/* Change Password Card right */}
        <div className="lg:col-span-5 brutalist-card p-6 space-y-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-2 border-black pb-3">
            <h3 className="text-xl font-black uppercase tracking-wide flex items-center gap-2 text-black">
              <Shield className="w-5 h-5 text-[#ff3e3e]" /> Đổi Mật Khẩu
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Mật Khẩu Hiện Tại</label>
              <div className="relative">
                <input
                  type={showPwdOld ? 'text' : 'password'}
                  required
                  value={pwdOld}
                  onChange={(e) => setPwdOld(e.target.value)}
                  className="brutalist-input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwdOld(!showPwdOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                >
                  {showPwdOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider block text-black">Mật Khẩu Mới (Tối thiểu 6 ký tự)</label>
              <div className="relative">
                <input
                  type={showPwdNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="brutalist-input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwdNew(!showPwdNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                >
                  {showPwdNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!pwdOld || !pwdNew || pwdNew.length < 6}
              className="w-full brutalist-btn-red py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              Cập Nhật Mật Khẩu Mới ↗
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
