# Getting Started with Sovereign Code v0.2.0

Welcome to **Sovereign Code**! This guide will have you up and running in **5 minutes**.

## ⚡ 5-Minute Quick Start

### Step 1: Prerequisites *(1 min)*

Verify you have:
```bash
node --version              # Should be >= 18.x
python --version            # Should be >= 3.10.x
ollama --version            # Should show a version
git --version               # Should show a version
```

**Don't have them?**
- Node: https://nodejs.org (LTS recommended)
- Python: https://www.python.org
- Ollama: https://ollama.ai
- Git: https://git-scm.com

### Step 2: Clone & Install *(2 min)*

```bash
# Clone this repository
git clone https://github.com/YOUR_ORG/sovereign-coder.git
cd sovereign-coder

# Go to desktop app directory
cd apps/desktop

# Install dependencies
npm install              # Wait ~60-90 seconds for npm install
```

### Step 3: Download a Model *(1 min)*

In a new terminal:
```bash
ollama pull mistral      # Downloads ~4GB Mistral model
# Or: ollama pull llama2  # Downloads ~5GB Llama2 model
```

### Step 4: Start the Desktop App *(1 min)*

```bash
# In apps/desktop directory
npm run dev              # Waits 5-10 seconds, then opens desktop app
```

**That's it!** The app should open automatically. 🎉

---

## 🎮 Using the App

### First Launch

1. **Wait for UI to load** (5-10 seconds) — you'll see a dark interface
2. **Dashboard tab** appears by default — shows system health
3. **Models panel** shows available models from Ollama

### Sending Your First Message

1. Click **Chat** tab (left sidebar)
2. Type: `"Hi! What's the capital of France?"`
3. Press Enter
4. Wait 5-10 seconds for response
5. Response appears word-by-word as it's generated

### Trying Other Features

- **Models**: View installed models, select active model
- **Training**: See collected training data (optional)
- **Voice**: Record messages or hear text-to-speech (optional)
- **Settings**: Configure system preferences

---

## 📦 What You Got

| Component | What it does | Required? |
|-----------|-------------|-----------|
| **Desktop App** | Electron UI for chat & control | ✅ Yes |
| **Ollama** | Runs local AI models | ✅ Yes |
| **Training Service** | Logs chat completions | ⏳ Optional |
| **Voice Service** | Speech-to-text & audio | ⏳ Optional |

---

## 🔧 Customization

### Change the AI Model

1. Go to **Models** tab
2. Click any model name to switch
3. Model starts loading (watch status bar)
4. Once loaded, chat will use that model

### Change the Active Screen

Click sidebar items:
- 📊 **Dashboard** — System overview
- 💬 **Chat** — Talk to AI
- 🤖 **Models** — Select & manage models
- 📈 **Training** — View collected data (if service running)
- 🎤 **Voice** — Mic & speaker (if service running)
- ⚙️ **Settings** — Preferences

### Adjust System Settings

Go to **Settings** tab to configure:
- Theme (dark mode is default)
- Key bindings
- Service URLs (if running on non-default ports)
- Analytics preferences

---

## 🐛 Troubleshooting

### "App opens but is blank"

**Solution:**
1. Check browser console: Press `F12`
2. Look for error messages (red text)
3. If you see "Failed to fetch", services aren't running
4. Restart with services running (see below)

### "Chat doesn't respond"

**Check Ollama:**
```bash
curl http://localhost:11434/api/tags
# Should show a list of models
```

**If empty:** Download a model
```bash
ollama pull mistral
```

**If error:** Restart Ollama
```bash
# Stop current: Ctrl+C in Ollama terminal
ollama serve              # Restart it
```

### "Port already in use" error

Another app is using the port. Options:

**Option A:** Find & stop the conflicting app
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Stop-Process -Name python -Force    # If it's Python
```

**Option B:** Use a different port
```bash
npm run dev -- --port 5174          # Uses port 5174 instead
```

### "npm install fails"

**Try:**
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

**Or use a different package manager:**
```bash
# Using pnpm (faster)
pnpm install

