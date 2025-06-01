const cheerio = require('cheerio');
const validator = require('validator');
const url = require('url');

class EmailSpider {
  constructor(options = {}) {
    this.startUrls = options.startUrls || [];
    this.maxDepth = options.maxDepth || 2;
    this.maxPages = options.maxPages || 50;
    this.respectRobots = options.respectRobots !== false;
    this.delay = options.delay || 1000;
    this.concurrent = options.concurrent || 3;
    this.timeout = options.timeout || 30000;
    this.userAgent = options.userAgent || 'EmailScraperPro/1.0';
    this.followRedirects = options.followRedirects !== false;
    this.extractPatterns = options.extractPatterns || ['email'];
    this.logger = options.logger;
    
    this.visited = new Set();
    this.emails = new Set();
    this.urlsToVisit = [];
    this.depth = new Map();
    
    // Advanced email patterns
    this.emailPatterns = [
      // Standard email pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Emails with spaces around @
      /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Emails with [at] or (at)
      /\b[A-Za-z0-9._%+-]+\s*[\[\(]at[\]\)]\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Emails with [dot] or (dot)
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\s*[\[\(]dot[\]\)]\s*[A-Z|a-z]{2,}\b/g,
      // JavaScript escaped emails
      /['"]\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\s*['"]/g,
      // HTML entity encoded emails
      /[A-Za-z0-9._%+-]+&#64;[A-Za-z0-9.-]+&#46;[A-Z|a-z]{2,}/g,
      // URL encoded emails
      /[A-Za-z0-9._%+-]+%40[A-Za-z0-9.-]+%2E[A-Z|a-z]{2,}/g
    ];
  }

  async crawl(browser, engine) {
    this.logger.info('EmailSpider: Starting crawl');
    
    // Initialize with start URLs
    for (const startUrl of this.startUrls) {
      this.urlsToVisit.push(startUrl);
      this.depth.set(startUrl, 0);
    }

    let processedPages = 0;
    const concurrentPromises = [];

    while (this.urlsToVisit.length > 0 && processedPages < this.maxPages) {
      // Process URLs concurrently
      while (concurrentPromises.length < this.concurrent && this.urlsToVisit.length > 0) {
        const currentUrl = this.urlsToVisit.shift();
        
        if (this.visited.has(currentUrl)) {
          continue;
        }

        this.visited.add(currentUrl);
        const currentDepth = this.depth.get(currentUrl) || 0;

        const promise = this.processPage(currentUrl, currentDepth, engine)
          .then(() => {
            processedPages++;
            this.logger.debug(`Processed ${processedPages}/${this.maxPages} pages`);
          })
          .catch(error => {
            this.logger.error(`Error processing ${currentUrl}:`, error.message);
          });

        concurrentPromises.push(promise);
      }

      // Wait for at least one promise to complete
      if (concurrentPromises.length > 0) {
        await Promise.race(concurrentPromises);
        
        // Remove completed promises
        for (let i = concurrentPromises.length - 1; i >= 0; i--) {
          if (concurrentPromises[i].isResolved) {
            concurrentPromises.splice(i, 1);
          }
        }
      }

      // Delay between requests
      if (this.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    // Wait for all remaining promises
    await Promise.all(concurrentPromises);

    engine.updateStats('emailsExtracted', this.emails.size);
    
    this.logger.info(`EmailSpider: Crawl completed. Found ${this.emails.size} emails from ${processedPages} pages`);

    return {
      emails: Array.from(this.emails),
      pagesProcessed: processedPages,
      totalUrls: this.visited.size
    };
  }

  async processPage(pageUrl, currentDepth, engine) {
    try {
      this.logger.debug(`Processing page: ${pageUrl} (depth: ${currentDepth})`);

      const response = await engine.processRequest(pageUrl, {
        timeout: this.timeout
      });

      if (!response.success || !response.content) {
        return;
      }

      // Parse HTML content
      const $ = cheerio.load(response.content);
      
      // Extract emails from page
      await this.extractEmails(response.content, pageUrl);
      
      // Extract emails from page text
      const pageText = $.text();
      await this.extractEmails(pageText, pageUrl);

      // Extract emails from specific elements
      await this.extractFromElements($, pageUrl);

      // Extract links for deeper crawling
      if (currentDepth < this.maxDepth) {
        await this.extractLinks($, pageUrl, currentDepth);
      }

    } catch (error) {
      this.logger.error(`Error processing page ${pageUrl}:`, error.message);
    }
  }

  async extractEmails(text, sourceUrl) {
    for (const pattern of this.emailPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (let match of matches) {
          // Clean up the email
          let email = this.cleanEmail(match);
          
          if (email && this.isValidEmail(email)) {
            this.emails.add(email);
            this.logger.debug(`Found email: ${email} from ${sourceUrl}`);
          }
        }
      }
    }
  }

  async extractFromElements($, sourceUrl) {
    // Look for emails in specific HTML elements
    const selectors = [
      'a[href^="mailto:"]',
      '[data-email]',
      '.email',
      '.contact-email',
      '.e-mail',
      '.mail',
      'span[title*="email"]',
      'div[title*="email"]',
      'p[title*="contact"]'
    ];

    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        
        // Extract from href attribute
        const href = $elem.attr('href');
        if (href && href.startsWith('mailto:')) {
          const email = href.replace('mailto:', '').split('?')[0];
          if (this.isValidEmail(email)) {
            this.emails.add(email);
            this.logger.debug(`Found email in mailto: ${email} from ${sourceUrl}`);
          }
        }

        // Extract from data attributes
        const dataEmail = $elem.attr('data-email');
        if (dataEmail && this.isValidEmail(dataEmail)) {
          this.emails.add(dataEmail);
          this.logger.debug(`Found email in data-email: ${dataEmail} from ${sourceUrl}`);
        }

        // Extract from element text
        const text = $elem.text().trim();
        if (text) {
          this.extractEmails(text, sourceUrl);
        }
      });
    }
  }

  async extractLinks($, pageUrl, currentDepth) {
    const baseUrl = new URL(pageUrl);
    
    $('a[href]').each((i, elem) => {
      try {
        const href = $(elem).attr('href');
        if (!href) return;

        // Skip non-HTTP links
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
          return;
        }

        // Resolve relative URLs
        const absoluteUrl = url.resolve(pageUrl, href);
        const linkUrl = new URL(absoluteUrl);

        // Only follow links on the same domain or subdomains
        if (linkUrl.hostname === baseUrl.hostname || linkUrl.hostname.endsWith('.' + baseUrl.hostname)) {
          if (!this.visited.has(absoluteUrl) && this.urlsToVisit.indexOf(absoluteUrl) === -1) {
            this.urlsToVisit.push(absoluteUrl);
            this.depth.set(absoluteUrl, currentDepth + 1);
            this.logger.debug(`Added URL for crawling: ${absoluteUrl} (depth: ${currentDepth + 1})`);
          }
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });
  }

  cleanEmail(email) {
    // Remove quotes, whitespace, and common obfuscation
    email = email.replace(/['"]/g, '').trim();
    
    // Handle [at] and (at) replacements
    email = email.replace(/\s*[\[\(]at[\]\)]\s*/gi, '@');
    
    // Handle [dot] and (dot) replacements
    email = email.replace(/\s*[\[\(]dot[\]\)]\s*/gi, '.');
    
    // Remove extra whitespace around @
    email = email.replace(/\s*@\s*/g, '@');
    
    // Decode HTML entities
    email = email.replace(/&#64;/g, '@').replace(/&#46;/g, '.');
    
    // Decode URL encoding
    email = email.replace(/%40/g, '@').replace(/%2E/gi, '.');
    
    return email.toLowerCase();
  }

  isValidEmail(email) {
    try {
      // Basic validation
      if (!email || email.length > 254) return false;
      
      // Use validator library for thorough validation
      if (!validator.isEmail(email)) return false;
      
      // Additional checks for common patterns
      const domain = email.split('@')[1];
      if (!domain) return false;
      
      // Skip obvious non-emails
      const invalidDomains = [
        'example.com',
        'test.com',
        'domain.com',
        'company.com',
        'yourcompany.com',
        'yourdomain.com',
        'sentry.io'
      ];
      
      if (invalidDomains.includes(domain.toLowerCase())) {
        return false;
      }
      
      // Skip emails with suspicious patterns
      const suspiciousPatterns = [
        /noreply/i,
        /no-reply/i,
        /donotreply/i,
        /postmaster/i,
        /webmaster/i,
        /abuse/i,
        /root@/i,
        /admin@/i,
        /test@/i,
        /example@/i
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(email)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { EmailSpider }; 