import { useState } from 'react'
import { usePrayerTimes } from './hooks/usePrayerTimes'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'

function App() {
  const [view, setView] = useState<'home' | 'settings'>('home')
  usePrayerTimes()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="app-container">
        {view === 'home' && (
          <>
            <Home onOpenSettings={() => setView('settings')} />
          </>
        )}
        {view === 'settings' && (
          <>
            <button
              type="button"
              onClick={() => setView('home')}
              className="fixed top-6 left-6 font-body text-sm text-[var(--text-secondary)]"
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
