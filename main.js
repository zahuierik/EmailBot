import './style.css'

// Application State
const state = {
  totalContacts: 0,
  validEmails: 0,
  emailsSentToday: 0,
  dailyLimitRemaining: 30,
  currentTab: 'home'
}

// DOM Elements
const elements = {
  totalContacts: document.getElementById('totalContacts'),
  validEmails: document.getElementById('validEmails'),
  emailsSentToday: document.getElementById('emailsSentToday'),
  dailyLimitRemaining: document.getElementById('dailyLimitRemaining'),
  urlInput: document.getElementById('urlInput'),
  modalOverlay: document.getElementById('modalOverlay'),
  modalTitle: document.getElementById('modalTitle'),
  modalContent: document.getElementById('modalContent'),
  modalAction: document.getElementById('modalAction'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
}

// Initialize the application
function init() {
  console.log('🚀 Email Manager Pro initialized!')
  updateStats()
  
  // Add some demo data after a short delay
  setTimeout(() => {
    console.log('📊 Loading demo data...')
    updateState({ 
      totalContacts: 150, 
      validEmails: 142 
    })
  }, 1000)
}

// Update application state
function updateState(newState) {
  Object.assign(state, newState)
  updateStats()
  
  // Trigger a visual update animation
  if (newState.totalContacts !== undefined || newState.validEmails !== undefined) {
    animateStatCards()
  }
}

// Update statistics display
function updateStats() {
  if (elements.totalContacts) elements.totalContacts.textContent = state.totalContacts
  if (elements.validEmails) elements.validEmails.textContent = state.validEmails
  if (elements.emailsSentToday) elements.emailsSentToday.textContent = state.emailsSentToday
  if (elements.dailyLimitRemaining) {
    const remaining = Math.max(0, state.dailyLimitRemaining - state.emailsSentToday)
    elements.dailyLimitRemaining.textContent = remaining
  }
}

// Animate stat cards when updated
function animateStatCards() {
  const statCards = document.querySelectorAll('.stat-card')
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.transform = 'scale(1.05)'
      setTimeout(() => {
        card.style.transform = 'scale(1)'
      }, 150)
    }, index * 100)
  })
}

// CSV Import Demo
window.showImportDemo = function() {
  console.log('📁 CSV Import Demo triggered')
  
  // Simulate file processing
  showModal(
    'CSV Import',
    `
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 48px; color: var(--primary);">📊</div>
        <h3 style="margin: 16px 0;">Processing CSV File...</h3>
        <div style="width: 100%; background: var(--outline-variant); border-radius: 8px; height: 8px; margin: 16px 0;">
          <div style="width: 0%; background: var(--primary); height: 100%; border-radius: 8px; transition: width 2s ease;" id="progressBar"></div>
        </div>
        <p>Validating email addresses and extracting contacts...</p>
      </div>
    `,
    null,
    false
  )
  
  // Animate progress bar
  setTimeout(() => {
    const progressBar = document.getElementById('progressBar')
    if (progressBar) {
      progressBar.style.width = '100%'
    }
  }, 100)
  
  // Show results after processing
  setTimeout(() => {
    const newContacts = Math.floor(Math.random() * 50) + 20
    updateState({ 
      totalContacts: state.totalContacts + newContacts,
      validEmails: state.validEmails + newContacts - Math.floor(Math.random() * 5)
    })
    
    closeModal()
    showModal(
      'CSV Import Complete',
      `
        <div style="text-align: center;">
          <div style="font-size: 48px; color: var(--tertiary); margin-bottom: 16px;">✅</div>
          <h3>Import Successful!</h3>
          <div style="background: var(--surface-variant); border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Contacts Imported:</span>
              <strong>${newContacts}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Valid Emails:</span>
              <strong>${newContacts - Math.floor(Math.random() * 5)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Duplicates Removed:</span>
              <strong>${Math.floor(Math.random() * 5)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Success Rate:</span>
              <strong>${Math.floor(85 + Math.random() * 10)}%</strong>
            </div>
          </div>
          <p style="color: var(--on-surface-variant); margin-top: 16px;">
            In the full version, this would parse CSV files, validate email addresses, store in SQLite database, and show detailed import results.
          </p>
        </div>
      `
    )
    
    showToast('CSV import completed successfully!')
  }, 2500)
}

