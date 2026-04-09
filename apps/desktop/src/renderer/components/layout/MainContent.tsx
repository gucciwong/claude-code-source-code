import { useNavigationStore } from '../../store/navigationStore'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { Dashboard } from '../../screens/Dashboard'
import { Models } from '../../screens/Models'
import { Chat } from '../../screens/Chat'
import { Coding } from '../../screens/Coding'
import { Training } from '../../screens/Training'
import { Research } from '../../screens/Research'
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
import { Plugins } from '../../screens/Plugins'
import { PRReview } from '../../screens/PRReview'
import { Finetune } from '../../screens/Finetune'
import { CodeCompletion } from '../../screens/CodeCompletion'
import { ConversationMemory } from '../../screens/ConversationMemory'
import { Developer } from '../../screens/Developer'
import { DataHub } from '../../screens/DataHub'
import HealthDashboard from '../../screens/HealthDashboard'
import { Awards } from '../../screens/Awards'

const screens = {
  dashboard: Dashboard,
  models: Models,
  chat: Chat,
  coding: Coding,
  training: Training,
  research: Research,
  federation: Federation,
  knowledge: Knowledge,
  enterprise: Enterprise,
  datahub: DataHub,
  decisiongraph: DecisionGraph,
  orchestration: Orchestration,
  orgintelligence: OrgIntelligence,
  personacouncil: PersonaCouncil,
  analytics: Analytics,
  messaging: Messaging,
  semanticsearch: SemanticSearch,
  plugins: Plugins,
  prreview: PRReview,
  finetune: Finetune,
  codecompletion: CodeCompletion,
  developer: Developer,
  memory: ConversationMemory,
  awards: Awards,
  health: HealthDashboard,
  settings: Settings,
}

export function MainContent() {
  const active = useNavigationStore(s => s.active)
  const Screen = screens[active]
  return (
    <main className="flex-1 min-w-0 bg-bg-base overflow-auto">
      <ErrorBoundary label={active}>
        <Screen />
      </ErrorBoundary>
    </main>
  )
}
