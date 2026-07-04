// Reviews management for admin dashboard
(function () {
    function init() {
        loadReviews();
    }

    function loadReviews() {
        const token = User.getToken();

        api.get('/api/v1/reviews', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            const rows = response.data.rows || response.data.reviews || response.data || [];
            const reviews = Array.isArray(rows) ? rows : [];
            renderReviewsSection(reviews);
        })
        .catch(error => {
            console.error('Failed to load reviews:', error.response?.data || error.message);
            renderReviewsSection([]);
        });
    }

    function renderReviewsSection(reviews) {
        $('#admin-reviews').remove();

        const html = `
            <section id="admin-reviews" class="card admin-section" style="display:none;">
                <h2>Review Management</h2>
                <p class="muted">View and moderate product reviews.</p>
                <table id="reviewsTable" class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Item</th>
                            <th>User</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reviews.length ? reviews.map(r => `
                            <tr>
                                <td>${r.id || r.review_id}</td>
                                <td>${r.item_name || r.item?.name || r.item_id || '—'}</td>
                                <td>${r.user_name || r.user?.name || r.user_id || '—'}</td>
                                <td>${r.rating || '—'}</td>
                                <td>${(r.comment || '').substring(0, 120)}</td>
                                <td>${r.approved ? 'Approved' : 'Pending'}</td>
                                <td>
                                    ${r.approved ? `<button class="btn-unapprove" data-id="${r.id || r.review_id}">Unapprove</button>` : `<button class="btn-approve" data-id="${r.id || r.review_id}">Approve</button>`}
                                    <button class="btn-delete-review" data-id="${r.id || r.review_id}">Delete</button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="7" class="muted">No reviews yet.</td></tr>`}
                    </tbody>
                </table>
            </section>
        `;

        $('#dashboardRoot').append(html);

        if ($.fn.DataTable) {
            $('#reviewsTable').DataTable({ destroy: true, paging: true, pageLength: 10, searching: true, ordering: true });
        }

        attachHandlers();
        if (window.updateDashboardViewFromHash) window.updateDashboardViewFromHash();
    }

    function attachHandlers() {
        $('.btn-approve').off('click').on('click', function () {
            const id = $(this).data('id');
            setReviewApproval(id, true);
        });

        $('.btn-unapprove').off('click').on('click', function () {
            const id = $(this).data('id');
            setReviewApproval(id, false);
        });

        $('.btn-delete-review').off('click').on('click', function () {
            const id = $(this).data('id');
            if (!confirm('Delete this review?')) return;
            deleteReview(id);
        });
    }

    function setReviewApproval(id, approved) {
        const token = User.getToken();
        api.put(`/api/v1/reviews/${id}`, { approved }, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(() => { loadReviews(); })
        .catch(err => { alert('Failed to update review.'); console.error(err); });
    }

    function deleteReview(id) {
        const token = User.getToken();
        api.delete(`/api/v1/reviews/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(() => { loadReviews(); })
        .catch(err => { alert('Failed to delete review.'); console.error(err); });
    }

    window.Reviews = { init };
})();
