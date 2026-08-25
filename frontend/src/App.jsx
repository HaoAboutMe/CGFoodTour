import React, { useState, useEffect, useRef } from 'react'
import {
  Compass,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Utensils,
  Coffee,
  IceCream
} from 'lucide-react'
import './App.css'

import Header from './components/Header'
import AuthModal from './components/AuthModal'
import DevConsole from './components/DevConsole'
import StoreCard from './components/StoreCard'
import StoreDetailDrawer from './components/StoreDetailDrawer'
import WidgetsSection from './components/WidgetsSection'
import ProfileSection from './components/ProfileSection'
import AdminSection from './components/AdminSection'
import MyStoresSection from './components/MyStoresSection'
import MyDishesSection from './components/MyDishesSection'
import MySubmissionsSection from './components/MySubmissionsSection'

const API_BASE = 'http://localhost:8080/api'

// Helper to map FontAwesome category icons to Lucide components
function getCategoryIcon(iconName) {
  const name = iconName ? iconName.toLowerCase() : ''
  if (name.includes('utensils') || name.includes('bowl')) return <Utensils className="w-5 h-5" />
  if (name.includes('coffee') || name.includes('beer') || name.includes('glass')) return <Coffee className="w-5 h-5" />
  if (name.includes('ice-cream') || name.includes('cookie')) return <IceCream className="w-5 h-5" />
  return <Compass className="w-5 h-5" />
}

