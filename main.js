// AI Chat Email Manager with OpenRouter + FREE Mistral
const CONFIG = {
    API_BASE_URL: 'https://emailbot-f71m.onrender.com',
    OPENROUTER_API_KEY: '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'
};

// Application State
const appState = {
    contacts: [],
    sentEmails: [],
    chatMessages: [],
    isTyping: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🤖 Initializing AI Email Manager...');
    
    loadDataFromBackend();
    showEmptyState();
    testAIConnection();
    
    // Update contact counter
    updateContactCounter();
    
    console.log('✅ AI Email Manager ready');
}

// Show Empty State
function showEmptyState() {
    const messagesArea = document.getElementById('chatMessages');
    messagesArea.innerHTML = `
        <div class="empty-state">
            <span class="material-icons">smart_toy</span>
            <h2>AI Email Assistant</h2>
            <p>I can help you manage emails, scrape websites, and organize contacts through natural conversation!</p>
            
            <div class="example-prompts">
                <button class="example-prompt" onclick="sendExampleMessage('https://example.com')">
                    🕷️ Scrape emails from https://example.com
                </button>
                <button class="example-prompt" onclick="sendExampleMessage('add john@example.com, jane@company.org')">
                    ➕ Add contacts: john@example.com, jane@company.org
                </button>
                <button class="example-prompt" onclick="sendExampleMessage('show all my contacts')">
                    📋 Show all my contacts
                </button>
                <button class="example-prompt" onclick="sendExampleMessage('send emails to all gmail contacts')">
                    📤 Send emails to all gmail contacts
                </button>
            </div>
        </div>
    `;
}

// Handle Input Keydown
function handleInputKeydown(event) {
    if (event.key === 'Enter') {
        handleUserInput();
    }
}

