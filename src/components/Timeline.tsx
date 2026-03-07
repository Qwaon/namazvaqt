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

const AFTER_ISHA_MINUTES = 180

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

  if (!prayerTimes) {
    return (
      <div className="max-w-[480px] mx-auto px-6 py-12 text-center font-body text-[var(--text-secondary)]">
        Загрузка времени намазов…
      </div>
    )
  }

  let taskIndex = 0

  return (
    <div className="max-w-[480px] mx-auto px-6 pb-32 relative">
      <div className="pl-12">
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

          const nextPrayer = PRAYER_LIST[i + 1]
          const nextPrayerTime = nextPrayer ? prayerTimes[nextPrayer.key] : null
          const blockDurationMin = nextPrayerTime
            ? differenceInMinutes(nextPrayerTime, time)
            : AFTER_ISHA_MINUTES

          const scheduledMinutes = blockTasks.reduce((sum, t) => sum + t.duration, 0)
          const exceededMinutes = Math.max(0, scheduledMinutes - blockDurationMin)
          const overbooked = exceededMinutes > 0

          return (
            <div key={prayer.key}>
              <PrayerNode
                name={prayer.name}
                time={time}
                status={status}
                onToggleCompleted={() => togglePrayerCompleted(prayer.key as PrayerKey)}
                index={i}
              />

              <div className="prayer-block relative">
                <div
                  className="absolute border-l border-dashed border-[var(--border)]"
                  style={{ left: '13px', top: 0, bottom: 0 }}
                  aria-hidden
                />

                <div className="space-y-2">
                  {blockTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      index={taskIndex++}
                      compact={task.duration < 20}
                      overbooked={overbooked}
                    />
                  ))}
                </div>

                {overbooked && (
                  <div className="font-body text-sm text-[var(--accent)] mt-2">
                    ⚠ Превышено на {formatExceeded(exceededMinutes)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