export default function App() {
  // Navigation & Authentication
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '')
  const [refreshTokenVal, setRefreshTokenVal] = useState(localStorage.getItem('refreshToken') || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('explore')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // login, register, forgot, reset, verify

  // UI state
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
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
  const [regDob, setRegDob] = useState('')
  const [verifyTokenVal, setVerifyTokenVal] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetPassword, setResetPassword] = useState('')
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

  // Form Fields - Store Submission
  const [storeName, setStoreName] = useState('')
  const [storeCategoryId, setStoreCategoryId] = useState('')
  const [storeDesc, setStoreDesc] = useState('')
  const [storeLat, setStoreLat] = useState('')
  const [storeLng, setStoreLng] = useState('')
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
    if (showAuthModal && authMode === 'login') {
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
            const btnEl = document.getElementById('googleSignInBtn')
            if (btnEl) {
              window.google.accounts.id.renderButton(btnEl, {
                theme: 'dark',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                width: 380
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
    setMessage({ type, text })
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 4000)
  }

  // Core Request Wrapper
  async function makeRequest(method, endpoint, body = null, isMultipart = false) {
    const url = API_BASE + endpoint
    const headers = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
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
        return { success: false, error: data }
      }
    } catch (err) {
      logEvent(method, endpoint, body, { error: err.message }, false)
      return { success: false, error: { message: err.message } }
    }
  }

  // Time format helper
  function formatTimeHHmm(timeStr) {
    if (!timeStr) return ''
    const clean = timeStr.trim()
    if (/^\d{2}:\d{2}$/.test(clean)) return clean
    if (/^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean.substring(0, 5)
    
    const parts = clean.split(':')
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
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
      
      showToast('Welcome back to Cần Giuộc FoodTour!', 'success')
      setShowAuthModal(false)
      setLoginEmail('')
      setLoginPassword('')
    } else {
      showToast(res.error?.message || 'Login Failed. Please check your credentials.', 'error')
    }
  }

  // Register
  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/users', {
      username: regUsername,
      email: regEmail,
      firstname: regFirstname,
      lastname: regLastname,
      password: regPassword,
      dateOfBirth: regDob
    })
    setLoading(false)

    if (res.success) {
      showToast('Registration successful! Please check your email inbox.', 'success')
      setAuthMode('verify')
      setRegUsername('')
      setRegEmail('')
      setRegFirstname('')
      setRegLastname('')
      setRegPassword('')
      setRegDob('')
    } else {
      showToast(res.error?.message || 'Registration failed.', 'error')
    }
  }

  // Token verify email
  async function handleVerifyEmail(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('GET', `/auth/verify-email?token=${encodeURIComponent(verifyTokenVal)}`)
    setLoading(false)

    if (res.success) {
      showToast('Email verified successfully! You can now log in.', 'success')
      setAuthMode('login')
      setVerifyTokenVal('')
    } else {
      showToast(res.error?.message || 'Verification token invalid or expired.', 'error')
    }
  }

  // Resend email verification
  async function handleResendVerification(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', `/auth/resend-verification?email=${encodeURIComponent(resendEmail)}`)
    setLoading(false)

    if (res.success) {
      showToast('Verification email link sent!', 'success')
      setResendEmail('')
    } else {
      showToast(res.error?.message || 'Resend request failed.', 'error')
    }
  }

  // Forgot Password request OTP
  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/forgot-password', { email: forgotEmail })
    setLoading(false)

    if (res.success) {
      showToast('Password reset OTP sent to your email!', 'success')
      setResetEmail(forgotEmail)
      setAuthMode('reset')
      setForgotEmail('')
    } else {
      showToast(res.error?.message || 'Failed to send OTP.', 'error')
    }
  }

  // Reset Password with OTP
  async function handleResetPassword(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/reset-password', {
      email: resetEmail,
      otp: resetOtp,
      newPassword: resetPassword
    })
    setLoading(false)

    if (res.success) {
      showToast('Password reset successful! Please log in.', 'success')
      setAuthMode('login')
      setResetEmail('')
      setResetOtp('')
      setResetPassword('')
    } else {
      showToast(res.error?.message || 'Reset failed. Verify OTP.', 'error')
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
      showToast('Successfully logged in with Google!', 'success')
      setShowAuthModal(false)
      setSocialGoogleToken('')
    } else {
      showToast(res.error?.message || 'Google Login Failed.', 'error')
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
      showToast('Successfully logged in with Facebook!', 'success')
      setShowAuthModal(false)
      setSocialFacebookToken('')
    } else {
      showToast(res.error?.message || 'Facebook Login Failed.', 'error')
    }
  }

  // Popup Facebook SDK Login
  function handleFacebookSDKLogin() {
    if (typeof window.FB === 'undefined') {
      showToast('Facebook SDK not loaded. Try manually pasting the token.', 'error')
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
        showToast('Facebook Sign-in cancelled or unauthorized.', 'error')
      }
    }, { scope: 'public_profile,email' })
  }

  // Token refresh
  async function handleRefreshToken() {
    if (!refreshTokenVal) {
      showToast('No refresh token stored. Please login.', 'error')
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
      showToast('Session refreshed successfully.', 'success')
    } else {
      showToast('Session refresh expired. Logging out.', 'error')
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
    showToast('Logged out of FoodTour platform.', 'info')
    setActiveTab('explore')
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
      showToast('Profile information updated successfully!', 'success')
    } else {
      showToast(res.error?.message || 'Profile update failed.', 'error')
    }
  }

  // Upload Avatar
  async function handleUploadAvatar(e) {
    e.preventDefault()
    if (!avatarFile) {
      showToast('Select an avatar image file first.', 'error')
      return
    }
    setLoading(true)
    const formData = new FormData()
    formData.append('file', avatarFile)

    const res = await makeRequest('PATCH', '/users/me/avatar', formData, true)
    setLoading(false)

    if (res.success && res.data.result) {
      setCurrentUser(res.data.result)
      setAvatarPreview(res.data.result.avatarUrl)
      setAvatarFile(null)
      showToast('Profile avatar uploaded to Cloudinary!', 'success')
    } else {
      showToast(res.error?.message || 'Avatar upload failed.', 'error')
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
      showToast('Password changed! Please login with your new credentials.', 'success')
      handleLogout()
      setShowAuthModal(true)
      setAuthMode('login')
      setPwdOld('')
      setPwdNew('')
    } else {
      showToast(res.error?.message || 'Password update failed.', 'error')
    }
  }

  // Create Category (Admin)
  async function handleCreateCategory(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/v1/categories', {
      name: catName,
      icon: catIcon
    })
    setLoading(true)

    if (res.success) {
      showToast(`Category "${catName}" added!`, 'success')
      setCatName('')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Failed to create category.', 'error')
    }
  }

  // Submit Store Review
  async function handleCreateStore(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/v1/stores', {
      name: storeName,
      categoryId: parseInt(storeCategoryId),
      landmarkNote: storeDesc,
      latitude: storeLat ? parseFloat(storeLat) : null,
      longitude: storeLng ? parseFloat(storeLng) : null,
      addressLine: storeAddress,
      phoneNumber: storePhone,
      openTime: formatTimeHHmm(storeOpen),
      closeTime: formatTimeHHmm(storeClose),
      priceMin: parseFloat(storePriceMin) || 0,
      priceMax: parseFloat(storePriceMax) || 0,
      bannerImageUrl: storeBannerUrl
    })
    setLoading(false)

    if (res.success) {
      showToast(`Store "${storeName}" submitted for Admin verification!`, 'success')
      setStoreName('')
      setStoreCategoryId('')
      setStoreDesc('')
      setStoreLat('')
      setStoreLng('')
      setStoreAddress('')
      setStorePhone('')
      setStoreOpen('')
      setStoreClose('')
      setStorePriceMin(0)
      setStorePriceMax(0)
      setStoreBannerUrl('')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Failed to submit store.', 'error')
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
      showToast('Store details saved successfully!', 'success')
      setEditingStore(null)
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Failed to update store.', 'error')
    }
  }

  // Delete Store
  async function handleDeleteStore(storeId) {
    if (!window.confirm('Delete this store submission permanently? This action is irreversible.')) {
      return
    }
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/stores/${storeId}`)
    setLoading(false)

    if (res.success) {
      showToast('Store removed successfully.', 'success')
      setEditingStore(null)
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Failed to delete store.', 'error')
    }
  }

  // Create Food Item (Admin)
  async function handleCreateFoodItem(e) {
    e.preventDefault()
    if (!foodStoreId) {
      showToast('Select a store for this food item.', 'error')
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', `/v1/food-items/store/${foodStoreId}`, {
      name: foodName,
      price: parseFloat(foodPrice) || 0,
      imageUrl: foodImage,
      description: foodDesc
    })
    setLoading(false)

    if (res.success) {
      showToast(`Food "${foodName}" added to selected store!`, 'success')
      setFoodName('')
      setFoodPrice(0)
      setFoodImage('')
      setFoodDesc('')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Failed to add food item.', 'error')
    }
  }

  // Submitting 1-Touch Store Rating
  async function handleSubmitRating(storeId, ratingVal) {
    if (!token) {
      showToast('Please login to rate food spots.', 'error')
      setShowAuthModal(true)
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/rate`, { ratingLevel: ratingVal })
    setLoading(false)

    if (res.success && res.data.result) {
      showToast(`Rated! Satisfaction rate: ${res.data.result.satisfactionRate}% (${res.data.result.totalVotes} votes)`, 'success')
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
      showToast(res.error?.message || 'Rating submission failed.', 'error')
    }
  }

  // Submit Report Store Closed Today
  async function handleReportClosedToday(storeId) {
    if (!token) {
      showToast('Please login to report closures.', 'error')
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
      const closedState = res.data.result.isReportedClosed ? 'YES (reported closed today)' : 'NO (needs more votes)'
      showToast(`Closed report submitted! Verified status: ${closedState}`, 'success')
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'GPS coordinate boundary check failed (must be < 100m away).', 'error')
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
        showToast('No active spots matching the category selection.', 'error')
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
      showToast('Failed to load leaderboard.', 'error')
    }
  }

  // Admin View - Users List retrieve
  async function loadAdminUsers() {
    const res = await makeRequest('GET', '/users')
    if (res.success && res.data.result) {
      setAdminUsersList(res.data.result)
    } else {
      showToast('Admin access denied or user table request failed.', 'error')
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
    if (!window.confirm('Approve this store submission and publish it to the live feed?')) return
    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/approve`, {})
    setLoading(false)

    if (res.success) {
      showToast('Store approved and verified live!', 'success')
      loadAdminPendingStores()
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Approve action failed.', 'error')
    }
  }

  // Admin View - Reject store submission with reason
  async function handleAdminReject(storeId) {
    const reason = window.prompt('Specify the moderation feedback/rejection reason for this owner:')
    if (reason === null) return
    if (!reason.trim()) {
      showToast('Rejection reason cannot be blank.', 'error')
      return
    }

    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/reject`, { reason: reason.trim() })
    setLoading(false)

    if (res.success) {
      showToast('Submission rejected and feedback saved.', 'info')
      loadAdminPendingStores()
      loadGlobalData()
    } else {
      showToast(res.error?.message || 'Reject action failed.', 'error')
    }
  }

  // Admin View - Delete user account
  async function handleAdminDeleteUser(userId) {
    if (!window.confirm('Delete user profile completely? This will wipe their credentials and submissions.')) return
    setLoading(true)
    const res = await makeRequest('DELETE', `/users/${userId}`)
    setLoading(false)

    if (res.success) {
      showToast('User account successfully deleted.', 'success')
      loadAdminUsers()
    } else {
      showToast(res.error?.message || 'Failed to delete user.', 'error')
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
      showToast('User record updated successfully by Admin.', 'success')
      setEditingUser(null)
      loadAdminUsers()
    } else {
      showToast(res.error?.message || 'Update failed.', 'error')
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
    setActiveTab(tabId)
    if (tabId === 'admin') {
      loadAdminUsers()
      loadAdminPendingStores()
    } else if (tabId === 'explore') {
      loadGlobalData()
    }
  }

  // Filter verified stores for normal users, but show everything if user is admin
  const filteredStores = stores.filter((st) => {
    // Search query matching
    const matchesSearch =
      st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.landmarkNote?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.addressLine?.toLowerCase().includes(searchQuery.toLowerCase())

    // Category matching
    const matchesCategory = selectedCategory ? st.categoryId === selectedCategory.id : true

    // Show verified only in the explore list, unless current user is admin/owner
    const isLive = st.status === 'APPROVED'

    return matchesSearch && matchesCategory && isLive
  })

  // Get user's own stores
  const myStores = stores.filter((st) => {
    if (!currentUser) return false
    return (
      (st.ownerId && currentUser.id && st.ownerId.toString() === currentUser.id.toString()) ||
      (st.ownerEmail && currentUser.email && st.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())
    )
  })

  return (
    <div className="min-h-[100dvh] relative bg-[#f7f6f2] text-black pb-24 overflow-x-hidden">

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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-32 animate-fade-in-up">
        {/* API Response Flash Notification */}
        {message.text && (
          <div
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 transition-all duration-500 ${
              message.type === 'error'
                ? 'bg-[#fff5f5] text-[#c92a2a]'
                : message.type === 'info'
                ? 'bg-[#f7f6f2] text-black'
                : 'bg-[#e6fcf5] text-[#0ca678]'
            }`}
          >
            {message.type === 'error' ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-xs font-bold tracking-wide">{message.text}</span>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white border-3 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#ff3e3e] animate-spin" />
              <p className="text-xs font-black tracking-wider uppercase text-black">Đang Xử Lý Yêu Cầu...</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPLORE TOUR TAB */}
        {/* ========================================================================= */}
        {activeTab === 'explore' && (
          <div className="space-y-16">
            {/* Hero Header */}
            <div className="text-center max-w-2xl mx-auto space-y-6">
              <div className="inline-block">
                <span className="brutalist-badge bg-[#ff3e3e] text-white">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5 align-middle" /> Cần Giuộc Culinary Map
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black">
                Khám Phá Ẩm Thực
              </h1>
              <p className="text-neutral-700 text-sm md:text-base font-semibold leading-relaxed">
                Taste local culinary specialties in Cần Giuộc. Access reviews from community foodies, verify locations, and check live opening times.
              </p>
            </div>

            {/* Search bar & filter container */}
            <div className="max-w-3xl mx-auto">
              <div className="brutalist-card bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Tìm tên quán, địa danh, địa chỉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="brutalist-input"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2.5 border-3 border-black text-xs font-black transition-all ${
                      selectedCategory === null
                        ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-neutral-50 active:translate-y-[1px]'
                    }`}
                  >
                    Tất Cả Món
                  </button>
                  <div className="h-6 w-px bg-neutral-300 hidden md:block" />
                  <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[200px] md:max-w-none">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2.5 border-3 border-black text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          selectedCategory?.id === cat.id
                            ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-black hover:bg-neutral-50 active:translate-y-[1px]'
                        }`}
                      >
                        {getCategoryIcon(cat.icon)}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Layout: Main Live Food Tour Grid & Side Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Store Grid Left Column (8/12) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00f2fe]">LIVE STALLS</span>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Active Food Spots ({filteredStores.length})</h2>
                  </div>
                  <button
                    onClick={loadGlobalData}
                    className="p-2 rounded-2xl border border-white/5 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {filteredStores.length === 0 ? (
                  <div className="double-bezel-outer">
                    <div className="double-bezel-inner p-12 text-center text-neutral-500 space-y-3">
                      <Compass className="w-10 h-10 mx-auto text-neutral-600 animate-pulse" />
                      <p className="text-sm font-semibold">No food spots match your filters.</p>
                      <p className="text-xs text-neutral-600">Be the first to submit a new gourmet spot in Cần Giuộc!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredStores.map((store) => (
                      <StoreCard
                        key={store.id}
                        store={store}
                        setActiveStore={setActiveStore}
                      />
                    ))}
                  </div>
                )}
              </div>

              <WidgetsSection
                handleRandomPick={handleRandomPick}
                rollingRandom={rollingRandom}
                randomResult={randomResult}
                setRandomResult={setRandomResult}
                setActiveStore={setActiveStore}
                loadLeaderboard={loadLeaderboard}
                leaderboard={leaderboard}
                stores={stores}
              />
            </div>
          </div>
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
          <MyStoresSection
            myStores={myStores}
            categories={categories}
            editingStore={editingStore}
            setEditingStore={setEditingStore}
            handleUpdateStore={handleUpdateStore}
            handleDeleteStore={handleDeleteStore}
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
            foodStoreId={foodStoreId}
            setFoodStoreId={setFoodStoreId}
            foodName={foodName}
            setFoodName={setFoodName}
            foodPrice={foodPrice}
            setFoodPrice={setFoodPrice}
            foodImage={foodImage}
            setFoodImage={setFoodImage}
            foodDesc={foodDesc}
            setFoodDesc={setFoodDesc}
            handleCreateFoodItem={handleCreateFoodItem}
          />
        )}

        {/* ========================================================================= */}
        {/* ADMIN CONTROL PANEL */}
        {/* ========================================================================= */}
        {activeTab === 'admin' && (
          <AdminSection
            isUserAdmin={isAdmin()}
            switchTab={switchTab}
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
            adminPendingStores={adminPendingStores}
            handleAdminApprove={handleAdminApprove}
            handleAdminReject={handleAdminReject}
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
          />
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
        verifyTokenVal={verifyTokenVal}
        setVerifyTokenVal={setVerifyTokenVal}
        handleVerifyEmail={handleVerifyEmail}
        resendEmail={resendEmail}
        setResendEmail={setResendEmail}
        handleResendVerification={handleResendVerification}
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

      <DevConsole
        isConsoleOpen={isConsoleOpen}
        setIsConsoleOpen={setIsConsoleOpen}
        consoleLogs={consoleLogs}
        clearConsole={clearConsole}
        token={token}
        handleRefreshToken={handleRefreshToken}
      />
    </div>
  )
}
