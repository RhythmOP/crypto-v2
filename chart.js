// Chart.js functionality for Crypto Tracker

// Modal elements
const chartModal = document.getElementById('chartModal');
const closeChartBtn = document.getElementById('closeChartBtn');
const chartCanvas = document.getElementById('priceChart');
const chartTitle = document.getElementById('chartTitle');
let priceChart = null;

// Initialize chart functionality
function initChartFunctionality() {
    // Add event listener to close button
    closeChartBtn.addEventListener('click', closeChart);
    
    // Close modal when clicking outside the chart content
    chartModal.addEventListener('click', (e) => {
        if (e.target === chartModal) {
            closeChart();
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chartModal.classList.contains('active')) {
            closeChart();
        }
    });
}

// Open chart modal and display data
function openChart(coin) {
    // Set chart title
    chartTitle.textContent = `${coin.name} (${coin.symbol.toUpperCase()}) Price Chart`;
    
    // Get historical price data
    const priceData = coin.sparkline_in_7d?.price || [];
    
    // Create labels for the last 7 days
    const labels = createDateLabels(7);
    
    // Destroy existing chart if it exists
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Create new chart
    const ctx = chartCanvas.getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${coin.name} Price (USD)`,
                data: priceData,
                borderColor: coin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444',
                backgroundColor: coin.price_change_percentage_24h > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: coin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: document.body.classList.contains('dark-mode') ? '#f8fafc' : '#1e293b'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: document.body.classList.contains('dark-mode') ? '#f8fafc' : '#1e293b'
                    }
                },
                y: {
                    grid: {
                        color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: document.body.classList.contains('dark-mode') ? '#f8fafc' : '#1e293b',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Show modal
    chartModal.classList.add('active');
}

// Close chart modal
function closeChart() {
    chartModal.classList.remove('active');
}

// Create date labels for the chart (last n days)
function createDateLabels(days) {
    const labels = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return labels;
}

// Add additional market data to the chart modal
function addMarketData(coin) {
    const marketDataContainer = document.getElementById('marketData');
    
    marketDataContainer.innerHTML = `
        <div class="market-data-item">
            <span class="label">Market Cap:</span>
            <span class="value">$${formatNumber(coin.market_cap)}</span>
        </div>
        <div class="market-data-item">
            <span class="label">24h Volume:</span>
            <span class="value">$${formatNumber(coin.total_volume)}</span>
        </div>
        <div class="market-data-item">
            <span class="label">Circulating Supply:</span>
            <span class="value">${formatNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}</span>
        </div>
        <div class="market-data-item">
            <span class="label">24h High:</span>
            <span class="value">$${coin.high_24h.toFixed(2)}</span>
        </div>
        <div class="market-data-item">
            <span class="label">24h Low:</span>
            <span class="value">$${coin.low_24h.toFixed(2)}</span>
        </div>
    `;
}

// Format large numbers with commas
function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('en-US');
}