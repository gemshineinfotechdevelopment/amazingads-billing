import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/seed.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Support loading .env from server directory reliably regardless of execution working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 5027;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Allowed origins for local dev and production VPS deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5027',
  'http://localhost:3000',
  'https://amazingads.gemshine.tech',
  'http://amazingads.gemshine.tech',
  CLIENT_ORIGIN,
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, postman) or matching origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('gemshine.tech')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'Amazing Ads - Calendar Printing Billing Software Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Main API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Boot server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`🚀 Calendar Billing Backend running at http://localhost:${PORT}`);
      console.log(`📡 Client connected origin: ${CLIENT_ORIGIN}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

