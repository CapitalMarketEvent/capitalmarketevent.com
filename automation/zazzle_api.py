"""
Capital Market Event - Zazzle API Integration
=============================================

This module handles the Zazzle Create-A-Product API.
The API is URL-based - we generate links that pass images/text to Zazzle templates.

Documentation: https://www.zazzle.com/sell/developers
API Guide: See ZazzleApiGuide.v3.pdf in root

Usage:
    python zazzle_api.py --create-link --template-id YOUR_TEMPLATE_ID --image-url IMAGE_URL --text "Your Text"
    python zazzle_api.py --generate-realview --template-id YOUR_TEMPLATE_ID
"""

import urllib.parse
import argparse
from typing import Optional
from datetime import datetime


# Configuration - Set these as environment variables!
# DO NOT hardcode values here - use os.getenv()
# Example: export ZAZZLE_MEMBER_ID='123456789012345678'
ZAZZLE_MEMBER_ID = os.getenv("ZAZZLE_MEMBER_ID", "")
ZAZZLE_ASSOCIATE_ID = os.getenv("ZAZZLE_ASSOCIATE_ID", "")


def url_encode(text: str) -> str:
    """URL encode a string for use in API links."""
    return urllib.parse.quote(text, safe='')


def url_encode_image(image_url: str) -> str:
    """URL encode an image URL."""
    return urllib.parse.quote(image_url, safe='')


class ZazzleAPI:
    """Zazzle Create-A-Product API wrapper."""
    
    def __init__(self, member_id: str, associate_id: Optional[str] = None):
        self.member_id = member_id
        self.associate_id = associate_id or member_id
    
    def create_product_link(
        self,
        template_id: str,
        image_url: Optional[str] = None,
        text: Optional[str] = None,
        text_color: str = "000000",
        allow_customization: bool = True,
        tracking_code: Optional[str] = None,
        image_code: Optional[str] = None
    ) -> str:
        """
        Create a 1-to-1 product link.
        
        Args:
            template_id: The 18-digit product ID of your template
            image_url: URL of the image to place on the product
            text: Text to place on the product
            text_color: Hex color code for text (default: black)
            allow_customization: Whether users can edit on Zazzle
            tracking_code: Custom tracking code for analytics
            image_code: Custom image tracking code
        
        Returns:
            Full Zazzle product URL
        """
        # Base URL
        url = f"https://www.zazzle.com/api/create/at-{self.member_id}?"
        
        # Required parameters
        url += f"ax=Linkover"  # API type
        url += f"&pd={template_id}"  # Product/Template ID
        
        # Optional: Associate ID for referral tracking
        if self.associate_id:
            url += f"&rf={self.associate_id}"
        
        # Customization
        url += f"&ed={'true' if allow_customization else 'false'}"
        
        # Tracking codes
        if tracking_code:
            url += f"&tc={url_encode(tracking_code)}"
        if image_code:
            url += f"&ic={url_encode(image_code)}"
        
        # Image (if provided)
        if image_url:
            url += f"&t_image1_iid={url_encode_image(image_url)}"
        
        # Text (if provided)
        if text:
            url += f"&t_text1_txt={url_encode(text)}"
            url += f"&t_text1_txtclr={text_color}"
        
        return url
    
    def create_multi_product_link(
        self,
        store_id: str,
        category_id: str,
        image_url: Optional[str] = None,
        text: Optional[str] = None,
        text_color: str = "000000",
        allow_customization: bool = True,
        continue_url: Optional[str] = None,
        tracking_code: Optional[str] = None,
        image_code: Optional[str] = None
    ) -> str:
        """
        Create a 1-to-Many (Templates Buffet) link.
        
        Generates products from ALL templates in a category.
        
        Args:
            store_id: Your store's 18-digit ID
            category_id: The category ID containing templates
            image_url: URL of the image to place on products
            text: Text to place on products
            text_color: Hex color code for text
            allow_customization: Whether users can edit
            continue_url: URL for "Go Back" link
            tracking_code: Custom tracking code
            image_code: Custom image tracking code
        
        Returns:
            Full Zazzle buffet URL
        """
        url = f"https://www.zazzle.com/api/create/at-{self.member_id}?"
        
        # Required parameters
        url += f"ax=DesignBlast"  # API type for multi-product
        url += f"&sr={store_id}"  # Store ID
        url += f"&cg={category_id}"  # Category ID
        
        # Optional: Associate ID
        if self.associate_id:
            url += f"&rf={self.associate_id}"
        
        # Customization
        url += f"&ed={'true' if allow_customization else 'false'}"
        
        # Continue URL
        if continue_url:
            url += f"&continueUrl={url_encode(continue_url)}"
        
        # Tracking
        if tracking_code:
            url += f"&tc={url_encode(tracking_code)}"
        if image_code:
            url += f"&ic={url_encode(image_code)}"
        
        # Image
        if image_url:
            url += f"&t_image1_iid={url_encode_image(image_url)}"
        
        # Text
        if text:
            url += f"&t_text1_txt={url_encode(text)}"
            url += f"&t_text1_txtclr={text_color}"
        
        return url
    
    def generate_realview_image(
        self,
        template_id: str,
        image_url: Optional[str] = None,
        text: Optional[str] = None,
        text_color: str = "000000",
        max_dim: int = 512
    ) -> str:
        """
        Generate a dynamic RealView product preview image.
        
        Args:
            template_id: Your template's product ID
            image_url: Image to show on product
            text: Text to show on product
            text_color: Hex color for text
            max_dim: Image size (10-2212, 700+ includes Zazzle frame)
        
        Returns:
            URL for the generated product image
        """
        url = "https://rlv.zazzle.com/svc/view?"
        
        # Required
        url += f"pid={template_id}"
        url += f"&max_dim={max_dim}"
        url += f"&at={self.member_id}"
        
        # Image
        if image_url:
            url += f"&t_image1_url={url_encode_image(image_url)}"
        
        # Text
        if text:
            url += f"&t_text1_txt={url_encode(text)}"
            url += f"&t_text1_txtclr={text_color}"
        
        return url


