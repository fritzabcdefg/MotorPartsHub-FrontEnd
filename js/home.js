$(document).ready(function () {
    const $searchInput = $('#partSearch');
    const $results = $('#searchResults');
    let debounceTimer = null;
    const api = window.api;
    const imageBase = 'http://localhost:4000';

    function clearResults() {
        $results.empty();
    }

    function renderResults(parts) {
        if (!parts || !parts.length) {
            $results.html('<div class="search-empty">No parts found.</div>');
            return;
        }

        const html = parts.map(part => `
            <div class="search-item" data-id="${part.id}" data-name="${part.name}">
                <span>${part.name}</span>
                <strong>₱ ${Number(part.price).toFixed(2)}</strong>
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
        window.location.href = `/item.html?partId=${partId}`;
    }

    $searchInput.on('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const query = $(this).val();
            clearTimeout(debounceTimer);
            searchParts(query, function (parts) {
                if (parts && parts.length > 0) {
                    navigateToPart(parts[0].id);
                }
            });
        }
    });

    $results.on('click', '.search-item', function () {
        const partId = $(this).data('id');
        navigateToPart(partId);
    });

    if ($('#items').length) {
        api.get('/api/v1/items')
            .then(({ data }) => {
                const rows = data.rows || [];
                const $items = $('#items');
                $items.empty();

                rows.forEach((value, key) => {
                    if (key % 4 === 0) {
                        const row = $('<div class="row"></div>');
                        $items.append(row);
                    }

                    const item = $(
                        `<div class="col-md-3 mb-4">
                            <div class="card h-100">
                                <img src="${imageBase}${value.img_path}" class="card-img-top" alt="${value.description}">
                                <div class="card-body">
                                    <h5 class="card-title">${value.description}</h5>
                                    <p class="card-text">₱ ${value.sell_price}</p>
                                    <p class="card-text">
                                        <small class="text-muted">Stock: ${value.quantity ?? 0}</small>
                                    </p>
                                    <a href="/item.html?partId=${value.item_id}" class="btn btn-primary">Details</a>
                                </div>
                            </div>
                        </div>`
                    );

                    $items.children('.row').last().append(item);
                });
            })
            .catch(error => {
                console.error('Failed to load items', error);
            });
    }
});