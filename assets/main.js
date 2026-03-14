// Capital Market Event - Main JavaScript

// Product data - in production, this would come from Zazzle API or RSS feed
const products = [
    {
        id: 1,
        name: "10,000 Dow Club",
        description: "Celebrate the magic number with this classic milestone hat",
        emoji: "🎩",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 2,
        name: "All Time Highs Hat",
        description: "For when the market just keeps going up",
        emoji: "🤡",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 3,
        name: "Bull Run Beanie",
        description: "Ride the wave in style",
        emoji: "🐂",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 4,
        name: "Buy the Dip Cap",
        description: "For the brave souls who catch falling knives",
        emoji: "📉",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 5,
        name: "Diamond Hands Headband",
        description: "Never sell, no matter what",
        emoji: "💎",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 6,
        name: "Short the World Cap",
        description: "For the permabears",
        emoji: "🐻",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 7,
        name: "Viral Meme Crown",
        description: "For stocks that go viral",
        emoji: "👑",
        url: "https://www.zazzle.com/store/capital_market_event"
    },
    {
        id: 8,
        name: "IPO Day Fiesta Sombrero",
        description: "Celebrate going public in style",
        emoji: "🎉",
        url: "https://www.zazzle.com/store/capital_market_event"
    }
];

// Render products to the DOM
function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <div class="placeholder-product">
                    <span>${product.emoji}</span>
                </div>
            </div>
            <h3>${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            <a href="${product.url}" class="btn btn-small" target="_blank" rel="noopener">View on Zazzle</a>
        </div>
    `).join('');
}

// Fetch products from external source (for future Zazzle integration)
async function fetchProducts() {
    try {
        // In production, this would fetch from your Zazzle store API or RSS
        // For now, we'll use the local products array
        console.log('Products loaded:', products.length);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Ticker tape animation
function initTicker() {
    const ticker = document.querySelector('.ticker-content');
    if (!ticker) return;

    // Duplicate content for seamless loop
    const originalContent = ticker.innerHTML;
    ticker.innerHTML = originalContent + originalContent;
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Header scroll effect
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
}

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    initTicker();
    initSmoothScroll();
    initHeaderScroll();
    fetchProducts();
});

// Export for potential use in automation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { products, renderProducts, fetchProducts };
}
