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
}

export function PrayerNode({ name, time, status, onToggleCompleted, index, style, className }: PrayerNodeProps) {
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
      <div className="w-12 flex-shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleCompleted}
          className="w-6 h-6 flex items-center justify-center"
          aria-label={isCompleted ? 'Отменить отметку намаза' : 'Отметить намаз как совершённый'}
        >
          <div
            className={`prayer-dot w-3.5 h-3.5 rounded-full border-2 ${dotClasses}`}
            style={{
              boxShadow: isActive ? '0 0 0 4px rgba(44, 74, 62, 0.15)' : undefined,
            }}
          />
        </button>
      </div>
      <span className="font-display text-[22px] font-medium text-[var(--text-primary)] leading-none">
        {name}
      </span>
      <span
        className="ml-auto font-display text-[18px] text-[var(--text-secondary)] tabular-nums leading-none"
      >
        {displayTime}
      </span>
    </motion.div>
  )
}
