import './style.css'
import config from './config.js'

// Application State
const appState = {
  contacts: [],
  isScrapingActive: false,
  settings: {
    userEmail: '',
    userName: '',
    serverUrl: config.API_BASE_URL,
    openRouterApiKey: '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'
  },
  chatMessages: [],
  isTyping: false
};

// OpenRouter API Configuration
const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'meta-llama/llama-4-scout:free',
  maxTokens: 1000
};

// Google Apps Script Template
const GOOGLE_APPS_SCRIPT_TEMPLATE = `function sendScheduledEmails() {
  const SHEET_ID = 'your-google-sheet-id';
  const EMAIL_COLUMN = 'A';
  const FROM_EMAIL = '${() => appState.settings.userEmail || 'your-email@gmail.com'}';
  const FROM_NAME = '${() => appState.settings.userName || 'Your Name'}';
  
  const EMAILS_PER_BATCH = 10;
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const emailData = sheet.getDataRange().getValues();
    const emailsToSend = emailData.slice(1, EMAILS_PER_BATCH + 1);
    
    let emailsSent = 0;
    
    for (const row of emailsToSend) {
      const email = row[0];
      const name = row[1] || 'there';
      
      if (email && email.includes('@')) {
        GmailApp.sendEmail(
          email,
          'Important Message from ' + FROM_NAME,
          \`Hello \${name},\\n\\nThis is your message.\\n\\nBest regards,\\n\${FROM_NAME}\`
        );
        emailsSent++;
        Utilities.sleep(1000);
      }
    }
    
    if (emailsSent > 0) {
      sheet.deleteRows(2, emailsSent);
      Logger.log('Sent ' + emailsSent + ' emails');
    }
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}`;

// DOM Elements
const elements = {
  messagesArea: () => document.getElementById('chatMessages'),
  urlInput: () => document.getElementById('urlInput'),
  contactsPanel: () => document.getElementById('contactsPanel'),
  contactsTable: () => document.getElementById('contactsTable'),
  contactsTableBody: () => document.getElementById('contactsTableBody'),
  emptyContactsState: () => document.getElementById('emptyContactsState'),
  configModal: () => document.getElementById('configModal'),
  scriptCode: () => document.getElementById('scriptCode'),
  userEmail: () => document.getElementById('userEmail'),
  userName: () => document.getElementById('userName'),
  toast: () => document.getElementById('toast'),
  toastMessage: () => document.getElementById('toastMessage'),
  totalContacts: () => document.getElementById('totalContacts'),
  enrichedContacts: () => document.getElementById('enrichedContacts'),
  topDomains: () => document.getElementById('topDomains')
};

// Initialize Application
function initializeApp() {
  console.log('🚀 Email Manager Pro - Conversational Interface Initialized');
  
  loadSettings();
  showEmptyState();
  updateScriptTemplate();
  updateContactsDisplay();
  updateInputPlaceholder();
  
  // Global functions
  window.triggerFileUpload = triggerFileUpload;
  window.showContactsPanel = showContactsPanel;
  window.closeContactsPanel = closeContactsPanel;
  window.showConfigModal = showConfigModal;
  window.closeConfigModal = closeConfigModal;
  window.handleInputKeydown = handleInputKeydown;
  window.handleFileUpload = handleFileUpload;
  window.copyScript = copyScript;
  window.saveConfiguration = saveConfiguration;
  window.exportContacts = exportContacts;
  window.clearContacts = clearContacts;
  window.sendExamplePrompt = sendExamplePrompt;
}

// OpenRouter API Functions
async function sendToOpenRouter(message, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an AI assistant integrated into an Email Scraper Pro application. You can help users with:
      - Email extraction and management questions
      - Website scraping guidance
      - General conversation and support
      - Google Apps Script configuration help
      
      Keep responses concise and helpful. The user is working with an email management system that can scrape websites for email addresses and manage contact lists.`
    },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    {
      role: 'user',
      content: message
    }
  ];

  try {
    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appState.settings.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Email Scraper Pro'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages: messages,
        max_tokens: OPENROUTER_CONFIG.maxTokens,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'Sorry, I encountered an error while processing your message. Please try again.';
  }
}

// Check if input is a URL or conversation
function isUrlInput(input) {
  const urlRegex = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;
  return urlRegex.test(input.trim());
}

// URL Normalization
function normalizeUrl(input) {
  if (!input || typeof input !== 'string') return '';
  
  let url = input.trim();
  
  // If it already has a protocol, return as is
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  
  // If it starts with www, add https
  if (url.match(/^www\./i)) {
    return `https://${url}`;
  }
  
  // If it looks like a domain (contains a dot), add https://www.
  if (url.includes('.') && !url.includes(' ')) {
    return `https://www.${url}`;
  }
  
  // If it doesn't look like a URL, treat it as a search term or invalid
  return `https://www.${url}`;
}