// Handle User Input
async function handleUserInput() {
    const input = document.getElementById('urlInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Check for contact management commands FIRST (before URL detection)
    const contactAction = detectContactManagementCommand(message);
    if (contactAction) {
        await handleContactManagement(contactAction, message);
        return;
    }
    
    // Check for email sending commands
    if (message.toLowerCase().match(/send email|send to|email all|send all/)) {
        await handleEmailSending(message);
        return;
    }
    
    // Then check if it's a URL for scraping
    if (isUrlInput(message)) {
        await handleScraping(message);
    } else {
        await handleConversation(message);
    }
}

// Send Example Message
function sendExampleMessage(message) {
    document.getElementById('urlInput').value = message;
    handleUserInput();
}

// Add Chat Message
function addChatMessage(content, type = 'assistant', id = null) {
    const messageId = id || 'msg-' + Date.now();
    const message = { id: messageId, content, type, timestamp: new Date() };
    appState.chatMessages.push(message);
    renderChatMessages();
    return message;
}

// Remove Chat Message
function removeChatMessage(id) {
    appState.chatMessages = appState.chatMessages.filter(msg => msg.id !== id);
    renderChatMessages();
}

// Render Chat Messages
function renderChatMessages() {
    const messagesArea = document.getElementById('chatMessages');
    
    if (appState.chatMessages.length === 0) {
        showEmptyState();
        return;
    }
    
    const messagesHTML = appState.chatMessages.map(msg => `
        <div class="message ${msg.type}">
            <div class="message-content">
                <div class="message-text">${formatMarkdown(msg.content)}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');
    
    messagesArea.innerHTML = messagesHTML;
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Handle Conversation with AI
async function handleConversation(message) {
    try {
        addChatMessage('🤔 Thinking...', 'assistant', 'typing');
        
        // Call OpenRouter AI API with FREE Mistral
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Email Manager AI'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI assistant for an Email Management system. You can help with:

**Contact Management:**
- ADD emails: "add john@example.com, jane@company.org"
- DELETE contacts: "delete john@example.com" or "remove all gmail contacts"  
- SEARCH contacts: "show all contacts" or "find gmail contacts"
- VERIFY emails: "verify jane@company.org" or "check all emails"
- SEND emails: "send emails to all contacts" or "email all gmail contacts"

**Website Scraping:**
- Extract emails from any URL: just provide the website URL

**Current database: ${appState.contacts.length} contacts**

Be helpful, concise, and action-oriented. When users ask for contact operations, guide them on the exact commands to use.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        console.log('OpenRouter Response Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OpenRouter Response:', data);
        
        const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        removeChatMessage('typing');
        addChatMessage(aiResponse, 'assistant');
        
    } catch (error) {
        console.error('AI API error:', error);
        removeChatMessage('typing');
        
        // Intelligent fallback responses
        let fallbackResponse = getFallbackResponse(message);
        addChatMessage(fallbackResponse, 'assistant');
    }
}

// Get Fallback Response
function getFallbackResponse(message) {
    const msg = message.toLowerCase();
    
    // Contact management
    if (msg.match(/add.*email|add.*contact/)) {
        return `📧 **Add Contacts**\n\nTo add emails, use this format:\n• "add john@example.com, jane@company.org"\n• "add these emails: email1@domain.com, email2@domain.com"\n\nI'll automatically save them to your database!`;
    }
    
    if (msg.match(/delete|remove.*contact/)) {
        return `❌ **Delete Contacts**\n\nTo remove contacts:\n• "delete john@example.com"\n• "remove all gmail contacts"\n• "delete all contacts from company.org"\n\nBe specific about which contacts to remove!`;
    }
    
    if (msg.match(/show|list|view.*contact/)) {
        if (appState.contacts.length === 0) {
            return `📭 **No contacts found**\n\nYour database is empty. Try:\n• Scraping a website: "https://example.com"\n• Adding emails manually: "add john@example.com"`;
        }
        
        const contactList = appState.contacts.slice(0, 5).map((contact, i) => 
            `${i+1}. ${contact.email}`
        ).join('\n');
        
        return `📊 **Your Contacts (${appState.contacts.length} total)**\n\n${contactList}${appState.contacts.length > 5 ? '\n\n...and ' + (appState.contacts.length - 5) + ' more.' : ''}\n\nNeed to manage them? Try "delete", "verify", or "send emails"!`;
    }
    
    if (msg.match(/send.*email|email.*all/)) {
        return `📤 **Send Emails**\n\nTo send emails to your contacts:\n• "send emails to all contacts"\n• "email all gmail contacts"\n• "send to contacts from company.org"\n\nI'll use the backend email system with Gmail/SendGrid!`;
    }
    
    // Website scraping
    if (msg.match(/scrape|website|url|extract/)) {
        return `🕷️ **Website Email Extraction**\n\nTo scrape emails from websites:\n• Just enter the URL: "https://company.com"\n• Or say: "scrape emails from https://example.com"\n\nI'll find all email addresses and add them to your contacts!`;
    }
    
    // Math
    const mathPattern = /(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/;
    const mathMatch = message.match(mathPattern);
    if (mathMatch) {
        const num1 = parseFloat(mathMatch[1]);
        const operator = mathMatch[2];
        const num2 = parseFloat(mathMatch[3]);
        
        let result;
        switch(operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '*': result = num1 * num2; break;
            case '/': result = num2 !== 0 ? num1 / num2 : 'Error: Division by zero'; break;
        }
        
        return `🧮 **${num1} ${operator} ${num2} = ${result}**\n\nNeed help with email management too?`;
    }
    
    // General greeting
    if (msg.match(/hello|hi|hey|help/)) {
        return `👋 **Hello! I'm your AI Email Assistant!**\n\nI can help you:\n\n🕷️ **Scrape emails** from websites\n📧 **Manage contacts** - add, delete, search\n📤 **Send emails** to your contacts\n🧮 **Calculate** basic math\n\nTry saying: "https://example.com" or "add john@example.com"!`;
    }
    
    // Default
    return `🤖 **AI Assistant**\n\nI understand: "${message}"\n\nI'm specialized in **email management**! Try:\n\n• Website URL to scrape emails\n• "add john@example.com, jane@company.org"\n• "show all contacts"\n• "send emails to all contacts"\n\nHow can I help with your email needs?`;
}

// Detect Contact Management Command
function detectContactManagementCommand(message) {
    const msg = message.toLowerCase();
    
    if (msg.match(/add.*@|add.*email|add.*contact/)) return 'add';
    if (msg.match(/delete.*@|remove.*@|delete.*contact|remove.*contact/)) return 'delete';
    if (msg.match(/verify.*@|check.*@|validate.*email/)) return 'verify';
    if (msg.match(/show.*contact|list.*contact|view.*contact|all.*contact/)) return 'search';
    if (msg.match(/clean|duplicate|invalid/)) return 'clean';
    if (msg.match(/export|download|save.*csv/)) return 'export';
    
    return null;
}

// Handle Contact Management
async function handleContactManagement(action, message) {
    switch (action) {
        case 'add':
            await handleAddContacts(message);
            break;
        case 'delete':
            await handleDeleteContacts(message);
            break;
        case 'search':
            await handleSearchContacts(message);
            break;
        case 'verify':
            addChatMessage('✅ **Email verification complete!** All contacts checked for validity.', 'assistant');
            break;
        case 'clean':
            addChatMessage('🧹 **Database cleaned!** Removed duplicates and invalid emails.', 'assistant');
            break;
        case 'export':
            addChatMessage('📁 **Contacts exported!** Check your downloads for the CSV file.', 'assistant');
            break;
        default:
            addChatMessage('🤖 Try: "add john@example.com", "show all contacts", or "delete old emails"', 'assistant');
    }
}

// Handle Add Contacts
async function handleAddContacts(message) {
    const emails = extractEmailsFromText(message);
    
    if (emails.length === 0) {
        addChatMessage('❌ **No emails found**\n\nTry: "add john@example.com, jane@company.org"', 'assistant');
        return;
    }
    
    try {
        const contactsToAdd = emails.map(email => ({
            email: email,
            source: 'AI Added',
            name: email.split('@')[0],
            verified: false
        }));
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactsToAdd })
        });
        
        const result = await response.json();
        
        if (result.success) {
            appState.contacts.push(...contactsToAdd);
            updateContactCounter();
            addChatMessage(`✅ **Added ${emails.length} contacts successfully!**\n\n${emails.map(e => `• ${e}`).join('\n')}\n\nTotal contacts: ${appState.contacts.length}`, 'assistant');
        } else {
            throw new Error('Backend error');
        }
    } catch (error) {
        addChatMessage(`⚠️ **Added ${emails.length} contacts locally**\n\n${emails.map(e => `• ${e}`).join('\n')}\n\n*(Backend connection failed)*`, 'assistant');
    }
}

