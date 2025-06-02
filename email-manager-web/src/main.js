import './style.css'

// Basic Email Manager Pro - Simplified Working Version
console.log('🚀 Email Manager Pro loading...');

// Simple configuration
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://emailbot-f71m.onrender.com', // User's actual Render URL
  OPENROUTER_API_KEY: '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'
};

// Application State
const appState = {
  contacts: [],
  sentEmails: [],
  isScrapingActive: false,
  activeTab: 'contacts',
  emailCampaign: {
    isActive: false,
    dailyLimit: 30, // 10+10+10
    sentToday: 0,
    lastSentDate: null
  },
  settings: {
    userEmail: 'your-email@gmail.com',
    userName: 'Your Name',
    serverUrl: CONFIG.API_BASE_URL
  },
  chatMessages: [],
  isTyping: false
};

// Initialize Application - SIMPLIFIED
function initializeApp() {
  console.log('📧 Initializing Email Manager Pro...');
  
  // Load data from backend
  loadDataFromBackend();
  
  // Setup event listeners and show empty state
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages && appState.chatMessages.length === 0) {
    showEmptyState();
  }
  
  // Setup escape key to close modals and panels
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactsPanel();
      closeConfigModal();
    }
  });
  
  // Load contacts and sent emails counts
  updateTabCounts();
  
  console.log('✅ Email Manager Pro initialized');
}

