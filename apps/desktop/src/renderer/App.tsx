import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { CommandPalette } from './components/CommandPalette'

export default function App() {
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-bg-base overflow-auto">
          <p className="p-6 text-text-primary">Sovereign Coder — Main Content</p>
        </main>
      </div>
      {/* StatusBar placeholder */}
      <div className="h-[28px] bg-bg-surface-1 border-t border-border-subtle" />
      <CommandPalette />
    </AppShell>
  )
}
