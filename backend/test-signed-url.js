const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testSignedUrl() {
    try {
        console.log('Testing signed URL generation...');
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
        
        // Get a file ID from the bucket
        console.log('Listing files in bucket...');
        const files = await storage.listFiles({
            bucketId: process.env.APPWRITE_BUCKET_ID
        });
        
        if (files.files && files.files.length > 0) {
            const fileId = files.files[0].$id;
            console.log('Using file ID:', fileId);
            
            // Try to generate a signed URL
            console.log('Generating signed URL...');
            const signedUrl = await storage.getFileView({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: fileId
            });
            
            console.log('Signed URL result:', signedUrl);
            
            // Also try to get file download URL
            console.log('Generating download URL...');
            const downloadUrl = await storage.getFileDownload({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: fileId
            });
            
            console.log('Download URL result:', downloadUrl);
        } else {
            console.log('No files found in bucket');
        }
        
    } catch (error) {
        console.error('Signed URL test failed:', error);
    }
}

// Run the test
testSignedUrl();