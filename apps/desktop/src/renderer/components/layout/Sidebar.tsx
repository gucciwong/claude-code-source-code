import { LayoutDashboard, Cpu, MessageSquare, Zap, Network, Settings, Mic, BookOpen, Database, GitBranch, Workflow, Users, Shield, BarChart2, Smartphone, Search, Puzzle, GitPullRequest, FlaskConical, Code, Brain, Terminal } from 'lucide-react'
import { useNavigationStore, NavSection } from '../../store/navigationStore'
import { useVoiceStore } from '../../store/voiceStore'

interface NavItem {
  id: NavSection
  label: string
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'developer', label: 'Developer', icon: Terminal },
  { id: 'training', label: 'Training', icon: Zap },
  { id: 'federation', label: 'Federation', icon: Network },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'enterprise', label: 'Enterprise', icon: Database },
  { id: 'decisiongraph', label: 'Decision Graph', icon: GitBranch },
  { id: 'orchestration', label: 'Orchestration', icon: Workflow },
  { id: 'orgintelligence', label: 'Org Intel', icon: Users },
  { id: 'personacouncil', label: 'Code Council', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'messaging', label: 'IM Bridge', icon: Smartphone },
  { id: 'semanticsearch', label: 'Code Search', icon: Search },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
  { id: 'prreview', label: 'PR Review', icon: GitPullRequest },
  { id: 'finetune', label: 'Fine-tune', icon: FlaskConical },
  { id: 'codecompletion', label: 'Completions', icon: Code },
  { id: 'memory', label: 'Memory', icon: Brain },
]

const bottomItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { active, setActive } = useNavigationStore()
  const { isPanelOpen, setPanelOpen } = useVoiceStore()

  const navButton = (item: NavItem) => {
    const isActive = active === item.id
    return (
      <button
        key={item.id}
        onClick={() => setActive(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={[
          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          isActive
            ? 'bg-accent-500/10 text-accent-400 border-l-2 border-accent-500'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2',
        ].join(' ')}
      >
        <item.icon size={16} aria-hidden={true} />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <aside
      className="w-[220px] flex flex-col bg-bg-surface-1 border-r border-border-subtle flex-shrink-0"
      aria-label="Main navigation"
    >
      {/* Logo area */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <span className="text-text-primary font-semibold text-sm">Sovereign Coder</span>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 py-2" aria-label="Primary navigation">
        {navItems.map(navButton)}
      </nav>

      {/* Bottom items */}
      <div className="py-2 border-t border-border-subtle space-y-2">
        {bottomItems.map(navButton)}
        {/* Voice Toggle Button */}
        <button
          onClick={() => setPanelOpen(!isPanelOpen)}
          aria-label={isPanelOpen ? 'Close voice panel' : 'Open voice panel'}
          className={[
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            isPanelOpen
              ? 'bg-accent-500/10 text-accent-400 border-l-2 border-accent-500'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2',
          ].join(' ')}
        >
          <Mic size={16} aria-hidden={true} />
          <span>Voice</span>
        </button>
      </div>
    </aside>
  )
}
