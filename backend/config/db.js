const mongoose = require('mongoose');
const dns = require('dns');
const Package = require('../models/Package');

let isConnected = false;

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('MongoDB connection lost. Mongoose will automatically attempt to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('MongoDB connection restored successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error event:', err.message);
});

const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  autoIndex: false,
};

const dropLegacyPackageIndex = async () => {
  if (!mongoose.connection.readyState) return;

  try {
    const collection = mongoose.connection.collection('packages');
    const exists = await collection.indexExists('packageNumber_1');
    if (exists) {
      await collection.dropIndex('packageNumber_1');
      console.log('Dropped legacy packages packageNumber_1 index');
    }
  } catch (error) {
    if (error.codeName && error.codeName !== 'IndexNotFound') {
      console.error('Failed to drop legacy package index:', error);
    }
  }
};

const ensurePackageIndexSetup = async () => {
  try {
    await dropLegacyPackageIndex();
    await Package.init();
  } catch (error) {
    console.error('Package index setup error:', error);
  }
};

const connect = async (uri, options = connectionOptions) => {
  const connection = await mongoose.connect(uri, options);
  isConnected = true;
  ensurePackageIndexSetup().catch(() => {});
  return connection;
};

const buildDirectAtlasUri = (srvUri) => {
  if (!srvUri || !srvUri.startsWith('mongodb+srv://')) return null;

  const uriWithoutScheme = srvUri.slice('mongodb+srv://'.length);
  const credentialsEnd = uriWithoutScheme.lastIndexOf('@');
  if (credentialsEnd < 0) return null;

  const credentials = uriWithoutScheme.slice(0, credentialsEnd);
  const hostAndPath = uriWithoutScheme.slice(credentialsEnd + 1);
  const pathStart = hostAndPath.indexOf('/');
  const pathAndQuery = pathStart >= 0 ? hostAndPath.slice(pathStart) : '/tradethiopia';
  const separator = pathAndQuery.includes('?') ? '&' : '?';

  const seedList = process.env.MONGO_ATLAS_SEED_LIST?.trim() || (
    hostAndPath.includes('cluster0.epkpn.mongodb.net')
      ? 'cluster0-shard-00-00.epkpn.mongodb.net:27017,cluster0-shard-00-01.epkpn.mongodb.net:27017,cluster0-shard-00-02.epkpn.mongodb.net:27017'
      : null
  );

  const replicaSet = process.env.MONGO_ATLAS_REPLICA_SET?.trim() || (
    hostAndPath.includes('cluster0.epkpn.mongodb.net')
      ? 'atlas-34uzw3-shard-0'
      : null
  );

  if (!seedList) return null;

  return `mongodb://${credentials}@${seedList}${pathAndQuery}${separator}tls=true&authSource=admin${replicaSet ? `&replicaSet=${encodeURIComponent(replicaSet)}` : ''}`;
};

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  console.log('Connecting to MongoDB...');

  // Attempt 1: Standard connection (SRV)
  try {
    const connection = await connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.warn(`Standard SRV connection failed (${error.message}). Trying direct replica-set seed list...`);

    // Try switching DNS servers in case local DNS fails SRV lookups
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '9.9.9.9']);
    } catch (_) {}

    // Attempt 2: Direct replica-set seed list
    const directUri = buildDirectAtlasUri(mongoUri);
    if (directUri) {
      try {
        await mongoose.disconnect();
        const connection = await connect(directUri);
        console.log(`MongoDB Atlas connected through direct seed list: ${connection.connection.host}`);
        return connection;
      } catch (directError) {
        console.error(`Direct seed list connection also failed: ${directError.message}`);
      }
    }

    throw error;
  }
};

const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
};

module.exports = { connectDB, disconnectDB };
