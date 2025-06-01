# Restaurant POS System Backend

This is the backend for the Restaurant POS (Point of Sale) system. It provides APIs for managing tables, orders, menu items, and user authentication.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant-pos
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=24h
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected route)

### Tables

- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create a new table
- `GET /api/tables/:id` - Get table by ID
- `PUT /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Menu

- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create a new menu item
- `GET /api/menu/:id` - Get menu item by ID
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Chefs

- `GET /api/chefs` - Get all chefs
- `GET /api/chefs/:id/orders` - Get orders assigned to a chef

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication

Most routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Role-Based Access Control

The system supports three roles:

- admin: Full access to all features
- chef: Can view and update assigned orders
- staff: Can create orders and manage tables
