import { create } from 'zustand'

export type TimeBlock =
  | 'fajr-dhuhr'
  | 'dhuhr-asr'
  | 'asr-maghrib'
  | 'maghrib-isha'
  | 'after-isha'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  name: string
  duration: number
  block: TimeBlock
  priority: TaskPriority
  completed: boolean
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
  tasks: Task[]
  prayerTimes: PrayerTimesResult | null
  completedPrayers: Partial<Record<PrayerKey, boolean>>
  setLocation: (location: Partial<LocationState>) => void
  setCalculationMethod: (method: CalculationMethodKey) => void
  setAsrJuristic: (juristic: 'Standard' | 'Hanafi') => void
  setReminderMinutes: (minutes: 5 | 10 | 15) => void
  setPrayerTimes: (times: PrayerTimesResult | null) => void
  togglePrayerCompleted: (key: PrayerKey) => void
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
}

const defaultLocation: LocationState = {
  lat: 41.311081,
  lng: 69.240562,
  city: 'Ташкент',
}

export const useAppStore = create<AppState>((set) => ({
  location: defaultLocation,
  calculationMethod: 'MuslimWorldLeague',
  asrJuristic: 'Standard',
  reminderMinutes: 10,
  tasks: [],
  prayerTimes: null,
  completedPrayers: {},

  setLocation: (location) =>
    set((state) => ({
      location: { ...state.location, ...location },
    })),

  setCalculationMethod: (calculationMethod) => set({ calculationMethod }),
  setAsrJuristic: (asrJuristic) => set({ asrJuristic }),
  setReminderMinutes: (reminderMinutes) => set({ reminderMinutes }),
  setPrayerTimes: (prayerTimes) => set({ prayerTimes }),

  togglePrayerCompleted: (key) =>
    set((state) => ({
      completedPrayers: {
        ...state.completedPrayers,
        [key]: !state.completedPrayers[key],
      },
    })),

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
}))
