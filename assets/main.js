/**
 * Capital Market Event - Main JavaScript
 * Loads products dynamically from products.json
 */

document.addEventListener('DOMContentLoaded', () => {
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
    
    card.innerHTML = `
        <div class="product-image">
            <div class="placeholder-product">
                <span>${imageEmoji}</span>
            </div>
        </div>
        <h3>${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <a href="${product.url}" class="btn btn-small" target="_blank" rel="noopener">Shop Now</a>
    `;
    
    return card;
}
