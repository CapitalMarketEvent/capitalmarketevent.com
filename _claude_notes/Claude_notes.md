# Capital Market Event - Claude's Working Notes

**Last Updated:** 2026-03-14

---

## Project Overview

**What is this?** An automated merch business celebrating Wall Street's silly hat tradition.

**Stack:**
- Website: GitHub Pages (free)
- Store: Zazzle (print-on-demand)
- AI: Ollama + ComfyUI (local)
- Automation: Python scripts

---

## RUNNING TODO LIST

### HIGH PRIORITY

- [ ] **Enable GitHub Pages** - Go to repo settings, enable Pages from branch "main"
- [ ] **Fix Porkbun DNS** - Point domain to GitHub Pages IPs
- [ ] **Configure Zazzle API** - Sign up, get credentials, set environment variables
- [ ] **Test automation** - Run the agents locally

### MEDIUM PRIORITY

- [ ] **Set up Ollama** - Install and pull models
- [ ] **Set up ComfyUI** - For image generation
- [ ] **Create Zazzle templates** - Design hat templates in Zazzle store

### LOW PRIORITY

- [ ] **Add more products** - Expand the product catalog
- [ ] **Social media integration** - Auto-post to Twitter/X

---

## Current Status

### ✅ Completed
- Website built (`index.html`)
- Automation scripts created
- Zazzle API integration
- Security audit (no secrets in code)
- README and PLAN docs

### ⏳ In Progress
- Domain pointing to GitHub Pages
- GitHub Pages enabling

### ❌ Blocked
- Need Zazzle API credentials
- Need local AI setup

---

## Environment Variables Needed

```bash
# Zazzle (required for product creation)
export ZAZZLE_MEMBER_ID='your_18_digit_id'
export ZAZZLE_ASSOCIATE_ID='your_associate_id'
export ZAZZLE_TEMPLATE_ID='your_hat_template_id'

# Local AI (optional - falls back to random generation)
export OLLAMA_HOST='http://localhost:11434'
export COMFYUI_HOST='http://localhost:8188'
```

---

## Quick Commands

```bash
# Generate a design concept
python automation/design_agent.py --generate

# Run full pipeline
python automation/auto_merch_agent.py --run-full

# Run scheduler
python automation/auto_merch_agent.py --schedule
```

---

## Files

- `index.html` - Main website
- `assets/styles.css` - Dark finance theme
- `assets/main.js` - Product gallery
- `automation/auto_merch_agent.py` - Full pipeline
- `automation/zazzle_api.py` - Zazzle integration
- `PLAN.md` - Technical plan
- `README.md` - Setup guide