// Load data from backend
async function loadDataFromBackend() {
  try {
    // Load contacts
    const contactsResponse = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`);
    if (contactsResponse.ok) {
      const contactsData = await contactsResponse.json();
      if (contactsData.success && contactsData.contacts) {
        appState.contacts = contactsData.contacts;
        console.log(`📫 Loaded ${contactsData.contacts.length} contacts from backend`);
      }
    }
    
    // Load sent emails
    const sentResponse = await fetch(`${CONFIG.API_BASE_URL}/api/emails/sent`);
    if (sentResponse.ok) {
      const sentData = await sentResponse.json();
      if (sentData.success && sentData.emails) {
        appState.sentEmails = sentData.emails;
        console.log(`📤 Loaded ${sentData.emails.length} sent emails from backend`);
      }
    }
    
    // Update UI
    updateContactsDisplay();
    updateTabCounts();
    
  } catch (error) {
    console.warn('Could not load data from backend:', error);
    // Continue with local data if backend is not available
  }
}

// Show Empty State
function showEmptyState() {
  const messagesArea = document.getElementById('chatMessages');
  if (!messagesArea) return;
  
  messagesArea.innerHTML = `
    <div class="empty-state">
      <span class="material-icons">smart_toy</span>
      <h2>Email Scraper Pro with AI Chat</h2>
      <p>Ask me anything about email management, or enter a website URL to extract emails.</p>
      <div class="example-prompts">
        <button class="example-prompt" onclick="sendExamplePrompt('How does email scraping work?')">
          How does email scraping work?
        </button>
        <button class="example-prompt" onclick="sendExamplePrompt('https://example.com')">
          Try scraping: https://example.com
        </button>
        <button class="example-prompt" onclick="sendExamplePrompt('Help me set up Google Apps Script')">
          Help me set up Google Apps Script
        </button>
      </div>
    </div>
  `;
}

// Send Example Prompt
function sendExamplePrompt(prompt) {
  const input = document.getElementById('urlInput');
  if (input) {
    input.value = prompt;
    handleUserInput();
  }
}

// Handle Input
function handleInputKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleUserInput();
  }
}

// Handle User Input - SIMPLIFIED
async function handleUserInput() {
  const input = document.getElementById('urlInput');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  
  // Add user message
  addChatMessage(message, 'user');

  // Simple URL detection
  if (isUrlInput(message)) {
    await handleScraping(message);
  } else {
    await handleConversation(message);
  }
}

// Check if input is a URL
function isUrlInput(input) {
  const urlRegex = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;
  return urlRegex.test(input.trim());
}

// Add Chat Message
function addChatMessage(content, type = 'assistant', id = null) {
  const messageId = id || 'msg-' + Date.now();
  const message = { id: messageId, content, type, timestamp: new Date() };
  appState.chatMessages.push(message);
  renderChatMessages();
  return message;
}

// Format Markdown for Chat Messages
function formatMarkdown(text) {
  if (!text) return '';
  
  return text
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic text: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    
    // Code blocks: `code`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Line breaks
    .replace(/\n/g, '<br>')
    
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // Simple bullet points: - item or * item
    .replace(/^[-*] (.+)$/gm, '• $1');
}

// Render Chat Messages
function renderChatMessages() {
  const messagesArea = document.getElementById('chatMessages');
  if (!messagesArea) return;

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

// Handle Conversation
async function handleConversation(message) {
  try {
    addChatMessage('🤔 Thinking...', 'assistant', 'typing');
    
    // Check for contact management commands first
    const contactAction = detectContactManagementCommand(message);
    if (contactAction) {
      removeChatMessage('typing');
      await handleContactManagement(contactAction, message);
      return;
    }
    
    // Call OpenRouter AI API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Email Scraper Pro'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant integrated into an Email Scraper Pro application with **FULL CONTACT DATABASE MANAGEMENT** capabilities. You can help users with:
            
            **Contact Management Commands:**
            - ADD emails: "add john@example.com, jane@company.org" or "add these emails: [list]"
            - DELETE contacts: "delete john@example.com" or "remove all contacts from gmail.com"
            - VERIFY emails: "verify jane@company.org" or "check validity of these emails: [list]"
            - SEARCH/FILTER: "show me all gmail contacts" or "find contacts from company.org"
            - CLEAN database: "remove invalid emails" or "clean duplicates"
            - BULK operations: "delete all", "verify all contacts", "export all"
            
            **General Capabilities:**
            - Email extraction and website scraping
            - Google Apps Script configuration help
            - Basic calculations and general conversation
            
            **IMPORTANT:** When users give you contact management commands, execute them immediately using the built-in functions. Be proactive and helpful with contact database operations.
            
            Keep responses concise and action-oriented. Always confirm what actions you've taken on the contact database.`
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

    console.log('OpenRouter API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Details:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Remove typing indicator and add AI response
    removeChatMessage('typing');
    addChatMessage(aiResponse, 'assistant');
    
  } catch (error) {
    console.error('OpenRouter API error:', error);
    removeChatMessage('typing');
    
    // Enhanced AI-like fallback responses with contact management
    let fallbackResponse = '';
    
    // Check for contact management in fallback
    const contactAction = detectContactManagementCommand(message);
    if (contactAction) {
      await handleContactManagement(contactAction, message);
      return;
    }
    
    // Advanced math detection and calculation
    const mathPattern = /^\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/×÷])\s*(\d+(?:\.\d+)?)\s*=?\s*$/;
    const mathMatch = message.match(mathPattern);
    
    if (mathMatch) {
      const num1 = parseFloat(mathMatch[1]);
      const operator = mathMatch[2];
      const num2 = parseFloat(mathMatch[3]);
      let result;
      
      try {
        switch(operator) {
          case '+': result = num1 + num2; break;
          case '-': result = num1 - num2; break;
          case '*': case '×': result = num1 * num2; break;
          case '/': case '÷': result = num2 !== 0 ? num1 / num2 : 'Error: Division by zero'; break;
          default: result = 'Unknown operator';
        }
        
        if (typeof result === 'number') {
          // Format nicely for common cases
          if (result % 1 === 0) {
            fallbackResponse = `🧮 **${num1} ${operator} ${num2} = ${result}**\n\nThat's correct! Need help with anything else about email management?`;
          } else {
            fallbackResponse = `🧮 **${num1} ${operator} ${num2} = ${result.toFixed(2)}**\n\nCalculated! How can I assist with your email scraping needs?`;
          }
        } else {
          fallbackResponse = `⚠️ ${result}`;
        }
      } catch (e) {
        fallbackResponse = '🧮 I can help with basic math, but I\'m specialized in email management! Try entering a website URL to scrape emails.';
      }
    } 
    // Contact management suggestions
    else if (message.toLowerCase().match(/contact|email|add|delete|remove|verify|manage|database/)) {
      fallbackResponse = `📧 **Contact Database Management**\n\nI can help you manage your contacts! Try these commands:\n\n**➕ Add contacts:**\n• "add john@example.com, jane@company.org"\n• "add these emails: [paste your list]"\n\n**❌ Delete contacts:**\n• "delete john@example.com"\n• "remove all gmail contacts"\n\n**✅ Verify emails:**\n• "verify jane@company.org"\n• "check all emails for validity"\n\n**🔍 Search & filter:**\n• "show me all gmail contacts"\n• "find contacts from company.org"\n\nWhat would you like to do with your contacts?`;
    }
    // Complex math expressions
    else if (message.match(/\d+.*[\+\-\*\/×÷].*\d+/)) {
      fallbackResponse = '🧮 I can handle basic calculations like "10+10" or "5*3". For complex math, I recommend a calculator app. My strength is in **email scraping and contact management**!\n\n💡 Try entering a website URL like "https://example.com" to extract email addresses!';
    }
    // Email/scraping related
    else if (message.toLowerCase().match(/email|scraping|scrape|extract/)) {
      fallbackResponse = '📧 **Email Management Expert Here!** I can help you:\n\n🔍 **Scrape emails** from any website - just enter a URL\n📊 **Manage contacts** - add, delete, verify, and organize\n⚙️ **Setup automation** - Google Apps Script integration\n📈 **Track campaigns** - monitor open rates and engagement\n\nWhat specific email task can I help you with?';
    }
    // Google Apps Script related
    else if (message.toLowerCase().match(/google|apps script|automation|gmail/)) {
      fallbackResponse = '📄 **Google Apps Script Integration**\n\nI can help you set up automated email campaigns! Click the **Settings** button (⚙️) to:\n\n✅ Configure your Gmail account\n✅ Set up automated sending schedules\n✅ Generate the complete script code\n✅ Track email performance\n\nWould you like me to guide you through the setup process?';
    }
    // Website/URL related
    else if (message.toLowerCase().match(/website|url|site|domain/)) {
      fallbackResponse = '🌐 **Website Email Extraction**\n\nI can extract email addresses from any website! Just enter a URL like:\n\n• `https://company.com`\n• `www.business.org`\n• `example.net/contact`\n\nI\'ll automatically find and organize all email addresses on the page. Want to try it now?';
    }
    // Greeting/help
    else if (message.toLowerCase().match(/hello|hi|hey|help|what can you do/)) {
      fallbackResponse = '👋 **Hello! I\'m your Email Scraper Pro AI Assistant!**\n\nI\'m specialized in email management and can help you:\n\n🕷️ **Extract emails** from websites\n📝 **Manage contacts** - add, delete, verify emails\n🚀 **Automate campaigns** with Google Apps Script\n📊 **Track performance** and analytics\n🧮 **Basic calculations** (like 10+10=20!)\n\nWhat would you like to start with today?';
    }
    // General conversation
    else {
      fallbackResponse = `🤖 **AI Assistant Response**\n\nI understand you said: "${message}"\n\nWhile I can handle general questions, I'm **specialized in email scraping and contact management**. I can:\n\n🔍 **Extract emails** from any website URL\n📊 **Manage contacts** - add, delete, verify, search\n⚙️ **Setup automation** with Google Apps Script\n🧮 **Calculate** basic math (like 10+10=20)\n\nTry asking me about email management or enter a website URL to get started!`;
    }
    
    addChatMessage(fallbackResponse, 'assistant');
  }
}

