class ProxyManager {
  constructor(options = {}) {
    this.proxies = options.proxies || [];
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.proxyStats = new Map();
    this.enabled = options.enabled || false;
  }

  addProxy(proxy) {
    // Proxy format: { host: 'ip', port: 'port', username: 'user', password: 'pass', type: 'http|socks5' }
    this.proxies.push(proxy);
    this.proxyStats.set(this.getProxyKey(proxy), {
      requests: 0,
      failures: 0,
      lastUsed: null,
      avgResponseTime: 0
    });
  }

  addProxies(proxies) {
    proxies.forEach(proxy => this.addProxy(proxy));
  }

  getNextProxy() {
    if (!this.enabled || this.proxies.length === 0) {
      return null;
    }

    // Filter out failed proxies
    const availableProxies = this.proxies.filter(proxy => 
      !this.failedProxies.has(this.getProxyKey(proxy))
    );

    if (availableProxies.length === 0) {
      // Reset failed proxies if all have failed
      this.failedProxies.clear();
      return this.proxies[0];
    }

    // Round-robin selection
    const proxy = availableProxies[this.currentIndex % availableProxies.length];
    this.currentIndex++;

    return proxy;
  }

  markProxyFailed(proxy) {
    const key = this.getProxyKey(proxy);
    this.failedProxies.add(key);
    
    const stats = this.proxyStats.get(key);
    if (stats) {
      stats.failures++;
    }
  }

  markProxySuccess(proxy, responseTime) {
    const key = this.getProxyKey(proxy);
    const stats = this.proxyStats.get(key);
    
    if (stats) {
      stats.requests++;
      stats.lastUsed = new Date();
      stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
    }
  }

  getProxyKey(proxy) {
    return `${proxy.host}:${proxy.port}`;
  }

  getProxyUrl(proxy) {
    if (!proxy) return null;
    
    let auth = '';
    if (proxy.username && proxy.password) {
      auth = `${proxy.username}:${proxy.password}@`;
    }
    
    const protocol = proxy.type || 'http';
    return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
  }

  getStats() {
    return {
      totalProxies: this.proxies.length,
      failedProxies: this.failedProxies.size,
      availableProxies: this.proxies.length - this.failedProxies.size,
      enabled: this.enabled,
      proxyStats: Object.fromEntries(this.proxyStats)
    };
  }

  reset() {
    this.failedProxies.clear();
    this.currentIndex = 0;
  }
}

module.exports = { ProxyManager }; 