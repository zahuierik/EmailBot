#!/usr/bin/env node

// Simple test to verify port configuration
const express = require('express');
const app = express();

// Use the same port logic as server.js
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🧪 Testing Render.com port configuration...');
console.log(`PORT environment variable: ${process.env.PORT || 'undefined (using default)'}`);
console.log(`HOST environment variable: ${process.env.HOST || 'undefined (using default)'}`);
console.log(`Final PORT value: ${PORT}`);
console.log(`Final HOST value: ${HOST}`);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    host: HOST,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Test server successfully listening on ${HOST}:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  
  // Auto-exit after 5 seconds
  setTimeout(() => {
    console.log('🔚 Test completed successfully!');
    process.exit(0);
  }, 5000);
}); 