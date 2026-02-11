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
