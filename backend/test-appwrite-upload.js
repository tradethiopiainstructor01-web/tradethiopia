const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');
const { File } = require('node-fetch-native-with-agent');
const fs = require('fs');
const path = require('path');

// Test Appwrite file upload
async function testAppwriteUpload() {
    try {
        console.log('Testing Appwrite file upload...');
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
        const fileContent = 'This is a test file for Appwrite upload';
        const fileBuffer = Buffer.from(fileContent);
        const fileName = `test-upload-${Date.now()}.txt`;
        
        console.log('File created successfully, size:', fileBuffer.length);
        
        // Create a File object from the buffer
        const file = new File([fileBuffer], fileName, { type: 'text/plain' });
        
        // Upload to Appwrite using the correct method signature
        console.log('Uploading to Appwrite...');
        const appwriteFile = await storage.createFile({
            bucketId: process.env.APPWRITE_BUCKET_ID,
            fileId: 'unique()', // Let Appwrite generate unique ID
            file: file
        });
        
        console.log('File uploaded successfully:', appwriteFile.$id);
        
        // Try to delete the file
        console.log('Deleting file from Appwrite...');
        await storage.deleteFile({
            bucketId: process.env.APPWRITE_BUCKET_ID,
            fileId: appwriteFile.$id
        });
        console.log('File deleted successfully');
        
    } catch (error) {
        console.error('Appwrite test failed:', error);
    }
}

// Run the test
testAppwriteUpload();