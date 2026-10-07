/**
 * App-wide icon set, backed by Lucide. Components refer to icons by a short name so the
 * icon library can be swapped in one place.
 */
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  ExternalLink,
  FolderKanban,
  Gauge,
  Globe,
  History,
  Inbox,
  LayoutDashboard,
  Link2,
  ListChecks,
  Menu,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Search,
  SearchX,
  TriangleAlert,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'

const ICONS = {
  dashboard: LayoutDashboard,
  folder: FolderKanban,
  play: Play,
  plus: Plus,
  refresh: RotateCw,
  trash: Trash2,
  edit: Pencil,
  history: History,
  menu: Menu,
  close: X,
  search: Search,
  searchEmpty: SearchX,
  external: ExternalLink,
  alert: TriangleAlert,
  check: Check,
  checkCircle: CircleCheck,
  xCircle: CircleX,
  link: Link2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  gauge: Gauge,
  globe: Globe,
  activity: Activity,
  clock: Clock,
  list: ListChecks,
  inbox: Inbox,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  const Component = ICONS[name]
  return <Component aria-hidden="true" className={`shrink-0 ${className}`} strokeWidth={1.75} />
}
