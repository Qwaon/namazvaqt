import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useAppStore, type Task } from '../store/useAppStore'

interface TaskItemProps {
  task: Task
  index: number
  style?: CSSProperties
  heightPx?: number
  overbooked?: boolean
  isOverlay?: boolean
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

export function TaskItem({ task, index, style, heightPx, overbooked, isOverlay }: TaskItemProps) {
  const toggleTask = useAppStore((s) => s.toggleTask)
  const removeTask = useAppStore((s) => s.removeTask)
  const [deleteRevealed, setDeleteRevealed] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isOverlay })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(pointer: coarse)')
    const update = () => setIsCoarsePointer(Boolean(mql.matches))
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  // dnd-kit transform — applied to a plain div, NOT to motion.div
  // This avoids conflict with framer-motion's animate which would reset x to 0
  const dndStyle = useMemo<CSSProperties>(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }), [transform, transition, isDragging])

  const onToggle = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    toggleTask(task.id)
  }

  const onDelete = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    removeTask(task.id)
  }

  const swipeEnabled = !isOverlay && isCoarsePointer && !isDragging
  // Compact layout when task card is too short to stack name + duration
  const isCompact = (heightPx ?? 64) < 56

  return (
    // Outer plain div: owned by dnd-kit (transform, opacity, ref)
    // Must NOT be a motion.div — framer-motion animate would fight dnd-kit's CSS transform
    <div
      ref={setNodeRef}
      style={{
        ...dndStyle,
        height: heightPx !== undefined ? `${heightPx}px` : undefined,
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      {/* Inner motion.div: only handles entry animation, no position/transform conflict */}
      <motion.div
        initial={isOverlay ? false : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: isOverlay ? 0 : index * 0.04 }}
        className="relative h-full"
      >
        {/* Swipe-to-delete layer (touch only) */}
        <motion.div
          drag={swipeEnabled ? 'x' : false}
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) setDeleteRevealed(true)
            if (info.offset.x > -20) setDeleteRevealed(false)
          }}
          animate={{ x: deleteRevealed ? -80 : 0 }}
          className="relative h-full"
          style={{ touchAction: 'pan-y' }}
        >
          <div
            className="flex items-stretch gap-2.5 rounded-[10px] h-full group"
            style={{
              backgroundColor: overbooked
                ? 'rgba(181,114,42,0.1)'
                : 'var(--surface)',
              paddingLeft: 10,
              paddingRight: 6,
              paddingTop: isCompact ? 5 : 9,
              paddingBottom: isCompact ? 5 : 9,
            }}
          >
            {/* Priority stripe */}
            <div
              className="w-[3px] rounded-[2px] flex-shrink-0 self-stretch"
              style={{ backgroundColor: priorityColor(task.priority) }}
              aria-hidden
            />

            {/* Drag handle — listeners/attributes here, no onPointerDown override */}
            <div
              ref={setActivatorNodeRef}
              {...(isOverlay ? {} : listeners)}
              {...(isOverlay ? {} : attributes)}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 14,
                cursor: isOverlay ? 'default' : 'grab',
                color: 'var(--text-secondary)',
                touchAction: 'none',
              }}
              aria-hidden
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
                <circle cx="8" cy="2" r="1" fill="currentColor" />
                <circle cx="2" cy="7" r="1" fill="currentColor" />
                <circle cx="8" cy="7" r="1" fill="currentColor" />
                <circle cx="2" cy="12" r="1" fill="currentColor" />
                <circle cx="8" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>

            {/* Checkbox */}
            <div
              role="checkbox"
              aria-checked={task.completed}
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
                if ((e.key === 'Delete' || e.key === 'Backspace') && !isOverlay) { e.preventDefault(); onDelete() }
              }}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `1.5px solid ${task.completed ? 'var(--prayer-dot)' : 'var(--border)'}`,
                background: task.completed ? 'var(--prayer-dot)' : 'transparent',
                cursor: 'pointer',
                alignSelf: 'center',
              }}
              aria-label={task.completed ? 'Снять выполнение' : 'Отметить как выполненное'}
            >
              {task.completed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                  <path d="M1 4L3.5 6.5L9 1" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div
              className={`min-w-0 flex-1 ${isCompact ? 'flex items-center gap-2' : 'flex flex-col justify-between'}`}
            >
              <span
                className="font-body text-sm min-w-0 truncate"
                style={{
                  color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  opacity: task.completed ? 0.5 : 1,
                  textDecoration: task.completed ? 'line-through' : 'none',
                  flex: isCompact ? '1 1 0' : undefined,
                }}
              >
                {task.name}
              </span>
              <span
                className="font-body text-xs whitespace-nowrap flex-shrink-0"
                style={{
                  color: 'var(--text-secondary)',
                  opacity: task.completed ? 0.4 : 0.65,
                }}
              >
                {formatDuration(task.duration)}
                {task.recurring === 'daily' && (
                  <span className="ml-1 opacity-70" title="Повторяется ежедневно">↻</span>
                )}
              </span>
            </div>

            {/* Delete button — desktop hover */}
            {!isOverlay && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                onPointerDown={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center flex-shrink-0 px-1"
                aria-label="Удалить задачу"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 3h6m-9 4h12m-10 0v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M10 11v7m4-7v7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>

        {/* Swipe-to-delete reveal button */}
        {!isOverlay && (
          <motion.button
            type="button"
            onClick={onDelete}
            className="absolute right-0 top-0 bottom-0 rounded-[10px] font-body text-sm"
            style={{ background: '#C0392B', width: 80, color: '#F5F0E8' }}
            initial={false}
            animate={{ opacity: deleteRevealed ? 1 : 0 }}
            aria-label="Удалить"
          >
            Удалить
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
