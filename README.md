# Fragrance Corner — Express + MySQL Backend

A RESTful API backend built with **Node.js**, **Express**, and **MySQL 8.0** to manage the perfume collection for the **Fragrance Corner** platform. All sensitive API endpoints require mandatory authentication using a **JWT Bearer Token** issued by Keycloak.

---

## 🚀 Technologies Used

- **HTTP Server**: Node.js + Express
- **Database**: MySQL 8.0 (`mysql2/promise`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken` / `jwt-decode`)
- **CORS**: Middleware for cross-origin requests
- **Containerization**: Docker + Docker Compose (with persistent data volumes)

---

## 🔒 Security & JWT Authentication

The server includes a `requireBearerToken` middleware that intercepts all incoming requests to `/api/perfumes`:

- Validates the presence of the `Authorization: Bearer <JWT_TOKEN>` header.
- Decodes the token claims without modifying signatures and extracts user identity (Keycloak claims).
- If the header is missing or empty, the API immediately returns an `HTTP 401 Unauthorized` response.

---

## 📡 API Endpoints

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check endpoint for service status |
| `GET` | `/api/perfumes` | Bearer Token JWT | Retrieves the complete perfume list ordered by creation date |
| `POST` | `/api/perfumes` | Bearer Token JWT | Registers a new perfume entry in MySQL |
| `DELETE` | `/api/perfumes/:id` | Bearer Token JWT | Deletes an existing perfume by its ID |

---

## 🗄️ Database Schema

**Database**: `fragrance_corner_db`  
**Table**: `perfumes`

```sql
CREATE TABLE IF NOT EXISTS perfumes (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Oriental',
  gender VARCHAR(50) DEFAULT 'Unisex',
  price DECIMAL(10, 2) NOT NULL,
  volume INT DEFAULT 100,
  rating DECIMAL(3, 1) DEFAULT 4.8,
  image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **Note on Images**: The `image` column is defined as `LONGTEXT` to support Base64 string representations of user-uploaded images.

---

## 📦 Running with Docker Compose (Recommended)

From the `perfume-backend` directory:

```bash
# Start Express backend and MySQL 8.0 services
docker-compose up -d --build
```

### Deployed Containers:
- **`perfume-express-backend`**: Node.js Express server running at `http://localhost:3001`
- **`perfume-mysql-db`**: MySQL database on `localhost:3307` (mapped to container port `3306`)
- **Persistent Volume**: `mysql_perfume_data` ensuring data persistence across service restarts.

---

## 💻 Running Locally without Docker

### 1. Environment Variables (`.env`)

Create a `.env` file in the root of `perfume-backend`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=fragrance_corner_db
```

### 2. Install & Start Server

```bash
# Install dependencies
npm install

# Start Express server
npm start
```

---

## 📁 Project Structure

```text
perfume-backend/
├── db.js                # MySQL pool connection, table initialization & CRUD operations
├── server.js            # Express server, JWT validation middleware & API routes
├── Dockerfile           # Docker image specification for backend
├── docker-compose.yml   # Docker Compose orchestration (Express + MySQL + Volume)
├── package.json
└── README.md            # Backend documentation
```
