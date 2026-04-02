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
import { OrgIntelligence } from '../../screens/OrgIntelligence'
import { PersonaCouncil } from '../../screens/PersonaCouncil'
import { Analytics } from '../../screens/Analytics'
import { Messaging } from '../../screens/Messaging'
import { SemanticSearch } from '../../screens/SemanticSearch'

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
  orgintelligence: OrgIntelligence,
  personacouncil: PersonaCouncil,
  analytics: Analytics,
  messaging: Messaging,
  semanticsearch: SemanticSearch,
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
