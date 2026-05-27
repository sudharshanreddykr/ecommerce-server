# API Testing Guide

This document provides examples for testing the API endpoints using curl, Postman, or any HTTP client.

## Quick Start

### 1. Start Services

```bash
# Using Docker Compose
docker-compose up -d

# Or start PostgreSQL and Redis locally
```

### 2. Install & Build

```bash
npm install
npm run build
npm run dev
```

### 3. Test Health

```bash
curl http://localhost:3000/health
```

## API Workflow Example

### Step 1: Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
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
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### Step 2: Login

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
}
```

### Step 3: Create a Product

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "15-inch laptop",
    "price": 1999.99,
    "quantity": 10,
    "sku": "MBP-15-2024"
  }'
```

### Step 4: Get All Products

```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Get Product by ID

```bash
curl -X GET http://localhost:3000/api/v1/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Update Product

```bash
curl -X PUT http://localhost:3000/api/v1/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 8,
    "price": 1899.99
  }'
```

### Step 7: Get Low Stock Products

```bash
curl -X GET "http://localhost:3000/api/v1/products/low-stock?threshold=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 8: Delete Product

```bash
curl -X DELETE http://localhost:3000/api/v1/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

## User Management Examples

### Get Current User Profile

```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Get All Users (Admin/Paginated)

```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&search=john" \
  -H "Authorization: Bearer $TOKEN"
```

### Update User Profile

```bash
curl -X PUT http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "email": "jane@example.com"
  }'
```

### Deactivate User (Admin Only)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Activate User (Admin Only)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Search and Filter Examples

### Search Users by Name

```bash
curl -X GET "http://localhost:3000/api/v1/users?search=john&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Products by Name or Description

```bash
curl -X GET "http://localhost:3000/api/v1/products?search=laptop&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Products by User

```bash
curl -X GET "http://localhost:3000/api/v1/products?userId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling Examples

### Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "status": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid value"
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Missing Authorization Token

```bash
curl -X GET http://localhost:3000/api/v1/products
```

**Response:**
```json
{
  "status": false,
  "message": "Authorization token is missing",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Duplicate Email

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "status": false,
  "message": "User with this email already exists",
  "code": "CONFLICT",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Postman Collection

You can import this collection into Postman:

1. Create a new collection: "Redis CRUD API"
2. Add requests as shown above
3. Use environment variables:
   - `base_url`: http://localhost:3000/api/v1
   - `token`: Your JWT token from login
   - `user_id`: User ID for testing

## Performance Tips

1. **Caching**: The API automatically caches frequent queries in Redis
2. **Pagination**: Always use pagination for large datasets
3. **Search**: Use search with proper pagination for better performance
4. **Batch Operations**: Consider batch endpoints for bulk updates

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL
docker-compose logs postgres

# Verify connection
psql -h localhost -U postgres -d redis_crud_db
```

### Redis Connection Error

```bash
# Check Redis
docker-compose logs redis

# Verify connection
redis-cli ping
```

### Token Expired

Get a new token by logging in again:

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

## Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640341200
```