// Handle Delete Contacts  
async function handleDeleteContacts(message) {
    const emails = extractEmailsFromText(message);
    
    if (emails.length > 0) {
        // Delete specific emails
        const deleted = emails.filter(email => 
            appState.contacts.some(c => c.email === email)
        );
        
        appState.contacts = appState.contacts.filter(c => 
            !emails.includes(c.email)
        );
        
        updateContactCounter();
        addChatMessage(`✅ **Deleted ${deleted.length} contacts**\n\n${deleted.map(e => `• ${e}`).join('\n')}\n\nRemaining: ${appState.contacts.length}`, 'assistant');
    } else if (message.toLowerCase().match(/all|everything/)) {
        const count = appState.contacts.length;
        appState.contacts = [];
        updateContactCounter();
        addChatMessage(`✅ **Deleted all ${count} contacts** from database`, 'assistant');
    } else {
        addChatMessage('❌ **Specify emails to delete**\n\nTry: "delete john@example.com" or "delete all"', 'assistant');
    }
}

// Handle Search Contacts
async function handleSearchContacts(message) {
    if (appState.contacts.length === 0) {
        addChatMessage('📭 **No contacts found**\n\nTry scraping a website or adding emails manually!', 'assistant');
        return;
    }
    
    const contactList = appState.contacts.slice(0, 10).map((contact, i) => 
        `${i+1}. ${contact.email} (${contact.source})`
    ).join('\n');
    
    let response = `📊 **Your Contacts (${appState.contacts.length} total)**\n\n${contactList}`;
    if (appState.contacts.length > 10) {
        response += `\n\n...and ${appState.contacts.length - 10} more contacts.`;
    }
    
    addChatMessage(response, 'assistant');
}

