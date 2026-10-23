import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useFormField } from './formContext'

/**
 * Accessible Neo-brutalist NativeSelect primitive.
 * Retains 100% native mobile picker and screen-reader compatibility without JS bundle overhead.
 */
export const NativeSelect = React.forwardRef(function NativeSelect(
  {
    id,
    options = [],
    placeholder,
    disabled,
    required,
    isInvalid,
    'aria-invalid': ariaInvalidProp,
    'aria-describedby': ariaDescribedByProp,
    className = '',
    containerClassName = '',
    children,
    value,
    defaultValue,
    onChange,
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

  const selectClasses = [
    'w-full appearance-none bg-[var(--color-surface)] text-[var(--color-ink)] font-medium text-sm',
    'border-2 rounded-lg pl-3.5 pr-10 py-2.5 min-h-[44px] transition-colors duration-150 cursor-pointer',
    'focus:outline-none',
    'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2',
    isCurrentlyInvalid
      ? 'border-[var(--color-danger-text)] focus-visible:outline-[var(--color-danger-text)]'
      : 'border-[var(--color-border)]',
    finalDisabled && 'opacity-60 bg-[#f0ede6] cursor-not-allowed pointer-events-none',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`relative inline-flex items-center ${containerClassName || 'w-full'}`}>
      <select
        ref={ref}
        id={finalId}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={finalDisabled}
        required={finalRequired}
        aria-invalid={isCurrentlyInvalid ? 'true' : undefined}
        aria-describedby={finalDescribedBy}
        className={selectClasses}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <div className="absolute right-3.5 pointer-events-none flex items-center text-[var(--color-ink)]" aria-hidden="true">
        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>
  )
})

NativeSelect.displayName = 'NativeSelect'

export default NativeSelect
