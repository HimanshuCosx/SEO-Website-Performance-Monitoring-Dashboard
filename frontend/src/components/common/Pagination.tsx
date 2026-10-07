import { Button } from './Button'

export function Pagination({ page, pageSize, count, onPageChange }: { page: number; pageSize: number; count: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        {from.toLocaleString()}–{to.toLocaleString()} of {count.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon="chevronLeft" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span aria-live="polite">
          Page {page} of {pages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  )
}
