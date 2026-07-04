// Inventory module for admin dashboard
(function () {
    let itemsCache = [];
    let editingItemId = null;

    function init() {
        loadItems();
    }

    function loadItems() {
        const token = User.getToken();

        api.get('/api/v1/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const rawItems = response.data.rows || response.data.items || response.data || [];
            itemsCache = Array.isArray(rawItems) ? rawItems.filter(isVisibleItem) : [];
            renderInventorySection(itemsCache);
        })
        .catch(error => {
            console.error('Failed to load items:', error.response?.data || error.message);
            itemsCache = [];
            renderInventorySection([]);
        });
    }

    function isVisibleItem(item) {
        return item && item.active !== false && item.is_deleted !== true && item.deleted !== true && !item.deleted_at;
    }

    function renderInventorySection(items) {
        $('#admin-inventory').remove();

        const html = `
            <section id="admin-inventory" class="card admin-section" style="display:none;">
                <h2>Inventory Management</h2>
                <p class="muted">Create, edit, and soft-delete inventory items with pop-up forms.</p>
                <div class="form-actions">
                    <button type="button" class="btn" id="openCreateItemModalBtn">Add Item</button>
                </div>
                <table id="inventoryItemsTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length ? items.map(item => `
                            <tr>
                                <td>${item.item_id || item.id}</td>
                                <td>${item.name || 'Untitled'}</td>
                                <td>${item.description || ''}</td>
                                <td>₱ ${Number(item.sell_price || item.price || 0).toFixed(2)}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${item.img_path ? `<img src="${toImageUrl(item.img_path)}" style="max-width:60px;max-height:40px;" />` : '—'}</td>
                                <td>
                                    <button class="btn-edit-item" data-item-id="${item.item_id || item.id}">Edit</button>
                                    <button class="btn-delete-item" data-item-id="${item.item_id || item.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="7" class="muted">No items yet. Add one to begin.</td></tr>`}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#inventoryItemsTable').DataTable({
                destroy: true,
                paging: true,
                pageLength: 10,
                searching: true,
                ordering: true
            });
        }

        attachInventoryHandlers();
        if (window.updateDashboardViewFromHash) {
            window.updateDashboardViewFromHash();
        }
    }

    function attachInventoryHandlers() {
        $('#openCreateItemModalBtn').off('click').on('click', function () {
            openItemModal();
        });

        $('.btn-edit-item').off('click').on('click', function () {
            const itemId = $(this).data('item-id');
            const item = itemsCache.find(entry => (entry.item_id || entry.id) == itemId);
            if (item) {
                openItemModal(item);
            }
        });

        $('.btn-delete-item').off('click').on('click', function () {
            const itemId = $(this).data('item-id');
            if (!confirm('Soft delete this item? It will be hidden from the inventory list.')) return;
            softDeleteItem(itemId);
        });
    }

    function openItemModal(item) {
        if (!$('#itemModalOverlay').length) {
            $('body').append(`
                <div id="itemModalOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2000;align-items:center;justify-content:center;">
                    <div style="background:#fff;width:min(560px,92vw);padding:20px;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,0.25);">
                        <h3 id="itemModalTitle">Add Item</h3>
                        <form id="itemModalForm">
                            <input type="hidden" id="modalItemId" name="id" value="">
                            <div style="display:grid;gap:10px;">
                                <label>Name<input id="modalItemName" name="name" type="text" required style="width:100%;padding:8px;"></label>
                                <label>Description<input id="modalItemDescription" name="description" type="text" style="width:100%;padding:8px;"></label>
                                <label>Price<input id="modalItemPrice" name="sell_price" type="number" step="0.01" required style="width:100%;padding:8px;"></label>
                                <label>Quantity<input id="modalItemQuantity" name="quantity" type="number" min="0" style="width:100%;padding:8px;"></label>
                                <label>Image<input id="modalItemImage" name="image" type="file" accept="image/*" style="width:100%;padding:8px;"></label>
                                <div id="modalExistingImageInfo" class="muted"></div>
                            </div>
                            <div class="form-actions" style="margin-top:15px;">
                                <button type="submit" class="btn">Save</button>
                                <button type="button" class="btn secondary" id="modalCancelBtn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);

            $('#itemModalOverlay').on('click', function (event) {
                if (event.target.id === 'itemModalOverlay') {
                    closeItemModal();
                }
            });

            $('#modalCancelBtn').on('click', closeItemModal);

            $('#itemModalForm').off('submit').on('submit', function (event) {
                event.preventDefault();
                saveItemFromModal();
            });
        }

        editingItemId = item ? (item.item_id || item.id) : null;
        $('#modalItemId').val(editingItemId || '');
        $('#modalItemName').val(item?.name || '');
        $('#modalItemDescription').val(item?.description || '');
        $('#modalItemPrice').val(item?.sell_price || item?.price || '');
        $('#modalItemQuantity').val(item?.quantity || 0);
        $('#modalExistingImageInfo').text(item?.img_path ? `Current image: ${item.img_path}` : '');
        $('#itemModalTitle').text(editingItemId ? 'Edit Item' : 'Add Item');
        $('#itemModalOverlay').css('display', 'flex');
        $('#modalItemName').focus();
    }

    function closeItemModal() {
        $('#itemModalOverlay').hide();
        $('#itemModalForm')[0].reset();
        editingItemId = null;
    }

    function saveItemFromModal() {
        const token = User.getToken();
        const formData = new FormData($('#itemModalForm')[0]);
        const price = $('#modalItemPrice').val();
        formData.set('price', price);
        formData.set('sell_price', price);
        const method = editingItemId ? 'put' : 'post';
        const url = editingItemId ? `/api/v1/items/${editingItemId}` : '/api/v1/items';

        api.request({
            method,
            url,
            data: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => {
            closeItemModal();
            alert(editingItemId ? 'Item updated successfully.' : 'Item created successfully.');
            loadItems();
        })
        .catch(error => {
            alert('Failed to save item: ' + (error.response?.data?.message || error.message || 'Unknown error'));
        });
    }

    function softDeleteItem(itemId) {
        const token = User.getToken();
        const payload = {
            active: false,
            is_deleted: true,
            deleted_at: new Date().toISOString()
        };

        api.put(`/api/v1/items/${itemId}`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => {
            itemsCache = itemsCache.filter(item => (item.item_id || item.id) != itemId);
            renderInventorySection(itemsCache);
            alert('Item soft deleted successfully.');
        })
        .catch(error => {
            api.delete(`/api/v1/items/${itemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(() => {
                itemsCache = itemsCache.filter(item => (item.item_id || item.id) != itemId);
                renderInventorySection(itemsCache);
                alert('Item deleted successfully.');
            })
            .catch(() => {
                alert('Failed to delete item: ' + (error.response?.data?.message || error.message || 'Unknown error'));
            });
        });
    }

    function toImageUrl(path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        const cleaned = path.replace(/^\/+/, '');
        return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned}`;
    }

    window.Inventory = {
        init,
        loadItems
    };
})();