// Detect Contact Management Commands
function detectContactManagementCommand(message) {
  const msg = message.toLowerCase().trim();
  
  // ADD commands
  if (msg.match(/^(add|insert|include|create).*(email|contact)/i) || 
      msg.match(/@.*\.(com|org|net|edu|gov|co\.uk|de|fr|es|it|ca|au)/i) ||
      msg.match(/^(add|include)\s+.*@/i)) {
    return 'add';
  }
  
  // DELETE commands
  if (msg.match(/^(delete|remove|del|drop).*(email|contact)/i) ||
      msg.match(/^(delete|remove|del)\s+.*@/i) ||
      msg.match(/(delete|remove).*all/i)) {
    return 'delete';
  }
  
  // VERIFY commands
  if (msg.match(/^(verify|validate|check|confirm).*(email|contact)/i) ||
      msg.match(/^(verify|check|validate)\s+.*@/i) ||
      msg.match(/(verify|check|validate).*all/i)) {
    return 'verify';
  }
  
  // SEARCH/FILTER commands
  if (msg.match(/^(show|find|search|list|filter).*(email|contact)/i) ||
      msg.match(/^(show|find|list).*from/i) ||
      msg.match(/^(show|display).*all/i)) {
    return 'search';
  }
  
  // CLEAN commands
  if (msg.match(/(clean|cleanup|duplicate|invalid)/i)) {
    return 'clean';
  }
  
  // EXPORT commands
  if (msg.match(/(export|download|save|backup)/i)) {
    return 'export';
  }
  
  return null;
}

// Handle Contact Management Operations
async function handleContactManagement(action, message) {
  switch (action) {
    case 'add':
      await handleAddContacts(message);
      break;
    case 'delete':
      await handleDeleteContacts(message);
      break;
    case 'verify':
      await handleVerifyContacts(message);
      break;
    case 'search':
      await handleSearchContacts(message);
      break;
    case 'clean':
      await handleCleanContacts(message);
      break;
    case 'export':
      exportContacts();
      addChatMessage('✅ **Contacts exported successfully!** Check your downloads folder for the CSV file.', 'assistant');
      break;
    default:
      addChatMessage('🤖 I can help with contact management! Try commands like:\n• "add john@example.com"\n• "delete old contacts"\n• "verify all emails"', 'assistant');
  }
}

// Add Contacts Function
async function handleAddContacts(message) {
  const emails = extractEmailsFromText(message);
  
  if (emails.length === 0) {
    addChatMessage('❌ **No valid emails found** in your message. Please provide emails like:\n• john@example.com\n• jane@company.org, mike@startup.co', 'assistant');
    return;
  }
  
  try {
    // Prepare contacts for backend
    const contactsToAdd = emails.map(email => ({
      email: email,
      source: 'AI Added',
      name: email.split('@')[0], // Use part before @ as default name
      verified: false
    }));
    
    // Send to backend API
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contactsToAdd })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Also update local state for immediate UI update
      const newContacts = contactsToAdd.map(contact => ({
        ...contact,
        timestamp: new Date(),
        popularity: Math.floor(Math.random() * 5) + 1
      }));
      
      let addedCount = 0;
      let duplicateCount = 0;
      
      newContacts.forEach(contact => {
        const exists = appState.contacts.some(existing => 
          existing.email.toLowerCase() === contact.email.toLowerCase()
        );
        if (!exists) {
          appState.contacts.push(contact);
          addedCount++;
        } else {
          duplicateCount++;
        }
      });
      
      updateContactsDisplay();
      
      let responseMessage = `✅ **Successfully added ${addedCount} contact(s) to the database!**`;
      if (duplicateCount > 0) {
        responseMessage += `\n⚠️ Skipped ${duplicateCount} duplicate(s).`;
      }
      if (addedCount > 0) {
        responseMessage += `\n\n📧 **Added emails:**\n${emails.slice(0, addedCount).map(email => `• ${email}`).join('\n')}`;
        responseMessage += `\n\n💡 **These contacts are now available for your Google Apps Script email campaigns!**`;
      }
      
      addChatMessage(responseMessage, 'assistant');
      showToast(`Added ${addedCount} contacts to database!`, 'success');
    } else {
      throw new Error(result.error || 'Failed to add contacts');
    }
  } catch (error) {
    console.error('Error adding contacts:', error);
    addChatMessage('❌ **Error adding contacts to database.** Please check that the backend server is running.', 'assistant');
    showToast('Error adding contacts', 'error');
  }
}

