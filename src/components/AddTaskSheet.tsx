import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type TaskPriority, type TaskRecurring } from '../store/useAppStore'

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Низкий', color: 'var(--text-secondary)' },
  { value: 'medium', label: 'Средний', color: 'var(--accent)' },
  { value: 'high', label: 'Высокий', color: 'var(--prayer-dot)' },
]

function nowTimeStr(): string {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = (h! * 60 + m! + mins + 1440) % 1440
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

interface AddTaskSheetProps {
  open: boolean
  onClose: () => void
}

export function AddTaskSheet({ open, onClose }: AddTaskSheetProps) {
  const addTask = useAppStore((s) => s.addTask)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [recurring, setRecurring] = useState<TaskRecurring>('none')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addTask({ name: name.trim(), time: time || undefined, priority, recurring })
    setName('')
    setTime('')
    setPriority('medium')
    setRecurring('none')
    onClose()
  }

  const setNowTime = () => setTime(nowTimeStr())
  const setPlus30 = () => setTime(addMinutes(time || nowTimeStr(), 30))
  const setPlus60 = () => setTime(addMinutes(time || nowTimeStr(), 60))

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
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl max-w-[480px] mx-auto shadow-[0_-1px_3px_rgba(0,0,0,0.06)]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
            </div>

            <div className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Что нужно сделать?"
                  autoFocus
                  className="w-full font-display text-xl text-[var(--text-primary)] bg-transparent border-b border-[var(--border)] pb-2 outline-none placeholder:text-[var(--text-secondary)]"
                />

                {/* Time */}
                <div>
                  {/* Shortcuts */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={setNowTime}
                      className="px-3 py-1 font-body text-xs rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--prayer-dot)] hover:text-[var(--prayer-dot)] transition-colors"
                    >
                      Сейчас
                    </button>
                    <button
                      type="button"
                      onClick={setPlus30}
                      className="px-3 py-1 font-body text-xs rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--prayer-dot)] hover:text-[var(--prayer-dot)] transition-colors"
                    >
                      +30 мин
                    </button>
                    <button
                      type="button"
                      onClick={setPlus60}
                      className="px-3 py-1 font-body text-xs rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--prayer-dot)] hover:text-[var(--prayer-dot)] transition-colors"
                    >
                      +1 час
                    </button>
                    {time && (
                      <button
                        type="button"
                        onClick={() => setTime('')}
                        className="ml-auto font-body text-xs text-[var(--text-secondary)] opacity-60 hover:opacity-100 transition-opacity"
                      >
                        ✕ убрать
                      </button>
                    )}
                  </div>

                  {/* Time input */}
                  <label
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-text transition-colors ${
                      time
                        ? 'border-[var(--prayer-dot)] bg-[rgba(44,74,62,0.05)]'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    }`}
                  >
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      className="flex-shrink-0"
                      style={{ color: time ? 'var(--prayer-dot)' : 'var(--text-secondary)' }}
                    >
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex-1 font-display text-2xl bg-transparent outline-none"
                      style={{
                        color: time ? 'var(--text-primary)' : 'var(--text-secondary)',
                        minWidth: 0,
                      }}
                    />
                    {!time && (
                      <span className="font-body text-sm text-[var(--text-secondary)] opacity-50 pointer-events-none">
                        не указано → сейчас
                      </span>
                    )}
                  </label>
                </div>

                {/* Priority */}
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className="flex-1 py-2 font-body text-sm rounded-xl border transition-colors flex items-center justify-center gap-1.5"
                      style={{
                        borderColor: priority === p.value ? p.color : 'var(--border)',
                        background: priority === p.value ? 'var(--surface)' : 'transparent',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                        aria-hidden
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Recurring */}
                <div className="flex gap-2">
                  {([
                    { value: 'none' as TaskRecurring, label: 'Однажды' },
                    { value: 'daily' as TaskRecurring, label: '↻ Каждый день' },
                  ]).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRecurring(r.value)}
                      className={`flex-1 py-2 font-body text-sm rounded-xl border transition-colors ${
                        recurring === r.value
                          ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                          : 'border-[var(--border)] bg-transparent text-[var(--text-primary)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 font-body text-sm font-medium text-white bg-[var(--prayer-dot)] rounded-xl"
                >
                  Добавить
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
