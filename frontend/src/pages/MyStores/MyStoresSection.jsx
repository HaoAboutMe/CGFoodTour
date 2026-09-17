import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Store, Plus, Edit2, Trash2, X, ChevronLeft, MapPin, PlusCircle, Utensils, EyeOff, RotateCcw, HelpCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import MySubmissionsSection from './MySubmissionsSection'
import MapPicker from '@/components/common/MapPicker'
import StoreActionModal from '@/components/modals/StoreActionModal'
import CategoryIcon from '@/components/common/CategoryIcon'

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
  myStores,
  categories,
  editingStore,
  setEditingStore,
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
  handleUploadImage,
  loadGlobalData
}) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('stores') // 'stores' or 'submissions'
  const [managingDishesForStore, setManagingDishesForStore] = useState(null)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const [mapPickerTarget, setMapPickerTarget] = useState(null) // 'add' or 'edit'
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingFood, setUploadingFood] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [actionModalStore, setActionModalStore] = useState(null)
  const [actionModalType, setActionModalType] = useState(null) // 'HIDE', 'RECOVER', 'HARD_DELETE'

  const [isGmapsGuideOpen, setIsGmapsGuideOpen] = useState(false)
  const [guideTab, setGuideTab] = useState('pc') // 'pc' or 'mobile'
  const [editGmapsUrl, setEditGmapsUrl] = useState('')
  const [addGmapsUrl, setAddGmapsUrl] = useState('')
  const [parsingGmapsUrl, setParsingGmapsUrl] = useState(false)

  // Multi-step store creation states & Accordion edit sections
  const [createStep, setCreateStep] = useState(1) // 1, 2, 3
  const [createStepError, setCreateStepError] = useState('')
  const [editSections, setEditSections] = useState({ basic: true, location: true, media: true })

  useEffect(() => {
    if (editingStore) {
      setEditGmapsUrl(editingStore.mapUrl || '')
      setEditSections({ basic: true, location: true, media: true })
    }
  }, [editingStore])

  useEffect(() => {
    if (!editingStore && storeMapUrl && storeMapUrl !== addGmapsUrl) {
      setAddGmapsUrl(storeMapUrl)
    }
  }, [storeMapUrl, editingStore])

  useEffect(() => {
    if (createStep === 2 && addGmapsUrl && addGmapsUrl.trim() && (!storeLat || !storeLng) && !parsingGmapsUrl) {
      processGmapsUrlInput(addGmapsUrl, false)
    }
  }, [createStep])

  const validateCreateStep = (step) => {
    setCreateStepError('')
    if (step === 1) {
      if (!storeName || !storeName.trim()) {
        setCreateStepError('Vui lòng nhập Tên quán ăn.')
        return false
      }
      if (!storeCategoryId) {
        setCreateStepError('Vui lòng chọn Danh mục ẩm thực.')
        return false
      }
      if (!storeDesc || !storeDesc.trim()) {
        setCreateStepError('Vui lòng nhập Mô tả hoặc điểm đặc trưng của quán.')
        return false
      }
      return true
    }
    if (step === 2) {
      if (!storeAddress || !storeAddress.trim()) {
        setCreateStepError('Vui lòng nhập Địa chỉ chi tiết.')
        return false
      }
      if (parsingGmapsUrl) {
        setCreateStepError('Hệ thống đang giải mã link Google Maps, vui lòng chờ trong giây lát...')
        return false
      }
      if (!storeLat || !storeLng) {
        setCreateStepError('Vui lòng dán link Google Maps hoặc dãy tọa độ để hệ thống tự động trích xuất vị trí GPS.')
        return false
      }
      return true
    }
    return true
  }

  const handleNextCreateStep = (e) => {
    if (e) e.preventDefault()
    if (validateCreateStep(createStep)) {
      setCreateStep((prev) => Math.min(3, prev + 1))
    }
  }

  const handlePrevCreateStep = (e) => {
    if (e) e.preventDefault()
    setCreateStepError('')
    setCreateStep((prev) => Math.max(1, prev - 1))
  }

  const handleJumpCreateStep = (targetStep) => {
    setCreateStepError('')
    if (targetStep < createStep) {
      setCreateStep(targetStep)
      return
    }
    if (targetStep === 2 && validateCreateStep(1)) {
      setCreateStep(2)
    } else if (targetStep === 3 && validateCreateStep(1) && validateCreateStep(2)) {
      setCreateStep(3)
    }
  }

  // Category Picker Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [categoryModalTarget, setCategoryModalTarget] = useState('add') // 'add' or 'edit'

  // Lock body scroll when Google Maps Guide or Category Picker modal is open
  useEffect(() => {
    if (isGmapsGuideOpen || isCategoryModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isGmapsGuideOpen, isCategoryModalOpen])

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
    let parsed = parseGoogleMapsUrl(val)
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
  }, [editingFood])

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="p-6 brutalist-card space-y-4">
          <div className="h-6 w-48 brutalist-skeleton" />
          <div className="h-10 w-full brutalist-skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 brutalist-card h-48 brutalist-skeleton" />
          <div className="p-6 brutalist-card h-48 brutalist-skeleton" />
        </div>
      </div>
    )
  }

  // Handle successful store creation trigger locally
  const onLocalCreateStore = async (e) => {
    e.preventDefault()
    const createdStore = await handleCreateStore(e)
    if (createdStore) {
      setIsAddingNew(false)
      setCreateStep(1)
      if (createdStore.id && setFoodStoreId) {
        setFoodStoreId(createdStore.id.toString())
      }
      setManagingDishesForStore(createdStore)
    }
  }

  const onLocalSubmitFoodItem = async (e) => {
    e.preventDefault()
    if (editingFood) {
      const success = await handleUpdateFoodItem(editingFood.id, {
        name: foodName,
        price: foodPrice,
        imageUrl: foodImage,
        description: foodDesc
      })
      if (success) {
        setEditingFood(null)
      }
    } else {
      await handleCreateFoodItem(e)
    }
  }

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'banner') {
      setUploadingBanner(true)
      const url = await handleUploadImage(file, 'stores')
      setUploadingBanner(false)
      if (url) {
        setStoreBannerUrl(url)
      }
    } else if (type === 'editBanner') {
      setUploadingBanner(true)
      const url = await handleUploadImage(file, 'stores')
      setUploadingBanner(false)
      if (url) {
        setEditingStore({ ...editingStore, bannerImageUrl: url })
      }
    } else if (type === 'food') {
      setUploadingFood(true)
      const url = await handleUploadImage(file, 'foods')
      setUploadingFood(false)
      if (url) {
        setFoodImage(url)
      }
    }
  }

  // Find latest store information to reflect added/updated dishes immediately
  const currentSelectedStoreInfo = managingDishesForStore
    ? (myStores.find((st) => st.id.toString() === managingDishesForStore.id.toString()) || managingDishesForStore)
    : null

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-white text-black border-4 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <Store className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="brutalist-badge bg-[#ff3e3e] text-white">Owner Portal</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Quán Ăn Của Tôi
            </h2>
            <p className="text-sm font-semibold max-w-xl text-neutral-600">
              Manage your culinary spots, edit locations, update open hours, or submit a brand-new spot to the tour directory.
            </p>
          </div>
          <div className="shrink-0">
            {!editingStore && !isAddingNew && !managingDishesForStore && activeSubTab === 'stores' && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="brutalist-btn-red text-sm w-full md:w-auto flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Thêm Quán Mới
              </button>
            )}
            {(editingStore || isAddingNew || managingDishesForStore) && (
              <button
                onClick={() => {
                  setEditingStore(null)
                  setIsAddingNew(false)
                  setManagingDishesForStore(null)
                  setEditingFood(null)
                }}
                className="brutalist-btn-white text-sm w-full md:w-auto flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Quay Lại Danh Sách
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation (Only visible when not deep in forms/views) */}
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
              if (loadGlobalData) loadGlobalData()
            }}
            className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase transition-all border-2 border-black rounded-full shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'submissions'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            <span>Lịch Sử Đăng Quán</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {editingStore ? (
        /* Edit Store Form with Accordion Sections */
        <div className="brutalist-card bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto space-y-6">
          <div className="border-b-3 border-black pb-3 flex justify-between items-center">
            <div>
              <span className="brutalist-badge bg-black text-white text-[10px] mb-1">Chủ Quán</span>
              <h3 className="text-2xl font-black uppercase tracking-wider text-[#ff3e3e]">
                Chỉnh Sửa Quán Ăn
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setEditingStore(null)}
              className="p-1.5 border-2 border-black hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editingStore.status === 'HIDDEN' && (
            <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-md text-amber-900 text-xs font-bold space-y-1">
              <p className="font-black text-amber-950 uppercase">Lưu ý khi cập nhật quán bị ẩn:</p>
              <p>Chỉnh sửa thông tin quán trong trạng thái này sẽ cập nhật dữ liệu mà không thay đổi trạng thái ẩn hiện hoặc gửi yêu cầu phê duyệt mới. Để khôi phục quán, vui lòng sử dụng chức năng "Yêu cầu khôi phục".</p>
            </div>
          )}

          <form onSubmit={handleUpdateStore} className="space-y-6">
            {/* Accordion Section 1: Basic Info */}
            <div className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => setEditSections((prev) => ({ ...prev, basic: !prev.basic }))}
                className="w-full bg-[#f7f6f2] hover:bg-neutral-200 p-3.5 border-b-2 border-black flex items-center justify-between font-black text-xs sm:text-sm uppercase cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black shrink-0">1</span>
                  <span className="text-black">Thông Tin Cơ Bản Quán Ăn</span>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white border border-black rounded-md shrink-0">
                  {editSections.basic ? '▲ Thu Gọn' : '▼ Mở Rộng'}
                </span>
              </button>
              {editSections.basic && (
                <div className="p-4 md:p-6 space-y-6 bg-white animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Quán Ăn</label>
                      <input
                        type="text"
                        required
                        value={editingStore.name || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Danh Mục Ẩm Thực *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryModalTarget('edit')
                          setCategorySearchQuery('')
                          setIsCategoryModalOpen(true)
                        }}
                        className="w-full bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black rounded-full py-2.5 px-4 text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
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
                        <span className="text-[10px] font-extrabold bg-white border border-black text-black px-2 py-0.5 rounded-full shrink-0">
                          {editingStore.categoryId ? 'Đổi danh mục' : 'Chọn ngay'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả / Điểm Đặc Trưng</label>
                    <textarea
                      required
                      value={editingStore.landmarkNote || ''}
                      onChange={(e) => setEditingStore({ ...editingStore, landmarkNote: e.target.value })}
                      className="brutalist-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Mở Cửa (vd: 06:00)</label>
                      <input
                        type="text"
                        required
                        value={editingStore.openTime || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, openTime: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Giờ Đóng Cửa (vd: 22:00)</label>
                      <input
                        type="text"
                        required
                        value={editingStore.closeTime || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, closeTime: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              )}
            </div>

            {/* Accordion Section 2: Location & GPS */}
            <div className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => setEditSections((prev) => ({ ...prev, location: !prev.location }))}
                className="w-full bg-[#f7f6f2] hover:bg-neutral-200 p-3.5 border-b-2 border-black flex items-center justify-between font-black text-xs sm:text-sm uppercase cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black shrink-0">2</span>
                  <span className="text-black">Vị Trí & Bản Đồ Google Maps</span>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white border border-black rounded-md shrink-0">
                  {editSections.location ? '▲ Thu Gọn' : '▼ Mở Rộng'}
                </span>
              </button>
              {editSections.location && (
                <div className="p-4 md:p-6 space-y-6 bg-white animate-fade-in-up">
                  <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <label className="text-xs uppercase font-black tracking-wider flex items-center gap-1.5 text-black">
                        <LinkIcon className="w-4 h-4 text-[#ff3e3e]" /> Nhập Link Google Maps của Quán
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsGmapsGuideOpen(true)}
                        className="text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn lấy link
                      </button>
                    </div>

                    <div className="space-y-2">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Địa Chỉ Cụ Thể</label>
                      <input
                        type="text"
                        required
                        value={editingStore.addressLine || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, addressLine: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-extrabold tracking-wider block">Số Điện Thoại</label>
                      <input
                        type="text"
                        value={editingStore.phoneNumber || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, phoneNumber: e.target.value })}
                        className="brutalist-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion Section 3: Media & Banner */}
            <div className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => setEditSections((prev) => ({ ...prev, media: !prev.media }))}
                className="w-full bg-[#f7f6f2] hover:bg-neutral-200 p-3.5 border-b-2 border-black flex items-center justify-between font-black text-xs sm:text-sm uppercase cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff3e3e] text-white text-xs flex items-center justify-center font-black shrink-0">3</span>
                  <span className="text-black">Hình Ảnh Banner Quán Ăn</span>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white border border-black rounded-md shrink-0">
                  {editSections.media ? '▲ Thu Gọn' : '▼ Mở Rộng'}
                </span>
              </button>
              {editSections.media && (
                <div className="p-4 md:p-6 space-y-6 bg-white animate-fade-in-up">
                  <div className="space-y-3">
                    <label className="text-xs uppercase font-extrabold tracking-wider block">Hình Ảnh Banner Quán Ăn</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {(editingStore.bannerImageUrl || uploadingBanner) && (
                        <div className="w-24 h-24 border-2 border-black overflow-hidden bg-neutral-200 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center">
                          {editingStore.bannerImageUrl && (
                            <img src={editingStore.bannerImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                          )}
                          {uploadingBanner && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer brutalist-btn-white py-1 px-3 text-xs font-black uppercase text-center flex-1 sm:flex-initial">
                            {uploadingBanner ? 'Đang Tải Lên...' : 'Chọn Ảnh Từ Thiết Bị'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingBanner}
                              onChange={(e) => handleFileChange(e, 'editBanner')}
                              className="hidden"
                            />
                          </label>
                          {editingStore.bannerImageUrl && (
                            <button
                              type="button"
                              onClick={() => setEditingStore({ ...editingStore, bannerImageUrl: '' })}
                              className="brutalist-btn-red py-1 px-3 text-xs font-black uppercase"
                            >
                              Xóa Ảnh
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-neutral-500">Hỗ trợ JPG, PNG, GIF. Tải lên Cloudinary tự động.</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Hoặc nhập URL hình ảnh trực tiếp:</span>
                      <input
                        type="text"
                        value={editingStore.bannerImageUrl || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, bannerImageUrl: e.target.value })}
                        className="brutalist-input text-xs"
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full brutalist-btn-red py-3 text-sm font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              Lưu Thay Đổi Quán Ăn
            </button>
          </form>
        </div>
      ) : isAddingNew ? (
        /* Add New Store Form with Interactive Multi-Step 1-2-3 Navigation */
        <div className="brutalist-card bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto space-y-6">
          <div className="border-b-3 border-black pb-3 flex justify-between items-center">
            <div>
              <span className="brutalist-badge bg-[#ff3e3e] text-white text-[10px] mb-1">Quy trình 3 Bước</span>
              <h3 className="text-2xl font-black uppercase tracking-wider text-black">
                Thêm Quán Ăn Mới
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false)
                setCreateStep(1)
                setCreateStepError('')
              }}
              className="p-1.5 border-2 border-black hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🎯 Interactive Step 1 - 2 - 3 Navigation Header */}
          <div className="bg-[#f7f6f2] p-3 border-2 border-black rounded-xl space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {/* Step 1 Button */}
              <button
                type="button"
                onClick={() => handleJumpCreateStep(1)}
                className={`py-2 px-1 sm:px-3 text-[11px] sm:text-xs font-black uppercase rounded-lg border-2 border-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                  createStep === 1
                    ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : createStep > 1
                    ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-600'
                    : 'bg-white text-neutral-400 border-neutral-300'
                }`}
              >
                <span className="flex items-center gap-1">
                  {createStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1.'}
                  <span>Thông Tin</span>
                </span>
                {createStep > 1 && <span className="text-[9px] font-extrabold bg-white/20 px-1 rounded hidden sm:inline">(Sửa)</span>}
              </button>

              {/* Step 2 Button */}
              <button
                type="button"
                onClick={() => handleJumpCreateStep(2)}
                className={`py-2 px-1 sm:px-3 text-[11px] sm:text-xs font-black uppercase rounded-lg border-2 border-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                  createStep === 2
                    ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : createStep > 2
                    ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-600 cursor-pointer'
                    : 'bg-white text-neutral-400 border-neutral-300 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  {createStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2.'}
                  <span>Địa Chỉ & GPS</span>
                </span>
                {createStep > 2 && <span className="text-[9px] font-extrabold bg-white/20 px-1 rounded hidden sm:inline">(Sửa)</span>}
              </button>

              {/* Step 3 Button */}
              <button
                type="button"
                onClick={() => handleJumpCreateStep(3)}
                className={`py-2 px-1 sm:px-3 text-[11px] sm:text-xs font-black uppercase rounded-lg border-2 border-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                  createStep === 3
                    ? 'bg-[#ff3e3e] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-neutral-400 border-neutral-300 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  3. <span>Banner & Gửi</span>
                </span>
              </button>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full bg-neutral-200 h-2 border border-black rounded-full overflow-hidden">
              <div
                className="bg-[#ff3e3e] h-full transition-all duration-300 ease-out"
                style={{ width: `${(createStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Validation Error Message Alert */}
          {createStepError && (
            <div className="bg-red-50 border-2 border-red-500 p-3 rounded-xl text-red-700 text-xs font-bold flex items-center justify-between animate-fade-in-up">
              <span>{createStepError}</span>
              <button
                type="button"
                onClick={() => setCreateStepError('')}
                className="text-red-900 font-black px-1.5 py-0.5 hover:bg-red-100 rounded"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={onLocalCreateStore} className="space-y-6">
            {/* STEP 1: BASIC INFORMATION */}
            {createStep === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-black">
                    Bước 1: Thông Tin Cơ Bản Quán Ăn
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-500">Trang 1 / 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      onClick={() => {
                        setCategoryModalTarget('add')
                        setCategorySearchQuery('')
                        setIsCategoryModalOpen(true)
                      }}
                      className="w-full bg-[#f7f6f2] hover:bg-neutral-100 border-2 border-black rounded-full py-2.5 px-4 text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
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
                      <span className="text-[10px] font-extrabold bg-white border border-black text-black px-2 py-0.5 rounded-full shrink-0">
                        {storeCategoryId ? 'Đổi danh mục' : 'Chọn ngay ↗'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả Điểm Đặc Trưng / Landmark *</label>
                  <textarea
                    required
                    placeholder="Ví dụ: Gần Chợ Trạm, đối diện đại lý bia. Quán bánh xèo giòn rụm lâu đời 20 năm..."
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="brutalist-input"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="pt-4 border-t-2 border-black flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextCreateStep}
                    className="brutalist-btn-red py-2.5 px-6 text-xs font-black uppercase flex items-center gap-1.5"
                  >
                    <span>Tiếp Tục: Địa Chỉ & GPS</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & MAPS */}
            {createStep === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-black">
                    Bước 2: Địa Chỉ & Bản Đồ Google Maps
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-500">Trang 2 / 3</span>
                </div>

                <div className="space-y-3 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <label className="text-xs uppercase font-black tracking-wider flex items-center gap-1.5 text-black">
                      <LinkIcon className="w-4 h-4 text-[#ff3e3e]" /> Nhập Link Google Maps của Quán *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsGmapsGuideOpen(true)}
                      className="text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn lấy link
                    </button>
                  </div>

                  <div className="space-y-2">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="pt-4 border-t-2 border-black flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevCreateStep}
                    className="brutalist-btn-white py-2.5 px-5 text-xs font-black uppercase flex items-center gap-1.5"
                  >
                    <span>Quay Lại Bước 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCreateStep}
                    className="brutalist-btn-red py-2.5 px-6 text-xs font-black uppercase flex items-center gap-1.5"
                  >
                    <span>Tiếp Tục: Banner & Gửi</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BANNER IMAGE & REVIEW SUMMARY */}
            {createStep === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-black">
                    Bước 3: Hình Ảnh Banner & Rà Soát Cuối Cùng
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-500">Trang 3 / 3</span>
                </div>

                <div className="space-y-3">
                  <label className="text-xs uppercase font-extrabold tracking-wider block">Hình Ảnh Banner Quán Ăn</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {(storeBannerUrl || uploadingBanner) && (
                      <div className="w-24 h-24 border-2 border-black overflow-hidden bg-neutral-200 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center">
                        {storeBannerUrl && (
                          <img src={storeBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        )}
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer brutalist-btn-white py-1 px-3 text-xs font-black uppercase text-center flex-1 sm:flex-initial">
                          {uploadingBanner ? 'Đang Tải Lên...' : 'Chọn Ảnh Từ Thiết Bị'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingBanner}
                            onChange={(e) => handleFileChange(e, 'banner')}
                            className="hidden"
                          />
                        </label>
                        {storeBannerUrl && (
                          <button
                            type="button"
                            onClick={() => setStoreBannerUrl('')}
                            className="brutalist-btn-red py-1 px-3 text-xs font-black uppercase"
                          >
                            Xóa Ảnh
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-500">Hỗ trợ JPG, PNG, GIF. Tải lên Cloudinary tự động.</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Hoặc nhập URL hình ảnh trực tiếp:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={storeBannerUrl}
                      onChange={(e) => setStoreBannerUrl(e.target.value)}
                      className="brutalist-input text-xs"
                    />
                  </div>
                </div>

                {/* Store Review Summary Card */}
                <div className="bg-[#f7f6f2] p-4 border-2 border-black rounded-xl space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-xs font-black uppercase text-[#ff3e3e] flex items-center gap-1.5 border-b border-neutral-300 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff3e3e]" /> Tóm Tắt Thông Tin Đã Nhập:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Tên quán:</span> <span className="font-black text-black">{storeName || 'N/A'}</span></p>
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Danh mục:</span> <span className="font-black text-black">{categories.find((c) => c.id.toString() === storeCategoryId?.toString())?.name || 'Chưa chọn'}</span></p>
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Địa chỉ:</span> <span className="font-bold text-neutral-800">{storeAddress || 'N/A'}</span></p>
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Số điện thoại:</span> <span className="font-bold text-neutral-800">{storePhone || 'Chưa cập nhật'}</span></p>
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Giờ hoạt động:</span> <span className="font-bold text-neutral-800">{storeOpen || '06:00'} - {storeClose || '21:00'}</span></p>
                    <p><span className="font-extrabold text-neutral-500 uppercase block text-[10px]">Tọa độ GPS:</span> <span className="font-bold text-emerald-700">{storeLat && storeLng ? `${storeLat}, ${storeLng}` : 'Chưa có'}</span></p>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-black flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevCreateStep}
                    className="brutalist-btn-white py-2.5 px-5 text-xs font-black uppercase flex items-center gap-1.5"
                  >
                    <span>Quay Lại Bước 2</span>
                  </button>
                  <button
                    type="submit"
                    className="brutalist-btn-red py-3 px-6 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    Gửi Quán Ăn Chờ Duyệt
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : managingDishesForStore ? (
        /* Direct Dish management panel scoped to this restaurant */
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
                  className="brutalist-badge bg-white hover:bg-neutral-100 cursor-pointer"
                >
                  Hủy Sửa
                </button>
              )}
            </div>

            <form onSubmit={onLocalSubmitFoodItem} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Món Ăn</label>
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
                <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Bán (VND)</label>
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
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
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
                          accept="image/*"
                          disabled={uploadingFood}
                          onChange={(e) => handleFileChange(e, 'food')}
                          className="hidden"
                        />
                      </label>
                      {foodImage && (
                        <button
                          type="button"
                          onClick={() => setFoodImage('')}
                          className="brutalist-btn-red py-1 px-3 text-xs font-black uppercase"
                        >
                          Xóa Ảnh
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500">Hỗ trợ JPG, PNG, GIF. Tải lên Cloudinary tự động.</p>
                  </div>
                </div>

                {/* Text fallback input */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase">Hoặc nhập URL hình ảnh trực tiếp:</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={foodImage}
                    onChange={(e) => setFoodImage(e.target.value)}
                    className="brutalist-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả Ngắn</label>
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
                className="w-full brutalist-btn-red py-3 text-sm font-black"
              >
                {editingFood ? 'Xác Nhận Cập Nhật' : 'Xác Nhận Thêm Món Ăn'}
              </button>
            </form>
          </div>

          {/* Right Column: Menu List Preview */}
          <div className="lg:col-span-7 brutalist-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-3">
              Thực Đơn Hiện Tại
            </h3>

            {!currentSelectedStoreInfo?.foodItems || currentSelectedStoreInfo.foodItems.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-semibold bg-[#f7f6f2] border-2 border-dashed border-neutral-300 rounded-xl">
                Quán ăn này chưa được cập nhật món ăn nào trong thực đơn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentSelectedStoreInfo.foodItems.map((food) => (
                  <div
                    key={food.id}
                    className="border-2 border-black rounded-xl bg-[#f7f6f2] flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="h-32 border-b-2 border-black relative bg-neutral-200 shrink-0">
                      <img
                        src={
                          food.imageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'
                        }
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-extrabold text-sm text-black">{food.name}</p>
                          <span className="font-black text-xs text-[#ff3e3e] shrink-0">
                            {food.price?.toLocaleString()}đ
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-600 line-clamp-2 mt-1">{food.description}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-2 pt-2 border-t border-black/10 items-center">
                        <button
                          type="button"
                          onClick={() => setEditingFood(food)}
                          className="flex-1 brutalist-btn-white py-1 text-[10px] font-extrabold flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFoodItem(food.id)}
                          className="w-10 h-10 rounded-full border-2 border-black bg-white text-red-500 hover:bg-red-50 shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#111111] transition-all flex items-center justify-center shrink-0"
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
      ) : activeSubTab === 'submissions' ? (
        /* Submissions tab content */
        <MySubmissionsSection myStores={myStores} loading={loading} />
      ) : (
        /* Store List View */
        <div className="space-y-4">
          {myStores.length === 0 ? (
            <div className="brutalist-card bg-white p-8 sm:p-12 text-center space-y-4">
              <p className="font-extrabold text-neutral-600">Bạn chưa đăng quán ăn nào trên hệ thống.</p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="brutalist-btn-red text-xs py-2 px-5"
              >
                + Đăng Quán Ăn Đầu Tiên Của Bạn
              </button>
            </div>
          ) : (
            <>
              {/* 📱 1. MOBILE RESPONSIVE STORE CARDS (< 768px) */}
              <div className="md:hidden space-y-3">
                {myStores.map((st) => (
                  <div
                    key={st.id}
                    className="brutalist-card bg-white p-3.5 space-y-3 border-3 border-black shadow-[4px_4px_0px_0px_#111]"
                  >
                    {/* Top Row: Horizontal Image + Summary */}
                    <div className="flex gap-3">
                      <div className="w-24 h-24 shrink-0 border-2 border-black rounded-xl overflow-hidden bg-neutral-200 relative">
                        <img
                          src={
                            st.bannerImageUrl ||
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
                          }
                          alt={st.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="brutalist-badge bg-white text-black text-[9px] py-0.2 px-1.5">
                            {st.categoryName || 'Dishes'}
                          </span>
                        </div>
                        <h3 className="text-sm font-black uppercase text-black line-clamp-2 leading-snug">
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
                          className="flex-1 brutalist-btn-white py-1.5 px-2 text-xs flex items-center justify-center gap-1 font-extrabold"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#ff3e3e]" /> Sửa
                        </button>

                        {st.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('HIDE')
                            }}
                            className="flex-1 brutalist-btn-yellow py-1.5 px-2 text-xs flex items-center justify-center gap-1 font-extrabold"
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
                            className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black rounded-full py-1.5 px-2 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
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
                            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black rounded-full py-1.5 px-2 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Xin Khôi Phục
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActionModalStore(st)
                            setActionModalType('HARD_DELETE')
                          }}
                          className="w-9 h-9 rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 💻 2. DESKTOP GRID STORE CARDS (>= 768px) */}
              <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-6">
                {myStores.map((st) => (
                  <div
                    key={st.id}
                    className="brutalist-card bg-white overflow-hidden flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="h-40 w-full border-b-3 border-black relative bg-neutral-200">
                        <img
                          src={
                            st.bannerImageUrl ||
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60'
                          }
                          alt={st.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="brutalist-badge bg-white text-black">
                            {st.categoryName || 'Dishes'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="text-lg font-black uppercase text-black line-clamp-1">{st.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-[#ff3e3e]" />
                          <span className="truncate">{st.addressLine || 'Địa chỉ chưa cập nhật'}</span>
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
                                <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2 border-2 border-red-400 rounded-sm italic">
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
                          className="flex-1 brutalist-btn-white py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-extrabold"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </button>

                        {st.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActionModalStore(st)
                              setActionModalType('HIDE')
                            }}
                            className="flex-1 brutalist-btn-yellow py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-extrabold"
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
                            className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black rounded-full py-1.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
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
                            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-black rounded-full py-1.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                            title="Gửi lý do xin khôi phục quán ăn"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Gửi Yêu Cầu Khôi Phục
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActionModalStore(st)
                            setActionModalType('HARD_DELETE')
                          }}
                          className="w-9 h-9 rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0"
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
            </>
          )}
        </div>
      )}

      {/* Action Modal for Soft Delete / Recover / Hard Delete */}
      <StoreActionModal
        isOpen={!!actionModalStore}
        onClose={() => {
          setActionModalStore(null)
          setActionModalType(null)
        }}
        onConfirm={handleActionConfirm}
        store={actionModalStore}
        actionType={actionModalType}
        isStaffOrAdmin={false}
      />

      {/* Google Maps Link Guide Modal */}
      {isGmapsGuideOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
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
            onClick={() => setIsCategoryModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in-up"
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
                  .filter((cat) => !categorySearchQuery.trim() || cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  .map((cat) => {
                    const currentSelectedId =
                      categoryModalTarget === 'add' ? storeCategoryId : editingStore?.categoryId
                    const isSelected = currentSelectedId?.toString() === cat.id.toString()

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

                {categories.filter((cat) => !categorySearchQuery.trim() || cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-xs font-bold space-y-1">
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
