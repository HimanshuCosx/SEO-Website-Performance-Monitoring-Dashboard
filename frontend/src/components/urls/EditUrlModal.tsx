import { useState, type FormEvent } from 'react'
import { ApiError } from '../../services/api'
import { urlService } from '../../services/urlService'
import type { ProjectUrl } from '../../types/api'
import { getErrorMessage } from '../../utils/errors'
import { INVALID_REASON_LABELS, validateUrl } from '../../utils/urlValidation'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

interface Props {
  url: ProjectUrl | null
  onClose: () => void
  onSaved: (u: ProjectUrl) => void
}

export function EditUrlModal({ url, ...rest }: Props) {
  return url ? <EditUrlForm key={url.id} url={url} {...rest} /> : null
}

function EditUrlForm({ url, onClose, onSaved }: Props & { url: ProjectUrl }) {
  const [value, setValue] = useState(url.url)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const check = validateUrl(value)
    if (!check.ok) return setError(INVALID_REASON_LABELS[check.reason])
    setSaving(true)
    setError(null)
    try {
      onSaved(await urlService.update(url.id, check.url))
    } catch (err) {
      setError(err instanceof ApiError && err.fieldErrors.url ? err.fieldErrors.url[0] : getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="Edit URL"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-url-form" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="edit-url-form" onSubmit={submit} noValidate>
        <label htmlFor="edit-url" className="mb-1.5 block text-[13px] font-medium text-fg">
          URL
        </label>
        <input
          id="edit-url"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'edit-url-error' : undefined}
          className="form-control h-9 font-mono text-[13px]"
        />
        {error && (
          <p id="edit-url-error" className="mt-1 text-sm text-poor">
            {error}
          </p>
        )}
        <p className="mt-2 text-xs text-fg-muted">Past test results stay linked to this URL entry.</p>
      </form>
    </Modal>
  )
}
