# Production-Grade CRUD API with Redis Caching

A comprehensive backend API built with Express, PostgreSQL, Sequelize ORM, and Redis caching for high-performance data operations.

## 🚀 Features

- **Express.js** - Fast and minimalist web framework
- **PostgreSQL** - Robust relational database
- **Sequelize ORM** - Powerful database ORM
- **Redis Caching** - High-performance in-memory data store
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin and User roles
- **Input Validation** - Express-validator and Joi
- **Error Handling** - Comprehensive error management
- **Logging** - Winston logger for debugging
- **Security** - Helmet.js, CORS, password hashing
- **TypeScript** - Type-safe development
- **Production Ready** - Follows industry best practices

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

## 🔧 Installation

1. **Clone the repository**

```bash
git clone <repo-url>
cd redis-demo
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=redis_crud_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

4. **Build TypeScript**

```bash
npm run build
```

5. **Start the server**

```bash
npm start
```

Or for development:

```bash
npm run dev
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## 👤 User Endpoints

### Register User

```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "status": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Login User

```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
}
```

### Get User Profile

```http
GET /users/profile
Authorization: Bearer <token>
```

### Get All Users (Paginated)

```http
GET /users?page=1&limit=10&search=john
Authorization: Bearer <token>
```

### Get User by ID

```http
GET /users/:id
Authorization: Bearer <token>
```

### Update User

```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

### Delete User

```http
DELETE /users/:id
Authorization: Bearer <token>
```

### Activate User (Admin Only)

```http
PATCH /users/:id/activate
Authorization: Bearer <token>
```

### Deactivate User (Admin Only)

```http
PATCH /users/:id/deactivate
Authorization: Bearer <token>
```

## 📦 Product Endpoints

### Create Product

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "quantity": 50,
  "sku": "LAPTOP-001"
}
```

### Get All Products

```http
GET /products?page=1&limit=10&search=laptop&userId=uuid
Authorization: Bearer <token>
```

### Get Product by ID

```http
GET /products/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Laptop",
```

## 🔐 Social Login

The backend supports Google and GitHub social login via OAuth redirect.

### Google OAuth

- Start login flow by visiting `/api/v1/users/auth/google`
- After consent, the backend redirects to `/auth/callback` with a token

### GitHub OAuth

- Start login flow by visiting `/api/v1/users/auth/github`
- After consent, the backend redirects to `/auth/callback` with a token

Make sure the following variables are configured in `.env`:

```env
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 🌱 Seed Sample Data

Create a large dataset for development and testing:

```bash
npm run seed:sample
```

This script creates sample users and a large volume of products for performance and UX testing.

### Update Product

```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 45,
  "price": 949.99
}
```

### Delete Product

```http
DELETE /products/:id
Authorization: Bearer <token>
```

### Get My Products

```http
GET /products/my-products
Authorization: Bearer <token>
```

### Get Low Stock Products

```http
GET /products/low-stock?threshold=10
Authorization: Bearer <token>
```

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # PostgreSQL/Sequelize setup
│   └── redis.ts      # Redis setup
├── controllers/      # Request handlers
│   ├── userController.ts
│   └── productController.ts
├── models/          # Database models
│   ├── User.ts
│   └── Product.ts
├── services/        # Business logic
│   ├── userService.ts
│   └── productService.ts
├── routes/          # Route definitions
│   ├── userRoutes.ts
│   └── productRoutes.ts
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication & Authorization
│   ├── errorHandler.ts
│   └── requestValidator.ts
├── utils/           # Utility functions
│   ├── logger.ts    # Winston logger
│   ├── cacheService.ts # Redis operations
│   ├── errors.ts    # Custom error classes
│   └── asyncHandler.ts
├── validation/      # Joi schemas
│   └── schemas.ts
└── index.ts         # Application entry point
```

## 🔒 Security Features

- **JWT Authentication** - Token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Server-side validation with express-validator
- **CORS** - Cross-Origin Resource Sharing configuration
- **Helmet** - HTTP headers security
- **Role-Based Access Control** - Admin and user roles
- **SQL Injection Prevention** - Parameterized queries via Sequelize

## ⚡ Caching Strategy

The application uses Redis for:

- **User Caching** - 1 hour TTL
- **Product Caching** - 30 minutes TTL
- **Automatic Invalidation** - Cache cleared on updates/deletions
- **Pattern-Based Cleanup** - Remove related cache entries

```typescript
// Example: Caching a user
const user = await cacheService.getOrSet('user:123', () => userService.getUserById('123'), 3600);
```

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  sku VARCHAR UNIQUE NOT NULL,
  userId UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm start               # Start server
npm run build          # Compile TypeScript

# Database
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database

# Testing & Quality
npm test               # Run tests
npm run test:watch     # Watch mode
npm run lint           # ESLint check
npm run format         # Prettier format

# Maintenance
npm run db:migrate:undo
npm run db:seed:undo
```

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test -- --coverage  # With coverage
```

## 📝 Environment Variables

| Variable    | Description         | Default       |
| ----------- | ------------------- | ------------- |
| NODE_ENV    | Environment         | development   |
| PORT        | Server port         | 3000          |
| API_PREFIX  | API base path       | /api/v1       |
| DB_HOST     | PostgreSQL host     | localhost     |
| DB_PORT     | PostgreSQL port     | 5432          |
| DB_NAME     | Database name       | redis_crud_db |
| DB_USER     | PostgreSQL user     | postgres      |
| DB_PASSWORD | PostgreSQL password | postgres      |
| REDIS_HOST  | Redis host          | localhost     |
| REDIS_PORT  | Redis port          | 6379          |
| JWT_SECRET  | JWT secret key      | secret        |
| JWT_EXPIRE  | Token expiry        | 7d            |
| LOG_LEVEL   | Logging level       | debug         |

## 🚨 Error Handling

The API returns structured error responses:

```json
{
  "status": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z",
  "errors": []
}
```

**Error Codes:**

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `INTERNAL_SERVER_ERROR` - Server error

## 🔍 Logging

Logs are stored in the `logs/` directory:

- `logs/all.log` - All logs
- `logs/error.log` - Error logs only

## 🐳 Docker Support (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 📦 Dependencies

**Core:**

- express - Web framework
- sequelize - ORM
- pg - PostgreSQL driver
- ioredis - Redis client
- typescript - Type safety

**Security:**

- bcryptjs - Password hashing
- jsonwebtoken - JWT auth
- helmet - Security headers
- express-validator - Input validation

**Utilities:**

- winston - Logging
- cors - CORS handling
- dotenv - Environment variables
- morgan - HTTP logging

## 🤝 Contributing

1. Create a feature branch
2. Commit changes
3. Push to branch
4. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 🎯 Roadmap

- [ ] Unit tests
- [ ] Integration tests
- [ ] Rate limiting
- [ ] Request queuing
- [ ] WebSocket support
- [ ] GraphQL API
- [ ] API documentation (Swagger)
- [ ] Docker Compose setup
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting
