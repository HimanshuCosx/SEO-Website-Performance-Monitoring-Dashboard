import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'

/**
 * Accessible modal built on the native <dialog> element, which gives us focus trapping,
 * Escape-to-close and a backdrop for free.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-lg border border-line bg-surface p-0 text-fg shadow-pop ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
            <div>
              <h2 id={titleId} className="text-base font-semibold text-fg">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="sm" icon="close" onClick={onClose} aria-label="Close dialog" className="-mt-1 -mr-2" />
          </div>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 rounded-b-lg border-t border-line bg-subtle px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
