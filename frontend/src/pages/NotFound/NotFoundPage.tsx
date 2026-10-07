import { LinkButton } from '../../components/common/Button'
import { EmptyState } from '../../components/common/States'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <EmptyState
      icon="alert"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      action={<LinkButton to="/" variant="primary">Go to dashboard</LinkButton>}
    />
  )
}
