const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testFilePreview() {
    try {
        console.log('Testing file preview using Appwrite SDK...');
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
        
        // Try to get file preview using the SDK
        const testFileId = '68e4e17e37ccad19937c'; // Use the file ID from our previous test
        console.log('Getting file preview for:', testFileId);
        
        try {
            const filePreview = await storage.getFilePreview({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: testFileId
            });
            
            console.log('File preview result:', filePreview);
        } catch (previewError) {
            console.error('File preview error:', previewError);
        }
        
        // Also try to get file download
        console.log('Getting file download...');
        try {
            const fileDownload = await storage.getFileDownload({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: testFileId
            });
            
            console.log('File download result type:', typeof fileDownload);
            console.log('File download result length:', fileDownload ? fileDownload.byteLength : 'undefined');
        } catch (downloadError) {
            console.error('File download error:', downloadError);
        }
        
    } catch (error) {
        console.error('File preview test failed:', error);
    }
}

// Run the test
testFilePreview();