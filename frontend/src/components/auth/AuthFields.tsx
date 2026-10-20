import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { passwordStrength } from '../../utils/authValidation'
import { Icon, type IconName } from '../common/Icon'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  icon: IconName
  error?: string | null
  /** Rendered on the right of the label row (e.g. a "Forgot password?" link). */
  labelAction?: ReactNode
  /** Rendered inside the input on the right (e.g. a show/hide toggle). */
  trailing?: ReactNode
}

/** Labelled input with a leading icon and inline error, used by every auth form. */
export function TextField({ id, label, icon, error, labelAction, trailing, className = '', ...rest }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-fg-subtle">
          <Icon name={icon} />
        </span>
        <input id={id} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} className={`form-control h-11 pl-9 text-base sm:h-10 sm:text-sm ${trailing ? 'pr-10' : ''}`} {...rest} />
        {trailing && <span className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</span>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-[13px] text-poor">
          {error}
        </p>
      )}
    </div>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'icon' | 'type' | 'trailing'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      icon="lock"
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-subtle hover:text-fg"
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} />
        </button>
      }
    />
  )
}

const STRENGTH = [
  { label: '', bar: '' },
  { label: 'Weak', bar: 'bg-poor' },
  { label: 'Fair', bar: 'bg-warn' },
  { label: 'Good', bar: 'bg-info' },
  { label: 'Strong', bar: 'bg-good' },
] as const

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password)
  if (!score) return null
  const { label, bar } = STRENGTH[score]
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 rounded-full transition-colors ${i <= score ? bar : 'bg-muted'}`} />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-fg-muted">{label}</span>
    </div>
  )
}

/** Page heading shared by the auth screens. */
export function AuthHeading({ title, description, icon = 'lock' }: { title: string; description: ReactNode; icon?: IconName }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-link ring-1 ring-primary/15">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">{description}</p>
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-poor/25 bg-poor-soft px-3 py-2.5 text-[13px] text-poor">
      <Icon name="alert" className="mt-px h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}
