import React, { useState, useEffect } from 'react'
import { AlertTriangle, EyeOff, RotateCcw, Trash2, X } from 'lucide-react'

/**
 * Modal confirm + action reason for Store Hide/Recover/Hard Delete
 * actionType: 'HIDE' | 'RECOVER' | 'HARD_DELETE'
 * isStaffOrAdmin: boolean (if true, reason is mandatory for HIDE and HARD_DELETE)
 */
export default function StoreActionModal({
  isOpen,
  onClose,
  onConfirm,
  store,
  actionType,
  isStaffOrAdmin = false,
  loading = false
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen || !store) return null

  const isReasonRequired = isStaffOrAdmin && (actionType === 'HIDE' || actionType === 'HARD_DELETE')

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (isReasonRequired && !reason.trim()) {
      setError('Vui lòng nhập lý do thực hiện thao tác này (Bắt buộc đối với Quản trị viên).')
      return
    }
    setError('')
    onConfirm({ reason: reason.trim() })
  }

  const getModalConfig = () => {
    switch (actionType) {
      case 'HIDE':
        return {
          title: 'Ẩn Quán Ăn',
          icon: <EyeOff className="w-6 h-6 text-amber-600" />,
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-500',
          btnBg: 'brutalist-btn-yellow',
          description: `Quán "${store.name}" sẽ bị ẩn khỏi danh sách hiển thị cho khách hàng, nhưng vẫn được lưu trữ trong hệ thống.`
        }
      case 'RECOVER':
        return {
          title: 'Khôi Phục Quán Ăn',
          icon: <RotateCcw className="w-6 h-6 text-emerald-600" />,
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-500',
          btnBg: 'bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          description: `Quán "${store.name}" sẽ được khôi phục về trạng thái hoạt động bình thường (APPROVED).`
        }
      case 'HARD_DELETE':
        return {
          title: 'Xóa Vĩnh Viễn Quán Ăn',
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          badgeBg: 'bg-red-100 text-red-800 border-red-500',
          btnBg: 'brutalist-btn-red',
          description: `CẢNH BÁO: Thao tác này sẽ xóa VĨNH VIỄN quán "${store.name}" cùng tất cả thực đơn liên quan khỏi hệ thống và KHÔNG THỂ KHÔI PHỤC.`
        }
      default:
        return {
          title: 'Xác Nhận Thao Tác',
          icon: <AlertTriangle className="w-6 h-6 text-neutral-600" />,
          badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-500',
          btnBg: 'brutalist-btn-white',
          description: `Xác nhận thao tác với quán "${store.name}".`
        }
    }
  }

  const config = getModalConfig()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-4 border-black p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {config.icon}
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-neutral-700 leading-relaxed">
            {config.description}
          </p>

          {/* Reason Input Field */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold tracking-wider block">
                Lý Do Thao Tác{' '}
                {isReasonRequired ? (
                  <span className="text-red-600 font-bold">* (Bắt buộc)</span>
                ) : (
                  <span className="text-neutral-400 font-normal">(Không bắt buộc)</span>
                )}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                rows={3}
                placeholder={
                  isReasonRequired
                    ? 'Nhập lý do chi tiết (Ví dụ: Quán tạm ngừng kinh doanh, vi phạm quy định...)'
                    : 'Nhập ghi chú hoặc lý do nếu có...'
                }
                className={`brutalist-input w-full ${error ? 'border-red-500 bg-red-50' : ''}`}
              />
              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-100 border border-red-400 p-2 rounded">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="brutalist-btn-white py-2 px-4 text-xs font-black uppercase"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-5 text-xs ${config.btnBg}`}
              >
                {loading ? 'Đang Xử Lý...' : 'Xác Nhận'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
