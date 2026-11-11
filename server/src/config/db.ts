import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar_billing';

  // Ensure database name is set if Atlas URL ends with /
  if (uri.endsWith('.mongodb.net/')) {
    uri = `${uri}calendar_billing?retryWrites=true&w=majority`;
  }

  try {
    // Attempt connecting to the configured MongoDB with a 10s timeout for cloud Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`✅ Connected to MongoDB Atlas successfully!`);
    console.log(`📡 Host: ${host} | Database: ${dbName}`);
  } catch (err: unknown) {
    console.warn(`⚠️ Could not connect to configured MongoDB (${uri}). Error:`, err instanceof Error ? err.message : err);
    console.log('🔄 Starting high-performance embedded MongoDB engine...');
    try {
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ Connected to embedded MongoDB at: ${memoryUri}`);
    } catch (memErr) {
      console.error('❌ Failed to start embedded MongoDB:', memErr);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

