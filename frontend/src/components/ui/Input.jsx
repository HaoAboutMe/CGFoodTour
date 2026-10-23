import React from 'react'
import { useFormField } from './formContext'

/**
 * Accessible Neo-brutalist Input primitive.
 * Automatically connects to surrounding FormField for id, aria-describedby, and aria-invalid.
 */
export const Input = React.forwardRef(function Input(
  {
    id,
    type = 'text',
    disabled,
    required,
    isInvalid,
    'aria-invalid': ariaInvalidProp,
    'aria-describedby': ariaDescribedByProp,
    leftAdornment,
    rightAdornment,
    className = '',
    ...rest
  },
  ref
) {
  const formField = useFormField()

  const finalId = id || formField?.controlId
  const finalDisabled = disabled !== undefined ? disabled : formField?.isDisabled
  const finalRequired = required !== undefined ? required : formField?.isRequired
  const isCurrentlyInvalid = isInvalid || ariaInvalidProp || formField?.isInvalid
  const finalDescribedBy = ariaDescribedByProp || formField?.describedBy

  const inputClasses = [
    'w-full bg-[var(--color-surface)] text-[var(--color-ink)] font-medium text-sm',
    'border-2 rounded-lg transition-colors duration-150',
    'placeholder:text-[var(--color-ink-muted)] placeholder:font-normal',
    'focus:outline-none',
    'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2',
    isCurrentlyInvalid
      ? 'border-[var(--color-danger-text)] focus-visible:outline-[var(--color-danger-text)]'
      : 'border-[var(--color-border)]',
    finalDisabled && 'opacity-60 bg-[#f0ede6] cursor-not-allowed',
    leftAdornment ? 'pl-10' : 'pl-3.5',
    rightAdornment ? 'pr-10' : 'pr-3.5',
    'py-2.5 min-h-[44px]',
    className
  ]
    .filter(Boolean)
    .join(' ')

  if (!leftAdornment && !rightAdornment) {
    return (
      <input
        ref={ref}
        id={finalId}
        type={type}
        disabled={finalDisabled}
        required={finalRequired}
        aria-invalid={isCurrentlyInvalid ? 'true' : undefined}
        aria-describedby={finalDescribedBy}
        className={inputClasses}
        {...rest}
      />
    )
  }

  return (
    <div className="relative flex items-center w-full">
      {leftAdornment && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--color-ink-muted)]" aria-hidden="true">
          {leftAdornment}
        </div>
      )}
      <input
        ref={ref}
        id={finalId}
        type={type}
        disabled={finalDisabled}
        required={finalRequired}
        aria-invalid={isCurrentlyInvalid ? 'true' : undefined}
        aria-describedby={finalDescribedBy}
        className={inputClasses}
        {...rest}
      />
      {rightAdornment && (
        <div className="absolute right-3.5 flex items-center text-[var(--color-ink-muted)]">
          {rightAdornment}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
