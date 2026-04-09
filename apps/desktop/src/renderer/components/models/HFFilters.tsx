/**
 * HuggingFace-style filter panel — Tasks / Libraries / Languages / Licenses / Other
 * Mirrors the filter panel at huggingface.co/models.
 */
import { useState, useMemo } from 'react'
import {
  // General UI
  ChevronDown, ChevronUp, X, Search, SlidersHorizontal, Globe, Landmark,
  // Task — Multimodal
  AudioLines, Image, Film, HelpCircle, FileQuestion, Shuffle, Video,
  // Task — Computer Vision
  Layers, Tag, ScanSearch, Scissors, Wand2, Type, Sparkles,
  Target, Eraser, Box, Fingerprint, Crosshair, Repeat,
  // Task — NLP
  Tags, Code2, Table, MessageCircle, Languages, FileText, Binary,
  Pencil, ListOrdered, Zap,
  // Task — Audio
  Mic, Volume2, Music, Music2, Activity,
  // Task — Tabular
  BarChart2, TrendingUp,
  // Misc
  Server, Package, Cpu,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  HFActiveFilters,
  HFTask,
  HFLibrary,
  HFLanguage,
  HFLicense,
  HFOtherTag,
  HFOtherSection,
  HF_TASK_CATEGORIES,
  HF_TASKS,
  HF_LIBRARIES,
  HF_LANGUAGES,
  HF_LICENSES,
  HF_OTHER_TAGS,
} from './HFFilterData'

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, LucideIcon> = {
  // Multimodal
  'audio-text-to-text':          AudioLines,
  'image-text-to-text':          Image,
  'image-text-to-image':         Sparkles,
  'image-text-to-video':         Film,
  'visual-question-answering':   HelpCircle,
  'document-question-answering': FileQuestion,
  'video-text-to-text':          Video,
  'visual-document-retrieval':   ScanSearch,
  'any-to-any':                  Shuffle,
  // Computer Vision
  'depth-estimation':               Layers,
  'image-classification':           Tag,
  'object-detection':               Target,
  'image-segmentation':             Scissors,
  'text-to-image':                  Wand2,
  'image-to-text':                  Type,
  'image-to-image':                 Image,
  'image-to-video':                 Video,
  'unconditional-image-generation': Sparkles,
  'video-classification':           Film,
  'text-to-video':                  Film,
  'zero-shot-image-classification': Zap,
  'mask-generation':                Eraser,
  'zero-shot-object-detection':     ScanSearch,
  'text-to-3d':                     Box,
  'image-to-3d':                    Box,
  'image-feature-extraction':       Fingerprint,
  'keypoint-detection':             Crosshair,
  'video-to-video':                 Repeat,
  // NLP
  'text-classification':    Tags,
  'token-classification':   Code2,
  'table-question-answering':Table,
  'question-answering':     MessageCircle,
  'zero-shot-classification':Zap,
  'translation':            Languages,
  'summarization':          FileText,
  'feature-extraction':     Binary,
  'text-generation':        Pencil,
  'fill-mask':              FileText,
  'sentence-similarity':    ListOrdered,
  'text-ranking':           ListOrdered,
  // Audio
  'text-to-speech':               Mic,
  'text-to-audio':                Volume2,
  'automatic-speech-recognition': AudioLines,
  'audio-to-audio':               Music,
  'audio-classification':         Music2,
  'voice-activity-detection':     Activity,
  // Tabular
  'tabular-classification': BarChart2,
  'tabular-regression':     TrendingUp,
  'time-series-forecasting':BarChart2,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Multimodal':                    'text-violet-400',
  'Computer Vision':               'text-blue-400',
  'Natural Language Processing':   'text-emerald-400',
  'Audio':                         'text-amber-400',
  'Tabular':                       'text-teal-400',
}

const CATEGORY_BG: Record<string, string> = {
  'Multimodal':                    'bg-violet-500/10 border-violet-500/20',
  'Computer Vision':               'bg-blue-500/10 border-blue-500/20',
  'Natural Language Processing':   'bg-emerald-500/10 border-emerald-500/20',
  'Audio':                         'bg-amber-500/10 border-amber-500/20',
  'Tabular':                       'bg-teal-500/10 border-teal-500/20',
}

