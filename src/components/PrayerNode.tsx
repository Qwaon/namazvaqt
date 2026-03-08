import { motion } from 'framer-motion'

type PrayerStatus = 'completed' | 'active' | 'upcoming' | 'missed'

interface PrayerNodeProps {
  name: string
  time: Date
  status: PrayerStatus
  onToggleCompleted?: () => void
  index: number
  style?: React.CSSProperties
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  taskCount?: number
}

export function PrayerNode({
  name,
  time,
  status,
  onToggleCompleted,
  index,
  style,
  className,
  collapsed,
  onToggleCollapse,
  taskCount = 0,
}: PrayerNodeProps) {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isUpcoming = status === 'upcoming'

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const displayTime = time.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  })

  const dotClasses = isCompleted
    ? 'border-[var(--prayer-dot)] bg-[var(--prayer-dot)]'
    : isActive
      ? 'prayer-pulse border-[var(--prayer-dot)] bg-[var(--prayer-dot)]'
      : isUpcoming
        ? 'border-[var(--prayer-dot)] bg-[var(--bg)]'
        : 'border-[var(--text-secondary)] bg-[var(--bg)]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.15 }}
      className={`flex items-center gap-4 py-4 relative w-full ${className ?? ''}`}
      style={style}
    >
      {/* Prayer dot button */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleCompleted}
          className="w-6 h-6 flex items-center justify-center"
          aria-label={isCompleted ? 'Отменить отметку намаза' : 'Отметить намаз как совершённый'}
        >
          <div
            className={`prayer-dot w-3.5 h-3.5 rounded-full border-2 ${dotClasses}`}
            style={{ boxShadow: isActive ? '0 0 0 4px rgba(44, 74, 62, 0.15)' : undefined }}
          />
        </button>
      </div>

      {/* Prayer name */}
      <span className="font-display text-[22px] font-medium text-[var(--text-primary)] leading-none">
        {name}
      </span>

      {/* Badge: task count when collapsed */}
      {collapsed && taskCount > 0 && (
        <span
          className="font-body px-2 py-0.5 rounded-full"
          style={{ background: 'var(--prayer-dot)', color: '#F5F0E8', fontSize: 11 }}
        >
          {taskCount}
        </span>
      )}

      {/* Prayer time */}
      <span className="ml-auto font-display text-[18px] text-[var(--text-secondary)] tabular-nums leading-none">
        {displayTime}
      </span>

      {/* Collapse/expand chevron */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
          style={{ color: 'var(--text-secondary)', marginLeft: 2 }}
          aria-label={collapsed ? 'Развернуть блок' : 'Свернуть блок'}
        >
          <motion.svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </button>
      )}
    </motion.div>
  )
}
