import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthHeading, FormError, TextField } from '../../components/auth/AuthFields'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { routes } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { simulateAuthRequest, validateEmail } from '../../utils/authValidation'

function BackToLogin() {
  return (
    <Link to={routes.login()} className="mt-8 flex items-center justify-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg">
      <Icon name="arrowLeft" className="h-3.5 w-3.5" />
      Back to log in
    </Link>
  )
}

export function ForgotPasswordPage() {
  useDocumentTitle('Reset password')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    setFormError(null)
    if (err) return

    setSubmitting(true)
    try {
      // TODO: replace with the real password-reset API once the backend exposes it.
      await simulateAuthRequest()
      setSentTo(email.trim())
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-link">
          <Icon name="mailCheck" className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Check your email</h1>
        <p className="mt-2 text-sm text-fg-muted">
          If an account exists for <span className="font-medium text-fg">{sentTo}</span>, we&apos;ve sent a link to reset your password.
        </p>
        <Button variant="secondary" className="mt-8 h-11 w-full sm:h-10" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
        <BackToLogin />
      </div>
    )
  }

  return (
    <>
      <AuthHeading icon="mail" title="Forgot password?" description="Enter the email linked to your account and we'll send you a reset link." />

      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField
          id="reset-email"
          label="Email"
          icon="mail"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <FormError message={formError} />
        <Button type="submit" loading={submitting} className="h-11 w-full sm:h-10">
          {submitting ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>

      <BackToLogin />
    </>
  )
}
