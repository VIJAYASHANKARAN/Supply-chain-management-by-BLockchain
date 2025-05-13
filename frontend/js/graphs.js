document.addEventListener('DOMContentLoaded', async () => {
    await loadCharts();
    
    // Set up event listeners
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
});

async function loadCharts() {
    if (!supplyChainContract) {
        console.log("Contract not initialized");
        return;
    }

    try {
        const productCount = await supplyChainContract.methods.getProductCount().call();
        
        // Status distribution data
        let statusCounts = [0, 0, 0]; // Created, InTransit, Delivered
        
        // Only check last 50 products for performance
        const checkLimit = Math.min(50, productCount);
        for (let i = productCount; i > productCount - checkLimit; i--) {
            const product = await supplyChainContract.methods.products(i).call();
            statusCounts[parseInt(product.status)]++;
        }
        
        createPieChart('statusChart', 
                     ['Created', 'In Transit', 'Delivered'], 
                     statusCounts,
                     ['#4e73df', '#f6c23e', '#1cc88a']);
        
        // Monthly activity (sample data - would need timestamps in your contract)
        const monthlyData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Products Created',
                    data: [5, 8, 12, 6, 9, 11, 15],
                    backgroundColor: '#4e73df',
                },
                {
                    label: 'Products Delivered',
                    data: [3, 5, 8, 4, 7, 9, 12],
                    backgroundColor: '#1cc88a',
                }
            ]
        };
        createBarChart('monthlyChart', monthlyData);
        
        // Timeline (sample data)
        const timelineData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Average Transit Time (days)',
                    data: [3.5, 2.8, 4.2, 3.1],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    fill: true
                }
            ]
        };
        createLineChart('timelineChart', timelineData);

    } catch (error) {
        console.error("Error loading charts:", error);
    }
}

function createPieChart(canvasId, labels, data, colors) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                hoverBackgroundColor: colors.map(c => `${c}cc`),
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

function createBarChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function createLineChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}