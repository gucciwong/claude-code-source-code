import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Copy, Check, Terminal } from 'lucide-react'
import { useSystemStore } from '../store/systemStore'

const OLLAMA_PORT = 11434

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={label}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
        copied
          ? 'border-green-500/50 text-green-400 bg-green-500/10'
          : 'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-surface-3'
      }`}
    >
      {copied ? (
        <>
          <Check size={12} aria-hidden="true" />
          <span>&#10003; Copied</span>
        </>
      ) : (
        <>
          <Copy size={12} aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

function CodeBlock({ code, language, copyLabel }: { code: string; language: string; copyLabel: string }) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-elevated border border-b-0 border-border-default rounded-t-lg">
        <span className="text-xs text-text-muted">{language}</span>
        <CopyButton text={code} label={copyLabel} />
      </div>
      <pre className="bg-bg-surface-3 border border-border-default rounded-b-lg p-4 font-mono text-xs text-text-code overflow-x-auto m-0">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function EndpointRow({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-bg-surface-2 border border-border-default rounded-lg">
      <code className="flex-1 text-xs font-mono text-text-code">{url}</code>
      <CopyButton text={url} label={label} />
    </div>
  )
}

export function Developer() {
  const activeModel = useSystemStore(s => s.activeModel)
  const model = activeModel || 'llama3.1:8b'

  const ollamaCurl = `curl http://localhost:${OLLAMA_PORT}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'`

  const ollamaPython = `import requests

response = requests.post("http://localhost:${OLLAMA_PORT}/api/chat", json={
    "model": "${model}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": False,
})
print(response.json()["message"]["content"])`

  const ollamaNode = `const response = await fetch("http://localhost:${OLLAMA_PORT}/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "${model}",
    messages: [{ role: "user", content: "Hello!" }],
    stream: false,
  }),
});
const data = await response.json();
console.log(data.message.content);`

  const openaiPython = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:${OLLAMA_PORT}/v1",
    api_key="ollama",  # required but unused
)
response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`

  const openaiNode = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:${OLLAMA_PORT}/v1",
  apiKey: "ollama",
});
const response = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={20} className="text-accent-400" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-text-primary">Local API</h1>
          </div>
          <p className="text-sm text-text-secondary">Access your local model via REST</p>
        </div>

        <Tabs.Root defaultValue="ollama">
          <Tabs.List
            className="flex gap-1 mb-6 p-1 bg-bg-surface-2 rounded-lg border border-border-default w-fit"
            aria-label="API documentation tabs"
          >
            <Tabs.Trigger
              value="ollama"
              className="px-4 py-1.5 text-sm rounded-md transition-colors cursor-pointer text-text-secondary hover:text-text-primary data-[state=active]:bg-accent-500 data-[state=active]:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Ollama
            </Tabs.Trigger>
            <Tabs.Trigger
              value="openai"
              className="px-4 py-1.5 text-sm rounded-md transition-colors cursor-pointer text-text-secondary hover:text-text-primary data-[state=active]:bg-accent-500 data-[state=active]:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              OpenAI-compatible
            </Tabs.Trigger>
            <Tabs.Trigger
              value="anthropic"
              className="px-4 py-1.5 text-sm rounded-md transition-colors cursor-pointer text-text-secondary hover:text-text-primary data-[state=active]:bg-accent-500 data-[state=active]:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Anthropic-compatible
            </Tabs.Trigger>
          </Tabs.List>

          {/* Ollama Tab */}
          <Tabs.Content value="ollama" className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Endpoint</p>
              <EndpointRow
                url={`http://localhost:${OLLAMA_PORT}`}
                label="Copy Ollama base URL"
              />
            </div>
            <CodeBlock
              code={ollamaCurl}
              language="bash"
              copyLabel="Copy curl example"
            />
            <CodeBlock
              code={ollamaPython}
              language="python"
              copyLabel="Copy Python example"
            />
            <CodeBlock
              code={ollamaNode}
              language="javascript"
              copyLabel="Copy Node.js example"
            />
          </Tabs.Content>

          {/* OpenAI-compatible Tab */}
          <Tabs.Content value="openai" className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Endpoint</p>
              <EndpointRow
                url={`http://localhost:${OLLAMA_PORT}/v1`}
                label="Copy OpenAI-compatible base URL"
              />
            </div>
            <CodeBlock
              code={openaiPython}
              language="python (openai SDK)"
              copyLabel="Copy Python OpenAI SDK example"
            />
            <CodeBlock
              code={openaiNode}
              language="javascript (openai npm)"
              copyLabel="Copy Node.js OpenAI SDK example"
            />
          </Tabs.Content>

          {/* Anthropic-compatible Tab */}
          <Tabs.Content value="anthropic" className="space-y-5">
            <div className="p-5 bg-bg-surface-2 border border-border-default rounded-lg space-y-2">
              <p className="text-sm font-semibold text-text-primary">Anthropic-compatible endpoint</p>
              <p className="text-sm text-text-secondary">
                Anthropic-compatible endpoint is available via a translation proxy. Configure in Settings → Inference.
              </p>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}
