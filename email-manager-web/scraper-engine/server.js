const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const winston = require('winston');
const sgMail = require('@sendgrid/mail');
const { EmailSpider } = require('./spiders/EmailSpider');
const { ProxyManager } = require('./core/ProxyManager');
const { RateLimiter } = require('./core/RateLimiter');
const { ScrapingEngine } = require('./core/ScrapingEngine');
const axios = require('axios');

// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-scraper-pro' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Cluster setup for production (like Scrapy's concurrent request handling)
const numCPUs = os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker process
  const app = express();
  const PORT = process.env.PORT || 10000; // Render.com default port is 10000

  // Security and performance middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:5176',
        'https://email-scraper-pro.vercel.app',
        'https://email-scraper-pro-git-main-rikis-projects-6e4b52d3.vercel.app',
        'https://email-scraper-pro-rikis-projects-6e4b52d3.vercel.app',
        'https://email-scraper-6zmgh0npv-rikis-projects-6e4b52d3.vercel.app',
        'https://email-scraper-i4nomsj5b-rikis-projects-6e4b52d3.vercel.app'
      ];
      
      // Add dynamic Vercel preview URLs
      if (origin.includes('vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize core components
  const proxyManager = new ProxyManager();
  const rateLimiter = new RateLimiter();
  const scrapingEngine = new ScrapingEngine({ logger, proxyManager, rateLimiter });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      port: PORT,
      host: process.env.HOST || '0.0.0.0',
      renderService: process.env.RENDER_SERVICE_NAME || 'local'
    });
  });

  // Health check endpoint for testing website accessibility
  app.get('/health-check/:url', async (req, res) => {
    try {
      const url = decodeURIComponent(req.params.url);
      logger.info(`Health check for: ${url}`);
      
      // Simple HTTP check first using axios
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: () => true // Accept any status code
      });
      
      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        accessible: response.status >= 200 && response.status < 400,
        url: url,
        contentLength: response.data ? response.data.length : 0
      });
      
    } catch (error) {
      logger.error(`Health check failed for ${req.params.url}:`, error.message);
      res.json({
        success: false,
        error: error.message,
        accessible: false,
        url: decodeURIComponent(req.params.url)
      });
    }
  });

  // Main scraping endpoint
  app.post('/scrape', async (req, res) => {
    try {
      const { url, options = {} } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      logger.info(`Starting scrape for: ${url}`);

      // Create email spider
      const spider = new EmailSpider({
        startUrls: [url],
        maxDepth: options.maxDepth || 2,
        maxPages: options.maxPages || 50,
        respectRobots: options.respectRobots !== false,
        delay: options.delay || 1000,
        concurrent: options.concurrent || 3,
        timeout: options.timeout || 30000,
        userAgent: options.userAgent || 'EmailScraperPro/1.0',
        followRedirects: options.followRedirects !== false,
        extractPatterns: options.extractPatterns || ['email'],
        logger
      });

      // Run the spider
      const results = await scrapingEngine.run(spider);

      res.json({
        success: true,
        data: {
          url,
          emails: results.emails,
          statistics: results.stats,
          metadata: {
            pagesVisited: results.stats.pagesProcessed,
            totalEmails: results.emails.length,
            uniqueEmails: [...new Set(results.emails)].length,
            timeTaken: results.stats.duration,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      logger.error('Scraping error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Batch scraping endpoint
  app.post('/scrape/batch', async (req, res) => {
    try {
      const { urls, options = {} } = req.body;

      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({
          success: false,
          error: 'URLs array is required'
        });
      }

      logger.info(`Starting batch scrape for ${urls.length} URLs`);

      const results = [];
      for (const url of urls.slice(0, 10)) { // Limit to 10 URLs for safety
        try {
          const spider = new EmailSpider({
            startUrls: [url],
            maxDepth: 1,
            maxPages: 10,
            ...options
          });

          const result = await scrapingEngine.run(spider);
          results.push({
            url,
            success: true,
            emails: result.emails,
            stats: result.stats
          });
        } catch (error) {
          results.push({
            url,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Batch scraping error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Spider management endpoints
  app.get('/spiders', (req, res) => {
    res.json({
      available: [
        {
          name: 'EmailSpider',
          description: 'Advanced email extraction spider',
          features: [
            'Deep crawling',
            'Anti-detection',
            'Proxy rotation',
            'Rate limiting',
            'JavaScript rendering',
            'Email validation'
          ]
        }
      ]
    });
  });

  // Statistics endpoint
  app.get('/stats', async (req, res) => {
    try {
      const stats = await scrapingEngine.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Email tracking endpoint
  app.get('/track/:trackingId', (req, res) => {
    const trackingId = req.params.trackingId;
    
    // Log the tracking event
    logger.info(`Email opened: ${trackingId}`, {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.end(pixel);
  });

  // Email tracking statistics endpoint
  app.get('/tracking/stats', (req, res) => {
    try {
      // In a real implementation, you'd query your database
      const stats = {
        totalEmails: 150,
        totalOpens: 45,
        openRate: '30%',
        recentOpens: [
          { trackingId: 'track_123', openedAt: new Date().toISOString() },
          { trackingId: 'track_124', openedAt: new Date().toISOString() }
        ]
      };
      
      res.json(stats);
    } catch (error) {
      logger.error('Error getting tracking stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Google Apps Script Integration Endpoints
  // In-memory storage for this demo (in production, use a proper database)
  let contacts = [];
  let sentEmails = [];
  
  // Simple API key validation middleware
  const validateApiKey = (req, res, next) => {
    const authHeader = req.get('Authorization');
    const apiKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    // For demo purposes, we'll accept any API key or no key
    // In production, implement proper authentication
    if (!apiKey && process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }
    
    next();
  };

  // Get pending contacts for email sending
  app.get('/api/contacts/pending', validateApiKey, (req, res) => {
    try {
      // Get contacts that haven't been sent an email yet or failed
      const pendingContacts = contacts.filter(contact => {
        const existingSent = sentEmails.find(sent => sent.email === contact.email);
        return !existingSent || existingSent.status === 'failed';
      });
      
      logger.info(`API: Retrieved ${pendingContacts.length} pending contacts`);
      
      res.json({
        success: true,
        contacts: pendingContacts.slice(0, 30), // Limit to 30 for daily sending
        total: pendingContacts.length
      });
    } catch (error) {
      logger.error('Error getting pending contacts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update email status from Google Apps Script
  app.post('/api/emails/status', validateApiKey, (req, res) => {
    try {
      const { email, status, timestamp, error } = req.body;
      
      if (!email || !status || !timestamp) {
        return res.status(400).json({
          success: false,
          error: 'Email, status, and timestamp are required'
        });
      }
      
      // Find or create sent email record
      let sentEmail = sentEmails.find(sent => sent.email === email);
      
      if (sentEmail) {
        // Update existing record
        sentEmail.status = status;
        sentEmail.lastUpdated = timestamp;
        if (error) sentEmail.error = error;
      } else {
        // Create new record
        sentEmail = {
          email,
          status,
          sentDate: timestamp,
          lastUpdated: timestamp,
          subject: 'Partnership Opportunity',
          opens: 0,
          trackingId: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        if (error) sentEmail.error = error;
        sentEmails.push(sentEmail);
      }
      
      logger.info(`API: Updated email status for ${email}: ${status}`);
      
      res.json({
        success: true,
        message: 'Email status updated'
      });
    } catch (error) {
      logger.error('Error updating email status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get count of emails sent today
  app.get('/api/emails/count/today', validateApiKey, (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const sentToday = sentEmails.filter(sent => {
        const sentDate = new Date(sent.sentDate).toISOString().split('T')[0];
        return sentDate === today && sent.status === 'sent';
      });
      
      logger.info(`API: Retrieved emails sent today count: ${sentToday.length}`);
      
      res.json({
        success: true,
        count: sentToday.length,
        date: today
      });
    } catch (error) {
      logger.error('Error getting email count:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Add contacts endpoint (for the app to use)
  app.post('/api/contacts', (req, res) => {
    try {
      const { contactsToAdd } = req.body;
      
      if (!contactsToAdd || !Array.isArray(contactsToAdd)) {
        return res.status(400).json({
          success: false,
          error: 'contactsToAdd array is required'
        });
      }
      
      const newContacts = contactsToAdd.map(contact => ({
        ...contact,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString()
      }));
      
      contacts.push(...newContacts);
      
      logger.info(`API: Added ${newContacts.length} new contacts`);
      
      res.json({
        success: true,
        added: newContacts.length,
        total: contacts.length
      });
    } catch (error) {
      logger.error('Error adding contacts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all contacts endpoint
  app.get('/api/contacts', (req, res) => {
    try {
      res.json({
        success: true,
        contacts: contacts,
        total: contacts.length
      });
    } catch (error) {
      logger.error('Error getting contacts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get sent emails endpoint
  app.get('/api/emails/sent', (req, res) => {
    try {
      res.json({
        success: true,
        emails: sentEmails,
        total: sentEmails.length
      });
    } catch (error) {
      logger.error('Error getting sent emails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // SendGrid configuration
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key-here';
  if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your-sendgrid-api-key-here') {
    sgMail.setApiKey(SENDGRID_API_KEY);
    logger.info('✅ SendGrid configured for real email sending');
  } else {
    logger.info('⚠️ SendGrid not configured - emails will be recorded but not sent');
  }

  // Send individual email endpoint (with real SendGrid integration)
  app.post('/api/emails/send', validateApiKey, async (req, res) => {
    try {
      const { contactId, email, name, company } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }
      
      // Generate tracking ID
      const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create email record
      const emailRecord = {
        contactId,
        email,
        name: name || extractNameFromEmail(email),
        company: company || extractCompanyFromEmail(email),
        subject: `Partnership Opportunity - ${company || extractCompanyFromEmail(email)}`,
        status: 'pending',
        sentDate: new Date().toISOString(),
        trackingId,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Try to send real email via SendGrid
      let emailSent = false;
      if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your-sendgrid-api-key-here') {
        try {
          const msg = {
            to: email,
            from: {
              email: 'hello@nino.news',
              name: 'Riki from Nino!'
            },
            subject: emailRecord.subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Hello ${emailRecord.name}!</h2>
                
                <p>I hope this email finds you well. I'm reaching out to explore potential partnership opportunities between our organizations.</p>
                
                <p>At Nino, we specialize in innovative media solutions that could complement your current offerings at ${emailRecord.company}. I'd love to schedule a brief 15-minute call to discuss how we might work together.</p>
                
                <p>Would you be available for a quick chat this week or next?</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Riki from Nino!</strong><br>
                  <a href="mailto:hello@nino.news">hello@nino.news</a>
                </p>
                
                <img src="${req.protocol}://${req.get('host')}/track/${trackingId}" width="1" height="1" style="display:none;" alt="">
              </div>
            `,
            text: `Hello ${emailRecord.name}!

I hope this email finds you well. I'm reaching out to explore potential partnership opportunities between our organizations.

At Nino, we specialize in innovative media solutions that could complement your current offerings at ${emailRecord.company}. I'd love to schedule a brief 15-minute call to discuss how we might work together.

Would you be available for a quick chat this week or next?

Best regards,
Riki from Nino!
hello@nino.news`,
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking: { enable: true }
            }
          };
          
          const response = await sgMail.send(msg);
          emailSent = true;
          emailRecord.status = 'sent';
          emailRecord.messageId = response[0].headers['x-message-id'] || emailRecord.messageId;
          
          logger.info(`✅ Real email sent to ${email} via SendGrid`);
          
        } catch (sendGridError) {
          logger.error(`SendGrid error for ${email}:`, sendGridError.message);
          emailRecord.status = 'failed';
          emailRecord.error = sendGridError.message;
        }
      } else {
        // Mark as recorded but not sent if no SendGrid API key
        emailRecord.status = 'recorded';
        logger.info(`📝 Email recorded for ${email} (SendGrid not configured)`);
      }
      
      // Add to sent emails
      sentEmails.push(emailRecord);
      
      // Remove from contacts if exists
      const contactIndex = contacts.findIndex(c => c.email === email);
      if (contactIndex !== -1) {
        contacts.splice(contactIndex, 1);
      }
      
      res.json({
        success: true,
        message: emailSent ? 'Email sent successfully' : 'Email recorded (SendGrid not configured)',
        trackingId: emailRecord.trackingId,
        messageId: emailRecord.messageId,
        status: emailRecord.status,
        realEmailSent: emailSent
      });
      
    } catch (error) {
      logger.error('Error in email endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

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

  // Error handling middleware
  app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // Start server
  const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for Render.com
  app.listen(PORT, HOST, () => {
    logger.info(`Email Scraper Pro worker ${process.pid} listening on ${HOST}:${PORT}`);
    logger.info('🕷️  Advanced web scraping engine ready!');
    logger.info('📧 Email extraction capabilities activated');
    logger.info('🚀 Production-grade scraping inspired by Scrapy');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Render Service: ${process.env.RENDER_SERVICE_NAME || 'local'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
} 