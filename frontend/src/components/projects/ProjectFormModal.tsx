import { useState, type FormEvent } from 'react'
import { ApiError } from '../../services/api'
import { projectService } from '../../services/projectService'
import type { Project } from '../../types/api'
import { getErrorMessage } from '../../utils/errors'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const NAME_MAX = 120

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (p: Project) => void
  project?: Project
}

/** Create a project, or edit one when `project` is passed. The form mounts fresh on every open. */
export function ProjectFormModal(props: Props) {
  return props.open ? <ProjectForm {...props} /> : null
}

function ProjectForm({ onClose, onSaved, project }: Props) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setNameError('Project name is required.')
    if (trimmed.length > NAME_MAX) return setNameError(`Project name must be ${NAME_MAX} characters or fewer.`)

    setSaving(true)
    setNameError(null)
    setFormError(null)
    try {
      const input = { name: trimmed, description: description.trim() }
      const saved = project ? await projectService.update(project.id, input) : await projectService.create(input)
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.name) setNameError(err.fieldErrors.name[0])
      else setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const formId = 'project-form'
  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title={project ? 'Edit project' : 'Create project'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="project-name" className="mb-1.5 block text-[13px] font-medium text-fg">
            Project name <span className="text-poor">*</span>
          </label>
          <input
            id="project-name"
            autoFocus
            value={name}
            maxLength={NAME_MAX + 20}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'project-name-error' : undefined}
            placeholder="e.g. Akhand Jyoti Website"
            className="form-control h-9"
          />
          {nameError && (
            <p id="project-name-error" className="mt-1 text-sm text-poor">
              {nameError}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="project-description" className="mb-1.5 block text-[13px] font-medium text-fg">
            Description <span className="font-normal text-fg-subtle">(optional)</span>
          </label>
          <textarea
            id="project-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. SEO and performance monitoring for the Akhand Jyoti website."
            className="form-control py-2"
          />
        </div>
        {formError && (
          <p role="alert" className="text-sm text-poor">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
