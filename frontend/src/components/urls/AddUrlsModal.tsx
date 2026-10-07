import { useMemo, useState } from 'react'
import { URL_REJECTION_LABELS } from '../../constants/errors'
import { urlService } from '../../services/urlService'
import type { BulkAddUrlsResponse, ID } from '../../types/api'
import { getErrorMessage } from '../../utils/errors'
import { pluralize } from '../../utils/format'
import { INVALID_REASON_LABELS, parseUrlList } from '../../utils/urlValidation'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const MAX_PER_REQUEST = 1000

interface Props {
  open: boolean
  projectId: ID
  onClose: () => void
  onAdded: (createdCount: number) => void
}

/** The form mounts fresh on every open, so no stale input carries over. */
export function AddUrlsModal(props: Props) {
  return props.open ? <AddUrlsForm {...props} /> : null
}

function AddUrlsForm({ projectId, onClose, onAdded }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverResult, setServerResult] = useState<BulkAddUrlsResponse | null>(null)

  const parsed = useMemo(() => parseUrlList(text), [text])
  const tooMany = parsed.valid.length > MAX_PER_REQUEST

  async function submit() {
    if (parsed.valid.length === 0 || tooMany) return
    setSaving(true)
    setError(null)
    try {
      const res = await urlService.addBulk(projectId, parsed.valid)
      onAdded(res.created.length)
      if (res.rejected.length === 0) onClose()
      else {
        setServerResult(res) // keep the dialog open so the user sees what was rejected
        setText(res.rejected.map((r) => r.url).join('\n'))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="Add URLs"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {serverResult ? 'Done' : 'Cancel'}
          </Button>
          <Button icon="plus" onClick={submit} loading={saving} disabled={parsed.valid.length === 0 || tooMany}>
            {parsed.valid.length > 0 ? `Add ${pluralize(parsed.valid.length, 'valid URL')}` : 'Add URLs'}
          </Button>
        </>
      }
    >
      {serverResult && (
        <div role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">
            {pluralize(serverResult.created.length, 'URL')} added · {pluralize(serverResult.rejected.length, 'URL')} rejected by the server
          </p>
          <ul className="mt-2 space-y-1">
            {serverResult.rejected.map((r) => (
              <li key={r.url} className="break-all">
                <span className="font-mono text-xs">{r.url}</span> — {URL_REJECTION_LABELS[r.reason] ?? r.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <label htmlFor="urls-input" className="block text-sm font-medium text-slate-700">
        URLs — one per line
      </label>
      <textarea
        id="urls-input"
        autoFocus
        rows={8}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setServerResult(null)
        }}
        placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
        spellCheck={false}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none"
      />
      <p className="mt-1 text-xs text-slate-500">Full URLs including http:// or https://. Invalid lines are skipped — valid URLs are still added.</p>

      {parsed.total > 0 && (
        <div className="mt-4 space-y-3 text-sm" aria-live="polite">
          <p className="text-slate-700">
            <strong>{pluralize(parsed.total, 'URL')}</strong> entered · <span className="text-good">{parsed.valid.length} valid</span>
            {parsed.invalid.length > 0 && <> · <span className="text-poor">{parsed.invalid.length} invalid</span></>}
            {parsed.duplicates.length > 0 && <> · <span className="text-slate-500">{parsed.duplicates.length} duplicate</span></>}
          </p>

          {tooMany && <p className="text-poor">You can add at most {MAX_PER_REQUEST.toLocaleString()} URLs at once. Please split the list.</p>}

          {parsed.invalid.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="font-medium text-red-800">Invalid (will be skipped)</p>
              <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
                {parsed.invalid.map((i, idx) => (
                  <li key={idx} className="break-all text-red-700">
                    <span className="font-mono text-xs">{i.input}</span> — {INVALID_REASON_LABELS[i.reason]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.duplicates.length > 0 && (
            <p className="text-slate-500">Duplicates in the list are added only once.</p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </Modal>
  )
}
