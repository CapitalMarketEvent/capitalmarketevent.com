/**
 * Capital Market Event - Main JavaScript
 * Loads products dynamically from products.json
 */

// ─── Rotating taglines ────────────────────────────────────────────────────────
// Add more here anytime. They rotate every 4 seconds.
const TAGLINES = [
    "Market up. Hat on.",
    "For every number that made you check your portfolio twice.",
    "Because green days deserve something to show for it.",
    "Every ATH deserves a paper trail.",
    "Numbers go up. Hats go on.",
    "For the days the market did something worth bragging about.",
    "Green candles only.",
    "To the moon, eventually.",
];

function startRotatingTagline() {
    const el = document.getElementById('rotating-tagline');
    if (!el) return;

    let index = 0;
    el.textContent = TAGLINES[index];

    setInterval(() => {
        el.style.opacity = '0';
        setTimeout(() => {
            index = (index + 1) % TAGLINES.length;
            el.textContent = TAGLINES[index];
            el.style.opacity = '1';
        }, 400);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    startRotatingTagline();
    loadProducts();
});

async function loadProducts() {
    const productGrid = document.getElementById('product-grid');
    const comingSoon = document.getElementById('coming-soon');
    
    if (!productGrid) return;
    
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        const products = data.products || [];
        
        if (products.length === 0) {
            // No products yet - show coming soon
            productGrid.style.display = 'none';
            if (comingSoon) {
                comingSoon.style.display = 'block';
            }
            return;
        }
        
        // Hide coming soon, show products
        if (comingSoon) {
            comingSoon.style.display = 'none';
        }
        
        // Render products
        products.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to coming soon on error
        productGrid.style.display = 'none';
        if (comingSoon) {
            comingSoon.style.display = 'block';
        }
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageEmoji = product.emoji || '🎩';
    
    const imageHTML = product.image_url
        ? `<img src="${product.image_url}" alt="${product.name}" loading="lazy">`
        : `<span>${imageEmoji}</span>`;

    card.innerHTML = `
        <div class="product-image">
            <div class="placeholder-product">
                ${imageHTML}
            </div>
        </div>
        <h3>${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-footer">
            <span class="product-price">${product.price || ''}</span>
            <a href="${product.url}" class="btn btn-small" target="_blank" rel="noopener">Shop →</a>
        </div>
    `;
    
    return card;
}
