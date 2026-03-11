import { useMemo, useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

function getActiveBlockIndex(times: PrayerTimesResult, now: Date): number {
  if (now < times.fajr) return -1
  if (now < times.dhuhr) return 0
  if (now < times.asr) return 1
  if (now < times.maghrib) return 2
  if (now < times.isha) return 3
  return 4
}

export function Timeline() {
  const prayerTimes = useAppStore((s) => s.prayerTimes)
  const tasks = useAppStore((s) => s.tasks)
  const completedPrayers = useAppStore((s) => s.completedPrayers)
  const togglePrayerCompleted = useAppStore((s) => s.togglePrayerCompleted)
  const [now, setNow] = useState(() => new Date())

  const [expandedBlocks, setExpandedBlocks] = useState<Set<TimeBlock>>(() => new Set())
  const prevTaskCounts = useRef<Record<TimeBlock, number>>({
    'fajr-dhuhr': 0,
    'dhuhr-asr': 0,
    'asr-maghrib': 0,
    'maghrib-isha': 0,
    'after-isha': 0,
  })

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
    for (const block of BLOCK_ORDER) {
      map[block].sort((a, b) => {
        if (!a.time && !b.time) return 0
        if (!a.time) return 1
        if (!b.time) return -1
        return a.time.localeCompare(b.time)
      })
    }
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

  return (
    <div className="max-w-[480px] mx-auto px-6 pb-32 relative">
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
                    <div className="prayer-block relative">
                      <div
                        className="absolute border-l border-dashed border-[var(--border)]"
                        style={{ left: '13px', top: 0, bottom: 0 }}
                        aria-hidden
                      />
                      <div style={{ paddingLeft: 28 }}>
                        {blockTasks.length === 0 ? (
                          <div
                            className="font-body text-sm text-[var(--text-secondary)] py-3"
                            style={{ opacity: 0.45 }}
                          >
                            Нет задач
                          </div>
                        ) : (
                          blockTasks.map((task, idx) => (
                            <TaskItem key={task.id} task={task} index={idx} />
                          ))
                        )}
                      </div>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
