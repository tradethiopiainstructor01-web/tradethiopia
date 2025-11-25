const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testBucket() {
    try {
        console.log('Testing Appwrite bucket access...');
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
        
        // Try to get the bucket information
        console.log('Getting bucket information...');
        const bucket = await storage.getBucket({
            bucketId: process.env.APPWRITE_BUCKET_ID
        });
        
        console.log('Bucket found:', bucket);
        console.log('Bucket permissions:', bucket.$permissions);
        console.log('File security enabled:', bucket.fileSecurity);
        
        // Check if we need to update bucket permissions to allow public read access
        if (!bucket.$permissions.includes('read("any")')) {
            console.log('Bucket does not have public read access. Updating...');
            
            // Update bucket to allow public read access
            const updatedBucket = await storage.updateBucket({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                name: bucket.name,
                permissions: ['read("any")'], // Allow anyone to read
                fileSecurity: bucket.fileSecurity,
                enabled: bucket.enabled,
                maximumFileSize: bucket.maximumFileSize,
                allowedFileExtensions: bucket.allowedFileExtensions,
                compression: bucket.compression,
                encryption: bucket.encryption,
                antivirus: bucket.antivirus
            });
            
            console.log('Bucket updated:', updatedBucket);
        } else {
            console.log('Bucket already has public read access');
        }
        
    } catch (error) {
        console.error('Bucket test failed:', error);
    }
}

// Run the test
testBucket();