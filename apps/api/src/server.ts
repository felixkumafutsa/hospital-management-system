import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import logger from './config/logger';
import connectDB, { prisma } from './config/database';
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
import notificationRoutes from './modules/notifications/notifications.routes';
import followupRoutes from './modules/followup/followup.routes';
import errorHandler from './middlewares/errorHandler';
import { auditLogger } from './middlewares/auditLogger';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable trust proxy for Vercel to fix express-rate-limit warning
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
// Fixed CORS that works with credentials - cannot use origin:'*' with credentials: true
app.use(cors({
  origin: (_origin, callback) => {
    // Always allow - this works with credentials
    callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/followups', followupRoutes);

// Redirect old routes without /api/v1 prefix to the correct endpoint (fixes 404 for legacy frontend calls)
app.use('/auth/login', loginLimiter, (req, res, next) => {
  // Forward the request to the actual /api/v1/auth/login endpoint
  req.url = '/api/v1/auth/login' + req.url;
  app.handle(req, res, next);
});

// Catch-all for other missing routes - ensure CORS headers are always present
app.use((req, res, next) => {
  // Explicitly set CORS headers for all responses, including 404s to fix CORS errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight OPTIONS for any unmatched route
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // If it's an unmatched API request, provide helpful error
  if (req.path.startsWith('/auth/') || req.path.startsWith('/api/') === false) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested endpoint does not exist. Did you forget to add the /api/v1 prefix?',
      correctEndpoint: `/api/v1${req.path}`,
      example: '/api/v1/auth/login'
    });
  }
  
  next();
});

// API homepage/documentation
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Better Life Clinic HMS API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 900px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
        }
        h1 {
          color: #1a1a2e;
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        .status-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 15px;
        }
        .section {
          margin: 30px 0;
        }
        h2 {
          color: #1a1a2e;
          font-size: 1.5rem;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #667eea;
          display: inline-block;
        }
        .endpoint-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .endpoint {
          background: #f8f9ff;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }
        .method {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 0.8rem;
          font-weight: 700;
          margin-right: 10px;
        }
        .method.get { background: #10b981; color: white; }
        .method.post { background: #3b82f6; color: white; }
        .method.put { background: #f59e0b; color: white; }
        .method.delete { background: #ef4444; color: white; }
        .path {
          font-family: 'Courier New', monospace;
          color: #333;
          font-size: 0.9rem;
        }
        .health-link {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 40px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 20px;
          transition: transform 0.3s ease;
        }
        .health-link:hover {
          transform: translateY(-2px);
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏥</div>
          <h1>Better Life Clinic HMS</h1>
          <p class="subtitle">Hospital Management System REST API</p>
          <span class="status-badge">● Server Online</span>
        </div>

        <div class="section">
          <h2>Quick Links</h2>
          <a href="/api/v1/health" class="health-link">Check API Health</a>
        </div>

        <div class="section">
          <h2>Available API Endpoints (v1)</h2>
          <div class="endpoint-grid">
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/health</span></div>
            <div class="endpoint"><span class="method post">POST</span><span class="path">/api/v1/auth/login</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/users</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/patients</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/appointments</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/lab</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/pharmacy</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/finance</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/maternity</span></div>
            <div class="endpoint"><span class="method get">GET</span><span class="path">/api/v1/prescriptions</span></div>
          </div>
        </div>

        <div class="footer">
          <p>Better Life Private Clinic HMS • All rights reserved</p>
          <p>Server deployed on Vercel • Built with Node.js & Express</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

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

// Vercel serverless function export
if (process.env.VERCEL) {
  // Connect DB eagerly on Vercel so the first request isn't a cold-start miss.
  // connectDB() is idempotent — calling it multiple times is safe.
  connectDB().catch((err) => {
    logger.error('❌ Failed to connect to database on Vercel:', err);
  });
  module.exports = app;
} else {
  // For local development, start the server normally
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
      await prisma.$disconnect();
      process.exit(1);
    }
  };

  startServer();
}