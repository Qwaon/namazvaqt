import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type TimeBlock, type TaskPriority } from '../store/useAppStore'

const DURATIONS = [15, 30, 60, 120] as const
const BLOCKS: { value: TimeBlock; label: string }[] = [
  { value: 'fajr-dhuhr', label: 'Фаджр – Зухр' },
  { value: 'dhuhr-asr', label: 'Зухр – Аср' },
  { value: 'asr-maghrib', label: 'Аср – Магриб' },
  { value: 'maghrib-isha', label: 'Магриб – Иша' },
  { value: 'after-isha', label: 'После Иша' },
]
const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Низкий', color: 'var(--text-secondary)' },
  { value: 'medium', label: 'Средний', color: 'var(--accent)' },
  { value: 'high', label: 'Высокий', color: 'var(--prayer-dot)' },
]

interface AddTaskSheetProps {
  open: boolean
  onClose: () => void
}

export function AddTaskSheet({ open, onClose }: AddTaskSheetProps) {
  const addTask = useAppStore((s) => s.addTask)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState<number>(30)
  const [customMinutes, setCustomMinutes] = useState('')
  const [block, setBlock] = useState<TimeBlock>('fajr-dhuhr')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const durationMinutes = customMinutes ? parseInt(customMinutes, 10) || duration : duration

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addTask({
      name: name.trim(),
      duration: durationMinutes,
      block,
      priority,
    })
    setName('')
    setDuration(30)
    setCustomMinutes('')
    setBlock('fajr-dhuhr')
    setPriority('medium')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl max-w-[480px] mx-auto shadow-[0_-1px_3px_rgba(0,0,0,0.06)]"
          >
            <div className="p-6 pb-[env(safe-area-inset-bottom)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Что нужно сделать?"
                    className="w-full font-display text-xl text-[var(--text-primary)] bg-transparent border-b border-[var(--border)] pb-2 outline-none placeholder:text-[var(--text-secondary)]"
                  />
                </div>

                <div>
                  <p className="font-body text-sm text-[var(--text-secondary)] mb-2">
                    Длительность
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {DURATIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setDuration(m)
                          setCustomMinutes('')
                        }}
                        className={`px-3 py-1.5 font-body text-sm rounded-md border transition-colors ${
                          !customMinutes && duration === m
                            ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                            : 'bg-transparent border-[var(--border)] text-[var(--text-primary)]'
                        }`}
                      >
                        {m === 60 ? '1ч' : m === 120 ? '2ч' : `${m}м`}
                      </button>
                    ))}
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min={5}
                        max={480}
                        placeholder="Своё"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-16 px-2 py-1.5 font-body text-sm rounded-md border border-[var(--border)] bg-transparent text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {customMinutes && <span className="font-body text-sm text-[var(--text-secondary)]">мин</span>}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-body text-sm text-[var(--text-secondary)] mb-2">
                    Временной блок
                  </p>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value as TimeBlock)}
                    className="w-full font-body text-sm px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] outline-none"
                  >
                    {BLOCKS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="font-body text-sm text-[var(--text-secondary)] mb-2">
                    Приоритет
                  </p>
                  <div className="space-y-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`w-full px-3 py-2 font-body text-sm rounded-md border transition-colors flex items-center justify-between ${
                          priority === p.value
                            ? 'bg-[var(--surface)]'
                            : 'bg-transparent'
                        }`}
                        style={{
                          borderColor: priority === p.value ? p.color : 'var(--border)',
                        }}
                      >
                        <span className="inline-flex items-center gap-2 text-[var(--text-primary)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                            aria-hidden
                          />
                          <span>{p.label}</span>
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {priority === p.value ? 'выбрано' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 font-body text-sm font-medium text-white bg-[var(--text-primary)] rounded-lg"
                >
                  Добавить в день
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
