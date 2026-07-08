// ==========================================
// GLOBAL API SCOPING SAFETY CHECK
// ==========================================
// If api was declared as a block-scoped constant, explicitly expose it to the window object
if (!window.api && typeof api !== 'undefined') {
    window.api = api;
}

$(document).ready(function () {
    const $searchInput = $('#partSearch');
    const $results = $('#searchResults');
    let debounceTimer = null;

    // Note: We removed "const api = window.api;" from here to allow 
    // JavaScript to naturally look up the scope chain for the global 'api' instance.

    // ==========================================
    // IMAGE URL HELPER
    // ==========================================
    // Your frontend and backend run on different origins (api.js points
    // axios at http://localhost:4000), so item images — which live under
    // the backend's /uploads folder — must be resolved against THAT origin,
    // not the page's own origin. We read the same baseURL api.js already
    // configured, so there's only one place that ever needs to change.
    function backendBaseUrl() {
        try {
            if (typeof api !== 'undefined' && api.defaults && api.defaults.baseURL) return api.defaults.baseURL;
        } catch (e) { /* api not in scope yet */ }
        if (window.api && window.api.defaults && window.api.defaults.baseURL) return window.api.defaults.baseURL;
        return '';
    }

    function resolveImageUrl(rawPath) {
        if (!rawPath) return '/img/placeholder-part.png';

        let src = rawPath;

        // Already a full absolute URL — leave it alone.
        if (src.startsWith('http')) return encodeURI(src);

        // Bare filename with no folder (e.g. from a product_images join) —
        // assume it lives under /uploads/items/. Otherwise just root it.
        if (!src.startsWith('/')) {
            src = src.includes('/') ? `/${src}` : `/uploads/items/${src}`;
        }

        // Filenames like "Wheel Tire (Diablo Rosso).jpg" contain spaces and
        // parentheses — encode them so the browser requests the exact file.
        return encodeURI(`${backendBaseUrl()}${src}`);
    }

    function clearResults() {
        $results.empty();
    }

    function renderResults(parts) {
        if (!parts || !parts.length) {
            $results.html('<div class="search-empty">No parts found.</div>');
            return;
        }

        const html = parts.map(part => `
            <div class="search-item" data-id="${part.id || part.item_id}" data-name="${part.name || part.description}">
                <span>${part.name || part.description}</span>
                <strong>₱ ${Number(part.price || part.sell_price).toFixed(2)}</strong>
            </div>
        `).join('');

        $results.html(html);
    }

    function searchParts(query, callback) {
        const trimmed = query.trim();
        if (!trimmed) {
            clearResults();
            return;
        }

        api.get('/parts', { params: { q: trimmed } })
            .then(res => {
                renderResults(res.data);
                if (typeof callback === 'function') {
                    callback(res.data);
                }
            })
            .catch(err => {
                console.error('Search failed', err);
                $results.html('<div class="search-empty">Search failed. Try again.</div>');
            });
    }

    $searchInput.on('input', function () {
        const query = $(this).val();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => searchParts(query), 250);
    });

    function navigateToPart(partId) {
        if (!partId) return;
        window.location.href = `/catalog.html?partId=${partId}`;
    }

    $searchInput.on('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const query = $(this).val();
            clearTimeout(debounceTimer);
            searchParts(query, function (parts) {
                if (parts && parts.length > 0) {
                    navigateToPart(parts[0].id || parts[0].item_id);
                }
            });
        }
    });

    $results.on('click', '.search-item', function () {
        const partId = $(this).data('id');
        navigateToPart(partId);
    });

    // ==========================================
    // DYNAMIC HOME PAGE FEATURED BESTSELLERS
    // ==========================================
    function loadFeaturedBestsellers() {
        const $featuredGrid = $('#featuredPartsGrid');
        if (!$featuredGrid.length) return;

        api.get('/api/v1/items')
            .then(({ data }) => {
                // Handle different array structures from API response layers smoothly
                const itemsList = data.items || data.rows || data || [];
                
                if (!itemsList.length) {
                    $featuredGrid.html('<div class="catalog-empty" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No live parts available at this time.</div>');
                    return;
                }

                // Take the top 4 items to display as Bestsellers
                const topParts = itemsList.slice(0, 4);

                const gridHtml = topParts.map((item, index) => {
                    // Normalize standard column variations across backend iterations
                    const itemId = item.id || item.item_id;
                    const itemName = item.name || item.description || 'Unnamed Component';
                    const itemPrice = item.sell_price ?? item.price ?? 0;

                    // Format image location safely (relative, same-origin, URI-encoded)
                    const imgUrl = resolveImageUrl(item.img_url || item.img_path);

                    // Give badges look variations depending on position index loop 
                    const tags = ['Bestseller', 'Hot Drop', 'Premium', 'Top Rated'];
                    const currentTag = tags[index % tags.length];

                    return `
                        <article class="product-display-card">
                          <span class="status-badge active bestseller-drop">${currentTag}</span>
                          <div class="img-container product-card-img-link" data-item-id="${itemId}" style="cursor: pointer;">
                            <img src="${imgUrl}" alt="${itemName}" class="product-img" loading="lazy" onerror="this.onerror=null;this.src='/img/placeholder-part.png';">
                          </div>
                          <div class="product-info">
                            <h3 class="product-card-name" style="margin-bottom: 8px; font-size: 1.1rem; font-weight: 600;">${itemName}</h3>
                            <div class="product-meta" style="display: flex; justify-content: space-between; align-items: center;">
                              <span class="part-price" style="color: var(--accent-violet); font-weight: 700;">₱ ${Number(itemPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              <span class="stock-indicator ${item.quantity > 0 ? 'in-stock' : 'low-stock'}">
                                ${item.quantity > 0 ? 'Available' : 'Out of Stock'}
                              </span>
                            </div>
                            <div class="featured-card-actions" style="display: flex; gap: 8px; margin-top: 16px;">
                              <button class="btn add-to-cart-btn" type="button" 
                                data-item-id="${itemId}" data-name="${itemName}" data-price="${itemPrice}" 
                                ${item.quantity <= 0 ? 'disabled' : ''} style="flex: 1; padding: 8px;">
                                ${item.quantity > 0 ? 'Add To Build' : 'Sold Out'}
                              </button>
                              <button class="btn secondary view-details-btn" data-item-id="${itemId}" type="button" style="padding: 8px 14px;">
                                Details
                              </button>
                            </div>
                          </div>
                        </article>
                    `;
                }).join('');

                $featuredGrid.html(gridHtml);
            })
            .catch(error => {
                console.error('Failed to load real bestselling parts:', error);
                $featuredGrid.html('<div class="catalog-empty" style="grid-column: 1/-1; text-align: center; color: #ff4a4a;">Failed to load featured inventory pipeline.</div>');
            });
    }

    // Standard fallback backup grid generator for legacy #items anchor if loaded anywhere else
    if ($('#items').length) {
        api.get('/api/v1/items')
            .then(({ data }) => {
                const rows = data.rows || data.items || data || [];
                const $items = $('#items');
                $items.empty();

                rows.forEach((value, key) => {
                    if (key % 4 === 0) {
                        const row = $('<div class="row"></div>');
                        $items.append(row);
                    }
                    
                    const id = value.item_id || value.id;
                    const desc = value.description || value.name;
                    const imgUrl = resolveImageUrl(value.img_url || value.img_path);

                    const item = $(
                        `<div class="col-md-3 mb-4">
                            <div class="card h-100">
                                <img src="${imgUrl}" class="card-img-top" alt="${desc}" onerror="this.onerror=null;this.src='/img/placeholder-part.png';">
                                <div class="card-body">
                                    <h5 class="card-title">${desc}</h5>
                                    <p class="card-text">₱ ${value.sell_price}</p>
                                    <p class="card-text">
                                        <small class="text-muted">Stock: ${value.quantity ?? 0}</small>
                                    </p>
                                    <div style="display:flex; gap:6px;">
                                        <button class="btn btn-primary add-to-cart-btn" data-item-id="${id}" data-name="${desc}" data-price="${value.sell_price}" style="flex:1;">Add</button>
                                        <button class="btn btn-outline-secondary view-details-btn" data-item-id="${id}">Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>`
                    );
                    $items.children('.row').last().append(item);
                });
            });
    }

    // Execute home layout pipeline generators
    loadFeaturedBestsellers();

    // Event handler for quick adding inside home cards
    $(document).on('click', '.add-to-cart-btn', function (event) {
        event.preventDefault();
        if (!window.Cart || typeof window.Cart.addItem !== 'function') return;

        const $btn = $(this);
        const item = {
            item_id: $btn.data('item-id'),
            name: $btn.data('name'),
            price: parseFloat($btn.data('price')) || 0,
            sell_price: parseFloat($btn.data('price')) || 0,
            quantity: 1
        };

        window.Cart.addItem(item);
    });
});