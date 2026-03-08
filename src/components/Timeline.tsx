import { useMemo, useEffect, useState, useRef } from 'react'
import { differenceInMinutes, addMinutes } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  useAppStore,
  type TimeBlock,
  type PrayerTimesResult,
  type PrayerKey,
} from '../store/useAppStore'
import { PrayerNode } from './PrayerNode'
import { TaskItem } from './TaskItem'

const BLOCK_ORDER: TimeBlock[] = [
  'fajr-dhuhr',
  'dhuhr-asr',
  'asr-maghrib',
  'maghrib-isha',
  'after-isha',
]

const PRAYER_LIST = [
  { key: 'fajr' as const, name: 'Фаджр' },
  { key: 'dhuhr' as const, name: 'Зухр' },
  { key: 'asr' as const, name: 'Аср' },
  { key: 'maghrib' as const, name: 'Магриб' },
  { key: 'isha' as const, name: 'Иша' },
]

type PrayerStatus = 'completed' | 'active' | 'upcoming' | 'missed'

const AFTER_ISHA_MINUTES = 180
const PX_PER_MIN = 1.5
const MIN_TASK_HEIGHT = 36

function blockDroppableId(block: TimeBlock): string {
  return `block:${block}`
}

function isBlockDroppableId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith('block:')
}

function parseBlockDroppableId(id: string): TimeBlock | null {
  const raw = id.replace('block:', '')
  return BLOCK_ORDER.includes(raw as TimeBlock) ? (raw as TimeBlock) : null
}

function BlockDropZone({ block, children }: { block: TimeBlock; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: blockDroppableId(block) })
  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'rounded-[10px] border border-dashed border-[var(--prayer-dot)] bg-[rgba(44,74,62,0.06)]' : ''}
    >
      {children}
    </div>
  )
}

