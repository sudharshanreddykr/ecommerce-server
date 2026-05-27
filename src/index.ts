import 'dotenv/config';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { requestValidator } from './middleware/requestValidator';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// ============ Middleware ============
app.use(helmet());
app.use(cors({
  origin: ['https://ecommerce.dev:5173', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============ Request Validator ============
app.use(requestValidator);

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============ API Routes ============
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
});

// ============ Error Handler ============
app.use(errorHandler);

// ============ Initialize Server ============
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDatabase();
    logger.info('✓ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✓ Redis connected successfully');

    // Start Express server
    const isHttps = process.env.ENABLE_HTTPS === 'true';
    const certPath = path.join(process.cwd(), 'certs', 'cert.pem');
    const keyPath = path.join(process.cwd(), 'certs', 'key.pem');

    if (isHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      https.createServer(options, app).listen(PORT, () => {
        logger.info(`✓ HTTPS Server running on port ${PORT}`);
        logger.info(`✓ API available at https://localhost:${PORT}${API_PREFIX}`);
      });
    } else {
      app.listen(PORT, () => {
        logger.info(`✓ HTTP Server running on port ${PORT}`);
        logger.info(`✓ API available at http://localhost:${PORT}${API_PREFIX}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ============ Graceful Shutdown ============
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
