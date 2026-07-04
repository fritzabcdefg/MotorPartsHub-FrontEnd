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
                <p class="lead">Price: ₱ ${Number(item.price).toFixed(2)}</p>
                <p><strong>Category:</strong> ${item.category || 'Uncategorized'}</p>
                <p><strong>Stock:</strong> ${item.quantity || 0}</p>
                <p><strong>Part ID:</strong> ${item.id}</p>
                <p>${item.description || 'No description available.'}</p>
                <div class="item-actions">
                    <a href="item.html" class="btn secondary">Browse more parts</a>
                </div>
            </div>
        `;
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
                    <p class="lead">₱ ${Number(part.price).toFixed(2)}</p>
                    <p><strong>Category:</strong> ${part.category || 'Uncategorized'}</p>
                    <p><strong>Stock:</strong> ${part.quantity || 0}</p>
                    <p>${part.description || 'No description available.'}</p>
                    <a href="item.html?partId=${part.id}" class="btn">View details</a>
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <section class="parts-list">
                <h2>Available Motor Parts</h2>
                <div class="parts-grid">${html}</div>
            </section>
        `;
    }

    async function loadItem() {
        const partId = getQueryParam('partId');
        if (!partId) {
            try {
                const response = await fetch('http://localhost:4000/parts');
                if (!response.ok) {
                    renderPartList([]);
                    return;
                }
                const parts = await response.json();
                renderPartList(parts);
            } catch (error) {
                console.error('Failed to load parts', error);
                renderPartList([]);
            }
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/parts/${encodeURIComponent(partId)}`);
            if (!response.ok) {
                renderItem(null);
                return;
            }
            const item = await response.json();
            renderItem(item);
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