// Show Empty State
function showEmptyState() {
  const messagesArea = elements.messagesArea();
  if (!messagesArea) return;
  
  messagesArea.innerHTML = `
    <div class="empty-state">
      <span class="material-icons">smart_toy</span>
      <h2>Email Scraper Pro with AI Chat</h2>
      <p>Ask me anything about email management, or enter a website URL to extract emails.</p>
      <div class="example-prompts">
        <div class="prompt-suggestion" onclick="sendExamplePrompt('How do I use this tool?')">
          "How do I use this tool?"
        </div>
        <div class="prompt-suggestion" onclick="sendExamplePrompt('What\\'s the best way to organize my email contacts?')">
          "What's the best way to organize my email contacts?"
        </div>
      </div>
    </div>
  `;
}

// Send Example Prompt
function sendExamplePrompt(prompt) {
  const urlInput = elements.urlInput();
  if (urlInput) {
    urlInput.value = prompt;
    handleUserInput();
  }
}

// Add Chat Message
function addChatMessage(content, type = 'assistant', id = null) {
  const message = { content, type, timestamp: new Date() };
  if (id) message.id = id;
  
  appState.chatMessages.push(message);
  renderChatMessages();
  return message;
}

// Update Chat Message
function updateChatMessage(id, newContent) {
  const message = appState.chatMessages.find(m => m.id === id);
  if (message) {
    message.content = newContent;
    renderChatMessages();
  }
}

// Remove Chat Message
function removeChatMessage(id) {
  const messageIndex = appState.chatMessages.findIndex(m => m.id === id);
  if (messageIndex !== -1) {
    appState.chatMessages.splice(messageIndex, 1);
    renderChatMessages();
  }
}