# Using yarn
yarn install
```

---

## 📚 Full Documentation

For detailed setup and advanced configuration:

| Guide | What's inside |
|-------|---------------|
| [SETUP_GUIDE.md](../SETUP_GUIDE.md) | Detailed installation, all OS, troubleshooting |
| [LIVE_INTEGRATION_TESTING_GUIDE.md](../LIVE_INTEGRATION_TESTING_GUIDE.md) | E2E testing with services |
| [RELEASE_NOTES_v1.0.0.md](../RELEASE_NOTES_v1.0.0.md) | Features, architecture, roadmap |
| [CLAUDE.md](../CLAUDE.md) | Project guidelines, design system |

---

## ⏱️ Timing Guide

Typical startup times:

| Step | Time |
|------|------|
| `npm install` | 60-90 sec (first time only) |
| `npm run dev` | 5-10 sec |
| **App opens** | Auto, ready to chat |
| **First model load** | 10-30 sec (depends on GPU) |
| **First response** | 5-15 sec (depends on model size) |

---

## 🎯 Next Steps

### For Users:
1. ✅ Try chatting with different models
2. ✅ Explore Settings tab
3. ✅ Check out System Health dashboard
4. ✅ Read [SETUP_GUIDE.md](../SETUP_GUIDE.md) for advanced config

### For Developers:
1. ✅ Run tests: `npm test` (314 tests)
2. ✅ Review code: `apps/desktop/src/renderer/components/`
3. ✅ Read [CLAUDE.md](../CLAUDE.md) for architecture
4. ✅ See [docs/plans/](../docs/plans/) for implementation details

### For Deployment:
1. ✅ Follow [SETUP_GUIDE.md](../SETUP_GUIDE.md) for production setup
2. ✅ Use [LIVE_INTEGRATION_TESTING_GUIDE.md](../LIVE_INTEGRATION_TESTING_GUIDE.md) for E2E testing
3. ✅ Create packages: `npm run dist:win`, `npm run dist:mac`, etc.
4. ✅ See [RELEASE_NOTES_v1.0.0.md](../RELEASE_NOTES_v1.0.0.md) for distribution

---

## 💡 Pro Tips

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `Ctrl+K` | Open command palette |
| `Ctrl+C` (terminal) | Stop dev server |
| `F12` | Open browser dev tools |
| `Ctrl+Shift+I` | Toggle dev tools |

### Performance Tips

**Make responses faster:**
- Use smaller models: `ollama pull neural-chat` (faster than mistral)
- Get better GPU: Discrete GPU >> Integrated GPU >> CPU
- Add more RAM: 16GB >> 8GB

**Debug response issues:**
- Open browser console (F12 → Console tab)
- Look for red error messages
- Timestamp appears before each message

### Monitoring System Health

**Status bar shows:**
```
[Lock] Running Locally | Model: mistral | GPU: 18.2/24 GB | 88°C | 45 tok/s
```

- 🔒 Lock icon = Local-only (no cloud)
- 💾 VRAM = How much GPU memory in use
- 🌡️ Temperature = GPU heat
- ⚡ tok/s = Response speed

---

## ❓ FAQ

**Q: Is my data private?**
A: 100% — everything stays local on your machine. No cloud transmission.

**Q: What models can I use?**
A: Any model from ollama.ai — Llama2, Mistral, Neural-Chat, and 50+ others.

**Q: Can I train custom models?**
A: Not in v1.0.0, but the infrastructure is ready. Coming in v1.1.

**Q: How much disk space do I need?**
A: Min 10GB, but models are 4-7GB each. 20GB+ recommended.

**Q: Can I use my NVIDIA/AMD GPU?**
A: Yes for NVIDIA (full CUDA support). AMD/Apple Silicon uses CPU fallback.

**Q: What's the training service?**
A: Logs your chat completions so you can create custom datasets (optional).

**Q: Can I turn off voice features?**
A: Yes — they're optional. App works fine without the voice service.

---

## 🆘 Need Help?

1. **Check the docs**: Start with [SETUP_GUIDE.md](../SETUP_GUIDE.md)
2. **Try troubleshooting**: See section above
3. **Check F12 console**: Look for JavaScript errors
4. **Check service logs**: Run services with `--log-level debug`

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-02  
**Status**: Production Ready ✅

Happy coding! 🚀

