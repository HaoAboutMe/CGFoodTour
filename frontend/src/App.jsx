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
import SavedStoresSection from '@/components/SavedStoresSection'
import { getVietnameseApiError } from '@/utils/apiErrorMessages'
import { redactSensitiveData } from '@/utils/redactSensitiveData'
import { storePath } from '@/utils/storeUrl'
import { frontendConfig } from '@/config/frontendConfig'

// Code splitting & Dynamic imports for heavy sections per Vercel Best Practices (bundle-dynamic-imports)
const AdminSection = lazy(() => import('@/pages/Admin/AdminSection'))
const MyStoresSection = lazy(() => import('@/pages/MyStores/MyStoresSection'))
const CS2CaseOpener = lazy(() => import('@/pages/CS2CaseOpener/CS2CaseOpener'))
const DevConsole = import.meta.env.DEV
  ? lazy(() => import('@/components/common/DevConsole'))
  : null

const API_BASE = frontendConfig.apiBase

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`
  const item = document.cookie.split('; ').find((value) => value.startsWith(prefix))
  return item ? decodeURIComponent(item.substring(prefix.length)) : ''
}

function csrfToken() {
  return readCookie('__Host-cgft_csrf') || readCookie('cgft_csrf')
}

function getRefreshDelay(accessToken) {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return Math.max(30_000, payload.exp * 1000 - Date.now() - 60_000)
  } catch {
    return 4 * 60 * 1000
  }
}

function isAtLeast18(dateValue) {
  if (!dateValue) return false
  const birthDate = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return birthDate <= cutoff
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Navigation & Authentication - Lazy State Initialization (rerender-lazy-state-init)
  const [token, setToken] = useState('')
  const tokenRef = useRef('')
  const [hasSession, setHasSession] = useState(true)
  const refreshPromiseRef = useRef(null)
  const logoutPromiseRef = useRef(null)
  const refreshSessionRef = useRef(null)
  const handleLogoutRef = useRef(null)
  const authChannelRef = useRef(null)
  const facebookInitializedRef = useRef(false)
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
  const [storePage, setStorePage] = useState({ page: 0, totalPages: 1, totalElements: 0, last: true })
  const [loadingMoreStores, setLoadingMoreStores] = useState(false)
  const publicStoreRequestRef = useRef(0)
  const adminUserRequestSequenceRef = useRef(0)
  const adminStoreRequestSequenceRef = useRef(0)
  const adminUserRequestRef = useRef({ page: 0, query: '', role: 'ALL' })
  const adminStoreRequestRef = useRef({ page: 0, query: '', status: 'ALL', categoryId: 'ALL' })
  const [ownedStores, setOwnedStores] = useState([])
  const [adminStores, setAdminStores] = useState([])
  const [savedStores, setSavedStores] = useState([])
  const [ownedStoresPage, setOwnedStoresPage] = useState({ page: 0, totalElements: 0, last: true })
  const [savedStoresPage, setSavedStoresPage] = useState({ page: 0, totalElements: 0, last: true })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeStore, setActiveStore] = useState(null)
  const detailOpenedFromAppRef = useRef(false)
  const previousRoutePathRef = useRef(location.pathname)
  const [searchQuery, setSearchQuery] = useState('')
  const [publicFilters, setPublicFilters] = useState({
    categoryIds: [], openNow: false, nearMe: false, latitude: null, longitude: null
  })
  const [storeFacets, setStoreFacets] = useState({})

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
  const [googleSdkReady, setGoogleSdkReady] = useState(() => Boolean(window.google?.accounts?.id))
  const [facebookSdkReady, setFacebookSdkReady] = useState(() => Boolean(window.FB))
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
  const [adminStoreSummary, setAdminStoreSummary] = useState({})
  const [adminUsersPage, setAdminUsersPage] = useState({ page: 0, totalPages: 1, totalElements: 0 })
  const [adminStoresPage, setAdminStoresPage] = useState({ page: 0, totalPages: 1, totalElements: 0 })

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
    const previousPath = previousRoutePathRef.current
    const returningFromStoreDetail = previousPath.startsWith('/quan/')
      && !location.pathname.startsWith('/quan/')
    previousRoutePathRef.current = location.pathname

    const rawPath = location.pathname.substring(1)
    if (rawPath.startsWith('quan/')) {
      // Keep the originating tab visible behind the drawer when detail was
      // opened inside the app. Direct/shared detail URLs use Explore.
      if (!detailOpenedFromAppRef.current) setActiveTab('explore')
      return
    }
    const tab = rawPath === '' ? 'explore' : rawPath

    if (['explore', 'about', 'cs2-spinner', 'saved', 'profile', 'my-stores', 'admin'].includes(tab)) {
      if (!token && ['saved', 'profile', 'my-stores', 'admin'].includes(tab)) {
        if (tab === 'saved') {
          // Allowed to view saved tab even when unauthenticated (shows login prompt)
          setActiveTab('saved')
          return
        }
        navigate('/explore', { replace: true })
        return
      }
      
      setActiveTab(tab)
      setActiveStore(null)
      detailOpenedFromAppRef.current = false
      if (returningFromStoreDetail) {
        // The originating screen is still mounted with current data behind the
        // drawer. Avoid a redundant reload and its full-screen loading flash.
        return
      }
      if (tab === 'admin') {
        loadAdminUsers()
        loadAdminPendingStores()
      } else if (tab === 'explore' || tab === 'my-stores' || tab === 'about' || tab === 'cs2-spinner' || tab === 'saved') {
        loadGlobalData()
        if (tab === 'saved') {
          loadSavedStores()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, token])

  // Resolve a store route independently from the currently loaded Explore page.
  useEffect(() => {
    const match = location.pathname.match(/^\/quan\/([^/]+)(?:\/([^/]+))?\/?$/)
    if (!match) return undefined
    let cancelled = false
    const id = decodeURIComponent(match[1])
    ;(async () => {
      const response = await makeRequest('GET', `/v1/stores/${encodeURIComponent(id)}`)
      if (cancelled) return
      if (!response.success || !response.data.result) {
        setActiveStore(null)
        document.title = 'Không tìm thấy quán | Cần Giuộc Food Tour'
        return
      }
      const store = response.data.result
      setActiveStore(store)
      const canonicalPath = storePath(store)
      if (location.pathname !== canonicalPath) navigate(canonicalPath, { replace: true })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, token])

  function openActiveStore(store) {
    if (!store) return
    detailOpenedFromAppRef.current = true
    setActiveStore(store)
    navigate(storePath(store))
  }

  useEffect(() => {
    if (activeTab !== 'explore') return undefined
    const timer = window.setTimeout(() => loadPublicStores(0, false), 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory?.id, publicFilters, activeTab])

  // Dynamic Document Title based on active tab & active store
  useEffect(() => {
    const BRAND_SUFFIX = 'Cần Giuộc Food Tour'

    if (activeStore) {
      document.title = `${activeStore.name} | ${BRAND_SUFFIX}`
      const canonical = new URL(storePath(activeStore), window.location.origin).toString()
      const description = `${activeStore.name} tại ${activeStore.addressLine || 'Cần Giuộc'}`
      const values = {
        'meta[name="description"]': description,
        'meta[property="og:title"]': activeStore.name,
        'meta[property="og:description"]': description,
        'meta[property="og:url"]': canonical,
        'meta[property="og:image"]': activeStore.bannerImageUrl || `${window.location.origin}/logo-512.webp`,
      }
      Object.entries(values).forEach(([selector, content]) => {
        let element = document.head.querySelector(selector)
        if (!element) {
          element = document.createElement('meta')
          const property = selector.match(/property="([^"]+)/)?.[1]
          const name = selector.match(/name="([^"]+)/)?.[1]
          if (property) element.setAttribute('property', property)
          if (name) element.setAttribute('name', name)
          document.head.appendChild(element)
        }
        element.setAttribute('content', content)
      })
      let canonicalLink = document.head.querySelector('link[rel="canonical"]')
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.setAttribute('href', canonical)
      return
    }

    const tabTitles = {
      'explore': 'Khám Phá Ẩm Thực',
      'cs2-spinner': 'Vòng Xoay Quán Ăn',
      'saved': 'Quán Ăn Đã Lưu',
      'about': 'Về Chúng Tôi',
      'profile': 'Tài Khoản Của Tôi',
      'my-stores': 'Quán Ăn Của Tôi',
      'admin': 'Bảng Quản Trị Hệ Thống'
    }

    const titlePrefix = tabTitles[activeTab] || 'Khám Phá Ẩm Thực'
    document.title = `${titlePrefix} | ${BRAND_SUFFIX}`
    const canonical = new URL(location.pathname || '/explore', window.location.origin).toString()
    const description = 'Khám phá ẩm thực và các quán ăn tại Cần Giuộc.'
    document.head.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.head.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.head.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.head.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical)
    document.head.querySelector('meta[property="og:image"]')?.setAttribute('content', `${window.location.origin}/logo-512.webp`)
    let canonicalLink = document.head.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonical)
  }, [activeTab, activeStore, location.pathname])

  function closeActiveStore() {
    setActiveStore(null)
    if (location.pathname.startsWith('/quan/')) {
      if (detailOpenedFromAppRef.current) navigate(-1)
      else navigate('/explore', { replace: true })
    }
    detailOpenedFromAppRef.current = false
  }

  // Cross-tab authentication synchronization. Raw tokens are never sent.
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined
    const channel = new BroadcastChannel('cgft-auth')
    authChannelRef.current = channel
    channel.onmessage = ({ data }) => {
      if (data?.type === 'LOGOUT') {
        tokenRef.current = ''
        setToken('')
        setHasSession(false)
        setCurrentUser(null)
      } else if (data?.type === 'LOGIN') {
        setHasSession(true)
        refreshSessionRef.current?.().catch(() => {})
      }
    }
    return () => {
      channel.close()
      authChannelRef.current = null
    }
  }, [])

  // Restore the access token from the HttpOnly refresh-cookie session after reload.
  useEffect(() => {
    refreshSessionRef.current?.().catch(() => {
      tokenRef.current = ''
      setToken('')
      setHasSession(false)
    })
  }, [])

  // Refresh shortly before the current access token expires.
  useEffect(() => {
    if (!token || !hasSession) return
    const timeout = setTimeout(() => {
      refreshSessionRef.current().catch(() => handleLogoutRef.current())
    }, getRefreshDelay(token))
    return () => clearTimeout(timeout)
  }, [token, hasSession])

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
            loadMyStores();
          }
          if (isAdmin()) {
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
        if (facebookInitializedRef.current) {
          setFacebookSdkReady(true)
          return
        }
        try {
          window.FB.init({
            appId: frontendConfig.facebookAppId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
          facebookInitializedRef.current = true
          setFacebookSdkReady(true)
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

    const googleScript = document.getElementById('google-gsi-sdk')
    const facebookScript = document.getElementById('facebook-sdk')
    const markGoogleReady = () => setGoogleSdkReady(Boolean(window.google?.accounts?.id))
    const markFacebookReady = () => {
      initFB()
      setFacebookSdkReady(Boolean(window.FB))
    }
    googleScript?.addEventListener('load', markGoogleReady)
    facebookScript?.addEventListener('load', markFacebookReady)

    // Static SDK loading remains the source of truth. This bounded readiness
    // check only covers the case where an async script finishes after React mounts.
    let checks = 0
    const readinessTimer = window.setInterval(() => {
      checks += 1
      if (window.google?.accounts?.id) setGoogleSdkReady(true)
      if (window.FB) markFacebookReady()
      if ((window.google?.accounts?.id && window.FB) || checks >= 50) {
        window.clearInterval(readinessTimer)
      }
    }, 100)

    return () => {
      window.clearInterval(readinessTimer)
      googleScript?.removeEventListener('load', markGoogleReady)
      facebookScript?.removeEventListener('load', markFacebookReady)
    }
  }, [])

  // Re-render Google Sign-in button when the Auth Modal opens
  useEffect(() => {
    if (showAuthModal && googleSdkReady && (authMode === 'login' || authMode === 'register')) {
      try {
          if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: frontendConfig.googleClientId,
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
              btnLogin.replaceChildren()
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
              btnReg.replaceChildren()
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
    }
  }, [showAuthModal, authMode, googleSdkReady])

  // Logger helper
  function logEvent(method, url, requestBody, responseData, isSuccess = true) {
    if (!import.meta.env.DEV) return
    const timestamp = new Date().toLocaleTimeString()
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp,
        method,
        url,
        requestBody: redactSensitiveData(requestBody),
        responseData: redactSensitiveData(responseData),
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

  function persistSession(authResult, broadcast = false) {
    if (!authResult?.accessToken) {
      throw new Error('Invalid authentication response')
    }
    tokenRef.current = authResult.accessToken
    setToken(authResult.accessToken)
    setHasSession(true)
    if (broadcast) authChannelRef.current?.postMessage({ type: 'LOGIN' })
    return authResult.accessToken
  }

  async function refreshSession() {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const executeRefresh = async () => {
      const response = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken() }
      })
      if (!response.ok) throw new Error('Refresh failed')
      const data = await response.json()
      return persistSession(data?.result)
    }

    refreshPromiseRef.current = ('locks' in navigator)
      ? navigator.locks.request('cgft-refresh', executeRefresh)
      : executeRefresh()

    try {
      return await refreshPromiseRef.current
    } finally {
      refreshPromiseRef.current = null
    }
  }

  // Core Request Wrapper
  async function makeRequest(method, endpoint, body = null, isMultipart = false) {
    const url = API_BASE + endpoint
    const headers = {}

    const currentToken = tokenRef.current
    if (currentToken && !endpoint.startsWith('/auth/')) {
      headers['Authorization'] = `Bearer ${currentToken}`
    }

    let requestOptions = {
      method: method,
      headers: headers,
      credentials: 'include'
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
          
          if (hasSession) {
            console.log('Attempting automatic token refresh...')
            try {
              const newAccessToken = await refreshSession()
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

    await loadPublicStores(0, false)

    const activeToken = tokenRef.current
    if (activeToken) {
      await Promise.all([loadSavedStores(), loadMyStores()])
    } else {
      setOwnedStores([])
    }

    setLoading(false)
  }

  async function loadPublicStores(page = 0, append = false) {
    const requestId = ++publicStoreRequestRef.current
    if (append) setLoadingMoreStores(true)
    const params = new URLSearchParams({ page: String(page), size: '24', sort: 'newest' })
    if (searchQuery.trim()) params.set('query', searchQuery.trim())
    const categoryIds = publicFilters.categoryIds.length > 0
      ? publicFilters.categoryIds
      : (selectedCategory?.id ? [selectedCategory.id] : [])
    categoryIds.forEach((id) => params.append('categoryIds', String(id)))
    if (publicFilters.openNow) params.set('openNow', 'true')
    if (publicFilters.nearMe && publicFilters.latitude != null && publicFilters.longitude != null) {
      params.set('latitude', String(publicFilters.latitude))
      params.set('longitude', String(publicFilters.longitude))
      params.set('radiusKm', '10')
      params.set('sort', 'distance')
    }
    const storeRes = await makeRequest('GET', `/v1/stores?${params.toString()}`)
    if (requestId !== publicStoreRequestRef.current) {
      if (append) setLoadingMoreStores(false)
      return
    }
    if (storeRes.success && storeRes.data.result) {
      const result = storeRes.data.result
      const content = Array.isArray(result) ? result : (result.content || [])
      setStores((previous) => append
        ? [...new Map([...previous, ...content].map((store) => [store.id, store])).values()]
        : content)
      setStorePage(Array.isArray(result)
        ? { page: 0, totalPages: 1, totalElements: content.length, last: true }
        : result)
    }
    if (!append) {
      const facetParams = new URLSearchParams()
      if (searchQuery.trim()) facetParams.set('query', searchQuery.trim())
      if (publicFilters.openNow) facetParams.set('openNow', 'true')
      if (publicFilters.nearMe && publicFilters.latitude != null && publicFilters.longitude != null) {
        facetParams.set('latitude', String(publicFilters.latitude))
        facetParams.set('longitude', String(publicFilters.longitude))
        facetParams.set('radiusKm', '10')
      }
      const facetRes = await makeRequest('GET', `/v1/stores/facets?${facetParams.toString()}`)
      if (requestId === publicStoreRequestRef.current && facetRes.success) {
        setStoreFacets(facetRes.data.result || {})
      }
    }
    if (append) setLoadingMoreStores(false)
  }

  async function loadMorePublicStores() {
    if (loadingMoreStores || storePage.last) return
    await loadPublicStores((storePage.page || 0) + 1, true)
  }

  async function loadMyStores(page = 0, append = false) {
    const activeToken = tokenRef.current
    if (!activeToken) {
      setOwnedStores([])
      return
    }
    const res = await makeRequest('GET', `/v1/stores/mine?page=${page}&size=20`)
    if (res.success && res.data.result) {
      const result = res.data.result
      const content = result.content || result
      setOwnedStores((previous) => append ? [...new Map([...previous, ...content].map((store) => [store.id, store])).values()] : content)
      if (!Array.isArray(result)) setOwnedStoresPage(result)
    }
  }

  // Load saved stores for current logged in user
  async function loadSavedStores(page = 0, append = false) {
    const activeToken = tokenRef.current
    if (!activeToken) {
      setSavedStores([])
      return
    }
    const res = await makeRequest('GET', `/v1/stores/saved?page=${page}&size=24`)
    if (res.success && res.data.result) {
      const result = res.data.result
      const content = result.content || result
      setSavedStores((previous) => append ? [...new Map([...previous, ...content].map((store) => [store.id, store])).values()] : content)
      if (!Array.isArray(result)) setSavedStoresPage(result)
    }
  }

  // Toggle Save / Bookmark Store
  async function handleToggleSaveStore(storeId) {
    const activeToken = tokenRef.current
    if (!activeToken) {
      showToast('Vui lòng đăng nhập để lưu quán ăn yêu thích.', 'info')
      setAuthMode('login')
      setShowAuthModal(true)
      return
    }

    const res = await makeRequest('POST', `/v1/stores/${storeId}/save`)
    if (res.success && res.data.result) {
      const isSaved = res.data.result.isSaved
      const savedCount = res.data.result.savedCount

      showToast(isSaved ? 'Đã lưu quán ăn vào danh sách của bạn!' : 'Đã bỏ lưu quán ăn.', 'success')

      // Synchronize stores state instantly
      setStores((prevStores) =>
        prevStores.map((st) =>
          st.id === storeId ? { ...st, isSaved, savedCount } : st
        )
      )

      // Synchronize activeStore drawer state if open
      if (activeStore && activeStore.id === storeId) {
        setActiveStore((prev) => (prev ? { ...prev, isSaved, savedCount } : null))
      }

      // Refresh saved stores list
      loadSavedStores()
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể thực hiện thao tác lưu quán.'), 'error')
    }
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
      persistSession(res.data.result, true)
      
      showToast('Chào mừng bạn quay trở lại Cần Giuộc FoodTour!', 'success')
      setShowAuthModal(false)
      setLoginEmail('')
      setLoginPassword('')
    } else {
      if (res.error?.code === 1011) {
        setResendEmail(loginEmail.trim())
        setAuthMode('verify')
      }
      showToast(getVietnameseApiError(res.error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'), 'error')
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

    if (regPassword.length < 8 || regPassword.length > 72) {
      showToast('Mật khẩu phải có từ 8 đến 72 ký tự', 'error')
      return
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Mật khẩu và Xác nhận mật khẩu không trùng khớp!', 'error')
      return
    }

    if (!regFirstname.trim() || !regLastname.trim()) {
      showToast('Họ và tên không được để trống', 'error')
      return
    }

    if (!isAtLeast18(regDob)) {
      showToast('Bạn phải đủ 18 tuổi để đăng ký', 'error')
      return
    }

    setLoading(true)
    const res = await makeRequest('POST', '/auth/register', {
      username: cleanUsername,
      email: cleanEmail,
      firstname: regFirstname.trim(),
      lastname: regLastname.trim(),
      password: regPassword,
      dateOfBirth: regDob
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
      setRegDob('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Đăng ký thất bại.'), 'error')
    }
  }

  // Verify email
  async function handleVerifyEmail(e) {
    e.preventDefault()
    setLoading(true)
    const res = await makeRequest('POST', '/auth/verify-email', { token: verifyTokenVal.trim() })
    setLoading(false)

    if (res.success) {
      showToast('Xác thực Email thành công! Bạn có thể đăng nhập ngay bây giờ.', 'success')
      setAuthMode('login')
      setVerifyTokenVal('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.'), 'error')
    }
  }

  // Forgot Password request OTP
  async function handleForgotPassword(e) {
    if (e && e.preventDefault) e.preventDefault()
    const targetEmail = (forgotEmail || resetEmail).trim()
    if (!targetEmail) {
      showToast('Vui lòng nhập email để nhận mã OTP.', 'error')
      return
    }
    setLoading(true)
    const res = await makeRequest('POST', '/auth/forgot-password', { email: targetEmail })
    setLoading(false)

    if (res.success) {
      showToast('Đã gửi mã OTP đặt lại mật khẩu vào email của bạn!', 'success')
      setResetEmail(targetEmail)
      setForgotStep(2)
      setForgotEmail('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Gửi mã OTP thất bại.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Mã OTP không đúng hoặc đã hết hạn.'), 'error')
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
      // Reset password revokes every token that was issued before the reset.
      setToken('')
      tokenRef.current = ''
      setHasSession(false)
      setCurrentUser(null)
      setOwnedStores([])
      setAdminStores([])
      setAdminPendingStores([])
      showToast('Đổi mật khẩu thành công! Hãy đăng nhập.', 'success')
      setAuthMode('login')
      setResetEmail('')
      setResetOtp('')
      setResetPassword('')
      setResetConfirmPassword('')
      setForgotStep(1)
    } else {
      showToast(getVietnameseApiError(res.error, 'Đổi mật khẩu thất bại.'), 'error')
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
      persistSession(res.data.result, true)
      showToast('Đăng nhập bằng Google thành công!', 'success')
      setShowAuthModal(false)
      setSocialGoogleToken('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Đăng nhập Google thất bại.'), 'error')
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
      persistSession(res.data.result, true)
      showToast('Đăng nhập bằng Facebook thành công!', 'success')
      setShowAuthModal(false)
      setSocialFacebookToken('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Đăng nhập Facebook thất bại.'), 'error')
    }
  }

  // Popup Facebook SDK Login
  function handleFacebookSDKLogin() {
    if (typeof window.FB === 'undefined') {
      showToast('Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau giây lát.', 'error')
      return
    }
    try {
      window.FB.init({
        appId: frontendConfig.facebookAppId,
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
    if (!hasSession) {
      showToast('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.', 'error')
      return
    }
    setLoading(true)
    try {
      await refreshSession()
      showToast('Làm mới phiên làm việc thành công.', 'success')
    } catch {
      showToast('Phiên làm việc đã hết hạn. Đang đăng xuất.', 'error')
      handleLogout()
    } finally {
      setLoading(false)
    }
  }

  // Logout
  async function handleLogout() {
    if (logoutPromiseRef.current) return logoutPromiseRef.current

    logoutPromiseRef.current = (async () => {
      const accessToken = tokenRef.current
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), 3000)

      // Start server-side revocation before clearing the local token pair. Local cleanup is
      // immediate and is never blocked by network/backend availability.
      const revokeRequest = hasSession
        ? fetch(API_BASE + '/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              'X-CSRF-Token': csrfToken()
            },
            signal: abortController.signal
          })
        : Promise.resolve(null)

      setToken('')
      tokenRef.current = ''
      setHasSession(false)
      setCurrentUser(null)
      authChannelRef.current?.postMessage({ type: 'LOGOUT' })
      setAvatarPreview('')
      setAvatarFile(null)
      setEditingStore(null)
      showToast('Đã đăng xuất khỏi Cần Giuộc FoodTour.', 'info')
      navigate('/explore')

      try {
        const response = await revokeRequest
        if (response && !response.ok) {
          console.warn('Server-side logout was not acknowledged')
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Server-side logout failed', error)
        }
      } finally {
        clearTimeout(timeout)
      }
    })()

    try {
      return await logoutPromiseRef.current
    } finally {
      logoutPromiseRef.current = null
    }
  }

  refreshSessionRef.current = refreshSession
  handleLogoutRef.current = handleLogout

  // Update profile basic info
  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (!upUsername.trim() || !upFirstname.trim() || !upLastname.trim()) {
      showToast('Thông tin họ tên và username không được để trống.', 'error')
      return
    }
    if (!isAtLeast18(upDob)) {
      showToast('Ngày sinh phải tương ứng độ tuổi từ 18 trở lên.', 'error')
      return
    }
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
      showToast(getVietnameseApiError(res.error, 'Cập nhật thông tin cá nhân thất bại.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Tải ảnh đại diện thất bại.'), 'error')
    }
  }

  function handleCancelAvatarSelection() {
    setAvatarFile(null)
    setAvatarPreview(currentUser?.avatarUrl || '')
  }

  async function uploadManagedImage(endpoint, file) {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)

    const res = await makeRequest('PATCH', endpoint, formData, true)

    if (res.success && res.data.result) {
      return res.data.result
    } else {
      showToast(getVietnameseApiError(res.error, 'Tải ảnh thất bại.'), 'error')
      return null
    }
  }

  async function handleUploadStoreBanner(storeId, file) {
    const result = await uploadManagedImage(`/v1/stores/${storeId}/banner`, file)
    if (result) await loadGlobalData()
    return result
  }

  async function handleUploadFoodImage(foodId, file) {
    const result = await uploadManagedImage(`/v1/food-items/${foodId}/image`, file)
    if (result) await loadGlobalData()
    return result
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
      await handleLogout()
      setShowAuthModal(true)
      setAuthMode('login')
      setPwdOld('')
      setPwdNew('')
    } else {
      showToast(getVietnameseApiError(res.error, 'Đổi mật khẩu thất bại.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Tạo danh mục thất bại.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Không thể cập nhật danh mục.'), 'error')
      return false
    }
  }

  // Delete Category (Admin)
  async function handleDeleteCategory(id) {
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/categories/${id}`)
    setLoading(false)

    if (res.success) {
      showToast('Xóa danh mục thành công!', 'success')
      loadGlobalData()
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể xóa danh mục.'), 'error')
      return false
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
      showToast(getVietnameseApiError(res?.error, 'Không thể đăng ký quán ăn.'), 'error')
      return null
    }
  }

  // Select store for edit
  function handleSelectEditStore(store) {
    setEditingStore(store)
  }

  async function handleOpenOwnedStore(storeId) {
    const response = await makeRequest('GET', `/v1/stores/mine/${encodeURIComponent(storeId)}`)
    if (response.success && response.data?.result) {
      openActiveStore(response.data.result)
      return
    }
    showToast(getVietnameseApiError(response?.error, 'Không thể mở thông tin quán.'), 'error')
  }

  async function handleEditOwnedStore(storeId) {
    const response = await makeRequest('GET', `/v1/stores/mine/${encodeURIComponent(storeId)}`)
    if (response.success && response.data?.result) {
      setEditingStore(response.data.result)
      return
    }
    showToast(getVietnameseApiError(response?.error, 'Không thể tải quán để chỉnh sửa.'), 'error')
  }

  // Update Store (Owner / Admin)
  async function handleUpdateStore(e, bannerFile = null) {
    e.preventDefault()
    const storePayload = {
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
    }
    const formData = new FormData()
    formData.append('store', new Blob([JSON.stringify(storePayload)], { type: 'application/json' }))
    if (bannerFile) formData.append('banner', bannerFile)
    const res = await makeRequest('PUT', `/v1/stores/${editingStore.id}`, formData, true)

    if (res.success && res.data.result) {
      showToast(`Quán "${editingStore.name}" đã được cập nhật!`, 'success')
      await loadGlobalData()
      return res.data.result
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể cập nhật quán ăn.'), 'error')
      return null
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
      if (activeTab === 'admin') await loadAdminPendingStores()
      return res.data || true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể ẩn quán ăn.'), 'error')
      return false
    }
  }

  // Recover Store (Admin)
  async function handleRecoverStore(storeId, reason) {
    const res = await makeRequest('POST', `/v1/stores/${storeId}/recover`, { reason })
    if (res.success) {
      showToast('Đã khôi phục quán ăn!', 'success')
      await loadGlobalData()
      if (activeTab === 'admin') await loadAdminPendingStores()
      return res.data || true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể khôi phục quán ăn.'), 'error')
      return false
    }
  }

  // Request Recovery (Owner)
  async function handleRequestStoreRecovery(storeId, reason) {
    const res = await makeRequest('POST', `/v1/stores/${storeId}/request-recovery`, { reason })
    if (res.success) {
      showToast('Đã gửi yêu cầu khôi phục quán ăn!', 'success')
      await loadGlobalData()
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể gửi yêu cầu khôi phục.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Không thể từ chối yêu cầu khôi phục.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Không thể xóa quán ăn.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Không thể xóa vĩnh viễn quán ăn.'), 'error')
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
      description: foodDesc
    })

    if (res.success) {
      const createdFood = res.data.result
      showToast(`Món "${foodName}" đã được thêm vào thực đơn thành công!`, 'success')
      setFoodName('')
      setFoodPrice(0)
      setFoodImage('')
      setFoodDesc('')
      loadGlobalData()
      setLoading(false)
      return createdFood
    } else {
      setLoading(false)
      showToast(getVietnameseApiError(res.error, 'Thêm món ăn thất bại.'), 'error')
      return null
    }
  }

  // Update Food Item
  async function handleUpdateFoodItem(foodId, foodData) {
    setLoading(true)
    const res = await makeRequest('PUT', `/v1/food-items/${foodId}`, {
      name: foodData.name,
      price: parseFloat(foodData.price) || 0,
      description: foodData.description
    })
    setLoading(false)

    if (res.success) {
      showToast(`Món ăn "${foodData.name}" đã được cập nhật!`, 'success')
      loadGlobalData()
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể cập nhật món ăn.'), 'error')
      return false
    }
  }

  // Delete Food Item
  async function handleDeleteFoodItem(foodId) {
    setLoading(true)
    const res = await makeRequest('DELETE', `/v1/food-items/${foodId}`)
    setLoading(false)

    if (res.success) {
      showToast('Món ăn đã được xóa thành công!', 'success')
      loadGlobalData()
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể xóa món ăn.'), 'error')
      return false
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
      showToast(getVietnameseApiError(res.error, 'Đánh giá thất bại.'), 'error')
    }
  }

  // Submit Report Store Closed Today
  async function handleReportClosedToday(storeId) {
    if (!token) {
      showToast('Vui lòng đăng nhập để báo quán đóng cửa.', 'error')
      setShowAuthModal(true)
      return
    }

    if (!('geolocation' in navigator) || !navigator.geolocation) {
      showToast('Trình duyệt của bạn không hỗ trợ định vị GPS.', 'error')
      return
    }

    const position = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ pos, error: null }),
        (err) => resolve({ pos: null, error: err }),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })

    if (position.error) {
      const code = position.error.code
      if (code === 1) {
        showToast('Vui lòng cấp quyền truy cập vị trí GPS trong trình duyệt để xác thực khoảng cách tới quán.', 'error')
      } else if (code === 2) {
        showToast('Không thể xác định vị trí hiện tại. Vui lòng bật định vị GPS trên thiết bị.', 'error')
      } else if (code === 3) {
        showToast('Quá thời gian xác định vị trí GPS. Vui lòng thử lại.', 'error')
      } else {
        showToast('Không thể lấy thông tin vị trí GPS. Vui lòng thử lại.', 'error')
      }
      return
    }

    const { latitude, longitude } = position.pos?.coords || {}
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      showToast('Tọa độ GPS nhận được không hợp lệ.', 'error')
      return
    }

    setLoading(true)
    const res = await makeRequest('POST', `/v1/stores/${storeId}/report-closed`, {
      latitude,
      longitude
    })
    setLoading(false)

    if (res.success && res.data.result) {
      const closedState = res.data.result.isReportedClosed ? 'CÓ (Đã báo đóng cửa hôm nay)' : 'CHƯA (Cần thêm lượt báo)'
      showToast(`Đã gửi báo cáo đóng cửa! Trạng thái: ${closedState}`, 'success')
      loadGlobalData()
    } else {
      showToast(getVietnameseApiError(res.error, 'Xác thực khoảng cách GPS thất bại (Bạn cần ở vị trí cách quán dưới 100m).'), 'error')
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
  async function loadAdminUsers(options) {
    const requestId = ++adminUserRequestSequenceRef.current
    const request = options === undefined
      ? adminUserRequestRef.current
      : typeof options === 'number'
        ? { ...adminUserRequestRef.current, page: options }
        : { ...adminUserRequestRef.current, ...options }
    adminUserRequestRef.current = request
    const params = new URLSearchParams({ page: String(request.page || 0), size: '20', sort: 'newest' })
    if (request.query) params.set('query', request.query)
    if (request.role && request.role !== 'ALL') params.set('role', request.role)
    const res = await makeRequest('GET', `/users?${params.toString()}`)
    if (requestId !== adminUserRequestSequenceRef.current) return
    if (res.success && res.data.result) {
      const result = res.data.result
      setAdminUsersList(result.content || result)
      if (result.content) setAdminUsersPage(result)
    } else {
      showToast('Quyền Admin bị từ chối hoặc tải danh sách người dùng thất bại.', 'error')
    }
  }

  // Admin View - Pending stores retrieve
  async function loadAdminPendingStores(options) {
    const requestId = ++adminStoreRequestSequenceRef.current
    const request = options === undefined
      ? adminStoreRequestRef.current
      : typeof options === 'number'
        ? { ...adminStoreRequestRef.current, page: options }
        : { ...adminStoreRequestRef.current, ...options }
    adminStoreRequestRef.current = request
    const params = new URLSearchParams({ page: String(request.page || 0), size: '20', sort: 'newest' })
    if (request.query) params.set('query', request.query)
    if (request.status && request.status !== 'ALL') params.set('status', request.status)
    if (request.categoryId && request.categoryId !== 'ALL') params.set('categoryId', String(request.categoryId))
    const res = await makeRequest('GET', `/v1/stores/admin?${params.toString()}`)
    const summaryRes = await makeRequest('GET', '/v1/stores/admin/summary')
    if (requestId !== adminStoreRequestSequenceRef.current) return
    if (res.success && res.data.result) {
      const result = res.data.result
      const content = result.content || result
      setAdminStores(content)
      if (result.content) setAdminStoresPage(result)
      // filter only PENDING submissions
      setAdminPendingStores(content.filter((s) => s.status === 'PENDING'))
    }
    if (summaryRes.success) setAdminStoreSummary(summaryRes.data.result || {})
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
      showToast(getVietnameseApiError(res.error, 'Duyệt quán ăn thất bại.'), 'error')
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
      showToast(getVietnameseApiError(res.error, 'Từ chối quán ăn thất bại.'), 'error')
      return false
    }
  }

  // Admin View - Delete user account
  async function handleAdminDeleteUser(user, confirmation, reason) {
    setLoading(true)
    const res = await makeRequest('DELETE', `/users/${user.id}`, { confirmation, reason: reason.trim() })
    setLoading(false)

    if (res.success) {
      showToast('Xóa tài khoản người dùng thành công.', 'success')
      loadAdminUsers()
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Xóa tài khoản thất bại.'), 'error')
      return false
    }
  }

  async function handleAdminDisableUser(user, reason) {
    if (!reason?.trim()) return false
    const res = await makeRequest('POST', `/users/${user.id}/disable`, { reason: reason.trim() })
    if (res.success) {
      showToast('Đã khóa tài khoản và thu hồi toàn bộ phiên đăng nhập.', 'success')
      await Promise.all([loadAdminUsers(), loadAdminPendingStores(), loadGlobalData()])
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể khóa tài khoản.'), 'error')
      return false
    }
  }

  async function handleAdminEnableUser(user) {
    const res = await makeRequest('POST', `/users/${user.id}/enable`, {})
    if (res.success) {
      showToast('Đã mở khóa tài khoản.', 'success')
      await Promise.all([loadAdminUsers(), loadAdminPendingStores(), loadGlobalData()])
      return true
    } else {
      showToast(getVietnameseApiError(res.error, 'Không thể mở khóa tài khoản.'), 'error')
      return false
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

    if (rolesArray.length === 0) {
      showToast('Người dùng phải có ít nhất một vai trò.', 'error')
      return
    }
    if (!adminUserUsername.trim() || !adminUserFirst.trim() || !adminUserLast.trim()) {
      showToast('Thông tin người dùng không được để trống.', 'error')
      return
    }
    if (!isAtLeast18(adminUserDob)) {
      showToast('Ngày sinh phải tương ứng độ tuổi từ 18 trở lên.', 'error')
      return
    }

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
      showToast(getVietnameseApiError(res.error, 'Cập nhật thất bại.'), 'error')
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
  const myStores = ownedStores

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
      <main className={activeTab === 'admin' ? 'h-full w-full p-0 pb-20 md:pb-0 animate-fade-in-up' : 'max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 md:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-24 md:pb-8 animate-fade-in-up'}>

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
            setActiveStore={openActiveStore}
            handleRandomPick={handleRandomPick}
            rollingRandom={rollingRandom}
            randomResult={randomResult}
            setRandomResult={setRandomResult}
            loadLeaderboard={loadLeaderboard}
            leaderboard={leaderboard}
            switchTab={switchTab}
            handleToggleSaveStore={handleToggleSaveStore}
            hasMoreServerStores={!storePage.last}
            loadMoreServerStores={loadMorePublicStores}
            loadingMoreStores={loadingMoreStores}
            totalStoreCount={storePage.totalElements || stores.length}
            onServerFiltersChange={setPublicFilters}
            categoryFacets={storeFacets}
          />
        )}

        {/* ========================================================================= */}
        {/* SAVED STORES TAB */}
        {/* ========================================================================= */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <SavedStoresSection
              savedStores={savedStores}
              loadSavedStores={loadSavedStores}
              handleToggleSaveStore={handleToggleSaveStore}
              setActiveStore={openActiveStore}
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
              currentUser={currentUser}
              switchTab={switchTab}
              onNavigateExplore={() => switchTab('explore')}
            />
            {!savedStoresPage.last && (
              <button className="brutalist-btn-white mx-auto block" onClick={() => loadSavedStores(savedStoresPage.page + 1, true)}>
                Xem thêm ({savedStores.length}/{savedStoresPage.totalElements})
              </button>
            )}
          </div>
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
                setActiveStore={openActiveStore}
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
              setActiveStore={openActiveStore}
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
              handleUploadStoreBanner={handleUploadStoreBanner}
              handleUploadFoodImage={handleUploadFoodImage}
              loadGlobalData={loadGlobalData}
              makeRequest={makeRequest}
              handleOpenOwnedStore={handleOpenOwnedStore}
              handleEditOwnedStore={handleEditOwnedStore}
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
              stores={adminStores}
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
              adminStoreSummary={adminStoreSummary}
              handleAdminApprove={handleAdminApprove}
              handleAdminReject={handleAdminReject}
              handleHideStore={handleHideStore}
              handleRecoverStore={handleRecoverStore}
              handleRejectRecoveryRequest={handleRejectRecoveryRequest}
              handleHardDeleteStore={handleHardDeleteStore}
              adminUsersList={adminUsersList}
              handleOpenAdminEditUser={handleOpenAdminEditUser}
              handleAdminDeleteUser={handleAdminDeleteUser}
              handleAdminDisableUser={handleAdminDisableUser}
              handleAdminEnableUser={handleAdminEnableUser}
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
              adminUsersPage={adminUsersPage}
              adminStoresPage={adminStoresPage}
            />
            {!ownedStoresPage.last && (
              <button className="brutalist-btn-white mx-auto block mt-4" onClick={() => loadMyStores(ownedStoresPage.page + 1, true)}>
                Xem thêm ({ownedStores.length}/{ownedStoresPage.totalElements})
              </button>
            )}
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
        googleSdkReady={googleSdkReady}
        facebookSdkReady={facebookSdkReady}
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
        loading={loading}
        showToast={showToast}
      />

      <StoreDetailDrawer
        activeStore={activeStore}
        setActiveStore={setActiveStore}
        onClose={closeActiveStore}
        handleSubmitRating={handleSubmitRating}
        handleReportClosedToday={handleReportClosedToday}
        handleToggleSaveStore={handleToggleSaveStore}
      />

      {import.meta.env.DEV && DevConsole && isAdmin() && (
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
