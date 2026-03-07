import { useEffect, useMemo, useState } from 'react'
import { useAppStore, type CalculationMethodKey } from '../store/useAppStore'
import { useLocation } from '../hooks/useLocation'

const CALC_METHODS: { value: CalculationMethodKey; label: string }[] = [
  { value: 'MuslimWorldLeague', label: 'Всемирная исламская лига' },
  { value: 'Egyptian', label: 'Египет' },
  { value: 'Karachi', label: 'Карачи' },
  { value: 'UmmAlQura', label: 'Умм аль-Кура' },
  { value: 'Dubai', label: 'Дубай' },
  { value: 'MoonsightingCommittee', label: 'Комитет по наблюдению Луны' },
  { value: 'NorthAmerica', label: 'Северная Америка' },
  { value: 'Kuwait', label: 'Кувейт' },
  { value: 'Qatar', label: 'Катар' },
  { value: 'Singapore', label: 'Сингапур' },
  { value: 'Tehran', label: 'Тегеран' },
  { value: 'Turkey', label: 'Турция' },
  { value: 'Other', label: 'Другое' },
]

export function Settings() {
  const {
    location,
    calculationMethod,
    asrJuristic,
    reminderMinutes,
    setCalculationMethod,
    setAsrJuristic,
    setReminderMinutes,
    setLocation,
  } = useAppStore()
  const { loading, error, getCurrentPosition } = useLocation()

  const [cityQuery, setCityQuery] = useState(location.city)
  const [cityResults, setCityResults] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const [cityLoading, setCityLoading] = useState(false)

  useEffect(() => {
    setCityQuery(location.city)
  }, [location.city])

  const canSearch = useMemo(() => cityQuery.trim().length >= 2, [cityQuery])

  useEffect(() => {
    if (!canSearch) {
      setCityResults([])
      return
    }

    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        setCityLoading(true)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=5`,
          {
            signal: controller.signal,
            headers: {
              'Accept-Language': 'ru',
            },
          }
        )
        const data = await res.json()
        const mapped = (Array.isArray(data) ? data : []).map((place: any) => ({
          name: String(place.display_name ?? ''),
          lat: Number.parseFloat(place.lat),
          lng: Number.parseFloat(place.lon),
        }))
        setCityResults(mapped.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.name))
      } catch {
        setCityResults([])
      } finally {
        setCityLoading(false)
      }
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [canSearch, cityQuery])

  const onSelectCity = (r: { name: string; lat: number; lng: number }) => {
    setLocation({ city: r.name, lat: r.lat, lng: r.lng })
    setCityResults([])
  }

  return (
    <div className="max-w-[480px] mx-auto px-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-8">
        Настройки
      </h1>

      <section className="space-y-4 mb-10">
        <h2 className="font-body text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Местоположение
        </h2>
        <div className="relative">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Город"
              className="flex-1 font-body text-[var(--text-primary)] px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none"
            />
            <button
              type="button"
              onClick={getCurrentPosition}
              disabled={loading}
              className="font-body text-sm px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] disabled:opacity-50"
            >
              {loading ? '…' : 'GPS'}
            </button>
          </div>

          {cityLoading && (
            <div className="mt-2 font-body text-xs text-[var(--text-secondary)]">Поиск…</div>
          )}

          {cityResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden z-20">
              {cityResults.map((r) => (
                <button
                  key={`${r.lat}-${r.lng}-${r.name}`}
                  type="button"
                  onClick={() => onSelectCity(r)}
                  className="w-full text-left px-3 py-2 font-body text-sm text-[var(--text-primary)] hover:bg-[var(--bg)]"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p className="font-body text-sm text-[var(--accent)]">{error}</p>
        )}
        <p className="font-body text-xs text-[var(--text-secondary)]">
          Координаты: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-body text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Метод расчёта
        </h2>
        <select
          value={calculationMethod}
          onChange={(e) => setCalculationMethod(e.target.value as CalculationMethodKey)}
          className="w-full font-body text-[var(--text-primary)] px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none"
        >
          {CALC_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-body text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Мазхаб для Асра
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAsrJuristic('Standard')}
            className={`flex-1 py-2 font-body text-sm rounded-md border ${
              asrJuristic === 'Standard'
                ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
            }`}
          >
            Обычный
          </button>
          <button
            type="button"
            onClick={() => setAsrJuristic('Hanafi')}
            className={`flex-1 py-2 font-body text-sm rounded-md border ${
              asrJuristic === 'Hanafi'
                ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
            }`}
          >
            Ханафи
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-body text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Напоминание перед намазом
        </h2>
        <div className="flex gap-2">
          {([5, 10, 15] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setReminderMinutes(m)}
              className={`flex-1 py-2 font-body text-sm rounded-md border ${
                reminderMinutes === m
                  ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
              }`}
            >
              {m} мин
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
