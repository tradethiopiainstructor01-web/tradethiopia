const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Import required modules
const { Client, Storage } = require('node-appwrite');

async function testDifferentUrls() {
    try {
        console.log('Testing different URL formats...');
        console.log('Appwrite endpoint:', process.env.APPWRITE_ENDPOINT);
        console.log('Appwrite project ID:', process.env.APPWRITE_PROJECT_ID);
        console.log('Appwrite bucket ID:', process.env.APPWRITE_BUCKET_ID);
        
        // Get a file ID from the bucket
        const client = new Client();
        client
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        
        const storage = new Storage(client);
        
        console.log('Listing files in bucket...');
        const files = await storage.listFiles({
            bucketId: process.env.APPWRITE_BUCKET_ID
        });
        
        if (files.files && files.files.length > 0) {
            const fileId = files.files[0].$id;
            console.log('Using file ID:', fileId);
            
            // Test different URL formats
            const urlsToTest = [
                // Standard format
                `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view`,
                
                // With project ID in query parameter
                `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`,
                
                // Alternative endpoint format
                `https://${process.env.APPWRITE_PROJECT_ID}.cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view`
            ];
            
            for (let i = 0; i < urlsToTest.length; i++) {
                const url = urlsToTest[i];
                console.log(`\nTesting URL ${i + 1}:`, url);
                
                // Test the URL
                const https = require('https');
                
                const urlObj = new URL(url);
                const options = {
                    hostname: urlObj.hostname,
                    port: 443,
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET'
                };
                
                await new Promise((resolve) => {
                    const req = https.request(options, (res) => {
                        console.log(`  Status code: ${res.statusCode}`);
                        if (res.statusCode === 200) {
                            console.log('  SUCCESS: File is accessible!');
                        } else {
                            let data = '';
                            res.on('data', (chunk) => {
                                data += chunk;
                            });
                            res.on('end', () => {
                                console.log('  Error response:', data.substring(0, 100));
                            });
                        }
                        resolve();
                    });
                    
                    req.on('error', (error) => {
                        console.error('  Request error:', error.message);
                        resolve();
                    });
                    
                    req.end();
                });
            }
        } else {
            console.log('No files found in bucket');
        }
        
    } catch (error) {
        console.error('Different URLs test failed:', error);
    }
}

// Run the test
testDifferentUrls();