// Web Scraping Demo
window.showScrapingDemo = function() {
  const url = elements.urlInput.value.trim()
  
  if (!url) {
    showToast('Please enter a URL first', 'error')
    elements.urlInput.focus()
    return
  }
  
  console.log(`🌐 Web Scraping Demo for: ${url}`)
  
  // Simulate web scraping
  showModal(
    'Web Scraping',
    `
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 48px; color: var(--secondary);">🕷️</div>
        <h3 style="margin: 16px 0;">Scraping ${url}</h3>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 0;">
          <div class="loading-spinner"></div>
          <span>Extracting email addresses...</span>
        </div>
        <p style="color: var(--on-surface-variant); font-size: 14px;">
          Using anti-detection techniques and multiple extraction methods
        </p>
      </div>
      <style>
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--outline-variant);
          border-top: 2px solid var(--secondary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `,
    null,
    false
  )
  
  // Show results after scraping
  setTimeout(() => {
    const emailsFound = Math.floor(Math.random() * 15) + 5
    updateState({ 
      totalContacts: state.totalContacts + emailsFound,
      validEmails: state.validEmails + emailsFound - Math.floor(Math.random() * 3)
    })
    
    closeModal()
    showModal(
      'Web Scraping Complete',
      `
        <div style="text-align: center;">
          <div style="font-size: 48px; color: var(--tertiary); margin-bottom: 16px;">🎯</div>
          <h3>Scraping Successful!</h3>
          <div style="background: var(--surface-variant); border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Emails Found:</span>
              <strong>${emailsFound}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Valid Formats:</span>
              <strong>${emailsFound - Math.floor(Math.random() * 3)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Source URL:</span>
              <strong style="font-size: 12px; word-break: break-all;">${url}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Processing Time:</span>
              <strong>${(Math.random() * 3 + 1).toFixed(1)}s</strong>
            </div>
          </div>
          <p style="color: var(--on-surface-variant); margin-top: 16px;">
            In the full version, this would scrape emails from web pages, use anti-detection techniques, extract contact names, and validate email formats.
          </p>
        </div>
      `
    )
    
    elements.urlInput.value = ''
    showToast(`Found ${emailsFound} email addresses!`)
  }, 3000)
}

// Simulate Email Sent
window.simulateEmailSent = function() {
  console.log('📧 Email sent simulation')
  
  updateState({ 
    emailsSentToday: state.emailsSentToday + 1 
  })
  
  showToast('Test email sent successfully!')
  
  // Add some visual feedback
  const sendIcon = document.querySelector('.action-item .material-icons')
  if (sendIcon && sendIcon.textContent === 'send') {
    sendIcon.style.color = 'var(--tertiary)'
    setTimeout(() => {
      sendIcon.style.color = ''
    }, 1000)
  }
}

// Show Configuration Demo
window.showConfigDemo = function() {
  console.log('⚙️ Configuration demo')
  
  showModal(
    'Email Configuration',
    `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">SendGrid API Key</label>
          <input type="password" placeholder="SG.xxxxxxxxxxxx" style="width: 100%; padding: 12px; border: 1px solid var(--outline-variant); border-radius: 8px; font-size: 14px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Sender Email</label>
          <input type="email" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 1px solid var(--outline-variant); border-radius: 8px; font-size: 14px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Sender Name</label>
          <input type="text" placeholder="Your Name" style="width: 100%; padding: 12px; border: 1px solid var(--outline-variant); border-radius: 8px; font-size: 14px;">
        </div>
        <div style="background: var(--primary-container); padding: 12px; border-radius: 8px; margin-top: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--on-primary-container);">
            <span class="material-icons" style="font-size: 16px;">info</span>
            <span style="font-size: 12px;">API credentials are stored securely and encrypted</span>
          </div>
        </div>
      </div>
    `,
    () => {
      console.log('💾 Configuration saved')
      showToast('Email configuration saved!')
    }
  )
}

