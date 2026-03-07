import { useState } from 'react'
import { TimeHeader } from '../components/TimeHeader'
import { Timeline } from '../components/Timeline'
import { AddTaskSheet } from '../components/AddTaskSheet'

interface HomeProps {
  onOpenSettings?: () => void
}

export function Home({ onOpenSettings }: HomeProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <TimeHeader onSettingsClick={onOpenSettings} />
      <Timeline />
      <div
        className="fixed left-0 right-0 flex justify-center max-w-[480px] mx-auto px-6"
        style={{ bottom: 'calc(32px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="font-body text-[15px] font-medium bg-[var(--prayer-dot)] text-[var(--bg)] px-8 py-4 rounded-[14px] tracking-[0.04em] shadow-[0_4px_20px_rgba(44,74,62,0.25)]"
        >
          + Добавить задачу
        </button>
      </div>
      <AddTaskSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
