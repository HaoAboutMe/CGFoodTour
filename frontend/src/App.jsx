import React, { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react'
import './App.css'

import Header from '@/layouts/Header'
import BottomNav from '@/layouts/BottomNav'
import AuthModal from '@/components/modals/AuthModal'
import StoreDetailDrawer from '@/components/drawers/StoreDetailDrawer'
import ProfileSection from '@/pages/Profile/ProfileSection'
import ExploreSection from '@/pages/Explore/ExploreSection'
import AboutSection from '@/pages/About/AboutSection'

// Code splitting & Dynamic imports for heavy sections per Vercel Best Practices (bundle-dynamic-imports)
const AdminSection = lazy(() => import('@/pages/Admin/AdminSection'))
const MyStoresSection = lazy(() => import('@/pages/MyStores/MyStoresSection'))
const CS2CaseOpener = lazy(() => import('@/pages/CS2CaseOpener/CS2CaseOpener'))
const DevConsole = lazy(() => import('@/components/common/DevConsole'))

const API_BASE = 'http://localhost:8080/api'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Navigation & Authentication - Lazy State Initialization (rerender-lazy-state-init)
  const [token, setToken] = useState(() => localStorage.getItem('jwtToken') || '')
  const [refreshTokenVal, setRefreshTokenVal] = useState(() => localStorage.getItem('refreshToken') || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('explore')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // login, register, forgot, reset, verify

  // UI state
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  const [consoleLogs, setConsoleLogs] = useState([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(true)

  // App Data
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeStore, setActiveStore] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form Fields - Auth
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regFirstname, setRegFirstname] = useState('')
  const [regLastname, setRegLastname] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)
  const [regDob, setRegDob] = useState('')
  const [verifyTokenVal, setVerifyTokenVal] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [socialGoogleToken, setSocialGoogleToken] = useState('')
  const [socialFacebookToken, setSocialFacebookToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Form Fields - Profile Edit
  const [upUsername, setUpUsername] = useState('')
  const [upFirstname, setUpFirstname] = useState('')
  const [upLastname, setUpLastname] = useState('')
  const [upDob, setUpDob] = useState('')
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form Fields - Store Submission
  const [storeName, setStoreName] = useState('')
  const [storeCategoryId, setStoreCategoryId] = useState('')
  const [storeDesc, setStoreDesc] = useState('')
  const [storeLat, setStoreLat] = useState('')
  const [storeLng, setStoreLng] = useState('')
  const [storeMapUrl, setStoreMapUrl] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeOpen, setStoreOpen] = useState('')
  const [storeClose, setStoreClose] = useState('')
  const [storePriceMin, setStorePriceMin] = useState(0)
  const [storePriceMax, setStorePriceMax] = useState(0)
  const [storeBannerUrl, setStoreBannerUrl] = useState('')

  // Form Fields - Store Edit/Update
  const [editingStore, setEditingStore] = useState(null)

  // Form Fields - Category Submission (Admin)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('fa-bread-slice')

  // Form Fields - Food Item Submission (Admin)
  const [foodStoreId, setFoodStoreId] = useState('')
  const [foodName, setFoodName] = useState('')
  const [foodPrice, setFoodPrice] = useState(0)
  const [foodImage, setFoodImage] = useState('')
  const [foodDesc, setFoodDesc] = useState('')

  // Form Fields - Rate & Report Closed
  const [gpsLat, setGpsLat] = useState('10.603417')
  const [gpsLng, setGpsLng] = useState('106.669812')

  // Random Pick & Leaderboard Result
  const [randomResult, setRandomResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [rollingRandom, setRollingRandom] = useState(false)

  // Admin User Edit Modal
  const [editingUser, setEditingUser] = useState(null)
  const [adminUserUsername, setAdminUserUsername] = useState('')
  const [adminUserFirst, setAdminUserFirst] = useState('')
  const [adminUserLast, setAdminUserLast] = useState('')
  const [adminUserDob, setAdminUserDob] = useState('')
  const [adminUserRoles, setAdminUserRoles] = useState({ USER: false, ADMIN: false })
  const [adminUsersList, setAdminUsersList] = useState([])
  const [adminPendingStores, setAdminPendingStores] = useState([])

  // Load Initial Data
  useEffect(() => {
    loadGlobalData()
    if (token) {
      getMyProfileSilently()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Sync URL path with activeTab and load data
  useEffect(() => {
    const rawPath = location.pathname.substring(1)
    const tab = rawPath === '' ? 'explore' : rawPath

    if (['explore', 'about', 'cs2-spinner', 'profile', 'my-stores', 'admin'].includes(tab)) {
      if (!token && ['profile', 'my-stores', 'admin'].includes(tab)) {
        navigate('/explore', { replace: true })
        return
      }
      
      setActiveTab(tab)
      if (tab === 'admin') {
        loadAdminUsers()
        loadAdminPendingStores()
      } else if (tab === 'explore' || tab === 'my-stores' || tab === 'about' || tab === 'cs2-spinner') {
        loadGlobalData()
      }
    } else {
      navigate('/explore', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, token])

  // Cross-tab authentication synchronization
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'jwtToken') {
        if (e.newValue) setToken(e.newValue)
        else {
          setToken('')
          setCurrentUser(null)
        }
      }
      if (e.key === 'refreshToken') {
        if (e.newValue) setRefreshTokenVal(e.newValue)
        else setRefreshTokenVal('')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Proactive background session refresh (runs every 10 minutes if logged in)
  useEffect(() => {
    const activeRefToken = refreshTokenVal || token || localStorage.getItem('refreshToken') || localStorage.getItem('jwtToken')
    if (!activeRefToken) return

    const interval = setInterval(() => {
      const currentRefToken = localStorage.getItem('refreshToken') || localStorage.getItem('jwtToken') || activeRefToken
      if (!currentRefToken) return

      console.log('Proactive background session refresh...')
      fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: currentRefToken })
      })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Refresh failed')
      })
      .then((data) => {
        if (data && data.result && data.result.token) {
          const accessToken = data.result.token
          const refToken = data.result.refreshToken || accessToken
          setToken(accessToken)
          setRefreshTokenVal(refToken)
          localStorage.setItem('jwtToken', accessToken)
          localStorage.setItem('refreshToken', refToken)
        }
      })
      .catch((err) => {
        console.warn('Proactive background refresh failed:', err)
      })
    }, 10 * 60 * 1000) // 10 minutes proactive silent refresh

    return () => clearInterval(interval)
  }, [token, refreshTokenVal])

  // Server-Sent Events (SSE) for Real-time Store Updates
  useEffect(() => {
    let eventSource;
    let reconnectTimeout;

    function connectSSE() {
      console.log('Connecting to SSE events...');
      eventSource = new EventSource(API_BASE + '/v1/stores/events');

      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        if (event.data === 'STORES_UPDATED') {
          loadGlobalData();
          if (token) {
            loadAdminPendingStores();
          }
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        eventSource.close();
        // Auto-reconnect after 5 seconds
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const googleLoginSubmitRef = useRef(null)
  const facebookLoginSubmitRef = useRef(null)

  useEffect(() => {
    googleLoginSubmitRef.current = handleGoogleLoginSubmit
    facebookLoginSubmitRef.current = handleFacebookLoginSubmit
  })

  // Social Login Scripts Load
  useEffect(() => {
    // Google One Tap / Sign-in configuration
    window.onGoogleSignIn = (googleResponse) => {
      const idToken = googleResponse.credential
      setSocialGoogleToken(idToken)
      logEvent('GOOGLE SDK CALLBACK', 'ID Token Received', null, { idToken: idToken.substring(0, 30) + '...' })
      if (googleLoginSubmitRef.current) {
        googleLoginSubmitRef.current(idToken)
      }
    }

    const initFB = () => {
      if (window.FB) {
        try {
          window.FB.init({
            appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FB_ID',
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
        } catch (e) {
          console.warn('FB.init failed', e)
        }
      }
    }

    // Facebook SDK setup
    window.fbAsyncInit = function () {
      initFB()
    }

    // If FB is already loaded, init immediately
    initFB()
  }, [])

  // Re-render Google Sign-in button when the Auth Modal opens
  useEffect(() => {
    if (showAuthModal && (authMode === 'login' || authMode === 'register')) {
      const timer = setTimeout(() => {
        try {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
              callback: (googleResponse) => {
                const idToken = googleResponse.credential
                setSocialGoogleToken(idToken)
                logEvent('GOOGLE SDK CALLBACK', 'ID Token Received', null, { idToken: idToken.substring(0, 30) + '...' })
                if (googleLoginSubmitRef.current) {
                  googleLoginSubmitRef.current(idToken)
                }
              }
            })
            const btnLogin = document.getElementById('googleSignInBtn')
            if (btnLogin) {
              window.google.accounts.id.renderButton(btnLogin, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                width: 360
              })
            }
            const btnReg = document.getElementById('googleSignInBtnRegister')
            if (btnReg) {
              window.google.accounts.id.renderButton(btnReg, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                width: 360
              })
            }
          }
        } catch (e) {
          console.warn('Google GSI SDK load/render check failed', e)
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [showAuthModal, authMode])

  // Logger helper
  function logEvent(method, url, requestBody, responseData, isSuccess = true) {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp,
        method,
        url,
        requestBody,
        responseData,
        isSuccess
      }
    ])
  }

  // Clear console log
  function clearConsole() {
    setConsoleLogs([])
  }

  // Flash UI messages
  function showToast(text, type = 'success') {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Core Request Wrapper
  async function makeRequest(method, endpoint, body = null, isMultipart = false) {
    const url = API_BASE + endpoint
    const headers = {}

    const currentToken = localStorage.getItem('jwtToken') || token
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`
    }

    let requestOptions = {
      method: method,
      headers: headers
    }

    if (body) {
      if (isMultipart) {
        requestOptions.body = body // browser sets boundary for multipart
      } else {
        headers['Content-Type'] = 'application/json'
        requestOptions.body = JSON.stringify(body)
      }
    }

    try {
      const response = await fetch(url, requestOptions)
      let data

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json()
      } else {
        data = { message: await response.text() }
      }

      if (response.ok) {
        logEvent(method, endpoint, body, data, true)
        return { success: true, data: data }
      } else {
        logEvent(method, endpoint, body, data, false)

        // Check if unauthorized and try to auto-refresh token
        if (response.status === 401 && 
            endpoint !== '/auth/token' && 
            endpoint !== '/auth/refresh' && 
            endpoint !== '/auth/google-login' && 
            endpoint !== '/auth/facebook-login') {
          
          const storedRefreshToken = localStorage.getItem('refreshToken') || refreshTokenVal
          if (storedRefreshToken) {
            console.log('Attempting automatic token refresh...')
            try {
              const refreshRes = await fetch(API_BASE + '/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: storedRefreshToken })
              })

              if (refreshRes.ok) {
                const refreshData = await refreshRes.json()
                if (refreshData && refreshData.result) {
                  const newAccessToken = refreshData.result.token
                  const newRefreshToken = refreshData.result.refreshToken || storedRefreshToken
                  
                  // Update state and storage
                  setToken(newAccessToken)
                  setRefreshTokenVal(newRefreshToken)
                  localStorage.setItem('jwtToken', newAccessToken)
                  localStorage.setItem('refreshToken', newRefreshToken)
                  
                  console.log('Auto refresh successful, retrying request...')

                  // Re-try the original request with the new access token
                  const retryHeaders = { ...headers }
                  retryHeaders['Authorization'] = `Bearer ${newAccessToken}`

                  const retryOptions = {
                    ...requestOptions,
                    headers: retryHeaders
                  }

                  const retryResponse = await fetch(url, retryOptions)
                  let retryData
                  const retryContentType = retryResponse.headers.get('content-type')
                  if (retryContentType && retryContentType.indexOf('application/json') !== -1) {
                    retryData = await retryResponse.json()
                  } else {
                    retryData = { message: await retryResponse.text() }
                  }

                  if (retryResponse.ok) {
                    logEvent(method, endpoint, body, retryData, true)
                    return { success: true, data: retryData }
                  } else {
                    logEvent(method, endpoint, body, retryData, false)
                    if (retryResponse.status === 401) {
                      handleLogout()
                    }
                    return { success: false, error: retryData }
                  }
                }
              }
            } catch (refreshErr) {
              console.error('Error during auto-refresh:', refreshErr)
            }
          }

          // If no refresh token or refresh failed, clear session
          handleLogout()
        }

        return { success: false, error: data }
      }
    } catch (err) {
      logEvent(method, endpoint, body, { error: err.message }, false)
      return { success: false, error: { message: err.message } }
    }
  }

  // Time format helper (Converts e.g. "4" -> "04:00", "4:30" -> "04:30", "17:30:00" -> "17:30")
  function formatTimeHHmm(timeStr) {
    if (!timeStr) return ''
    const clean = timeStr.toString().trim()
    if (!clean) return ''

    // Case 1: Just digits, e.g. "4", "04", "17"
    if (/^\d+$/.test(clean)) {
      let hour = parseInt(clean, 10)
      if (hour < 0) hour = 0
      if (hour > 23) hour = 23
      return `${hour.toString().padStart(2, '0')}:00`
    }

    // Case 2: One colon, e.g. "4:30", "04:30", "17:05"
    const hmRegex = /^(\d{1,2}):(\d{1,2})$/
    if (hmRegex.test(clean)) {
      const matches = clean.match(hmRegex)
      let hour = parseInt(matches[1], 10)
      let minute = parseInt(matches[2], 10)
      if (hour < 0) hour = 0; if (hour > 23) hour = 23
      if (minute < 0) minute = 0; if (minute > 59) minute = 59
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }

    // Case 3: Two colons, e.g. "4:30:00"
    const hmsRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    if (hmsRegex.test(clean)) {
      const matches = clean.match(hmsRegex)
      let hour = parseInt(matches[1], 10)
      let minute = parseInt(matches[2], 10)
      if (hour < 0) hour = 0; if (hour > 23) hour = 23
      if (minute < 0) minute = 0; if (minute > 59) minute = 59
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }

    // Fallback: if there's any colon but doesn't match above, try to pad parts
    const parts = clean.split(':')
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10) || 0
      let minute = parseInt(parts[1], 10) || 0
      if (hour < 0) hour = 0; if (hour > 23) hour = 23
      if (minute < 0) minute = 0; if (minute > 59) minute = 59
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }

    return clean
  }

  // Load global components data (stores, categories)
  async function loadGlobalData() {
    setLoading(true)
    const catRes = await makeRequest('GET', '/v1/categories')
    if (catRes.success && catRes.data.result) {
      setCategories(catRes.data.result)
    }

    const storeRes = await makeRequest('GET', '/v1/stores')
    if (storeRes.success && storeRes.data.result) {
      setStores(storeRes.data.result)
    }
    setLoading(false)
  }

  // Profile retrieval
  async function getMyProfileSilently() {
    const res = await makeRequest('GET', '/users/me')
    if (res.success && res.data.result) {
      const u = res.data.result
      setCurrentUser(u)
      setUpUsername(u.username || '')
      setUpFirstname(u.firstname || '')
      setUpLastname(u.lastname || '')
      setUpDob(u.dateOfBirth || '')
      if (u.avatarUrl) {
        setAvatarPreview(u.avatarUrl)
      }
    }
  }

  // Manual Login
  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/token', {
      email: loginEmail,
      password: loginPassword
    })
    setLoading(false)

    if (res.success && res.data.result) {
      const accessToken = res.data.result.token
      const refToken = res.data.result.refreshToken || ''
      setToken(accessToken)
      setRefreshTokenVal(refToken)
      localStorage.setItem('jwtToken', accessToken)
      localStorage.setItem('refreshToken', refToken)
      
      showToast('Chào mừng bạn quay trở lại Cần Giuộc FoodTour!', 'success')
      setShowAuthModal(false)
      setLoginEmail('')
      setLoginPassword('')
    } else {
      showToast(res.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.', 'error')
    }
  }

  // Register
  async function handleRegister(e) {
    e.preventDefault()

    // Client-side validations
    const cleanUsername = regUsername.trim()
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(cleanUsername)) {
      showToast('Username chỉ được gồm 3-20 ký tự chữ cái tiếng Anh không dấu, chữ số hoặc dấu gạch dưới (_)', 'error')
      return
    }

    const cleanEmail = regEmail.trim()
    if (cleanEmail.length > 50) {
      showToast('Email không được vượt quá 50 ký tự', 'error')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      showToast('Địa chỉ Email không đúng định dạng', 'error')
      return
    }

    if (regPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
      return
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Mật khẩu và Xác nhận mật khẩu không trùng khớp!', 'error')
      return
    }

    setLoading(true)
    const res = await makeRequest('POST', '/auth/register', {
      username: cleanUsername,
      email: cleanEmail,
      firstname: regFirstname.trim(),
      lastname: regLastname.trim(),
      password: regPassword
    })
    setLoading(false)

    if (res.success) {
      showToast('Đăng ký tài khoản thành công! Vui lòng kiểm tra hộp thư Email để bấm liên kết kích hoạt trước khi đăng nhập.', 'success')
      setAuthMode('login')
      setRegUsername('')
      setRegEmail('')
      setRegFirstname('')
      setRegLastname('')
      setRegPassword('')
      setRegConfirmPassword('')
    } else {
      showToast(res.error?.message || 'Đăng ký thất bại.', 'error')
    }
  }

  // Verify email
  async function handleVerifyEmail(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('GET', `/auth/verify-email?token=${encodeURIComponent(verifyTokenVal)}`)
    setLoading(false)

    if (res.success) {
      showToast('Xác thực Email thành công! Bạn có thể đăng nhập ngay bây giờ.', 'success')
      setAuthMode('login')
      setVerifyTokenVal('')
    } else {
      showToast(res.error?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.', 'error')
    }
  }

  // Resend email verification
  async function handleResendVerification(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', `/auth/resend-verification?email=${encodeURIComponent(resendEmail)}`)
    setLoading(false)

    if (res.success) {
      showToast('Đã gửi liên kết xác thực vào email của bạn!', 'success')
      setResendEmail('')
    } else {
      showToast(res.error?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.', 'error')
    }
  }

  // Forgot Password request OTP
  async function handleForgotPassword(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/forgot-password', { email: forgotEmail })
    setLoading(false)

    if (res.success) {
      showToast('Đã gửi mã OTP đặt lại mật khẩu vào email của bạn!', 'success')
      setResetEmail(forgotEmail)
      setForgotStep(2)
      setForgotEmail('')
    } else {
      showToast(res.error?.message || 'Gửi mã OTP thất bại.', 'error')
    }
  }

  // Verify OTP
  async function handleVerifyOtp(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/verify-otp', {
      email: resetEmail,
      otp: resetOtp
    })
    setLoading(false)

    if (res.success) {
      showToast('Xác thực OTP thành công!', 'success')
      setForgotStep(3)
    } else {
      showToast(res.error?.message || 'Mã OTP không đúng hoặc đã hết hạn.', 'error')
    }
  }

  // Reset Password with OTP
  async function handleResetPassword(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (resetPassword !== resetConfirmPassword) {
      showToast('Mật khẩu nhập lại không khớp!', 'error')
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', '/auth/reset-password', {
      email: resetEmail,
      otp: resetOtp,
      newPassword: resetPassword
    })
    setLoading(false)

    if (res.success) {
      showToast('Đổi mật khẩu thành công! Hãy đăng nhập.', 'success')
      setAuthMode('login')
      setResetEmail('')
      setResetOtp('')
      setResetPassword('')
      setResetConfirmPassword('')
      setForgotStep(1)
    } else {
      showToast(res.error?.message || 'Đổi mật khẩu thất bại.', 'error')
    }
  }

  // OAuth Google token submission
  async function handleGoogleLoginSubmit(tokenOrEvent) {
    let idToken = socialGoogleToken
    if (typeof tokenOrEvent === 'string') {
      idToken = tokenOrEvent
    } else if (tokenOrEvent && tokenOrEvent.preventDefault) {
      tokenOrEvent.preventDefault()
    }

    if (!idToken) return
    setLoading(true)
    const res = await makeRequest('POST', '/auth/google-login', { idToken })
    setLoading(false)

    if (res.success && res.data.result) {
      const accessToken = res.data.result.token
      const refToken = res.data.result.refreshToken || ''
      setToken(accessToken)
      setRefreshTokenVal(refToken)
      localStorage.setItem('jwtToken', accessToken)
      localStorage.setItem('refreshToken', refToken)
      showToast('Đăng nhập bằng Google thành công!', 'success')
      setShowAuthModal(false)
      setSocialGoogleToken('')
    } else {
      showToast(res.error?.message || 'Đăng nhập Google thất bại.', 'error')
    }
  }

  // OAuth Facebook token submission
  async function handleFacebookLoginSubmit(tokenOrEvent) {
    let accessTokenVal = socialFacebookToken
    if (typeof tokenOrEvent === 'string') {
      accessTokenVal = tokenOrEvent
    } else if (tokenOrEvent && tokenOrEvent.preventDefault) {
      tokenOrEvent.preventDefault()
    }

    if (!accessTokenVal) return
    setLoading(true)
    const res = await makeRequest('POST', '/auth/facebook-login', { accessToken: accessTokenVal })
    setLoading(false)

    if (res.success && res.data.result) {
      const accessToken = res.data.result.token
      const refToken = res.data.result.refreshToken || ''
      setToken(accessToken)
      setRefreshTokenVal(refToken)
      localStorage.setItem('jwtToken', accessToken)
      localStorage.setItem('refreshToken', refToken)
      showToast('Đăng nhập bằng Facebook thành công!', 'success')
      setShowAuthModal(false)
      setSocialFacebookToken('')
    } else {
      showToast(res.error?.message || 'Đăng nhập Facebook thất bại.', 'error')
    }
  }

  // Popup Facebook SDK Login
  function handleFacebookSDKLogin() {
    if (typeof window.FB === 'undefined') {
      showToast('Facebook SDK chưa sẵn sàng. Vui lòng thử dán token thủ công.', 'error')
      return
    }
    try {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FB_ID',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      })
    } catch (e) {
      console.warn('Facebook SDK init during login failed', e)
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        const tokenVal = response.authResponse.accessToken
        setSocialFacebookToken(tokenVal)
        logEvent('FACEBOOK SDK', 'Token received via Popup', null, { accessToken: tokenVal.substring(0, 20) + '...' })
        if (facebookLoginSubmitRef.current) {
          facebookLoginSubmitRef.current(tokenVal)
        }
      } else {
        showToast('Đăng nhập Facebook bị hủy hoặc không được cấp quyền.', 'error')
      }
    }, { scope: 'public_profile,email' })
  }

  // Token refresh
  async function handleRefreshToken() {
    if (!refreshTokenVal) {
      showToast('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.', 'error')
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', '/auth/refresh', { token: refreshTokenVal })
    setLoading(false)

    if (res.success && res.data.result) {
      const accessToken = res.data.result.token
      const refToken = res.data.result.refreshToken || refreshTokenVal
      setToken(accessToken)
      setRefreshTokenVal(refToken)
      localStorage.setItem('jwtToken', accessToken)
      localStorage.setItem('refreshToken', refToken)
      showToast('Làm mới phiên làm việc thành công.', 'success')
    } else {
      showToast('Phiên làm việc đã hết hạn. Đang đăng xuất.', 'error')
      handleLogout()
    }
  }

  // Logout
  function handleLogout() {
    setToken('')
    setRefreshTokenVal('')
    setCurrentUser(null)
    localStorage.removeItem('jwtToken')
    localStorage.removeItem('refreshToken')
    setAvatarPreview('')
    setAvatarFile(null)
    setEditingStore(null)
    showToast('Đã đăng xuất khỏi Cần Giuộc FoodTour.', 'info')
    navigate('/explore')
  }

  // Update profile basic info
  async function handleUpdateProfile(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('PUT', '/users/me', {
      username: upUsername,
      firstname: upFirstname,
      lastname: upLastname,
      dateOfBirth: upDob
    })
    setLoading(false)

    if (res.success && res.data.result) {
      setCurrentUser(res.data.result)
      showToast('Cập nhật thông tin cá nhân thành công!', 'success')
    } else {
      showToast(res.error?.message || 'Cập nhật thông tin cá nhân thất bại.', 'error')
    }
  }

  // Upload Avatar
  async function handleUploadAvatar(e) {
    e.preventDefault()
    if (!avatarFile) {
      showToast('Vui lòng chọn ảnh đại diện trước.', 'error')
      return
    }
    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', avatarFile)

    const res = await makeRequest('PATCH', '/users/me/avatar', formData, true)
    setUploadingAvatar(false)

    if (res.success && res.data.result) {
      setCurrentUser(res.data.result)
      setAvatarPreview(res.data.result.avatarUrl)
      setAvatarFile(null)
      showToast('Đã tải ảnh đại diện thành công!', 'success')
    } else {
      showToast(res.error?.message || 'Tải ảnh đại diện thất bại.', 'error')
    }
  }

  function handleCancelAvatarSelection() {
    setAvatarFile(null)
    setAvatarPreview(currentUser?.avatarUrl || '')
  }

  // Upload Generic Image (Stores/Dishes)
  async function handleUploadImage(file, folder = '') {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)

    let url = '/v1/upload/image'
    if (folder) {
      url += `?folder=${encodeURIComponent(folder)}`
    }

    const res = await makeRequest('POST', url, formData, true)

    if (res.success && res.data.result) {
      return res.data.result.url
    } else {
      showToast(res.error?.message || 'Tải ảnh thất bại.', 'error')
      return null
    }
  }

  // Preview file upload avatar
  function onAvatarFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (evt) => {
        setAvatarPreview(evt.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('PUT', '/users/me/change-password', {
      oldPassword: pwdOld,
      newPassword: pwdNew
    })
    setLoading(false)

    if (res.success) {
      showToast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.', 'success')
      handleLogout()
      setShowAuthModal(true)
      setAuthMode('login')
      setPwdOld('')
      setPwdNew('')
    } else {
      showToast(res.error?.message || 'Đổi mật khẩu thất bại.', 'error')
    }
  }

  // Create Category (Admin)
  async function handleCreateCategory(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/v1/categories', {
      name: catName,
      iconUrl: catIcon
    })
    setLoading(false)

    if (res.success) {
      showToast(`Đã thêm danh mục "${catName}" thành công!`, 'success')
      setCatName('')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Tạo danh mục thất bại.', 'error')
    }
  }

  // Update Category (Admin)
  async function handleUpdateCategory(id, nameOrData, iconUrl) {
    setLoading(true)
    let finalName = nameOrData
    let finalIcon = iconUrl

    if (typeof nameOrData === 'object' && nameOrData !== null) {
      finalName = nameOrData.name
      finalIcon = nameOrData.icon || nameOrData.iconUrl || iconUrl
    }

    const res = await makeRequest('PUT', `/v1/categories/${id}`, {
      name: finalName,
      iconUrl: finalIcon
    })
    setLoading(false)

    if (res.success) {
      showToast('Cập nhật danh mục thành công!', 'success')
      loadGlobalData()
      return true
    } else {
      showToast(res.error?.message || 'Không thể cập nhật danh mục.', 'error')
      return false
    }
  }

  // Delete Category (Admin)
  async function handleDeleteCategory(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Các quán ăn liên kết với danh mục này sẽ bị ảnh hưởng.")) return
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/categories/${id}`)
    setLoading(false)

    if (res.success) {
      showToast('Xóa danh mục thành công!', 'success')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể xóa danh mục.', 'error')
    }
  }

  // Submit Store Review
  async function handleCreateStore(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/v1/stores', {
      name: storeName,
      categoryId: parseInt(storeCategoryId),
      landmarkNote: storeDesc,
      latitude: storeLat ? parseFloat(storeLat) : null,
      longitude: storeLng ? parseFloat(storeLng) : null,
      mapUrl: storeMapUrl || null,
      addressLine: storeAddress,
      phoneNumber: storePhone,
      openTime: formatTimeHHmm(storeOpen),
      closeTime: formatTimeHHmm(storeClose),
      priceMin: parseFloat(storePriceMin) || 0,
      priceMax: parseFloat(storePriceMax) || 0,
      bannerImageUrl: storeBannerUrl
    })

    if (res && res.success && res.data && res.data.result) {
      const createdStore = res.data.result
      showToast(`Quán "${storeName}" đã được đăng ký thành công! Hãy thêm món ăn cho quán.`, 'success')
      setStoreName('')
      setStoreCategoryId('')
      setStoreDesc('')
      setStoreLat('')
      setStoreLng('')
      setStoreMapUrl('')
      setStoreAddress('')
      setStorePhone('')
      setStoreOpen('')
      setStoreClose('')
      setStorePriceMin(0)
      setStorePriceMax(0)
      setStoreBannerUrl('')
      
      if (createdStore.id) {
        setFoodStoreId(createdStore.id.toString())
      }

      await loadGlobalData()
      setLoading(false)
      return createdStore
    } else {
      setLoading(false)
      showToast(res?.error?.message || 'Không thể đăng ký quán ăn.', 'error')
      return null
    }
  }

  // Select store for edit
  function handleSelectEditStore(store) {
    setEditingStore(store)
  }

  // Update Store (Owner / Admin)
  async function handleUpdateStore(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('PUT', `/v1/stores/${editingStore.id}`, {
      name: editingStore.name,
      categoryId: editingStore.categoryId,
      landmarkNote: editingStore.landmarkNote,
      latitude: editingStore.latitude ? parseFloat(editingStore.latitude) : null,
      longitude: editingStore.longitude ? parseFloat(editingStore.longitude) : null,
      mapUrl: editingStore.mapUrl || null,
      addressLine: editingStore.addressLine,
      phoneNumber: editingStore.phoneNumber,
      openTime: formatTimeHHmm(editingStore.openTime),
      closeTime: formatTimeHHmm(editingStore.closeTime),
      priceMin: parseFloat(editingStore.priceMin) || 0,
      priceMax: parseFloat(editingStore.priceMax) || 0,
      bannerImageUrl: editingStore.bannerImageUrl
    })
    setLoading(false)

    if (res.success) {
      showToast(`Quán "${editingStore.name}" đã được cập nhật!`, 'success')
      setEditingStore(null)
      await loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể cập nhật quán ăn.', 'error')
    }
  }

  // Parse Google Maps URL for Store Lat/Lng
  async function handleParseGmapsUrl(url) {
    if (!url || !url.trim()) return null
    const res = await makeRequest('GET', `/v1/stores/parse-gmaps?url=${encodeURIComponent(url)}`)
    if (res.success && res.data.result) {
      return res.data.result
    }
    return null
  }

  // Hide Store
  async function handleHideStore(storeId, reason) {
    const res = await makeRequest('POST', `/v1/stores/${storeId}/hide`, { reason })
    if (res.success) {
      showToast('Đã tạm ẩn quán ăn!', 'success')
      await loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể ẩn quán ăn.', 'error')
    }
  }

  // Recover Store (Admin)
  async function handleRecoverStore(storeId, reason) {
    const res = await makeRequest('POST', `/v1/stores/${storeId}/recover`, { reason })
    if (res.success) {
      showToast('Đã khôi phục quán ăn!', 'success')
      await loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể khôi phục quán ăn.', 'error')
    }
  }

  // Request Recovery (Owner)
  async function handleRequestStoreRecovery(storeId, reason) {
    const res = await makeRequest('POST', `/v1/stores/${storeId}/request-recovery`, { reason })
    if (res.success) {
      showToast('Đã gửi yêu cầu khôi phục quán ăn!', 'success')
      await loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể gửi yêu cầu khôi phục.', 'error')
    }
  }

  // Reject Recovery Request (Admin)
  async function handleRejectRecoveryRequest(storeId, reason = '') {
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/reject-recovery-request`, { reason })
    setLoading(false)

    if (res.success) {
      showToast('Đã từ chối yêu cầu khôi phục quán ăn.', 'info')
      await loadGlobalData()
      if (activeTab === 'admin' && typeof loadAdminPendingStores === 'function') loadAdminPendingStores()
      return res.data || true
    } else {
      showToast(res.error?.message || 'Không thể từ chối yêu cầu khôi phục.', 'error')
      return false
    }
  }

  // Delete Store
  async function handleDeleteStore(storeId, reason = '') {
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/stores/${storeId}`, { reason })
    setLoading(false)
    if (res.success) {
      showToast('Quán ăn đã bị từ chối/xóa.', 'info')
      await loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể xóa quán ăn.', 'error')
    }
  }

  // Hard Delete Store (Admin / Owner)
  async function handleHardDeleteStore(storeId, reason = '') {
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/stores/${storeId}`, { reason })
    setLoading(false)

    if (res.success) {
      showToast('Đã xóa vĩnh viễn quán ăn khỏi hệ thống.', 'success')
      setEditingStore(null)
      await loadGlobalData()
      if (activeTab === 'admin' && typeof loadAdminPendingStores === 'function') loadAdminPendingStores()
      return true
    } else {
      showToast(res.error?.message || 'Không thể xóa vĩnh viễn quán ăn.', 'error')
      return false
    }
  }

  // Create Food Item
  async function handleCreateFoodItem(e) {
    e.preventDefault()
    if (!foodStoreId) {
      showToast('Vui lòng chọn quán ăn để thêm món.', 'error')
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', `/v1/food-items/store/${foodStoreId}`, {
      name: foodName,
      price: parseFloat(foodPrice) || 0,
      imageUrl: foodImage,
      description: foodDesc
    })

    if (res.success) {
      showToast(`Món "${foodName}" đã được thêm vào thực đơn thành công!`, 'success')
      setFoodName('')
      setFoodPrice(0)
      setFoodImage('')
      setFoodDesc('')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Thêm món ăn thất bại.', 'error')
    }
  }

  // Update Food Item
  async function handleUpdateFoodItem(foodId, foodData) {
    setLoading(true)
    const res = await makeRequest('PUT', `/v1/food-items/${foodId}`, {
      name: foodData.name,
      price: parseFloat(foodData.price) || 0,
      imageUrl: foodData.imageUrl,
      description: foodData.description
    })
    setLoading(false)

    if (res.success) {
      showToast(`Món ăn "${foodData.name}" đã được cập nhật!`, 'success')
      loadGlobalData()
      return true
    } else {
      showToast(res.error?.message || 'Không thể cập nhật món ăn.', 'error')
      return false
    }
  }

  // Delete Food Item
  async function handleDeleteFoodItem(foodId) {
    if (!window.confirm('Bạn có chắc muốn xóa món ăn này không?')) return
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/food-items/${foodId}`)
    setLoading(false)

    if (res.success) {
      showToast('Món ăn đã được xóa thành công!', 'success')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Không thể xóa món ăn.', 'error')
    }
  }

  // Submitting 1-Touch Store Rating
  async function handleSubmitRating(storeId, ratingVal) {
    if (!token) {
      showToast('Vui lòng đăng nhập để đánh giá quán ăn.', 'error')
      setShowAuthModal(true)
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/rate`, { ratingLevel: ratingVal })
    setLoading(false)

    if (res.success && res.data.result) {
      showToast(`Đã đánh giá! Tỷ lệ hài lòng: ${res.data.result.satisfactionRate}% (${res.data.result.totalVotes} lượt đánh giá)`, 'success')
      loadGlobalData()
      // Refresh active store details
      if (activeStore && activeStore.id === storeId) {
        const updated = stores.find((s) => s.id === storeId)
        if (updated) {
          setActiveStore({
            ...activeStore,
            satisfactionRate: res.data.result.satisfactionRate,
            totalVotes: res.data.result.totalVotes
          })
        }
      }
    } else {
      showToast(res.error?.message || 'Đánh giá thất bại.', 'error')
    }
  }

  // Submit Report Store Closed Today
  async function handleReportClosedToday(storeId) {
    if (!token) {
      showToast('Vui lòng đăng nhập để báo quán đóng cửa.', 'error')
      setShowAuthModal(true)
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/report-closed`, {
      latitude: parseFloat(gpsLat),
      longitude: parseFloat(gpsLng)
    })
    setLoading(false)

    if (res.success && res.data.result) {
      const closedState = res.data.result.isReportedClosed ? 'CÓ (Đã báo đóng cửa hôm nay)' : 'CHƯA (Cần thêm lượt báo)'
      showToast(`Đã gửi báo cáo đóng cửa! Trạng thái: ${closedState}`, 'success')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Xác thực khoảng cách GPS thất bại (Bạn cần ở vị trí cách quán dưới 100m).', 'error')
    }
  }

  // Spin/Roll Random Store
  async function handleRandomPick() {
    setRollingRandom(true)
    setRandomResult(null)
    const endpoint = selectedCategory
      ? `/v1/stores/random?categoryId=${selectedCategory.id}`
      : '/v1/stores/random'

    setTimeout(async () => {
      const res = await makeRequest('GET', endpoint)
      setRollingRandom(false)
      if (res.success && res.data.result) {
        setRandomResult(res.data.result)
      } else {
        showToast('Không có quán ăn nào phù hợp với danh mục đã chọn.', 'error')
      }
    }, 1200)
  }

  // Retrieve store leaderboard / rankings
  async function loadLeaderboard() {
    setLoading(true)
    const res = await makeRequest('GET', '/v1/stores/ranking')
    setLoading(false)
    if (res.success && res.data.result) {
      setLeaderboard(res.data.result)
    } else {
      showToast('Tải bảng xếp hạng thất bại.', 'error')
    }
  }

  // Admin View - Users List retrieve
  async function loadAdminUsers() {
    const res = await makeRequest('GET', '/users')
    if (res.success && res.data.result) {
      setAdminUsersList(res.data.result)
    } else {
      showToast('Quyền Admin bị từ chối hoặc tải danh sách người dùng thất bại.', 'error')
    }
  }

  // Admin View - Pending stores retrieve
  async function loadAdminPendingStores() {
    const res = await makeRequest('GET', '/v1/stores')
    if (res.success && res.data.result) {
      // filter only PENDING submissions
      setAdminPendingStores(res.data.result.filter((s) => s.status === 'PENDING'))
    }
  }

  // Admin View - Approve store submission
  async function handleAdminApprove(storeId) {
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/approve`, {})
    setLoading(false)

    if (res.success) {
      showToast('Quán ăn đã được duyệt và hiển thị thành công!', 'success')
      loadAdminPendingStores()
      loadGlobalData()
      return res.data || true
    } else {
      showToast(res.error?.message || 'Duyệt quán ăn thất bại.', 'error')
      return false
    }
  }

  // Admin View - Reject store submission with reason
  async function handleAdminReject(storeId, reason) {
    if (!reason || !reason.trim()) {
      showToast('Lý do từ chối không được để trống.', 'error')
      return false
    }

    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/reject`, { reason: reason.trim() })
    setLoading(false)

    if (res.success) {
      showToast('Đã từ chối yêu cầu và lưu phản hồi.', 'info')
      loadAdminPendingStores()
      loadGlobalData()
      return res.data || true
    } else {
      showToast(res.error?.message || 'Từ chối quán ăn thất bại.', 'error')
      return false
    }
  }

  // Admin View - Delete user account
  async function handleAdminDeleteUser(userId) {
    if (!window.confirm('Xóa tài khoản người dùng hoàn toàn? Hành động này sẽ xóa mọi thông tin và dữ liệu liên quan.')) return
    setLoading(true)
    const res = await makeRequest('DELETE', `/users/${userId}`)
    setLoading(false)

    if (res.success) {
      showToast('Xóa tài khoản người dùng thành công.', 'success')
      loadAdminUsers()
    } else {
      showToast(res.error?.message || 'Xóa tài khoản thất bại.', 'error')
    }
  }

  // Admin View - Open Edit User Modal
  function handleOpenAdminEditUser(user) {
    setEditingUser(user)
    setAdminUserUsername(user.username || '')
    setAdminUserFirst(user.firstname || '')
    setAdminUserLast(user.lastname || '')
    setAdminUserDob(user.dateOfBirth || '')

    const rolesMap = { USER: false, ADMIN: false }
    if (user.roles) {
      user.roles.forEach((r) => {
        const rName = typeof r === 'string' ? r : r.name
        if (rName === 'USER') rolesMap.USER = true
        if (rName === 'ADMIN') rolesMap.ADMIN = true
      })
    }
    setAdminUserRoles(rolesMap)
  }

  // Admin View - Submit user changes
  async function handleAdminUserEditSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const rolesArray = []
    if (adminUserRoles.USER) rolesArray.push('USER')
    if (adminUserRoles.ADMIN) rolesArray.push('ADMIN')

    const res = await makeRequest('PUT', `/users/${editingUser.id}`, {
      username: adminUserUsername,
      firstname: adminUserFirst,
      lastname: adminUserLast,
      dateOfBirth: adminUserDob,
      roles: rolesArray
    })
    setLoading(false)

    if (res.success) {
      showToast('Cập nhật thông tin người dùng thành công!', 'success')
      setEditingUser(null)
      loadAdminUsers()
    } else {
      showToast(res.error?.message || 'Cập nhật thất bại.', 'error')
    }
  }

  // Helper to extract roles
  function getUserRoleString(user) {
    if (!user || !user.roles) return 'GUEST'
    return user.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ')
  }

  // Check if current user is an Admin
  function isAdmin() {
    if (!currentUser || !currentUser.roles) return false
    return currentUser.roles.some((r) => {
      const name = typeof r === 'string' ? r : r.name
      return name === 'ADMIN'
    })
  }

  // Switch tabs and load appropriate data
  function switchTab(tabId) {
    setActiveStore(null)
    navigate('/' + tabId)
  }



  // Get user's own stores
  const myStores = stores.filter((st) => {
    if (!currentUser) return false
    return (
      (st.ownerId && currentUser.id && st.ownerId.toString() === currentUser.id.toString()) ||
      (st.ownerEmail && currentUser.email && st.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())
    )
  })

  return (
    <div className={`min-h-[100dvh] relative bg-[#f7f6f2] text-black overflow-x-hidden ${activeTab === 'admin' ? 'h-screen overflow-hidden pb-0' : 'pb-24'}`}>

      {activeTab !== 'admin' && (
        <Header
          switchTab={switchTab}
          activeTab={activeTab}
          currentUser={currentUser}
          isAdmin={isAdmin}
          getUserRoleString={getUserRoleString}
          handleLogout={handleLogout}
          setShowAuthModal={setShowAuthModal}
          setAuthMode={setAuthMode}
        />
      )}

      {/* Main Container */}
      <main className={activeTab === 'admin' ? 'h-full w-full p-0 pb-20 md:pb-0 animate-fade-in-up' : 'max-w-7xl mx-auto px-4 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-24 md:pb-8 animate-fade-in-up'}>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#ff3e3e] animate-spin" />
              <p className="text-xs font-black tracking-wider uppercase text-black">Đang Xử Lý Yêu Cầu...</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPLORE TOUR TAB */}
        {/* ========================================================================= */}
        {activeTab === 'explore' && (
          <ExploreSection
            stores={stores}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadGlobalData={loadGlobalData}
            setActiveStore={setActiveStore}
            handleRandomPick={handleRandomPick}
            rollingRandom={rollingRandom}
            randomResult={randomResult}
            setRandomResult={setRandomResult}
            loadLeaderboard={loadLeaderboard}
            leaderboard={leaderboard}
            switchTab={switchTab}
          />
        )}

        {/* ========================================================================= */}
        {/* CS2 SPINNER TAB */}
        {/* ========================================================================= */}
        {activeTab === 'cs2-spinner' && (
          <Suspense fallback={<div className="p-12 text-center flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-black" /><span className="font-bold">Đang tải Vòng quay CS2...</span></div>}>
            <div className="space-y-6">
              <CS2CaseOpener
                stores={stores}
                categories={categories}
                setActiveStore={setActiveStore}
              />
            </div>
          </Suspense>
        )}

        {/* ========================================================================= */}
        {/* ABOUT TAB */}
        {/* ========================================================================= */}
        {activeTab === 'about' && (
          <AboutSection
            switchTab={switchTab}
            setShowAuthModal={setShowAuthModal}
            setAuthMode={setAuthMode}
            currentUser={currentUser}
          />
        )}

        {/* ========================================================================= */}
        {/* PROFILE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && currentUser && (
          <ProfileSection
            currentUser={currentUser}
            avatarPreview={avatarPreview}
            avatarFile={avatarFile}
            onAvatarFileChange={onAvatarFileChange}
            handleUploadAvatar={handleUploadAvatar}
            handleCancelAvatarSelection={handleCancelAvatarSelection}
            uploadingAvatar={uploadingAvatar}
            upUsername={upUsername}
            setUpUsername={setUpUsername}
            upFirstname={upFirstname}
            setUpFirstname={setUpFirstname}
            upLastname={upLastname}
            setUpLastname={setUpLastname}
            upDob={upDob}
            setUpDob={setUpDob}
            handleUpdateProfile={handleUpdateProfile}
            pwdOld={pwdOld}
            setPwdOld={setPwdOld}
            pwdNew={pwdNew}
            setPwdNew={setPwdNew}
            handleChangePassword={handleChangePassword}
            loading={loading}
          />
        )}

        {/* ========================================================================= */}
        {/* MY STORES TAB */}
        {/* ========================================================================= */}
        {activeTab === 'my-stores' && currentUser && (
          <Suspense fallback={<div className="p-12 text-center flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-black" /><span className="font-bold">Đang tải Quản lý Quán ăn...</span></div>}>
            <MyStoresSection
              myStores={myStores}
              categories={categories}
              editingStore={editingStore}
              setEditingStore={setEditingStore}
              handleParseGmapsUrl={handleParseGmapsUrl}
              handleUpdateStore={handleUpdateStore}
              handleDeleteStore={handleDeleteStore}
              handleHideStore={handleHideStore}
              handleRecoverStore={handleRecoverStore}
              handleRequestStoreRecovery={handleRequestStoreRecovery}
              handleHardDeleteStore={handleHardDeleteStore}
              handleSelectEditStore={handleSelectEditStore}
              storeName={storeName}
              setStoreName={setStoreName}
              storeCategoryId={storeCategoryId}
              setStoreCategoryId={setStoreCategoryId}
              storeDesc={storeDesc}
              setStoreDesc={setStoreDesc}
              storeLat={storeLat}
              setStoreLat={setStoreLat}
              storeLng={storeLng}
              setStoreLng={setStoreLng}
              storeMapUrl={storeMapUrl}
              setStoreMapUrl={setStoreMapUrl}
              storeAddress={storeAddress}
              setStoreAddress={setStoreAddress}
              storePhone={storePhone}
              setStorePhone={setStorePhone}
              storeOpen={storeOpen}
              setStoreOpen={setStoreOpen}
              storeClose={storeClose}
              setStoreClose={setStoreClose}
              storePriceMin={storePriceMin}
              setStorePriceMin={setStorePriceMin}
              storePriceMax={storePriceMax}
              setStorePriceMax={setStorePriceMax}
              storeBannerUrl={storeBannerUrl}
              setStoreBannerUrl={setStoreBannerUrl}
              handleCreateStore={handleCreateStore}
              loading={loading}
              foodName={foodName}
              setFoodName={setFoodName}
              foodPrice={foodPrice}
              setFoodPrice={setFoodPrice}
              foodImage={foodImage}
              setFoodImage={setFoodImage}
              foodDesc={foodDesc}
              setFoodDesc={setFoodDesc}
              foodStoreId={foodStoreId}
              setFoodStoreId={setFoodStoreId}
              handleCreateFoodItem={handleCreateFoodItem}
              handleUpdateFoodItem={handleUpdateFoodItem}
              handleDeleteFoodItem={handleDeleteFoodItem}
              handleUploadImage={handleUploadImage}
              loadGlobalData={loadGlobalData}
            />
          </Suspense>
        )}

        {/* ========================================================================= */}
        {/* ADMIN CONTROL PANEL */}
        {/* ========================================================================= */}
        {activeTab === 'admin' && (
          <Suspense fallback={<div className="p-12 text-center flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-black" /><span className="font-bold">Đang tải Admin Dashboard...</span></div>}>
            <AdminSection
              isUserAdmin={isAdmin()}
              switchTab={switchTab}
              currentUser={currentUser}
              handleLogout={handleLogout}
              catName={catName}
              setCatName={setCatName}
              catIcon={catIcon}
              setCatIcon={setCatIcon}
              handleCreateCategory={handleCreateCategory}
              foodStoreId={foodStoreId}
              setFoodStoreId={setFoodStoreId}
              stores={stores}
              foodName={foodName}
              setFoodName={setFoodName}
              foodPrice={foodPrice}
              setFoodPrice={setFoodPrice}
              foodImage={foodImage}
              setFoodImage={setFoodImage}
              foodDesc={foodDesc}
              setFoodDesc={setFoodDesc}
              handleCreateFoodItem={handleCreateFoodItem}
              handleUploadImage={handleUploadImage}
              adminPendingStores={adminPendingStores}
              handleAdminApprove={handleAdminApprove}
              handleAdminReject={handleAdminReject}
              handleHideStore={handleHideStore}
              handleRecoverStore={handleRecoverStore}
              handleRejectRecoveryRequest={handleRejectRecoveryRequest}
              handleHardDeleteStore={handleHardDeleteStore}
              adminUsersList={adminUsersList}
              handleOpenAdminEditUser={handleOpenAdminEditUser}
              handleAdminDeleteUser={handleAdminDeleteUser}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              adminUserUsername={adminUserUsername}
              setAdminUserUsername={setAdminUserUsername}
              adminUserFirst={adminUserFirst}
              setAdminUserFirst={setAdminUserFirst}
              adminUserLast={adminUserLast}
              setAdminUserLast={setAdminUserLast}
              adminUserDob={adminUserDob}
              setAdminUserDob={setAdminUserDob}
              adminUserRoles={adminUserRoles}
              setAdminUserRoles={setAdminUserRoles}
              handleAdminUserEditSubmit={handleAdminUserEditSubmit}
              categories={categories}
              handleUpdateCategory={handleUpdateCategory}
              handleDeleteCategory={handleDeleteCategory}
              loadAdminUsers={loadAdminUsers}
              loadAdminPendingStores={loadAdminPendingStores}
              loadGlobalData={loadGlobalData}
            />
          </Suspense>
        )}
      </main>

      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        handleFacebookSDKLogin={handleFacebookSDKLogin}
        socialGoogleToken={socialGoogleToken}
        setSocialGoogleToken={setSocialGoogleToken}
        handleGoogleLoginSubmit={handleGoogleLoginSubmit}
        socialFacebookToken={socialFacebookToken}
        setSocialFacebookToken={setSocialFacebookToken}
        handleFacebookLoginSubmit={handleFacebookLoginSubmit}
        regUsername={regUsername}
        setRegUsername={setRegUsername}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regFirstname={regFirstname}
        setRegFirstname={setRegFirstname}
        regLastname={regLastname}
        setRegLastname={setRegLastname}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        regConfirmPassword={regConfirmPassword}
        setRegConfirmPassword={setRegConfirmPassword}
        showRegPassword={showRegPassword}
        setShowRegPassword={setShowRegPassword}
        showRegConfirmPassword={showRegConfirmPassword}
        setShowRegConfirmPassword={setShowRegConfirmPassword}
        regDob={regDob}
        setRegDob={setRegDob}
        handleRegister={handleRegister}
        forgotEmail={forgotEmail}
        setForgotEmail={setForgotEmail}
        handleForgotPassword={handleForgotPassword}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetOtp={resetOtp}
        setResetOtp={setResetOtp}
        resetPassword={resetPassword}
        setResetPassword={setResetPassword}
        handleResetPassword={handleResetPassword}
        forgotStep={forgotStep}
        setForgotStep={setForgotStep}
        resetConfirmPassword={resetConfirmPassword}
        setResetConfirmPassword={setResetConfirmPassword}
        handleVerifyOtp={handleVerifyOtp}
        verifyTokenVal={verifyTokenVal}
        setVerifyTokenVal={setVerifyTokenVal}
        handleVerifyEmail={handleVerifyEmail}
        resendEmail={resendEmail}
        setResendEmail={setResendEmail}
        handleResendVerification={handleResendVerification}
        showToast={showToast}
      />

      <StoreDetailDrawer
        activeStore={activeStore}
        setActiveStore={setActiveStore}
        handleSubmitRating={handleSubmitRating}
        handleReportClosedToday={handleReportClosedToday}
        gpsLat={gpsLat}
        setGpsLat={setGpsLat}
        gpsLng={gpsLng}
        setGpsLng={setGpsLng}
      />

      {isAdmin() && (
        <Suspense fallback={null}>
          <DevConsole
            isConsoleOpen={isConsoleOpen}
            setIsConsoleOpen={setIsConsoleOpen}
            consoleLogs={consoleLogs}
            clearConsole={clearConsole}
            token={token}
            handleRefreshToken={handleRefreshToken}
          />
        </Suspense>
      )}

      {/* Toast Notification Stack (Top-Right, below header) */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer p-4 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 animate-slide-in-right transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-[#fff5f5] text-[#c92a2a] hover:bg-[#ffe3e3]'
                : toast.type === 'info'
                ? 'bg-[#f7f6f2] text-black hover:bg-neutral-100'
                : 'bg-[#e6fcf5] text-[#0ca678] hover:bg-[#cbf7ec]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              )}
              <span className="text-xs font-black tracking-wide leading-snug">{toast.text}</span>
            </div>
            <X className="w-3.5 h-3.5 flex-shrink-0 opacity-40 hover:opacity-100" />
          </div>
        ))}
      </div>
      <BottomNav
        activeTab={activeTab}
        switchTab={switchTab}
        currentUser={currentUser}
        isUserAdmin={isAdmin()}
        setShowAuthModal={setShowAuthModal}
        setAuthMode={setAuthMode}
      />
    </div>
  )
}
