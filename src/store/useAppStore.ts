import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimeBlock =
  | 'fajr-dhuhr'
  | 'dhuhr-asr'
  | 'asr-maghrib'
  | 'maghrib-isha'
  | 'after-isha'

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskRecurring = 'none' | 'daily'

export interface Task {
  id: string
  name: string
  time?: string
  block: TimeBlock
  priority: TaskPriority
  completed: boolean
  recurring: TaskRecurring
}

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'Other'

export interface LocationState {
  lat: number
  lng: number
  city: string
}

export interface PrayerTimesResult {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

function computeBlock(timeStr: string | undefined, prayerTimes: PrayerTimesResult | null): TimeBlock {
  let taskDate: Date
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    taskDate = new Date()
    taskDate.setHours(h!, m!, 0, 0)
  } else {
    taskDate = new Date()
  }

  if (!prayerTimes) {
    const h = taskDate.getHours()
    if (h < 12) return 'fajr-dhuhr'
    if (h < 15) return 'dhuhr-asr'
    if (h < 18) return 'asr-maghrib'
    if (h < 20) return 'maghrib-isha'
    return 'after-isha'
  }

  if (taskDate < prayerTimes.dhuhr) return 'fajr-dhuhr'
  if (taskDate < prayerTimes.asr) return 'dhuhr-asr'
  if (taskDate < prayerTimes.maghrib) return 'asr-maghrib'
  if (taskDate < prayerTimes.isha) return 'maghrib-isha'
  return 'after-isha'
}

interface AppState {
  location: LocationState
  calculationMethod: CalculationMethodKey
  asrJuristic: 'Standard' | 'Hanafi'
  reminderMinutes: 5 | 10 | 15
  theme: 'light' | 'dark'
  tasks: Task[]
  prayerTimes: PrayerTimesResult | null
  completedPrayers: Partial<Record<PrayerKey, boolean>>
  completedPrayersDate: string
  prayerHistory: Record<string, Partial<Record<PrayerKey, boolean>>>
  setLocation: (location: Partial<LocationState>) => void
  setCalculationMethod: (method: CalculationMethodKey) => void
  setAsrJuristic: (juristic: 'Standard' | 'Hanafi') => void
  setReminderMinutes: (minutes: 5 | 10 | 15) => void
  toggleTheme: () => void
  setPrayerTimes: (times: PrayerTimesResult | null) => void
  togglePrayerCompleted: (key: PrayerKey) => void
  checkAndResetCompletedPrayers: () => void
  addTask: (task: Pick<Task, 'name' | 'time' | 'priority' | 'recurring'>) => void
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
}

const defaultLocation: LocationState = {
  lat: 41.311081,
  lng: 69.240562,
  city: 'Ташкент',
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      location: defaultLocation,
      calculationMethod: 'MuslimWorldLeague',
      asrJuristic: 'Standard',
      reminderMinutes: 10,
      theme: 'light',
      tasks: [],
      prayerTimes: null,
      completedPrayers: {},
      completedPrayersDate: todayStr(),
      prayerHistory: {},

      setLocation: (location) =>
        set((state) => ({
          location: { ...state.location, ...location },
        })),

      setCalculationMethod: (calculationMethod) => set({ calculationMethod }),
      setAsrJuristic: (asrJuristic) => set({ asrJuristic }),
      setReminderMinutes: (reminderMinutes) => set({ reminderMinutes }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      setPrayerTimes: (prayerTimes) => set({ prayerTimes }),

      togglePrayerCompleted: (key) =>
        set((state) => ({
          completedPrayers: {
            ...state.completedPrayers,
            [key]: !state.completedPrayers[key],
          },
        })),

      checkAndResetCompletedPrayers: () =>
        set((state) => {
          const today = todayStr()
          if (state.completedPrayersDate === today) return state

          const prayerHistory = {
            ...state.prayerHistory,
            [state.completedPrayersDate]: state.completedPrayers,
          }

          const tasks = state.tasks.map((t) =>
            t.recurring === 'daily' ? { ...t, completed: false } : t
          )

          return {
            completedPrayers: {},
            completedPrayersDate: today,
            prayerHistory,
            tasks,
          }
        }),

      addTask: (task) =>
        set((state) => {
          const block = computeBlock(task.time, get().prayerTimes)
          return {
            tasks: [
              ...state.tasks,
              {
                ...task,
                id: crypto.randomUUID(),
                completed: false,
                block,
              },
            ],
          }
        }),

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'namazvaqt-store',
      partialize: (state) => ({
        location: state.location,
        calculationMethod: state.calculationMethod,
        asrJuristic: state.asrJuristic,
        reminderMinutes: state.reminderMinutes,
        theme: state.theme,
        tasks: state.tasks,
        completedPrayers: state.completedPrayers,
        completedPrayersDate: state.completedPrayersDate,
        prayerHistory: state.prayerHistory,
      }),
    }
  )
)
