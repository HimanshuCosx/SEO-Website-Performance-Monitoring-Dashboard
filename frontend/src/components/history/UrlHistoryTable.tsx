import { RESULT_ERROR_LABELS } from '../../constants/errors'
import type { UrlTestResult } from '../../types/api'
import { formatDate, formatDuration, formatMetric, formatTime } from '../../utils/format'
import { ResultStatusBadge } from '../common/StatusBadge'
import { ScoreDelta, ScorePill } from '../performance/Score'

export function UrlHistoryTable({ results }: { results: UrlTestResult[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-2.5 sm:px-5">Date</th>
            <th scope="col" className="px-3 py-2.5">Time</th>
            <th scope="col" className="px-3 py-2.5">Status</th>
            <th scope="col" className="px-3 py-2.5">Perf.</th>
            <th scope="col" className="px-3 py-2.5">A11y</th>
            <th scope="col" className="px-3 py-2.5">Best Pr.</th>
            <th scope="col" className="px-3 py-2.5">SEO</th>
            <th scope="col" className="px-3 py-2.5">FCP</th>
            <th scope="col" className="px-3 py-2.5">LCP</th>
            <th scope="col" className="px-3 py-2.5">TBT</th>
            <th scope="col" className="px-3 py-2.5">CLS</th>
            <th scope="col" className="px-3 py-2.5">SI</th>
            <th scope="col" className="px-3 py-2.5">Duration</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const when = r.completed_at ?? r.started_at
            return (
              <tr key={r.id}>
                <td className="px-4 py-2.5 whitespace-nowrap sm:px-5">{formatDate(when)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-fg-secondary">{formatTime(when)}</td>
                <td className="px-3 py-2.5">
                  <ResultStatusBadge status={r.status} />
                  {r.error && <div className="mt-0.5 text-xs whitespace-nowrap text-poor">{RESULT_ERROR_LABELS[r.error.code] ?? 'Error'}</div>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ScorePill score={r.scores?.performance} />
                    {r.scores && <ScoreDelta current={r.scores.performance} previous={r.previous_scores?.performance} showUnchanged={false} />}
                  </div>
                </td>
                <td className="px-3 py-2.5"><ScorePill score={r.scores?.accessibility} /></td>
                <td className="px-3 py-2.5"><ScorePill score={r.scores?.best_practices} /></td>
                <td className="px-3 py-2.5"><ScorePill score={r.scores?.seo} /></td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatMetric('fcp', r.metrics?.fcp_ms)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatMetric('lcp', r.metrics?.lcp_ms)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatMetric('tbt', r.metrics?.tbt_ms)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatMetric('cls', r.metrics?.cls)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatMetric('speed_index', r.metrics?.speed_index_ms)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatDuration(r.duration_seconds)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
