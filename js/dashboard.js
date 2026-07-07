(function () {
    let salesChart, barChart, pieChart;

    async function init() {
        renderCharts();
        await refreshCharts(); // Fetch initial data
    }

    function renderCharts() {
        if (!window.Chart) return;
        
        // Destroy existing to prevent "Canvas already in use"
        if (salesChart) salesChart.destroy();
        if (barChart) barChart.destroy();
        if (pieChart) pieChart.destroy();

        // Create Charts
        salesChart = new Chart(document.getElementById('salesLineChart').getContext('2d'), {
            type: 'line',
            data: { labels: ['July 1', 'July 2', 'July 3', 'July 4', 'July 5'], datasets: [{ label: 'Revenue', data: [1950, 6600, 1560, 2100, 5450], borderColor: '#a86bff' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });

        barChart = new Chart(document.getElementById('ordersBarChart').getContext('2d'), {
            type: 'bar',
            data: { labels: ['Brake Pads', 'Engine Oil', 'Tires', 'Batteries', 'Spark Plugs'], datasets: [{ label: 'Units', data: [14, 22, 9, 5, 28], backgroundColor: '#00e5ff' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });

        pieChart = new Chart(document.getElementById('ordersPieChart').getContext('2d'), {
            type: 'pie',
            data: { labels: ['Loading'], datasets: [{ data: [1], backgroundColor: ['#555'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    async function refreshCharts() {
        try {
            const response = await fetch('http://localhost:4000/api/v1/chart-data');
            if (!response.ok) throw new Error("Failed to load chart data");
            const data = await response.json();

            // ADDED: color map keyed by status name, with a fallback for null/blank statuses
            const statusColors = {
                'Processing': '#ff9800',
                'Shipped':    '#2196f3',
                'Delivered':  '#4caf50',
                'Cancelled':  '#f44336',
                'Unknown':    '#888888'
            };

            // FIXED: default blank/null status to 'Unknown' so the legend always has a label
            const labels = data.map(item => item.status && item.status.trim() ? item.status : 'Unknown');
            const counts  = data.map(item => item.count);
            const colors  = labels.map(label => statusColors[label] || '#888888');

            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = counts;
            pieChart.data.datasets[0].backgroundColor = colors;
            pieChart.update();
            console.log("Charts refreshed");
        } catch (err) {
            console.error("Refresh failed:", err);
        }
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") refreshCharts();
    });

    document.addEventListener('DOMContentLoaded', init);
})();