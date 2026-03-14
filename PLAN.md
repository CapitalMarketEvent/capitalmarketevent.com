# Capital Market Event - Technical Master Plan

## Executive Summary

This document outlines the technical architecture for building an automated merch empire around the "silly NYSE trader hat" tradition. The goal is a fully automated system where AI agents handle design creation, product listings, and marketing - all hosted for FREE on GitHub Pages.

---

## Phase 1: Domain & Hosting Setup

### 1.1 Fix Porkbun Domain Redirects

**Current Problem:** Domain redirects from Porkbun to Zazzle aren't working.

**Root Cause:** URL forwarding conflicts with existing DNS records.

**Solution Options:**

#### Option A: Direct Redirect (Recommended for Simple Setup)
Keep using Porkbun's URL forwarding, but fix the configuration:

1. Log into Porkbun → Domain Management
2. Click "Details" next to capitalmarketevent.com
3. Click the edit icon next to "URL Forwarding"
4. Set up forwarding:
   - **Hostname:** (leave blank for root domain)
   - **Forward Traffic To:** `https://www.zazzle.com/store/capital_market_event`
   - **Redirect Type:** 301 (Permanent) or 302 (Temporary) - use 302 for testing
   - **Wildcard Forwarding:** Checked (forwards all subdomains too)
5. Delete any existing DNS records that might conflict (A records, CNAME)
6. Wait 10-15 minutes for propagation

#### Option B: GitHub Pages + Zazzle Links (RECOMMENDED)
This gives you a real website and better control:

1. **Set up GitHub Pages:**
   - Go to your repo: https://github.com/sb4ssman/capitalmarketevent.com
   - Settings → Pages
   - Under "Build and deployment": Select "Deploy from a branch"
   - Branch: "main" (or "gh-pages"), folder: "/ (root)"
   - Custom domain: `capitalmarketevent.com`

2. **Configure Porkbun DNS:**
   - Delete existing A records
   - Create A records pointing to GitHub Pages IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Create AAAA records (optional, for IPv6):
     ```
     2606:50c0:8000::153
     2606:50c0:8001::153
     2606:50c0:8002::153
     2606:50c0:8003::153
     ```
   - Create CNAME for www:
     - Name: `www`
     - Value: `sb4ssman.github.io`

3. **Enforce HTTPS:** Check "Enforce HTTPS" in GitHub Pages settings (takes up to 24 hours)

**Why Option B is better:**
- You get a real website (not just a redirect)
- Full control over branding
- Can embed Zazzle product galleries
- Professional appearance
- Free hosting forever

---

## Phase 2: Zazzle API Integration

### What Zazzle's API Can Do:

1. **Product Creation:** Programmatically create products from images/designs
2. **Deep Linking:** Generate direct links to products with your commission
3. **Storefront Integration:** Display your Zazzle store on external sites
4. **Data Feeds:** Access product RSS feeds

### What Zazzle's API CANNOT Do:
- Manage orders (Zazzle handles fulfillment)
- Update inventory (automatically synced)
- Access your store's analytics programmatically

### Integration Strategy:

1. **Product Display:** Build a static site that shows Zazzle products
2. **Affiliate Links:** Use Zazzle's affiliate program (15-17% commission)
3. **API Product Creation:** Use the Create-A-Product API to generate new designs programmatically
4. **RSS Feeds:** Monitor your store's products via RSS

### Zazzle API Key Registration:
Go to https://www.zazzle.com/sell/developers to apply for API access. You'll need:
- Your Zazzle store registered
- A domain for the API (your GitHub Pages domain)
- Acceptance of Zazzle's terms

---

## Phase 3: Website Architecture (GitHub Pages)

### Recommended Stack:
- **Static Site Generator:** Astro or 11ty (lightweight, fast)
- **Styling:** Tailwind CSS
- **Hosting:** GitHub Pages (FREE)
- **Domain:** Custom domain with Porkbun

### Site Structure:
```
/
├── index.html          # Landing page with featured products
├── shop/               # Product catalog
├── about/              # The silly tradition story
├── api/                # API endpoints (for automation)
│   ├── products.json   # Zazzle product data
│   └── webhook.php     # For automation triggers
├── assets/
│   ├── images/
│   └── styles/
└── _config.yml         # GitHub Pages config
```

### Key Features:
1. **Product Gallery:** Display Zazzle products with your affiliate links
2. **Auto-Updating:** Products sync from Zazzle via API/RSS
3. **SEO Optimized:** For discoverability
4. **Fast Loading:** Static HTML, minimal JS

---

## Phase 4: Local AI Automation System

### Architecture Overview:

```
┌─────────────────────────────────────────────────────────┐
│                   Your Computer                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │ Ollama/       │   │ ComfyUI      │   │ Scheduler    │ │
│  │ LLM Server    │   │ (Image Gen)  │   │ (Cron Jobs)  │ │
│  └──────────────┘   └──────────────┘   └──────────────┘ │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │  Agent Core   │                     │
│                    │  (Python)     │                     │
│                    └───────┬───────┘                     │
│                            │                             │
│         ┌──────────────────┼──────────────────┐        │
│         │                  │                  │        │
│  ┌──────▼──────┐   ┌───────▼───────┐  ┌──────▼──────┐  │
│  │ Design      │   │ Marketing     │  │ Product     │  │
│  │ Agent       │   │ Agent         │  │ Agent       │  │
│  └──────┬──────┘   └───────┬───────┘  └──────┬──────┘  │
│         │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    [Image Files]      [Blog Posts]      [Zazzle API]
                                      (via GitHub Actions)
```