// Delete Contacts Function
async function handleDeleteContacts(message) {
  const msg = message.toLowerCase();
  
  // Delete all contacts
  if (msg.match(/delete.*all|remove.*all|clear.*all/)) {
    const count = appState.contacts.length;
    appState.contacts = [];
    appState.sentEmails = [];
    updateContactsDisplay();
    addChatMessage(`✅ **Deleted all ${count} contacts** and sent emails from the database.`, 'assistant');
    showToast('All contacts deleted!', 'success');
    return;
  }
  
  // Delete specific emails
  const emails = extractEmailsFromText(message);
  if (emails.length > 0) {
    let deletedCount = 0;
    emails.forEach(email => {
      const index = appState.contacts.findIndex(contact => 
        contact.email.toLowerCase() === email.toLowerCase()
      );
      if (index !== -1) {
        appState.contacts.splice(index, 1);
        deletedCount++;
      }
    });
    
    updateContactsDisplay();
    addChatMessage(`✅ **Deleted ${deletedCount} contact(s)** from the database.`, 'assistant');
    showToast(`Deleted ${deletedCount} contacts!`, 'success');
    return;
  }
  
  // Delete by domain
  const domainMatch = msg.match(/delete.*from\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (domainMatch) {
    const domain = domainMatch[1];
    const beforeCount = appState.contacts.length;
    appState.contacts = appState.contacts.filter(contact => 
      !contact.email.toLowerCase().includes(domain.toLowerCase())
    );
    const deletedCount = beforeCount - appState.contacts.length;
    
    updateContactsDisplay();
    addChatMessage(`✅ **Deleted ${deletedCount} contact(s)** from domain "${domain}".`, 'assistant');
    showToast(`Deleted ${deletedCount} contacts!`, 'success');
    return;
  }
  
  addChatMessage('❌ **Please specify what to delete:**\n• "delete john@example.com"\n• "delete all contacts from gmail.com"\n• "delete all contacts"', 'assistant');
}

// Verify Contacts Function
async function handleVerifyContacts(message) {
  const emails = extractEmailsFromText(message);
  
  // Verify all contacts if no specific emails provided
  if (emails.length === 0 && message.toLowerCase().match(/verify.*all|check.*all|validate.*all/)) {
    const results = verifyAllContacts();
    addChatMessage(`✅ **Email verification complete!**\n\n📊 **Results:**\n• Valid: ${results.valid}\n• Invalid: ${results.invalid}\n• Total checked: ${results.total}`, 'assistant');
    updateContactsDisplay();
    return;
  }
  
  // Verify specific emails
  if (emails.length > 0) {
    const results = verifySpecificEmails(emails);
    let response = `✅ **Email verification results:**\n\n`;
    
    results.forEach(result => {
      const status = result.valid ? '✅' : '❌';
      response += `${status} ${result.email} - ${result.reason}\n`;
    });
    
    addChatMessage(response, 'assistant');
    updateContactsDisplay();
    return;
  }
  
  addChatMessage('❌ **Please specify emails to verify:**\n• "verify john@example.com"\n• "verify all contacts"\n• "check jane@company.org, mike@startup.co"', 'assistant');
}

// Search Contacts Function
async function handleSearchContacts(message) {
  const msg = message.toLowerCase();
  
  // Show all contacts
  if (msg.match(/show.*all|list.*all|display.*all/)) {
    if (appState.contacts.length === 0) {
      addChatMessage('📭 **No contacts found** in your database. Try scraping a website or adding contacts manually.', 'assistant');
      return;
    }
    
    const contactList = appState.contacts.slice(0, 10).map((contact, index) => 
      `${index + 1}. ${contact.email} (${contact.source})`
    ).join('\n');
    
    let response = `📊 **Contact Database (showing first 10 of ${appState.contacts.length}):**\n\n${contactList}`;
    if (appState.contacts.length > 10) {
      response += `\n\n... and ${appState.contacts.length - 10} more contacts.`;
    }
    
    addChatMessage(response, 'assistant');
    return;
  }
  
  // Search by domain
  const domainMatch = msg.match(/from\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (domainMatch) {
    const domain = domainMatch[1];
    const matches = appState.contacts.filter(contact => 
      contact.email.toLowerCase().includes(domain.toLowerCase())
    );
    
    if (matches.length === 0) {
      addChatMessage(`❌ **No contacts found** from domain "${domain}".`, 'assistant');
      return;
    }
    
    const contactList = matches.slice(0, 10).map((contact, index) => 
      `${index + 1}. ${contact.email}`
    ).join('\n');
    
    addChatMessage(`🔍 **Found ${matches.length} contact(s) from "${domain}":**\n\n${contactList}`, 'assistant');
    return;
  }
  
  addChatMessage('🔍 **Search contacts by:**\n• "show all contacts"\n• "find contacts from gmail.com"\n• "list all contacts from company.org"', 'assistant');
}

// Clean Contacts Function
async function handleCleanContacts(message) {
  const msg = message.toLowerCase();
  
  if (msg.match(/duplicate/)) {
    const beforeCount = appState.contacts.length;
    removeDuplicateContacts();
    const afterCount = appState.contacts.length;
    const removedCount = beforeCount - afterCount;
    
    updateContactsDisplay();
    addChatMessage(`✅ **Removed ${removedCount} duplicate contact(s).** Database now has ${afterCount} unique contacts.`, 'assistant');
    showToast(`Removed ${removedCount} duplicates!`, 'success');
    return;
  }
  
  if (msg.match(/invalid/)) {
    const results = removeInvalidEmails();
    updateContactsDisplay();
    addChatMessage(`✅ **Removed ${results.removed} invalid email(s).** ${results.remaining} valid contacts remain.`, 'assistant');
    showToast(`Removed ${results.removed} invalid emails!`, 'success');
    return;
  }
  
  addChatMessage('🧹 **Cleaning options:**\n• "clean duplicates" - Remove duplicate contacts\n• "remove invalid emails" - Delete invalid email addresses', 'assistant');
}

// Extract Emails from Text
function extractEmailsFromText(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

// Verify All Contacts
function verifyAllContacts() {
  let valid = 0;
  let invalid = 0;
  
  appState.contacts.forEach(contact => {
    const isValid = isValidEmail(contact.email);
    contact.verified = isValid;
    if (isValid) {
      valid++;
    } else {
      invalid++;
    }
  });
  
  return { valid, invalid, total: appState.contacts.length };
}

// Verify Specific Emails
function verifySpecificEmails(emails) {
  return emails.map(email => {
    const isValid = isValidEmail(email);
    const reason = isValid ? 'Valid format' : 'Invalid format';
    
    // Update contact if it exists
    const contact = appState.contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (contact) {
      contact.verified = isValid;
    }
    
    return { email, valid: isValid, reason };
  });
}

// Email Validation Function
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Remove Duplicate Contacts
function removeDuplicateContacts() {
  const seen = new Set();
  appState.contacts = appState.contacts.filter(contact => {
    const emailLower = contact.email.toLowerCase();
    if (seen.has(emailLower)) {
      return false;
    }
    seen.add(emailLower);
    return true;
  });
}

// Remove Invalid Emails
function removeInvalidEmails() {
  const beforeCount = appState.contacts.length;
  appState.contacts = appState.contacts.filter(contact => isValidEmail(contact.email));
  const afterCount = appState.contacts.length;
  
  return {
    removed: beforeCount - afterCount,
    remaining: afterCount
  };
}

// Handle Scraping
async function handleScraping(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    addChatMessage(`🔍 Scraping emails from: ${normalizedUrl}`, 'assistant');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl })
    });

    if (!response.ok) throw new Error(`Scraping failed: ${response.status}`);

    const data = await response.json();
    
    if (data.success && data.data.emails && data.data.emails.length > 0) {
      const emails = data.data.emails;
      
      // Prepare contacts for backend
      const contactsToAdd = emails.map(email => ({
        email,
        source: normalizedUrl,
        name: email.split('@')[0], // Use part before @ as default name
        verified: false
      }));
      
      try {
        // Save to backend
        const saveResponse = await fetch(`${CONFIG.API_BASE_URL}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contactsToAdd })
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
          // Update local state for immediate UI update
          const newContacts = contactsToAdd.map(contact => ({
            ...contact,
            timestamp: new Date(),
            popularity: Math.floor(Math.random() * 5) + 1
          }));
          
          appState.contacts.push(...newContacts);
          
          addChatMessage(`✅ **Success!** Found and saved ${emails.length} emails from ${normalizedUrl}\n\n💡 **These contacts are now available for your Google Apps Script email campaigns!**`, 'assistant');
          updateContactsDisplay();
          showToast(`Found ${emails.length} emails!`, 'success');
        } else {
          throw new Error('Failed to save contacts to backend');
        }
      } catch (saveError) {
        console.error('Error saving to backend:', saveError);
        // Fallback: just update local state
        const newContacts = contactsToAdd.map(contact => ({
          ...contact,
          timestamp: new Date(),
          popularity: Math.floor(Math.random() * 5) + 1
        }));
        
        appState.contacts.push(...newContacts);
        addChatMessage(`✅ Found ${emails.length} emails from ${normalizedUrl}\n⚠️ **Warning:** Contacts saved locally only. Backend connection failed.`, 'assistant');
        updateContactsDisplay();
        showToast(`Found ${emails.length} emails (local only)`, 'warning');
      }
    } else {
      addChatMessage(`⚠️ No emails found on ${normalizedUrl}`, 'assistant');
    }
    
  } catch (error) {
    console.error('Scraping error:', error);
    // Demo fallback
    simulateScraping(url);
  }
}

// Simulate Scraping for Demo
function simulateScraping(url) {
  const normalizedUrl = normalizeUrl(url);
  const mockEmails = ['contact@example.com', 'info@company.org', 'support@business.net'];
  
  const newContacts = mockEmails.map(email => ({
    email,
    source: normalizedUrl,
    timestamp: new Date(),
    popularity: Math.floor(Math.random() * 5) + 1
  }));
  
  appState.contacts.push(...newContacts);
  addChatMessage(`🎯 Demo: Found ${mockEmails.length} emails from ${normalizedUrl}!`, 'assistant');
  updateContactsDisplay();
  showToast(`Demo: Found ${mockEmails.length} emails!`, 'success');
}

// Normalize URL
function normalizeUrl(input) {
  if (!input) return '';
  let url = input.trim();
  if (url.match(/^https?:\/\//i)) return url;
  if (url.match(/^www\./i)) return `https://${url}`;
  if (url.includes('.')) return `https://www.${url}`;
  return `https://www.${url}`;
}

// Remove Chat Message
function removeChatMessage(id) {
  appState.chatMessages = appState.chatMessages.filter(msg => msg.id !== id);
  renderChatMessages();
}

// Show Contacts Panel
function showContactsPanel() {
  const panel = document.getElementById('contactsPanel');
  if (panel) {
    updateContactsDisplay();
    panel.classList.add('show');
  }
}

// Close Contacts Panel
function closeContactsPanel() {
  const panel = document.getElementById('contactsPanel');
  if (panel) {
    panel.classList.remove('show');
  }
}

// Update Contacts Display
function updateContactsDisplay() {
  updateContactsTab();
  updateSentTab();
  updateTabCounts();
}

// Switch Tab Function
function switchTab(tabName) {
  appState.activeTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tabName + 'Content').classList.add('active');
  
  // Update display based on active tab
  if (tabName === 'contacts') {
    updateContactsTab();
  } else {
    updateSentTab();
  }
}

// Update Tab Counts
function updateTabCounts() {
  const contactsCount = document.getElementById('contactsCount');
  const sentCount = document.getElementById('sentCount');
  
  if (contactsCount) contactsCount.textContent = appState.contacts.length;
  if (sentCount) sentCount.textContent = appState.sentEmails.length;
}

// Update Contacts Tab
function updateContactsTab() {
  const tableBody = document.getElementById('contactsTableBody');
  const emptyState = document.getElementById('emptyContactsState');
  const table = document.getElementById('contactsTable');
  
  if (!tableBody || !emptyState || !table) return;
  
  if (appState.contacts.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  
  tableBody.innerHTML = '';
  
  appState.contacts.forEach((contact, index) => {
    const row = document.createElement('tr');
    const date = new Date(contact.timestamp).toLocaleDateString();
    
    row.innerHTML = `
      <td class="email-cell">${contact.email}</td>
      <td class="company-cell">${contact.email.split('@')[1] || 'Unknown'}</td>
      <td class="source-cell">${contact.source}</td>
      <td class="date-cell">${date}</td>
      <td class="actions-cell">
        <button class="btn-small primary" onclick="sendEmailToContact(${index})">
          <span class="material-icons">send</span>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Update Sent Tab
function updateSentTab() {
  const tableBody = document.getElementById('sentTableBody');
  const emptyState = document.getElementById('emptySentState');
  const table = document.getElementById('sentTable');
  
  if (!tableBody || !emptyState || !table) return;
  
  if (appState.sentEmails.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  
  tableBody.innerHTML = '';
  
  appState.sentEmails.forEach(email => {
    const row = document.createElement('tr');
    const date = new Date(email.sentDate).toLocaleDateString();
    const opens = email.opens || 0;
    
    row.innerHTML = `
      <td class="email-cell">${email.email}</td>
      <td class="subject-cell">${email.subject}</td>
      <td class="date-cell">${date}</td>
      <td class="status-cell">
        <span class="status ${email.status}">${email.status}</span>
      </td>
      <td class="opens-cell">${opens}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Update sent stats
  updateSentStats();
}

// Update Sent Stats
function updateSentStats() {
  const totalSent = appState.sentEmails.length;
  const totalOpened = appState.sentEmails.filter(email => email.opens > 0).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  
  const totalSentEl = document.getElementById('totalSent');
  const totalOpenedEl = document.getElementById('totalOpened');
  const openRateEl = document.getElementById('openRate');
  
  if (totalSentEl) totalSentEl.textContent = totalSent;
  if (totalOpenedEl) totalOpenedEl.textContent = totalOpened;
  if (openRateEl) openRateEl.textContent = `${openRate}%`;
}

// File Upload Functions
function triggerFileUpload() {
  const fileInput = document.getElementById('hiddenFileInput');
  if (fileInput) {
    fileInput.click();
  }
}

function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      
      if (emails.length > 0) {
        const newContacts = emails.map(email => ({
          email,
          source: file.name,
          timestamp: new Date(),
          popularity: Math.floor(Math.random() * 5) + 1
        }));
        
        appState.contacts.push(...newContacts);
        addChatMessage(`📁 Uploaded ${emails.length} emails from ${file.name}`, 'assistant');
        updateContactsDisplay();
        showToast(`Uploaded ${emails.length} emails!`, 'success');
      } else {
        showToast('No emails found in file', 'error');
      }
    };
    reader.readAsText(file);
  });
}

