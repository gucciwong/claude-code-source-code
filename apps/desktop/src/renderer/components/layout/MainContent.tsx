import { useNavigationStore } from '../../store/navigationStore'
import { Dashboard } from '../../screens/Dashboard'
import { Models } from '../../screens/Models'
import { Chat } from '../../screens/Chat'
import { Training } from '../../screens/Training'
import { Federation } from '../../screens/Federation'
import { Settings } from '../../screens/Settings'
import { Knowledge } from '../../screens/Knowledge'
import { Enterprise } from '../../screens/Enterprise'
import { DecisionGraph } from '../../screens/DecisionGraph'
import { Orchestration } from '../../screens/Orchestration'

const screens = {
  dashboard: Dashboard,
  models: Models,
  chat: Chat,
  training: Training,
  federation: Federation,
  knowledge: Knowledge,
  enterprise: Enterprise,
  decisiongraph: DecisionGraph,
  orchestration: Orchestration,
  settings: Settings,
}

export function MainContent() {
  const active = useNavigationStore(s => s.active)
  const Screen = screens[active]
  return (
    <main className="flex-1 bg-bg-base overflow-auto">
      <Screen />
    </main>
  )
}
