import { useCallback, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useLocation() {
  const { setLocation } = useAppStore()
  const location = useAppStore((s) => s.location)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCityFromCoords = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        )
        const data = await res.json()
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          data.name ||
          'Неизвестно'
        setLocation({ lat, lng, city })
        return city
      } catch {
        setLocation({ lat, lng, city: `${lat.toFixed(2)}, ${lng.toFixed(2)}` })
        return null
      }
    },
    [setLocation]
  )

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await fetchCityFromCoords(latitude, longitude)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Не удалось определить местоположение')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }, [fetchCityFromCoords])

  return { location, loading, error, getCurrentPosition, fetchCityFromCoords }
}
