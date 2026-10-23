import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export function useDialogFocus(isOpen, onClose) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll(FOCUSABLE) || []
    ;(dialog?.querySelector('[data-initial-focus]') || focusable[0] || dialog)?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const items = [...dialog.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  return dialogRef
}
