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
  forgotStep,
  setForgotStep,
  resetConfirmPassword,
  setResetConfirmPassword,
  handleVerifyOtp,
  verifyTokenVal,
  setVerifyTokenVal,
  handleVerifyEmail,
  resendEmail,
  setResendEmail,
  handleResendVerification
}) {
  if (!showAuthModal) return null

  // Handle OTP digit changes
  const handleOtpDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue === '' && value !== '') return

    const otpArray = resetOtp.split('')
    while (otpArray.length < 6) otpArray.push('')
    otpArray[index] = cleanValue.slice(-1)
    const newOtp = otpArray.join('')
    setResetOtp(newOtp)

    if (cleanValue && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  // Handle backspace key press
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const otpArray = resetOtp.split('')
      while (otpArray.length < 6) otpArray.push('')
      
      if (otpArray[index] === '' && index > 0) {
        otpArray[index - 1] = ''
        setResetOtp(otpArray.join(''))
        const prevInput = document.getElementById(`otp-input-${index - 1}`)
        if (prevInput) {
          prevInput.focus()
        }
      } else {
        otpArray[index] = ''
        setResetOtp(otpArray.join(''))
      }
    }
  }

  // Handle paste events (e.g. paste 6-digit code)
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6)
    setResetOtp(digitsOnly)
    
    const focusIndex = Math.min(digitsOnly.length, 5)
    const targetInput = document.getElementById(`otp-input-${focusIndex}`)
    if (targetInput) targetInput.focus()
  }

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
              {authMode === 'forgot' && (forgotStep === 1 ? 'Quên Mật Khẩu' : forgotStep === 2 ? 'Xác thực OTP' : 'Đặt lại mật khẩu')}
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

          {/* Forgot Password Flow */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              {/* Step Progress Bar */}
              <div className="flex items-center justify-between pb-6 mb-4 border-b-2 border-black">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 border-black ${forgotStep >= 1 ? 'bg-[#ff3e3e] text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}>1</div>
                  <span className="text-[10px] uppercase font-black tracking-wider hidden sm:inline">Email</span>
                </div>
                <div className="h-0.5 bg-black flex-grow mx-2" />
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 border-black ${forgotStep >= 2 ? 'bg-[#ff3e3e] text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}>2</div>
                  <span className="text-[10px] uppercase font-black tracking-wider hidden sm:inline">OTP</span>
                </div>
                <div className="h-0.5 bg-black flex-grow mx-2" />
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 border-black ${forgotStep >= 3 ? 'bg-[#ff3e3e] text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}>3</div>
                  <span className="text-[10px] uppercase font-black tracking-wider hidden sm:inline">Mật khẩu</span>
                </div>
              </div>

              {/* Step 1: Input Email */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in-up">
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
                    Gửi OTP Đặt Lại Mật Khẩu ↗
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-center text-xs font-black uppercase text-neutral-600 hover:text-black mt-2"
                  >
                    Quay Lại Đăng Nhập
                  </button>
                </form>
              )}

              {/* Step 2: Input OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in-up">
                  <div className="bg-[#f7f6f2] p-3 border-2 border-black text-xs font-bold text-neutral-700">
                    Mã OTP đã được gửi đến: <span className="text-black font-black">{resetEmail}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block text-center">Mã OTP (6 chữ số)</label>
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const val = resetOtp[index] || ''
                        return (
                          <input
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            required
                            value={val}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-14 text-center text-xl font-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-neutral-100 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          />
                        )
                      })}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full brutalist-btn-red py-3 text-sm font-black"
                  >
                    Xác Thực OTP ↗
                  </button>

                  <div className="flex justify-between items-center text-xs font-bold mt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-neutral-600 hover:text-black uppercase"
                    >
                      ← Nhập lại Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForgotPassword()}
                      className="text-[#ff3e3e] hover:underline uppercase"
                    >
                      Gửi Lại Mã OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Input New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in-up">
                  <div className="bg-[#f7f6f2] p-3 border-2 border-black text-xs font-bold text-neutral-700 space-y-1">
                    <div>Tài khoản: <span className="text-black font-black">{resetEmail}</span></div>
                    <div>Xác thực OTP: <span className="text-[#00ca4e] font-black">Hợp lệ ✓</span></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Mật Khẩu Mới</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Xác Nhận Mật Khẩu Mới</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className={`brutalist-input ${
                        resetConfirmPassword
                          ? resetPassword === resetConfirmPassword
                            ? 'border-[#00ca4e] focus:bg-[#e6fcf0]'
                            : 'border-[#ff3e3e] focus:bg-[#ffebeb]'
                          : ''
                      }`}
                    />
                    {resetConfirmPassword && (
                      <p className={`text-[10px] font-black uppercase tracking-wider ${
                        resetPassword === resetConfirmPassword ? 'text-[#00ca4e]' : 'text-[#ff3e3e]'
                      }`}>
                        {resetPassword === resetConfirmPassword ? 'Mật khẩu trùng khớp ✓' : 'Mật khẩu không trùng khớp ✗'}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!resetPassword || resetPassword !== resetConfirmPassword}
                    className="w-full brutalist-btn-red py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Đổi Mật Khẩu & Đăng Nhập ↗
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(2)}
                    className="w-full text-center text-xs font-black uppercase text-neutral-600 hover:text-black mt-2"
                  >
                    ← Quay Lại Nhập OTP
                  </button>
                </form>
              )}
            </div>
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
