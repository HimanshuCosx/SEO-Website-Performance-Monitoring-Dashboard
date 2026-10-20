import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthHeading, FormError, PasswordField, PasswordStrengthMeter, TextField } from '../../components/auth/AuthFields'
import { Button } from '../../components/common/Button'
import { routes } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useToast } from '../../hooks/useToast'
import { PASSWORD_MIN, simulateAuthRequest, validateConfirmPassword, validateEmail, validateNewPassword, validateUsername } from '../../utils/authValidation'

interface Values {
  username: string
  email: string
  password: string
  confirmPassword: string
}

type Errors = Partial<Record<keyof Values, string | null>>

function validate(v: Values): Errors {
  return {
    username: validateUsername(v.username),
    email: validateEmail(v.email),
    password: validateNewPassword(v.password),
    confirmPassword: validateConfirmPassword(v.password, v.confirmPassword),
  }
}

export function SignupPage() {
  useDocumentTitle('Sign up')
  const navigate = useNavigate()
  const toast = useToast()

  const [values, setValues] = useState<Values>({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    // Clear a field's error as soon as the user edits it.
    if (errors[field]) setErrors((er) => ({ ...er, [field]: null }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    setFormError(null)
    if (Object.values(next).some(Boolean)) return

    setSubmitting(true)
    try {
      // TODO: replace with the real registration API once the backend exposes it.
      await simulateAuthRequest()
      toast.success('Account created. You can now log in.')
      navigate(routes.login())
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthHeading icon="user" title="Create your account" description="Start tracking Lighthouse scores across all your projects." />

      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField id="signup-username" label="Username" icon="user" autoComplete="username" autoFocus placeholder="your_username" value={values.username} onChange={set('username')} error={errors.username} />
        <TextField id="signup-email" label="Email" icon="mail" type="email" autoComplete="email" placeholder="you@company.com" value={values.email} onChange={set('email')} error={errors.email} />
        <div>
          <PasswordField id="signup-password" label="Password" autoComplete="new-password" placeholder={`At least ${PASSWORD_MIN} characters`} value={values.password} onChange={set('password')} error={errors.password} />
          <PasswordStrengthMeter password={values.password} />
        </div>
        <PasswordField id="signup-confirm-password" label="Confirm password" autoComplete="new-password" placeholder="Re-enter your password" value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />

        <FormError message={formError} />

        <Button type="submit" loading={submitting} className="mt-2 h-11 w-full sm:h-10">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-fg-muted">
        Already have an account?{' '}
        <Link to={routes.login()} className="font-medium text-link hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
