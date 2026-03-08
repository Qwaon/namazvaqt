import { useEffect, useState } from 'react'
import { usePrayerTimes } from './hooks/usePrayerTimes'
import { useNotifications } from './hooks/useNotifications'
import { useAppStore } from './store/useAppStore'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'

function App() {
  const [view, setView] = useState<'home' | 'settings'>('home')
  const theme = useAppStore((s) => s.theme)
  const checkAndResetCompletedPrayers = useAppStore((s) => s.checkAndResetCompletedPrayers)

  usePrayerTimes()
  useNotifications()

  useEffect(() => {
    checkAndResetCompletedPrayers()
  }, [checkAndResetCompletedPrayers])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="app-container">
        {view === 'home' && (
          <Home onOpenSettings={() => setView('settings')} />
        )}
        {view === 'settings' && (
          <>
            <button
              type="button"
              onClick={() => setView('home')}
              className="fixed top-6 left-6 font-body text-sm text-[var(--text-secondary)] z-10"
            >
              ← Назад
            </button>
            <Settings />
          </>
        )}
      </div>
    </div>
  )
}

export default App
