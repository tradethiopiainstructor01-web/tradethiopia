const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testProjectBuckets() {
    try {
        console.log('Testing project buckets...');
        console.log('Appwrite endpoint:', process.env.APPWRITE_ENDPOINT);
        console.log('Appwrite project ID:', process.env.APPWRITE_PROJECT_ID);
        console.log('Appwrite bucket ID:', process.env.APPWRITE_BUCKET_ID);
        
        // Create Appwrite client
        const client = new Client();
        client
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        
        const storage = new Storage(client);
        
        // Try to list all buckets in the project
        console.log('Listing all buckets in project...');
        const buckets = await storage.listBuckets();
        
        console.log('Buckets found:', buckets.total);
        console.log('Bucket list:', buckets.buckets);
        
        // Check if our bucket is in the list
        const ourBucket = buckets.buckets.find(bucket => bucket.$id === process.env.APPWRITE_BUCKET_ID);
        if (ourBucket) {
            console.log('Our bucket found in list:', ourBucket);
        } else {
            console.log('Our bucket NOT found in list');
        }
        
    } catch (error) {
        console.error('Project buckets test failed:', error);
    }
}

// Run the test
testProjectBuckets();