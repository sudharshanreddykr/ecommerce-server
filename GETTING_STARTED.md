# Quick Start Guide

Get up and running with the Redis CRUD API in minutes!

## 🚀 30-Second Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose

### Step 1: Setup Services (30 seconds)

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis in Docker containers.

### Step 2: Install Dependencies (60 seconds)

```bash
npm install
```

### Step 3: Start Development Server (10 seconds)

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

## 📋 Complete Setup Guide

### 1. Clone & Navigate

```bash
cd redis-demo
```

### 2. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Edit if needed (defaults work for local dev)
# nano .env
```

### 3. Start Services

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL & Redis**
```bash
# Install PostgreSQL
brew install postgresql redis  # macOS
# or apt-get install postgresql redis-server  # Linux

# Start services
brew services start postgresql
brew services start redis
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build & Start

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 6. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Response:
# {
#   "status": "UP",
#   "timestamp": "2024-01-01T12:00:00Z",
#   "uptime": 123.45
# }
```

---

## 🔐 First API Calls

### Create an Account

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "status": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Save the token for next requests:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create a Product

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "quantity": 10,
    "sku": "LAPTOP-001"
  }'
```

### Get All Products

```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Project Structure

```
redis-demo/
├── src/
│   ├── config/              # Database & Redis config
│   ├── controllers/         # Request handlers
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── utils/               # Helper functions
│   └── index.ts             # App entry point
├── dist/                    # Compiled JavaScript
├── docker-compose.yml       # Docker services
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── .env                     # Environment variables
├── .env.example             # Example .env
└── README.md                # Full documentation
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm run build           # Compile TypeScript
npm start              # Start server

# Testing
npm test               # Run tests
npm run test:watch     # Watch mode

# Code Quality
npm run lint           # Check for issues
npm run format         # Auto-format code

# Database
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
```

---

## 🔍 Debugging

### View Logs

```bash
# Development mode shows all logs
npm run dev

# Production logs
tail -f logs/all.log
tail -f logs/error.log
```

### Check Database Connection

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d redis_crud_db

# Connect to Redis
redis-cli
ping  # Should return PONG
```

### Test Redis Connection

```bash
redis-cli
> PING
PONG

> SET key "value"
OK

> GET key
"value"
```

---

## 🐛 Common Issues

### "Cannot find module" Error

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused" (PostgreSQL)

```bash
# Check if PostgreSQL is running
docker-compose ps

# If not running, start it
docker-compose up -d postgres
```

### "Cannot GET /api/v1/..." (404 Error)

```bash
# Make sure server is running
curl http://localhost:3000/health

# Check for typos in URL
```

### "Invalid token" (401 Error)

```bash
# Get a new token by logging in again
curl -X POST http://localhost:3000/api/v1/users/login ...
```

---

## 📚 Next Steps

1. **Read Full API Documentation**: See [README.md](README.md)
2. **Understand Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Test API Endpoints**: See [API_TESTING.md](API_TESTING.md)
4. **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎯 Learning Path

1. ✅ **Basics** - Register/Login/Create Product
2. **Intermediate** - Pagination, Search, Filtering
3. **Advanced** - Admin operations, Caching strategies
4. **Production** - Deployment, Monitoring, Scaling

---

## 📞 Need Help?

- Check [README.md](README.md) for detailed docs
- Review [API_TESTING.md](API_TESTING.md) for examples
- Check logs in `logs/` directory
- Review error responses for hints

---

## 💡 Pro Tips

### Use Token in Commands

```bash
# Save token to file
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}' \
  | jq -r '.data.token')

# Use in requests
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Use Postman/Insomnia

1. Import API endpoints
2. Store token in variables
3. Create request collections
4. Test workflows

### Monitor Redis Cache

```bash
# Connect to Redis
redis-cli

# Monitor commands
MONITOR

# Or check keys
KEYS *
```

### View Database

```bash
# Using pgAdmin
# Open: http://localhost:5050
# Login: admin@example.com / admin

# Or using psql
psql -h localhost -U postgres -d redis_crud_db
\dt  # List tables
SELECT * FROM users;
```

---

## 🎉 You're Ready!

Start building amazing APIs with Express, PostgreSQL, and Redis! 🚀

For questions, check the documentation or review the code comments.

Happy coding! 💻
