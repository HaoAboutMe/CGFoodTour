import React from 'react'
import { Loader2 } from 'lucide-react'

const VARIANT_STYLES = {
  action: 'bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] active:bg-[var(--color-action-hover)]',
  brand: 'bg-[var(--color-brand)] text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)] hover:text-white',
  surface: 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[#f7f6f2]',
  white: 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[#f7f6f2]',
  outline: 'bg-transparent text-[var(--color-ink)] hover:bg-black/5',
  ghost: 'bg-transparent text-[var(--color-ink)] border-transparent shadow-none hover:bg-black/5 hover:shadow-none',
  danger: 'bg-[var(--color-danger-text)] text-white hover:bg-[#991b1b]'
}

const SIZE_STYLES = {
  sm: 'h-8 min-h-[36px] px-3 text-xs rounded-md gap-1.5',
  md: 'h-11 min-h-[44px] px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 min-h-[48px] px-6 text-base rounded-xl gap-2.5'
}

/**
 * Accessible Neo-brutalist Button primitive
 * Meets WCAG 2.2 AA contrast, double-activation prevention, keyboard navigation, and focus contracts.
 */
export const Button = React.forwardRef(function Button(
  {
    children,
    variant = 'action',
    size = 'md',
    type = 'button',
    disabled = false,
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const isActuallyDisabled = disabled || isLoading
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.action
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md
  const isGhost = variant === 'ghost'

  const baseStyles = [
    'inline-flex items-center justify-center select-none font-black uppercase tracking-wider',
    'transition-all duration-150 cursor-pointer text-center',
    isGhost ? 'border-2 border-transparent' : 'border-2 border-[var(--color-border)] shadow-[var(--shadow-brutalist-sm)]',
    'active:translate-x-[1px] active:translate-y-[1px]',
    'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2',
    isActuallyDisabled && 'opacity-60 cursor-not-allowed pointer-events-none shadow-none active:translate-x-0 active:translate-y-0',
    fullWidth && 'w-full',
    variantClass,
    sizeClass,
    className
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (e) => {
    if (isActuallyDisabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onClick?.(e)
  }

  const handleKeyDown = (e) => {
    if (isActuallyDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onKeyDown?.(e)
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isActuallyDisabled}
      aria-busy={isLoading || undefined}
      aria-disabled={isActuallyDisabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={baseStyles}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[3]" aria-hidden="true" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 flex items-center" aria-hidden="true">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0 flex items-center" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'

/**
 * Accessible Icon-Only Button
 * Enforces aria-label for non-text buttons (FE-P1-02 contract)
 * Guarantees minimum 44x44 CSS px touch target for mobile compliance.
 */
export const IconButton = React.forwardRef(function IconButton(
  {
    icon,
    'aria-label': ariaLabel,
    variant = 'surface',
    size = 'md',
    type = 'button',
    disabled = false,
    isLoading = false,
    className = '',
    onClick,
    ...rest
  },
  ref
) {
  if (!ariaLabel && process.env.NODE_ENV !== 'production') {
    console.warn('IconButton: "aria-label" is required for accessible name compliance.')
  }

  // Ensures touch target is at least 44x44px across all viewport sizes
  const iconSizes = {
    sm: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0 rounded-lg text-xs',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0 rounded-lg text-sm',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] p-0 rounded-xl text-base'
  }

  const sizeClass = iconSizes[size] || iconSizes.md

  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      disabled={disabled}
      isLoading={isLoading}
      aria-label={ariaLabel}
      className={`${sizeClass} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

export default Button
