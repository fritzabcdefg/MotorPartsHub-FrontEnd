// Inventory module for admin dashboard
(function () {
    const API_BASE = 'http://localhost:4000/api/v1';
    let partsCache = [];

    function init() {
        loadParts();
    }

    function loadParts() {
        const token = User.getToken();

        $.ajax({
            url: `${API_BASE}/parts`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .done(function(response) {
            partsCache = response.parts || [];
            renderPartsSection(partsCache);
        })
        .fail(function(xhr) {
            console.error('Failed to load parts:', xhr.responseJSON || xhr.responseText || xhr.statusText);
        });
    }

    function renderPartsSection(parts) {
        const html = `
            <section id="admin-inventory" class="card admin-section" style="display:none;">
                <h2>Inventory Management</h2>
                <p class="muted">Manage your current inventory items and spare parts here.</p>
                <form id="partForm" class="part-form">
                    <input type="hidden" id="partId" name="id" value="">
                    <div class="form-row">
                        <label>Name<span class="required">*</span><input id="partName" name="name" type="text" required></label>
                        <label>Category<span class="required">*</span><input id="partCategory" name="category" type="text" required></label>
                        <label>Description<input id="partDescription" name="description" type="text"></label>
                        <label>Price<span class="required">*</span><input id="partPrice" name="price" type="number" step="0.01" required></label>
                        <label>Stock<input id="partQuantity" name="quantity" type="number" min="0"></label>
                        <label>Images<input id="partImages" name="images" type="file" multiple accept="image/*"></label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Save Part</button>
                        <button type="button" class="btn secondary" id="cancelPartBtn">Cancel</button>
                    </div>
                    <div id="existingImagesInfo" class="muted"></div>
                </form>
                <table id="partsTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Images</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parts.map(part => `
                            <tr>
                                <td>${part.id}</td>
                                <td>${part.name}</td>
                                <td>${part.category || 'Unspecified'}</td>
                                <td>₱ ${Number(part.price).toFixed(2)}</td>
                                <td>${part.quantity || 0}</td>
                                <td>${parseImages(part.images).length}</td>
                                <td>
                                    <button class="btn-edit-part" data-part-id="${part.id}">Edit</button>
                                    <button class="btn-delete-part" data-part-id="${part.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#partsTable').DataTable({
                destroy: true,
                paging: true,
                pageLength: 10,
                searching: true,
                ordering: true
            });
        }

        attachPartHandlers();
    }

    function attachPartHandlers() {
        $('#partForm').off('submit').on('submit', function(event) {
            event.preventDefault();
            const token = User.getToken();
            const partId = $('#partId').val();
            const formData = new FormData(this);
            const method = partId ? 'PUT' : 'POST';
            const url = partId ? `${API_BASE}/parts/${partId}` : `${API_BASE}/parts`;

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
                alert('Part saved successfully.');
                resetPartForm();
                loadParts();
            })
            .fail(function(xhr) {
                alert('Failed to save part: ' + (xhr.responseJSON?.message || 'Unknown error'));
            });
        });

        $('#cancelPartBtn').off('click').on('click', resetPartForm);

        $('.btn-edit-part').off('click').on('click', function() {
            const partId = $(this).data('part-id');
            const part = partsCache.find(p => p.id === partId);
            if (!part) return;
            fillPartForm(part);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        $('.btn-delete-part').off('click').on('click', function() {
            const partId = $(this).data('part-id');
            if (!confirm('Delete this part?')) return;
            const token = User.getToken();

            $.ajax({
                url: `${API_BASE}/parts/${partId}`,
                type: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .done(function() {
                alert('Part deleted successfully.');
                loadParts();
            })
            .fail(function(xhr) {
                alert('Failed to delete part: ' + (xhr.responseJSON?.message || 'Unknown error'));
            });
        });
    }

    function parseImages(imagesJson) {
        try {
            const images = JSON.parse(imagesJson || '[]');
            return Array.isArray(images) ? images : [];
        } catch (e) {
            return [];
        }
    }

    function fillPartForm(part) {
        $('#partId').val(part.id);
        $('#partName').val(part.name);
        $('#partCategory').val(part.category || '');
        $('#partDescription').val(part.description || '');
        $('#partPrice').val(part.price);
        $('#partQuantity').val(part.quantity || 0);
        const existingImages = parseImages(part.images);
        $('#existingImagesInfo').text(existingImages.length ? `Current images: ${existingImages.join(', ')}` : 'No images uploaded yet.');
    }

    function resetPartForm() {
        $('#partId').val('');
        $('#partName').val('');
        $('#partCategory').val('');
        $('#partDescription').val('');
        $('#partPrice').val('');
        $('#partQuantity').val('');
        $('#partImages').val('');
        $('#existingImagesInfo').text('');
    }

    window.Inventory = {
        init,
        loadParts
    };
})();