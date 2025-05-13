// Global variables
let performanceChart;
let lastProductCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await initDashboard();
    
    // Set up event listeners
    document.getElementById('refreshDashboard')?.addEventListener('click', initDashboard);
    document.getElementById('connectWallet')?.addEventListener('click', connectWallet);
    
    // Refresh dashboard every 30 seconds
    setInterval(initDashboard, 30000);
});

async function initDashboard() {
    try {
        // Show loading state
        document.getElementById('recentActivities').innerHTML = `
            <div class="list-group-item text-center py-4 text-muted">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading activities...</p>
            </div>
        `;
        
        // Initialize Web3 and contract
        await initWeb3();
        await initContract();
        
        // Load data
        await updateStats();
        await loadRecentActivities();
        initPerformanceChart();
        
    } catch (error) {
        console.error("Dashboard initialization failed:", error);
        showAlert('danger', 'Failed to load dashboard data');
    }
}

async function updateStats() {
    if (!supplyChainContract) {
        console.log("Contract not initialized");
        return;
    }

    try {
        const currentProductCount = await supplyChainContract.methods.getProductCount().call();
        document.getElementById('totalProducts').textContent = currentProductCount;
        
        // Calculate growth percentage (sample data)
        const growthPercentage = lastProductCount > 0 
            ? Math.round(((currentProductCount - lastProductCount) / lastProductCount) * 100)
            : 100;
        
        document.getElementById('productGrowth').textContent = `${growthPercentage}%`;
        lastProductCount = currentProductCount;
        
        // Get status counts
        let inTransit = 0;
        let delivered = 0;
        
        // Only check last 20 products for performance
        const checkLimit = Math.min(20, currentProductCount);
        for (let i = currentProductCount; i > currentProductCount - checkLimit; i--) {
            const product = await supplyChainContract.methods.products(i).call();
            if (product.status === "1") inTransit++;
            if (product.status === "2") delivered++;
        }
        
        document.getElementById('inTransitCount').textContent = inTransit;
        document.getElementById('deliveredCount').textContent = delivered;
        
        // Sample growth data
        document.getElementById('transitGrowth').textContent = `${Math.floor(Math.random() * 20) + 5}%`;
        document.getElementById('deliveredGrowth').textContent = `${Math.floor(Math.random() * 25) + 10}%`;

    } catch (error) {
        console.error("Error updating stats:", error);
        throw error;
    }
}

async function loadRecentActivities() {
    if (!supplyChainContract) {
        console.log("Contract not initialized");
        return;
    }

    try {
        const count = await supplyChainContract.methods.getProductCount().call();
        const activitiesList = document.getElementById('recentActivities');
        activitiesList.innerHTML = '';
        
        const limit = Math.min(5, count);
        
        for (let i = count; i > count - limit; i--) {
            const product = await supplyChainContract.methods.products(i).call();
            const history = await supplyChainContract.methods.getProductHistory(i).call();
            
            const statusText = getStatusText(product.status);
            const statusClass = getStatusClass(product.status);
            
            const activityItem = document.createElement('a');
            activityItem.href = `inventory.html#product-${product.id}`;
            activityItem.className = 'list-group-item list-group-item-action activity-item';
            
            activityItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <span class="product-status ${statusClass}"></span>
                            ${product.name}
                        </h6>
                        <small class="text-muted">${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</small>
                    </div>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <div class="d-flex w-100 justify-content-between mt-2">
                    <small class="text-muted">ID: ${product.id}</small>
                    <small class="text-muted">${formatDate(new Date())}</small>
                </div>
            `;
            
            activitiesList.appendChild(activityItem);
        }
        
        if (activitiesList.innerHTML === '') {
            activitiesList.innerHTML = `
                <div class="list-group-item text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>No recent activities found</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Error loading recent activities:", error);
        activitiesList.innerHTML = `
            <div class="list-group-item text-center py-4 text-muted">
                <i class="fas fa-exclamation-triangle fa-2x mb-2 text-danger"></i>
                <p>Failed to load activities</p>
            </div>
        `;
    }
}

function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Sample data
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const deliveredData = [12, 19, 15, 27, 22, 18, 24];
    const transitData = [5, 8, 6, 9, 7, 5, 8];
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Products Delivered',
                    data: deliveredData,
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.05)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Products In Transit',
                    data: transitData,
                    borderColor: '#f6c23e',
                    backgroundColor: 'rgba(246, 194, 62, 0.05)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Helper functions
function getStatusText(status) {
    switch(status) {
        case '0': return 'Created';
        case '1': return 'In Transit';
        case '2': return 'Delivered';
        default: return 'Unknown';
    }
}

function getStatusClass(status) {
    switch(status) {
        case '0': return 'status-0';
        case '1': return 'status-1';
        case '2': return 'status-2';
        default: return '';
    }
}

function formatDate(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    alertDiv.style.zIndex = '1100';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}