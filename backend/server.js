const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

const { connectDB, disconnectDB } = require('./config/db.js');
const userRoutes = require('./routes/user.route.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const quizRoutes = require('./routes/quiz.route.js');
const customerFollowUpRoutes = require('./routes/customerFollowRoutes.js');
const noteRoutes = require('./routes/noteRoutes.js');
const ResourceRoute = require('./routes/ResourceRoutes.js');
const FollowUpRoutes = require('./routes/followupRoutes.js');
const CategoryRoutes = require('./routes/categoryRoutes.js');
const documentRoutes = require('./routes/documentRoutes.js');
const assetCategoryRoutes = require('./routes/assetCategory.js');
const assetRoutes = require('./routes/asset.js');
const infouploadRoutes = require('./routes/infoupload.route.js');
const buyerRoutes = require('./routes/buyerRoutes.js');
const sellerRoutes = require('./routes/sellerRoutes.js');
const b2bMatchingRoutes = require('./routes/b2bMatchingRoutes.js');
const savedMatchRoutes = require('./routes/savedMatchRoutes.js');
const salesCustomerRoutes = require('./routes/salesCustomerRoutes.js');
const productFollowupRoutes = require('./routes/productFollowupRoutes.js');
const inventoryRoutes = require('./routes/inventoryRoutes.js');
const financeRoutes = require('./routes/financeRoutes.js');
const demandRoutes = require('./routes/demandRoutes.js');
const ordersRoutes = require('./routes/ordersRoutes.js');
const paymentRoutes = require('./routes/paymentRoutes.js');
const itRoutes = require('./routes/itRoutes.js');

// Load environment variables

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
// Removed static uploads directory since we're using Appwrite for file storage
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check middleware
app.use('/api/health', async (req, res) => {
  try {
    // Check if database is connected
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      success: true,
      status: 'OK',
      database: dbStatus,
      vercel: !!process.env.VERCEL,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Add a middleware to check database connection
app.use(async (req, res, next) => {
  try {
    // Ensure database is connected
    if (!mongoose.connection.readyState) {
      console.log('Attempting to connect to database...');
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection error', 
      error: error.message,
      vercel: !!process.env.VERCEL
    });
  }
});

// Define API routes
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend server is running successfully!', 
    status: 'OK',
    timestamp: new Date(),
    service: 'Employee Portal Backend API',
    version: '1.0.0',
    vercel: !!process.env.VERCEL
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date(), 
    service: 'Employee Portal Backend',
    version: '1.0.0',
    vercel: !!process.env.VERCEL
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is working correctly!', 
    status: 'OK',
    timestamp: new Date(),
    vercel: !!process.env.VERCEL
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/followup', customerFollowUpRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/resources', ResourceRoute);
app.use("/api/followups", FollowUpRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assetcategories', assetCategoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/categories', CategoryRoutes);
app.use('/api', infouploadRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/b2b', b2bMatchingRoutes);
app.use('/api/saved-matches', savedMatchRoutes);
app.use('/api/sales-customers', salesCustomerRoutes);
app.use('/api/product-followups', productFollowupRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/it', itRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    vercel: !!process.env.VERCEL
  });
});

// For Vercel serverless functions, export the app directly
module.exports = app;

// Connect to MongoDB and start the server only when running locally
if (require.main === module) {
    const PORT = process.env.PORT || 5001;
    
    // Connect to database and start server
    connectDB()
      .then(() => {
        const server = app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
        
        // Handle EADDRINUSE error gracefully
        server.on('error', (e) => {
          if (e.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
            setTimeout(() => {
              server.close();
              app.listen(PORT + 1, () => {
                console.log(`Server running on port ${PORT + 1}`);
              });
            }, 1000);
          }
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
          console.log('Shutting down gracefully...');
          await disconnectDB();
          process.exit(0);
        });
      })
      .catch((error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
      });
}