# Jewelry Inventory Management System

A complete inventory and stock management application for imitation jewelry businesses. Includes admin panel for managing products, categories, and sales, plus a customer-facing storefront where customers can browse and contact you via WhatsApp.

## Features

### Admin Panel
- Dashboard with sales statistics and analytics
- Product management (add, edit, delete with image uploads)
- Category management
- Sales recording and tracking
- Business settings (contact info, WhatsApp number)

### Customer Storefront
- Browse products by category
- Search products
- View product details
- Contact via WhatsApp to order

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React (Vite), React Router
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

---

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (optional)

### Step 1: Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your settings
# Important: Change these values!
# - DB_PASSWORD
# - JWT_SECRET
# - ADMIN_PASSWORD
# - WHATSAPP_NUMBER
# - PHONE_NUMBER
```

### Step 2: Run the Application

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Step 3: Access the Application

- **Customer Storefront**: http://localhost
- **Admin Panel**: http://localhost/admin/login

### Default Admin Credentials
- Email: `admin@jewelry.com`
- Password: `admin123`

> **Important**: Change these credentials after first login!

---

## Hosting on Hostinger

### Requirements
You need **Hostinger VPS** (not shared hosting) to run Docker.

### Step 1: Get a Hostinger VPS

1. Go to Hostinger and purchase a VPS plan
2. Choose Ubuntu 22.04 as your OS
3. Note your server IP address

### Step 2: Connect to Your VPS

```bash
ssh root@your-server-ip
```

### Step 3: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Upload Your Application

```bash
# Create app directory
mkdir -p /var/www/jewelry-app
cd /var/www/jewelry-app

# Upload your files (from your local machine)
# Option 1: Using SCP
scp -r ./jewelry-inventory/* root@your-server-ip:/var/www/jewelry-app/

# Option 2: Using Git (if you have a repository)
git clone your-repo-url .
```

### Step 5: Configure Environment

```bash
# Create and edit .env file
cp .env.example .env
nano .env

# Update with production values:
# DB_PASSWORD=your_strong_password
# JWT_SECRET=your_random_secret_key
# ADMIN_PASSWORD=your_admin_password
# WHATSAPP_NUMBER=+91XXXXXXXXXX
# PHONE_NUMBER=+91XXXXXXXXXX
```

### Step 6: Start Application

```bash
docker-compose up -d --build
```

### Step 7: Setup Domain (Optional)

1. Point your domain to your VPS IP in DNS settings
2. Install and configure Nginx or Traefik for SSL

Example with Nginx reverse proxy:

```bash
# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y

# Configure Nginx
nano /etc/nginx/sites-available/jewelry

# Add configuration for your domain
# Then get SSL certificate
certbot --nginx -d yourdomain.com
```

---

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:5173 and proxy API requests to the backend.

---

## API Endpoints

### Public
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `GET /api/categories` - List categories
- `GET /api/settings` - Get business settings

### Admin (requires auth)
- `POST /api/auth/login` - Login
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/sales` - Record sale
- `GET /api/sales` - List sales
- `GET /api/stats` - Dashboard statistics

---

## Project Structure

```
jewelry-inventory/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── uploads/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        ├── components/
        ├── layouts/
        ├── pages/
        └── utils/
```

---

## Troubleshooting

### Containers not starting
```bash
docker-compose logs
```

### Database connection issues
```bash
docker-compose exec postgres psql -U jewelry_admin -d jewelry_inventory
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## Support

For issues and feature requests, please create an issue in the repository.
