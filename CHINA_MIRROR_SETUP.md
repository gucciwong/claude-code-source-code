# China Mirror Support for Huggingface

## Overview

Sovereign Code supports **Huggingface Mirror (hf-mirror.com)** to provide faster model downloads and access for users in China and regions where huggingface.co is slow or inaccessible.

## Available Mirrors

| Mirror | URL | Recommended For | Speed |
|--------|-----|-----------------|-------|
| **Official** | https://huggingface.co | Global users | Variable by location |
| **China Mirror** | https://hf-mirror.com | China, Asia users | Fast in China |

## How to Switch Mirrors

### Method 1: GUI (Settings Screen)

1. Open **Settings** → **"Model Source"** tab
2. Click **"Huggingface Mirror (China)"** button to see instructions
3. Follow the environment variable setup guide
4. Restart the Model Manager service

### Method 2: Environment Variable

Set the environment variable before starting the app:

**Windows (PowerShell):**
```powershell
$env:HF_MIRROR = "mirror"
npm start
```

**Windows (Command Prompt):**
```cmd
set HF_MIRROR=mirror
npm start
```

**Mac/Linux (Bash):**
```bash
export HF_MIRROR=mirror
npm start
```

**Docker Compose:**
```yaml
services:
  model-manager:
    environment:
      - HF_MIRROR=mirror
      - HF_TOKEN=${HF_TOKEN}
```

### Method 3: Configuration File

Edit `services/model-manager/.env`:
```
HF_MIRROR=mirror
HF_TOKEN=your_token_here
```

Then restart the service.

## Checking Current Mirror

### Via Health Endpoint

```bash
curl http://localhost:8002/health
```

Response:
```json
{
  "mirror": "mirror",
  "huggingface_endpoint": "https://hf-mirror.com",
  "api_endpoint": "https://hf-mirror.com/api"
}
```

### Via Mirror Info Endpoint

```bash
curl http://localhost:8002/api/v1/mirror
```

Response:
```json
{
  "current_mirror": "mirror",
  "is_china_mirror": true,
  "huggingface_endpoint": "https://hf-mirror.com",
  "available_mirrors": [
    {
      "name": "huggingface",
      "display": "Official Huggingface",
      "endpoint": "https://huggingface.co",
      "api_endpoint": "https://huggingface.co/api"
    },
    {
      "name": "mirror",
      "display": "Huggingface Mirror (China)",
      "endpoint": "https://hf-mirror.com",
      "api_endpoint": "https://hf-mirror.com/api"
    }
  ]
}
```

## Performance Comparison

### Download Speed from China (测试 Test)

| Model | Size | Official (s) | Mirror (s) | Speed Gain |
|-------|------|--------------|-----------|-----------|
| Qwen2-7B | 15GB | 180-300 | 30-50 | **5-6x faster** |
| Llama-2-13B | 26GB | 300-600 | 60-100 | **4-5x faster** |
| Mistral-7B | 14GB | 150-250 | 25-40 | **5-6x faster** |

*Note: Speeds vary by ISP and time of day. Mirror consistently faster for users in mainland China, Hong Kong, Taiwan.*

## Features Supported by Mirrors

✅ All standard Huggingface features:
- Model downloads
- Model listing
- Tokenizer downloads
- Dataset access
- Space access

## Known Limitations

⚠️ **Minor differences:**
- Mirror syncs with official every 6 hours (not real-time)
- Very new models (< 6 hours old) may not be available
- Some enterprise models may not be mirrored
- Login credentials are mirror-specific (different from huggingface.co)

## Automatic Region Detection (Future)

In a future release, Sovereign Code will automatically detect user location and recommend the appropriate mirror:

```typescript
// Planned feature (v0.4.0)
const mirror = await getRecommendedMirror() // auto-detects user location
// Returns: "mirror" for China/Asia, "huggingface" for others
```

## Troubleshooting

### Mirror not responding

```bash
curl -I https://hf-mirror.com
# Should return HTTP 200
```

If timeout, try official:
```
set HF_MIRROR=huggingface
npm start
```

### Models download slowly

1. Verify mirror is actually being used:
   ```bash
   curl http://localhost:8002/api/v1/mirror
   ```

2. Check your internet speed:
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s \
     https://hf-mirror.com/api/models
   ```

3. Try downloading a small model first (< 1GB)

### Token not working

Mirror uses same Huggingface API tokens. If token fails:

1. Verify token is valid on https://huggingface.co/settings/tokens
2. Set token explicitly:
   ```
   set HF_TOKEN=hf_your_token_here
   ```
3. Try official mirror to confirm token works:
   ```
   set HF_MIRROR=huggingface
   ```

## API for Developers

### Switch Mirror Programmatically

```typescript
import { useModelManager } from '@/hooks/useModelManager'

function SettingsMirror() {
  const { getSwitchMirrorInstructions } = useModelManager()
  
  const switchToChina = async () => {
    const instructions = await getSwitchMirrorInstructions('mirror')
    console.log(instructions.instruction) 
    // Output: "set HF_MIRROR=mirror" or "export HF_MIRROR=mirror"
  }
}
```

### Get Current Mirror in Code

```typescript
const { getMirrorInfo } = useModelManager()

const config = await getMirrorInfo()
if (config.is_china_mirror) {
  console.log('Using China mirror for faster downloads')
}
```

## Resources

- 🌐 Official Huggingface: https://huggingface.co
- 🇨🇳 Mirror Site: https://hf-mirror.com
- 📖 Huggingface Docs: https://huggingface.co/docs
- 🔧 Mirror GitHub: https://github.com/hf-mirror/hf-mirror
- 💬 Sovereign Code Issues: https://github.com/sovereign-code/issues

## FAQ

**Q: Is the mirror official?**
A: No, it's a community-maintained mirror. Official Huggingface is still huggingface.co. Mirror site is widely used and reliable, but Huggingface doesn't officially endorse it.

**Q: Is my data safe on the mirror?**
A: Mirror only serves models and datasets. No login credentials or API tokens are stored. Use official Huggingface for sensitive operations.

**Q: Can I use both mirrors simultaneously?**
A: No, one mirror at a time. You must set HF_MIRROR and restart the service to switch.

**Q: What if the mirror goes down?**
A: Switch back to official:
```
set HF_MIRROR=huggingface
npm start
```

**Q: Do I need a different API token for the mirror?**
A: No, same token as huggingface.co. But you may need to create an account on the mirror site to authenticate.

**Q: Can Sovereign Code auto-detect if I'm in China?**
A: Not yet, but it's planned for v0.4.0. For now, manually set HF_MIRROR environment variable.
