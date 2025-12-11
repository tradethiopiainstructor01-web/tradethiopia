const mongoose = require('mongoose');

let isConnected = false; // Track connection status

const connectDB = async () => {
    console.log('Attempting to connect to database...');
    console.log('Environment:', {
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGO_URI
    });
    
    // If already connected, return immediately
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }
    
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
        const error = new Error('MONGO_URI is not defined in environment variables');
        console.error('Database connection error:', error.message);
        throw error;
    }
    
    try {
        // Check if we're in a Vercel environment
        const isVercel = !!process.env.VERCEL;
        
        if (isVercel) {
            console.log('Running in Vercel environment');
        }
        
        console.log('Connecting to MongoDB...');
        // Simplified connection options to handle network issues
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4 to avoid DNS issues
        });
        isConnected = true;
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error){
        console.log(`Database failed to connect: ${error.message}`);
        console.error('Connection error details:', error);
        // Don't exit in serverless environment
        throw error;
    }
}

// Add a function to disconnect from database (useful for Vercel)
const disconnectDB = async () => {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected');
    }
}

module.exports = { connectDB, disconnectDB };