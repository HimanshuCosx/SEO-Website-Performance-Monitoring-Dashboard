export function ProgressBar({ completed, failed = 0, total, label }: { completed: number; failed?: number; total: number; label: string }) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  const done = completed + failed
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} URLs processed`}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div className="bg-indigo-600 transition-[width] duration-500" style={{ width: `${pct(completed)}%` }} />
        <div className="bg-red-500 transition-[width] duration-500" style={{ width: `${pct(failed)}%` }} />
      </div>
    </div>
  )
}
