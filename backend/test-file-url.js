const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testFileUrl() {
    try {
        console.log('Testing file URL generation...');
        console.log('Appwrite endpoint:', process.env.APPWRITE_ENDPOINT);
        console.log('Appwrite project ID:', process.env.APPWRITE_PROJECT_ID);
        console.log('Appwrite bucket ID:', process.env.APPWRITE_BUCKET_ID);
        
        // Test URL generation
        const testFileId = '68e4e17e37ccad19937c'; // Use the file ID from our previous test
        const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${testFileId}/view`;
        
        console.log('Generated file URL:', fileUrl);
        
        // Let's also test what happens if we try to access this URL directly
        const https = require('https');
        
        console.log('Testing URL access...');
        const url = new URL(fileUrl);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET'
        };
        
        const req = https.request(options, (res) => {
            console.log('Response status code:', res.statusCode);
            console.log('Response headers:', res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response body (first 200 chars):', data.substring(0, 200));
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
        });
        
        req.end();
        
    } catch (error) {
        console.error('File URL test failed:', error);
    }
}

// Run the test
testFileUrl();