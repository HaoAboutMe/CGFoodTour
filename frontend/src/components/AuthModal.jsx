import React from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  handleLogin,
  handleFacebookSDKLogin,
  socialGoogleToken,
  setSocialGoogleToken,
  handleGoogleLoginSubmit,
  socialFacebookToken,
  setSocialFacebookToken,
  handleFacebookLoginSubmit,
  regUsername,
  setRegUsername,
  regEmail,
  setRegEmail,
  regFirstname,
  setRegFirstname,
  regLastname,
  setRegLastname,
  regPassword,
  setRegPassword,
  regDob,
  setRegDob,
  handleRegister,
  forgotEmail,
  setForgotEmail,
  handleForgotPassword,
  resetEmail,
  setResetEmail,
  resetOtp,
  setResetOtp,
  resetPassword,
  setResetPassword,
  handleResetPassword,
  verifyTokenVal,
  setVerifyTokenVal,
  handleVerifyEmail,
  resendEmail,
  setResendEmail,
  handleResendVerification
}) {
  if (!showAuthModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md brutalist-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-neutral-100 text-black transition-colors cursor-pointer z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 border-b-3 border-black pb-3">
            <span className="brutalist-badge bg-[#ff3e3e] text-white">Security Gateway</span>
            <h3 className="text-2xl font-black uppercase text-black mt-2">
              {authMode === 'login' && 'Đăng Nhập'}
              {authMode === 'register' && 'Tạo Tài Khoản'}
              {authMode === 'verify' && 'Xác Thực Email'}
              {authMode === 'forgot' && 'Quên Mật Khẩu'}
              {authMode === 'reset' && 'Đặt Lại Mật Khẩu'}
            </h3>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Email</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Mật Khẩu</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] uppercase font-black text-[#ff3e3e] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="brutalist-input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full brutalist-btn-red py-3 text-sm font-black"
                >
                  Xác Thực Tài Khoản ↗
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-0.5 bg-black flex-1" />
                <span className="text-[10px] uppercase font-black text-black tracking-wider shrink-0">Hoặc Đăng Nhập Bằng</span>
                <div className="h-0.5 bg-black flex-1" />
              </div>

              {/* Social Buttons */}
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div id="googleSignInBtn" className="w-full flex justify-center min-h-[40px] border-2 border-black"></div>
                </div>

                <button
                  type="button"
                  onClick={handleFacebookSDKLogin}
                  className="w-full brutalist-btn-white py-2.5 text-xs font-black flex items-center justify-center gap-2 bg-[#1877f2] hover:bg-[#166fe5] text-white"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Đăng Nhập Với Facebook
                </button>

                {/* Manual Paste Tokens Details */}
                <details className="text-[10px] text-neutral-600 font-extrabold cursor-pointer">
                  <summary className="hover:text-black">Hoặc nhập OAuth Tokens thủ công (Dev mode)</summary>
                  <div className="mt-3 space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-black">Google ID Token JWT</label>
                      <textarea
                        value={socialGoogleToken}
                        onChange={(e) => setSocialGoogleToken(e.target.value)}
                        placeholder="eyJhbGciOiJSUzI1Ni..."
                        rows={2}
                        className="w-full bg-white border-2 border-black rounded p-2 text-[10px] focus:outline-none"
                      />
                      <button
                        onClick={handleGoogleLoginSubmit}
                        className="w-full brutalist-btn-red py-1 px-3 text-[9px] font-black"
                      >
                        Gửi Google Token
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-black">Facebook Access Token</label>
                      <textarea
                        value={socialFacebookToken}
                        onChange={(e) => setSocialFacebookToken(e.target.value)}
                        placeholder="EAACW..."
                        rows={2}
                        className="w-full bg-white border-2 border-black rounded p-2 text-[10px] focus:outline-none"
                      />
                      <button
                        onClick={handleFacebookLoginSubmit}
                        className="w-full brutalist-btn-red py-1 px-3 text-[9px] font-black"
                      >
                        Gửi Facebook Token
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              <p className="text-center text-xs font-bold text-neutral-600">
                Thành viên mới?{' '}
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-[#ff3e3e] font-black hover:underline"
                >
                  Đăng Ký Tài Khoản
                </button>
              </p>
            </div>
          )}

          {/* Registration Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="foodlover"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Họ</label>
                  <input
                    type="text"
                    placeholder="Alex"
                    value={regFirstname}
                    onChange={(e) => setRegFirstname(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Tên</label>
                  <input
                    type="text"
                    placeholder="Smith"
                    value={regLastname}
                    onChange={(e) => setRegLastname(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Mật Khẩu</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Ngày Sinh</label>
                  <input
                    type="date"
                    required
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full brutalist-btn-red py-3 text-sm font-black"
              >
                Hoàn Tất Đăng Ký ↗
              </button>

              <p className="text-center text-xs font-bold text-neutral-600">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-[#ff3e3e] font-black hover:underline"
                >
                  Đăng Nhập Tại Đây
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                Nhập email đã đăng ký của bạn. Hệ thống sẽ gửi một mã OTP gồm 6 chữ số để xác thực yêu cầu đặt lại mật khẩu.
              </p>
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="brutalist-input"
                />
              </div>
              <button
                type="submit"
                className="w-full brutalist-btn-red py-3 text-sm font-black"
              >
                Gửi OTP Đặt Lại Mật Khẩu
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-black uppercase text-neutral-600 hover:text-black"
              >
                Quay Lại Đăng Nhập
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="brutalist-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Mã OTP (6 số)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Mật Khẩu Mới</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full brutalist-btn-red py-3 text-sm font-black"
              >
                Đổi Mật Khẩu
              </button>
            </form>
          )}

          {/* Verify Email token Form */}
          {authMode === 'verify' && (
            <div className="space-y-6">
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                  Nhập mã UUID kích hoạt tài khoản được gửi trong email hoặc ghi trong terminal log bên dưới.
                </p>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Token Kích Hoạt (UUID)</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste UUID token from logs"
                    value={verifyTokenVal}
                    onChange={(e) => setVerifyTokenVal(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full brutalist-btn-red py-3 text-sm font-black"
                >
                  Xác Nhận Kích Hoạt Token
                </button>
              </form>

              {/* Resend Link form container */}
              <details className="text-[10px] text-neutral-600 font-extrabold cursor-pointer">
                <summary className="hover:text-black">Bạn cần gửi lại liên kết kích hoạt?</summary>
                <div className="mt-3 space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-black">Địa Chỉ Email</label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="brutalist-input py-2"
                    />
                  </div>
                  <button
                    onClick={handleResendVerification}
                    className="w-full brutalist-btn-red py-1.5 px-3 text-[9px] font-black"
                  >
                    Gửi Lại Kích Hoạt
                  </button>
                </div>
              </details>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-black uppercase text-neutral-600 hover:text-black"
              >
                Quay Lại Đăng Nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
