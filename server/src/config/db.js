const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/novatech_task_db';
    
    // Try connecting to provided URI with a short timeout
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`[MongoDB] Connected to external MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.warn(`[MongoDB] Could not connect to local/specified MongoDB (${localErr.message}).`);
      console.log(`[MongoDB] Initializing MongoMemoryServer in-memory database fallback...`);
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Connected to in-memory database at: ${inMemoryUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[MongoDB] Fatal database connection error: ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
