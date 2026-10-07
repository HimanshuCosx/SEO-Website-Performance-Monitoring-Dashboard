import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg shadow-card hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-fg shadow-card hover:bg-subtle',
  danger: 'bg-danger text-white shadow-card hover:bg-danger-hover',
  ghost: 'text-fg-muted hover:bg-subtle hover:text-fg',
}

const SIZES: Record<Size, { text: string; square: string }> = {
  sm: { text: 'h-8 px-2.5 gap-1.5 text-[13px]', square: 'h-8 w-8' },
  md: { text: 'h-9 px-3.5 gap-2 text-sm', square: 'h-9 w-9' },
}

const buttonClasses = (variant: Variant, size: Size, iconOnly: boolean, extra = '') =>
  `inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${iconOnly ? SIZES[size].square : SIZES[size].text} ${extra}`

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  loading?: boolean
  children?: ReactNode
}

/** The only button in the app. Icon-only buttons (no children) render square and must have an aria-label. */
export function Button({ variant = 'primary', size = 'md', icon, loading, disabled, className = '', children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, !children, className)} {...rest}>
      {loading ? <Spinner className="h-4 w-4" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'secondary', size = 'md', icon, children, className = '', ariaLabel, title }: { to: string; variant?: Variant; size?: Size; icon?: IconName; children?: ReactNode; className?: string; ariaLabel?: string; title?: string }) {
  return (
    <Link to={to} className={buttonClasses(variant, size, !children, className)} aria-label={ariaLabel} title={title}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  )
}
