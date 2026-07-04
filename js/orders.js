// Orders module for admin dashboard
(function () {
    const API_BASE = 'http://localhost:4000/api/v1';

    function init() {
        loadItems();
    }

    function loadItems() {
        const token = User.getToken();

        $.ajax({
            url: `${API_BASE}/items`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .done(function(response) {
            const items = response.rows || response.items || [];
            renderItemsSection(items);
        })
        .fail(function(xhr) {
            console.error('Failed to load items:', xhr.responseJSON || xhr.responseText || xhr.statusText);
        });
    }

    function renderItemsSection(items) {
        const html = `
            <section id="admin-orders" class="card admin-section" style="display:none;">
                <h2>Orders Management</h2>
                <p class="muted">Review and manage storefront catalog items here. Actual order records can be added later.</p>
                <form id="itemForm" class="part-form">
                    <input type="hidden" id="itemId" value="">
                    <div class="form-row">
                        <label>Name<span class="required">*</span><input id="itemName" type="text" required></label>
                        <label>Description<input id="itemDescription" type="text"></label>
                        <label>Price<span class="required">*</span><input id="itemPrice" type="number" step="0.01" required></label>
                        <label>Quantity<input id="itemQuantity" type="number" min="0"></label>
                        <label>Image<input id="itemImage" type="file" accept="image/*"></label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Save Item</button>
                        <button type="button" class="btn secondary" id="cancelItemBtn">Cancel</button>
                    </div>
                    <div id="existingItemImageInfo" class="muted"></div>
                </form>
                <table id="itemsTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.item_id || item.id}</td>
                                <td>${item.description || item.name}</td>
                                <td>₱ ${Number(item.sell_price || item.price || 0).toFixed(2)}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${item.img_path ? `<img src="${item.img_path}" style="max-width:60px;max-height:40px;"/>` : ''}</td>
                                <td>
                                    <button class="btn-edit-item" data-item-id="${item.item_id || item.id}">Edit</button>
                                    <button class="btn-delete-item" data-item-id="${item.item_id || item.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#itemsTable').DataTable({
                destroy: true,
                paging: true,
                pageLength: 10,
                searching: true,
                ordering: true
            });
        }

        attachItemHandlers();
        if (window.updateDashboardViewFromHash) {
            window.updateDashboardViewFromHash();
        }
    }

    function attachItemHandlers() {
        $('#itemForm').off('submit').on('submit', function(event) {
            event.preventDefault();
            const token = User.getToken();
            const itemId = $('#itemId').val();
            const formData = new FormData(this);
            const method = itemId ? 'PUT' : 'POST';
            const url = itemId ? `${API_BASE}/items/${itemId}` : `${API_BASE}/items`;

            $.ajax({
                url,
                type: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function() {
                alert('Item saved successfully.');
                resetItemForm();
                loadItems();
            })
            .fail(function(xhr) {
                alert('Failed to save item: ' + (xhr.responseJSON?.message || 'Unknown error'));
            });
        });

        $('#cancelItemBtn').off('click').on('click', function(){
            $('#itemId').val(''); $('#itemName').val(''); $('#itemDescription').val(''); $('#itemPrice').val(''); $('#itemQuantity').val(''); $('#itemImage').val(''); $('#existingItemImageInfo').text('');
        });

        $('.btn-edit-item').off('click').on('click', function() {
            const itemId = $(this).data('item-id');
            const token = User.getToken();
            $.ajax({ url: `${API_BASE}/items/${itemId}`, type: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
            .done(function(item) {
                $('#itemId').val(item.id);
                $('#itemName').val(item.name);
                $('#itemDescription').val(item.description || '');
                $('#itemPrice').val(item.sell_price || item.price || 0);
                $('#itemQuantity').val(item.quantity || 0);
                $('#existingItemImageInfo').text(item.img_path ? `Current image: ${item.img_path}` : 'No image');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            })
            .fail(function() { alert('Unable to fetch item details.'); });
        });

        $('.btn-delete-item').off('click').on('click', function() {
            const itemId = $(this).data('item-id');
            if (!confirm('Delete this item?')) return;
            const token = User.getToken();
            $.ajax({ url: `${API_BASE}/items/${itemId}`, type: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
            .done(function() { alert('Item deleted.'); loadItems(); })
            .fail(function(xhr) { alert('Failed to delete item: ' + (xhr.responseJSON?.message || 'Unknown error')); });
        });
    }

    function resetItemForm() {
        $('#itemId').val('');
        $('#itemName').val('');
        $('#itemDescription').val('');
        $('#itemPrice').val('');
        $('#itemQuantity').val('');
        $('#itemImage').val('');
        $('#existingItemImageInfo').text('');
    }

    window.Orders = {
        init
    };
})();