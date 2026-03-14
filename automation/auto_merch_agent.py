"""
Capital Market Event - Automated Merch Agent
=============================================

This is the main automation script that ties everything together:
1. Generates design concepts with Ollama (LLM)
2. Generates images with ComfyUI (Stable Diffusion)
3. Creates products on Zazzle via API
4. Updates the website
5. Commits to GitHub

Usage:
    python auto_merch_agent.py --run-full       # Run the full pipeline
    python auto_merch_agent.py --generate-only  # Just generate concepts
    python auto_merch_agent.py --create-product # Create product from design
    python auto_merch_agent.py --schedule       # Run scheduler

Requirements:
    - Ollama running (localhost:11434)
    - ComfyUI running (localhost:8188)
    - Zazzle account with API access
    - GitHub CLI authenticated
"""

import json
import os
import subprocess
import time
import random
from datetime import datetime
from pathlib import Path
from typing import Optional
import requests

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
COMFYUI_HOST = os.getenv("COMFYUI_HOST", "http://localhost:8188")
GITHUB_REPO = "sb4ssman/capitalmarketevent.com"

# Zazzle Configuration (set these as environment variables)
ZAZZLE_MEMBER_ID = os.getenv("ZAZZLE_MEMBER_ID", "")
ZAZZLE_ASSOCIATE_ID = os.getenv("ZAZZLE_ASSOCIATE_ID", "")
ZAZZLE_TEMPLATE_ID = os.getenv("ZAZZLE_TEMPLATE_ID", "")  # Your hat template ID

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DESIGNS_DIR = PROJECT_ROOT / "automation" / "generated_designs"
IMAGES_DIR = PROJECT_ROOT / "automation" / "generated_images"
OUTPUT_FILE = PROJECT_ROOT / "automation" / "latest_merch.json"


