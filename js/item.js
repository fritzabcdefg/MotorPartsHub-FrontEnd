// Item detail page script
(function () {
    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function renderItem(item) {
        const root = document.getElementById('itemRoot');
        if (!root) return;

        if (!item) {
            root.innerHTML = '<div class="card"><h2>Item not found</h2><p>The requested part could not be loaded.</p></div>';
            return;
        }

        root.innerHTML = `
            <div class="card item-detail-card">
                <h1>${item.name}</h1>
                <p class="lead">Price: ₱ ${Number(item.price || item.sell_price || 0).toFixed(2)}</p>
                <p><strong>Category:</strong> ${item.category || 'Uncategorized'}</p>
                <p><strong>Stock:</strong> ${item.quantity || 0}</p>
                <p><strong>Part ID:</strong> ${item.id || item.item_id}</p>
                <p>${item.description || 'No description available.'}</p>
                <div class="item-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                    <button class="btn" id="addToCartBtn" data-item-id="${item.id || item.item_id}" data-name="${item.name}" data-price="${item.price || item.sell_price || 0}">Add to Cart</button>
                    <a href="/item.html" class="btn secondary">Browse more parts</a>
                </div>
            </div>
        `;

        // Attach add-to-cart handler
        const addBtn = document.getElementById('addToCartBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
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
                alert('Added to cart!');
            });
        }
    }

    function renderPartList(parts) {
        const root = document.getElementById('itemRoot');
        if (!root) return;

        if (!parts || !parts.length) {
            root.innerHTML = '<div class="card"><h2>No parts available</h2><p>Please try again later.</p></div>';
            return;
        }

        const html = parts.map(part => `
            <div class="card part-card">
                <div class="part-card-body">
                    <h2>${part.name}</h2>
                    <p class="lead">₱ ${Number(part.price || part.sell_price || 0).toFixed(2)}</p>
                    <p><strong>Category:</strong> ${part.category || 'Uncategorized'}</p>
                    <p><strong>Stock:</strong> ${part.quantity || 0}</p>
                    <p>${part.description || 'No description available.'}</p>
                    <div style="display: flex; gap: 10px; margin-top: 12px;">
                        <button class="btn add-to-cart-quick" data-item-id="${part.id || part.item_id}" data-name="${part.name}" data-price="${part.price || part.sell_price || 0}" style="flex: 1;">Add to Cart</button>
                        <a href="/item.html?partId=${part.id || part.item_id}" class="btn secondary" style="flex: 1; text-align: center;">Details</a>
                    </div>
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <section class="parts-list">
                <h2>Available Motor Parts</h2>
                <div class="parts-grid">${html}</div>
            </section>
        `;

        // Attach quick add-to-cart handlers
        document.querySelectorAll('.add-to-cart-quick').forEach(btn => {
            btn.addEventListener('click', function () {
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
                alert('Added to cart!');
            });
        });
    }

    async function loadItem() {
        const partId = getQueryParam('partId');
        if (!partId) {
            try {
                const { data } = await api.get('/api/v1/items');
                const parts = data.rows || data.items || data || [];
                renderPartList(Array.isArray(parts) ? parts : []);
            } catch (error) {
                console.error('Failed to load parts', error);
                renderPartList([]);
            }
            return;
        }

        try {
            const { data } = await api.get(`/api/v1/items/${encodeURIComponent(partId)}`);
            renderItem(data);
        } catch (error) {
            console.error('Failed to load item', error);
            renderItem(null);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadItem);
    } else {
        loadItem();
    }
})();
