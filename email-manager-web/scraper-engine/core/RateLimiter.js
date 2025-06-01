const { RateLimiterMemory } = require('rate-limiter-flexible');

class RateLimiter {
  constructor(options = {}) {
    // Global rate limiter (requests per second)
    this.globalLimiter = new RateLimiterMemory({
      points: options.globalRequestsPerSecond || 5,
      duration: 1
    });

    // Domain-specific rate limiters
    this.domainLimiters = new Map();
    this.defaultDomainLimit = options.domainRequestsPerSecond || 2;
    
    // Concurrent request limiter
    this.concurrentLimiter = new RateLimiterMemory({
      points: options.maxConcurrent || 10,
      duration: 1
    });
  }

  async consume(url) {
    try {
      // Extract domain from URL
      const domain = new URL(url).hostname;
      
      // Apply global rate limiting
      await this.globalLimiter.consume('global');
      
      // Apply domain-specific rate limiting
      if (!this.domainLimiters.has(domain)) {
        this.domainLimiters.set(domain, new RateLimiterMemory({
          points: this.defaultDomainLimit,
          duration: 1
        }));
      }
      
      const domainLimiter = this.domainLimiters.get(domain);
      await domainLimiter.consume(domain);
      
      // Apply concurrent request limiting
      await this.concurrentLimiter.consume('concurrent');
      
    } catch (rateLimiterRes) {
      // Rate limit exceeded, wait for the specified time
      const waitTime = rateLimiterRes.msBeforeNext || 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Retry
      return this.consume(url);
    }
  }

  setDomainLimit(domain, requestsPerSecond) {
    this.domainLimiters.set(domain, new RateLimiterMemory({
      points: requestsPerSecond,
      duration: 1
    }));
  }
}

module.exports = { RateLimiter }; 