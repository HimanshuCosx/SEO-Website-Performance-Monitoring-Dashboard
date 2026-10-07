export function ProgressBar({ completed, failed = 0, total, label }: { completed: number; failed?: number; total: number; label: string }) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  const done = completed + failed
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total} URLs processed`}
      className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-muted"
    >
      <div className="bg-primary transition-[width] duration-500" style={{ width: `${pct(completed)}%` }} />
      <div className="bg-poor transition-[width] duration-500" style={{ width: `${pct(failed)}%` }} />
    </div>
  )
}