function formatExceeded(mins: number): string {
  if (mins < 60) return `${mins}м`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`
}

function getActiveBlockIndex(times: PrayerTimesResult, now: Date): number {
  if (now < times.fajr) return -1
  if (now < times.dhuhr) return 0
  if (now < times.asr) return 1
  if (now < times.maghrib) return 2
  if (now < times.isha) return 3
  return 4
}

function getHourMarks(blockStart: Date, blockEnd: Date): { topPx: number; label: string }[] {
  const marks: { topPx: number; label: string }[] = []
  const startHour = new Date(blockStart)
  startHour.setMinutes(0, 0, 0)
  startHour.setHours(startHour.getHours() + 1)
  let current = new Date(startHour)
  while (current < blockEnd) {
    const mins = differenceInMinutes(current, blockStart)
    const h = current.getHours().toString().padStart(2, '0')
    const m = current.getMinutes().toString().padStart(2, '0')
    marks.push({ topPx: mins * PX_PER_MIN, label: `${h}:${m}` })
    current = new Date(current.getTime() + 60 * 60 * 1000)
  }
  return marks
}

export function Timeline() {
  const prayerTimes = useAppStore((s) => s.prayerTimes)
  const tasks = useAppStore((s) => s.tasks)
  const completedPrayers = useAppStore((s) => s.completedPrayers)
  const togglePrayerCompleted = useAppStore((s) => s.togglePrayerCompleted)
  const reorderTasksInBlock = useAppStore((s) => s.reorderTasksInBlock)
  const moveTaskToBlock = useAppStore((s) => s.moveTaskToBlock)
  const [now, setNow] = useState(() => new Date())
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Collapsed state: by default all blocks are collapsed
  const [expandedBlocks, setExpandedBlocks] = useState<Set<TimeBlock>>(() => new Set())
  // Track previous task counts per block to detect additions
  const prevTaskCounts = useRef<Record<TimeBlock, number>>({
    'fajr-dhuhr': 0,
    'dhuhr-asr': 0,
    'asr-maghrib': 0,
    'maghrib-isha': 0,
    'after-isha': 0,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const tasksByBlock = useMemo(() => {
    const map: Record<TimeBlock, typeof tasks> = {
      'fajr-dhuhr': [],
      'dhuhr-asr': [],
      'asr-maghrib': [],
      'maghrib-isha': [],
      'after-isha': [],
    }
    for (const task of tasks) map[task.block].push(task)
    return map
  }, [tasks])

  const tasksById = useMemo(() => {
    const map = new Map<string, (typeof tasks)[number]>()
    for (const t of tasks) map.set(t.id, t)
    return map
  }, [tasks])

  // Auto-expand block when a task is added to it
  useEffect(() => {
    const toExpand: TimeBlock[] = []
    for (const block of BLOCK_ORDER) {
      const prev = prevTaskCounts.current[block]
      const curr = tasksByBlock[block].length
      if (curr > prev) toExpand.push(block)
      prevTaskCounts.current[block] = curr
    }
    if (toExpand.length > 0) {
      setExpandedBlocks((prev) => {
        const next = new Set(prev)
        for (const b of toExpand) next.add(b)
        return next
      })
    }
  }, [tasksByBlock])

  const toggleBlock = (block: TimeBlock) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(block)) next.delete(block)
      else next.add(block)
      return next
    })
  }

  const activeBlockIndex = prayerTimes ? getActiveBlockIndex(prayerTimes, now) : -1

  if (!prayerTimes) {
    return (
      <div className="max-w-[480px] mx-auto px-6 py-12 text-center font-body text-[var(--text-secondary)]">
        Загрузка времени намазов…
      </div>
    )
  }

  let taskIndex = 0

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeTask = tasksById.get(activeId)
    if (!activeTask) return

    let targetBlock: TimeBlock | null = null
    let overTaskId: string | undefined

    if (isBlockDroppableId(over.id)) {
      targetBlock = parseBlockDroppableId(overId)
    } else {
      const overTask = tasksById.get(overId)
      if (overTask) {
        targetBlock = overTask.block
        overTaskId = overId
      }
    }

    if (!targetBlock) return

    if (activeTask.block !== targetBlock) {
      moveTaskToBlock(activeId, targetBlock, overTaskId)
      return
    }

    if (overTaskId) {
      reorderTasksInBlock(activeId, overTaskId)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto px-6 pb-32 relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="timeline-container">
          {PRAYER_LIST.map((prayer, i) => {
            const time = prayerTimes[prayer.key]
            const isActive = activeBlockIndex === i
            const block = BLOCK_ORDER[i]!
            const blockTasks = tasksByBlock[block]
            const isExpanded = expandedBlocks.has(block)

            const isCompleted = Boolean(completedPrayers[prayer.key as PrayerKey])
            const status: PrayerStatus = isCompleted
              ? 'completed'
              : isActive
                ? 'active'
                : time > now
                  ? 'upcoming'
                  : 'missed'

            const nextPrayer = PRAYER_LIST[i + 1]
            const nextPrayerTime = nextPrayer ? prayerTimes[nextPrayer.key] : null
            const blockEnd = nextPrayerTime ?? addMinutes(time, AFTER_ISHA_MINUTES)
            const blockDurationMin = differenceInMinutes(blockEnd, time)
            const blockHeightPx = Math.max(60, blockDurationMin * PX_PER_MIN)

            const scheduledMinutes = blockTasks.reduce((sum, t) => sum + t.duration, 0)
            const exceededMinutes = Math.max(0, scheduledMinutes - blockDurationMin)
            const overbooked = exceededMinutes > 0

            const hourMarks = getHourMarks(time, blockEnd)

            const nowOffsetPx =
              isActive
                ? Math.max(0, Math.min(blockHeightPx, differenceInMinutes(now, time) * PX_PER_MIN))
                : null

            return (
              <div key={prayer.key}>
                <PrayerNode
                  name={prayer.name}
                  time={time}
                  status={status}
                  onToggleCompleted={() => togglePrayerCompleted(prayer.key as PrayerKey)}
                  index={i}
                  collapsed={!isExpanded}
                  onToggleCollapse={() => toggleBlock(block)}
                  taskCount={blockTasks.length}
                />

                <BlockDropZone block={block}>
                  <AnimatePresence initial={false}>
                    {isExpanded ? (
                      <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        {/* Full calendar block */}
                        <div
                          className="prayer-block relative"
                          style={{ minHeight: `${blockHeightPx}px` }}
                        >
                          {/* Vertical dashed line */}
                          <div
                            className="absolute border-l border-dashed border-[var(--border)]"
                            style={{ left: '13px', top: 0, bottom: 0 }}
                            aria-hidden
                          />

                          {/* Hour marks */}
                          {hourMarks.map((mark) => (
                            <div
                              key={mark.label}
                              className="absolute pointer-events-none flex items-center"
                              style={{ top: `${mark.topPx}px`, left: 0, right: 0, zIndex: 1 }}
                              aria-hidden
                            >
                              <span
                                className="font-body text-[9px] text-[var(--text-secondary)]"
                                style={{ width: 12, textAlign: 'right', lineHeight: 1, flexShrink: 0 }}
                              >
                                {mark.label.slice(0, 2)}
                              </span>
                              <div
                                style={{
                                  marginLeft: 4,
                                  flex: 1,
                                  height: 1,
                                  background: 'var(--border)',
                                  opacity: 0.5,
                                }}
                              />
                            </div>
                          ))}

                          {/* Current time indicator */}
                          {nowOffsetPx !== null && (
                            <div
                              className="absolute pointer-events-none flex items-center"
                              style={{ top: `${nowOffsetPx}px`, left: 0, right: 0, zIndex: 4 }}
                              aria-hidden
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: '#E05040',
                                  flexShrink: 0,
                                  marginLeft: 9,
                                }}
                              />
                              <div
                                style={{ flex: 1, height: 2, background: '#E05040', opacity: 0.75 }}
                              />
                            </div>
                          )}

                          {/* Tasks */}
                          <SortableContext
                            items={blockTasks.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div style={{ paddingLeft: 28, position: 'relative', zIndex: 2 }}>
                              {blockTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  index={taskIndex++}
                                  heightPx={Math.max(MIN_TASK_HEIGHT, task.duration * PX_PER_MIN)}
                                  overbooked={overbooked}
                                />
                              ))}
                            </div>
                          </SortableContext>

                          {overbooked && (
                            <div
                              className="font-body text-sm text-[var(--accent)] mt-1 pb-2"
                              style={{ paddingLeft: 28 }}
                            >
                              ⚠ Превышено на {formatExceeded(exceededMinutes)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Collapsed strip — just a thin dashed line */}
                        <div className="relative" style={{ height: 16 }}>
                          <div
                            className="absolute border-l border-dashed border-[var(--border)]"
                            style={{ left: '13px', top: 0, bottom: 0 }}
                            aria-hidden
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </BlockDropZone>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeTaskId ? (
            <div style={{ opacity: 0.9 }}>
              {(() => {
                const t = tasksById.get(activeTaskId)
                return t ? (
                  <TaskItem
                    task={t}
                    index={0}
                    heightPx={Math.max(MIN_TASK_HEIGHT, t.duration * PX_PER_MIN)}
                    overbooked={false}
                    isOverlay
                  />
                ) : null
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
