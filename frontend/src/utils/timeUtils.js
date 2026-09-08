/**
 * Utility to calculate real-time opening status of a food spot
 * based on store.openTime, store.closeTime, and store.isReportedClosed.
 */
export function checkStoreOpenStatus(store) {
  if (!store) {
    return {
      isOpen: false,
      statusText: 'Đóng Cửa',
      statusClass: 'bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]'
    }
  }

  if (store.isReportedClosed) {
    return {
      isOpen: false,
      statusText: 'Báo Đóng Cửa',
      statusClass: 'bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]'
    }
  }

  const openStr = store.openTime
  const closeStr = store.closeTime

  if (!openStr || !closeStr) {
    return {
      isOpen: true,
      statusText: 'Đang Mở',
      statusClass: 'bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]'
    }
  }

  try {
    const parseTime = (timeStr) => {
      if (!timeStr) return null
      const parts = timeStr.toString().trim().split(':')
      if (parts.length < 2) return null
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      if (isNaN(h) || isNaN(m)) return null
      return h * 60 + m
    }

    const openMin = parseTime(openStr)
    const closeMin = parseTime(closeStr)

    if (openMin === null || closeMin === null) {
      return {
        isOpen: true,
        statusText: 'Đang Mở',
        statusClass: 'bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]'
      }
    }

    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()

    let isOpen = false
    if (openMin < closeMin) {
      // Daytime shift (e.g., 05:00 to 07:00)
      isOpen = nowMin >= openMin && nowMin <= closeMin
    } else if (openMin > closeMin) {
      // Overnight shift (e.g., 18:00 to 02:00)
      isOpen = nowMin >= openMin || nowMin <= closeMin
    } else {
      // 24/7
      isOpen = true
    }

    if (isOpen) {
      return {
        isOpen: true,
        statusText: 'Đang Mở',
        statusClass: 'bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]'
      }
    } else {
      return {
        isOpen: false,
        statusText: 'Hết Giờ Phục Vụ',
        statusClass: 'bg-[#fff5f5] text-[#c92a2a] border-[#c92a2a]'
      }
    }
  } catch (e) {
    return {
      isOpen: true,
      statusText: 'Đang Mở',
      statusClass: 'bg-[#e6fcf5] text-[#0ca678] border-[#0ca678]'
    }
  }
}
