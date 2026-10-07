import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SCORE_KEYS, SCORE_LABELS } from '../../constants/lighthouse'
import type { ScoreKey, UrlTestResult } from '../../types/api'
import { formatDateTime, formatShortDate } from '../../utils/format'

/** Validated categorical palette (colour-blind safe on adjacent pairs). Colour follows the score, never its rank. */
const SERIES_COLORS: Record<ScoreKey, string> = {
  performance: '#2a78d6',
  accessibility: '#eb6834',
  best_practices: '#1baf7a',
  seo: '#eda100',
}

/**
 * Score trend over time for one URL. Expects results newest-first (API order);
 * only completed results are plotted. The history table below the chart is its table view.
 */
export function ScoreHistoryChart({ results }: { results: UrlTestResult[] }) {
  const data = results
    .filter((r) => r.status === 'completed' && r.scores && r.completed_at)
    .reverse()
    .map((r) => ({ at: r.completed_at!, ...r.scores! }))

  if (data.length < 2) {
    return <p className="px-5 py-8 text-center text-sm text-slate-500">The trend chart appears once this URL has at least two completed tests.</p>
  }

  return (
    <div className="h-72 w-full px-2 py-4 sm:px-4" role="img" aria-label={`Score history chart with ${data.length} completed tests. See the table below for exact values.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="at" tickFormatter={(v: string) => formatShortDate(v)} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 90, 100]} interval={0} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(v) => formatDateTime(String(v))}
            formatter={(value, name) => [String(value), String(name)]}
            contentStyle={{ borderRadius: 6, borderColor: '#e2e8f0', fontSize: 13 }}
            cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
          />
          <Legend iconType="plainline" itemSorter={null} wrapperStyle={{ fontSize: 13, color: '#334155' }} />
          {SCORE_KEYS.map((key) => (
            <Line
              key={key}
              type="linear"
              dataKey={key}
              name={SCORE_LABELS[key]}
              stroke={SERIES_COLORS[key]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: '#ffffff', fill: SERIES_COLORS[key] }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
