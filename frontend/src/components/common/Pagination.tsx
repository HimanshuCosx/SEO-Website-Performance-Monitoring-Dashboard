import { Button } from './Button'

export function Pagination({ page, pageSize, count, onPageChange }: { page: number; pageSize: number; count: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[13px] text-fg-muted sm:px-5">
      <span className="tabular-nums">
        Showing <span className="font-medium text-fg-secondary">{from.toLocaleString()}–{to.toLocaleString()}</span> of{' '}
        <span className="font-medium text-fg-secondary">{count.toLocaleString()}</span>
      </span>
      <div className="flex items-center gap-2">
        <span aria-live="polite" className="mr-1 tabular-nums">
          Page {page} of {pages}
        </span>
        <Button variant="secondary" size="sm" icon="chevronLeft" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
        <Button variant="secondary" size="sm" icon="chevronRight" aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)} />
      </div>
    </nav>
  )
}
