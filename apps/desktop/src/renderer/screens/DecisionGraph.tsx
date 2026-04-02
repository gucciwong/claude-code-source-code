import { GitBranch } from 'lucide-react'
import { DecisionTimeline } from '../components/graph/DecisionTimeline'
import { GraphSearchBar } from '../components/graph/GraphSearchBar'
import { useDecisionGraphStore } from '../store/decisionGraphStore'

export function DecisionGraph() {
  const { nodes, filteredNodes, setFilteredNodes, searchQuery, setSearchQuery } = useDecisionGraphStore()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredNodes(nodes)
      return
    }
    // Simple client-side filter (real NL query runs in main process)
    const q = query.toLowerCase()
    setFilteredNodes(nodes.filter(n =>
      n.summary.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q)
    ))
  }

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div className="flex items-center gap-3">
        <GitBranch size={20} aria-hidden="true" className="text-accent-400" />
        <h1 className="text-xl font-semibold text-text-primary">Decision Graph</h1>
      </div>
      <GraphSearchBar value={searchQuery} onChange={handleSearch} />
      <DecisionTimeline nodes={filteredNodes} />
    </div>
  )
}
