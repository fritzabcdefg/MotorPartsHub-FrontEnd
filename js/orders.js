// Orders management view for the admin dashboard
(function () {
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
            const items = Array.isArray(rawItems) ? rawItems.filter(item => item && item.active !== false && item.is_deleted !== true && item.deleted !== true) : [];
            renderOrdersSection(items);
        })
        .catch(error => {
            console.error('Failed to load orders data:', error.response?.data || error.message);
            renderOrdersSection([]);
        });
    }

    function renderOrdersSection(items) {
        $('#admin-orders').remove();

        const html = `
            <section id="admin-orders" class="card admin-section" style="display:none;">
                <h2>Orders Management</h2>
                <p class="muted">This view shows the current catalog items that can be used for order fulfillment.</p>
                <table id="ordersTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length ? items.map(item => `
                            <tr>
                                <td>${item.item_id || item.id}</td>
                                <td>${item.name || 'Untitled'}</td>
                                <td>₱ ${Number(item.sell_price || item.price || 0).toFixed(2)}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${(item.quantity || 0) > 0 ? 'Available' : 'Out of Stock'}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" class="muted">No items available yet.</td></tr>`}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#ordersTable').DataTable({
                destroy: true,
                paging: true,
                pageLength: 10,
                searching: true,
                ordering: true
            });
        }

        if (window.updateDashboardViewFromHash) {
            window.updateDashboardViewFromHash();
        }
    }

    window.Orders = {
        init
    };
})();