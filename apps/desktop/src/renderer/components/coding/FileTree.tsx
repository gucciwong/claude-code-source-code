import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode2, FileJson, FileText, File } from 'lucide-react'
import { useCodingStore, FileNode, EditorTab } from '../../store/codingStore'

function fileIcon(node: FileNode) {
  if (node.type === 'directory') {
    return node.isExpanded
      ? <FolderOpen size={14} aria-hidden="true" className="text-yellow-400 flex-shrink-0" />
      : <Folder size={14} aria-hidden="true" className="text-yellow-400 flex-shrink-0" />
  }
  const ext = node.name.split('.').pop() ?? ''
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext))
    return <FileCode2 size={14} aria-hidden="true" className="text-blue-400 flex-shrink-0" />
  if (['json'].includes(ext))
    return <FileJson size={14} aria-hidden="true" className="text-yellow-400 flex-shrink-0" />
  if (['md', 'txt'].includes(ext))
    return <FileText size={14} aria-hidden="true" className="text-text-secondary flex-shrink-0" />
  return <File size={14} aria-hidden="true" className="text-text-muted flex-shrink-0" />
}

function detectLanguage(name: string): string {
  const ext = name.split('.').pop() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown', html: 'html', css: 'css', py: 'python',
    sh: 'shell', yaml: 'yaml', yml: 'yaml', toml: 'ini', rs: 'rust',
  }
  return map[ext] ?? 'plaintext'
}

const DEMO_CONTENTS: Record<string, string> = {
  'src/components/App.tsx': `import React from 'react'

export function App() {
  return (
    <div className="app">
      <h1>Hello, Sovereign Coder!</h1>
    </div>
  )
}
`,
  'src/components/Button.tsx': `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={\`btn btn-\${variant}\`}>
      {children}
    </button>
  )
}
`,
  'src/hooks/useApi.ts': `import { useState, useCallback } from 'react'

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.fetch(url)
      setData(await res.json())
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [url])

  return { data, loading, error, fetch }
}
`,
  'src/index.ts': `export { App } from './components/App'
export { Button } from './components/Button'
`,
  'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  'package.json': `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  }
}
`,
  'README.md': `# My Project

A project built with Sovereign Coder.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const { toggleDirectory, openFile, setSelectedFile, selectedFile } = useCodingStore()

  const isSelected = selectedFile === node.path
  const indent = depth * 12

  const handleClick = () => {
    setSelectedFile(node.path)
    if (node.type === 'directory') {
      toggleDirectory(node.id)
    } else {
      const content = DEMO_CONTENTS[node.path] ?? `// ${node.name}\n`
      const tab: EditorTab = {
        id: node.id,
        path: node.path,
        name: node.name,
        language: detectLanguage(node.name),
        content,
        isDirty: false,
      }
      openFile(tab)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={`${node.type === 'directory' ? 'Open directory' : 'Open file'} ${node.name}`}
        aria-expanded={node.type === 'directory' ? node.isExpanded : undefined}
        className={[
          'w-full flex items-center gap-1 py-[3px] pr-2 text-[13px] transition-colors cursor-pointer text-left',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500',
          isSelected
            ? 'bg-accent-500/20 text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-3',
        ].join(' ')}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {node.type === 'directory' ? (
          <span className="flex-shrink-0 text-text-muted">
            {node.isExpanded
              ? <ChevronDown size={12} aria-hidden="true" />
              : <ChevronRight size={12} aria-hidden="true" />}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        {fileIcon(node)}
        <span className="ml-1 truncate">{node.name}</span>
      </button>

      {node.type === 'directory' && node.isExpanded && node.children?.map(child => (
        <FileTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

export function FileTree() {
  const { fileTree, workspaceRoot } = useCodingStore()

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Explorer header */}
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-subtle flex-shrink-0">
        Explorer
      </div>

      {/* Workspace root label */}
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex-shrink-0 flex items-center justify-between">
        <span className="truncate">{workspaceRoot.split('/').pop() ?? workspaceRoot}</span>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {fileTree.map(node => (
          <FileTreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
