// Categories management for admin dashboard
(function () {
    let categoriesCache = [];
    let editingId = null;

    function init() {
        loadCategories();
    }

    function loadCategories() {
        const token = User.getToken();
        api.get('/api/v1/categories', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(response => {
            const rows = response.data.rows || response.data.categories || response.data || [];
            categoriesCache = Array.isArray(rows) ? rows : [];
            renderCategoriesSection(categoriesCache);
        })
        .catch(error => {
            console.error('Failed to load categories:', error.response?.data || error.message);
            renderCategoriesSection([]);
        });
    }

    function renderCategoriesSection(categories) {
        $('#admin-categories').remove();

        const html = `
            <section id="admin-categories" class="card admin-section" style="display:none;">
                <h2>Categories Management</h2>
                <div class="form-actions"><button class="btn" id="openCreateCategoryBtn">Add Category</button></div>
                <table id="categoriesTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.length ? categories.map(c => `
                            <tr>
                                <td>${c.id || c.category_id}</td>
                                <td>${c.name || '—'}</td>
                                <td>${c.description || ''}</td>
                                <td>
                                    <button class="btn-edit-category" data-id="${c.id || c.category_id}">Edit</button>
                                    <button class="btn-delete-category" data-id="${c.id || c.category_id}">Delete</button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" class="muted">No categories yet.</td></tr>`}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#categoriesTable').DataTable({ destroy: true, paging: true, pageLength: 10, searching: true, ordering: true });
        }

        attachHandlers();
        if (window.updateDashboardViewFromHash) window.updateDashboardViewFromHash();
    }

    function attachHandlers() {
        $('#openCreateCategoryBtn').off('click').on('click', function () { openCategoryModal(); });

        $('.btn-edit-category').off('click').on('click', function () {
            const id = $(this).data('id');
            const cat = categoriesCache.find(c => (c.id || c.category_id) == id);
            if (cat) openCategoryModal(cat);
        });

        $('.btn-delete-category').off('click').on('click', function () {
            const id = $(this).data('id');
            if (!confirm('Delete this category?')) return;
            deleteCategory(id);
        });
    }

    function openCategoryModal(cat) {
        if (!$('#categoryModalOverlay').length) {
            $('body').append(`
                <div id="categoryModalOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2000;align-items:center;justify-content:center;">
                    <div style="background:#fff;width:min(560px,92vw);padding:20px;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,0.25);">
                        <h3 id="categoryModalTitle">Add Category</h3>
                        <form id="categoryModalForm">
                            <input type="hidden" id="modalCategoryId" name="id" value="">
                            <div style="display:grid;gap:10px;">
                                <label>Name<input id="modalCategoryName" name="name" type="text" required style="width:100%;padding:8px;"></label>
                                <label>Description<input id="modalCategoryDescription" name="description" type="text" style="width:100%;padding:8px;"></label>
                            </div>
                            <div class="form-actions" style="margin-top:15px;">
                                <button type="submit" class="btn">Save</button>
                                <button type="button" class="btn secondary" id="categoryModalCancelBtn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);

            $('#categoryModalOverlay').on('click', function (event) { if (event.target.id === 'categoryModalOverlay') closeCategoryModal(); });
            $('#categoryModalCancelBtn').on('click', closeCategoryModal);
            $('#categoryModalForm').off('submit').on('submit', function (e) { e.preventDefault(); saveCategoryFromModal(); });
        }

        editingId = cat ? (cat.id || cat.category_id) : null;
        $('#modalCategoryId').val(editingId || '');
        $('#modalCategoryName').val(cat?.name || '');
        $('#modalCategoryDescription').val(cat?.description || '');
        $('#categoryModalTitle').text(editingId ? 'Edit Category' : 'Add Category');
        $('#categoryModalOverlay').css('display', 'flex');
        $('#modalCategoryName').focus();
    }

    function closeCategoryModal() { $('#categoryModalOverlay').hide(); $('#categoryModalForm')[0].reset(); editingId = null; }

    function saveCategoryFromModal() {
        const token = User.getToken();
        const payload = { name: $('#modalCategoryName').val(), description: $('#modalCategoryDescription').val() };
        const method = editingId ? 'put' : 'post';
        const url = editingId ? `/api/v1/categories/${editingId}` : '/api/v1/categories';

        api.request({ method, url, data: payload, headers: { 'Authorization': `Bearer ${token}` } })
        .then(() => { closeCategoryModal(); loadCategories(); })
        .catch(err => { alert('Failed to save category.'); console.error(err); });
    }

    function deleteCategory(id) {
        const token = User.getToken();
        api.delete(`/api/v1/categories/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(() => { loadCategories(); })
        .catch(err => { alert('Failed to delete category.'); console.error(err); });
    }

    window.Categories = { init };
})();