def generate_milestone_hat_link(milestone: str, design_url: str, template_id: str) -> str:
    """Generate a product link for a market milestone hat.
    
    Args:
        milestone: The market milestone text (e.g., "Dow 20K")
        design_url: URL of the design image
        template_id: Your Zazzle template ID (required - no default)
    
    Returns:
        Product URL or error message if not configured
    """
    if not ZAZZLE_MEMBER_ID:
        return "Error: ZAZZLE_MEMBER_ID not set. Use environment variable."
    
    if not template_id:
        return "Error: template_id required. Create a hat template in Zazzle first."
    
    api = ZazzleAPI(ZAZZLE_MEMBER_ID, ZAZZLE_ASSOCIATE_ID)
    
    return api.create_product_link(
        template_id=template_id,
        image_url=design_url,
        text=milestone,
        text_color="000000",
        tracking_code=f"milestone_{milestone.lower().replace(' ', '_')}",
        image_code=f"design_{datetime.now().strftime('%Y%m%d')}"
    )


# Example usage and testing
def main():
    import os
    
    # Get IDs from environment or use placeholders
    member_id = os.getenv("ZAZZLE_MEMBER_ID", "YOUR_MEMBER_ID")
    associate_id = os.getenv("ZAZZLE_ASSOCIATE_ID", "YOUR_ASSOCIATE_ID")
    
    parser = argparse.ArgumentParser(description="Zazzle API Tool")
    parser.add_argument("--create-link", action="store_true", help="Create a product link")
    parser.add_argument("--template-id", help="Template/product ID")
    parser.add_argument("--image-url", help="URL of image for product")
    parser.add_argument("--text", help="Text for product")
    parser.add_argument("--realview", action="store_true", help="Generate RealView preview")
    parser.add_argument("--max-dim", type=int, default=512, help="RealView image dimension")
    
    args = parser.parse_args()
    
    api = ZazzleAPI(member_id, associate_id)
    
    if args.create_link and args.template_id:
        link = api.create_product_link(
            template_id=args.template_id,
            image_url=args.image_url,
            text=args.text
        )
        print("Product Link:")
        print(link)
        print()
        
        if args.image_url or args.text:
            realview = api.generate_realview_image(
                template_id=args.template_id,
                image_url=args.image_url,
                text=args.text,
                max_dim=args.max_dim
            )
            print("RealView Preview:")
            print(realview)
    
    elif args.realview and args.template_id:
        realview = api.generate_realview_image(
            template_id=args.template_id,
            max_dim=args.max_dim
        )
        print("RealView Preview URL:")
        print(realview)
    
    else:
        print("Zazzle API Tool")
        print("=" * 50)
        print()
        print("Usage:")
        print("  python zazzle_api.py --create-link --template-id TEMPLATE_ID --image-url URL --text 'TEXT'")
        print("  python zazzle_api.py --realview --template-id TEMPLATE_ID")
        print()
        print("Setup:")
        print("  1. Sign up at https://www.zazzle.com/lgn/registration")
        print("  2. Create store at https://www.zazzle.com/my/store/create")
        print("  3. Enroll in Associates: https://www.zazzle.com/my/associate/associate")
        print("  4. Accept API terms: https://www.zazzle.com/my/associate/create_a_product_api_signup")
        print("  5. Declare domains: https://www.zazzle.com/my/associate/domains")
        print("  6. Set ZAZZLE_MEMBER_ID environment variable")
        print()
        print("Environment Variables:")
        print("  export ZAZZLE_MEMBER_ID='your_18_digit_id'")
        print("  export ZAZZLE_ASSOCIATE_ID='your_associate_id'")


if __name__ == "__main__":
    main()
