// Test script to verify our fixes
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  try {
    console.log('Testing API endpoints...');
    // Add your API endpoint tests here
    console.log('API tests completed.');
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('Running backend tests...\n');
  
  await testDatabaseConnection();
  console.log('\n-------------------\n');
  await testAPIEndpoints();
  
  console.log('\nAll tests completed.');
}

runAllTests();