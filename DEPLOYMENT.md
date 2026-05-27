# Deployment Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 12+
- Redis 6+
- A hosting provider (AWS, Heroku, DigitalOcean, etc.)

## Local Development Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your credentials

# Build TypeScript
npm run build

# Start development server
npm run dev
```

## Environment Configuration

### Development (.env.development)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=redis_crud_db
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-key
LOG_LEVEL=debug
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=3000
DB_HOST=prod-db-host.example.com
DB_PORT=5432
DB_NAME=redis_prod_db
DB_USER=prod_user
DB_PASSWORD=<STRONG_PASSWORD>
REDIS_HOST=prod-redis-host.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>
JWT_SECRET=<STRONG_SECRET>
JWT_EXPIRE=7d
LOG_LEVEL=info
CORS_ORIGIN=https://yourfrontend.com
```

## Database Setup

### Initialize Database

```bash
# Using Sequelize CLI
sequelize-cli db:migrate
sequelize-cli db:seed:all
```

### Backup Database

```bash
# PostgreSQL backup
pg_dump -U postgres -d redis_crud_db > backup.sql

# Restore backup
psql -U postgres -d redis_crud_db < backup.sql
```

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t redis-crud-api:1.0.0 .

# Tag for registry
docker tag redis-crud-api:1.0.0 your-registry/redis-crud-api:1.0.0

# Push to registry
docker push your-registry/redis-crud-api:1.0.0
```

### Run Docker Container

```bash
docker run -d \
  --name redis-crud-api \
  -p 3000:3000 \
  --env-file .env.production \
  --network redis-network \
  redis-crud-api:1.0.0
```

### Docker Compose Production

```yaml
version: '3.9'

services:
  app:
    image: your-registry/redis-crud-api:1.0.0
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: redis_crud_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## AWS Deployment

### Option 1: EC2 + RDS + ElastiCache

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone <repo-url>
cd redis-demo

# 4. Install dependencies
npm install
npm run build

# 5. Configure environment
sudo nano /etc/redis-demo/.env

# 6. Create systemd service
sudo nano /etc/systemd/system/redis-crud-api.service
```

### Systemd Service File

```ini
[Unit]
Description=Redis CRUD API
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/home/node/redis-demo
ExecStart=/usr/bin/node /home/node/redis-demo/dist/index.js
Restart=on-failure
RestartSec=5s
StandardOutput=append:/var/log/redis-crud-api/app.log
StandardError=append:/var/log/redis-crud-api/error.log

[Install]
WantedBy=multi-user.target
```

### Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable redis-crud-api
sudo systemctl start redis-crud-api
sudo systemctl status redis-crud-api
```

## Heroku Deployment

```bash
# 1. Create Procfile
echo "web: node dist/index.js" > Procfile

# 2. Create app
heroku create redis-crud-api

# 3. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 4. Add Redis
heroku addons:create heroku-redis:premium-0

# 5. Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# 6. Deploy
git push heroku main

# 7. View logs
heroku logs --tail
```

## DigitalOcean App Platform

```yaml
name: redis-crud-api
services:
- name: web
  github:
    repo: your-org/redis-crud-api
    branch: main
  build_command: npm install && npm run build
  run_command: node dist/index.js
  http_port: 3000
  health_check:
    http_path: /health
    initial_delay_seconds: 5
    period_seconds: 10
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    secret: true
  - key: DB_HOST
    value: ${db.hostname}
  - key: REDIS_HOST
    value: ${redis.hostname}

databases:
- engine: PG
  name: postgres
  version: "15"
- engine: REDIS
  name: redis
  version: "7"
```

## SSL/TLS Setup

### Using Let's Encrypt with Nginx

```bash
# Install Nginx
sudo apt-get install nginx

# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Create Nginx config
sudo nano /etc/nginx/sites-available/redis-crud-api
```

### Nginx Configuration

```nginx
upstream api {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600.5
}
```

### Monitoring Tools

- **PM2** - Process manager
- **New Relic** - APM
- **DataDog** - Infrastructure monitoring
- **Prometheus** - Metrics collection
- **Grafana** - Visualization

### PM2 Setup

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name "redis-crud-api"

# Monitor
pm2 monit

# Logs
pm2 logs redis-crud-api

# Save startup
pm2 startup
pm2 save
```

## Scaling Strategies

### Horizontal Scaling

```bash
# Run multiple instances behind load balancer
pm2 start dist/index.js -i 4  # 4 instances

# Or use Docker Compose
docker-compose up -d --scale app=4
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement better caching

### Database Scaling

- Read replicas for SELECT queries
- Write master for INSERT/UPDATE/DELETE
- Connection pooling
- Query optimization

### Redis Scaling

- Redis Cluster for distribution
- Sentinel for high availability
- Persistence configuration

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/redis-crud-api"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump -U postgres -d redis_crud_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Redis backup
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# Upload to S3
aws s3 cp $BACKUP_DIR s3://my-backup-bucket/$(date +%Y/%m/%d)/ --recursive
```

### Cron Job

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup.sh  # Daily at 2 AM
```

## Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:3000/api/v1/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:3000/api/v1/health

# Using Artillery
npm install -g artillery
artillery run load-test.yml
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS certificate installed
- [ ] Reverse proxy configured (Nginx)
- [ ] PM2 or systemd setup
- [ ] Monitoring tools installed
- [ ] Backup strategy implemented
- [ ] Logging configured
- [ ] Health checks setup
- [ ] CDN configured (if needed)
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Load testing completed
- [ ] Incident response plan ready

## Troubleshooting

### High Memory Usage

```bash
# Check memory
node --max_old_space_size=4096 dist/index.js

# Profile with clinic
npm install -g clinic
clinic doctor -- node dist/index.js
```

### Slow Queries

```bash
# Enable query logging
LOG_LEVEL=debug npm start

# Check Redis performance
redis-cli slowlog get 10
```

### Connection Pool Issues

```typescript
// Adjust pool settings in database.ts
pool: {
  max: 10,        // Increase if needed
  min: 2,
  acquire: 30000,
  idle: 10000
}
```

## Performance Optimization

1. Enable gzip compression in Nginx
2. Implement CDN for static assets
3. Use database indexes
4. Optimize Redis TTL values
5. Implement pagination
6. Use connection pooling
7. Enable HTTP/2
8. Implement caching headers

## Security Hardening

1. Use strong JWT secret
2. Enable HTTPS/TLS
3. Implement rate limiting
4. Set secure CORS origin
5. Use environment variables for secrets
6. Enable request validation
7. Implement CSRF protection
8. Use security headers
9. Keep dependencies updated
10. Run security audits: `npm audit`
