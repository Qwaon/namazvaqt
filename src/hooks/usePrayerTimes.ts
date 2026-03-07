import { useEffect } from 'react'
import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
} from 'adhan'
import { useAppStore, type CalculationMethodKey } from '../store/useAppStore'

const methodMap: Record<CalculationMethodKey, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
  MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
  Egyptian: () => CalculationMethod.Egyptian(),
  Karachi: () => CalculationMethod.Karachi(),
  UmmAlQura: () => CalculationMethod.UmmAlQura(),
  Dubai: () => CalculationMethod.Dubai(),
  MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
  NorthAmerica: () => CalculationMethod.NorthAmerica(),
  Kuwait: () => CalculationMethod.Kuwait(),
  Qatar: () => CalculationMethod.Qatar(),
  Singapore: () => CalculationMethod.Singapore(),
  Tehran: () => CalculationMethod.Tehran(),
  Turkey: () => CalculationMethod.Turkey(),
  Other: () => CalculationMethod.Other(),
}

export function usePrayerTimes() {
  const {
    location,
    calculationMethod,
    asrJuristic,
    setPrayerTimes,
  } = useAppStore()

  useEffect(() => {
    const coords = new Coordinates(location.lat, location.lng)
    const params = methodMap[calculationMethod]()
    params.madhab = asrJuristic === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi
    const date = new Date()
    const times = new PrayerTimes(coords, date, params)

    setPrayerTimes({
      fajr: times.fajr ?? new Date(),
      sunrise: times.sunrise ?? new Date(),
      dhuhr: times.dhuhr ?? new Date(),
      asr: times.asr ?? new Date(),
      maghrib: times.maghrib ?? new Date(),
      isha: times.isha ?? new Date(),
    })
  }, [location.lat, location.lng, calculationMethod, asrJuristic, setPrayerTimes])

  return useAppStore((s) => s.prayerTimes)
}
