import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SCORE_KEYS, SCORE_LABELS } from '../../constants/lighthouse'
import { useTheme, type Theme } from '../../hooks/useTheme'
import type { ScoreKey, UrlTestResult } from '../../types/api'
import { formatDateTime, formatShortDate, formatTime } from '../../utils/format'

/**
 * Validated categorical palette (colour-blind safe on adjacent pairs), with separately chosen
 * steps for each theme — dark mode is not an inversion. Colour follows the score, never its rank.
 */
const SERIES_COLORS: Record<Theme, Record<ScoreKey, string>> = {
  light: { performance: '#2a78d6', accessibility: '#eb6834', best_practices: '#1baf7a', seo: '#eda100' },
  dark: { performance: '#3987e5', accessibility: '#d95926', best_practices: '#199e70', seo: '#c98500' },
}

/** Chart chrome. SVG attributes can't read CSS variables, so these mirror the theme tokens in index.css. */
const CHROME: Record<Theme, { grid: string; axis: string; tick: string; surface: string; border: string; text: string; cursor: string }> = {
  light: { grid: '#e4e6eb', axis: '#cfd3da', tick: '#656b78', surface: '#ffffff', border: '#e4e6eb', text: '#0f1115', cursor: '#959ba6' },
  dark: { grid: '#23272e', axis: '#353a43', tick: '#8d929c', surface: '#121418', border: '#353a43', text: '#ecedf0', cursor: '#626772' },
}

/**
 * Score trend over time for one URL. Expects results newest-first (API order);
 * only completed results are plotted. The history table below the chart is its table view.
 */
export function ScoreHistoryChart({ results }: { results: UrlTestResult[] }) {
  const { theme } = useTheme()
  const colors = SERIES_COLORS[theme]
  const chrome = CHROME[theme]

  const data = results
    .filter((r) => r.status === 'completed' && r.scores && r.completed_at)
    .reverse()
    .map((r) => ({ at: r.completed_at!, ...r.scores! }))

  if (data.length < 2) {
    return <p className="px-5 py-10 text-center text-[13px] text-fg-muted">The trend chart appears once this URL has at least two completed tests.</p>
  }

  // When several tests happened on the same day, dates alone can't tell points apart — show times.
  const days = new Set(data.map((d) => formatShortDate(d.at)))
  const tickFormatter = (v: string) => (days.size < data.length ? `${formatShortDate(v)} ${formatTime(v).replace(/:\d{2}\s/, ' ')}` : formatShortDate(v))

  return (
    <div className="h-72 w-full px-2 pt-4 pb-2 sm:px-4" role="img" aria-label={`Score history chart with ${data.length} completed tests. See the table below for exact values.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={chrome.grid} vertical={false} />
          <XAxis dataKey="at" tickFormatter={tickFormatter} tick={{ fontSize: 12, fill: chrome.tick }} tickLine={false} axisLine={{ stroke: chrome.axis }} minTickGap={32} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 90, 100]} interval={0} tick={{ fontSize: 12, fill: chrome.tick }} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(v) => formatDateTime(String(v))}
            formatter={(value, name) => [String(value), String(name)]}
            contentStyle={{ background: chrome.surface, border: `1px solid ${chrome.border}`, borderRadius: 8, fontSize: 13, color: chrome.text, boxShadow: '0 8px 24px -8px rgb(0 0 0 / 0.25)' }}
            labelStyle={{ color: chrome.text, fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ padding: 0 }}
            cursor={{ stroke: chrome.cursor, strokeWidth: 1 }}
          />
          <Legend iconType="plainline" itemSorter={null} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} formatter={(value) => <span style={{ color: chrome.tick }}>{value}</span>} />
          {SCORE_KEYS.map((key) => (
            <Line
              key={key}
              type="linear"
              dataKey={key}
              name={SCORE_LABELS[key]}
              stroke={colors[key]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: chrome.surface, fill: colors[key] }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