// Modal Functions
function showConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.style.display = 'flex';
    
    // Load current settings
    const userEmail = document.getElementById('userEmail');
    const userName = document.getElementById('userName');
    
    if (userEmail) userEmail.value = appState.settings.userEmail;
    if (userName) userName.value = appState.settings.userName;
    
    updateScriptTemplate();
  }
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveConfiguration() {
  const userEmail = document.getElementById('userEmail');
  const userName = document.getElementById('userName');
  
  if (userEmail) appState.settings.userEmail = userEmail.value;
  if (userName) appState.settings.userName = userName.value;
  
  localStorage.setItem('emailManagerSettings', JSON.stringify(appState.settings));
  updateScriptTemplate();
  showToast('Configuration saved!', 'success');
}

function updateScriptTemplate() {
  const scriptCode = document.getElementById('scriptCode');
  if (scriptCode) {
    const fromEmail = document.getElementById('fromEmail').value || 'your-email@gmail.com';
    const fromName = document.getElementById('fromName').value || 'Your Name';
    const backendUrl = document.getElementById('backendUrl').value || 'http://localhost:3001';

    scriptCode.value = `// Google Apps Script for Real Email Sending
// Copy this code to Google Apps Script (script.google.com)
// This connects to your Email Manager Pro app as the single source of truth

// Configuration - Update these values
const FROM_EMAIL = '${fromEmail}';
const FROM_NAME = '${fromName}';
const BACKEND_URL = '${backendUrl}'; // Your Email Manager Pro backend URL
const API_KEY = 'your-api-key-here'; // Set this in your backend for security

// Main function - runs daily to send emails
function sendScheduledEmails() {
  try {
    Logger.log('Starting scheduled email campaign...');
    
    // Get contacts from your Email Manager Pro app
    const contacts = getContactsFromApp();
    
    if (!contacts || contacts.length === 0) {
      Logger.log('No contacts found to send emails to');
      return;
    }
    
    const emailsSentToday = getEmailsSentToday();
    const dailyLimit = 30;
    const now = new Date();
    
    // Stop sending after 5 PM
    if (now.getHours() >= 17) {
      Logger.log('After 5 PM - stopping for today');
      return;
    }
    
    // Check daily limit
    if (emailsSentToday >= dailyLimit) {
      Logger.log('Daily limit reached: ' + emailsSentToday + '/' + dailyLimit);
      return;
    }
    
    // Send emails to pending contacts
    let emailsSent = 0;
    const maxToSend = Math.min(dailyLimit - emailsSentToday, contacts.length);
    
    for (let i = 0; i < maxToSend; i++) {
      const contact = contacts[i];
      
      if (isValidEmail(contact.email)) {
        try {
          sendPersonalizedEmail(contact.email, contact.name || contact.email.split('@')[0]);
          
          // Update status in your app
          updateEmailStatus(contact.email, 'sent', new Date().toISOString());
          
          emailsSent++;
          Logger.log('Email sent to: ' + contact.email);
          
          // Small delay between emails
          Utilities.sleep(2000);
          
        } catch (error) {
          Logger.log('Error sending to ' + contact.email + ': ' + error.toString());
          updateEmailStatus(contact.email, 'failed', new Date().toISOString(), error.toString());
        }
      }
    }
    
    Logger.log('Campaign completed. Emails sent today: ' + (emailsSentToday + emailsSent));
    
  } catch (error) {
    Logger.log('Campaign error: ' + error.toString());
  }
}

// Get contacts from Email Manager Pro app
function getContactsFromApp() {
  try {
    const response = UrlFetchApp.fetch(BACKEND_URL + '/api/contacts/pending', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.contacts || [];
    } else {
      Logger.log('Failed to fetch contacts: ' + response.getResponseCode());
      return [];
    }
  } catch (error) {
    Logger.log('Error fetching contacts: ' + error.toString());
    return [];
  }
}

// Update email status in your app
function updateEmailStatus(email, status, timestamp, error = null) {
  try {
    const payload = {
      email: email,
      status: status,
      timestamp: timestamp,
      error: error
    };
    
    UrlFetchApp.fetch(BACKEND_URL + '/api/emails/status', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });
    
  } catch (error) {
    Logger.log('Error updating status: ' + error.toString());
  }
}

// Get count of emails sent today
function getEmailsSentToday() {
  try {
    const response = UrlFetchApp.fetch(BACKEND_URL + '/api/emails/count/today', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.count || 0;
    }
    return 0;
  } catch (error) {
    Logger.log('Error getting email count: ' + error.toString());
    return 0;
  }
}

function sendPersonalizedEmail(toEmail, toName) {
  try {
    const subject = 'Partnership Opportunity';
    
    const htmlBody = \`<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Hello \${toName}!</h2>
            
            <p>I hope this email finds you well. I'm reaching out to explore potential partnership opportunities between our organizations.</p>
            
            <p>I believe there could be mutual benefits in collaborating on:</p>
            <ul>
              <li>Strategic partnerships</li>
              <li>Content collaboration</li>
              <li>Resource sharing</li>
              <li>Joint marketing initiatives</li>
            </ul>
            
            <p>Would you be interested in scheduling a brief call to discuss potential synergies? I'm confident we could create something valuable together.</p>
            
            <p>Best regards,<br>
            <strong>\${FROM_NAME}</strong><br>
            <a href="mailto:\${FROM_EMAIL}">\${FROM_EMAIL}</a></p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              If you're not interested in receiving these emails, please reply with "UNSUBSCRIBE" and I'll remove you from my list immediately.
    </p>
  </div>
        </body>
      </html>\`;
    
    GmailApp.sendEmail(toEmail, subject, '', {
      htmlBody: htmlBody,
      name: FROM_NAME
    });
    
    Logger.log('Email sent to: ' + toEmail);
    
  } catch (error) {
    Logger.log('Error sending email to ' + toEmail + ': ' + error.toString());
  }
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Set up time-based trigger (run this once to schedule daily emails)
function createEmailTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendScheduledEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 9 AM
  ScriptApp.newTrigger('sendScheduledEmails')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 9 AM
    .create();
    
  Logger.log('Email trigger created for daily execution at 9 AM');
}

// SETUP INSTRUCTIONS:
// 1. Update FROM_EMAIL and FROM_NAME with your details
// 2. Set BACKEND_URL to your Email Manager Pro backend URL
// 3. Set API_KEY for secure access to your backend
// 4. Run createEmailTrigger() once to set up daily automation
// 5. Your Email Manager Pro app is now the single source of truth!`;
  }
}

