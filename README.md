# E-Commerce Web Application

A professional, full-stack E-commerce web application built with **React 19**, **Fastify**, and **PostgreSQL**, following **Clean Architecture** principles. This application features a premium user interface and a powerful admin management system.

## 🚀 Key Features

### 🛍️ Shopping Experience
*   **Dynamic Product Listing:** Responsive grid layout with category filtering and search.
*   **Premium Product Details:** High-resolution product views with inventory tracking.
*   **Advanced Shopping Cart:** Real-time updates, persistence, and simplified management.
*   **Multi-Step Checkout:** Guided 3-step flow (Shipping → Payment → Review) for a premium shopping experience.

### 🔐 Authentication & Security
*   **Secure Login:** JWT-based authentication system.
*   **Role-Based Access (RBAC):** Distinct permissions for **Customers** and **Admins**.
*   **Protected Routes:** Automatic redirection for unauthorized users.

### 📊 Admin Powerhouse
*   **Interactive Dashboard:** Real-time **Sales Trend Charts** using Recharts (Last 30 days visualization).
*   **KPI Tracking:** Instant visibility into Total Revenue and Order Volume.
*   **Order Management:** Comprehensive list of all customer orders with status tracking (Pending, Shipped, Paid, etc.).
*   **Product Management:** Full CRUD (Create, Read, Update, Delete) for the product catalog, including image uploads.
*   **Reporting:** Instant **CSV Export** of order reports for offline analysis.

## 🏗️ Architecture

### Clean Architecture Implementation
*   **Domain Layer**: Entities, interfaces, and core business rules.
*   **Application Layer**: Use cases and application services.
*   **Infrastructure Layer**: Database (PostgreSQL), Repositories, and External services.
*   **Presentation Layer**: Fastify controllers, routes, and Material-UI components.

### Technology Stack
*   **Backend (API)**: Fastify (Node.js), TypeScript, PostgreSQL, node-pg-migrate.
*   **Frontend (UI)**: React 19, TypeScript, Redux Toolkit, Material-UI (v6/7), Recharts.

## 📁 Project Structure

```
e-comerce/
├── API/                          # Backend Node.js application
│   ├── src/
│   │   ├── domain/              # Entities and Repository interfaces
│   │   ├── application/         # Business logic services
│   │   ├── infrastructure/      # DB, Repositories, Auth services
│   │   └── presentation/        # Routes, Controllers, Middlewares
│   ├── migrations/              # Database schema migrations
│   └── package.json
├── UI/                          # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Functional pages (Dashboard, Checkout, Login)
│   │   ├── store/               # Redux slices and state configuration
│   │   └── services/            # API service layers
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
*   Node.js (v18 or higher)
*   PostgreSQL running locally or via Docker

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Database
Create a `.env` file in the `API` directory:
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ecommerce
```

### 3. Run Migrations & Start
```bash
# Start both frontend and backend
npm run dev
```

### 👤 Default Admin Credentials
After running the seed script, you can log in to the Admin Dashboard using:
*   **Email:** `sreekumaronit@gmail.com`
*   **Password:** `Admin@123`

## 🌐 AWS Deployment

### Infrastructure Overview

The application can be deployed to AWS using CloudFormation with the following resources:
- **S3 Bucket**: Hosts the React frontend (static website)
- **Elastic Beanstalk**: Runs the Node.js backend API
- **RDS PostgreSQL**: Managed database instance
- **Lambda Function**: Automatic S3 bucket cleanup on stack deletion

### Deploy to AWS

```bash
# Using Bash
cd infrastructure
./deploy-stack.sh

# Using PowerShell
cd infrastructure
.\deploy-stack.ps1
```

The deployment script will:
1. Detect your default VPC and subnets
2. Create or update the CloudFormation stack
3. Deploy all infrastructure resources
4. Output the API and UI endpoints

### Stack Deletion

To delete the entire infrastructure stack:

```bash
# Using AWS CLI
aws cloudformation delete-stack --stack-name e-commerce-stack --region ap-south-2

# Or using AWS Console
# Go to CloudFormation → Select stack → Delete
```

**Important**: The S3 bucket will be automatically emptied before deletion. No manual cleanup required!

### Production Database Maintenance

When deploying to production (e.g., AWS RDS), use the following specialized scripts for database management. These scripts are optimized for cloud environments and support SSL connections.

#### 1. Database Migrations
To apply schema changes to your production database:
```bash
# Using PowerShell
$env:DATABASE_URL="postgres://user:password@host:5432/dbname"; npm run migrate:prod
```

#### 2. Database Seeding
To populate your production database with initial sample data (Admin user, Categories, Products):
```bash
# Using PowerShell
$env:DATABASE_URL="postgres://user:password@host:5432/dbname"; npm run seed:prod
```

> **Note:** The `DATABASE_URL` should follow the format: `postgres://username:password@rds-endpoint:5432/database_name`. If using AWS RDS, SSL will be automatically enabled for secure communication.

## 🔌 API Endpoints

### 🔐 Auth
*   `POST /api/auth/login` - Authenticate user
*   `POST /api/auth/register` - Create new account

### 🛍️ Store
*   `GET /api/products` - List products
*   `POST /api/orders` - Place new order
*   `GET /api/cart` - Retrieve user cart

### 📈 Admin (Admin Role Required)
*   `GET /api/admin/stats` - Dashboard KPI data
*   `GET /api/admin/daily-sales` - Time-series sales data for charts
*   `GET /api/admin/orders` - View all orders
*   `GET /api/admin/orders/export` - Download CSV report

## 🎨 Design Aesthetics
The application uses a **Premium UI** approach:
*   **Rich Visuals**: Deep blue and secondary pink palette.
*   **Modern Charts**: Area-filled gradients for sales data.
*   **Guided UX**: Stepper-based checkout and intuitive admin navigation.

---

**Happy Shopping & Managing! 🛍️📈**
