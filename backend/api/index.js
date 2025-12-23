const app = require('../server.js');

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    console.log('Vercel function called:', {
      method: req.method,
      url: req.url,
      vercel: !!process.env.VERCEL,
      headers: req.headers
    });
    
    // Ensure CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      res.status(200).end();
      return;
    }
    
    // Pass the request to the Express app
    console.log('Passing request to Express app');
    return app(req, res);
  } catch (error) {
    console.error('Error in Vercel function handler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Vercel function handler error',
      error: error.message 
    });
  }
};
