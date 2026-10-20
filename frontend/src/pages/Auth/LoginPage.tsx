import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthHeading, FormError, PasswordField, TextField } from '../../components/auth/AuthFields'
import { Button } from '../../components/common/Button'
import { routes } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useToast } from '../../hooks/useToast'
import { simulateAuthRequest, validateEmail, validateLoginPassword, validateUsername } from '../../utils/authValidation'

type LoginMethod = 'username' | 'email'

const METHODS: { value: LoginMethod; label: string }[] = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
]

interface Errors {
  identifier?: string | null
  password?: string | null
}

export function LoginPage() {
  useDocumentTitle('Log in')
  const navigate = useNavigate()
  const toast = useToast()

  const [method, setMethod] = useState<LoginMethod>('username')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function switchMethod(next: LoginMethod) {
    setMethod(next)
    setErrors((e) => ({ ...e, identifier: null }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {
      identifier: method === 'email' ? validateEmail(email) : validateUsername(username),
      password: validateLoginPassword(password),
    }
    setErrors(next)
    setFormError(null)
    if (next.identifier || next.password) return

    setSubmitting(true)
    try {
      // TODO: replace with the real auth API once the backend exposes it.
      await simulateAuthRequest()
      toast.success(`Welcome back, ${method === 'email' ? email.trim() : username.trim()}!`)
      navigate(routes.dashboard())
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthHeading title="Welcome back" description="Log in to monitor your sites' SEO and performance." />

      <form onSubmit={submit} noValidate className="space-y-5">
        <div role="radiogroup" aria-label="Log in with" className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-subtle p-1">
          {METHODS.map((m) => {
            const active = method === m.value
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchMethod(m.value)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-md sm:h-8 text-[13px] font-medium transition-colors ${active ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'}`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {method === 'username' ? (
          <TextField
            key="username"
            id="login-username"
            label="Username"
            icon="user"
            autoComplete="username"
            autoFocus
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.identifier}
          />
        ) : (
          <TextField
            key="email"
            id="login-email"
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.identifier}
          />
        )}

        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAction={
            <Link to={routes.forgotPassword()} className="text-[13px] font-medium text-link hover:underline">
              Forgot password?
            </Link>
          }
        />

        <label className="flex w-fit items-center gap-2 text-[13px] text-fg-secondary select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-line-strong accent-primary" />
          Keep me signed in
        </label>

        <FormError message={formError} />

        <Button type="submit" loading={submitting} className="h-11 w-full sm:h-10">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-fg-muted">
        Don&apos;t have an account?{' '}
        <Link to={routes.signup()} className="font-medium text-link hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
