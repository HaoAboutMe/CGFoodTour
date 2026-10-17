import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, Unlock, X } from 'lucide-react'

export default function AccountStatusModal({ user, actionType, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user || !actionType) return null

  const isDisable = actionType === 'DISABLE'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedReason = reason.trim()
    if (isDisable && !normalizedReason) {
      setError('Vui lòng nhập lý do khóa tài khoản.')
      return
    }

    setSubmitting(true)
    const success = await onConfirm({ reason: normalizedReason })
    setSubmitting(false)
    if (success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md space-y-5 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className={`border-2 border-black p-2 ${isDisable ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {isDisable
                ? <Lock className="h-6 w-6 text-amber-700" />
                : <Unlock className="h-6 w-6 text-emerald-700" />}
            </div>
            <h3 className="text-xl font-black uppercase">
              {isDisable ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="border-2 border-black p-1 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm font-semibold leading-relaxed text-neutral-700">
          {isDisable
            ? <>Tài khoản <strong>@{user.username}</strong> sẽ bị khóa, toàn bộ phiên đăng nhập hiện tại bị thu hồi và các quán của người dùng sẽ tạm ẩn khỏi khu vực công khai.</>
            : <>Tài khoản <strong>@{user.username}</strong> sẽ được mở khóa. Các quán đã được duyệt trước đó có thể xuất hiện công khai trở lại.</>}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isDisable && (
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider">
                Lý do khóa <span className="text-red-600">* (Bắt buộc)</span>
              </label>
              <textarea
                autoFocus
                rows={4}
                maxLength={1000}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  if (error) setError('')
                }}
                placeholder="Nhập lý do khóa tài khoản để phục vụ quản trị và kiểm tra sau này..."
                className={`brutalist-input w-full ${error ? 'border-red-500 bg-red-50' : ''}`}
              />
              <div className="flex items-start justify-between gap-3">
                {error ? <p className="text-xs font-bold text-red-600">{error}</p> : <span />}
                <span className="shrink-0 text-[10px] font-bold text-neutral-400">{reason.length}/1000</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t-2 border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="brutalist-btn-white px-4 py-2 text-xs font-black uppercase"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || (isDisable && !reason.trim())}
              className={`px-5 py-2 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50 ${isDisable ? 'brutalist-btn-yellow' : 'bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              {submitting ? 'Đang xử lý...' : (isDisable ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