// Refresh Data
window.refreshData = function() {
  console.log('🔄 Refreshing data...')
  
  // Add refresh animation
  const refreshBtn = document.querySelector('.refresh-btn')
  if (refreshBtn) {
    refreshBtn.style.transform = 'rotate(360deg)'
    setTimeout(() => {
      refreshBtn.style.transform = ''
    }, 500)
  }
  
  // Simulate data refresh
  setTimeout(() => {
    updateState({
      totalContacts: state.totalContacts + Math.floor(Math.random() * 5),
      validEmails: state.validEmails + Math.floor(Math.random() * 3)
    })
    showToast('Data refreshed!')
  }, 500)
}

// Tab Switching
window.switchTab = function(tab) {
  console.log(`📱 Switching to ${tab} tab`)
  
  // Update active tab
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active')
  })
  
  const activeTab = document.querySelector(`[onclick="switchTab('${tab}')"]`)
  if (activeTab) {
    activeTab.classList.add('active')
  }
  
  state.currentTab = tab
  showToast(`Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)}`)
}

// Modal Functions
function showModal(title, content, action = null, showActions = true) {
  elements.modalTitle.textContent = title
  elements.modalContent.innerHTML = content
  
  if (action) {
    elements.modalAction.onclick = () => {
      action()
      closeModal()
    }
    elements.modalAction.textContent = 'Save'
  } else {
    elements.modalAction.textContent = 'OK'
    elements.modalAction.onclick = closeModal
  }
  
  if (!showActions) {
    elements.modalAction.parentElement.style.display = 'none'
  } else {
    elements.modalAction.parentElement.style.display = 'flex'
  }
  
  elements.modalOverlay.classList.add('show')
}

window.closeModal = function() {
  elements.modalOverlay.classList.remove('show')
}

// Toast Functions
function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message
  
  if (type === 'error') {
    elements.toast.style.background = 'var(--error)'
    elements.toast.querySelector('.material-icons').textContent = 'error'
  } else {
    elements.toast.style.background = 'var(--tertiary)'
    elements.toast.querySelector('.material-icons').textContent = 'check_circle'
  }
  
  elements.toast.classList.add('show')
  
  setTimeout(() => {
    elements.toast.classList.remove('show')
  }, 3000)
}

// Real-time Updates Simulation
function startRealTimeUpdates() {
  // Simulate real-time contact additions
  setInterval(() => {
    if (Math.random() < 0.1) { // 10% chance every 5 seconds
      const newContacts = Math.floor(Math.random() * 3) + 1
      updateState({ 
        totalContacts: state.totalContacts + newContacts,
        validEmails: state.validEmails + newContacts
      })
      console.log(`📈 Real-time update: +${newContacts} contacts`)
    }
  }, 5000)
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'i':
        e.preventDefault()
        showImportDemo()
        break
      case 'w':
        e.preventDefault()
        elements.urlInput.focus()
        break
      case 'r':
        e.preventDefault()
        refreshData()
        break
    }
  }
  
  if (e.key === 'Escape') {
    closeModal()
  }
})

// Auto-focus URL input when typing
document.addEventListener('keydown', (e) => {
  if (e.target === document.body && e.key.match(/^[a-zA-Z]$/)) {
    elements.urlInput.focus()
  }
})

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  init()
  startRealTimeUpdates()
  
  console.log('🎉 Email Manager Pro is ready!')
  console.log('💡 Try these keyboard shortcuts:')
  console.log('   Ctrl+I: Import CSV')
  console.log('   Ctrl+W: Focus URL input')
  console.log('   Ctrl+R: Refresh data')
  console.log('   Esc: Close modal')
})

// Export for potential module usage
export { updateState, showToast, showModal } 