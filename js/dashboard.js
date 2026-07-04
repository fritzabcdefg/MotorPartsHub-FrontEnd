// Admin Dashboard with user management
(function () {
    const DASHBOARD_SECTIONS = [
        'admin-users',
        'admin-inventory',
        'admin-orders',
        'admin-reviews',
        'admin-categories'
    ];

    function showDashboardSection(sectionId) {
        const targetEl = document.getElementById(sectionId);
        if (!targetEl) {
            // fallback: keep users visible if target not found
            const usersEl = document.getElementById('admin-users');
            if (usersEl) usersEl.style.display = 'block';
            return;
        }

        DASHBOARD_SECTIONS.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = id === sectionId ? 'block' : 'none';
            }
        });
    }

    function updateDashboardViewFromHash() {
        const hash = window.location.hash.replace('#', '');
        const target = hash || 'admin-users'; // default to users
        console.log("Hash:", window.location.hash);
        showDashboardSection(target);
    }

    function init() {
        User.initSession();

        if (!User.isLoggedIn()) {
            window.location.href = '/login.html';
            return;
        }

        const currentUser = User.profile();
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Access denied. Admin role required.');
            window.location.href = '/home.html';
            return;
        }

        window.addEventListener("hashchange", updateDashboardViewFromHash);
        window.addEventListener("load", updateDashboardViewFromHash);
        window.updateDashboardViewFromHash = updateDashboardViewFromHash;

        loadUsers();
        if (window.Inventory) window.Inventory.init();
        if (window.Orders) window.Orders.init();
        if (window.Reviews) window.Reviews.init();
        if (window.Categories) window.Categories.init();
    }

    function loadUsers() {
        const token = User.getToken();

        api.get('/api/v1/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            renderUsersTable(response.data.users || []);
        })
        .catch(error => {
            console.error('Failed to load users:', error.response?.data || error.message);
            renderUsersTable([], error.response?.data?.message || 'Failed to load users.');
        });
    }

    function renderUsersTable(users, errorMessage = '') {
        const errorBanner = errorMessage ? `<div class="error-banner" style="margin-bottom:16px;padding:12px;border:1px solid #d9534f;background:#f2dede;color:#a94442;border-radius:6px;">${errorMessage}</div>` : '';
        const html = `
            <section id="admin-users" class="card admin-section">
                <h2>User Management</h2>
                ${errorBanner}
                <table id="usersTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td>
                                    <select class="role-select" data-user-id="${user.id}" data-current-role="${user.role}">
                                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <span class="status-badge ${user.active ? 'active' : 'inactive'}">
                                        ${user.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    ${user.active ? `<button class="btn-deactivate" data-email="${user.email}">Deactivate</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;
        const $dashboardRoot = $('#dashboardRoot');
        const $existingUsersSection = $('#admin-users');

        if ($existingUsersSection.length) {
            $existingUsersSection.replaceWith(html);
        } else {
            $dashboardRoot.append(html);
        }

        if ($.fn.DataTable) {
            $('#usersTable').DataTable({
                "destroy": true,
                "paging": true,
                "pageLength": 10,
                "searching": true,
                "ordering": true
            });
        }

        attachEventHandlers();
        updateDashboardViewFromHash();
    }

    function attachEventHandlers() {
        $('.role-select').on('change', function() {
            const userId = $(this).data('user-id');
            const newRole = $(this).val();
            const currentRole = $(this).data('current-role');

            if (newRole === currentRole) return;
            updateUserRole(userId, newRole);
        });

        $('.btn-deactivate').on('click', function() {
            const email = $(this).data('email');
            if (confirm('Are you sure you want to deactivate this user?')) {
                deactivateUser(email);
            }
        });
    }

    function updateUserRole(userId, newRole) {
        const token = User.getToken();

        api.put(`/api/v1/users/${userId}/role`, 
            { role: newRole },
            { headers: { 'Authorization': `Bearer ${token}` } }
        )
        .then(() => {
            alert('User role updated successfully.');
            loadUsers();
        })
        .catch(error => {
            alert('Failed to update role: ' + (error.response?.data?.message || 'Unknown error'));
            loadUsers();
        });
    }

    function deactivateUser(email) {
        const token = User.getToken();

        api.delete('/api/v1/deactivate',
            { 
                data: { email },
                headers: { 'Authorization': `Bearer ${token}` }
            }
        )
        .then(() => {
            alert('User deactivated successfully.');
            loadUsers();
        })
        .catch(error => {
            alert('Failed to deactivate user: ' + (error.response?.data?.message || 'Unknown error'));
            loadUsers();
        });
    }

    window.Dashboard = { init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
