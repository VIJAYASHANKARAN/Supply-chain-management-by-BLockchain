document.getElementById('connectWallet').addEventListener('click', async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            document.getElementById('walletAddress').textContent = 
                `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            updateUI();
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
    } else {
        alert('Please install MetaMask to use this dApp!');
    }
});

async function updateUI() {
    if (!supplyChainContract) return;
    
    try {
        const productCount = await supplyChainContract.methods.getProductCount().call();
        document.getElementById('totalProducts').textContent = productCount;
        
        // Update other dashboard elements
        // You would add more calls to your contract here
        
    } catch (error) {
        console.error("Error updating UI:", error);
    }
}

// Product creation form handler
document.getElementById('createProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    
    try {
        const accounts = await web3.eth.getAccounts();
        await supplyChainContract.methods.createProduct(name, description, price)
            .send({ from: accounts[0] });
        alert('Product created successfully!');
        updateUI();
    } catch (error) {
        console.error("Error creating product:", error);
        alert('Failed to create product');
    }
});