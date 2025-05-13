// Gemini API Base URL
const GEMINI_API_BASE = "https://api.gemini.com/v1";

// DOM Elements
const elements = {
    container: document.getElementById('chatbotContainer'),
    openBtn: document.getElementById('openChatbot'),
    closeBtn: document.getElementById('closeChatbot'),
    messages: document.getElementById('chatMessages'),
    input: document.getElementById('userMessage'),
    sendBtn: document.getElementById('sendMessage')
};

// Predefined Responses for Common Issues
const predefinedResponses = {
    "hi": "Hello! How can I assist you today?",
    "help": "Here are some things I can help you with:\n- Check live prices of BTC and ETH\n- Provide guidance on common issues\n- Suggest contacting support if needed.",
    "btc price": "Fetching live BTC price...",
    "eth price": "Fetching live ETH price...",
    "forgot password": "If you forgot your password, please click on 'Forgot Password' on the login page to reset it.",
    "account locked": "If your account is locked, please contact support at support@example.com to resolve the issue.",
    "contact support": "You can contact support at support@example.com for further assistance."
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chatbot initialized');
    setupEventListeners();
    showMessage('bot', "Hello! I'm your assistant. Ask me anything!");
});

function setupEventListeners() {
    elements.openBtn.addEventListener('click', toggleChatbot);
    elements.closeBtn.addEventListener('click', toggleChatbot);
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.input.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
}

function toggleChatbot() {
    const isHidden = elements.container.style.display === 'none';
    elements.container.style.display = isHidden ? 'block' : 'none';
    elements.openBtn.style.display = isHidden ? 'none' : 'block';
    elements.closeBtn.style.display = isHidden ? 'block' : 'none';
    if (isHidden) elements.input.focus();
}

async function sendMessage() {
    const message = elements.input.value.trim().toLowerCase();
    if (!message) return;

    showMessage('user', message);
    elements.input.value = '';

    const loadingId = showLoading();

    try {
        if (predefinedResponses[message]) {
            if (message === "btc price") {
                const btcPrice = await getLivePrice("btc");
                showMessage('bot', `The current price of BTC/USD is $${btcPrice}.`);
            } else if (message === "eth price") {
                const ethPrice = await getLivePrice("eth");
                showMessage('bot', `The current price of ETH/USD is $${ethPrice}.`);
            } else {
                showMessage('bot', predefinedResponses[message]);
            }
        } else {
            showMessage('bot', "I'm sorry, I couldn't understand your query. Please try asking something else or type 'help' for assistance.");
        }
    } catch (error) {
        console.error('Chat Error:', error);
        showMessage('bot', "I'm sorry, I couldn't process your request. Please try again later.");
    } finally {
        removeLoading(loadingId);
    }
}

// Fetch Live Price from Gemini API
async function getLivePrice(symbol) {
    try {
        const response = await fetch(`${GEMINI_API_BASE}/pubticker/${symbol}usd`);
        if (!response.ok) {
            throw new Error(`Gemini API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (!data.last) {
            throw new Error("Invalid response format from Gemini API");
        }
        return data.last;
    } catch (error) {
        console.error("Error fetching live price:", error);
        return "Unavailable";
    }
}

// UI Helpers
function showMessage(sender, text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message mb-3`;
    messageDiv.innerHTML = `
        <div class="d-flex ${sender === 'bot' ? '' : 'justify-content-end'}">
            ${sender === 'bot' ? `
                <div class="flex-shrink-0 me-2">
                    <div class="bg-primary text-white rounded-circle p-2" style="width: 36px; height: 36px;">
                        <i class="fas fa-robot"></i>
                    </div>
                </div>
            ` : ''}
            <div>
                <div class="${sender === 'bot' ? 'bg-light' : 'bg-primary text-white'} rounded p-2">
                    ${text}
                </div>
                <small class="text-muted d-block mt-1 ${sender === 'bot' ? '' : 'text-end'}">${time}</small>
            </div>
            ${sender !== 'bot' ? `
                <div class="flex-shrink-0 ms-2">
                    <div class="bg-secondary text-white rounded-circle p-2" style="width: 36px; height: 36px;">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    elements.messages.appendChild(messageDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function showLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-message bot-message mb-3';
    div.innerHTML = `
        <div class="d-flex">
            <div class="flex-shrink-0 me-2">
                <div class="bg-primary text-white rounded-circle p-2" style="width: 36px; height: 36px;">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div>
                <div class="bg-light rounded p-2">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <small class="ms-2">Processing...</small>
                </div>
            </div>
        </div>
    `;
    elements.messages.appendChild(div);
    return id;
}

function removeLoading(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}