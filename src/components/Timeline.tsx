import { useMemo, useEffect, useState } from 'react'
import { differenceInMinutes } from 'date-fns'
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

const PIXELS_PER_MINUTE = 0.5
const MAX_BLOCK_HEIGHT = 300
const MIN_BLOCK_HEIGHT = 80
const PRAYER_ROW_HEIGHT_PX = 56
const TASK_MIN_HEIGHT_PX = 44
const TASK_MAX_HEIGHT_PX = 120
const TASK_GAP_PX = 10
const AFTER_ISHA_MINUTES = 180

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

function formatExceeded(mins: number): string {
  if (mins <= 0) return '0м'
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

export function Timeline() {
  const prayerTimes = useAppStore((s) => s.prayerTimes)
  const tasks = useAppStore((s) => s.tasks)
  const completedPrayers = useAppStore((s) => s.completedPrayers)
  const togglePrayerCompleted = useAppStore((s) => s.togglePrayerCompleted)
  const [now, setNow] = useState(() => new Date())

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
    for (const task of tasks) {
      map[task.block].push(task)
    }
    return map
  }, [tasks])

  const activeBlockIndex = prayerTimes ? getActiveBlockIndex(prayerTimes, now) : -1

  const layout = useMemo(() => {
    if (!prayerTimes) return null

    const blockMinutes = [
      differenceInMinutes(prayerTimes.dhuhr, prayerTimes.fajr),
      differenceInMinutes(prayerTimes.asr, prayerTimes.dhuhr),
      differenceInMinutes(prayerTimes.maghrib, prayerTimes.asr),
      differenceInMinutes(prayerTimes.isha, prayerTimes.maghrib),
      AFTER_ISHA_MINUTES,
    ]

    const blockHeights = blockMinutes.map((m) =>
      clamp(m * PIXELS_PER_MINUTE, MIN_BLOCK_HEIGHT, MAX_BLOCK_HEIGHT)
    )

    const prayerTops: number[] = []
    for (let i = 0; i < PRAYER_LIST.length; i++) {
      if (i === 0) {
        prayerTops.push(0)
      } else {
        prayerTops.push(prayerTops[i - 1] + (blockHeights[i - 1] ?? 0))
      }
    }

    const endTop = prayerTops[prayerTops.length - 1] + blockHeights[blockHeights.length - 1]

    return {
      prayerTops,
      blockMinutes,
      blockHeights,
      endTop,
    }
  }, [prayerTimes, now])

  if (!prayerTimes) {
    return (
      <div className="max-w-[480px] mx-auto px-6 py-12 text-center font-body text-[var(--text-secondary)]">
        Загрузка времени намазов…
      </div>
    )
  }

  if (!layout) {
    return (
      <div className="max-w-[480px] mx-auto px-6 py-12 text-center font-body text-[var(--text-secondary)]">
        Загрузка времени намазов…
      </div>
    )
  }

  const containerHeight = Math.max(layout.endTop + 24, 420)

  let taskIndex = 0

  return (
    <div className="max-w-[480px] mx-auto px-6 pb-32 relative">
      <div className="relative pl-12" style={{ height: containerHeight }}>
        {PRAYER_LIST.map((prayer, i) => {
          const time = prayerTimes[prayer.key]
          const isActive = activeBlockIndex === i
          const block = BLOCK_ORDER[i]
          const blockTasks = tasksByBlock[block]

          const isCompleted = Boolean(completedPrayers[prayer.key as PrayerKey])
          const status: PrayerStatus = isCompleted
            ? 'completed'
            : isActive
              ? 'active'
              : time > now
                ? 'upcoming'
                : 'missed'

          const blockHeight = layout.blockHeights[i] ?? 0
          const segmentTop = layout.prayerTops[i] ?? 0

          const tasksAreaTop = segmentTop + PRAYER_ROW_HEIGHT_PX
          const tasksAreaHeight = Math.max(blockHeight - PRAYER_ROW_HEIGHT_PX, 0)

          const blockDurationMin = layout.blockMinutes[i] ?? 0
          const elapsedMin = isActive ? differenceInMinutes(now, time) : null
          const clampedElapsedMin =
            elapsedMin !== null ? Math.min(Math.max(elapsedMin, 0), Math.max(0, blockDurationMin)) : null
          const progress =
            clampedElapsedMin !== null && blockDurationMin > 0 ? clampedElapsedMin / blockDurationMin : null
          const clampedNowInTasksArea =
            isActive && progress !== null ? Math.min(Math.max(progress * tasksAreaHeight, 0), tasksAreaHeight) : null

          const taskHeights = blockTasks.map((t) =>
            clamp(t.duration * PIXELS_PER_MINUTE, TASK_MIN_HEIGHT_PX, TASK_MAX_HEIGHT_PX)
          )
          const tasksTotalHeight =
            taskHeights.reduce((a, b) => a + b, 0) +
            Math.max(0, blockTasks.length - 1) * TASK_GAP_PX

          const overbooked = tasksTotalHeight > tasksAreaHeight
          const exceededMinutes = Math.max(
            0,
            (blockTasks.reduce((sum, t) => sum + t.duration, 0) - (layout.blockMinutes[i] ?? 0))
          )

          let cursorTop = tasksAreaTop

          return (
            <div key={prayer.key}>
              <PrayerNode
                name={prayer.name}
                time={time}
                status={status}
                onToggleCompleted={() => togglePrayerCompleted(prayer.key as PrayerKey)}
                index={i}
                style={{ position: 'absolute', top: segmentTop, left: 0, right: 0 }}
              />

              <div
                className="absolute border-l border-dashed border-[var(--border)]"
                style={{ left: '13px', top: segmentTop + 18, height: Math.max(blockHeight - 18, 0) }}
                aria-hidden
              />

              {clampedNowInTasksArea !== null && (
                <>
                  <div
                    className="absolute left-0 right-0 h-px bg-[var(--accent)]"
                    style={{ top: tasksAreaTop + clampedNowInTasksArea }}
                    aria-hidden
                  />
                  <div
                    className="absolute -left-[9px] w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                    style={{ top: tasksAreaTop + clampedNowInTasksArea - 3 }}
                    aria-hidden
                  />
                </>
              )}

              {blockTasks.map((task, j) => {
                const h = taskHeights[j] ?? TASK_MIN_HEIGHT_PX
                const compact = task.duration < 20
                const top = cursorTop
                cursorTop += h + TASK_GAP_PX

                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={taskIndex++}
                    compact={compact}
                    overbooked={overbooked}
                    style={{ position: 'absolute', top, left: 0, right: 0, height: h }}
                  />
                )
              })}

              {overbooked && exceededMinutes > 0 && (
                <div
                  className="absolute font-body text-sm text-[var(--accent)]"
                  style={{ top: tasksAreaTop + tasksAreaHeight + 8, left: 0, right: 0 }}
                >
                  ⚠ Превышено на {formatExceeded(exceededMinutes)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
