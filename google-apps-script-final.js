/**
 * Email Manager Pro - Google Apps Script
 * Automated Email Sending via Backend API
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project
 * 2. Paste this entire code
 * 3. Update BACKEND_URL and API_KEY below
 * 4. Run setupDailyTrigger() once to set up automation
 * 5. Test with testScript() first
 */

// Configuration - UPDATE THESE VALUES
const FROM_EMAIL = 'hello@nino.news';
const FROM_NAME = 'Riki from Nino!';
const BACKEND_URL = 'https://email-manager-backend.onrender.com'; // Update this with your actual Render URL
const API_KEY = 'development-mode'; // Any value works in development mode
const DAILY_LIMIT = 30;

/**
 * Main function - sends all emails in one batch every morning at 9 AM
 * FULLY AUTOMATIC - no manual intervention needed
 */
function sendScheduledEmails() {
  const now = new Date();
  const hour = now.getHours();
  
  // Only send emails at 9 AM, Monday-Friday (Eastern Time)
  if (hour !== 9 || now.getDay() === 0 || now.getDay() === 6) {
    console.log('Not 9 AM or weekend - skipping');
    return;
  }
  
  try {
    // Try to get contacts from backend first
    let contacts = [];
    try {
      contacts = getContactsFromApp();
      console.log(`Got ${contacts.length} contacts from backend`);
    } catch (error) {
      console.log('Backend unavailable, using stored contacts');
      contacts = getStoredContacts();
    }
    
    if (!contacts || contacts.length === 0) {
      console.log('No contacts to email');
      return;
    }
    
    // Send ALL contacts (up to 30 per day)
    const contactsToSend = contacts.slice(0, DAILY_LIMIT);
    console.log(`Sending daily batch: ${contactsToSend.length} emails`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Send all emails with delays
    for (const contact of contactsToSend) {
      try {
        const success = sendPersonalizedEmail(contact);
        
        if (success) {
          successCount++;
          console.log(`✅ Sent email to ${contact.email}`);
          markContactAsSent(contact);
        } else {
          failedCount++;
          console.log(`❌ Failed to send email to ${contact.email}`);
        }
        
        // Update backend if available
        try {
          updateEmailStatus(contact.id, success ? 'sent' : 'failed');
        } catch (e) {
          console.log('Backend update failed (continuing anyway)');
        }
        
        // Wait 1-2 minutes between emails for natural sending
        const delay = Math.random() * 60000 + 60000; // 1-2 minutes
        Utilities.sleep(delay);
        
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${contact.email}:`, error);
      }
    }
    
    console.log(`📊 Daily batch complete: ${successCount} sent, ${failedCount} failed`);
    
  } catch (error) {
    console.error('Error in sendScheduledEmails:', error);
  }
}

/**
 * Get pending contacts from Email Manager Pro backend
 */
function getContactsFromApp() {
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_URL}/api/contacts/pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.contacts || [];
    } else {
      console.error('Failed to fetch contacts:', response.getResponseCode(), response.getContentText());
      return [];
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

/**
 * Update email status in Email Manager Pro
 */
function updateEmailStatus(contactId, status) {
  try {
    const payload = {
      contactId: contactId,
      status: status,
      sentAt: new Date().toISOString()
    };
    
    UrlFetchApp.fetch(`${BACKEND_URL}/api/emails/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });
    
  } catch (error) {
    console.error('Error updating email status:', error);
  }
}

/**
 * Get count of emails sent today
 */
function getEmailsSentToday() {
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_URL}/api/emails/count/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.count || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting email count:', error);
    return 0;
  }
}

/**
 * Send personalized email to contact
 */
