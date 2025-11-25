const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testFileAccess() {
    try {
        console.log('Testing Appwrite file access...');
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
        
        // Try to list files in the bucket to see what files exist
        console.log('Listing files in bucket...');
        const files = await storage.listFiles({
            bucketId: process.env.APPWRITE_BUCKET_ID
        });
        
        console.log('Files found:', files.total);
        if (files.files && files.files.length > 0) {
            console.log('First file:', files.files[0]);
            
            // Try to get the first file
            const fileId = files.files[0].$id;
            console.log('Testing access to file:', fileId);
            
            // Try to get file info
            const fileInfo = await storage.getFile({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: fileId
            });
            
            console.log('File info:', fileInfo);
            
            // Generate the URL that we would use in our app
            const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view`;
            console.log('Generated file URL:', fileUrl);
        } else {
            console.log('No files found in bucket');
        }
        
    } catch (error) {
        console.error('File access test failed:', error);
    }
}

// Run the test
testFileAccess();