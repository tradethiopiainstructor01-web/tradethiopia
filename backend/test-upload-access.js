const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');
const { File } = require('node-fetch-native-with-agent');

async function testFileUploadAndAccess() {
    try {
        console.log('Testing file upload and access...');
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
        
        // Create a test file content
        const fileContent = 'This is a test file for Appwrite upload and access test';
        const fileBuffer = Buffer.from(fileContent);
        const fileName = `test-access-${Date.now()}.txt`;
        
        console.log('File created successfully, size:', fileBuffer.length);
        
        // Create a File object from the buffer
        const file = new File([fileBuffer], fileName, { type: 'text/plain' });
        
        // Upload to Appwrite using the correct method signature
        console.log('Uploading test file to Appwrite...');
        const appwriteFile = await storage.createFile({
            bucketId: process.env.APPWRITE_BUCKET_ID,
            fileId: 'unique()', // Let Appwrite generate unique ID
            file: file
        });
        
        console.log('File uploaded successfully:', appwriteFile.$id);
        
        // Wait a moment for the file to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to access the file using the URL
        const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${appwriteFile.$id}/view`;
        console.log('Generated file URL:', fileUrl);
        
        // Test the URL
        const https = require('https');
        
        const url = new URL(fileUrl);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET'
        };
        
        const req = https.request(options, (res) => {
            console.log('Response status code:', res.statusCode);
            if (res.statusCode === 200) {
                console.log('File is accessible!');
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log('File content:', data);
                });
            } else {
                console.log('File is not accessible');
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log('Error response:', data);
                });
            }
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
        });
        
        req.end();
        
        // Also try to delete the test file
        setTimeout(async () => {
            try {
                await storage.deleteFile({
                    bucketId: process.env.APPWRITE_BUCKET_ID,
                    fileId: appwriteFile.$id
                });
                console.log('Test file deleted successfully');
            } catch (deleteError) {
                console.error('Error deleting test file:', deleteError);
            }
        }, 5000);
        
    } catch (error) {
        console.error('File upload and access test failed:', error);
    }
}

// Run the test
testFileUploadAndAccess();