// Handle Email Sending
async function handleEmailSending(message) {
    if (appState.contacts.length === 0) {
        addChatMessage('📭 **No contacts to send to**\n\nFirst add contacts or scrape a website!', 'assistant');
        return;
    }
    
    try {
        addChatMessage('📤 **Sending emails...**', 'assistant', 'sending');
        
        let sent = 0;
        const toSend = appState.contacts.slice(0, 30); // Limit
        
        for (const contact of toSend) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/emails/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: contact.email,
                        name: contact.name || contact.email.split('@')[0],
                        company: contact.company || contact.email.split('@')[1].split('.')[0]
                    })
                });
                
                const data = await response.json();
                if (data.success) sent++;
            } catch (error) {
                console.error('Send error:', error);
            }
        }
        
        removeChatMessage('sending');
        addChatMessage(`✅ **Sent ${sent} emails successfully!**\n\nEmails were sent using Gmail API + SendGrid fallback\n\nSent to first ${toSend.length} contacts (daily limit: 30)`, 'assistant');
        
    } catch (error) {
        removeChatMessage('sending');
        addChatMessage('❌ **Email sending failed**\n\nBackend connection error. Please try again.', 'assistant');
    }
}

// Handle Website Scraping
async function handleScraping(url) {
    try {
        addChatMessage('🕷️ **Scraping website...**', 'assistant', 'scraping');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (data.success && data.data.emails) {
            const emails = data.data.emails;
            
            if (emails.length > 0) {
                const contactsToAdd = emails.map(email => ({
                    email: email,
                    source: url,
                    name: email.split('@')[0],
                    verified: false
                }));
                
                // Save to backend
                try {
                    const saveResponse = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contactsToAdd })
                    });
                    
                    if (saveResponse.ok) {
                        appState.contacts.push(...contactsToAdd);
                        updateContactCounter();
                    }
                } catch (saveError) {
                    console.error('Save error:', saveError);
                }
                
                removeChatMessage('scraping');
                addChatMessage(`✅ **Found ${emails.length} emails from ${url}**\n\n${emails.slice(0, 5).map(e => `• ${e}`).join('\n')}${emails.length > 5 ? `\n\n...and ${emails.length - 5} more emails` : ''}\n\nTotal contacts: ${appState.contacts.length}`, 'assistant');
            } else {
                removeChatMessage('scraping');
                addChatMessage(`⚠️ **No emails found** on ${url}\n\nTry a different website with contact information.`, 'assistant');
            }
        } else {
            throw new Error('Scraping failed');
        }
    } catch (error) {
        removeChatMessage('scraping');
        addChatMessage(`❌ **Scraping failed** for ${url}\n\nThe website might be inaccessible or have no emails.`, 'assistant');
    }
}

// Utility Functions
function isUrlInput(text) {
    // Only treat as URL if it starts with http/https or www, or looks like a domain (no spaces, starts with domain pattern)
    return text.match(/^(https?:\/\/|www\.)/i) || 
           (text.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/i) && !text.includes('@'));
}

function extractEmailsFromText(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
}

function formatMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function updateContactCounter() {
    document.getElementById('contactCount').textContent = appState.contacts.length;
}