function sendPersonalizedEmail(contact) {
  try {
    const toEmail = contact.email;
    const toName = contact.name || extractNameFromEmail(toEmail);
    const company = contact.company || extractCompanyFromEmail(toEmail);
    
    const subject = `Partnership Opportunity - ${company}`;
    
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { color: #2c3e50; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="header">Hello ${toName}!</h2>
            
            <div class="content">
              <p>I hope this email finds you well. I'm reaching out to explore potential partnership opportunities between our organizations.</p>
              
              <p>At Nino, we specialize in innovative media solutions that could complement your current offerings at ${company}. I'd love to schedule a brief 15-minute call to discuss how we might work together.</p>
              
              <p>Would you be available for a quick chat this week or next?</p>
            </div>
            
            <div class="signature">
              <p>Best regards,<br>
              <strong>Riki from Nino!</strong><br>
              <a href="mailto:hello@nino.news">hello@nino.news</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const textBody = `
Hello ${toName}!

I hope this email finds you well. I'm reaching out to explore potential partnership opportunities between our organizations.

At Nino, we specialize in innovative media solutions that could complement your current offerings at ${company}. I'd love to schedule a brief 15-minute call to discuss how we might work together.

Would you be available for a quick chat this week or next?

Best regards,
Riki from Nino!
hello@nino.news
    `;
    
    // Send the email
    GmailApp.sendEmail(
      toEmail,
      subject,
      textBody,
      {
        htmlBody: htmlBody,
        name: FROM_NAME,
        replyTo: FROM_EMAIL
      }
    );
    
    return true;
    
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Extract name from email address
 */
function extractNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const name = localPart.replace(/[._-]/g, ' ');
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Extract company from email domain
 */
function extractCompanyFromEmail(email) {
  const domain = email.split('@')[1];
  const company = domain.split('.')[0];
  return company.charAt(0).toUpperCase() + company.slice(1);
}

/**
 * Set up daily automation trigger
 * Run this function ONCE to set up automated sending
 */
function setupDailyTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendScheduledEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 9 AM Eastern Time
  ScriptApp.newTrigger('sendScheduledEmails')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  console.log('✅ Daily trigger set up! Emails will be sent every morning at 9 AM Eastern Time.');
}

/**
 * Test function - run this first to make sure everything works
 */
function testScript() {
  console.log('🧪 Testing Email Manager Pro connection...');
  
  // Test API connection
  const contacts = getContactsFromApp();
  console.log(`Found ${contacts.length} pending contacts`);
  
  // Test email count
  const emailCount = getEmailsSentToday();
  console.log(`Emails sent today: ${emailCount}`);
  
  if (contacts.length > 0) {
    console.log('Sample contact:', contacts[0]);
    
    // Uncomment to test actual email sending:
    // const success = sendPersonalizedEmail(contacts[0]);
    // console.log('Test email sent:', success);
  }
  
  console.log('✅ Test complete!');
}

/**
 * Emergency stop - delete all triggers
 */
function stopAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  console.log('🛑 All triggers stopped');
}

/**
 * Test function - send emails directly to specified contacts (bypass backend)
 */
function sendTestEmails() {
  console.log('🧪 Sending test emails directly...');
  
  // Test contacts - the ones the user specified
  const testContacts = [
    {
      id: 1,
      name: 'Riki',
      email: 'erikzahui27@gmail.com',
      company: 'Personal'
    },
    {
      id: 2,
      name: 'Zahui Varga Erik',
      email: 'nino.news.app@gmail.com',
      company: 'Nino News'
    },
    {
      id: 3,
      name: 'Kelemen Fricskás',
      email: 'fricskaskelemen@gmail.com',
      company: 'Personal'
    }
  ];
  
  console.log(`Sending emails to ${testContacts.length} test contacts`);
  
  // Send emails
  for (const contact of testContacts) {
    try {
      const success = sendPersonalizedEmail(contact);
      
      if (success) {
        console.log(`✅ Sent test email to ${contact.email}`);
      } else {
        console.log(`❌ Failed to send test email to ${contact.email}`);
      }
      
      // Wait 30 seconds between emails
      Utilities.sleep(30000);
      
    } catch (error) {
      console.error(`Error sending to ${contact.email}:`, error);
    }
  }
  
  console.log('✅ Test email batch complete!');
}

/**
 * Get stored contacts (fallback when backend unavailable)
 */
function getStoredContacts() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const storedContactsJson = properties.getProperty('STORED_CONTACTS');
    
    if (storedContactsJson) {
      return JSON.parse(storedContactsJson);
    }
    
    // Return default test contacts if none stored
    return [
      {
        id: 1,
        name: 'Riki',
        email: 'erikzahui27@gmail.com',
        company: 'Personal'
      },
      {
        id: 2,
        name: 'Zahui Varga Erik',
        email: 'nino.news.app@gmail.com',
        company: 'Nino News'
      },
      {
        id: 3,
        name: 'Kelemen Fricskás',
        email: 'fricskaskelemen@gmail.com',
        company: 'Personal'
      }
    ];
  } catch (error) {
    console.error('Error getting stored contacts:', error);
    return [];
  }
}

/**
 * Store contacts in Google Apps Script properties
 */
function storeContacts(contacts) {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('STORED_CONTACTS', JSON.stringify(contacts));
    console.log(`Stored ${contacts.length} contacts`);
  } catch (error) {
    console.error('Error storing contacts:', error);
  }
}

/**
 * Mark contact as sent (to avoid duplicates)
 */
function markContactAsSent(contact) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const sentContactsJson = properties.getProperty('SENT_CONTACTS') || '[]';
    const sentContacts = JSON.parse(sentContactsJson);
    
    sentContacts.push({
      email: contact.email,
      sentDate: new Date().toISOString()
    });
    
    properties.setProperty('SENT_CONTACTS', JSON.stringify(sentContacts));
  } catch (error) {
    console.error('Error marking contact as sent:', error);
  }
} 