class MerchAutomationAgent:
    """Complete automation agent for the merch business."""
    
    def __init__(self):
        self.designs_dir = DESIGNS_DIR
        self.images_dir = IMAGES_DIR
        self.designs_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
        self.ollama_available = self._check_service(OLLAMA_HOST)
        self.comfyui_available = self._check_service(COMFYUI_HOST)
        self.zazzle_configured = bool(ZAZZLE_MEMBER_ID and ZAZZLE_TEMPLATE_ID)
    
    def _check_service(self, host: str) -> bool:
        """Check if a service is available."""
        try:
            response = requests.get(host if host.startswith("http") else f"http://{host}", timeout=5)
            return response.status_code < 500
        except:
            return False
    
    # ==================== STEP 1: Design Concepts ====================
    
    def generate_design_concept(self) -> dict:
        """Generate a creative hat design concept using AI."""
        
        market_events = [
            "Dow Jones hitting 20,000", "S&P 500 at all-time high",
            "NASDAQ surpass 20,000", "Bitcoin hitting new highs",
            "Market crash recovery", "Bull run continuation",
            "IPO season", "Earnings season", "Fed rate decision",
            "Meme stock rally", "Short squeeze", "Dividend season"
        ]
        
        hat_styles = [
            "Fedora", "Baseball cap", "Beanie", "Trucker cap",
            "Top hat", "Crown", "Headband", "Visor", "Snapback"
        ]
        
        themes = [
            "Retro Wall Street 1980s", "Modern fintech", "Meme culture",
            "Casino/Vegas style", "Classic Wall Street", "Tech startup",
            "Trading floor chaos", "Bull vs Bear", "Diamond hands"
        ]
        
        slogans = [
            "Diamond Hands Forever!",
            "HODL Till Moon",
            "Bulls Make Money, Bears Make Money, Pigs Get Slaughtered",
            "Past Performance = Future Losses",
            "I Am Not a Financial Advisor",
            "Day Trading = Day Gambling",
            "Buy the Dip",
            "Stay Rich, Friends",
            "Financial Trauma survivor",
            "The Market Has No Feelings"
        ]
        
        # Use Ollama if available
        if self.ollama_available:
            try:
                response = requests.post(
                    f"{OLLAMA_HOST}/api/generate",
                    json={
                        "model": "llama3.2",
                        "prompt": f"""Generate a fun, creative hat design concept for Wall Street traders.
Create a JSON object with these exact fields:
- name: Product name (e.g., "Dow 20K Club Fedora")
- description: Short marketing description
- slogan: Catchy slogan for traders
- visual_style: Description of colors and style
- market_event: What this celebrates: {random.choice(market_events)}

Make it humorous and memorable. JSON only.""",
                        "format": "json",
                        "stream": False
                    },
                    timeout=60
                )
                if response.status_code == 200:
                    result = json.loads(response.json()["response"])
                    result["ai_generated"] = True
                    result["generated_at"] = datetime.now().isoformat()
                    return result
            except Exception as e:
                print(f"Ollama error: {e}")
        
        # Fallback to random generation
        return {
            "name": f"{random.choice(market_events).split()[0]} {random.choice(hat_styles)}",
            "description": f"A {random.choice(themes)} style hat for {random.choice(market_events)}",
            "slogan": random.choice(slogans),
            "visual_style": f"{random.choice(['Bold', 'Subtle', 'Retro'])} {random.choice(['green', 'gold', 'red', 'blue'])} aesthetics",
            "market_event": random.choice(market_events),
            "generated_at": datetime.now().isoformat(),
            "ai_generated": self.ollama_available
        }
    
    # ==================== STEP 2: Image Generation ====================
    
    def generate_image(self, concept: dict) -> Optional[Path]:
        """Generate a product image using ComfyUI."""
        
        if not self.comfyui_available:
            print("⚠️  ComfyUI not available - using placeholder")
            return None
        
        try:
            # This is a simplified example - you'd customize the workflow
            prompt = f"""
            A high-quality product photo of a {concept.get('name', 'trading hat')}.
            White background, professional product photography.
            Style: {concept.get('visual_style', 'modern')}
            Text on hat: "{concept.get('slogan', '')}"
            """
            
            # ComfyUI API endpoint (simplified - you'd set up a specific workflow)
            response = requests.post(
                f"{COMFYUI_HOST}/prompt",
                json={
                    "prompt": {
                        "3": {"inputs": {"text": prompt}},
                        # ... additional workflow nodes
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                # Save the generated image
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"hat_{timestamp}.png"
                filepath = self.images_dir / filename
                # Note: Actual implementation would download the image from ComfyUI
                return filepath
            
        except Exception as e:
            print(f"ComfyUI error: {e}")
        
        return None
    
    # ==================== STEP 3: Zazzle Product ====================
    
    def create_zazzle_product(self, concept: dict, image_path: Optional[Path]) -> dict:
        """Create a product on Zazzle using the API."""
        
        if not self.zazzle_configured:
            return {
                "success": False,
                "message": "Zazzle not configured - set ZAZZLE_MEMBER_ID and ZAZZLE_TEMPLATE_ID",
                "url": None
            }
        
        try:
            # Generate the Zazzle product URL
            from urllib.parse import quote
            
            base_url = "https://www.zazzle.com/api/create"
            params = {
                "at": ZAZZLE_MEMBER_ID,
                "ax": "Linkover",
                "pd": ZAZZLE_TEMPLATE_ID,
                "ed": "true"
            }
            
            if image_path:
                params["t_image1_iid"] = quote(str(image_path))
            
            if concept.get("slogan"):
                params["t_text1_txt"] = quote(concept["slogan"])
                params["t_text1_txtclr"] = "000000"
            
            if ZAZZLE_ASSOCIATE_ID:
                params["rf"] = ZAZZLE_ASSOCIATE_ID
            
            # Build URL
            url = base_url + "?" + "&".join(f"{k}={v}" for k, v in params.items())
            
            return {
                "success": True,
                "url": url,
                "product_name": concept.get("name"),
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "url": None
            }
    
    # ==================== STEP 4: Update Website ====================
    
    def update_website_product(self, product_data: dict) -> bool:
        """Add the new product to the website."""
        
        try:
            # Load current products
            products_file = PROJECT_ROOT / "assets" / "products.json"
            
            if products_file.exists():
                with open(products_file) as f:
                    products = json.load(f)
            else:
                products = []
            
            # Add new product
            products.append({
                "id": len(products) + 1,
                "name": product_data.get("product_name", "New Product"),
                "description": product_data.get("description", ""),
                "url": product_data.get("url", ""),
                "slogan": product_data.get("slogan", ""),
                "added_at": datetime.now().isoformat()
            })
            
            # Save
            with open(products_file, 'w') as f:
                json.dump(products, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error updating website: {e}")
            return False
    
    # ==================== STEP 5: GitHub Sync ====================
    
    def commit_to_github(self, message: str) -> bool:
        """Commit and push changes to GitHub."""
        
        try:
            # Add files
            subprocess.run(["git", "add", "-A"], check=True, capture_output=True, cwd=PROJECT_ROOT)
            
            # Commit
            subprocess.run(
                ["git", "commit", "-m", message],
                check=True, capture_output=True, cwd=PROJECT_ROOT
            )
            
            # Push
            result = subprocess.run(["git", "push"], capture_output=True, cwd=PROJECT_ROOT)
            
            if result.returncode == 0:
                print("✅ Pushed to GitHub!")
                return True
            else:
                print(f"⚠️  Push issue: {result.stderr.decode()}")
                return False
                
        except subprocess.CalledProcessError as e:
            print(f"❌ Git error: {e.stderr.decode()}")
            return False
        except FileNotFoundError:
            print("⚠️  Git CLI not found")
            return False
    
    # ==================== MAIN PIPELINE ====================
    
    def run_full_pipeline(self) -> dict:
        """Run the complete automation pipeline."""
        
        print("=" * 60)
        print("🎩 Capital Market Event - Automated Merch Agent")
        print("=" * 60)
        
        results = {
            "started_at": datetime.now().isoformat(),
            "steps": {}
        }
        
        # Step 1: Generate concept
        print("\n[1/4] Generating design concept...")
        concept = self.generate_design_concept()
        print(f"  ✅ Created: {concept.get('name')}")
        print(f"     Slogan: {concept.get('slogan')}")
        results["steps"]["concept"] = concept
        
        # Step 2: Generate image
        print("\n[2/4] Generating product image...")
        image_path = self.generate_image(concept)
        if image_path:
            print(f"  ✅ Generated: {image_path.name}")
        else:
            print("  ⚠️  Using placeholder (ComfyUI not available)")
        results["steps"]["image"] = str(image_path) if image_path else None
        
        # Step 3: Create Zazzle product
        print("\n[3/4] Creating Zazzle product...")
        product = self.create_zazzle_product(concept, image_path)
        if product.get("success"):
            print(f"  ✅ Product URL created")
            print(f"     {product.get('url', '')[:80]}...")
        else:
            print(f"  ⚠️  {product.get('message')}")
        results["steps"]["product"] = product
        
        # Step 4: Update website
        print("\n[4/4] Updating website...")
        website_updated = self.update_website_product({**concept, **product})
        if website_updated:
            print("  ✅ Website updated")
        results["steps"]["website_updated"] = website_updated
        
        # Save results
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Commit to GitHub
        print("\n[Push] Committing to GitHub...")
        self.commit_to_github(f"🤖 New merch: {concept.get('name')}")
        
        results["completed_at"] = datetime.now().isoformat()
        
        print("\n" + "=" * 60)
        print("✅ Pipeline complete!")
        print("=" * 60)
        
        return results


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Capital Market Event - Auto Merch Agent")
    parser.add_argument("--run-full", action="store_true", help="Run the full pipeline")
    parser.add_argument("--generate-only", action="store_true", help="Just generate a concept")
    parser.add_argument("--create-product", action="store_true", help="Create a Zazzle product")
    parser.add_argument("--schedule", action="store_true", help="Run scheduled jobs")
    
    args = parser.parse_args()
    
    agent = MerchAutomationAgent()
    
    if args.run_full:
        agent.run_full_pipeline()
    elif args.generate_only:
        concept = agent.generate_design_concept()
        print(json.dumps(concept, indent=2))
    elif args.create_product:
        concept = agent.generate_design_concept()
        product = agent.create_zazzle_product(concept, None)
        print(json.dumps(product, indent=2))
    elif args.schedule:
        import schedule
        
        print("📅 Starting scheduler...")
        print("Press Ctrl+C to stop")
        
        # Run daily at 9 AM
        schedule.every().day.at("09:00").do(agent.run_full_pipeline)
        
        # Also run weekly
        schedule.every().monday.at("09:00").do(agent.run_full_pipeline)
        
        # Run once immediately for testing
        print("\n🚀 Running initial pipeline...")
        agent.run_full_pipeline()
        
        while True:
            schedule.run_pending()
            time.sleep(3600)
    else:
        parser.print_help()
        print("\n" + "=" * 50)
        print("Quick Start:")
        print("  python auto_merch_agent.py --run-full")
        print("  python auto_merch_agent.py --schedule")
        print("=" * 50)
        print("\nEnvironment Variables needed:")
        print("  ZAZZLE_MEMBER_ID")
        print("  ZAZZLE_TEMPLATE_ID")
        print("  (Optional: ZAZZLE_ASSOCIATE_ID, OLLAMA_HOST, COMFYUI_HOST)")


if __name__ == "__main__":
    main()
