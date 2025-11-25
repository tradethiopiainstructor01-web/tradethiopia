const app = require('./server.js');

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // For Vercel serverless functions, export the app directly
  module.exports = app;
}