// Render Chat Messages
function renderChatMessages() {
  const messagesArea = elements.messagesArea();
  if (!messagesArea) return;
  
  if (appState.chatMessages.length === 0) {
    showEmptyState();
    return;
  }
  
  messagesArea.innerHTML = '';
  
  appState.chatMessages.forEach(message => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.type}`;
    
    // Support HTML content for progress bars
    if (message.content.includes('<div class="progress-container">')) {
      messageDiv.innerHTML = message.content;
    } else {
      messageDiv.textContent = message.content;
    }
    
    messagesArea.appendChild(messageDiv);
  });
  
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Handle Input Keydown (Enter key for both chat and scraping)
function handleInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleUserInput();
  }
}

// Handle User Input (Chat or Scraping)
async function handleUserInput() {
  const urlInput = elements.urlInput();
  if (!urlInput) return;
  
  const userInput = urlInput.value.trim();
  if (!userInput) {
    showToast('Please enter a message or URL', 'error');
    return;
  }
  
  // Clear input immediately
  urlInput.value = '';
  
  // Add user message to chat
  addChatMessage(userInput, 'user');
  
  // Check if it's a URL for scraping or a conversation message
  if (isUrlInput(userInput)) {
    await handleScraping(userInput);
  } else {
    await handleConversation(userInput);
  }
}

// Handle Conversation with OpenRouter
async function handleConversation(message) {
  // Show typing indicator
  appState.isTyping = true;
  const typingMessage = addChatMessage('🤖 Thinking...', 'assistant', 'typing-indicator');
  
  try {
    // Get conversation history for context
    const conversationHistory = appState.chatMessages
      .filter(msg => msg.type === 'user' || msg.type === 'assistant')
      .filter(msg => msg.id !== 'typing-indicator')
      .filter(msg => !msg.content.includes('🕷️') && !msg.content.includes('📧') && !msg.content.includes('✅'))
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    const response = await sendToOpenRouter(message, conversationHistory);
    
    // Remove typing indicator and add real response
    removeChatMessage('typing-indicator');
    addChatMessage(response, 'assistant');
    
  } catch (error) {
    removeChatMessage('typing-indicator');
    addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    console.error('Conversation error:', error);
  } finally {
    appState.isTyping = false;
  }
}

// Handle Scraping
async function handleScraping(rawUrl) {
  const url = normalizeUrl(rawUrl);
  
  addChatMessage('🔍 Checking website accessibility...', 'assistant');
  
  try {
    // First check if website is accessible
    const healthCheck = await fetch(`${appState.settings.serverUrl}/health-check/${encodeURIComponent(url)}`);
    const healthData = await healthCheck.json();
    
    if (!healthData.accessible) {
      addChatMessage(`❌ Website is currently inaccessible: ${healthData.error || 'Connection failed'}`, 'assistant');
      addChatMessage('💡 Try these alternatives:', 'assistant');
      addChatMessage('• https://example.com (for testing)', 'assistant');
      addChatMessage('• Or upload a file with emails using the + button', 'assistant');
      return;
    }
    
    addChatMessage('✅ Website is accessible. Starting email extraction...', 'assistant');
    
    const response = await fetch(`${appState.settings.serverUrl}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data.emails && data.data.emails.length > 0) {
        const newContacts = data.data.emails.map(email => ({
          email,
          source: url,
          timestamp: new Date(),
          popularity: calculatePopularity(email)
        }));
        
        appState.contacts.push(...newContacts);
        addChatMessage(`✅ Found ${data.data.emails.length} emails! Starting enrichment...`, 'assistant');
        
        await enrichContacts(newContacts);
        updateContactsDisplay();
        showToast(`Successfully scraped ${data.data.emails.length} emails!`, 'success');
      } else {
        addChatMessage('❌ No emails found on this website', 'assistant');
        addChatMessage('💡 Try a different website or upload a file with emails', 'assistant');
      }
    } else {
      throw new Error('Scraping failed');
    }
  } catch (error) {
    addChatMessage('❌ Failed to scrape website. Using simulation mode...', 'assistant');
    simulateScraping(url);
  }
}

// Update placeholder text to reflect dual functionality
function updateInputPlaceholder() {
  const urlInput = elements.urlInput();
  if (urlInput) {
    urlInput.placeholder = 'Ask me anything or enter a website URL to scrape emails...';
  }
}

// Calculate Popularity Score
function calculatePopularity(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 0;
  
  // Popular email domains get higher scores
  const popularDomains = {
    'gmail.com': 10, 'yahoo.com': 8, 'hotmail.com': 7, 'outlook.com': 9,
    'aol.com': 6, 'icloud.com': 8, 'protonmail.com': 7, 'fastmail.com': 6
  };
  
  // Business domains get medium scores
  if (domain.includes('.gov') || domain.includes('.edu')) return 8;
  if (domain.includes('.org')) return 7;
  if (domain.includes('.com') || domain.includes('.net')) return 5;
  
  return popularDomains[domain] || Math.floor(Math.random() * 10) + 1;
}

// Get Popularity Label
function getPopularityLabel(score) {
  if (score >= 8) return { label: 'High', class: 'popularity-high' };
  if (score >= 5) return { label: 'Medium', class: 'popularity-medium' };
  return { label: 'Low', class: 'popularity-low' };
}

// Simulate Scraping
function simulateScraping(url) {
  const mockEmails = [
    'contact@example.com',
    'info@business.org',
    'hello@startup.io',
    'support@company.net'
  ];
  
  const newContacts = mockEmails.map(email => ({
    email,
    source: url,
    timestamp: new Date(),
    popularity: calculatePopularity(email)
  }));
  
  appState.contacts.push(...newContacts);
  addChatMessage(`🎯 Demo: Found ${mockEmails.length} emails!`, 'assistant');
  
  enrichContacts(newContacts);
  updateContactsDisplay();
  showToast(`Demo: Found ${mockEmails.length} emails!`, 'success');
}

