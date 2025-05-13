document.addEventListener('DOMContentLoaded', async () => {
    await initWeb3();
    await initContract();
    await loadProducts();
    
    // Form submission handler
    document.getElementById('createProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createProduct();
    });
    
    // Connect wallet button
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
});

async function loadProducts() {
    if (!supplyChainContract) return;
    
    try {
        const productCount = await supplyChainContract.methods.getProductCount().call();
        const tableBody = document.getElementById('productTableBody');
        tableBody.innerHTML = '';
        
        for (let i = 1; i <= productCount; i++) {
            const product = await supplyChainContract.methods.products(i).call();
            const history = await supplyChainContract.methods.getProductHistory(i).call();
            
            const statusText = getStatusText(product.status);
            const statusClass = getStatusClass(product.status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.description}</td>
                <td>${web3.utils.fromWei(product.price, 'ether')}</td>
                <td><span class="badge badge-status ${statusClass}">${statusText}</span></td>
                <td class="text-truncate" style="max-width: 120px;">${product.owner}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary transfer-btn" data-id="${product.id}">
                        <i class="fas fa-truck me-1"></i>Transfer
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        }
        
        // Add event listeners to transfer buttons
        document.querySelectorAll('.transfer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id') || 
                                 e.target.parentElement.getAttribute('data-id');
                showTransferModal(productId);
            });
        });
        
    } catch (error) {
        console.error("Error loading products:", error);
        showAlert('danger', 'Failed to load products');
    }
}

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
        case '0': return 'badge-created';
        case '1': return 'badge-intransit';
        case '2': return 'badge-delivered';
        default: return '';
    }
}

async function createProduct() {
    if (!supplyChainContract) {
        showAlert('warning', 'Please connect your wallet first');
        return;
    }
    
    const form = document.getElementById('createProductForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    
    try {
        // Show loading state
        const btn = document.getElementById('createProductBtn');
        const btnText = document.getElementById('createProductText');
        const spinner = document.getElementById('createProductSpinner');
        
        btn.disabled = true;
        btnText.textContent = 'Creating...';
        spinner.classList.remove('d-none');
        
        // Convert price to wei
        const priceWei = web3.utils.toWei(price, 'ether');
        
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        
        // Send transaction
        await supplyChainContract.methods.createProduct(name, description, priceWei)
            .send({ from: accounts[0] })
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
            })
            .on('receipt', (receipt) => {
                console.log('Transaction receipt:', receipt);
                showAlert('success', 'Product created successfully!');
                loadProducts();
            })
            .on('error', (error) => {
                console.error('Transaction error:', error);
                showAlert('danger', 'Transaction failed');
            });
            
    } catch (error) {
        console.error("Error creating product:", error);
        showAlert('danger', 'Failed to create product');
    } finally {
        // Reset button state
        const btn = document.getElementById('createProductBtn');
        const btnText = document.getElementById('createProductText');
        const spinner = document.getElementById('createProductSpinner');
        
        btn.disabled = false;
        btnText.textContent = 'Create Product';
        spinner.classList.add('d-none');
    }
}

function showTransferModal(productId) {
    document.getElementById('transferProductId').value = productId;
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    modal.show();
    
    // Set up transfer confirmation
    document.getElementById('confirmTransferBtn').addEventListener('click', async () => {
        await transferProduct(productId);
    });
}

async function transferProduct(productId) {
    const recipient = document.getElementById('recipientAddress').value;

    if (!recipient || !web3.utils.isAddress(recipient)) {
        showAlert('warning', 'Please enter a valid Ethereum address');
        return;
    }

    try {
        // Show loading state
        const btn = document.getElementById('confirmTransferBtn');
        const btnText = document.getElementById('transferBtnText');
        const spinner = document.getElementById('transferSpinner');

        btn.disabled = true;
        btnText.textContent = 'Processing...';
        spinner.classList.remove('d-none');

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];

        // Validate product ownership
        const product = await supplyChainContract.methods.products(productId).call();
        if (product.owner.toLowerCase() !== currentAccount.toLowerCase()) {
            showAlert('danger', 'You are not authorized to transfer this product');
            return;
        }

        // Send transaction
        await supplyChainContract.methods.transferProduct(productId, recipient)
            .send({ from: currentAccount, gas: 300000 }) // Adjust gas limit as needed
            .on('transactionHash', (hash) => {
                console.log('Transfer transaction hash:', hash);
            })
            .on('receipt', (receipt) => {
                console.log('Transfer receipt:', receipt);
                showAlert('success', 'Product transferred successfully!');
                loadProducts();
                bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
            })
            .on('error', (error) => {
                console.error('Transfer error:', error.message || error);
                showAlert('danger', `Transfer failed: ${error.message || 'Unknown error'}`);
            });

    } catch (error) {
        console.error("Error transferring product:", error.message || error);
        showAlert('danger', `Failed to transfer product: ${error.message || 'Unknown error'}`);
    } finally {
        // Reset button state
        const btn = document.getElementById('confirmTransferBtn');
        const btnText = document.getElementById('transferBtnText');
        const spinner = document.getElementById('transferSpinner');

        btn.disabled = false;
        btnText.textContent = 'Confirm Transfer';
        spinner.classList.add('d-none');
    }
}
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '1100';
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            const btn = document.getElementById('connectWallet');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Connecting...';
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const walletAddress = document.getElementById('walletAddress');
            const walletShort = document.getElementById('walletShort');
            
            walletAddress.classList.remove('d-none');
            walletShort.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            
            btn.innerHTML = '<i class="fas fa-check me-1"></i> Connected';
            setTimeout(() => {
                btn.classList.add('d-none');
            }, 2000);
            
            // Reload products with new wallet connection
            await initContract();
            await loadProducts();
            
        } catch (error) {
            console.error("Error connecting wallet:", error);
            showAlert('danger', 'Failed to connect wallet');
            const btn = document.getElementById('connectWallet');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plug me-1"></i> Connect Wallet';
        }
    } else {
        showAlert('warning', 'Please install MetaMask to use this dApp!');
    }
}