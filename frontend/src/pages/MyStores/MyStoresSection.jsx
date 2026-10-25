/* oxlint-disable react/only-export-components, react/set-state-in-effect, react-hooks/exhaustive-deps -- parser remains tested export, state reset syncs with store prop */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  MapPin,
  PlusCircle,
  Utensils,
  EyeOff,
  RotateCcw,
  HelpCircle,
  Link as LinkIcon,
  CheckCircle2,
  Bookmark,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  Clock,
  Image as ImageIcon
} from 'lucide-react'
import MySubmissionsSection from './MySubmissionsSection'
import StoreActionModal from '@/components/modals/StoreActionModal'
import ConfirmActionModal from '@/components/modals/ConfirmActionModal'
import CategoryIcon from '@/components/common/CategoryIcon'
import { FOOD_FALLBACK_IMAGE, STORE_FALLBACK_IMAGE } from '@/utils/imageAssets'

// Hoisted RegExp patterns per Vercel Best Practices (js-hoist-regexp)
const RE_3D_4D = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/
const RE_AT_LAT_LNG = /@(-?\d+\.\d+),(-?\d+\.\d+)/
const RE_QUERY_LAT_LNG = /[?&](?:q|ll|query|destination|near|center|point)=(-?\d+\.\d+),(-?\d+\.\d+)/
const RE_PLACE_LAT_LNG = /\/(?:place|dir|search|maps)\/(-?\d+\.\d+),(-?\d+\.\d+)/
const RE_DIRECT_LAT_LNG = /(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)/

// Utility function to extract latitude & longitude from Google Maps URL or text
export function parseGoogleMapsUrl(input) {
  if (!input) return null
  const str = input.trim()

  // 1. Check for !3d10.51234!4d106.65432 format (Google Maps place data params - exact pin location)
  const dMatch = str.match(RE_3D_4D)
  if (dMatch) {
    return { latitude: dMatch[1], longitude: dMatch[2] }
  }

  // 2. Check for @lat,lng format in URL (e.g. https://www.google.com/maps/place/.../@10.51234,106.65432,17z)
  const atMatch = str.match(RE_AT_LAT_LNG)
  if (atMatch) {
    return { latitude: atMatch[1], longitude: atMatch[2] }
  }

  // 3. Check for q=lat,lng, ll=lat,lng, query=lat,lng, destination=lat,lng, etc.
  const queryMatch = str.match(RE_QUERY_LAT_LNG)
  if (queryMatch) {
    return { latitude: queryMatch[1], longitude: queryMatch[2] }
  }

  // 4. Check for /place/lat,lng or /dir/.../lat,lng or /search/lat,lng
  const placeMatch = str.match(RE_PLACE_LAT_LNG)
  if (placeMatch) {
    return { latitude: placeMatch[1], longitude: placeMatch[2] }
  }

  // 5. Flexible match for direct coordinates typed or copied anywhere in text (e.g. 10.51234, 106.65432 or 10.51234 106.65432)
  const directMatch = str.match(RE_DIRECT_LAT_LNG)
  if (directMatch) {
    const lat = parseFloat(directMatch[1])
    const lng = parseFloat(directMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { latitude: directMatch[1], longitude: directMatch[2] }
    }
  }

  return null
}