### Component Details:

#### 4.1 Text Generation (LLM)
- **Tool:** Ollama (recommended) or LM Studio
- **Models:**
  - `llama3.2` - General text
  - `qwen2.5` - Faster, multilingual
- **API:** Local REST at `http://localhost:11434/api/generate`
- **Use:** Product descriptions, blog posts, marketing copy

#### 4.2 Image Generation
- **Tool:** ComfyUI (Windows-native, more powerful than Ollama's experimental image)
- **Models:**
  - FLUX.1 Quick (fast, good quality)
  - Stable Diffusion 3.5 (excellent text rendering)
- **Use:** Create hat designs, merch mockups
- **API:** ComfyUI has a built-in REST API

#### 4.3 Automation Scheduler
- **Tool:** Python with `schedule` library or Windows Task Scheduler
- **Frequency:** Daily/weekly design generation runs
- **Tasks:**
  1. Generate new design concepts
  2. Create product images
  3. Write product descriptions
  4. Post to blog/Social media
  5. Commit changes to GitHub (via GitHub CLI)

#### 4.4 GitHub Integration
- Use `gh` CLI to commit and push changes
- GitHub Actions trigger on push to rebuild site
- Automatic deployment to GitHub Pages

### Automation Workflow Example:

```python
# weekly_design_runner.py

import ollama
import requests
import subprocess
from datetime import datetime

def generate_design_concept():
    """Use LLM to generate a creative hat concept"""
    prompt = """Generate a creative, funny hat design concept for 
    Wall Street traders celebrating a stock market milestone.
    Include: hat style, colors, text/slogans, visual elements.
    Format as JSON with fields: name, description, slogan, visual_notes"""
    
    response = ollama.generate(
        model='llama3.2',
        prompt=prompt,
        format='json'
    )
    return response['response']

def generate_image(concept):
    """Use ComfyUI API to generate product image"""
    # ComfyUI workflow API call
    # Returns image path
    pass

def create_zazzle_product(image_path, concept):
    """Use Zazzle API to create new product"""
    # API call to Zazzle
    pass

def update_website(product_data):
    """Update website with new product"""
    # Update JSON file, commit to GitHub
    subprocess.run(['gh', 'repo', 'sync'])
    
def weekly_job():
    """Main weekly automation job"""
    print(f"Starting design generation: {datetime.now()}")
    
    # 1. Generate concept
    concept = generate_design_concept()
    
    # 2. Generate image
    image_path = generate_image(concept)
    
    # 3. Create Zazzle product
    product_url = create_zazzle_product(image_path, concept)
    
    # 4. Update website
    update_website(product_url)
    
    print("Weekly job complete!")

# Run scheduler
import schedule
schedule.every().monday.do(weekly_job)

while True:
    schedule.run_pending()
```

---

## Phase 5: Implementation Roadmap

### Week 1: Domain & Basic Site
- [ ] Fix Porkbun domain redirects/point to GitHub
- [ ] Set up GitHub Pages with basic HTML
- [ ] Configure custom domain with HTTPS

### Week 2: Website Development
- [ ] Build Astro/HTML site structure
- [ ] Add Zazzle product gallery
- [ ] Style with Tailwind CSS
- [ ] Write "About" page (the tradition story)

### Week 3: AI Infrastructure
- [ ] Install Ollama, pull models
- [ ] Install ComfyUI, set up workflows
- [ ] Test image generation
- [ ] Set up Python automation scripts

### Week 4: Automation & Integration
- [ ] Connect AI to Zazzle API
- [ ] Build weekly job scheduler
- [ ] Test full automation pipeline
- [ ] Connect to GitHub for auto-deploy

### Ongoing: Agent Team
- [ ] Design Agent: Generates hat concepts
- [ ] Marketing Agent: Social media, blog posts
- [ ] Product Agent: Creates and lists products
- [ ] Analytics Agent: Monitors performance

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| Domain (Porkbun) | ~$10/year |
| GitHub Pages | FREE |
| Ollama | FREE |
| ComfyUI | FREE |
| Zazzle (no fees) | FREE |
| **Total** | **~$10/year** |

---

## Important Notes

1. **Zazzle API requires approval** - Apply early, it may take time
2. **GitHub Pages is public** - All code is visible (but that's fine for this)
3. **Windows AI tools** - Ollama has experimental image gen on Mac; use ComfyUI on Windows
4. **GitHub rate limits** - Automate within limits; use caching
5. **Zazzle fulfillment** - They handle printing, shipping, customer service

---

## Next Steps

1. **Immediate:** Fix Porkbun domain → point to GitHub Pages
2. **This week:** Build basic website
3. **Next week:** Set up local AI
4. **Then:** Automate everything

Would you like me to start implementing any of these components?
