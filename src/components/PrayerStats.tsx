import { useAppStore, type PrayerKey, todayStr } from '../store/useAppStore'

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const PRAYER_SHORT: Record<PrayerKey, string> = {
  fajr: 'Ф',
  dhuhr: 'З',
  asr: 'А',
  maghrib: 'М',
  isha: 'И',
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })
}

export function PrayerStats() {
  const prayerHistory = useAppStore((s) => s.prayerHistory)
  const completedPrayers = useAppStore((s) => s.completedPrayers)

  const today = todayStr()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const completions = dateStr === today ? completedPrayers : (prayerHistory[dateStr] ?? {})
    const count = PRAYER_KEYS.filter((k) => completions[k]).length
    return { dateStr, completions, count, isToday: dateStr === today }
  })

  const totalPossible = 7 * 5
  const totalDone = days.reduce((sum, d) => sum + d.count, 0)
  const pct = Math.round((totalDone / totalPossible) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-sm text-[var(--text-secondary)]">
          За 7 дней: {totalDone}/{totalPossible}
        </span>
        <span
          className="font-body text-sm font-medium"
          style={{ color: pct >= 80 ? 'var(--prayer-dot)' : pct >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          {pct}%
        </span>
      </div>

      {days.map((day) => (
        <div key={day.dateStr} className="flex items-center gap-3">
          <span
            className="font-body text-xs w-16 flex-shrink-0"
            style={{
              color: day.isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: day.isToday ? 600 : 400,
            }}
          >
            {formatDay(day.dateStr)}
          </span>
          <div className="flex gap-1.5">
            {PRAYER_KEYS.map((key) => (
              <div
                key={key}
                title={key}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: day.completions[key] ? 'var(--prayer-dot)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="font-body"
                  style={{
                    fontSize: 10,
                    color: day.completions[key] ? '#F5F0E8' : 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {PRAYER_SHORT[key]}
                </span>
              </div>
            ))}
          </div>
          <span className="font-body text-xs text-[var(--text-secondary)]">
            {day.count}/5
          </span>
        </div>
      ))}
    </div>
  )
}
