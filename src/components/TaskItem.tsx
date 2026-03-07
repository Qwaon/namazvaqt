import { motion } from 'framer-motion'
import { useAppStore, type Task } from '../store/useAppStore'

interface TaskItemProps {
  task: Task
  index: number
  style?: React.CSSProperties
  compact?: boolean
  overbooked?: boolean
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} мин`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`
}

function priorityColor(priority: Task['priority']): string {
  if (priority === 'high') return 'var(--prayer-dot)'
  if (priority === 'medium') return 'var(--accent)'
  return 'var(--task-line)'
}

export function TaskItem({ task, index, style, compact, overbooked }: TaskItemProps) {
  const toggleTask = useAppStore((s) => s.toggleTask)

  const onToggle = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    toggleTask(task.id)
  }

  const isAbsolute = style?.position === 'absolute'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={`relative w-full ${isAbsolute ? '' : 'py-2'}`}
      style={style}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
        aria-label={task.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
      >
        <div
          className="flex items-stretch gap-3 rounded-[10px] px-3.5 py-2.5 h-full"
          style={{ backgroundColor: overbooked ? '#F5E8E0' : 'var(--surface)' }}
        >
          <div
            className="w-[3px] rounded-[2px]"
            style={{ backgroundColor: priorityColor(task.priority) }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className={`flex items-baseline gap-2 ${task.completed ? 'opacity-60' : ''}`}>
              <span className={`font-body text-sm text-[var(--text-primary)] min-w-0 ${task.completed ? 'line-through' : ''} ${compact ? 'truncate' : ''}`}>
                {task.name}
              </span>
              {compact && (
                <span className="ml-auto text-[var(--text-secondary)] font-body text-sm whitespace-nowrap">
                  {formatDuration(task.duration)}
                </span>
              )}
            </div>
            {!compact && (
              <div className="flex items-end justify-end mt-2">
                <span className="text-[var(--text-secondary)] font-body text-sm whitespace-nowrap">
                  {formatDuration(task.duration)}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  )
}
