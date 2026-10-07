import { Link } from 'react-router-dom'
import { urlPath } from '../../utils/format'

/** Shows the path prominently and the full URL underneath (paths are what people scan for). */
export function UrlCell({ url, to }: { url: string; to?: string }) {
  let host = ''
  try {
    host = new URL(url).host
  } catch {
    /* show raw value */
  }
  const path = urlPath(url)
  return (
    <div className="max-w-[18rem] min-w-0 sm:max-w-md">
      {to ? (
        <Link to={to} className="block truncate font-medium text-slate-900 hover:text-indigo-700 hover:underline" title={url}>
          {path}
        </Link>
      ) : (
        <span className="block truncate font-medium text-slate-900" title={url}>
          {path}
        </span>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-slate-500 hover:underline" title={`Open ${url} in a new tab`}>
        {host}
      </a>
    </div>
  )
}
