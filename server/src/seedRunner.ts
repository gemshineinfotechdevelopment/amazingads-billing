import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDB, disconnectDB } from './config/db.js';
import { seedInitialData } from './utils/seed.js';

async function runSeed() {
  console.log('🔄 Connecting to MongoDB URI from .env...');
  await connectDB();
  console.log('🌱 Seeding collections with initial data...');
  await seedInitialData();
  console.log('🎉 Seeding completed successfully!');
  await disconnectDB();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});

