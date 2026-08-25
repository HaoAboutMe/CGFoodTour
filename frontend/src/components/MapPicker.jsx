import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, Layers, Search } from 'lucide-react'

// Fix default icon assets paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapPicker({ initialLat, initialLng, onSelect, onClose }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const tileLayerRef = useRef(null)

  const [mapStyle, setMapStyle] = useState('google-road') // 'google-road', 'google-satellite', 'esri-street', 'cartodb-voyager'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Default coordinate for Can Giuoc if no initial coords
  const defaultLat = parseFloat(initialLat) || 10.592500
  const defaultLng = parseFloat(initialLng) || 106.671389

  // Map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14)
    mapRef.current = map

    // Add initial marker
    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map)
    markerRef.current = marker

    // When marker is dragged
    marker.on('dragend', () => {
      const position = marker.getLatLng()
      onSelect(position.lat.toFixed(6), position.lng.toFixed(6))
    })

    // When map is clicked
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      onSelect(lat.toFixed(6), lng.toFixed(6))
    })

    // Fix for gray map/tiles not loading when initialized inside a modal
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
      map.remove()
    }
  }, [])

  // Handle layer switching dynamically
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing tile layer if it exists
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current)
    }

    let url = ''
    let attribution = ''

    switch (mapStyle) {
      case 'google-road':
        url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        attribution = '&copy; Google Maps'
        break
      case 'google-satellite':
        url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        attribution = '&copy; Google Maps Hybrid'
        break
      case 'esri-street':
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        attribution = 'Tiles &copy; Esri &mdash; Source: Esri'
        break
      case 'cartodb-voyager':
        url = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        attribution = '&copy; CartoDB &copy; OpenStreetMap'
        break
      default:
        url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        attribution = '&copy; Google Maps'
    }

    const layer = L.tileLayer(url, { attribution })
    layer.addTo(mapRef.current)
    tileLayerRef.current = layer
  }, [mapStyle])

  // Calculate distance in km between two coordinates (Haversine formula)
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Handle Geocoding Search
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Automatically append " Cần Giuộc" to scope the search to the district
      let query = searchQuery.trim()
      const lowerQuery = query.toLowerCase()
      if (!lowerQuery.includes('cần giuộc') && !lowerQuery.includes('can giuoc')) {
        query = `${query} Cần Giuộc`
      }

      // Query Photon Geocoding API with Cần Giuộc coordinates bias (lat=10.5925, lon=106.6714)
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=10.592500&lon=106.671389&limit=15`
      )
      const data = await response.json()
      if (data && data.features) {
        // Filter results: only keep places within 20km of Cần Giuộc center
        const filtered = data.features.filter((feature) => {
          const [lng, lat] = feature.geometry.coordinates
          const dist = getDistanceKm(lat, lng, 10.592500, 106.671389)
          return dist <= 20 // 20km radius max
        })

        setSearchResults(filtered.slice(0, 5))

        if (filtered.length === 0) {
          alert('Không tìm thấy địa điểm này trong khu vực Cần Giuộc. Vui lòng thử từ khóa khác!')
        }
      }
    } catch (err) {
      console.error('Geocoding search failed:', err)
      alert('Không thể kết nối đến máy chủ tìm kiếm địa điểm. Vui lòng thử lại sau!')
    } finally {
      setIsSearching(false)
    }
  }

  // Select search result candidate
  const selectSearchResult = (result) => {
    const [lng, lat] = result.geometry.coordinates

    // Fly map to coordinates
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16)
    }

    // Move marker to coordinates
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }

    // Update parent coordinates values
    onSelect(lat.toFixed(6), lng.toFixed(6))

    // Clear search suggestions list
    setSearchResults([])

    // Update query with selected name
    const name = result.properties.name || ''
    const city = result.properties.city || ''
    const label = name && city ? `${name}, ${city}` : name || city
    setSearchQuery(label)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="brutalist-card bg-white w-full max-w-2xl p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <h3 className="text-xl font-black uppercase text-black">
            Chọn Vĩ Độ & Kinh Độ Của Quán
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Place Search Bar */}
        <div className="space-y-1 relative">
          <div className="text-xs font-extrabold text-neutral-600 flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            <span>TÌM KIẾM ĐỊA ĐIỂM / TÊN ĐƯỜNG:</span>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập địa danh, tên đường... (Ví dụ: Chợ Cần Giuộc, UBND Cần Giuộc...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 brutalist-input text-xs py-2.5 px-3 bg-white"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="brutalist-btn-red text-xs py-2.5 px-5 font-black uppercase flex items-center justify-center gap-1 cursor-pointer min-w-[100px]"
            >
              {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto divide-y-2 divide-black z-30">
              {searchResults.map((result, idx) => {
                const name = result.properties.name || ''
                const street = result.properties.street || ''
                const city = result.properties.city || ''
                const state = result.properties.state || ''
                const label = [name, street, city, state].filter(Boolean).join(', ')

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left p-2.5 hover:bg-neutral-100 font-bold text-xs block cursor-pointer transition-colors"
                  >
                    📍 {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Map Layer Selector Toolbar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-600">
            <Layers className="w-3.5 h-3.5" />
            <span>CHỌN KIỂU HIỂN THỊ BẢN ĐỒ:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMapStyle('google-road')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                mapStyle === 'google-road' ? 'bg-[#ff3e3e] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Google Bản Đồ (Chi tiết nhất)
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('google-satellite')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                mapStyle === 'google-satellite' ? 'bg-[#ff3e3e] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Google Vệ Tinh
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('esri-street')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                mapStyle === 'esri-street' ? 'bg-[#ff3e3e] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Bản đồ Esri
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('cartodb-voyager')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                mapStyle === 'cartodb-voyager' ? 'bg-[#ff3e3e] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Bản đồ CartoDB
            </button>
          </div>
        </div>

        <p className="text-xs font-bold text-neutral-500">
          * Nhấp chuột vào bất cứ điểm nào trên bản đồ hoặc kéo thả biểu tượng ghim màu xanh để chọn tọa độ chính xác.
        </p>

        {/* Map Div */}
        <div 
          ref={mapContainerRef} 
          className="h-90 w-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-neutral-100 relative z-10" 
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs font-black bg-[#f7f6f2] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-4 w-full sm:w-auto">
            <div>Vĩ độ: <span className="text-[#ff3e3e]">{parseFloat(initialLat) ? parseFloat(initialLat).toFixed(6) : defaultLat.toFixed(6)}</span></div>
            <div>Kinh độ: <span className="text-[#ff3e3e]">{parseFloat(initialLng) ? parseFloat(initialLng).toFixed(6) : defaultLng.toFixed(6)}</span></div>
          </div>
          <button
            onClick={() => {
              if (!initialLat || !initialLng) {
                onSelect(defaultLat.toFixed(6), defaultLng.toFixed(6))
              }
              onClose()
            }}
            className="w-full sm:w-auto brutalist-btn-red text-xs py-2.5 px-6 font-black uppercase cursor-pointer"
          >
            Xác Nhận Tọa Độ
          </button>
        </div>
      </div>
    </div>
  )
}
