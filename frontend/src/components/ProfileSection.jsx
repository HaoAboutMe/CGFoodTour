import React from 'react'
import { Camera, Shield, User } from 'lucide-react'

export default function ProfileSection({
  avatarPreview,
  avatarFile,
  onAvatarFileChange,
  handleUploadAvatar,
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
    <div className="space-y-12 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-[#ff3e3e] text-white border-3 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <User className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="brutalist-badge bg-white text-black">Member Settings</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Quản Lý Cá Nhân
          </h2>
          <p className="text-sm font-semibold max-w-xl text-white/90">
            Keep your profile details fresh, upload a custom avatar, and update your credentials securely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card left */}
        <div className="lg:col-span-7 brutalist-card p-6 space-y-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-3 border-black pb-3">
            <h3 className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
              <User className="w-5 h-5 text-[#ff3e3e]" /> Profile Details
            </h3>
          </div>

          {/* Avatar Upload Container */}
          <form onSubmit={handleUploadAvatar} className="flex flex-col md:flex-row items-center gap-6 bg-[#f7f6f2] p-6 border-3 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="relative group shrink-0">
              <img
                src={avatarPreview || 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample.jpg'}
                alt="avatar preview"
                className="w-24 h-24 rounded-none border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] object-cover"
              />
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-black">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={onAvatarFileChange} className="hidden" />
              </label>
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <p className="font-extrabold text-sm">{avatarFile ? avatarFile.name : 'Select a picture file'}</p>
                <p className="text-[11px] text-neutral-500 font-medium">JPEG, PNG, WEBP. Max size 2MB.</p>
              </div>
              {avatarFile && (
                <button
                  type="submit"
                  className="brutalist-btn-red py-1.5 px-4 text-xs font-black"
                >
                  Upload New Avatar
                </button>
              )}
            </div>
          </form>

          {/* Update Info form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold tracking-wider block">Username</label>
              <input
                type="text"
                required
                value={upUsername}
                onChange={(e) => setUpUsername(e.target.value)}
                className="brutalist-input"
                placeholder="e.g. foodlover123"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">First Name</label>
                <input
                  type="text"
                  value={upFirstname}
                  onChange={(e) => setUpFirstname(e.target.value)}
                  className="brutalist-input"
                  placeholder="e.g. David"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Last Name</label>
                <input
                  type="text"
                  value={upLastname}
                  onChange={(e) => setUpLastname(e.target.value)}
                  className="brutalist-input"
                  placeholder="e.g. Smith"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold tracking-wider block">Date of Birth</label>
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
              className="w-full brutalist-btn-red text-sm"
            >
              Update Account Details
            </button>
          </form>
        </div>

        {/* Change Password Card right */}
        <div className="lg:col-span-5 brutalist-card p-6 space-y-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-3 border-black pb-3">
            <h3 className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#ff3e3e]" /> Credentials
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold tracking-wider block">Old Password</label>
              <input
                type="password"
                required
                value={pwdOld}
                onChange={(e) => setPwdOld(e.target.value)}
                className="brutalist-input"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold tracking-wider block">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                className="brutalist-input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full brutalist-btn-white text-sm"
            >
              Change Account Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
