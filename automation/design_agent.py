"""
Capital Market Event - AI Design Agent
=======================================

This agent generates creative hat design concepts using local AI (Ollama).
It can be run as a periodic job to create new product ideas.

Usage:
    python design_agent.py --generate          # Generate a new design concept
    python design_agent.py --run-scheduler    # Run the weekly scheduler

Requirements:
    - Ollama installed and running (http://localhost:11434)
    - Python dependencies: pip install -r requirements.txt
    - GitHub CLI installed for auto-commit
"""

import json
import os
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import requests

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
GITHUB_REPO = os.getenv("GITHUB_REPO", "sb4ssman/capitalmarketevent.com")
DESIGNS_DIR = Path(__file__).parent.parent / "automation" / "generated_designs"
OUTPUT_FILE = Path(__file__).parent.parent / "automation" / "latest_design.json"


class DesignAgent:
    """AI Agent that generates hat design concepts for market milestones."""
    
    def __init__(self):
        self.ollama_available = self._check_ollama()
        self.designs_dir = DESIGNS_DIR
        self.designs_dir.mkdir(parents=True, exist_ok=True)
    
    def _check_ollama(self) -> bool:
        """Check if Ollama is running."""
        try:
            response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            print("⚠️  Ollama not available. Using fallback prompt generation.")
            return False
    
    def _generate_with_ollama(self, prompt: str, model: str = "llama3.2") -> Optional[dict]:
        """Generate content using Ollama."""
        try:
            response = requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False
                },
                timeout=60
            )
            if response.status_code == 200:
                return json.loads(response.json()["response"])
        except Exception as e:
            print(f"Error generating with Ollama: {e}")
        return None
    
    def _generate_fallback(self) -> dict:
        """Generate a design concept without AI (fallback)."""
        import random
        
        hats = ["Fedora", "Beanie", "Cap", "Sombrero", "Crown", "Headband", "Trucker Cap"]
        themes = [
            "Bull Run", "Bear Market", "All Time High", "Buy the Dip",
            "Diamond Hands", "To the Moon", "MOASS", "ROI", "Dividend",
            "Index Fund", "ETF", "401k", "Short Squeeze"
        ]
        styles = [
            "Neon cyberpunk", "Vintage Wall Street 1980s", "Meme stock colorful",
            "Minimalist corporate", "Casino Vegas", "Trading floor chaos"
        ]
        
        return {
            "name": f"{random.choice(themes)} {random.choice(hats)}",
            "description": f"A {random.choice(styles)} style hat celebrating {random.choice(themes)}",
            "slogan": random.choice([
                "Diamond Hands Forever!",
                "HODL Till Moon",
                "Bulls Make Money, Bears Make Money, Pigs Get Slaughtered",
                "Past Performance = Future Losses",
                "I Am Not a Financial Advisor",
                "Day Trading = Day Gambling"
            ]),
            "visual_notes": f"Use {random.choice(['bold', 'subtle', 'retro', 'modern'])} aesthetics with {random.choice(['gold', 'green', 'red', 'blue'])} accent colors",
            "market_event": random.choice(["All Time High", "Market Crash", "Bull Run", "Bear Market", "IPO"]),
            "generated_at": datetime.now().isoformat(),
            "ai_generated": False
        }
    
    def generate_design_concept(self) -> dict:
        """Generate a new hat design concept."""
        
        system_prompt = """You are a creative designer specializing in finance-themed merchandise. 
Generate a JSON object for a hat design concept with these fields:
- name: Creative product name (e.g., "Dow 30K Club Fedora")
- description: Short marketing description (1-2 sentences)
- slogan: Catchy text for the hat
- visual_notes: Description of visual style, colors, elements
- market_event: What market milestone this celebrates

Make it fun, memorable, and suitable for Wall Street traders who love the silly side of finance."""

        if self.ollama_available:
            print("🤖 Generating design with AI...")
            result = self._generate_with_ollama(system_prompt)
            if result:
                result["ai_generated"] = True
                result["generated_at"] = datetime.now().isoformat()
                return result
        
        print("📝 Using fallback design generation...")
        return self._generate_fallback()
    
    def save_design(self, design: dict) -> Path:
        """Save design to a JSON file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"design_{timestamp}.json"
        filepath = self.designs_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(design, f, indent=2)
        
        # Also save as latest
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(design, f, indent=2)
        
        print(f"💾 Design saved to: {filepath}")
        return filepath
    
    def generate_and_save(self) -> dict:
        """Generate a new design and save it."""
        design = self.generate_design_concept()
        
        print("\n" + "="*50)
        print("🎩 NEW DESIGN CONCEPT GENERATED")
        print("="*50)
        print(f"Name: {design.get('name')}")
        print(f"Description: {design.get('description')}")
        print(f"Slogan: {design.get('slogan')}")
        print(f"AI Generated: {design.get('ai_generated', False)}")
        print("="*50 + "\n")
        
        filepath = self.save_design(design)
        return design


class GitHubSync:
    """Handles GitHub integration for auto-committing changes."""
    
    @staticmethod
    def commit_and_push(message: str, files: list[str]) -> bool:
        """Commit files to GitHub."""
        try:
            # Add files
            for f in files:
                subprocess.run(["git", "add", f], check=True, capture_output=True)
            
            # Commit
            subprocess.run(["git", "commit", "-m", message], check=True, capture_output=True)
            
            # Push
            result = subprocess.run(["git", "push"], capture_output=True)
            if result.returncode != 0:
                print(f"⚠️  Push failed (might need credentials): {result.stderr.decode()}")
                return False
            
            print("✅ Changes pushed to GitHub!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Git error: {e.stderr.decode()}")
            return False
        except FileNotFoundError:
            print("⚠️  Git CLI not found. Install GitHub CLI: https://cli.github.com")
            return False


def run_scheduler():
    """Run the periodic design generation scheduler."""
    import schedule
    
    print("📅 Starting design generation scheduler...")
    print("Press Ctrl+C to stop")
    
    # Run every Monday at 9 AM
    schedule.every().monday.at("09:00").do(run_weekly_design)
    
    # Also run immediately for testing
    print("\n🚀 Running initial design generation...")
    run_weekly_design()
    
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour


def run_weekly_design():
    """Weekly job to generate and publish a new design."""
    print(f"\n{'='*50}")
    print(f"🎯 Weekly Design Run - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")
    
    agent = DesignAgent()
    design = agent.generate_and_save()
    
    # Try to commit to GitHub
    if GitHubSync.commit_and_push(
        f"🤖 AI Generated: {design.get('name')}",
        [str(OUTPUT_FILE)]
    ):
        print("✨ New design queued for deployment!")
    
    print(f"\n✅ Weekly run complete. Next run: next Monday at 9 AM")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Capital Market Event Design Agent")
    parser.add_argument("--generate", action="store_true", help="Generate a new design concept")
    parser.add_argument("--run-scheduler", action="store_true", help="Run the weekly scheduler")
    parser.add_argument("--model", default="llama3.2", help="Ollama model to use")
    
    args = parser.parse_args()
    
    if args.generate:
        agent = DesignAgent()
        agent.generate_and_save()
    elif args.run_scheduler:
        run_scheduler()
    else:
        parser.print_help()
        print("\n" + "="*50)
        print("Quick Start:")
        print("  python design_agent.py --generate")
        print("  python design_agent.py --run-scheduler")
        print("="*50)


if __name__ == "__main__":
    main()
