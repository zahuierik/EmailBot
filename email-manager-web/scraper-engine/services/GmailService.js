const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GmailService {
  constructor(logger) {
    this.logger = logger;
    this.gmail = null;
    this.auth = null;
    this.isAuthenticated = false;
    
    // OAuth 2.0 scopes for Gmail API
    this.SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
    
    // Credentials file path (will be created by setup)
    this.CREDENTIALS_PATH = path.join(__dirname, '../config/gmail-credentials.json');
    this.TOKEN_PATH = path.join(__dirname, '../config/gmail-token.json');
  }

  /**
   * Initialize Gmail API with OAuth authentication
   */
  async initialize() {
    try {
      // Check if credentials exist
      const credentialsExist = await this.fileExists(this.CREDENTIALS_PATH);
      if (!credentialsExist) {
        this.logger.warn('Gmail credentials not found. Please run setup first.');
        return false;
      }

      // Load client credentials
      const credentials = JSON.parse(await fs.readFile(this.CREDENTIALS_PATH));
      const { client_secret, client_id, redirect_uris } = credentials.web;

      // Create OAuth2 client
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Check if token exists
      const tokenExists = await this.fileExists(this.TOKEN_PATH);
      if (tokenExists) {
        const token = JSON.parse(await fs.readFile(this.TOKEN_PATH));
        this.auth.setCredentials(token);
        
        // Verify token is still valid
        try {
          await this.auth.getAccessToken();
          this.isAuthenticated = true;
          this.gmail = google.gmail({ version: 'v1', auth: this.auth });
          this.logger.info('✅ Gmail API initialized successfully');
          return true;
        } catch (error) {
          this.logger.warn('Gmail token expired, need re-authentication');
          return false;
        }
      }

      this.logger.warn('Gmail token not found. Please complete OAuth setup.');
      return false;
    } catch (error) {
      this.logger.error('Gmail API initialization error:', error.message);
      return false;
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl() {
    if (!this.auth) {
      throw new Error('OAuth client not initialized');
    }

    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });

    return authUrl;
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async completeAuth(code) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);

      // Save tokens for future use
      await this.ensureDirectoryExists(path.dirname(this.TOKEN_PATH));
      await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokens, null, 2));

      this.isAuthenticated = true;
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
      
      this.logger.info('✅ Gmail OAuth completed successfully');
      return true;
    } catch (error) {
      this.logger.error('Gmail OAuth error:', error.message);
      throw error;
    }
  }

  /**
   * Send email using Gmail API
   */
  async sendEmail(emailData) {
    if (!this.isAuthenticated || !this.gmail) {
      throw new Error('Gmail API not authenticated. Please complete setup first.');
    }

    try {
      const { to, subject, html, text, from, trackingId, baseUrl } = emailData;
      
      // Default sender info
      const fromAddress = from || 'hello@nino.news';
      const fromName = 'Riki from Nino!';
      
      // Add tracking pixel to HTML if provided
      let finalHtml = html;
      if (trackingId && baseUrl) {
        const trackingPixel = `<img src="${baseUrl}/track/${trackingId}" width="1" height="1" style="display:none;" alt="">`;
        finalHtml = html.replace('</div>', `${trackingPixel}</div>`);
      }

      // Create email message
      const message = this.createMimeMessage({
        from: `${fromName} <${fromAddress}>`,
        to: to,
        subject: subject,
        html: finalHtml,
        text: text
      });

      // Send email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      this.logger.info(`✅ Email sent via Gmail API to ${to}`);
      
      return {
        success: true,
        messageId: response.data.id,
        service: 'gmail-api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Gmail API send error for ${emailData.to}:`, error.message);
      throw error;
    }
  }

  /**
   * Create MIME message for Gmail API
   */
  createMimeMessage({ from, to, subject, html, text }) {
    const boundary = 'multipart_boundary_' + Date.now();
    
    let message = [
      'MIME-Version: 1.0',
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      text || this.htmlToText(html),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      '',
      `--${boundary}--`
    ].join('\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return encodedMessage;
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  htmlToText(html) {
    if (!html) return '';
    
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats() {
    try {
      if (!this.isAuthenticated) {
        return {
          authenticated: false,
          dailyLimit: 1000000000, // 1 billion
          sent: 0,
          remaining: 1000000000
        };
      }

      // In a real implementation, you'd track usage in a database
      return {
        authenticated: true,
        dailyLimit: 1000000000, // 1 billion emails/day
        sent: 0, // Would be tracked
        remaining: 1000000000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting Gmail usage stats:', error.message);
      throw error;
    }
  }

  /**
   * Check if Gmail API is properly configured
   */
  isConfigured() {
    return this.isAuthenticated;
  }

  /**
   * Get setup status and instructions
   */
  async getSetupStatus() {
    const credentialsExist = await this.fileExists(this.CREDENTIALS_PATH);
    const tokenExists = await this.fileExists(this.TOKEN_PATH);

    return {
      credentialsConfigured: credentialsExist,
      authenticated: this.isAuthenticated,
      needsSetup: !credentialsExist || !this.isAuthenticated,
      setupSteps: [
        {
          step: 1,
          title: 'Enable Gmail API',
          completed: credentialsExist,
          description: 'Download credentials from Google Cloud Console'
        },
        {
          step: 2,
          title: 'OAuth Authentication',
          completed: this.isAuthenticated,
          description: 'Complete OAuth flow to authorize sending'
        },
        {
          step: 3,
          title: 'Ready to Send',
          completed: this.isAuthenticated,
          description: '1 billion emails/day limit activated'
        }
      ]
    };
  }

  // Helper methods
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

module.exports = { GmailService }; 