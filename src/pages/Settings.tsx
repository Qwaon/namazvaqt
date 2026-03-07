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

  return (
    <div className="max-w-[480px] mx-auto px-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-8">
        Настройки
      </h1>

      <section className="space-y-4 mb-10">
        <h2 className="font-body text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Местоположение
        </h2>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={location.city}
            onChange={(e) => setLocation({ city: e.target.value })}
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