// Enrich Contacts with Progress Bar
async function enrichContacts(contacts) {
  const total = contacts.length;
  const startTime = Date.now();
  
  // Add progress message
  const progressMessage = addChatMessage(
    createProgressHTML(0, total, 0, 'Initializing enrichment...'), 
    'assistant', 
    'progress-' + Date.now()
  );
  
  let enriched = 0;
  
  for (const contact of contacts) {
    const domain = contact.email.split('@')[1]?.toLowerCase();
    if (domain) {
      contact.companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      contact.isEnriched = true;
      enriched++;
    }
    
    // Update progress every contact
    const elapsed = Date.now() - startTime;
    const avgTimePerContact = elapsed / enriched;
    const remaining = total - enriched;
    const estimatedTimeLeft = Math.round((avgTimePerContact * remaining) / 1000);
    
    const percentage = Math.round((enriched / total) * 100);
    const status = estimatedTimeLeft > 0 
      ? `Enriching contacts... ~${estimatedTimeLeft}s remaining`
      : 'Finalizing enrichment...';
    
    updateChatMessage(
      progressMessage.id,
      createProgressHTML(enriched, total, percentage, status)
    );
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Final success message
  const totalEnriched = appState.contacts.filter(c => c.isEnriched).length;
  updateChatMessage(
    progressMessage.id,
    `✅ Enrichment complete! You have ${totalEnriched} enriched contacts ready.`
  );
}

// Create Progress HTML
function createProgressHTML(current, total, percentage, status) {
  return `
    <div class="progress-container">
      <div class="progress-info">
        <span>⚡ ${status}</span>
        <span>${current}/${total} (${percentage}%)</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

// Update Contacts Display
function updateContactsDisplay() {
  updateContactsStats();
  renderContactsTable();
}

// Update Contacts Stats
function updateContactsStats() {
  const totalElement = elements.totalContacts();
  const enrichedElement = elements.enrichedContacts();
  const domainsElement = elements.topDomains();
  
  if (totalElement) totalElement.textContent = appState.contacts.length;
  if (enrichedElement) enrichedElement.textContent = appState.contacts.filter(c => c.isEnriched).length;
  
  const uniqueDomains = new Set(appState.contacts.map(c => c.email.split('@')[1]?.toLowerCase()).filter(Boolean));
  if (domainsElement) domainsElement.textContent = uniqueDomains.size;
}

// Render Contacts Table
function renderContactsTable() {
  const tableBody = elements.contactsTableBody();
  const emptyState = elements.emptyContactsState();
  const table = elements.contactsTable();
  
  if (!tableBody || !emptyState || !table) return;
  
  if (appState.contacts.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  
  // Sort contacts by popularity (descending) then by date (newest first)
  const sortedContacts = [...appState.contacts].sort((a, b) => {
    if (b.popularity !== a.popularity) return b.popularity - a.popularity;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  tableBody.innerHTML = '';
  
  sortedContacts.forEach(contact => {
    const row = document.createElement('tr');
    const popularity = getPopularityLabel(contact.popularity);
    const date = new Date(contact.timestamp).toLocaleDateString();
    
    row.innerHTML = `
      <td class="email-cell">${contact.email}</td>
      <td class="company-cell">${contact.companyName || 'Unknown'}</td>
      <td class="source-cell">${contact.source}</td>
      <td class="popularity-cell">
        <span class="popularity-badge ${popularity.class}">${popularity.label}</span>
      </td>
      <td class="date-cell">${date}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Contacts Panel Functions
function showContactsPanel() {
  const panel = elements.contactsPanel();
  if (panel) {
    updateContactsDisplay();
    panel.classList.add('show');
  }
}

function closeContactsPanel() {
  const panel = elements.contactsPanel();
  if (panel) {
    panel.classList.remove('show');
  }
}

// Export Contacts
function exportContacts() {
  if (appState.contacts.length === 0) {
    showToast('No contacts to export', 'error');
    return;
  }
  
  const csvContent = [
    ['Email', 'Company', 'Source', 'Popularity', 'Date Added'].join(','),
    ...appState.contacts.map(contact => [
      contact.email,
      contact.companyName || 'Unknown',
      contact.source,
      contact.popularity,
      new Date(contact.timestamp).toISOString().split('T')[0]
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email_contacts_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Contacts exported successfully!', 'success');
}

// Clear Contacts
function clearContacts() {
  if (confirm('Are you sure you want to clear all contacts? This action cannot be undone.')) {
    appState.contacts = [];
    updateContactsDisplay();
    showToast('All contacts cleared', 'success');
  }
}

// File Upload
function triggerFileUpload() {
  const fileInput = document.getElementById('hiddenFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    addChatMessage(`📁 Processing file: ${file.name}`, 'user');
    processUploadedFile(file);
  });
}

function processUploadedFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const content = e.target.result;
    const emails = extractEmailsFromText(content);
    
    if (emails.length > 0) {
      const newContacts = emails.map(email => ({
        email,
        source: file.name,
        timestamp: new Date(),
        popularity: calculatePopularity(email)
      }));
      
      appState.contacts.push(...newContacts);
      addChatMessage(`📧 Found ${emails.length} emails in ${file.name}`, 'assistant');
      
      enrichContacts(newContacts);
      updateContactsDisplay();
      showToast(`Found ${emails.length} emails in file!`, 'success');
    } else {
      addChatMessage(`❌ No valid emails found in ${file.name}`, 'assistant');
    }
  };
  
  reader.readAsText(file);
}

// Extract Emails from Text
function extractEmailsFromText(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? [...new Set(matches)] : [];
}

// Configuration Modal
function showConfigModal() {
  const modal = elements.configModal();
  if (modal) {
    updateScriptTemplate();
    
    // Pre-fill inputs with current settings
    const emailInput = elements.userEmail();
    const nameInput = elements.userName();
    
    if (emailInput) emailInput.value = appState.settings.userEmail || '';
    if (nameInput) nameInput.value = appState.settings.userName || '';
    
    modal.classList.add('show');
  }
}

function closeConfigModal() {
  const modal = elements.configModal();
  if (modal) {
    modal.classList.remove('show');
  }
}

function saveConfiguration() {
  const emailInput = elements.userEmail();
  const nameInput = elements.userName();
  
  if (emailInput) appState.settings.userEmail = emailInput.value;
  if (nameInput) appState.settings.userName = nameInput.value;
  
  updateScriptTemplate();
  localStorage.setItem('emailManagerSettings', JSON.stringify(appState.settings));
  
  showToast('Configuration saved successfully!', 'success');
  closeConfigModal();
}

// Update Script Template
function updateScriptTemplate() {
  const scriptCode = elements.scriptCode();
  if (scriptCode) {
    scriptCode.value = GOOGLE_APPS_SCRIPT_TEMPLATE
      .replace('${() => appState.settings.userEmail || \'your-email@gmail.com\'}', appState.settings.userEmail || 'your-email@gmail.com')
      .replace('${() => appState.settings.userName || \'Your Name\'}', appState.settings.userName || 'Your Name');
  }
}

// Copy Script
async function copyScript() {
  const scriptCode = elements.scriptCode();
  if (!scriptCode) return;
  
  try {
    await navigator.clipboard.writeText(scriptCode.value);
    showToast('Google Apps Script copied to clipboard!', 'success');
  } catch (err) {
    scriptCode.select();
    document.execCommand('copy');
    showToast('Google Apps Script copied to clipboard!', 'success');
  }
}

// Show Toast
function showToast(message, type = 'success') {
  const toast = elements.toast();
  const toastMessage = elements.toastMessage();
  
  if (toast && toastMessage) {
    if (toast.hideTimeout) {
      clearTimeout(toast.hideTimeout);
    }
    
    toast.classList.remove('show');
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
      toast.classList.add('show');
      toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
        delete toast.hideTimeout;
      }, 3000);
    }, 10);
  }
}

// Utility Functions
function loadSettings() {
  const saved = localStorage.getItem('emailManagerSettings');
  if (saved) {
    try {
      appState.settings = { ...appState.settings, ...JSON.parse(saved) };
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }
}

// Start Scraping (legacy function - now redirects to handleScraping)
async function startScraping() {
  const urlInput = elements.urlInput();
  if (!urlInput) return;
  
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) {
    showToast('Please enter a website URL', 'error');
    return;
  }
  
  await handleScraping(rawUrl);
  urlInput.value = '';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}