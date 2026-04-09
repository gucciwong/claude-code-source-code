import * as vscode from 'vscode'
import { streamChatResponse } from './ollamaClient'

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sovereign-code.chatView'
  private _view?: vscode.WebviewView
  private _messages: { role: string; content: string }[] = []
  private _abortController?: AbortController

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtml()

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.type === 'send') {
        this._handleSend(data.text).catch((err) => {
          console.error('[sovereign-code] _handleSend error:', err)
        })
      } else if (data.type === 'stop') {
        this._abortController?.abort()
      } else if (data.type === 'clear') {
        this._messages = []
      }
    })
  }

  private async _handleSend(text: string): Promise<void> {
    if (!text.trim() || !this._view) return

    const config = vscode.workspace.getConfiguration('sovereign-code')
    const baseUrl = config.get<string>('ollamaUrl', 'http://localhost:11434')
    const model = config.get<string>('model', 'qwen2.5-coder:7b')

    this._messages.push({ role: 'user', content: text })
    this._view.webview.postMessage({ type: 'userMessage', text })
    this._view.webview.postMessage({ type: 'streamStart' })

    this._abortController = new AbortController()
    let fullResponse = ''

    try {
      for await (const chunk of streamChatResponse(baseUrl, model, this._messages, this._abortController.signal)) {
        fullResponse += chunk
        this._view.webview.postMessage({ type: 'streamChunk', text: chunk })
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        this._view.webview.postMessage({ type: 'error', text: 'Failed to get response' })
      }
    }

    this._messages.push({ role: 'assistant', content: fullResponse })
    this._view.webview.postMessage({ type: 'streamEnd' })
    this._abortController = undefined
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      display: flex; flex-direction: column; height: 100vh;
    }
    #messages {
      flex: 1; overflow-y: auto; padding: 8px;
    }
    .msg { margin-bottom: 8px; padding: 6px 10px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; }
    .msg.user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); margin-left: 20%; }
    .msg.assistant { background: var(--vscode-editor-inactiveSelectionBackground); margin-right: 20%; }
    .msg.error { background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); }
    #input-area { display: flex; gap: 4px; padding: 8px; border-top: 1px solid var(--vscode-panel-border); }
    #input {
      flex: 1; padding: 6px 8px; border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background); color: var(--vscode-input-foreground);
      border-radius: 4px; resize: none; font-family: inherit; font-size: inherit;
    }
    #input:focus { outline: 1px solid var(--vscode-focusBorder); }
    button {
      padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;
      background: var(--vscode-button-background); color: var(--vscode-button-foreground);
      font-size: inherit;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.stop { background: var(--vscode-inputValidation-errorBackground); }
    .streaming-cursor { display: inline-block; width: 6px; height: 14px; background: var(--vscode-foreground); animation: blink 1s step-end infinite; vertical-align: text-bottom; }
    @keyframes blink { 50% { opacity: 0; } }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-area">
    <textarea id="input" rows="2" placeholder="Ask a question..." aria-label="Chat message"></textarea>
    <button id="send-btn" aria-label="Send message">Send</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    let streaming = false;
    let currentAssistantEl = null;

    function addMessage(role, text) {
      const el = document.createElement('div');
      el.className = 'msg ' + role;
      el.textContent = text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    function send() {
      const text = inputEl.value.trim();
      if (!text || streaming) return;
      vscode.postMessage({ type: 'send', text });
      inputEl.value = '';
    }

    sendBtn.addEventListener('click', () => {
      if (streaming) {
        vscode.postMessage({ type: 'stop' });
      } else {
        send();
      }
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'userMessage':
          addMessage('user', msg.text);
          break;
        case 'streamStart':
          streaming = true;
          sendBtn.textContent = 'Stop';
          sendBtn.classList.add('stop');
          sendBtn.setAttribute('aria-label', 'Stop generating');
          currentAssistantEl = addMessage('assistant', '');
          break;
        case 'streamChunk':
          if (currentAssistantEl) currentAssistantEl.textContent += msg.text;
          messagesEl.scrollTop = messagesEl.scrollHeight;
          break;
        case 'streamEnd':
          streaming = false;
          sendBtn.textContent = 'Send';
          sendBtn.classList.remove('stop');
          sendBtn.setAttribute('aria-label', 'Send message');
          currentAssistantEl = null;
          break;
        case 'error':
          addMessage('error', msg.text);
          streaming = false;
          sendBtn.textContent = 'Send';
          sendBtn.classList.remove('stop');
          currentAssistantEl = null;
          break;
      }
    });
  </script>
</body>
</html>`
  }
}
