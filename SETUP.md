# BetterLife HMS - Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- OpenSSL for generating JWT keys

## Step 1: Clone and Install Dependencies
```bash
# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../web
npm install
```

## Step 2: Generate JWT Keys
```bash
# In the root directory, create a secrets folder
mkdir -p apps/api/secrets

# Generate private key
openssl genrsa -out apps/api/secrets/private.pem 2048

# Generate public key
openssl rsa -in apps/api/secrets/private.pem -out apps/api/secrets/public.pem -pubout
```

## Step 3: Environment Variables
Copy the example env file and update with your values:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ORIGIN`: Frontend URL (usually http://localhost:3000)
- `NODE_ENV`: development/production

## Step 4: Database Setup
```bash
# Run migrations
cd apps/api
npm run prisma:migrate

# Seed the database with initial data (roles, permissions, admin user)
npm run prisma:seed
```

## Default Admin Credentials
```
Email: admin@betterlifeclinic.mw
Password: Admin123!
```

## Step 5: Start Development Servers
```bash
# Start backend (from apps/api)
npm run dev

# Start frontend (from apps/web)
npm run dev
```

## Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/api/v1/health

## Phase 1 Features Implemented
✅ Complete project structure with monorepo setup
✅ Prisma ORM with full database schema
✅ JWT authentication with refresh tokens
✅ Role-Based Access Control (RBAC)
✅ Audit logging middleware
✅ Error handling and validation
✅ Rate limiting
✅ MUI theme with design system
✅ Login page with authentication flow
✅ Protected route HOC
✅ Dashboard page with basic stats
```