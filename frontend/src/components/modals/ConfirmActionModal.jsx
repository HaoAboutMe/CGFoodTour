import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { validateDestructiveAction } from '@/utils/destructiveAction'

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  expectedText = '',
  reasonRequired = false,
  onClose,
  onConfirm
}) {
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useDialogFocus(isOpen, submitting ? null : onClose)

  if (!isOpen) return null

  const submit = async (event) => {
    event.preventDefault()
    const validationError = validateDestructiveAction({ confirmation, expectedText, reason, reasonRequired })
    if (validationError) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    try {
      const success = await onConfirm({ confirmation: confirmation.trim(), reason: reason.trim() })
      if (success) onClose()
    } catch {
      setError('Không thể hoàn tất thao tác. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-md space-y-5 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#111]"
      >
        <div className="flex items-start justify-between gap-4 border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <span className="border-2 border-black bg-red-100 p-2"><AlertTriangle className="h-6 w-6 text-red-600" /></span>
            <h2 id={titleId} className="text-lg font-black uppercase">{title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Đóng cửa sổ xác nhận" className="min-h-11 min-w-11 border-2 border-black p-2 hover:bg-neutral-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p id={descriptionId} className="text-sm font-semibold leading-relaxed text-neutral-700">{description}</p>
        <form onSubmit={submit} className="space-y-4">
          {expectedText && (
            <label className="block space-y-2 text-xs font-extrabold uppercase">
              Nhập <strong className="text-red-600">{expectedText}</strong> để xác nhận
              <input data-initial-focus value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError('') }} autoComplete="off" className="brutalist-input mt-2 w-full normal-case" />
            </label>
          )}
          {reasonRequired && (
            <label className="block space-y-2 text-xs font-extrabold uppercase">
              Lý do <span className="text-red-600">* (Bắt buộc)</span>
              <textarea data-initial-focus={!expectedText || undefined} rows={4} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} className="brutalist-input mt-2 w-full normal-case" />
            </label>
          )}
          {error && <p role="alert" className="border-2 border-red-500 bg-red-50 p-2 text-xs font-bold text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 border-t-2 border-neutral-200 pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="brutalist-btn-white min-h-11 px-4 text-xs font-black uppercase">Hủy bỏ</button>
            <button type="submit" disabled={submitting} className="brutalist-btn-red min-h-11 min-w-32 px-5 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Đang xử lý…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
