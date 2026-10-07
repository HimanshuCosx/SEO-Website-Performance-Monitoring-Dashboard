import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastVariant } from '../../hooks/useToast'
import { Icon, type IconName } from './Icon'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const VARIANT_ICON: Record<ToastVariant, { icon: IconName; cls: string }> = {
  success: { icon: 'checkCircle', cls: 'text-good' },
  error: { icon: 'xCircle', cls: 'text-poor' },
  info: { icon: 'activity', cls: 'text-info' },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId++
      setToasts((t) => [...t.slice(-3), { id, message, variant }])
      setTimeout(() => dismiss(id), variant === 'error' ? 7000 : 4000)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(() => ({ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error') }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => {
          const v = VARIANT_ICON[t.variant]
          return (
            <div key={t.id} role={t.variant === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-fg shadow-pop">
              <Icon name={v.icon} className={`mt-px h-4 w-4 ${v.cls}`} />
              <span className="flex-1">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-fg-subtle transition-colors hover:text-fg">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
