import { format, differenceInMinutes, addMinutes } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useMemo, useState, useEffect } from 'react'
import { useAppStore, type PrayerTimesResult } from '../store/useAppStore'

const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Фаджр',
  dhuhr: 'Зухр',
  asr: 'Аср',
  maghrib: 'Магриб',
  isha: 'Иша',
}
const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

function getNextPrayer(now: Date, times: PrayerTimesResult): { name: string; time: Date } {
  for (const key of PRAYER_KEYS) {
    const time = times[key]
    if (time > now) return { name: PRAYER_NAMES[key] ?? key, time }
  }
  const tomorrowFajr = new Date(times.fajr)
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1)
  return { name: PRAYER_NAMES.fajr, time: tomorrowFajr }
}

function formatCountdown(now: Date, target: Date): string {
  const mins = differenceInMinutes(target, now)
  if (mins < 0) return ''
  if (mins < 60) return `${mins}м`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`
}

interface BlockProgress {
  pct: number
  blockName: string
  minsLeft: number
}

function getBlockProgress(now: Date, times: PrayerTimesResult): BlockProgress | null {
  if (now < times.fajr) return null

  const prayers = [
    { key: 'fajr' as const, name: 'Фаджр', time: times.fajr },
    { key: 'dhuhr' as const, name: 'Зухр', time: times.dhuhr },
    { key: 'asr' as const, name: 'Аср', time: times.asr },
    { key: 'maghrib' as const, name: 'Магриб', time: times.maghrib },
    { key: 'isha' as const, name: 'Иша', time: times.isha },
  ]

  for (let i = 0; i < prayers.length; i++) {
    const blockStart = prayers[i]!.time
    const blockEnd = i + 1 < prayers.length
      ? prayers[i + 1]!.time
      : addMinutes(times.isha, 180)

    if (now >= blockStart && now < blockEnd) {
      const total = differenceInMinutes(blockEnd, blockStart)
      const elapsed = differenceInMinutes(now, blockStart)
      const minsLeft = differenceInMinutes(blockEnd, now)
      return {
        pct: Math.min(100, Math.max(0, (elapsed / total) * 100)),
        blockName: prayers[i]!.name,
        minsLeft,
      }
    }
  }
  return null
}

interface TimeHeaderProps {
  onSettingsClick?: () => void
}

export function TimeHeader({ onSettingsClick }: TimeHeaderProps) {
  const prayerTimes = useAppStore((s) => s.prayerTimes)
  const location = useAppStore((s) => s.location)
  const [now, setNow] = useState(() => new Date())

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const displayNow = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const nextPrayer = useMemo(() => {
    if (!prayerTimes) return null
    return getNextPrayer(now, prayerTimes)
  }, [prayerTimes, now])

  const blockProgress = useMemo(() => {
    if (!prayerTimes) return null
    return getBlockProgress(now, prayerTimes)
  }, [prayerTimes, now])

  const displayNext =
    prayerTimes && nextPrayer
      ? `${nextPrayer.name} через ${formatCountdown(now, nextPrayer.time)}`
      : null

  return (
    <header className="max-w-[480px] mx-auto px-6 pt-8 pb-6">
      <div className="flex justify-between items-start font-body text-[13px] text-[var(--text-secondary)] tracking-[0.08em] uppercase">
        <span>{format(now, 'EEEE, d MMMM', { locale: ru })}</span>
        <div className="flex items-center gap-3 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 22s7-4.438 7-12a7 7 0 1 0-14 0c0 7.562 7 12 7 12Z"
                stroke="currentColor" strokeWidth="1.75"
              />
              <path
                d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="currentColor" strokeWidth="1.75"
              />
            </svg>
            <span className="font-body text-sm text-[var(--text-secondary)]">{location.city}</span>
          </span>
          {onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Настройки"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  stroke="currentColor" strokeWidth="1.75"
                />
                <path
                  d="M19.4 15a8.1 8.1 0 0 0 .1-1 8.1 8.1 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.2 8.2 0 0 0-1.7-1L15 3h-6l-.3 2.1a8.2 8.2 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a8.1 8.1 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.5 2 3.4 2.4-1c.53.4 1.1.74 1.7 1L9 21h6l.3-2.1c.6-.26 1.17-.6 1.7-1l2.4 1 2-3.4-2-1.5Z"
                  stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p
        className="font-display text-5xl font-semibold text-[var(--text-primary)] mt-2 tracking-tight"
        style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
      >
        {displayNow}
      </p>

      {displayNext && (
        <p className="font-body text-sm text-[var(--accent)] mt-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] prayer-pulse" aria-hidden />
          <span>Следующий намаз: {displayNext}</span>
        </p>
      )}

      {/* Block progress bar */}
      {blockProgress && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-body text-[11px] text-[var(--text-secondary)]">
              После {blockProgress.blockName}
            </span>
            <span className="font-body text-[11px] text-[var(--text-secondary)]">
              {blockProgress.minsLeft < 60
                ? `осталось ${blockProgress.minsLeft}м`
                : `осталось ${Math.floor(blockProgress.minsLeft / 60)}ч ${blockProgress.minsLeft % 60}м`}
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${blockProgress.pct}%`,
                background: 'var(--prayer-dot)',
              }}
            />
          </div>
        </div>
      )}
    </header>
  )
}