const CATEGORY_ACTIVE_BG: Record<string, string> = {
  'Multimodal':                    'bg-violet-500/30 border-violet-400/50',
  'Computer Vision':               'bg-blue-500/30 border-blue-400/50',
  'Natural Language Processing':   'bg-emerald-500/30 border-emerald-400/50',
  'Audio':                         'bg-amber-500/30 border-amber-400/50',
  'Tabular':                       'bg-teal-500/30 border-teal-400/50',
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type FilterTab = 'tasks' | 'libraries' | 'languages' | 'licenses' | 'other'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'tasks',     label: 'Tasks' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'languages', label: 'Languages' },
  { id: 'licenses',  label: 'Licenses' },
  { id: 'other',     label: 'Other' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface HFFiltersProps {
  filters: HFActiveFilters
  onChange: (filters: HFActiveFilters) => void
}

// ─── Active filter badge (shown when collapsed) ────────────────────────────────

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-accent-500/20 text-accent-300 border border-accent-500/30 rounded-full px-2.5 py-0.5 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-accent-400 hover:text-accent-200 transition-colors cursor-pointer"
        aria-label={`Remove filter: ${label}`}
      >
        <X size={10} />
      </button>
    </span>
  )
}

// ─── Task chip ────────────────────────────────────────────────────────────────

function TaskChip({
  task,
  active,
  onClick,
}: {
  task: HFTask
  active: boolean
  onClick: () => void
}) {
  const Icon = TASK_ICONS[task.id] ?? FileText
  const colorClass = CATEGORY_COLORS[task.category] ?? 'text-text-secondary'
  const bgClass = active
    ? CATEGORY_ACTIVE_BG[task.category] ?? 'bg-accent-500/30 border-accent-400/50'
    : CATEGORY_BG[task.category] ?? 'bg-bg-surface-3 border-border-default'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium',
        'transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        bgClass,
        colorClass,
      ].join(' ')}
    >
      <Icon size={13} aria-hidden="true" />
      {task.label}
    </button>
  )
}

// ─── Plain text chip (libraries, licenses, other) ────────────────────────────

function TextChip({
  id,
  label,
  active,
  onClick,
  icon: Icon,
  iconClass,
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
  icon?: LucideIcon
  iconClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium',
        'transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        active
          ? 'bg-accent-500/20 border-accent-500/40 text-accent-300'
          : 'bg-bg-surface-3 border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover',
      ].join(' ')}
    >
      {Icon && <Icon size={12} className={iconClass} aria-hidden="true" />}
      {label}
    </button>
  )
}

// ─── Tab search input ─────────────────────────────────────────────────────────

function TabSearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative mb-3">
      <Search
        size={13}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-surface-1 border border-border-default rounded-md pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-500"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HFFilters({ filters, onChange }: HFFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('tasks')
  const [tabSearch, setTabSearch] = useState('')

  const activeCount = Object.values(filters).filter(Boolean).length

  function toggle(key: keyof HFActiveFilters, value: string) {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value })
  }

  function clearAll() {
    onChange({})
  }

  // Reset tab search when switching tabs
  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab)
    setTabSearch('')
  }

  // ── Filtered items for current tab ──────────────────────────────────────

  const search = tabSearch.toLowerCase()

  const filteredTasks = useMemo(
    () => HF_TASKS.filter(t => !search || t.label.toLowerCase().includes(search)),
    [search]
  )

  const filteredLibraries = useMemo(
    () => HF_LIBRARIES.filter(l => !search || l.label.toLowerCase().includes(search)),
    [search]
  )

  const filteredLanguages = useMemo(
    () => HF_LANGUAGES.filter(l => !search || l.label.toLowerCase().includes(search)),
    [search]
  )

  const filteredLicenses = useMemo(
    () => HF_LICENSES.filter(l => !search || l.label.toLowerCase().includes(search)),
    [search]
  )

  const filteredOther = useMemo(
    () => HF_OTHER_TAGS.filter(t => !search || t.label.toLowerCase().includes(search)),
    [search]
  )

  // ── Active filter labels for collapsed summary ───────────────────────────

  const activeLabels: { key: keyof HFActiveFilters; label: string }[] = []
  if (filters.task) {
    const t = HF_TASKS.find(x => x.id === filters.task)
    if (t) activeLabels.push({ key: 'task', label: t.label })
  }
  if (filters.library) {
    const l = HF_LIBRARIES.find(x => x.id === filters.library)
    if (l) activeLabels.push({ key: 'library', label: l.label })
  }
  if (filters.language) {
    const l = HF_LANGUAGES.find(x => x.id === filters.language)
    if (l) activeLabels.push({ key: 'language', label: l.label })
  }
  if (filters.license) {
    const l = HF_LICENSES.find(x => x.id === filters.license)
    if (l) activeLabels.push({ key: 'license', label: l.label })
  }
  if (filters.other) {
    const o = HF_OTHER_TAGS.find(x => x.id === filters.other)
    if (o) activeLabels.push({ key: 'other', label: o.label })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Header row: toggle button + active badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(v => !v)}
          aria-expanded={isExpanded}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            isExpanded
              ? 'bg-accent-500/15 border-accent-500/40 text-accent-300'
              : 'bg-bg-surface-2 border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover',
          ].join(' ')}
        >
          <SlidersHorizontal size={12} aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="bg-accent-500 text-white rounded-full px-1.5 py-0 text-[10px] leading-4 font-bold">
              {activeCount}
            </span>
          )}
          {isExpanded ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
        </button>

        {/* Active filter badges */}
        {activeLabels.map(({ key, label }) => (
          <ActiveFilterBadge
            key={key}
            label={label}
            onRemove={() => onChange({ ...filters, [key]: undefined })}
          />
        ))}

        {activeCount > 1 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-text-secondary underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div
          className="bg-bg-surface-1 border border-border-default rounded-lg overflow-hidden"
          role="region"
          aria-label="Model filters"
        >
          {/* Tab bar */}
          <div className="flex border-b border-border-default">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={[
                  'px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500',
                  activeTab === tab.id
                    ? 'border-b-2 border-accent-500 text-accent-400 -mb-px'
                    : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 max-h-72 overflow-y-auto">

            {/* ── Tasks ── */}
            {activeTab === 'tasks' && (
              <div>
                <TabSearchInput
                  placeholder="Filter Tasks by name"
                  value={tabSearch}
                  onChange={setTabSearch}
                />
                {HF_TASK_CATEGORIES.map(category => {
                  const tasks = filteredTasks.filter(t => t.category === category)
                  if (tasks.length === 0) return null
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${CATEGORY_COLORS[category] ?? 'text-text-muted'}`}>
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tasks.map(task => (
                          <TaskChip
                            key={task.id}
                            task={task}
                            active={filters.task === task.id}
                            onClick={() => toggle('task', task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Libraries ── */}
            {activeTab === 'libraries' && (
              <div>
                <TabSearchInput
                  placeholder="Filter Libraries by name"
                  value={tabSearch}
                  onChange={setTabSearch}
                />
                <div className="flex flex-wrap gap-1.5">
                  {filteredLibraries.map(lib => (
                    <TextChip
                      key={lib.id}
                      id={lib.id}
                      label={lib.label}
                      active={filters.library === lib.id}
                      onClick={() => toggle('library', lib.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Languages ── */}
            {activeTab === 'languages' && (
              <div>
                <TabSearchInput
                  placeholder="Filter Languages by name"
                  value={tabSearch}
                  onChange={setTabSearch}
                />
                <div className="flex flex-wrap gap-1.5">
                  {filteredLanguages.map(lang => (
                    <TextChip
                      key={lang.id}
                      id={lang.id}
                      label={lang.label}
                      active={filters.language === lang.id}
                      onClick={() => toggle('language', lang.id)}
                      icon={Globe}
                      iconClass="text-emerald-400"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Licenses ── */}
            {activeTab === 'licenses' && (
              <div>
                <TabSearchInput
                  placeholder="Filter Licenses by name"
                  value={tabSearch}
                  onChange={setTabSearch}
                />
                <div className="flex flex-wrap gap-1.5">
                  {filteredLicenses.map(lic => (
                    <TextChip
                      key={lic.id}
                      id={lic.id}
                      label={lic.label}
                      active={filters.license === lic.id}
                      onClick={() => toggle('license', lic.id)}
                      icon={Landmark}
                      iconClass="text-text-muted"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Other ── */}
            {activeTab === 'other' && (
              <div>
                <TabSearchInput
                  placeholder="Filter by name"
                  value={tabSearch}
                  onChange={setTabSearch}
                />
                {(['Apps', 'Inference Providers', 'Misc'] as HFOtherSection[]).map(section => {
                  const items = filteredOther.filter(t => t.section === section)
                  if (items.length === 0) return null
                  const SectionIcon = section === 'Apps' ? Package
                    : section === 'Inference Providers' ? Server
                    : Cpu
                  return (
                    <div key={section} className="mb-4 last:mb-0">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                        <SectionIcon size={11} aria-hidden="true" />
                        {section}
                        {section === 'Inference Providers' && (
                          <button
                            type="button"
                            className="ml-auto normal-case text-[10px] text-accent-400 border border-accent-500/30 rounded px-1.5 py-0.5 cursor-pointer hover:bg-accent-500/10"
                          >
                            Select all
                          </button>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(tag => (
                          <TextChip
                            key={tag.id}
                            id={tag.id}
                            label={tag.label}
                            active={filters.other === tag.id}
                            onClick={() => toggle('other', tag.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
