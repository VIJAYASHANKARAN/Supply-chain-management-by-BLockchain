document.addEventListener('DOMContentLoaded', async () => {
    // Initialize first
    await initWeb3();
    await initContract();
    
    // Then load history
    await loadTransactionHistory();
    
    // Set up event listeners
    document.getElementById('connectWallet')?.addEventListener('click', connectWallet);
    document.getElementById('historyFilter')?.addEventListener('change', loadTransactionHistory);
    document.getElementById('historySearch')?.addEventListener('input', filterTransactions);
});

async function loadTransactionHistory() {
    const loadingElement = document.getElementById('historyLoading');
    const tableBody = document.getElementById('historyTable');
    
    if (!supplyChainContract) {
        console.error("Contract not initialized");
        showAlert('danger', 'Blockchain connection not established');
        return;
    }

    try {
        // Show loading state
        loadingElement?.classList.remove('d-none');
        tableBody.innerHTML = '';
        
        const productCount = await supplyChainContract.methods.getProductCount().call();
        const statusFilter = document.getElementById('historyFilter')?.value || 'all';
        
        console.log(`Loading history for ${productCount} products...`);
        
        // Optimize by only loading recent products (last 50 for demo)
        const startFrom = Math.max(1, productCount - 50);
        
        for (let i = productCount; i >= startFrom; i--) {
            try {
                const product = await supplyChainContract.methods.products(i).call();
                const history = await supplyChainContract.methods.getProductHistory(i).call();
                
                // Skip if doesn't match filter
                if (statusFilter !== 'all' && product.status !== statusFilter) continue;
                
                // Process each transaction in the product's history
                for (let j = 0; j < history.length; j++) {
                    const from = j === 0 ? 'System' : history[j-1];
                    const to = history[j];
                    const status = getStatusForHistory(j, history, product.status);
                    
                    addTransactionToTable(i, product, from, to, status);
                }
            } catch (error) {
                console.error(`Error loading product ${i}:`, error);
            }
        }
        
        if (tableBody.innerHTML === '') {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No transactions found</td></tr>';
        }
        
    } catch (error) {
        console.error("Error loading transaction history:", error);
        showAlert('danger', 'Failed to load transaction history');
    } finally {
        loadingElement?.classList.add('d-none');
    }
}

function addTransactionToTable(productId, product, from, to, status) {
    const tableBody = document.getElementById('historyTable');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.dataset.status = status.value;
    row.dataset.searchText = `${productId} ${product.name} ${product.description}`.toLowerCase();
    
    row.innerHTML = `
        <td>${productId}</td>
        <td>
            <strong>${product.name}</strong><br>
            <small class="text-muted">${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</small>
        </td>
        <td class="text-nowrap">${formatAddress(from)}</td>
        <td class="text-nowrap">${formatAddress(to)}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td>
            <a href="inventory.html#product-${productId}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-eye me-1"></i>View
            </a>
        </td>
    `;
    
    tableBody.appendChild(row);
}

function filterTransactions() {
    const searchInput = document.getElementById('historySearch');
    const statusFilter = document.getElementById('historyFilter');
    const tableBody = document.getElementById('historyTable');
    
    if (!searchInput || !statusFilter || !tableBody) return;
    
    const searchText = searchInput.value.toLowerCase();
    const filterValue = statusFilter.value;
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const matchesSearch = searchText === '' || row.dataset.searchText.includes(searchText);
        const matchesStatus = filterValue === 'all' || row.dataset.status === filterValue;
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function getStatusForHistory(index, history, currentStatus) {
    // If it's the first entry
    if (index === 0) {
        return { 
            text: 'Created', 
            value: '0', 
            class: 'bg-primary' 
        };
    }
    
    // If it's returned to original owner
    if (index === history.length - 1 && history[index] === history[0]) {
        return { 
            text: 'Delivered', 
            value: '2', 
            class: 'bg-success' 
        };
    }
    
    // Use current status for the most recent transaction
    if (index === history.length - 1) {
        return {
            text: currentStatus === '0' ? 'Created' : 
                  currentStatus === '1' ? 'In Transit' : 'Delivered',
            value: currentStatus,
            class: currentStatus === '0' ? 'bg-primary' :
                  currentStatus === '1' ? 'bg-warning text-dark' : 'bg-success'
        };
    }
    
    // Default to transferred
    return { 
        text: 'Transferred', 
        value: '1', 
        class: 'bg-warning text-dark' 
    };
}

function formatAddress(address) {
    if (address === 'System') return address;
    if (!address || address.length < 42) return 'Invalid Address';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
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