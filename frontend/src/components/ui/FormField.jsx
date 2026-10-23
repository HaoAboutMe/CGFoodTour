import React, { useId } from 'react'
import { FormFieldContext } from './formContext'

/**
 * Accessible FormField container primitive.
 * Enforces label/control association and error announcements via useId().
 */
export function FormField({
  children,
  id: customId,
  label,
  hint,
  error,
  isInvalid = false,
  required = false,
  optional = false,
  disabled = false,
  className = ''
}) {
  const generatedId = useId()
  const controlId = customId || `field-${generatedId}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined

  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  const contextValue = {
    controlId,
    hintId,
    errorId,
    describedBy,
    isInvalid: Boolean(error || isInvalid),
    isRequired: required,
    isDisabled: disabled
  }

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={`w-full flex flex-col ${className}`}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={controlId}
              className="text-xs font-black uppercase tracking-wider text-[var(--color-ink)] select-none"
            >
              <span>{label}</span>
              {required && (
                <>
                  <span className="text-[var(--color-action)] ml-1 font-bold" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(bắt buộc)</span>
                </>
              )}
              {optional && !required && (
                <span className="text-xs font-normal text-[var(--color-ink-muted)] lowercase ml-1.5">
                  (tùy chọn)
                </span>
              )}
            </label>
          </div>
        )}

        {children}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-bold text-[var(--color-danger-text)] mt-1.5 flex items-center gap-1 animate-fade-in-up"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </p>
        )}

        {hint && (
          <p id={hintId} className="text-xs text-[var(--color-ink-muted)] mt-1">
            {hint}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  )
}

FormField.displayName = 'FormField'

export default FormField
