# Smart Inventory and Sales Management System

A beginner-friendly MCA project using React, Node.js, Express.js and MongoDB.

## Features
- Admin registration and login (passwords are hashed)
- Product add, edit, delete and search
- Separate Inventory collection with stock and minimum-stock level
- Customer add, edit and delete
- Sales recording with automatic stock reduction
- Dashboard totals, low-stock alerts and recent sales

## Software required
1. Node.js LTS
2. Visual Studio Code
3. MongoDB Community Server (local) OR a MongoDB Atlas database

## Step 1 - Start MongoDB
For a local MongoDB installation, make sure the MongoDB service is running.
The default connection in `.env` uses `mongodb://127.0.0.1:27017/smart_inventory`.
If you use MongoDB Atlas, replace MONGO_URI with your Atlas connection string.

## Step 2 - Configure backend
Open a terminal in the `backend` folder and run:
```bash
npm install
```
Copy `.env.example` to a new file named `.env`.
Keep the default MONGO_URI for local MongoDB, or paste your Atlas URI.
Change JWT_SECRET to a long private random value.

Start backend:
```bash
npm run dev
```
Expected message: `MongoDB connected successfully` and `Backend running at http://localhost:5000`.

Test in a browser: http://localhost:5000/

## Step 3 - Configure frontend
Open a second terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
Open the local address printed by Vite, usually http://localhost:5173/.

## Step 4 - First login
Choose Create account on the login screen. Enter your name, email and a password of at least 6 characters.
Then log in using those details.

## Important
- Keep both backend and frontend terminals running while using the app.
- Do not share your `.env` file or database password.
- This is a learning/demo project. Before real commercial use, add role management, stronger validation, backups, audit logs, and database transactions.
- Sales currently allow one product per transaction from the user interface. The database model supports multiple items.