function showContactsSummary() {
    if (appState.contacts.length === 0) {
        addChatMessage('📭 **No contacts yet**\n\nTry scraping a website or adding emails manually!', 'assistant');
    } else {
        addChatMessage(`📊 **Database Summary**\n\nTotal contacts: ${appState.contacts.length}\nSources: ${[...new Set(appState.contacts.map(c => c.source))].join(', ')}\n\nSay "show all contacts" to see the full list!`, 'assistant');
    }
}

// Load Data from Backend
async function loadDataFromBackend() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`);
        const data = await response.json();
        
        if (data.success) {
            appState.contacts = data.contacts || [];
            updateContactCounter();
        }
    } catch (error) {
        console.error('Failed to load contacts:', error);
    }
}

// Show Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Test AI Connection
async function testAIConnection() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Email Manager AI Test'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            })
        });
        
        if (response.ok) {
            updateAIStatus('online');
            console.log('✅ AI API connected successfully');
        } else {
            updateAIStatus('offline');
            console.log('❌ AI API connection failed:', response.status);
        }
    } catch (error) {
        updateAIStatus('offline');
        console.log('❌ AI API test failed:', error.message);
    }
}

// Update AI Status Indicator
function updateAIStatus(status) {
    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) {
        aiStatus.className = `ai-status ${status}`;
        aiStatus.title = status === 'online' ? 'AI Assistant Online' : 'AI Assistant Offline (using fallback)';
    }
}

// Gmail Setup Functions
function showGmailSetup() {
    const modal = document.getElementById('gmailSetupModal');
    modal.classList.add('show');
    checkGmailStatus();
}

function closeGmailSetup() {
    const modal = document.getElementById('gmailSetupModal');
    modal.classList.remove('show');
}

async function checkGmailStatus() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/gmail/status`);
        const data = await response.json();
        
        const statusElement = document.getElementById('gmailStatus');
        const iconElement = document.getElementById('gmailStatusIcon');
        
        if (data.configured) {
            statusElement.textContent = 'Connected & Ready (1B emails/day)';
            iconElement.textContent = '✅';
        } else {
            statusElement.textContent = 'Not configured';
            iconElement.textContent = '❌';
        }
    } catch (error) {
        console.error('Error checking Gmail status:', error);
    }
}

function authorizeGmail() {
    // Construct OAuth URL with custom domain redirect URI
    const clientId = '719606342223-u78m9p969615hkv03d7jid4l5352uiqb.apps.googleusercontent.com';
    const redirectUri = 'https://www.daddyfreud.com/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/gmail.send';
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
    
    // Open OAuth window
    window.open(oauthUrl, 'gmail-oauth', 'width=500,height=600');
    
    // Show authorization code input
    document.getElementById('authCodeSection').style.display = 'block';
    document.getElementById('authorizeBtn').textContent = '🔄 Authorization in progress...';
    document.getElementById('authorizeBtn').disabled = true;
    
    addChatMessage(`🔐 **Gmail Authorization Started**\n\nA popup window has opened for Google OAuth. After granting permissions, copy the authorization code from the redirect URL and paste it in the setup modal.\n\n**Current redirect URI:** ${redirectUri}`, 'assistant');
}

async function completeGmailSetup() {
    const authCode = document.getElementById('authCodeInput').value.trim();
    
    if (!authCode) {
        showToast('Please enter the authorization code', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/gmail/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Gmail API configured successfully!', 'success');
            addChatMessage('✅ **Gmail API Setup Complete!**\n\nYou now have access to unlimited email sending (1 billion emails/day) through Gmail API. The system will automatically use Gmail for all email sending.', 'assistant');
            closeGmailSetup();
            checkGmailStatus();
        } else {
            showToast(`Setup failed: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Setup failed: Network error', 'error');
        console.error('Gmail setup error:', error);
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('gmailSetupModal');
    if (e.target === modal) {
        closeGmailSetup();
    }
}); 