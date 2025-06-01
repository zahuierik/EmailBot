const puppeteer = require('puppeteer');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const UserAgent = require('user-agents');

class ScrapingEngine {
  constructor({ logger, proxyManager, rateLimiter }) {
    this.logger = logger;
    this.proxyManager = proxyManager;
    this.rateLimiter = rateLimiter;
    this.stats = {
      requestsTotal: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      emailsExtracted: 0,
      startTime: null,
      endTime: null
    };
    this.browser = null;
    this.browserRetries = 0;
    this.maxBrowserRetries = 3;
  }

  async initialize() {
    if (!this.browser || this.browser.isConnected() === false) {
      this.logger.info('Initializing Puppeteer browser...');
      try {
        // Close existing browser if it exists
        if (this.browser) {
          try {
            await this.browser.close();
          } catch (e) {
            // Ignore errors when closing broken browser
          }
        }

        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--window-size=1920,1080',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          timeout: 60000,
          ignoreDefaultArgs: ['--disable-extensions'],
          defaultViewport: { width: 1920, height: 1080 },
          protocolTimeout: 60000
        });

        // Handle browser disconnection
        this.browser.on('disconnected', () => {
          this.logger.warn('Browser disconnected');
          this.browser = null;
        });

        this.logger.info('Browser initialized successfully');
        this.browserRetries = 0;
      } catch (error) {
        this.browserRetries++;
        this.logger.error(`Failed to initialize browser (attempt ${this.browserRetries}):`, error.message);
        
        if (this.browserRetries < this.maxBrowserRetries) {
          this.logger.info('Retrying browser initialization...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await this.initialize();
        } else {
          throw new Error(`Browser initialization failed after ${this.maxBrowserRetries} attempts: ${error.message}`);
        }
      }
    }
  }

  async run(spider) {
    try {
      this.stats.startTime = Date.now();
      await this.initialize();

      this.logger.info(`Starting spider: ${spider.constructor.name}`);
      this.logger.info(`Start URLs: ${spider.startUrls.join(', ')}`);

      const results = await spider.crawl(this.browser, this);
      
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;

      this.logger.info('Scraping completed successfully');
      this.logger.info(`Total requests: ${this.stats.requestsTotal}`);
      this.logger.info(`Successful requests: ${this.stats.requestsSuccessful}`);
      this.logger.info(`Failed requests: ${this.stats.requestsFailed}`);
      this.logger.info(`Emails extracted: ${this.stats.emailsExtracted}`);
      this.logger.info(`Duration: ${this.stats.duration}ms`);

      return {
        emails: results.emails || [],
        stats: {
          ...this.stats,
          pagesProcessed: this.stats.requestsSuccessful,
          successRate: this.stats.requestsTotal > 0 ? 
            (this.stats.requestsSuccessful / this.stats.requestsTotal * 100).toFixed(2) + '%' : '0%'
        }
      };

    } catch (error) {
      this.logger.error('Scraping engine error:', error);
      throw error;
    }
  }

  async processRequest(url, options = {}) {
    try {
      this.stats.requestsTotal++;
      this.logger.debug(`Starting request for: ${url}`);
      
      // Ensure browser is available
      await this.initialize();
      
      // Rate limiting
      await this.rateLimiter.consume(url);

      // Create new page with retry logic
      let page = null;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          page = await this.browser.newPage();
          break;
        } catch (error) {
          retries++;
          this.logger.warn(`Failed to create page (attempt ${retries}): ${error.message}`);
          
          if (retries < maxRetries) {
            // Reinitialize browser on connection errors
            if (error.message.includes('Connection closed') || error.message.includes('Protocol error')) {
              this.browser = null;
              await this.initialize();
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }

      if (!page) {
        throw new Error('Failed to create page after retries');
      }
      
      try {
        // Set random user agent
        const userAgent = new UserAgent();
        await page.setUserAgent(userAgent.toString());
        this.logger.debug(`Set user agent: ${userAgent.toString()}`);

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Block unnecessary resources for faster loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
            req.abort();
          } else {
            req.continue();
          }
        });

        // Navigate to URL with better error handling and retry logic
        this.logger.debug(`Navigating to: ${url}`);
        let response = null;
        let navigationRetries = 0;
        const maxNavigationRetries = 3;
        const timeouts = [15000, 30000, 45000]; // Progressive timeout increase
        
        while (navigationRetries < maxNavigationRetries) {
          try {
            response = await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: timeouts[navigationRetries] || 30000
            });
            break; // Success, exit retry loop
          } catch (navError) {
            navigationRetries++;
            this.logger.warn(`Navigation attempt ${navigationRetries} failed for ${url}: ${navError.message}`);
            
            if (navigationRetries < maxNavigationRetries) {
              // Wait before retry, progressively longer
              await new Promise(resolve => setTimeout(resolve, navigationRetries * 2000));
              
              // Try different waitUntil strategies
              const waitStrategies = ['domcontentloaded', 'networkidle0', 'load'];
              const waitUntil = waitStrategies[navigationRetries - 1] || 'domcontentloaded';
              
              try {
                response = await page.goto(url, {
                  waitUntil: waitUntil,
                  timeout: timeouts[navigationRetries] || 30000
                });
                break;
              } catch (secondError) {
                this.logger.warn(`Secondary navigation strategy failed: ${secondError.message}`);
                if (navigationRetries === maxNavigationRetries) {
                  throw navError; // Throw original error
                }
              }
            } else {
              throw navError;
            }
          }
        }

        if (!response) {
          throw new Error('No response received from page after all retries');
        }

        if (!response.ok()) {
          throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
        }

        this.logger.debug(`Page loaded successfully: ${response.status()}`);

        // Wait for content to load with better error handling
        try {
          await page.evaluate(() => {
            return new Promise(resolve => setTimeout(resolve, 1000));
          });
        } catch (evalError) {
          this.logger.warn('Page evaluation timeout, continuing anyway');
        }

        // Get page content
        const content = await page.content();
        const finalUrl = page.url();

        this.logger.debug(`Content length: ${content.length} characters`);

        this.stats.requestsSuccessful++;
        
        return {
          url: finalUrl,
          content,
          page,
          success: true
        };

      } finally {
        if (page) {
          try {
            await page.close();
          } catch (e) {
            this.logger.warn('Error closing page:', e.message);
          }
        }
      }

    } catch (error) {
      this.stats.requestsFailed++;
      this.logger.error(`Request failed for ${url}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      
      return {
        url,
        content: null,
        page: null,
        success: false,
        error: error.message
      };
    }
  }

  async getStats() {
    return {
      ...this.stats,
      uptime: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
      memoryUsage: process.memoryUsage(),
      browserConnected: this.browser ? this.browser.isConnected() : false
    };
  }

  updateStats(key, value = 1) {
    if (this.stats.hasOwnProperty(key)) {
      this.stats[key] += value;
    }
  }

  async shutdown() {
    if (this.browser) {
      this.logger.info('Shutting down browser...');
      try {
        await this.browser.close();
      } catch (e) {
        this.logger.warn('Error during browser shutdown:', e.message);
      }
      this.browser = null;
    }
  }
}

module.exports = { ScrapingEngine }; 