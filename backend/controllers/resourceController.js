const Resource = require("../models/Resource.js");
const { storage } = require("../config/appwriteClient.js"); // Import Appwrite storage
const { File } = require("node-fetch-native-with-agent"); // Import File class

// Delete resource by ID
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findByIdAndDelete(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// Controller for file upload
const uploadResource = async (req, res) => {
  console.log("Upload request received:", {
    body: req.body,
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });
  
  const { type, title, description, content } = req.body;

  try {
    let resourceContent = null;
    
    if (req.file) {
      console.log("Processing file upload...");
      // Upload file to Appwrite Storage
      const fileBuffer = req.file.buffer;
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      console.log("Creating File object with:", {
        fileName: fileName,
        mimeType: req.file.mimetype,
        bufferSize: fileBuffer.length
      });
      
      // Create a File object from the buffer
      const file = new File([fileBuffer], fileName, { type: req.file.mimetype });
      
      console.log("Uploading to Appwrite...");
      // Upload file to Appwrite bucket
      const appwriteFile = await storage.createFile({
        bucketId: process.env.APPWRITE_BUCKET_ID,
        fileId: 'unique()', // Let Appwrite generate unique ID
        file: file
      });
      
      console.log("File uploaded successfully:", appwriteFile.$id);
      
      // Store Appwrite file ID instead of file path
      resourceContent = appwriteFile.$id;
    } else if (content) {
      resourceContent = content;
    } else {
      return res.status(400).json({ message: "File or link is required." });
    }

    const resource = new Resource({
      type,
      title,
      description,
      content: resourceContent, // This will be the Appwrite file ID for uploaded files
    });

    await resource.save();
    console.log("Resource saved to database:", resource._id);
    
    // Add fileUrl for frontend access if it's an uploaded file (not a link)
    const responseResource = {
      ...resource.toObject(),
      fileUrl: req.file ? 
        `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${resourceContent}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
        null
    };
    
    res.status(201).json({ message: "Resource uploaded successfully", resource: responseResource });
  } catch (error) {
    console.error("Error uploading resource:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// Get count of all resources
const getResourceCount = async (req, res) => {
  try {
    const count = await Resource.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching resource count:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// Route to get all resources
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find(); // Fetch all resources
    
    // Add file URLs to each resource for frontend access
    const resourcesWithUrls = resources.map(resource => {
      // If content is a file ID (not a URL), generate the Appwrite URL
      const isFileId = resource.content && !resource.content.startsWith('http');
      
      return {
        ...resource.toObject(),
        fileUrl: isFileId ? 
          `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${resource.content}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
          null
      };
    });
    
    res.status(200).json(resourcesWithUrls);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// Route to get all PDF resources
const getPdfResources = async (req, res) => {
  try {
    const pdfResources = await Resource.find({ type: 'pdf' });
    
    // Add file URLs to each resource for frontend access
    const pdfResourcesWithUrls = pdfResources.map(resource => {
      // If content is a file ID (not a URL), generate the Appwrite URL
      const isFileId = resource.content && !resource.content.startsWith('http');
      
      return {
        ...resource.toObject(),
        fileUrl: isFileId ? 
          `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${resource.content}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
          null
      };
    });
    
    res.status(200).json(pdfResourcesWithUrls);
  } catch (error) {
    console.error("Error fetching PDF resources:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

module.exports = {
  deleteResource,
  uploadResource,
  getResourceCount,
  getAllResources,
  getPdfResources
};