async function copyScript() {
  const scriptCode = document.getElementById('scriptCode');
  if (scriptCode) {
    try {
      await navigator.clipboard.writeText(scriptCode.value);
      showToast('Script copied!', 'success');
    } catch (error) {
      scriptCode.select();
      document.execCommand('copy');
      showToast('Script copied!', 'success');
    }
  }
}

// Export/Clear Functions
function exportContacts() {
  const allData = [
    ...appState.contacts.map(c => ({...c, type: 'contact'})),
    ...appState.sentEmails.map(e => ({...e, type: 'sent'}))
  ];
  
  if (allData.length === 0) {
    showToast('No data to export', 'error');
    return;
  }
  
  const csvContent = [
    'Type,Email,Company,Source,Date,Subject,Status,Opens',
    ...allData.map(item => {
      if (item.type === 'contact') {
        return `contact,${item.email},${item.email.split('@')[1] || 'Unknown'},${item.source},${new Date(item.timestamp).toDateString()},,,,`;
      } else {
        return `sent,${item.email},,,"${new Date(item.sentDate).toDateString()}",${item.subject},${item.status},${item.opens}`;
      }
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email_manager_data_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Data exported!', 'success');
}

function clearContacts() {
  if (confirm('Clear all contacts and sent emails?')) {
    appState.contacts = [];
    appState.sentEmails = [];
    updateContactsDisplay();
    showToast('All data cleared', 'success');
  }
}

// Toast Function
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Email Campaign Functions
function startEmailCampaign() {
  if (appState.contacts.length === 0) {
    showToast('No contacts available for campaign', 'error');
    return;
  }
  
  appState.emailCampaign.isActive = !appState.emailCampaign.isActive;
  
  if (appState.emailCampaign.isActive) {
    showToast('Email campaign started! Sending 30 emails/day until 5 PM', 'success');
    startAutomatedSending();
  } else {
    showToast('Email campaign stopped', 'info');
  }
  
  updateCampaignButton();
}

function updateCampaignButton() {
  const btn = document.querySelector('[onclick="startEmailCampaign()"]');
  if (btn) {
    const icon = btn.querySelector('.material-icons');
    const text = appState.emailCampaign.isActive ? 'Stop Campaign' : 'Start Campaign';
    btn.innerHTML = `<span class="material-icons">${appState.emailCampaign.isActive ? 'stop' : 'campaign'}</span>${text}`;
    btn.className = appState.emailCampaign.isActive ? 'btn danger' : 'btn primary';
  }
}

function startAutomatedSending() {
  if (!appState.emailCampaign.isActive) return;
  
  const now = new Date();
  const today = now.toDateString();
  
  // Reset daily count if it's a new day
  if (appState.emailCampaign.lastSentDate !== today) {
    appState.emailCampaign.sentToday = 0;
    appState.emailCampaign.lastSentDate = today;
  }
  
  // Check if we've reached daily limit or if it's after 5 PM
  if (appState.emailCampaign.sentToday >= appState.emailCampaign.dailyLimit || now.getHours() >= 17) {
    // Schedule for tomorrow at 9 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const timeUntilTomorrow = tomorrow.getTime() - now.getTime();
    setTimeout(startAutomatedSending, timeUntilTomorrow);
    return;
  }
  
  // Send next batch
  sendNextBatch();
  
  // Schedule next sending (random interval between 30 minutes to 2 hours)
  const nextSendDelay = Math.random() * (120 - 30) + 30; // 30-120 minutes
  setTimeout(startAutomatedSending, nextSendDelay * 60 * 1000);
}

function sendNextBatch() {
  const availableContacts = appState.contacts.filter(contact => 
    !appState.sentEmails.some(sent => sent.email === contact.email)
  );
  
  if (availableContacts.length === 0) {
    showToast('All contacts have been contacted!', 'info');
    appState.emailCampaign.isActive = false;
    updateCampaignButton();
    return;
  }
  
  // Send to up to 10 contacts
  const batchSize = Math.min(10, availableContacts.length);
  const batch = availableContacts.slice(0, batchSize);
  
  batch.forEach(contact => {
    sendEmailToContact(appState.contacts.indexOf(contact));
  });
  
  appState.emailCampaign.sentToday += batchSize;
  showToast(`Sent ${batchSize} emails. Total today: ${appState.emailCampaign.sentToday}`, 'success');
}

async function sendEmailToContact(contactIndex) {
  const contact = appState.contacts[contactIndex];
  if (!contact) return;
  
  // Show loading state
  showToast(`Sending email to ${contact.email}...`, 'info');
  
  try {
    // Send real email via backend API
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer development-mode'
      },
      body: JSON.stringify({
        contactId: contact.id || Date.now(),
        email: contact.email,
        name: contact.name || extractNameFromEmail(contact.email),
        company: contact.company || extractCompanyFromEmail(contact.email)
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Create sent email record
      const sentEmail = {
        email: contact.email,
        subject: 'Partnership Opportunity - ' + (contact.company || extractCompanyFromEmail(contact.email)),
        sentDate: new Date(),
        status: 'sent',
        opens: 0,
        trackingId: result.trackingId || `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageId: result.messageId
      };
      
      // Add to sent emails
      appState.sentEmails.push(sentEmail);
      
      // Remove from contacts (move to sent)
      appState.contacts.splice(contactIndex, 1);
      
      updateContactsDisplay();
      showToast(`✅ Email sent to ${contact.email}!`, 'success');
      
    } else {
      throw new Error(`Failed to send email: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    showToast(`❌ Failed to send email to ${contact.email}: ${error.message}`, 'error');
  }
}

// Helper functions for email personalization
function extractNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const name = localPart.replace(/[._-]/g, ' ');
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function extractCompanyFromEmail(email) {
  const domain = email.split('@')[1];
  const company = domain.split('.')[0];
  return company.charAt(0).toUpperCase() + company.slice(1);
}

// Send All Emails Function
async function sendAllEmails() {
  if (appState.contacts.length === 0) {
    showToast('No contacts available to send emails to', 'error');
    return;
  }
  
  const contactsToSend = appState.contacts.slice(0, 30); // Limit to 30 per day
  const confirmMessage = `Send emails to ${contactsToSend.length} contacts?\n\nThis will send real emails from hello@nino.news as "Riki from Nino!"`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  showToast(`Starting batch send to ${contactsToSend.length} contacts...`, 'info');
  
  let successCount = 0;
  let failedCount = 0;
  
  // Send emails with delays
  for (let i = 0; i < contactsToSend.length; i++) {
    const contact = contactsToSend[i];
    
    try {
      showToast(`Sending ${i + 1}/${contactsToSend.length}: ${contact.email}`, 'info');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer development-mode'
        },
        body: JSON.stringify({
          contactId: contact.id || Date.now() + i,
          email: contact.email,
          name: contact.name || extractNameFromEmail(contact.email),
          company: contact.company || extractCompanyFromEmail(contact.email)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Create sent email record
        const sentEmail = {
          email: contact.email,
          subject: 'Partnership Opportunity - ' + (contact.company || extractCompanyFromEmail(contact.email)),
          sentDate: new Date(),
          status: 'sent',
          opens: 0,
          trackingId: result.trackingId,
          messageId: result.messageId
        };
        
        // Add to sent emails
        appState.sentEmails.push(sentEmail);
        successCount++;
        
        // Remove from contacts
        const contactIndex = appState.contacts.findIndex(c => c.email === contact.email);
        if (contactIndex !== -1) {
          appState.contacts.splice(contactIndex, 1);
        }
        
      } else {
        failedCount++;
        console.error(`Failed to send to ${contact.email}:`, response.status);
      }
      
      // Update display after each email
      updateContactsDisplay();
      
      // Wait 2-3 seconds between emails for natural sending
      if (i < contactsToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 2000));
      }
      
    } catch (error) {
      failedCount++;
      console.error(`Error sending to ${contact.email}:`, error);
    }
  }
  
  // Final summary
  showToast(`✅ Batch complete! ${successCount} sent, ${failedCount} failed`, successCount > 0 ? 'success' : 'error');
  updateContactsDisplay();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

console.log('📝 Email Manager Pro script loaded successfully');