// Catalog + item detail modal script
(function () {
    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function money(n) {
        return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function imgSrc(item) {
        return item.img_url || (item.images && item.images[0] && item.images[0].url) || '/img/placeholder-part.png';
    }

    function attachAddToCart(container) {
        container.querySelectorAll('.add-to-cart-quick, .add-to-cart-modal').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
                const itemName = this.dataset.name;
                const itemPrice = parseFloat(this.dataset.price);
                Cart.addItem({
                    item_id: itemId,
                    name: itemName || 'Item',
                    price: itemPrice,
                    sell_price: itemPrice,
                    quantity: 1
                });
                showAddedToast(this, itemName);
            });
        });
    }

    function showAddedToast(btn, name) {
        let t = document.getElementById('catalogToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'catalogToast';
            t.className = 'catalog-toast';
            document.body.appendChild(t);
        }
        t.textContent = `Added "${name || 'item'}" to cart`;
        t.classList.add('show');
        clearTimeout(t._timer);
        t._timer = setTimeout(() => t.classList.remove('show'), 2000);
    }

    function starString(rating) {
        const r = Math.round(rating || 0);
        return '★'.repeat(r) + '☆'.repeat(5 - r);
    }

    function reviewDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function renderReviewsSection(data) {
        const reviews = (data && data.reviews) || [];
        const avg = (data && data.average_rating) || 0;
        const count = (data && data.count) || 0;

        if (!count) {
            return `
                <div class="item-reviews-section">
                    <div class="item-reviews-heading"><h3>Reviews</h3></div>
                    <p class="item-reviews-empty">No reviews yet for this part.</p>
                </div>
            `;
        }

        return `
            <div class="item-reviews-section">
                <div class="item-reviews-heading">
                    <h3>Reviews (${count})</h3>
                    <span class="item-reviews-avg">${avg.toFixed(1)} / 5 average</span>
                </div>
                ${reviews.map(r => `
                    <div class="review-item">
                        <div class="review-stars">${starString(r.rating)}</div>
                        <p class="review-comment">"${(r.comment || '').replace(/</g, '&lt;')}"</p>
                        <div class="review-meta">— ${r.user_name || 'Anonymous'}, ${reviewDate(r.created_at)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ==========================================
    // ITEM DETAIL MODAL
    // ==========================================
    const overlay = document.getElementById('itemModalOverlay');
    const modalBody = document.getElementById('itemModalBody');
    const closeBtn = document.getElementById('itemModalClose');

    function renderItemModal(item, reviewsData) {
        const targetBody = document.getElementById('itemModalBody');
        if (!targetBody) return;

        if (!item) {
            targetBody.innerHTML = `
                <div class="item-modal-error">
                    <div class="error-icon">⚠️</div>
                    <h2>Item not found</h2>
                    <p>The requested part could not be loaded.</p>
                </div>
            `;
            return;
        }

        const price = item.sell_price ?? item.price ?? 0;
        const gallery = (item.images && item.images.length ? item.images.map(i => i.url) : [imgSrc(item)]);

        targetBody.innerHTML = `
            <div class="item-detail-card">
                <div class="item-detail-gallery">
                    <div class="item-detail-main-img">
                        <img id="modalMainImg" src="${gallery[0]}" alt="${item.name}">
                    </div>
                    ${gallery.length > 1 ? `
                    <div class="item-detail-thumbs">
                        ${gallery.map((src, i) => `
                            <div class="thumb-wrapper">
                                <img class="thumb${i === 0 ? ' active' : ''}" data-src="${src}" src="${src}" alt="thumb ${i + 1}">
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>

                <div class="item-detail-info">
                    <div class="item-info-meta">
                        <span class="badge-tag">${categoryNameFor(item)}</span>
                        <div class="item-detail-stock ${item.quantity > 0 ? 'in-stock' : 'out-stock'}">
                            <span class="status-dot"></span>
                            <span class="status-text">${item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}</span>
                        </div>
                    </div>

                    <h1 class="item-title">${item.name}</h1>
                    <p class="item-detail-price">&#8369; ${money(price)}</p>
                    
                    <div class="modal-separator"></div>
                    
                    <div class="item-desc-container">
                        <h4 class="section-micro-title">Specifications & Description</h4>
                        <p class="item-detail-desc">${item.description || 'No additional technical descriptions available for this component.'}</p>
                    </div>
                    
                    <div class="item-actions">
                        <button class="btn add-to-cart-modal"
                            data-item-id="${item.id}" data-name="${item.name}" data-price="${price}"
                            ${item.quantity <= 0 ? 'disabled' : ''}>
                            <span class="btn-content-wrapper">
                                <svg class="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                ${item.quantity > 0 ? 'Add to Shopping Cart' : 'Out of Stock'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            ${renderReviewsSection(reviewsData)}
        `;

        const thumbs = targetBody.querySelectorAll('.thumb');
        const mainImg = document.getElementById('modalMainImg');
        thumbs.forEach(t => {
            t.addEventListener('click', () => {
                mainImg.src = t.dataset.src;
                thumbs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
            });
        });

        attachAddToCart(targetBody);
    }

    function openModal() {
        const targetOverlay = document.getElementById('itemModalOverlay');
        if (!targetOverlay) return;
        targetOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const targetOverlay = document.getElementById('itemModalOverlay');
        if (!targetOverlay) return;
        targetOverlay.classList.remove('open');
        document.body.style.overflow = '';
        const url = new URL(window.location);
        url.searchParams.delete('partId');
        window.history.pushState({}, '', url);
    }

    async function openItemModal(partId) {
        const targetOverlay = document.getElementById('itemModalOverlay');
        const targetBody = document.getElementById('itemModalBody');
        if (!targetOverlay || !targetBody) return;
        
        targetBody.innerHTML = '<div class="item-modal-loading">Loading part details...</div>';
        openModal();

        const url = new URL(window.location);
        url.searchParams.set('partId', partId);
        window.history.pushState({}, '', url);

        try {
            const [itemRes, reviewsRes] = await Promise.all([
                api.get(`/api/v1/items/${encodeURIComponent(partId)}`),
                api.get(`/api/v1/items/${encodeURIComponent(partId)}/reviews`).catch(() => ({ data: { reviews: [], count: 0, average_rating: 0 } }))
            ]);
            renderItemModal(itemRes.data.item || itemRes.data, reviewsRes.data);
        } catch (error) {
            console.error('Failed to load item', error);
            renderItemModal(null, null);
        }
    }

    // Bind event listeners using global delegation or dynamic checks
    document.addEventListener('click', (e) => {
        if (e.target.closest('#itemModalClose') || (e.target === document.getElementById('itemModalOverlay'))) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        const targetOverlay = document.getElementById('itemModalOverlay');
        if (e.key === 'Escape' && targetOverlay && targetOverlay.classList.contains('open')) closeModal();
    });

    // ==========================================
    // CATALOG PAGE (search + filter + sort + grid)
    // ==========================================
    let allItems = [];
    let allCategories = [];
    let selectedCategoryIds = new Set(['all']);

    function renderCategoryFilters() {
        const list = document.getElementById('categoryFilterList');
        if (!list) return;

        const extra = allCategories.map(cat => `
            <label class="filter-item">
                <input type="checkbox" value="${cat.category_id}">
                <span>${cat.name}</span>
            </label>
        `).join('');
        list.insertAdjacentHTML('beforeend', extra);

        list.addEventListener('change', (e) => {
            const target = e.target;
            if (!target.matches('input[type="checkbox"]')) return;

            if (target.value === 'all') {
                if (target.checked) {
                    list.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (cb.value !== 'all') cb.checked = false; });
                    selectedCategoryIds = new Set(['all']);
                } else {
                    target.checked = true;
                }
            } else {
                list.querySelector('input[value="all"]').checked = false;
                const checked = Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                selectedCategoryIds = checked.length ? new Set(checked) : new Set(['all']);
                if (selectedCategoryIds.has('all')) list.querySelector('input[value="all"]').checked = true;
            }
            renderGrid();
        });
    }

    function categoryNameFor(item) {
        if (item.category_name) return item.category_name;
        const match = allCategories.find(c => c.category_id === item.category_id);
        return match ? match.name : 'Uncategorized';
    }

    function currentFilters() {
        const search = (document.getElementById('catalogSearch')?.value || '').trim().toLowerCase();
        const sort = document.getElementById('catalogSort')?.value || 'default';
        const inStockOnly = document.getElementById('inStockOnly')?.checked;
        return { search, sort, inStockOnly };
    }

    function renderGrid() {
        const grid = document.getElementById('catalogGrid');
        const resultCount = document.getElementById('resultCount');
        if (!grid) return;

        const { search, sort, inStockOnly } = currentFilters();

        let filtered = allItems.filter(item => {
            if (!selectedCategoryIds.has('all') && !selectedCategoryIds.has(String(item.category_id))) return false;
            if (inStockOnly && !(item.quantity > 0)) return false;
            if (search && !(item.name || '').toLowerCase().includes(search)) return false;
            return true;
        });

        if (sort === 'name-asc') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (sort === 'price-asc') filtered.sort((a, b) => (a.sell_price ?? 0) - (b.sell_price ?? 0));
        if (sort === 'price-desc') filtered.sort((a, b) => (b.sell_price ?? 0) - (a.sell_price ?? 0));

        resultCount.textContent = `${filtered.length} part${filtered.length === 1 ? '' : 's'} found`;

        if (!filtered.length) {
            grid.innerHTML = '<div class="catalog-empty"><h3>No parts match your search</h3><p>Try a different keyword or clear your filters.</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(item => `
            <div class="product-card">
                <div class="product-card-img-link" data-item-id="${item.id}" role="button" tabindex="0">
                    <div class="product-card-img">
                        <img src="${imgSrc(item)}" alt="${item.name}" loading="lazy">
                        ${item.quantity <= 0 ? '<span class="status-badge inactive out-of-stock-flag">Out of Stock</span>' : ''}
                    </div>
                </div>
                <div class="product-card-body">
                    <span class="product-card-category">${categoryNameFor(item)}</span>
                    <h3 class="product-card-name">${item.name}</h3>
                    <p class="product-card-price">&#8369; ${money(item.sell_price)}</p>
                    <div class="product-card-actions">
                        <button class="btn add-to-cart-quick"
                            data-item-id="${item.id}" data-name="${item.name}" data-price="${item.sell_price}"
                            ${item.quantity <= 0 ? 'disabled' : ''}>
                            ${item.quantity <= 0 ? 'Unavailable' : 'Add to Cart'}
                        </button>
                        <button class="btn secondary view-details-btn" data-item-id="${item.id}">View Details</button>
                    </div>
                </div>
            </div>
        `).join('');

        attachAddToCart(grid);
    }

    async function loadCatalog() {
        const grid = document.getElementById('catalogGrid');
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get('/api/v1/items'),
                api.get('/api/categories')
            ]);
            allItems = itemsRes.data.items || itemsRes.data.rows || itemsRes.data || [];
            allCategories = (catsRes.data.categories || []).filter(c => !c.is_deleted);
            
            renderCategoryFilters();

            // 1. Check incoming URL for dynamic homepage categories (?cat=ID)
            const catParam = getQueryParam('cat');
            if (catParam) {
                selectedCategoryIds = new Set([catParam]);
                const list = document.getElementById('categoryFilterList');
                if (list) {
                    const allCheckbox = list.querySelector('input[value="all"]');
                    if (allCheckbox) allCheckbox.checked = false;
                    
                    const targetedCheckbox = list.querySelector(`input[value="${catParam}"]`);
                    if (targetedCheckbox) targetedCheckbox.checked = true;
                }
            }

            // 2. Check incoming URL for navigation bar search keywords (?search=query)
            const searchParam = getQueryParam('search');
            if (searchParam) {
                const searchField = document.getElementById('catalogSearch');
                if (searchField) searchField.value = searchParam;
            }

            renderGrid();

            // Deep-link matching directly to unique item IDs
            const partId = getQueryParam('partId');
            if (partId) openItemModal(partId);
        } catch (error) {
            console.error('Failed to load catalog', error);
            if (grid) grid.innerHTML = '<div class="catalog-empty"><h3>Unable to load parts</h3><p>Please try again shortly.</p></div>';
        }
    }

    function initCatalogControls() {
        document.getElementById('catalogSearch')?.addEventListener('input', renderGrid);
        document.getElementById('catalogSort')?.addEventListener('change', renderGrid);
        document.getElementById('inStockOnly')?.addEventListener('change', renderGrid);
    }

    // ==========================================
    // ENTRY POINT
    // ==========================================
    function init() {
        // Universal click delegation for "View Details" (Works on Home and Catalog pages seamlessly)
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-details-btn, .product-card-img-link');
            if (viewBtn) {
                e.preventDefault();
                const partId = viewBtn.dataset.itemId;
                if (partId) openItemModal(partId);
            }
        });

        if (document.getElementById('catalogGrid')) {
            initCatalogControls();
            loadCatalog();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();