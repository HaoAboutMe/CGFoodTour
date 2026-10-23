import { useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Button,
  FormField,
  Input
} from '@/components/ui'
import { validateDestructiveAction } from '@/utils/destructiveAction'

/**
 * ConfirmActionModal
 * Migrated to Dialog primitive (Batch 2C Pilot 1).
 * Conforms to WAI-ARIA alertdialog, focus trap, Escape dismiss, double-submit prevention,
 * and safe focus restoration.
 */
export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  expectedText = '',
  reasonRequired = false,
  fallbackFocusRef,
  onClose,
  onConfirm
}) {
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inputRef = useRef(null)
  const cancelButtonRef = useRef(null)

  if (!isOpen) return null

  const submit = async (event) => {
    event?.preventDefault()
    if (submitting) return

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

  // Safe initial focus: if text entry required, focus input; otherwise prioritize safe Cancel button
  const initialFocus = (expectedText || reasonRequired) ? inputRef : cancelButtonRef

  return (
    <Dialog
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      role="alertdialog"
      closeOnEscape={!submitting}
      closeOnBackdropClick={false}
      initialFocusRef={initialFocus}
      fallbackFocusRef={fallbackFocusRef}
      className="max-w-md border-4 border-black shadow-[var(--shadow-brutalist-lg)]"
    >
      <DialogHeader showCloseButton={!submitting}>
        <div className="flex items-center gap-3">
          <span className="border-2 border-black bg-red-100 p-2" aria-hidden="true">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </span>
          <DialogTitle>{title}</DialogTitle>
        </div>
      </DialogHeader>

      <DialogDescription className="text-sm font-semibold leading-relaxed text-neutral-700">
        {description}
      </DialogDescription>

      <DialogContent>
        <form id="confirm-action-form" noValidate onSubmit={submit} className="space-y-4">
          {expectedText && (
            <FormField
              id="confirm-action-confirmation"
              label={<span>Nhập <strong className="text-red-600">{expectedText}</strong> để xác nhận</span>}
              error={error && !confirmation ? error : undefined}
              required
            >
              <Input
                ref={inputRef}
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value)
                  if (error) setError('')
                }}
                autoComplete="off"
                disabled={submitting}
                className="normal-case mt-1"
              />
            </FormField>
          )}

          {reasonRequired && (
            <FormField
              id="confirm-action-reason"
              label="Lý do"
              error={error && !reason && reasonRequired ? error : undefined}
              required
            >
              <textarea
                id="confirm-action-reason"
                ref={expectedText ? undefined : inputRef}
                rows={4}
                maxLength={1000}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  if (error) setError('')
                }}
                disabled={submitting}
                className="w-full bg-[var(--color-surface)] text-[var(--color-ink)] border-2 border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 normal-case mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </FormField>
          )}

          {error && (!expectedText || confirmation) && (!reasonRequired || reason) && (
            <p role="alert" className="border-2 border-red-500 bg-red-50 p-2 text-xs font-bold text-red-700">
              {error}
            </p>
          )}

          <DialogFooter className="border-t-2 border-neutral-200 pt-4">
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="surface"
              data-dialog-cancel="true"
              disabled={submitting}
              onClick={onClose}
              className="min-h-11 px-4 text-xs font-black uppercase"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={submitting}
              loadingText="Đang xử lý…"
              disabled={submitting}
              className="min-h-11 min-w-32 px-5 text-xs font-black uppercase"
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
