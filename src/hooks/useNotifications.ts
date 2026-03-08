import { useEffect } from 'react'
import { useAppStore, type PrayerKey } from '../store/useAppStore'

const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'Фаджр',
  dhuhr: 'Зухр',
  asr: 'Аср',
  maghrib: 'Магриб',
  isha: 'Иша',
}

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function useNotifications() {
  const prayerTimes = useAppStore((s) => s.prayerTimes)
  const reminderMinutes = useAppStore((s) => s.reminderMinutes)

  useEffect(() => {
    if (!prayerTimes || typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const timeouts: ReturnType<typeof setTimeout>[] = []
    const now = Date.now()

    for (const key of PRAYER_KEYS) {
      const prayerTime = prayerTimes[key]
      const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000)
      const delay = reminderTime.getTime() - now

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const id = setTimeout(() => {
          new Notification(`Намаз ${PRAYER_NAMES[key]}`, {
            body: `Через ${reminderMinutes} минут`,
            icon: '/icon-192.png',
            tag: `prayer-${key}`,
          })
        }, delay)
        timeouts.push(id)
      }
    }

    return () => timeouts.forEach(clearTimeout)
  }, [prayerTimes, reminderMinutes])
}
