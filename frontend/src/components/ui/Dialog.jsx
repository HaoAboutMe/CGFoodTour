import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { DialogContext, useDialog } from './dialogContext'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(', ')

// Reference counting for body scroll lock across multiple / nested dialogs
let activeDialogCount = 0
let originalBodyOverflow = ''

const DIALOG_SIZE_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-xl sm:max-w-2xl',
  full: 'max-w-full'
}

/**
 * Accessible Dialog (Modal) primitive.
 * WAI-ARIA compliant: focus trap, Escape key dismiss, backdrop click, body scroll lock,
 * and robust focus restoration with unmounted fallback.
 */
export function Dialog({
  isOpen,
  onClose,
  children,
  role = 'dialog', // 'dialog' | 'alertdialog'
  size = 'lg',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledByProp,
  'aria-describedby': ariaDescribedByProp,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  initialFocusRef,
  fallbackFocusRef,
  className = ''
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const backdropRef = useRef(null)
  const previousActiveElementRef = useRef(null)

  // Focus restoration & body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // 1. Save currently focused element for restoration
    if (typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement
    }

    // 2. Lock body scroll with reference counting
    if (typeof document !== 'undefined') {
      if (activeDialogCount === 0) {
        originalBodyOverflow = document.body.style.overflow || ''
        document.body.style.overflow = 'hidden'
      }
      activeDialogCount += 1
    }

    // 3. Mark background elements outside the dialog as inert and aria-hidden
    const affectedElements = []
    if (typeof document !== 'undefined') {
      const siblings = Array.from(document.body.children)
      for (const el of siblings) {
        if (backdropRef.current && (el === backdropRef.current || el.contains(backdropRef.current))) continue
        if (
          el.tagName === 'SCRIPT' ||
          el.tagName === 'STYLE' ||
          el.id === 'credential_picker_container' ||
          el.id?.startsWith('credential_picker') ||
          el.id === 'fb-root' ||
          el.querySelector?.('#credential_picker_container, [src*="accounts.google.com"], [src*="facebook.com"]')
        ) continue

        const prevAriaHidden = el.getAttribute('aria-hidden')
        const prevInert = el.hasAttribute('inert')

        el.setAttribute('aria-hidden', 'true')
        el.setAttribute('inert', '')

        affectedElements.push({ el, prevAriaHidden, prevInert })
      }
    }

    // 4. Set initial focus inside dialog
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else if (dialogRef.current) {
        // Priority: autofocus element -> safe button (e.g. data-dialog-cancel) -> first focusable -> dialog container
        const customAutofocus = dialogRef.current.querySelector('[data-autofocus]')
        const safeCancel = dialogRef.current.querySelector('[data-dialog-cancel], button[data-cancel]')
        const focusables = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)

        if (customAutofocus) {
          customAutofocus.focus()
        } else if (role === 'alertdialog' && safeCancel) {
          safeCancel.focus()
        } else if (focusables.length > 0) {
          focusables[0].focus()
        } else {
          dialogRef.current.focus()
        }
      }
    }, 20)

    // Capture fallback element at effect start
    const fallbackEl = fallbackFocusRef?.current

    // 5. Cleanup when closed
    return () => {
      clearTimeout(timer)
      if (typeof document !== 'undefined') {
        // Restore background elements
        for (const { el, prevAriaHidden, prevInert } of affectedElements) {
          if (prevAriaHidden === null) {
            el.removeAttribute('aria-hidden')
          } else {
            el.setAttribute('aria-hidden', prevAriaHidden)
          }
          if (!prevInert) {
            el.removeAttribute('inert')
          }
        }

        activeDialogCount = Math.max(0, activeDialogCount - 1)
        if (activeDialogCount === 0) {
          document.body.style.overflow = originalBodyOverflow
        }

        // Restore focus with unmounted activator fallback
        const prev = previousActiveElementRef.current
        if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
          prev.focus()
        } else if (
          fallbackEl &&
          typeof fallbackEl.focus === 'function' &&
          document.contains(fallbackEl)
        ) {
          fallbackEl.focus()
        } else {
          const fallback = document.querySelector('main, [role="main"], #root')
          if (fallback && typeof fallback.focus === 'function') {
            if (!fallback.hasAttribute('tabindex')) {
              fallback.setAttribute('tabindex', '-1')
            }
            fallback.focus({ preventScroll: true })
          }
        }
      }
    }
  }, [isOpen, initialFocusRef, fallbackFocusRef, role])

  // Keyboard navigation: Escape key & Focus Trap
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation()
        onClose?.()
        return
      }

      if (event.key === 'Tab') {
        if (!dialogRef.current) return
        const focusables = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null || el.getClientRects().length > 0
        )
        if (focusables.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const contextValue = {
    titleId,
    descriptionId,
    onClose
  }

  const effectiveLabelledBy = ariaLabel
    ? undefined
    : (ariaLabelledByProp || titleId)
  const effectiveDescribedBy = ariaDescribedByProp || descriptionId

  const modalNode = (
    <DialogContext.Provider value={contextValue}>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        role="presentation"
        onClick={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose?.()
          }
        }}
      >
        <div
          ref={dialogRef}
          role={role}
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={effectiveLabelledBy}
          aria-describedby={effectiveDescribedBy}
          tabIndex={-1}
          className={`relative w-full ${DIALOG_SIZE_STYLES[size] || DIALOG_SIZE_STYLES.lg} bg-[var(--color-surface)] text-[var(--color-ink)] border-3 border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-brutalist-lg)] p-5 sm:p-6 outline-none focus:outline-none animate-scale-in ${className}`}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body)
  }

  return modalNode
}

Dialog.displayName = 'Dialog'

export function DialogHeader({
  children,
  className = '',
  showCloseButton = true,
  closeButtonLabel = 'Đóng hộp thoại',
  isCloseDisabled = false
}) {
  const { onClose } = useDialog()

  return (
    <div className={`flex items-start justify-between gap-4 pb-4 border-b-2 border-[var(--color-border)] mb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {showCloseButton && (
        <IconButton
          icon={<X className="w-5 h-5 stroke-[2.5]" />}
          aria-label={closeButtonLabel}
          variant="ghost"
          size="sm"
          disabled={isCloseDisabled}
          onClick={onClose}
          className="shrink-0 -mr-2 -mt-1 text-[var(--color-ink)] hover:bg-black/5"
        />
      )}
    </div>
  )
}

DialogHeader.displayName = 'DialogHeader'

export function DialogTitle({ children, className = '' }) {
  const { titleId } = useDialog()
  return (
    <h2 id={titleId} className={`text-lg font-black uppercase tracking-tight text-[var(--color-ink)] ${className}`}>
      {children}
    </h2>
  )
}

DialogTitle.displayName = 'DialogTitle'

export function DialogDescription({ children, className = '' }) {
  const { descriptionId } = useDialog()
  return (
    <p id={descriptionId} className={`text-sm text-[var(--color-ink-muted)] mt-1 ${className}`}>
      {children}
    </p>
  )
}

DialogDescription.displayName = 'DialogDescription'

export function DialogContent({ children, className = '' }) {
  return <div className={`py-2 ${className}`}>{children}</div>
}

DialogContent.displayName = 'DialogContent'

export function DialogFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t-2 border-[var(--color-border)] mt-4 ${className}`}>
      {children}
    </div>
  )
}

DialogFooter.displayName = 'DialogFooter'

export default Dialog
