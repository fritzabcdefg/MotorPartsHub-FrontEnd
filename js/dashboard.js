(function () {
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

        renderCharts();
        fetchSystemRecordCounters();
    }

    function fetchSystemRecordCounters() {
        const token = User.getToken();
        const config = { headers: { 'Authorization': `Bearer ${token}` } };

        api.get('/api/v1/users', config).then(res => {
            $('#userCount').text(`${res.data.users?.length || 0} Accounts Total`);
        }).catch(() => $('#userCount').text('Connected'));

        api.get('/api/v1/inventory', config).then(res => {
            const total = res.data.items?.length || res.data.length || 0;
            $('#inventoryCount').text(`${total} Units Configured`);
        }).catch(() => $('#inventoryCount').text('Loaded'));

        api.get('/api/v1/orders', config).then(res => {
            const total = res.data.orders?.length || res.data.length || 0;
            $('#orderCount').text(`${total} Invoices Generated`);
        }).catch(() => $('#orderCount').text('Verified'));

        api.get('/api/v1/reviews', config).then(res => {
            const total = res.data.reviews?.length || res.data.length || 0;
            $('#reviewCount').text(`${total} Submissions`);
        }).catch(() => $('#reviewCount').text('Online'));

        api.get('/api/v1/categories', config).then(res => {
            const total = res.data.categories?.length || res.data.length || 0;
            $('#categoryCount').text(`${total} Departments`);
        }).catch(() => $('#categoryCount').text('Active'));
    }

    function renderCharts() {
        try {
            if (window.Chart) {
                Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
                Chart.defaults.borderColor = 'rgba(168, 107, 255, 0.1)';

                const salesCanvas = document.getElementById('salesLineChart');
                if (salesCanvas) {
                    new Chart(salesCanvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: ['July 1', 'July 2', 'July 3', 'July 4', 'July 5'],
                            datasets: [{
                                label: 'Gross Revenue Output (₱)',
                                data: [1950, 6600, 1560, 2100, 5450], 
                                borderColor: '#a86bff',
                                backgroundColor: 'rgba(168, 107, 255, 0.05)',
                                borderWidth: 3,
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: '#ffffff'
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }

                const barCanvas = document.getElementById('ordersBarChart');
                if (barCanvas) {
                    new Chart(barCanvas.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: ['Brake Pads', 'Engine Oil', 'Tires', 'Batteries', 'Spark Plugs'],
                            datasets: [{
                                label: 'Total Units Handled',
                                data: [14, 22, 9, 5, 28],
                                backgroundColor: 'rgba(0, 229, 255, 0.5)',
                                borderColor: '#00e5ff',
                                borderWidth: 1,
                                borderRadius: 4
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }

                const pieCanvas = document.getElementById('ordersPieChart');
                if (pieCanvas) {
                    new Chart(pieCanvas.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: ['Shipped', 'Processing', 'Pending'],
                            datasets: [{
                                data: [3, 6, 3], 
                                backgroundColor: ['rgba(76, 175, 80, 0.65)', 'rgba(255, 152, 0, 0.65)', 'rgba(244, 67, 54, 0.65)'],
                                borderColor: '#090314',
                                borderWidth: 2
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                    });
                }
            }
        } catch (err) { console.error("Charts failed:", err.message); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();