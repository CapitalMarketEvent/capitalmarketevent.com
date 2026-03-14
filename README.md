# 🎩 Capital Market Event

> Celebrating Wall Street's silliest tradition - when the market hits milestones, we wear ridiculous hats.

![Website](https://img.shields.io/website?url=capitalmarketevent.com)
![GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-green)
![Status](https://img.shields.io/badge/Status-Active-blue)

## The Tradition

On the floor of the NYSE, when major market indexes hit round number milestones, traders celebrate by wearing the most absurd hats they can find. It's a tradition that dates back decades - a moment of pure joy in a world of numbers.

**Capital Market Event** keeps this tradition alive with silly finance hats and merch for every milestone.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HOSTING                              │
│                  GitHub Pages (FREE)                         │
│              github.com/sb4ssman/capitalmarketevent.com     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      YOUR COMPUTER                           │
│                                                              │
│   ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│   │ Ollama      │  │ ComfyUI      │  │ Design Agent    │  │
│   │ (LLM)       │  │ (Images)     │  │ (Python)        │  │
│   └─────────────┘  └──────────────┘  └─────────────────┘  │
│          │                │                   │             │
│          └────────────────┼───────────────────┘             │
│                           ▼                                 │
│              ┌─────────────────────────┐                    │
│              │  GitHub Auto-Deploy     │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ZAZZLE STORE                              │
│            zazzle.com/store/capital_market_event            │
│              (Products, Fulfillment, Payments)               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Domain Setup (Porkbun → GitHub Pages)

**Option A: Simple Redirect**
```
Porkbun Dashboard → URL Forwarding
Forward: capitalmarketevent.com → https://www.zazzle.com/store/capital_market_event
```

**Option B: Full Website (Recommended)**
```
1. Porkbun DNS Settings:
   - A Record @ → 185.199.108.153
   - A Record @ → 185.199.109.153
   - A Record @ → 185.199.110.153
   - A Record @ → 185.199.111.153
   - CNAME www → sb4ssman.github.io

2. GitHub Repo Settings:
   - Settings → Pages → Custom domain: capitalmarketevent.com
   - Enforce HTTPS ✓
```

### 2. Enable GitHub Pages

1. Go to: https://github.com/sb4ssman/capitalmarketevent.com/settings/pages
2. Under "Build and deployment":
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
3. Add custom domain: `capitalmarketevent.com`
4. Wait ~5 minutes for deployment

### 3. Local AI Setup (Optional - for automation)

```bash
# Install Ollama (for text generation)
# Download from: https://ollama.ai

# Pull a model
ollama pull llama3.2

# Install Python dependencies
cd automation
pip install -r requirements.txt

# Or use the setup script
setup_local.bat
```

## 🤖 AI Automation

### Design Agent

The `design_agent.py` script generates creative hat design concepts using AI:

```bash
# Generate one design
python automation/design_agent.py --generate

# Run weekly scheduler
python automation/design_agent.py --run-scheduler
```

### Setting Up Scheduled Runs (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Weekly (Monday 9 AM)
4. Action: Start a program
5. Program: `python`
6. Arguments: `path\to\automation\design_agent.py --generate`

### With ComfyUI (Advanced)

For image generation, install ComfyUI:
- Download from: https://github.com/comfyanonymous/ComfyUI
- Use FLUX.1 or Stable Diffusion models
- The design agent can trigger workflows via API

## 📁 Project Structure

```
capitalmarketevent.com/
├── index.html              # Main website
├── assets/
│   ├── styles.css         # Styling
│   └── main.js            # Frontend JS
├── automation/
│   ├── design_agent.py    # AI design generator
│   ├── requirements.txt   # Python dependencies
│   └── setup_local.bat    # Windows setup script
├── _config.yml           # GitHub Pages config
├── PLAN.md                # Full technical plan
└── README.md              # This file
```

## 💰 Costs

| Item | Cost |
|------|------|
| Domain (Porkbun) | ~$10/year |
| GitHub Pages | FREE |
| Ollama | FREE |
| ComfyUI | FREE |
| Zazzle | FREE |
| **Total** | **~$10/year** |

## 🔧 Development

```bash
# Clone the repo
git clone https://github.com/sb4ssman/capitalmarketevent.com.git
cd capitalmarketevent.com

# Make changes
# Edit index.html, assets/styles.css, etc.

# Commit and push
git add .
git commit -m "Your changes"
git push

# GitHub Pages will auto-deploy in ~5 minutes
```

## 📋 To-Do

- [x] Research domain/DNS setup
- [x] Build website
- [x] Set up automation framework
- [ ] Apply for Zazzle API access
- [ ] Configure automated product creation
- [ ] Set up ComfyUI for image generation

## 📞 Links

- **Website**: https://capitalmarketevent.com
- **Zazzle Store**: https://www.zazzle.com/store/capital_market_event
- **GitHub Repo**: https://github.com/sb4ssman/capitalmarketevent.com
- **Porkbun**: https://porkbun.com

---

*Not affiliated with the NYSE or any financial institution. We're just fans who like silly hats. 💼➡️🎩*
