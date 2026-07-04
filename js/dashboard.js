// Admin Dashboard with user management
(function () {
    const API_BASE = 'http://localhost:4000/api/v1';
    const DASHBOARD_SECTIONS = ['admin-users', 'admin-inventory', 'admin-orders'];

    function showDashboardSection(sectionId) {
        DASHBOARD_SECTIONS.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = id === sectionId ? 'block' : 'none';
            }
        });
    }

    function updateDashboardViewFromHash() {
        const hash = window.location.hash.replace('#', '');
        const target = hash === 'inventory' ? 'admin-inventory' : hash === 'orders' ? 'admin-orders' : 'admin-users';
        showDashboardSection(target);
    }

    function init() {
        User.initSession();

        // Check if user is logged in and is admin
        if (!User.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        const currentUser = User.profile();
        if (currentUser.role !== 'admin') {
            alert('Access denied. Admin role required.');
            window.location.href = 'home.html';
            return;
        }

        window.addEventListener('hashchange', updateDashboardViewFromHash);
        window.updateDashboardViewFromHash = updateDashboardViewFromHash;
        loadUsers();
        Inventory.init();
        Orders.init();
    }

    function loadUsers() {
        const token = User.getToken();
        
        $.ajax({
            url: `${API_BASE}/users`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .done(function(response) {
            renderUsersTable(response.users);
        })
        .fail(function(xhr) {
            alert('Failed to load users: ' + (xhr.responseJSON?.message || 'Unknown error'));
            console.error(xhr);
        });
    }

    function renderUsersTable(users) {
        const html = `
            <section id="admin-users" class="card admin-section">
                <h2>User Management</h2>
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

        $('#dashboardRoot').html(html);

        // Initialize DataTable if available
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
        // Handle role change
        $('.role-select').on('change', function() {
            const userId = $(this).data('user-id');
            const newRole = $(this).val();
            const currentRole = $(this).data('current-role');

            if (newRole === currentRole) return;

            updateUserRole(userId, newRole);
        });

        // Handle deactivate
        $('.btn-deactivate').on('click', function() {
            const email = $(this).data('email');
            if (confirm('Are you sure you want to deactivate this user?')) {
                deactivateUser(email);
            }
        });
    }

    function updateUserRole(userId, newRole) {
        const token = User.getToken();

        $.ajax({
            url: `${API_BASE}/users/${userId}/role`,
            type: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ role: newRole })
        })
        .done(function(response) {
            alert('User role updated successfully.');
            loadUsers();
        })
        .fail(function(xhr) {
            alert('Failed to update role: ' + (xhr.responseJSON?.message || 'Unknown error'));
            loadUsers();
        });
    }

    function deactivateUser(email) {
        const token = User.getToken();

        $.ajax({
            url: `${API_BASE}/deactivate`,
            type: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ email })
        })
        .done(function(response) {
            alert('User deactivated successfully.');
            loadUsers();
        })
        .fail(function(xhr) {
            alert('Failed to deactivate user: ' + (xhr.responseJSON?.message || 'Unknown error'));
        });
    }

    window.Dashboard = { init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
