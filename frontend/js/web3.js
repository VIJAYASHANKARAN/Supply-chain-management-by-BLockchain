let web3;
let supplyChainContract;

// ✅ Replace this with your actual deployed contract address from Ganache
let contractAddress = "0x55D54B4bd08F25239D8C08924fA70A4579b903f9";

// ✅ Replace this with the full ABI array from your SupplyChain.json
let contractABI = [ 
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
        { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
        { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
      ],
      "name": "ProductCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
        { "indexed": false, "internalType": "enum SupplyChain.ProductStatus", "name": "status", "type": "uint8" }
      ],
      "name": "ProductStatusUpdated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "productCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "name": "products",
      "outputs": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "name": "description", "type": "string" },
        { "internalType": "uint256", "name": "price", "type": "uint256" },
        { "internalType": "address", "name": "owner", "type": "address" },
        { "internalType": "enum SupplyChain.ProductStatus", "name": "status", "type": "uint8" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "_name", "type": "string" },
        { "internalType": "string", "name": "_description", "type": "string" },
        { "internalType": "uint256", "name": "_price", "type": "uint256" }
      ],
      "name": "createProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "_id", "type": "uint256" },
        { "internalType": "address", "name": "_to", "type": "address" }
      ],
      "name": "transferProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
      "name": "getProductHistory",
      "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProductCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
];

async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return true;
        } catch (error) {
            console.error("User denied account access");
            return false;
        }
    } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        return true;
    } else {
        console.error('Non-Ethereum browser detected. You should install MetaMask!');
        return false;
    }
}

async function initContract() {
    try {
        supplyChainContract = new web3.eth.Contract(contractABI, contractAddress);
        console.log("Contract initialized at:", contractAddress);
        return true;
    } catch (error) {
        console.error("Contract initialization failed:", error);
        return false;
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        alert('Please install MetaMask to use this dApp!');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletElement = document.getElementById('walletAddress');
        const walletShort = document.getElementById('walletShort');

        if (walletElement && walletShort) {
            walletElement.classList.remove('d-none');
            walletShort.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
        }

        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Connected';
            connectBtn.classList.add('disabled');
        }

        return accounts[0];
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert('Failed to connect wallet');
        return null;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    await initWeb3();
    await initContract();

    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }

    if (window.ethereum && window.ethereum.selectedAddress) {
        const walletElement = document.getElementById('walletAddress');
        const walletShort = document.getElementById('walletShort');

        if (walletElement && walletShort) {
            walletElement.classList.remove('d-none');
            walletShort.textContent =
                `${window.ethereum.selectedAddress.substring(0, 6)}...${window.ethereum.selectedAddress.substring(38)}`;
        }

        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Connected';
            connectBtn.classList.add('disabled');
        }
    }
});
