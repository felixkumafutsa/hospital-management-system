import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import logger from './config/logger';
import connectDB from './config/database';
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patients/patient.routes';
import visitRoutes from './modules/visit/visit.routes';
import prescriptionRoutes from './modules/prescriptions/prescription.routes';
import labRoutes from './modules/laboratory/lab.routes';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes';
import billingRoutes from './modules/billing/billing.routes';
import userRoutes from './modules/users/users.routes';
import maternityRoutes from './modules/maternity/maternity.routes';
import schedulingRoutes from './modules/scheduling/scheduling.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import errorHandler from './middlewares/errorHandler';
import { auditLogger } from './middlewares/auditLogger';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
// CORS configuration that works for both local development and Vercel production
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:4000',
  // Add your Vercel preview URLs here if needed
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply audit logging middleware
app.use(auditLogger);

// Apply general rate limiter to all routes
app.use(generalLimiter);

// API Routes
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth', authRoutes);
// Move user management and maternity routes first to avoid any path matching issues
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/maternity', maternityRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/finance', billingRoutes);
app.use('/api/v1/scheduling', schedulingRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);

// Health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Connected to PostgreSQL database');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📚 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

startServer();