export default function MyStoresSection({
  myStores = [],
  categories = [],
  editingStore,
  setEditingStore,
  setActiveStore,
  handleParseGmapsUrl,
  handleUpdateStore,
  handleDeleteStore,
  handleHideStore,
  handleRecoverStore,
  handleRequestStoreRecovery,
  handleHardDeleteStore,
  handleSelectEditStore,
  storeName,
  setStoreName,
  storeCategoryId,
  setStoreCategoryId,
  storeDesc,
  setStoreDesc,
  storeLat,
  setStoreLat,
  storeLng,
  setStoreLng,
  storeMapUrl,
  setStoreMapUrl,
  storeAddress,
  setStoreAddress,
  storePhone,
  setStorePhone,
  storeOpen,
  setStoreOpen,
  storeClose,
  setStoreClose,
  storePriceMin,
  setStorePriceMin,
  storePriceMax,
  setStorePriceMax,
  storeBannerUrl,
  setStoreBannerUrl,
  handleCreateStore,
  loading,
  // Add dish fields
  foodName,
  setFoodName,
  foodPrice,
  setFoodPrice,
  foodImage,
  setFoodImage,
  foodDesc,
  setFoodDesc,
  setFoodStoreId,
  handleCreateFoodItem,
  handleUpdateFoodItem,
  handleDeleteFoodItem,
  handleUploadStoreBanner,
  handleUploadFoodImage,
  loadGlobalData,
  makeRequest,
  handleOpenOwnedStore,
  handleEditOwnedStore
}) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('stores') // 'stores' or 'submissions'
  const [managingDishesForStore, setManagingDishesForStore] = useState(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingFood, setUploadingFood] = useState(false)
  const [pendingBannerFile, setPendingBannerFile] = useState(null)
  const [pendingEditBannerFile, setPendingEditBannerFile] = useState(null)
  const [editBannerPreviewUrl, setEditBannerPreviewUrl] = useState('')
  const [editBannerError, setEditBannerError] = useState('')
  const [originalEditingStore, setOriginalEditingStore] = useState(null)
  const [showDiscardEditModal, setShowDiscardEditModal] = useState(false)
  const editSaveInFlightRef = useRef(false)
  const [pendingFoodFile, setPendingFoodFile] = useState(null)
  const [editingFood, setEditingFood] = useState(null)
  const [actionModalStore, setActionModalStore] = useState(null)
  const [actionModalType, setActionModalType] = useState(null) // 'HIDE', 'RECOVER', 'REQUEST_RECOVERY', 'HARD_DELETE'
  const [foodToDelete, setFoodToDelete] = useState(null)

  // Search & Filter Toolbar States
  const [storeSearchQuery, setStoreSearchQuery] = useState('')
  const [storeStatusFilter, setStoreStatusFilter] = useState('ALL') // 'ALL', 'APPROVED', 'PENDING', 'REJECTED', 'HIDDEN'
  const [storeViewMode, setStoreViewMode] = useState('grid') // 'grid' or 'table'

  // Validation feedback for Store Create Form
  const [createFormError, setCreateFormError] = useState('')

  // Google Maps Guide & Parser States
  const [isGmapsGuideOpen, setIsGmapsGuideOpen] = useState(false)
  const [guideTab, setGuideTab] = useState('pc') // 'pc' or 'mobile'
  const [editGmapsUrl, setEditGmapsUrl] = useState('')
  const [addGmapsUrl, setAddGmapsUrl] = useState('')
  const [parsingGmapsUrl, setParsingGmapsUrl] = useState(false)

  // Category Picker Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [categoryModalTarget, setCategoryModalTarget] = useState('add') // 'add' or 'edit'

  useEffect(() => {
    if (editingStore) {
      setEditGmapsUrl(editingStore.mapUrl || '')
      setOriginalEditingStore({ ...editingStore })
      setPendingEditBannerFile(null)
      setEditBannerPreviewUrl('')
      setEditBannerError('')
      setShowDiscardEditModal(false)
    } else {
      setOriginalEditingStore(null)
    }
  }, [editingStore?.id])

  useEffect(() => () => {
    if (editBannerPreviewUrl) URL.revokeObjectURL(editBannerPreviewUrl)
  }, [editBannerPreviewUrl])

  useEffect(() => {
    if (!editingStore && storeMapUrl && storeMapUrl !== addGmapsUrl) {
      setAddGmapsUrl(storeMapUrl)
    }
  }, [storeMapUrl, editingStore, addGmapsUrl])

  // Lock body scroll and register Escape listener when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isGmapsGuideOpen || isCategoryModalOpen || showDiscardEditModal
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isCategoryModalOpen) setIsCategoryModalOpen(false)
        else if (isGmapsGuideOpen) setIsGmapsGuideOpen(false)
        else if (showDiscardEditModal) setShowDiscardEditModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isGmapsGuideOpen, isCategoryModalOpen, showDiscardEditModal])

  const openCategoryModal = (target = 'add') => {
    setCategoryModalTarget(target)
    setCategorySearchQuery('')
    if (typeof loadGlobalData === 'function') {
      loadGlobalData()
    }
    setIsCategoryModalOpen(true)
  }

  const processGmapsUrlInput = async (val, isEdit = false) => {
    if (isEdit) {
      setEditGmapsUrl(val)
      if (setEditingStore) {
        setEditingStore(prev => ({ ...prev, mapUrl: val }))
      }
    } else {
      setAddGmapsUrl(val)
      if (setStoreMapUrl) setStoreMapUrl(val)
    }

    if (!val || !val.trim()) return

    // 1. Synchronous client-side parse
    const parsed = parseGoogleMapsUrl(val)
    if (parsed) {
      if (isEdit && setEditingStore) {
        setEditingStore(prev => ({
          ...prev,
          latitude: parsed.latitude,
          longitude: parsed.longitude
        }))
      }
      if (setStoreLat) setStoreLat(parsed.latitude)
      if (setStoreLng) setStoreLng(parsed.longitude)
      return
    }

    // 2. If client parse returns null and it's an HTTP URL, expand short links via backend
    if (val.trim().startsWith('http') && handleParseGmapsUrl) {
      setParsingGmapsUrl(true)
      try {
        const res = await handleParseGmapsUrl(val.trim())
        if (res && res.latitude && res.longitude) {
          if (isEdit && setEditingStore) {
            setEditingStore(prev => ({
              ...prev,
              latitude: res.latitude,
              longitude: res.longitude
            }))
          }
          if (setStoreLat) setStoreLat(res.latitude)
          if (setStoreLng) setStoreLng(res.longitude)
        }
      } finally {
        setParsingGmapsUrl(false)
      }
    }
  }

  const handleActionConfirm = async ({ reason }) => {
    if (!actionModalStore || !actionModalType) return
    const storeId = actionModalStore.id
    let success = false
    if (actionModalType === 'HIDE') {
      if (handleHideStore) success = await handleHideStore(storeId, reason)
    } else if (actionModalType === 'RECOVER') {
      if (handleRecoverStore) success = await handleRecoverStore(storeId, reason)
    } else if (actionModalType === 'REQUEST_RECOVERY') {
      if (handleRequestStoreRecovery) success = await handleRequestStoreRecovery(storeId, reason)
    } else if (actionModalType === 'HARD_DELETE') {
      if (handleHardDeleteStore) {
        success = await handleHardDeleteStore(storeId, reason)
      } else if (handleDeleteStore) {
        success = await handleDeleteStore(storeId, reason)
      }
    }
    if (success) {
      setActionModalStore(null)
      setActionModalType(null)
    }
  }

  useEffect(() => {
    if (editingFood) {
      setFoodName(editingFood.name || '')
      setFoodPrice(editingFood.price || 0)
      setFoodImage(editingFood.imageUrl || '')
      setFoodDesc(editingFood.description || '')
    } else {
      setFoodName('')
      setFoodPrice(0)
      setFoodImage('')
      setFoodDesc('')
    }
  }, [editingFood, setFoodName, setFoodPrice, setFoodImage, setFoodDesc])

  // Handle successful store creation trigger locally
  const onLocalCreateStore = async (e) => {
    e.preventDefault()
    setCreateFormError('')

    if (!storeName || !storeName.trim()) {
      setCreateFormError('Vui lòng nhập Tên quán ăn.')
      return
    }
    if (!storeCategoryId) {
      setCreateFormError('Vui lòng chọn Danh mục ẩm thực.')
      return
    }
    if (!storeDesc || !storeDesc.trim()) {
      setCreateFormError('Vui lòng nhập Mô tả hoặc điểm đặc trưng của quán.')
      return
    }
    if (!storeAddress || !storeAddress.trim()) {
      setCreateFormError('Vui lòng nhập Địa chỉ chi tiết.')
      return
    }
    if (parsingGmapsUrl) {
      setCreateFormError('Hệ thống đang giải mã link Google Maps, vui lòng chờ trong giây lát...')
      return
    }
    if (!storeLat || !storeLng) {
      setCreateFormError('Vui lòng dán link Google Maps hoặc dãy tọa độ để hệ thống tự động trích xuất vị trí GPS.')
      return
    }

    const createdStore = await handleCreateStore(e)
    if (createdStore) {
      if (pendingBannerFile) {
        setUploadingBanner(true)
        await handleUploadStoreBanner(createdStore.id, pendingBannerFile)
        setUploadingBanner(false)
        setPendingBannerFile(null)
      }
      setIsAddingNew(false)
      if (createdStore.id && setFoodStoreId) {
        setFoodStoreId(createdStore.id.toString())
      }
      setManagingDishesForStore(createdStore)
    }
  }

  const onLocalUpdateStore = async (e) => {
    e.preventDefault()
    if (editSaveInFlightRef.current) return
    editSaveInFlightRef.current = true
    setUploadingBanner(true)
    try {
      const updatedStore = await handleUpdateStore(e, pendingEditBannerFile)
      if (updatedStore) {
        setPendingEditBannerFile(null)
        setEditBannerPreviewUrl('')
        setEditBannerError('')
        setOriginalEditingStore(null)
        setEditingStore(null)
      }
    } finally {
      editSaveInFlightRef.current = false
      setUploadingBanner(false)
    }
  }

  const onLocalSubmitFoodItem = async (e) => {
    e.preventDefault()
    if (editingFood) {
      const success = await handleUpdateFoodItem(editingFood.id, {
        name: foodName,
        price: foodPrice,
        description: foodDesc
      })
      if (success) {
        if (pendingFoodFile) {
          setUploadingFood(true)
          await handleUploadFoodImage(editingFood.id, pendingFoodFile)
          setUploadingFood(false)
          setPendingFoodFile(null)
        }
        setEditingFood(null)
      }
    } else {
      const createdFood = await handleCreateFoodItem(e)
      if (createdFood && pendingFoodFile) {
        setUploadingFood(true)
        await handleUploadFoodImage(createdFood.id, pendingFoodFile)
        setUploadingFood(false)
        setPendingFoodFile(null)
      }
    }
  }

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'banner') {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!supportedTypes.includes(file.type)) {
        setCreateFormError('Chỉ hỗ trợ ảnh JPG, PNG hoặc GIF.')
        e.target.value = ''
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setCreateFormError('Ảnh banner không được vượt quá 2 MB.')
        e.target.value = ''
        return
      }
      setCreateFormError('')
      setPendingBannerFile(file)
      setStoreBannerUrl(URL.createObjectURL(file))
    } else if (type === 'editBanner') {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!supportedTypes.includes(file.type)) {
        setEditBannerError('Chỉ hỗ trợ ảnh JPG, PNG hoặc GIF.')
        e.target.value = ''
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setEditBannerError('Ảnh banner không được vượt quá 2 MB.')
        e.target.value = ''
        return
      }
      setEditBannerError('')
      setPendingEditBannerFile(file)
      setEditBannerPreviewUrl(URL.createObjectURL(file))
      e.target.value = ''
    } else if (type === 'food') {
      setPendingFoodFile(file)
      setFoodImage(URL.createObjectURL(file))
    }
  }

  const hasUnsavedStoreChanges = Boolean(
    editingStore && originalEditingStore && (
      pendingEditBannerFile || JSON.stringify(editingStore) !== JSON.stringify(originalEditingStore)
    )
  )

  const closeStoreEdit = () => {
    setPendingEditBannerFile(null)
    setEditBannerPreviewUrl('')
    setEditBannerError('')
    setOriginalEditingStore(null)
    setShowDiscardEditModal(false)
    setEditingStore(null)
  }

  const requestCloseStoreEdit = () => {
    if (uploadingBanner) return
    if (hasUnsavedStoreChanges) {
      setShowDiscardEditModal(true)
      return
    }
    closeStoreEdit()
  }

  // Find latest store information to reflect added/updated dishes immediately
  const currentSelectedStoreInfo = managingDishesForStore
    ? (myStores.find((st) => st.id.toString() === managingDishesForStore.id.toString()) || managingDishesForStore)
    : null

  // Metric KPI Statistics (Derived safely from loaded stores)
  const storeMetrics = useMemo(() => {
    const total = myStores.length
    const approved = myStores.filter((s) => s.status === 'APPROVED').length
    const pending = myStores.filter((s) => s.status === 'PENDING' || (!['APPROVED', 'REJECTED', 'HIDDEN'].includes(s.status))).length
    const attention = myStores.filter((s) => s.status === 'REJECTED' || s.status === 'HIDDEN').length
    return { total, approved, pending, attention }
  }, [myStores])

  // Filtered stores based on search query and status filter
  const filteredStores = useMemo(() => {
    return myStores.filter((st) => {
      // Status filter
      if (storeStatusFilter === 'APPROVED' && st.status !== 'APPROVED') return false
      if (storeStatusFilter === 'PENDING' && (st.status === 'APPROVED' || st.status === 'REJECTED' || st.status === 'HIDDEN')) return false
      if (storeStatusFilter === 'REJECTED' && st.status !== 'REJECTED') return false
      if (storeStatusFilter === 'HIDDEN' && st.status !== 'HIDDEN') return false

      // Search query filter
      if (storeSearchQuery.trim()) {
        const q = storeSearchQuery.toLowerCase().trim()
        const matchName = st.name?.toLowerCase().includes(q)
        const matchAddress = st.addressLine?.toLowerCase().includes(q)
        const matchCategory = st.categoryName?.toLowerCase().includes(q)
        if (!matchName && !matchAddress && !matchCategory) return false
      }

      return true
    })
  }, [myStores, storeStatusFilter, storeSearchQuery])

  if (loading && myStores.length === 0 && !editingStore) {
    return (
      <div className="space-y-8 animate-fade-in-up" role="status" aria-busy="true" aria-label="Đang tải danh sách quán ăn">
        <div className="p-6 md:p-8 brutalist-card space-y-4">
          <div className="h-6 w-48 brutalist-skeleton" />
          <div className="h-10 w-full brutalist-skeleton" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 brutalist-card h-24 brutalist-skeleton" />
          <div className="p-4 brutalist-card h-24 brutalist-skeleton" />
          <div className="p-4 brutalist-card h-24 brutalist-skeleton" />
          <div className="p-4 brutalist-card h-24 brutalist-skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 brutalist-card h-64 brutalist-skeleton" />
          <div className="p-6 brutalist-card h-64 brutalist-skeleton" />
          <div className="p-6 brutalist-card h-64 brutalist-skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-white text-black border-4 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <Store className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="brutalist-badge bg-[#ff3e3e] text-white">Cổng Chủ Quán (Owner Portal)</span>
              {loading && (
                <span className="text-[11px] font-black uppercase px-2 py-0.5 bg-[#ffe066] border-2 border-black rounded shadow-[2px_2px_0px_0px_#000] animate-pulse" role="status">
                  Đang đồng bộ...
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Quán Ăn Của Tôi
            </h2>
            <p className="text-sm font-semibold max-w-2xl text-neutral-600">
              Quản lý các địa điểm ẩm thực của bạn, cập nhật tọa độ bản đồ, giờ mở cửa và thực đơn món ăn trên hành trình Cần Giuộc FoodTour.
            </p>
          </div>
          <div className="shrink-0">
            {!editingStore && !isAddingNew && !managingDishesForStore && activeSubTab === 'stores' && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="brutalist-btn-red text-sm w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <Plus className="w-5 h-5" /> Thêm Quán Mới
              </button>
            )}
            {(editingStore || isAddingNew || managingDishesForStore) && (
              <button
                onClick={() => {
                  if (editingStore) {
                    requestCloseStoreEdit()
                    return
                  }
                  setIsAddingNew(false)
                  setManagingDishesForStore(null)
                  setEditingFood(null)
                }}
                disabled={uploadingBanner}
                className="brutalist-btn-white text-sm w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#111]"
              >
                <ChevronLeft className="w-5 h-5" /> Quay Lại Danh Sách
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation (Visible when not inside store creation, edit, or dish management) */}
      {!editingStore && !isAddingNew && !managingDishesForStore && (
        <div className="flex items-center gap-2 sm:gap-3 border-b-4 border-black pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveSubTab('stores')
              if (loadGlobalData) loadGlobalData()
            }}
            className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase transition-all border-2 border-black rounded-full shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'stores'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            <span>Quán Ăn Của Tôi</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeSubTab === 'stores' ? 'bg-white text-black' : 'bg-neutral-100 text-black border border-black'}`}>
              {myStores.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('submissions')
            }}
            className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase transition-all border-2 border-black rounded-full shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'submissions'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            <span>Lịch Sử Quán</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {editingStore ? (
        /* ========================================================================= */
        /* 1. EDIT STORE FORM (DESKTOP TWO-COLUMN MASTER LAYOUT) */
        /* ========================================================================= */
        <div className="brutalist-card bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-6xl mx-auto space-y-6">
          <div className="border-b-3 border-black pb-3 flex justify-between items-center">
            <div>
              <span className="brutalist-badge bg-black text-white text-[10px] mb-1">Chỉnh Sửa Quán</span>
              <h3 className="text-2xl font-black uppercase tracking-wider text-[#ff3e3e]">
                Chỉnh Sửa Quán Ăn
              </h3>
            </div>
            <button
              type="button"
              onClick={requestCloseStoreEdit}
              disabled={uploadingBanner}
              className="p-1.5 border-2 border-black hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Đóng form chỉnh sửa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editingStore.status === 'HIDDEN' && (
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-amber-900 text-xs font-bold space-y-1">
              <p className="font-black text-amber-950 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> Lưu ý khi cập nhật quán bị ẩn:
              </p>
              <p>Chỉnh sửa thông tin quán trong trạng thái này sẽ cập nhật dữ liệu mà không thay đổi trạng thái ẩn hiện hoặc gửi yêu cầu phê duyệt mới. Để khôi phục quán, vui lòng sử dụng chức năng "Yêu cầu khôi phục".</p>
            </div>
          )}

          <form onSubmit={onLocalUpdateStore} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Brand & Media (5 cols on Desktop) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-5">
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 text-black">
                    <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">1</span>
                    Thông Tin & Nhận Diện
                  </h4>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Quán Ăn *</label>
                    <input
                      type="text"
                      required
                      value={editingStore.name || ''}
                      onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                      className="brutalist-input"
                      placeholder="Tên quán ăn..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Danh Mục Ẩm Thực *</label>
                    <button
                      type="button"
                      onClick={() => openCategoryModal('edit')}
                      className="w-full bg-white hover:bg-neutral-50 border-2 border-black rounded-xl py-2.5 px-4 text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const foundCat = categories.find((c) => c.id.toString() === editingStore.categoryId?.toString())
                          return (
                            <>
                              <CategoryIcon icon={foundCat?.icon || foundCat?.iconUrl} name={foundCat?.name} className="w-4 h-4 text-[#ff3e3e] shrink-0" />
                              <span className="truncate text-black font-extrabold">
                                {foundCat?.name || 'Chọn danh mục'}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                      <span className="text-[10px] font-extrabold bg-neutral-100 border border-black text-black px-2 py-0.5 rounded-full shrink-0">
                        {editingStore.categoryId ? 'Đổi danh mục' : 'Chọn ngay'}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả / Điểm Đặc Trưng *</label>
                    <textarea
                      required
                      value={editingStore.landmarkNote || ''}
                      onChange={(e) => setEditingStore({ ...editingStore, landmarkNote: e.target.value })}
                      className="brutalist-input"
                      rows={3}
                      placeholder="Mô tả món ăn đặc trưng, lịch sử quán..."
                    />
                  </div>

                  {/* Banner Image */}
                  <div className="space-y-3 pt-2 border-t border-neutral-300">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Hình Ảnh Banner Quán Ăn</label>
                    <div className="border-2 border-black rounded-xl bg-white p-3 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="aspect-video w-full border-2 border-black rounded-lg overflow-hidden bg-neutral-100 relative flex items-center justify-center">
                        {(editBannerPreviewUrl || editingStore.bannerImageUrl) ? (
                          <img
                            src={editBannerPreviewUrl || editingStore.bannerImageUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-neutral-400">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[11px] font-bold">Chưa có ảnh banner</span>
                          </div>
                        )}
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="cursor-pointer brutalist-btn-white py-1.5 px-3 text-xs font-black uppercase text-center block w-full">
                          {uploadingBanner ? 'Đang Lưu...' : 'Chọn Ảnh Từ Thiết Bị'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            disabled={uploadingBanner}
                            onChange={(e) => handleFileChange(e, 'editBanner')}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] font-bold text-neutral-500 text-center">
                          Hỗ trợ JPG, PNG, GIF, tối đa 2 MB. Ảnh sẽ tải lên khi bấm Lưu.
                        </p>
                        {pendingEditBannerFile && (
                          <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-400 rounded p-2">
                            <span>Ảnh mới chưa lưu.</span>
                            <button
                              type="button"
                              disabled={uploadingBanner}
                              onClick={() => {
                                setPendingEditBannerFile(null)
                                setEditBannerPreviewUrl('')
                                setEditBannerError('')
                              }}
                              className="font-black underline cursor-pointer"
                            >
                              Bỏ ảnh mới
                            </button>
                          </div>
                        )}
                        {editBannerError && (
                          <p className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-400 rounded p-2">{editBannerError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Location, Hours, Pricing & Operations (7 cols on Desktop) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Location & GPS Box */}
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black">
                      <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">2</span>
                      Vị Trí & Bản Đồ Google Maps
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsGmapsGuideOpen(true)}
                      className="text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn lấy link
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-[#ff3e3e]" /> Link Google Maps hoặc Tọa Độ
                    </label>
                    <input
                      type="text"
                      placeholder="Dán link Google Maps hoặc dãy tọa độ (vd: https://maps.app.goo.gl/... hoặc 10.51234, 106.65432)"
                      value={editGmapsUrl}
                      onChange={(e) => processGmapsUrlInput(e.target.value, true)}
                      className="brutalist-input w-full text-xs font-semibold"
                    />
                    {parsingGmapsUrl ? (
                      <p className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 p-2 rounded animate-pulse">
                        ⏳ Đang tự động giải mã link Google Maps từ hệ thống...
                      </p>
                    ) : editingStore.latitude && editingStore.longitude ? (
                      <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 p-2 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã trích xuất thành công: Vĩ độ ({editingStore.latitude}), Kinh độ ({editingStore.longitude})
                      </p>
                    ) : editGmapsUrl ? (
                      <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 p-2 rounded">
                        Chưa tìm thấy số tọa độ trong link này. Vui lòng kiểm tra lại link hoặc dán trực tiếp dãy số tọa độ (VD: 10.51234, 106.65432).
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-500 font-semibold">
                        Dán bất kỳ liên kết Google Maps nào (bao gồm link ngắn maps.app.goo.gl) hoặc dãy số tọa độ. Hệ thống sẽ tự động giải mã.
                      </p>
                    )}
                  </div>

                  {/* Read-only Auto Parsed Coordinates */}
                  <div className="pt-2 border-t border-neutral-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-neutral-700">Tọa độ GPS tự động trích xuất:</span>
                      {editingStore.latitude && editingStore.longitude ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã lấy tọa độ
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-400 px-2 py-0.5 rounded">
                          Chưa có tọa độ (Vui lòng dán link)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">Vĩ độ (Latitude)</span>
                        <input
                          type="text"
                          readOnly
                          required
                          value={editingStore.latitude || ''}
                          className="brutalist-input text-xs font-mono bg-neutral-100 cursor-not-allowed text-neutral-700"
                          placeholder="Tự động trích xuất..."
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">Kinh độ (Longitude)</span>
                        <input
                          type="text"
                          readOnly
                          required
                          value={editingStore.longitude || ''}
                          className="brutalist-input text-xs font-mono bg-neutral-100 cursor-not-allowed text-neutral-700"
                          placeholder="Tự động trích xuất..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-300">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Cụ Thể *</label>
                      <input
                        type="text"
                        required
                        value={editingStore.addressLine || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, addressLine: e.target.value })}
                        className="brutalist-input"
                        placeholder="Số 45, Quốc Lộ 50, Cần Giuộc..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Số Điện Thoại</label>
                      <input
                        type="text"
                        value={editingStore.phoneNumber || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, phoneNumber: e.target.value })}
                        className="brutalist-input"
                        placeholder="0909xxxxxx"
                      />
                    </div>
                  </div>
                </div>

                {/* Operations & Pricing Box */}
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 text-black">
                    <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">3</span>
                    Giờ Hoạt Động & Khoảng Giá (VND)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Mở Cửa (vd: 06:00) *</label>
                      <input
                        type="text"
                        required
                        value={editingStore.openTime || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, openTime: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Đóng Cửa (vd: 22:00) *</label>
                      <input
                        type="text"
                        required
                        value={editingStore.closeTime || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, closeTime: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Thấp Nhất (VND)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editingStore.priceMin === 0 ? '' : editingStore.priceMin / 1000}
                          onChange={(e) => setEditingStore({ ...editingStore, priceMin: e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0 })}
                          className="brutalist-input pr-16"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                          .000đ
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Cao Nhất (VND)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editingStore.priceMax === 0 ? '' : editingStore.priceMax / 1000}
                          onChange={(e) => setEditingStore({ ...editingStore, priceMax: e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0 })}
                          className="brutalist-input pr-16"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                          .000đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t-3 border-black flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={requestCloseStoreEdit}
                disabled={uploadingBanner}
                className="w-full sm:w-auto brutalist-btn-white py-3 px-6 text-sm font-black uppercase cursor-pointer"
              >
                Hủy Thay Đổi
              </button>
              <button
                type="submit"
                disabled={uploadingBanner}
                className="w-full sm:w-auto brutalist-btn-red py-3 px-8 text-sm font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadingBanner ? 'Đang Lưu Thay Đổi...' : 'Lưu Thay Đổi Quán Ăn'}
              </button>
            </div>
          </form>
        </div>
      ) : isAddingNew ? (
        /* ========================================================================= */
        /* 2. ADD NEW STORE FORM (DESKTOP TWO-COLUMN MASTER LAYOUT) */
        /* ========================================================================= */
        <div className="brutalist-card bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-6xl mx-auto space-y-6">
          <div className="border-b-3 border-black pb-3 flex justify-between items-center">
            <div>
              <span className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] mb-1">Thêm Quán Ăn Mới</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-black">
                Đăng Ký Địa Điểm Ẩm Thực
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false)
                setCreateFormError('')
              }}
              className="p-1.5 border-2 border-black hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Đóng form tạo quán"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Error Message Alert */}
          {createFormError && (
            <div className="bg-red-50 border-2 border-red-500 p-3.5 rounded-xl text-red-700 text-xs font-bold flex items-center justify-between animate-fade-in-up">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                {createFormError}
              </span>
              <button
                type="button"
                onClick={() => setCreateFormError('')}
                className="text-red-900 font-black px-1.5 py-0.5 hover:bg-red-100 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <form noValidate onSubmit={onLocalCreateStore} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Basic Info & Banner (5 cols on Desktop) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-5">
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 text-black">
                    <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">1</span>
                    Bước 1: Thông Tin Cơ Bản Quán Ăn
                  </h4>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Quán Ăn *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Bánh Xèo Bà Mười"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="brutalist-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Danh Mục Ẩm Thực *</label>
                    <button
                      type="button"
                      onClick={() => openCategoryModal('add')}
                      className="w-full bg-white hover:bg-neutral-50 border-2 border-black rounded-xl py-2.5 px-4 text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const foundCat = categories.find((c) => c.id.toString() === storeCategoryId?.toString())
                          return (
                            <>
                              <CategoryIcon icon={foundCat?.icon || foundCat?.iconUrl} name={foundCat?.name} className="w-4 h-4 text-[#ff3e3e] shrink-0" />
                              <span className="truncate text-black font-extrabold">
                                {foundCat?.name || 'Chọn danh mục'}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                      <span className="text-[10px] font-extrabold bg-neutral-100 border border-black text-black px-2 py-0.5 rounded-full shrink-0">
                        {storeCategoryId ? 'Đổi danh mục' : 'Chọn ngay ↗'}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả Điểm Đặc Trưng / Landmark *</label>
                    <textarea
                      required
                      placeholder="Gần Chợ Trạm, đối diện đại lý bia. Quán bánh xèo giòn rụm lâu đời 20 năm..."
                      value={storeDesc}
                      onChange={(e) => setStoreDesc(e.target.value)}
                      className="brutalist-input"
                      rows={3}
                    />
                  </div>

                  {/* Banner Image Upload */}
                  <div className="space-y-3 pt-2 border-t border-neutral-300">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Hình Ảnh Banner Quán Ăn</label>
                    <div className="border-2 border-black rounded-xl bg-white p-3 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="aspect-video w-full border-2 border-black rounded-lg overflow-hidden bg-neutral-100 relative flex items-center justify-center">
                        {storeBannerUrl ? (
                          <img
                            src={storeBannerUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-neutral-400">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[11px] font-bold">Chưa chọn ảnh banner</span>
                          </div>
                        )}
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <label className="cursor-pointer brutalist-btn-white py-1.5 px-3 text-xs font-black uppercase text-center flex-1">
                            {uploadingBanner ? 'Đang Tải Lên...' : 'Chọn Ảnh Từ Thiết Bị'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif"
                              disabled={uploadingBanner}
                              onChange={(e) => handleFileChange(e, 'banner')}
                              className="hidden"
                            />
                          </label>
                          {storeBannerUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreBannerUrl('')
                                setPendingBannerFile(null)
                              }}
                              className="brutalist-btn-red py-1.5 px-3 text-xs font-black uppercase cursor-pointer"
                            >
                              Xóa Ảnh
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-neutral-500 text-center">
                          Hỗ trợ JPG, PNG, GIF, tối đa 2 MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Jump button to Step 2 */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.querySelector('input[placeholder*="Dán link Google Maps"]')
                        if (target) {
                          target.focus()
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }}
                      className="brutalist-btn-red py-2 px-4 text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tiếp Tục: Địa Chỉ & GPS →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Location, Hours, Pricing & Operations (7 cols on Desktop) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Location & GPS Box */}
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black">
                      <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">2</span>
                      Bước 2: Địa Chỉ & Bản Đồ Google Maps
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsGmapsGuideOpen(true)}
                      className="text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn lấy link
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5 text-[#ff3e3e]" /> Nhập Link Google Maps của Quán *
                    </label>
                    <input
                      type="text"
                      placeholder="Dán link Google Maps hoặc dãy tọa độ (vd: https://maps.app.goo.gl/... hoặc 10.51234, 106.65432)"
                      value={addGmapsUrl}
                      onChange={(e) => processGmapsUrlInput(e.target.value, false)}
                      className="brutalist-input w-full text-xs font-semibold"
                    />
                    {parsingGmapsUrl ? (
                      <p className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 p-2 rounded animate-pulse">
                        Đang tự động giải mã link Google Maps từ hệ thống...
                      </p>
                    ) : storeLat && storeLng ? (
                      <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 p-2 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã trích xuất thành công: Vĩ độ ({storeLat}), Kinh độ ({storeLng})
                      </p>
                    ) : addGmapsUrl ? (
                      <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 p-2 rounded">
                        Chưa tìm thấy số tọa độ trong link này. Vui lòng kiểm tra lại link hoặc dán trực tiếp dãy số tọa độ (VD: 10.51234, 106.65432).
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-500 font-semibold">
                        Dán bất kỳ liên kết Google Maps nào (bao gồm link ngắn maps.app.goo.gl) hoặc dãy số tọa độ. Hệ thống sẽ tự động giải mã.
                      </p>
                    )}
                  </div>

                  {/* Read-only Auto Parsed Coordinates */}
                  <div className="pt-2 border-t border-neutral-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-neutral-700">Tọa độ GPS tự động trích xuất:</span>
                      {storeLat && storeLng ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã lấy tọa độ
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-400 px-2 py-0.5 rounded">
                          Chưa có tọa độ (Vui lòng dán link)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">Vĩ độ (Latitude)</span>
                        <input
                          type="text"
                          readOnly
                          required
                          placeholder="Tự động trích xuất..."
                          value={storeLat}
                          className="brutalist-input text-xs font-mono bg-neutral-100 cursor-not-allowed text-neutral-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">Kinh độ (Longitude)</span>
                        <input
                          type="text"
                          readOnly
                          required
                          placeholder="Tự động trích xuất..."
                          value={storeLng}
                          className="brutalist-input text-xs font-mono bg-neutral-100 cursor-not-allowed text-neutral-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-300">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Chi Tiết *</label>
                      <input
                        type="text"
                        required
                        placeholder="Số 45, Quốc Lộ 50, Cần Giuộc"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Số Điện Thoại Liên Hệ</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 0909xxxxxx"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="brutalist-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Operations & Pricing Box */}
                <div className="border-2 border-black rounded-xl p-5 bg-[#f7f6f2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-2 text-black">
                    <span className="w-5 h-5 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black">3</span>
                    Giờ Hoạt Động & Khoảng Giá (VND)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Mở Cửa</label>
                      <input
                        type="text"
                        placeholder="06:00"
                        value={storeOpen}
                        onChange={(e) => setStoreOpen(e.target.value)}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Đóng Cửa</label>
                      <input
                        type="text"
                        placeholder="21:00"
                        value={storeClose}
                        onChange={(e) => setStoreClose(e.target.value)}
                        className="brutalist-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Thấp Nhất (VND)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={storePriceMin === 0 ? '' : storePriceMin / 1000}
                          onChange={(e) => setStorePriceMin(e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0)}
                          className="brutalist-input pr-16"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                          .000đ
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Cao Nhất (VND)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={storePriceMax === 0 ? '' : storePriceMax / 1000}
                          onChange={(e) => setStorePriceMax(e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0)}
                          className="brutalist-input pr-16"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                          .000đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t-3 border-black flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false)
                  setCreateFormError('')
                }}
                disabled={uploadingBanner}
                className="w-full sm:w-auto brutalist-btn-white py-3 px-6 text-sm font-black uppercase cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={uploadingBanner}
                className="w-full sm:w-auto brutalist-btn-red py-3 px-8 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadingBanner ? 'Đang Tải Ảnh...' : 'Gửi Quán Ăn Chờ Duyệt'}
              </button>
            </div>
          </form>
        </div>
      ) : managingDishesForStore ? (
        /* ========================================================================= */
        /* 3. DIRECT DISH MANAGEMENT PANEL (DESKTOP TWO-COLUMN ELEVATED LAYOUT) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Bar for Dish Management */}
          <div className="bg-white p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setManagingDishesForStore(null)
                  setEditingFood(null)
                }}
                className="brutalist-btn-white py-1.5 px-3 text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Danh Sách Quán
              </button>
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#ff3e3e]" />
                  <span>Thực Đơn: {currentSelectedStoreInfo?.name}</span>
                </h3>
                <p className="text-xs font-bold text-neutral-500">
                  {currentSelectedStoreInfo?.addressLine || 'Cần Giuộc'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="brutalist-badge bg-black text-white text-xs">
                {currentSelectedStoreInfo?.foodItems?.length || 0} Món Ăn
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form */}
            <div className="lg:col-span-5 brutalist-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-3 border-black pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase flex items-center gap-2">
                    {editingFood ? (
                      <>
                        <Edit2 className="w-5 h-5 text-[#ff3e3e]" /> Sửa Món Ăn
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5 text-[#ff3e3e]" /> Thêm Món Ăn Mới
                      </>
                    )}
                  </h3>
                  <p className="text-xs font-bold text-neutral-500 mt-1">
                    Quán ăn: <span className="text-[#ff3e3e] font-black">{currentSelectedStoreInfo?.name}</span>
                  </p>
                </div>
                {editingFood && (
                  <button
                    type="button"
                    onClick={() => setEditingFood(null)}
                    className="brutalist-badge bg-white hover:bg-neutral-100 cursor-pointer text-xs"
                  >
                    Hủy Sửa
                  </button>
                )}
              </div>

              <form onSubmit={onLocalSubmitFoodItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Món Ăn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bánh Mì Thịt Nướng"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="brutalist-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Bán (VND) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={foodPrice === 0 ? '' : foodPrice / 1000}
                      onChange={(e) => setFoodPrice(e.target.value === '' ? 0 : parseInt(e.target.value, 10) * 1000 || 0)}
                      className="brutalist-input pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs text-neutral-400 pointer-events-none">
                      .000đ
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Hình Ảnh Món Ăn</label>
                  
                  {/* Image Preview & Upload Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {(foodImage || uploadingFood) && (
                      <div className="w-24 h-24 border-2 border-black overflow-hidden bg-neutral-200 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center">
                        {foodImage && (
                          <img src={foodImage} alt="Food Preview" className="w-full h-full object-cover" />
                        )}
                        {uploadingFood && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="w-full flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer brutalist-btn-white py-1 px-3 text-xs font-black uppercase text-center flex-1 sm:flex-initial">
                          {uploadingFood ? 'Đang Tải Lên...' : 'Chọn Ảnh Từ Thiết Bị'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            disabled={uploadingFood}
                            onChange={(e) => handleFileChange(e, 'food')}
                            className="hidden"
                          />
                        </label>
                        {foodImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setFoodImage('')
                              setPendingFoodFile(null)
                            }}
                            className="brutalist-btn-red py-1 px-3 text-xs font-black uppercase cursor-pointer"
                          >
                            Xóa Ảnh
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-500">Hỗ trợ JPG, PNG, GIF. Tải lên Cloudinary tự động.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả Ngắn *</label>
                  <textarea
                    required
                    placeholder="Thịt nướng xém cạnh thơm nức mũi, đầy đủ dưa chua hành ngò..."
                    value={foodDesc}
                    onChange={(e) => setFoodDesc(e.target.value)}
                    className="brutalist-input"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingFood}
                  className="w-full brutalist-btn-red py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[3px_3px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {uploadingFood ? 'Đang Tải Ảnh...' : (editingFood ? 'Xác Nhận Cập Nhật' : 'Xác Nhận Thêm Món Ăn')}
                </button>
              </form>
            </div>

            {/* Right Column: Menu List Preview */}
            <div className="lg:col-span-7 brutalist-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-2 border-black pb-3 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase flex items-center gap-2">
                  <span>Thực Đơn Hiện Tại</span>
                </h3>
                <span className="text-xs font-bold text-neutral-600">
                  {currentSelectedStoreInfo?.foodItems?.length || 0} món
                </span>
              </div>

              {!currentSelectedStoreInfo?.foodItems || currentSelectedStoreInfo.foodItems.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 font-semibold bg-[#f7f6f2] border-2 border-dashed border-neutral-300 rounded-xl space-y-2">
                  <Utensils className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                  <p className="font-black text-black">Quán ăn này chưa có món nào trong thực đơn.</p>
                  <p className="text-xs text-neutral-500">Hãy thêm món đầu tiên bằng biểu mẫu bên cạnh để giới thiệu đặc sản của quán tới du khách!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSelectedStoreInfo.foodItems.map((food) => (
                    <div
                      key={food.id}
                      className="border-2 border-black rounded-xl bg-[#f7f6f2] flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#111] transition-all"
                    >
                      <div className="h-36 border-b-2 border-black relative bg-neutral-200 shrink-0 overflow-hidden rounded-t-[10px]">
                        <img
                          src={food.imageUrl || FOOD_FALLBACK_IMAGE}
                          alt={food.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black text-white border border-white px-2 py-0.5 rounded text-xs font-black shadow-[1px_1px_0px_0px_#fff]">
                          {food.price ? `${food.price.toLocaleString('vi-VN')}đ` : '0đ'}
                        </div>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-sm text-black line-clamp-1">{food.name}</p>
                          <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1">{food.description}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-2 pt-2 border-t border-black/10 items-center">
                          <button
                            type="button"
                            onClick={() => setEditingFood(food)}
                            className="flex-1 brutalist-btn-white py-1.5 text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setFoodToDelete(food)}
                            className="w-9 h-9 rounded-full border-2 border-black bg-white text-red-500 hover:bg-red-50 shadow-[2px_2px_0px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center shrink-0 cursor-pointer"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'submissions' ? (
        /* ========================================================================= */
        /* 4. SUBMISSIONS HISTORY TAB */
        /* ========================================================================= */
        <MySubmissionsSection
          makeRequest={makeRequest}
          invalidationKey={myStores.map((storeItem) => [
            storeItem.id,
            storeItem.status,
            storeItem.updatedAt,
            storeItem.recoveryRequested
          ].join(':')).join('|')}
          onCreateStore={() => {
            setActiveSubTab('stores')
            setIsAddingNew(true)
          }}
          onViewStore={handleOpenOwnedStore}
          onEditStore={handleEditOwnedStore}
          onManageStore={(storeId) => {
            const target = myStores.find((storeItem) => String(storeItem.id) === String(storeId))
            setActiveSubTab('stores')
            setStoreStatusFilter('HIDDEN')
            setStoreSearchQuery(target?.name || '')
          }}
        />
      ) : (
        /* ========================================================================= */
        /* 5. MY STORES DASHBOARD OVERVIEW */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* A. 4 Metric Stat Cards (Neo-Brutalist KPI Tiles) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] space-y-1">
              <div className="flex items-center justify-between text-neutral-600">
                <span className="text-[10px] font-black uppercase tracking-wider">Tổng Số Quán</span>
                <Store className="w-4 h-4 text-black" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-black">{storeMetrics.total}</div>
              <p className="text-[10px] font-bold text-neutral-500">Địa điểm đăng ký</p>
            </div>

            <div className="p-4 bg-[#e6fcf5] border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] space-y-1">
              <div className="flex items-center justify-between text-[#0ca678]">
                <span className="text-[10px] font-black uppercase tracking-wider">Đang Hoạt Động</span>
                <CheckCircle2 className="w-4 h-4 text-[#0ca678]" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#0ca678]">{storeMetrics.approved}</div>
              <p className="text-[10px] font-bold text-neutral-600">Live trên bản đồ</p>
            </div>

            <div className="p-4 bg-[#eef2ff] border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] space-y-1">
              <div className="flex items-center justify-between text-[#4338ca]">
                <span className="text-[10px] font-black uppercase tracking-wider">Chờ Phê Duyệt</span>
                <Clock className="w-4 h-4 text-[#4338ca]" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#4338ca]">{storeMetrics.pending}</div>
              <p className="text-[10px] font-bold text-neutral-600">Đang xét duyệt</p>
            </div>

            <div className="p-4 bg-[#fff5f5] border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] space-y-1">
              <div className="flex items-center justify-between text-[#c92a2a]">
                <span className="text-[10px] font-black uppercase tracking-wider">Cần Chú Ý</span>
                <AlertTriangle className="w-4 h-4 text-[#c92a2a]" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#c92a2a]">{storeMetrics.attention}</div>
              <p className="text-[10px] font-bold text-neutral-600">Bị từ chối hoặc ẩn</p>
            </div>
          </div>

          {/* B. Filter & Search Toolbar */}
          <div className="bg-white p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên quán, địa chỉ..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="brutalist-input text-xs w-full pl-9 pr-8"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {storeSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStoreSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills & View Mode */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'APPROVED', label: 'Hoạt động' },
                  { key: 'PENDING', label: 'Chờ duyệt' },
                  { key: 'REJECTED', label: 'Từ chối' },
                  { key: 'HIDDEN', label: 'Đã ẩn' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStoreStatusFilter(tab.key)}
                    className={`px-3 py-1.5 text-xs font-black rounded-full border-2 border-black transition-all cursor-pointer ${
                      storeStatusFilter === tab.key
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_#111]'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle (Desktop >= 768px) */}
              <div className="hidden md:flex items-center border-2 border-black rounded-lg overflow-hidden bg-neutral-100 p-0.5">
                <button
                  onClick={() => setStoreViewMode('grid')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    storeViewMode === 'grid'
                      ? 'bg-black text-white shadow-[1px_1px_0px_0px_#111]'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title="Chế độ lưới"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStoreViewMode('table')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    storeViewMode === 'table'
                      ? 'bg-black text-white shadow-[1px_1px_0px_0px_#111]'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                  title="Chế độ bảng dữ liệu"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* C. Store List Content */}
          {filteredStores.length === 0 ? (
            <div className="brutalist-card bg-white p-8 sm:p-12 text-center space-y-4">
              <Store className="w-12 h-12 text-neutral-400 mx-auto" />
              <p className="font-extrabold text-neutral-700 text-base">
                {myStores.length === 0
                  ? 'Bạn chưa đăng quán ăn nào trên hệ thống.'
                  : 'Không tìm thấy quán ăn nào khớp với bộ lọc hiện tại.'}
              </p>
              {myStores.length === 0 ? (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="brutalist-btn-red text-xs py-2.5 px-6 font-black uppercase cursor-pointer"
                >
                  + Đăng Quán Ăn Đầu Tiên Của Bạn
                </button>
              ) : (
                <button
                  onClick={() => {
                    setStoreSearchQuery('')
                    setStoreStatusFilter('ALL')
                  }}
                  className="brutalist-btn-white text-xs py-2 px-4 font-black uppercase cursor-pointer"
                >
                  Xóa Bộ Lọc
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 💻 DESKTOP TABLE VIEW (Visible when storeViewMode === 'table' on md+) */}
              {storeViewMode === 'table' ? (
                <div className="hidden md:block brutalist-card bg-white overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-3 border-black">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white text-xs font-black uppercase tracking-wider border-b-3 border-black">
                          <th className="p-3.5">Quán Ăn</th>
                          <th className="p-3.5">Vị Trí & Tọa Độ</th>
                          <th className="p-3.5">Hoạt Động & Giá</th>
                          <th className="p-3.5">Trạng Thái</th>
                          <th className="p-3.5 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-black text-xs font-semibold">
                        {filteredStores.map((st) => (
                          <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                            {/* Quán Ăn */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={() => setActiveStore && setActiveStore(st)}
                                  className="w-14 h-14 border-2 border-black rounded-lg overflow-hidden bg-neutral-200 shrink-0 cursor-pointer shadow-[2px_2px_0px_0px_#111]"
                                  title="Xem chi tiết"
                                >
                                  <img
                                    src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                                    alt={st.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    onClick={() => setActiveStore && setActiveStore(st)}
                                    className="font-black text-sm text-black hover:text-[#ff3e3e] text-left truncate block max-w-xs transition-colors cursor-pointer"
                                  >
                                    {st.name}
                                  </button>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="brutalist-badge bg-neutral-100 text-black text-[9px] py-0.2 px-1.5">
                                      {st.categoryName || 'Dishes'}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-neutral-600">
                                      <Bookmark className="w-2.5 h-2.5 text-[#ff3e3e] fill-[#ff3e3e]" />
                                      {st.savedCount || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Vị Trí & Tọa Độ */}
                            <td className="p-3.5">
                              <div className="space-y-1 max-w-xs">
                                <div className="flex items-start gap-1 text-[11px] text-neutral-700">
                                  <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{st.addressLine || 'Địa chỉ chưa cập nhật'}</span>
                                </div>
                                {st.latitude && st.longitude && (
                                  <span className="text-[9px] font-mono font-bold bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded inline-block text-neutral-600">
                                    GPS: {st.latitude}, {st.longitude}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Hoạt Động & Giá */}
                            <td className="p-3.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[11px] text-neutral-700 font-bold">
                                  <Clock className="w-3 h-3 text-neutral-500" />
                                  <span>{st.openTime || '06:00'} - {st.closeTime || '21:00'}</span>
                                </div>
                                <div className="text-[11px] font-extrabold text-[#ff3e3e]">
                                  {st.priceMin?.toLocaleString() || 0}đ - {st.priceMax?.toLocaleString() || 0}đ
                                </div>
                              </div>
                            </td>

                            {/* Trạng Thái */}
                            <td className="p-3.5">
                              <div className="space-y-1 max-w-xs">
                                {st.status === 'APPROVED' ? (
                                  <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] text-[10px]">
                                    Đã Duyệt (Live)
                                  </span>
                                ) : st.status === 'HIDDEN' ? (
                                  st.hiddenByAdmin ? (
                                    <div className="space-y-1">
                                      <span className="brutalist-badge bg-red-100 text-red-800 border-red-500 text-[10px]">
                                        {st.recoveryRequested ? 'Đang Chờ Khôi Phục' : 'Admin Khóa (Ban)'}
                                      </span>
                                      {st.hideReason && (
                                        <p className="text-[10px] text-red-700 italic">“{st.hideReason}”</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[10px]">
                                      Đã Ẩn (Soft Deleted)
                                    </span>
                                  )
                                ) : st.status === 'REJECTED' ? (
                                  <div className="space-y-1">
                                    <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] text-[10px]">
                                      Bị Từ Chối
                                    </span>
                                    {st.rejectionReason && (
                                      <p className="text-[10px] text-red-700 italic line-clamp-2">“{st.rejectionReason}”</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[10px]">
                                    Chờ Phê Duyệt
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Thao Tác */}
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {st.status !== 'REJECTED' && (
                                  <button
                                    onClick={() => {
                                      setManagingDishesForStore(st)
                                      setFoodStoreId(st.id)
                                    }}
                                    className="brutalist-btn-red py-1 px-2.5 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                    title="Quản lý thực đơn"
                                  >
                                    <Utensils className="w-3 h-3" /> Món Ăn
                                  </button>
                                )}

                                <button
                                  onClick={() => handleSelectEditStore(st)}
                                  className="brutalist-btn-white py-1 px-2 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit2 className="w-3 h-3" /> Sửa
                                </button>

                                {st.status === 'APPROVED' && (
                                  <button
                                    onClick={() => {
                                      setActionModalStore(st)
                                      setActionModalType('HIDE')
                                    }}
                                    className="brutalist-btn-yellow py-1 px-2 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                    title="Tạm ẩn quán"
                                  >
                                    <EyeOff className="w-3 h-3" /> Ẩn
                                  </button>
                                )}

                                {st.status === 'HIDDEN' && !st.hiddenByAdmin && (
                                  <button
                                    onClick={() => {
                                      setActionModalStore(st)
                                      setActionModalType('RECOVER')
                                    }}
                                    className="bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black rounded-full py-1 px-2.5 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                    title="Hiện lại quán"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Hiện
                                  </button>
                                )}

                                {st.status === 'HIDDEN' && st.hiddenByAdmin && !st.recoveryRequested && (
                                  <button
                                    onClick={() => {
                                      setActionModalStore(st)
                                      setActionModalType('REQUEST_RECOVERY')
                                    }}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black rounded-full py-1 px-2 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                    title="Xin khôi phục"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Khôi Phục
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setActionModalStore(st)
                                    setActionModalType('HARD_DELETE')
                                  }}
                                  className="w-7 h-7 rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-500 transition-colors shadow-[1px_1px_0px_0px_#111] flex items-center justify-center cursor-pointer"
                                  title="Xóa vĩnh viễn"
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
              ) : (
                /* 💻 DESKTOP GRID VIEW (Default md+) */
                <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStores.map((st) => (
                    <div
                      key={st.id}
                      className="brutalist-card bg-white overflow-hidden flex flex-col justify-between h-full group/desktop border-3 border-black shadow-[5px_5px_0px_0px_#111] hover:shadow-[7px_7px_0px_0px_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                    >
                      <div>
                        {/* Banner Image (Clickable to open store detail drawer) */}
                        <div
                          onClick={() => setActiveStore && setActiveStore(st)}
                          className="h-44 w-full border-b-3 border-black relative bg-neutral-200 cursor-pointer overflow-hidden"
                          title="Bấm để xem chi tiết quán ăn"
                        >
                          <img
                            src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                            alt={st.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover/desktop:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="brutalist-badge bg-white text-black shadow-[2px_2px_0px_0px_#111]">
                              {st.categoryName || 'Dishes'}
                            </span>
                          </div>

                          {/* Bookmark badge overlay (top-right) */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black shadow-[2px_2px_0px_0px_#111]">
                            <Bookmark className="w-3.5 h-3.5 text-[#ff3e3e] fill-[#ff3e3e]" />
                            <span>{st.savedCount || 0}</span>
                          </div>
                        </div>

                        {/* Store Summary Body (Clickable to open store detail drawer) */}
                        <div
                          onClick={() => setActiveStore && setActiveStore(st)}
                          className="p-5 space-y-3 cursor-pointer"
                          title="Bấm để xem chi tiết quán ăn"
                        >
                          <h3 className="text-lg font-black uppercase text-black group-hover/desktop:text-[#ff3e3e] transition-colors line-clamp-1">
                            {st.name}
                          </h3>

                          <div className="flex items-start gap-1 text-[11px] font-bold text-neutral-600">
                            <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{st.addressLine || 'Địa chỉ chưa cập nhật'}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 pt-1 border-t border-neutral-100">
                            <span className="flex items-center gap-1 font-bold">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {st.openTime || '06:00'} - {st.closeTime || '21:00'}
                            </span>
                            <span className="font-extrabold text-[#ff3e3e]">
                              {st.priceMin?.toLocaleString() || 0}đ - {st.priceMax?.toLocaleString() || 0}đ
                            </span>
                          </div>

                          <div>
                            {st.status === 'APPROVED' ? (
                              <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]">
                                Đã Duyệt (Live)
                              </span>
                            ) : st.status === 'HIDDEN' ? (
                              st.hiddenByAdmin ? (
                                <div className="space-y-1.5">
                                  {st.recoveryRequested ? (
                                    <div>
                                      <span className="brutalist-badge bg-indigo-100 text-indigo-800 border-indigo-500">
                                        Đang Chờ Admin Xem Xét Khôi Phục
                                      </span>
                                      {st.recoveryRequestReason && (
                                        <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 p-1.5 border border-indigo-300 rounded mt-1 italic">
                                          Lý do đã gửi: “{st.recoveryRequestReason}”
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="brutalist-badge bg-red-100 text-red-800 border-red-500">
                                        Đã Bị Admin Ẩn (Ban)
                                      </span>
                                      {st.hideReason && (
                                        <p className="text-[10px] font-bold text-red-700 bg-red-50 p-1.5 border border-red-300 rounded mt-1 italic">
                                          Lý do bị ẩn: “{st.hideReason}”
                                        </p>
                                      )}
                                      {st.recoveryDeclineReason && (
                                        <p className="text-[10px] font-bold text-red-700 bg-red-50 p-1.5 border border-red-300 rounded mt-1 italic">
                                          Admin từ chối trước đó: “{st.recoveryDeclineReason}”
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309]">
                                    Đã Ẩn (Soft Deleted)
                                  </span>
                                  {st.hideReason && (
                                    <p className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 border border-amber-300 rounded mt-1 italic">
                                      Lý do: “{st.hideReason}”
                                    </p>
                                  )}
                                </div>
                              )
                            ) : st.status === 'REJECTED' ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]">
                                    Bị Từ Chối
                                  </span>
                                </div>
                                {st.rejectionReason && (
                                  <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2.5 border-2 border-red-400 rounded-lg italic">
                                    Lý do: “{st.rejectionReason}”
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca]">
                                Chờ Phê Duyệt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-[#f7f6f2] border-t-3 border-black flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleSelectEditStore(st)}
                            className="flex-1 brutalist-btn-white py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-extrabold cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>

                          {st.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                setActionModalStore(st)
                                setActionModalType('HIDE')
                              }}
                              className="flex-1 brutalist-btn-yellow py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-extrabold cursor-pointer"
                              title="Ẩn quán khỏi khách hàng"
                            >
                              <EyeOff className="w-3.5 h-3.5" /> Ẩn Quán
                            </button>
                          )}

                          {st.status === 'HIDDEN' && !st.hiddenByAdmin && (
                            <button
                              onClick={() => {
                                setActionModalStore(st)
                                setActionModalType('RECOVER')
                              }}
                              className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black rounded-full py-1.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                              title="Khôi phục trạng thái hoạt động công khai"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Hiện Quán
                            </button>
                          )}

                          {st.status === 'HIDDEN' && st.hiddenByAdmin && !st.recoveryRequested && (
                            <button
                              onClick={() => {
                                setActionModalStore(st)
                                setActionModalType('REQUEST_RECOVERY')
                              }}
                              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black rounded-full py-1.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                              title="Gửi lý do xin khôi phục quán ăn"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Xin Khôi Phục
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('HARD_DELETE')
                            }}
                            className="w-9 h-9 rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0 cursor-pointer"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {st.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setManagingDishesForStore(st)
                              setFoodStoreId(st.id)
                            }}
                            className="w-full brutalist-btn-red py-1.5 text-xs flex items-center justify-center gap-1.5 font-black uppercase cursor-pointer"
                          >
                            <Utensils className="w-3.5 h-3.5" /> Quản Lý Món Ăn
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 📱 MOBILE RESPONSIVE STORE CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
                {filteredStores.map((st) => (
                  <div
                    key={st.id}
                    className="brutalist-card bg-white p-3.5 space-y-3 border-3 border-black shadow-[4px_4px_0px_0px_#111]"
                  >
                    {/* Top Row: Horizontal Image + Summary (Clickable to open store detail drawer) */}
                    <div
                      onClick={() => setActiveStore && setActiveStore(st)}
                      className="flex gap-3 cursor-pointer group/card"
                      title="Bấm để xem chi tiết quán ăn"
                    >
                      <div className="w-24 h-24 shrink-0 border-2 border-black rounded-xl overflow-hidden bg-neutral-200 relative">
                        <img
                          src={st.bannerImageUrl || STORE_FALLBACK_IMAGE}
                          alt={st.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="brutalist-badge bg-white text-black text-[9px] py-0.2 px-1.5">
                            {st.categoryName || 'Dishes'}
                          </span>
                          <span className="flex items-center gap-1 bg-[#fff9db] border border-black rounded-full px-2 py-0.2 text-[9px] font-black text-black shadow-[1px_1px_0px_0px_#111]">
                            <Bookmark className="w-2.5 h-2.5 text-[#ff3e3e] fill-[#ff3e3e]" />
                            <span>{st.savedCount || 0}</span>
                          </span>
                        </div>
                        <h3 className="text-sm font-black uppercase text-black group-hover/card:text-[#ff3e3e] transition-colors line-clamp-2 leading-snug">
                          {st.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-[#ff3e3e] shrink-0" />
                          <span className="truncate">{st.addressLine || 'Địa chỉ chưa cập nhật'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge Line */}
                    <div className="pt-1.5 border-t border-neutral-200">
                      {st.status === 'APPROVED' ? (
                        <span className="brutalist-badge bg-[#e6fcf5] text-[#0ca678] border-[#0ca678] text-[10px]">
                          Đã Duyệt (Live trên bản đồ)
                        </span>
                      ) : st.status === 'HIDDEN' ? (
                        st.hiddenByAdmin ? (
                          <div className="space-y-1">
                            {st.recoveryRequested ? (
                              <span className="brutalist-badge bg-indigo-100 text-indigo-800 border-indigo-500 text-[10px]">
                                Đang Chờ Admin Xem Xét Khôi Phục
                              </span>
                            ) : (
                              <span className="brutalist-badge bg-red-100 text-red-800 border-red-500 text-[10px]">
                                Đã Bị Admin Ẩn (Ban)
                              </span>
                            )}
                            {st.hideReason && (
                              <p className="text-[10px] font-bold text-red-700 bg-red-50 p-1.5 border border-red-300 rounded italic">
                                Lý do ẩn: “{st.hideReason}”
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="brutalist-badge bg-[#fff9db] text-[#b45309] border-[#b45309] text-[10px]">
                              Đã Ẩn (Chỉ Mình Bạn Thấy)
                            </span>
                          </div>
                        )
                      ) : st.status === 'REJECTED' ? (
                        <div className="space-y-1">
                          <span className="brutalist-badge bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a] text-[10px]">
                            Bị Từ Chối Phê Duyệt
                          </span>
                          {st.rejectionReason && (
                            <p className="text-[10px] font-bold text-red-700 bg-red-50 p-1.5 border border-red-300 rounded italic">
                              Lý do: “{st.rejectionReason}”
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="brutalist-badge bg-[#eef2ff] text-[#4338ca] border-[#4338ca] text-[10px]">
                          Đang Chờ Phê Duyệt
                        </span>
                      )}
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="pt-2 border-t-2 border-black space-y-2">
                      {st.status !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setManagingDishesForStore(st)
                            setFoodStoreId(st.id)
                          }}
                          className="w-full brutalist-btn-red py-2 text-xs flex items-center justify-center gap-1.5 font-black uppercase cursor-pointer"
                        >
                          <Utensils className="w-4 h-4" /> Quản Lý Món Ăn (Thực Đơn)
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectEditStore(st)}
                          className="flex-1 brutalist-btn-white py-1.5 px-2 text-xs flex items-center justify-center gap-1 font-extrabold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#ff3e3e]" /> Sửa
                        </button>

                        {st.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('HIDE')
                            }}
                            className="flex-1 brutalist-btn-yellow py-1.5 px-2 text-xs flex items-center justify-center gap-1 font-extrabold cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Ẩn
                          </button>
                        )}

                        {st.status === 'HIDDEN' && !st.hiddenByAdmin && (
                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('RECOVER')
                            }}
                            className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black rounded-full py-1.5 px-2 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Hiện
                          </button>
                        )}

                        {st.status === 'HIDDEN' && st.hiddenByAdmin && !st.recoveryRequested && (
                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('REQUEST_RECOVERY')
                            }}
                            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black rounded-full py-1.5 px-2 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Xin Khôi Phục
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActionModalStore(st)
                            setActionModalType('HARD_DELETE')
                          }}
                          className="w-9 h-9 rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0 cursor-pointer"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Modal for Soft Delete / Recover / Hard Delete */}
      <StoreActionModal
        key={actionModalStore ? `${actionModalType}-${actionModalStore.id}` : 'owner-store-action-closed'}
        isOpen={Boolean(actionModalStore)}
        onClose={() => {
          setActionModalStore(null)
          setActionModalType(null)
        }}
        onConfirm={handleActionConfirm}
        store={actionModalStore}
        actionType={actionModalType}
        isStaffOrAdmin={false}
      />

      {/* Food Item Delete Confirmation Modal */}
      <ConfirmActionModal
        key={foodToDelete ? `food-${foodToDelete.id}` : 'food-delete-closed'}
        isOpen={Boolean(foodToDelete)}
        title="Xóa món ăn"
        description={`Món "${foodToDelete?.name || ''}" sẽ bị xóa khỏi thực đơn. Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa món"
        onClose={() => setFoodToDelete(null)}
        onConfirm={() => handleDeleteFoodItem(foodToDelete.id)}
      />

      {/* Discard Unsaved Changes Modal */}
      {showDiscardEditModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bỏ thay đổi chưa lưu"
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <h3 className="text-lg font-black uppercase">Bỏ thay đổi chưa lưu?</h3>
              <button
                type="button"
                onClick={() => setShowDiscardEditModal(false)}
                className="p-1 border-2 border-black hover:bg-neutral-100 cursor-pointer"
                title="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-neutral-700">
              Thông tin và ảnh banner bạn vừa chọn chưa được lưu. Quay lại sẽ bỏ toàn bộ các thay đổi này.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardEditModal(false)}
                className="brutalist-btn-white py-2 px-4 text-xs font-black uppercase cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={closeStoreEdit}
                className="brutalist-btn-red py-2 px-4 text-xs font-black uppercase cursor-pointer"
              >
                Bỏ thay đổi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Google Maps Link Guide Modal */}
      {isGmapsGuideOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hướng Dẫn Lấy Link Google Maps"
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white border-4 border-black p-6 md:p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black uppercase text-black">Hướng Dẫn Lấy Link Google Maps</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGmapsGuideOpen(false)}
                className="p-1 border-2 border-black hover:bg-neutral-100 transition-colors cursor-pointer text-black"
                title="Đóng hướng dẫn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switching Navigation */}
            <div className="flex border-2 border-black bg-neutral-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setGuideTab('pc')}
                className={`flex-1 py-2.5 px-3 text-xs font-black uppercase rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guideTab === 'pc'
                    ? 'bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Máy Tính (PC / Laptop)
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('mobile')}
                className={`flex-1 py-2.5 px-3 text-xs font-black uppercase rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guideTab === 'mobile'
                    ? 'bg-indigo-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Điện Thoại (iOS / Android)
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 min-h-[220px]">
              {guideTab === 'pc' ? (
                /* Tab 1: PC Guide */
                <div className="bg-amber-50 border-2 border-amber-900 p-5 rounded-xl space-y-4 animate-fade-in">
                  <h4 className="font-black text-sm uppercase text-amber-950 flex items-center gap-2 border-b border-amber-300 pb-2">
                    Hướng dẫn cho Máy tính (PC / Laptop)
                  </h4>
                  <div className="space-y-3 text-xs font-semibold text-neutral-800 leading-relaxed">
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
                      <span>Truy cập <strong>google.com/maps</strong>. Chuyển sang chế độ <strong>Hình ảnh Vệ tinh (Satellite)</strong> ở góc dưới bên trái để dễ soi chính xác vị trí quán.</span>
                    </p>
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
                      <span><strong>Nhấp chuột phải</strong> trực tiếp vào vị trí quán &gt; Bấm chuột trái chọn ngay dòng đầu tiên (chứa dãy con số tọa độ như <em>10.51234, 106.65432</em>) để Sao chép.</span>
                    </p>
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
                      <span><strong>Dán dãy số tọa độ đó vào thanh tìm kiếm</strong> của Google Maps và ấn Enter &gt; Bấm nút <strong>Chia sẻ (Share)</strong> &gt; Chọn <strong>Sao chép liên kết</strong> rồi dán vào ô hệ thống.</span>
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab 2: Mobile Guide */
                <div className="bg-indigo-50 border-2 border-indigo-900 p-5 rounded-xl space-y-4 animate-fade-in">
                  <h4 className="font-black text-sm uppercase text-indigo-950 flex items-center gap-2 border-b border-indigo-300 pb-2">
                    Hướng dẫn cho Điện thoại (iOS / Android)
                  </h4>
                  <div className="space-y-3 text-xs font-semibold text-neutral-800 leading-relaxed">
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
                      <span>Mở app <strong>Google Maps</strong> trên điện thoại. Phóng to và <strong>nhấn giữ (chấm điểm)</strong> trực tiếp vào vị trí chính xác của quán.</span>
                    </p>
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
                      <span>Tại thanh địa điểm màu trắng kéo lên ở dưới màn hình, bấm nút <strong>Chia sẻ (Share)</strong>.</span>
                    </p>
                    <p className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
                      <span>Bấm <strong>Sao chép liên kết (Copy link)</strong> rồi dán vào ô "Nhập Link Google Maps".</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t-2 border-black">
              <button
                type="button"
                onClick={() => setIsGmapsGuideOpen(false)}
                className="brutalist-btn-white py-2.5 px-6 text-xs font-black uppercase cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Category Picker Modal Portal */}
      {isCategoryModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chọn Danh Mục Ẩm Thực"
            onClick={() => setIsCategoryModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in-up"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="brutalist-card bg-white max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#ff3e3e]" />
                  <h3 className="text-base sm:text-lg font-black uppercase text-black">
                    Chọn Danh Mục Ẩm Thực
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 border-2 border-black hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                  title="Đóng bộ chọn"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm danh mục (Bún, Cơm, Trà sữa, Lẩu...)"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="brutalist-input text-xs w-full pl-9 pr-8"
                  autoFocus
                />
                <Utensils className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-black cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category List Grid (2 items per row) */}
              <div className="overflow-y-auto max-h-[50vh] pr-1 grid grid-cols-2 gap-2 sm:gap-2.5 no-scrollbar">
                {categories
                  .filter((cat) => !categorySearchQuery.trim() || cat.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  .map((cat) => {
                    const currentSelectedId =
                      categoryModalTarget === 'add' ? storeCategoryId : editingStore?.categoryId
                    const isSelected = currentSelectedId?.toString() === cat.id?.toString()

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (categoryModalTarget === 'add') {
                            setStoreCategoryId(cat.id.toString())
                          } else if (categoryModalTarget === 'edit' && editingStore) {
                            setEditingStore({ ...editingStore, categoryId: cat.id })
                          }
                          setIsCategoryModalOpen(false)
                        }}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 border-black flex items-center justify-between gap-1.5 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#ff3e3e] text-white shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] font-black'
                            : 'bg-[#f7f6f2] hover:bg-neutral-200 text-black font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon
                            icon={cat.icon || cat.iconUrl}
                            name={cat.name}
                            className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#ff3e3e]'}`}
                          />
                          <span className="text-xs font-extrabold truncate">{cat.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-black bg-white text-[#ff3e3e] px-1.5 py-0.5 rounded-full shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}

                {categories.filter((cat) => !categorySearchQuery.trim() || cat.name?.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-neutral-500 text-xs font-bold space-y-1">
                    <p>Không tìm thấy danh mục nào với từ khóa "{categorySearchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
