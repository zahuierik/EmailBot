const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const winston = require('winston');
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
  const PORT = process.env.PORT || 3001;

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
        'https://email-scraper-pro-rikis-projects-6e4b52d3.vercel.app'
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
      port: process.env.PORT || 3001
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

  // Error handling middleware
  app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // Start server
  app.listen(PORT, () => {
    logger.info(`Email Scraper Pro worker ${process.pid} listening on port ${PORT}`);
    logger.info('🕷️  Advanced web scraping engine ready!');
    logger.info('📧 Email extraction capabilities activated');
    logger.info('🚀 Production-grade scraping inspired by Scrapy');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
} 