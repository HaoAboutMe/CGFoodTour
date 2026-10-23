import React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  FormField,
  Input,
  Button
} from '@/components/ui'

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
  googleSdkReady,
  facebookSdkReady,
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
  regConfirmPassword,
  setRegConfirmPassword,
  showRegPassword,
  setShowRegPassword,
  showRegConfirmPassword,
  setShowRegConfirmPassword,
  regDob,
  setRegDob,
  handleRegister,
  forgotEmail,
  setForgotEmail,
  handleForgotPassword,
  resetEmail,
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
  handleResendVerification,
  loading,
  showToast
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
    <Dialog
      isOpen={showAuthModal}
      onClose={() => {
        if (!loading) setShowAuthModal(false)
      }}
      role="dialog"
      size={authMode === 'register' ? '2xl' : 'md'}
      closeOnBackdropClick={false}
      closeOnEscape={!loading}
      className="max-h-[92vh] overflow-y-auto overflow-x-hidden brutalist-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative transition-all duration-300"
    >
      <DialogHeader
        showCloseButton={true}
        closeButtonLabel="Đóng cửa sổ đăng nhập"
        isCloseDisabled={loading}
        className="border-b-4 border-black pb-3 mb-4"
      >
        <div className="text-center space-y-1 pl-6 sm:pl-8">
          <span className="brutalist-badge bg-[#ff3e3e] text-white">Đăng Nhập An Toàn</span>
          <DialogTitle className="text-2xl font-black uppercase text-black mt-2">
            {authMode === 'login' && 'Đăng Nhập'}
            {authMode === 'register' && 'Tạo Tài Khoản'}
            {authMode === 'verify' && 'Xác Thực Email'}
            {authMode === 'forgot' && (forgotStep === 1 ? 'Quên Mật Khẩu' : forgotStep === 2 ? 'Xác thực OTP' : 'Đặt lại mật khẩu')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {authMode === 'login' && 'Cửa sổ đăng nhập tài khoản Cần Giuộc FoodTour'}
            {authMode === 'register' && 'Cửa sổ đăng ký tài khoản thành viên mới'}
            {authMode === 'verify' && 'Cửa sổ kích hoạt tài khoản bằng token'}
            {authMode === 'forgot' && 'Cửa sổ lấy lại mật khẩu tài khoản qua OTP'}
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogContent className="p-0">
          {/* Login Form */}
          {authMode === 'login' && (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <FormField id="login-email" label="Địa Chỉ Email" required>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </FormField>

                <FormField id="login-password" label="Mật Khẩu" required>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    rightAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="p-1 text-neutral-500 hover:text-black cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] rounded"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                    }
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] uppercase font-black text-[#ff3e3e] hover:underline cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </FormField>

                <Button
                  type="submit"
                  variant="action"
                  fullWidth
                  isLoading={loading}
                  loadingText="Đang xác thực..."
                >
                  Xác Thực Tài Khoản ↗
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-0.5 bg-black flex-1" />
                <span className="text-[10px] uppercase font-black text-black tracking-wider shrink-0">Hoặc Đăng Nhập Bằng</span>
                <div className="h-0.5 bg-black flex-1" />
              </div>

              {/* Social Buttons Container */}
              <div className="space-y-3">
                {/* Neo-Brutalist Google Button Container */}
                <div className="relative w-full h-12 overflow-hidden">
                  {/* Visual Custom Neo-Brutalist Button */}
                  <div className={`w-full h-12 py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 bg-white text-black border-2 border-black rounded-full shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] transition-all select-none ${googleSdkReady ? '' : 'opacity-60'}`}>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Tiếp Tục Với Google</span>
                  </div>

                  {/* Real Google GSI SDK iframe container overlaid transparently */}
                  <div
                    id="googleSignInBtn"
                    aria-disabled={!googleSdkReady}
                    className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer flex justify-center items-center z-10 w-full h-full"
                    onClick={() => {
                      if (googleSdkReady && window.google?.accounts?.id) {
                        window.google.accounts.id.prompt()
                      } else {
                        if (showToast) showToast('Google Sign-In SDK đang khởi tạo, vui lòng thử lại sau giây lát!', 'info')
                      }
                    }}
                  ></div>
                </div>

                {/* Neo-Brutalist Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookSDKLogin}
                  aria-disabled={!facebookSdkReady}
                  className={`w-full h-12 py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 bg-white text-black border-2 border-black rounded-full shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none ${facebookSdkReady ? '' : 'opacity-60'}`}
                >
                  <svg className="w-5 h-5 fill-[#1877f2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Tiếp Tục Với Facebook</span>
                </button>
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
            <div className="space-y-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField
                    id="reg-username"
                    label="Username"
                    hint="(3-20 ký tự, không dấu / khoảng trắng)"
                    required
                    isInvalid={Boolean(regUsername && (regUsername.length < 3 || !/^[a-z0-9_]+$/.test(regUsername)))}
                  >
                    <Input
                      id="reg-username"
                      type="text"
                      required
                      maxLength={20}
                      placeholder="foodlover"
                      autoComplete="username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className={
                        regUsername && regUsername.length >= 3 && /^[a-z0-9_]+$/.test(regUsername)
                          ? '!border-[#00ca4e] focus:bg-[#e6fcf0]'
                          : ''
                      }
                    />
                  </FormField>
                  <FormField id="reg-email" label="Email" required>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      maxLength={50}
                      placeholder="yourname@gmail.com"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField id="reg-firstname" label="Họ" required>
                    <Input
                      id="reg-firstname"
                      type="text"
                      maxLength={30}
                      placeholder="Nguyễn"
                      autoComplete="given-name"
                      value={regFirstname}
                      onChange={(e) => setRegFirstname(e.target.value)}
                    />
                  </FormField>
                  <FormField id="reg-lastname" label="Tên" required>
                    <Input
                      id="reg-lastname"
                      type="text"
                      maxLength={30}
                      placeholder="Văn A"
                      autoComplete="family-name"
                      value={regLastname}
                      onChange={(e) => setRegLastname(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField id="reg-password" label="Mật Khẩu" hint="Tối thiểu 8 ký tự" required>
                    <Input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={72}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      rightAdornment={
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="p-1 text-neutral-500 hover:text-black cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] rounded"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                        </button>
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-confirm-password"
                    label="Xác Nhận Mật Khẩu"
                    required
                    isInvalid={Boolean(regConfirmPassword && regPassword !== regConfirmPassword)}
                  >
                    <Input
                      id="reg-confirm-password"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={
                        regConfirmPassword && regPassword === regConfirmPassword
                          ? '!border-[#00ca4e] focus:bg-[#e6fcf0]'
                          : ''
                      }
                      rightAdornment={
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          aria-label={showRegConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="p-1 text-neutral-500 hover:text-black cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] rounded"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                        </button>
                      }
                    />
                  </FormField>
                </div>

                {regConfirmPassword && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      regPassword === regConfirmPassword ? 'text-[#00ca4e]' : 'text-[#ff3e3e]'
                    }`}
                  >
                    {regPassword === regConfirmPassword ? 'Mật khẩu trùng khớp' : 'Mật khẩu không trùng khớp'}
                  </p>
                )}

                <FormField id="reg-dob" label="Ngày Sinh" hint="Phải từ đủ 18 tuổi" required>
                  <Input
                    id="reg-dob"
                    type="date"
                    required
                    autoComplete="bday"
                    value={regDob}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                    onChange={(e) => setRegDob(e.target.value)}
                  />
                </FormField>

                <Button
                  type="submit"
                  variant="action"
                  fullWidth
                  disabled={loading || !regPassword || regPassword !== regConfirmPassword || regUsername.length < 3}
                  isLoading={loading}
                  loadingText="Đang gửi email xác thực..."
                  className="mt-2"
                >
                  Hoàn Tất Đăng Ký ↗
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-0.5 bg-black flex-1" />
                <span className="text-[10px] uppercase font-black text-black tracking-wider shrink-0">Hoặc Đăng Ký Bằng</span>
                <div className="h-0.5 bg-black flex-1" />
              </div>

              {/* Social Buttons for Registration */}
              <div className="space-y-3">
                {/* Neo-Brutalist Google Button Container */}
                <div className="relative w-full h-12 overflow-hidden">
                  {/* Visual Custom Neo-Brutalist Button */}
                  <div className={`w-full h-12 py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 bg-white text-black border-2 border-black rounded-full shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] transition-all select-none ${googleSdkReady ? '' : 'opacity-60'}`}>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Tiếp Tục Với Google</span>
                  </div>

                  {/* Real Google GSI SDK iframe container overlaid transparently */}
                  <div
                    id="googleSignInBtnRegister"
                    aria-disabled={!googleSdkReady}
                    className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer flex justify-center items-center z-10 w-full h-full"
                    onClick={() => {
                      if (googleSdkReady && window.google?.accounts?.id) {
                        window.google.accounts.id.prompt()
                      } else {
                        if (showToast) showToast('Google Sign-In SDK đang khởi tạo, vui lòng thử lại sau giây lát!', 'info')
                      }
                    }}
                  ></div>
                </div>

                {/* Neo-Brutalist Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookSDKLogin}
                  aria-disabled={!facebookSdkReady}
                  className={`w-full h-12 py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 bg-white text-black border-2 border-black rounded-full shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none ${facebookSdkReady ? '' : 'opacity-60'}`}
                >
                  <svg className="w-5 h-5 fill-[#1877f2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Tiếp Tục Với Facebook</span>
                </button>
              </div>

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
            </div>
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
                  <FormField id="forgot-email" label="Địa Chỉ Email" required>
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </FormField>
                  <Button
                    type="submit"
                    variant="action"
                    fullWidth
                    disabled={loading}
                    isLoading={loading}
                    loadingText="Đang gửi OTP..."
                  >
                    Gửi OTP Đặt Lại Mật Khẩu ↗
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setAuthMode('login')}
                    className="mt-2 text-xs font-black uppercase text-neutral-600 hover:text-black"
                  >
                    Quay Lại Đăng Nhập
                  </Button>
                </form>
              )}

              {/* Step 2: Input OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in-up">
                  <div className="bg-[#f7f6f2] p-3 border-2 border-black text-xs font-bold text-neutral-700">
                    Mã OTP đã được gửi đến: <span className="text-black font-black">{resetEmail}</span>
                  </div>
                  <div className="space-y-2">
                    <label id="otp-group-label" className="text-xs uppercase font-extrabold tracking-wider block text-center">
                      Mã OTP (6 chữ số)
                    </label>
                    <div
                      role="group"
                      aria-labelledby="otp-group-label"
                      className="flex justify-center gap-2"
                      onPaste={handleOtpPaste}
                    >
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
                            aria-label={`Chữ số thứ ${index + 1}`}
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            value={val}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-14 text-center text-xl font-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-neutral-100 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          />
                        )
                      })}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="action"
                    fullWidth
                    isLoading={loading}
                    loadingText="Đang xác thực..."
                  >
                    Xác Thực OTP ↗
                  </Button>

                  <div className="flex justify-between items-center text-xs font-bold mt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-neutral-600 hover:text-black uppercase cursor-pointer"
                    >
                      ← Nhập lại Email
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleForgotPassword()}
                      className="text-[#ff3e3e] hover:underline uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? 'Đang gửi...' : 'Gửi Lại Mã OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Input New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in-up">
                  <div className="bg-[#f7f6f2] p-3 border-2 border-black text-xs font-bold text-neutral-700 space-y-1">
                    <div>Tài khoản: <span className="text-black font-black">{resetEmail}</span></div>
                    <div>Xác thực OTP: <span className="text-[#00ca4e] font-black">Hợp lệ</span></div>
                  </div>
                  <FormField id="reset-password" label="Mật Khẩu Mới" hint="Tối thiểu 8 ký tự" required>
                    <Input
                      id="reset-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </FormField>
                  <FormField
                    id="reset-confirm-password"
                    label="Xác Nhận Mật Khẩu Mới"
                    required
                    isInvalid={Boolean(resetConfirmPassword && resetPassword !== resetConfirmPassword)}
                  >
                    <Input
                      id="reset-confirm-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className={
                        resetConfirmPassword && resetPassword === resetConfirmPassword
                          ? '!border-[#00ca4e] focus:bg-[#e6fcf0]'
                          : ''
                      }
                    />
                    {resetConfirmPassword && (
                      <p
                        role="status"
                        aria-live="polite"
                        className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${
                          resetPassword === resetConfirmPassword ? 'text-[#00ca4e]' : 'text-[#ff3e3e]'
                        }`}
                      >
                        {resetPassword === resetConfirmPassword ? 'Mật khẩu trùng khớp' : 'Mật khẩu không trùng khớp'}
                      </p>
                    )}
                  </FormField>
                  <Button
                    type="submit"
                    variant="action"
                    fullWidth
                    disabled={!resetPassword || resetPassword !== resetConfirmPassword || loading}
                    isLoading={loading}
                    loadingText="Đang đổi mật khẩu..."
                  >
                    Đổi Mật Khẩu & Đăng Nhập ↗
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setForgotStep(2)}
                    className="mt-2 text-xs font-black uppercase text-neutral-600 hover:text-black"
                  >
                    ← Quay Lại Nhập OTP
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Verify Email token Form */}
          {authMode === 'verify' && (
            <div className="space-y-6">
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                  Mở liên kết được gửi trong email, hoặc dán token xác thực từ liên kết đó vào bên dưới.
                </p>
                <FormField id="verify-token" label="Mã Kích Hoạt Từ Email" required>
                  <Input
                    id="verify-token"
                    type="text"
                    required
                    placeholder="Dán mã kích hoạt từ email"
                    value={verifyTokenVal}
                    onChange={(e) => setVerifyTokenVal(e.target.value)}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="action"
                  fullWidth
                  isLoading={loading}
                  loadingText="Đang kích hoạt..."
                >
                  Kích Hoạt Tài Khoản
                </Button>
              </form>

              {/* Resend Link form container */}
              <details open className="text-[10px] text-neutral-600 font-extrabold cursor-pointer">
                <summary className="hover:text-black">Bạn cần gửi lại liên kết kích hoạt?</summary>
                <div className="mt-3 space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <FormField id="resend-email" label="Địa Chỉ Email Nhận Lại Mã">
                    <Input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      autoComplete="email"
                      className="py-2"
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="action"
                    size="sm"
                    fullWidth
                    disabled={loading || !resendEmail}
                    isLoading={loading}
                    loadingText="Đang gửi email..."
                    onClick={handleResendVerification}
                    className="text-xs"
                  >
                    Gửi Lại Kích Hoạt
                  </Button>
                </div>
              </details>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-black uppercase text-neutral-600 hover:text-black"
              >
                Quay Lại Đăng Nhập
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
