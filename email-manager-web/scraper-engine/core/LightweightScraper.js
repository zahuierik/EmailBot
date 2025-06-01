const axios = require('axios');
const cheerio = require('cheerio');

class LightweightScraper {
  constructor({ logger }) {
    this.logger = logger;
  }

  async scrapeEmails(url) {
    try {
      this.logger.info(`Starting lightweight scrape for: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract all text content
      const textContent = $('body').text();
      
      // Email regex pattern
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = textContent.match(emailRegex) || [];
      
      // Remove duplicates
      const uniqueEmails = [...new Set(emails)];
      
      this.logger.info(`Lightweight scrape completed. Found ${uniqueEmails.length} emails`);
      
      return {
        emails: uniqueEmails,
        stats: {
          pagesProcessed: 1,
          emailsFound: uniqueEmails.length,
          method: 'lightweight'
        }
      };

    } catch (error) {
      this.logger.error(`Lightweight scrape failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { LightweightScraper }; 