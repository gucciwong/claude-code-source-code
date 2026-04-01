import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar will go here */}
        <main className="flex-1 bg-bg-base">
          <p className="p-6 text-text-primary">Sovereign Coder</p>
        </main>
      </div>
      {/* StatusBar will go here */}
    </AppShell>
  )
}
