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
  duration: number
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
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  reorderTasksInBlock: (activeId: string, overId: string) => void
  moveTaskToBlock: (activeId: string, targetBlock: TimeBlock, overId?: string) => void
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
    (set) => ({
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

          // Reset completed flag on daily recurring tasks
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
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: crypto.randomUUID(),
              completed: false,
            },
          ],
        })),

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      reorderTasksInBlock: (activeId, overId) =>
        set((state) => {
          if (activeId === overId) return state

          const activeTask = state.tasks.find((t) => t.id === activeId)
          const overTask = state.tasks.find((t) => t.id === overId)
          if (!activeTask || !overTask) return state
          if (activeTask.block !== overTask.block) return state

          const block = activeTask.block
          const blockIndices: number[] = []
          for (let i = 0; i < state.tasks.length; i++) {
            if (state.tasks[i]?.block === block) blockIndices.push(i)
          }

          const from = blockIndices.findIndex((idx) => state.tasks[idx]?.id === activeId)
          const to = blockIndices.findIndex((idx) => state.tasks[idx]?.id === overId)
          if (from < 0 || to < 0 || from === to) return state

          const next = [...state.tasks]
          const fromIndex = blockIndices[from]!
          const toIndex = blockIndices[to]!
          const [moved] = next.splice(fromIndex, 1)
          const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
          next.splice(insertIndex, 0, moved!)

          return { tasks: next }
        }),

      moveTaskToBlock: (activeId, targetBlock, overId) =>
        set((state) => {
          const activeIndex = state.tasks.findIndex((t) => t.id === activeId)
          if (activeIndex < 0) return state

          const next = [...state.tasks]
          const [removed] = next.splice(activeIndex, 1)
          if (!removed) return state

          const moved: Task = { ...removed, block: targetBlock }

          if (overId) {
            const overIndex = next.findIndex((t) => t.id === overId)
            if (overIndex >= 0) {
              next.splice(overIndex, 0, moved)
              return { tasks: next }
            }
          }

          const lastIndexInBlock = (() => {
            let idx = -1
            for (let i = 0; i < next.length; i++) {
              if (next[i]?.block === targetBlock) idx = i
            }
            return idx
          })()

          if (lastIndexInBlock >= 0) {
            next.splice(lastIndexInBlock + 1, 0, moved)
          } else {
            next.push(moved)
          }

          return { tasks: next }
        }),

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
