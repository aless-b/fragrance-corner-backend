# Fragrance Corner — Express + MySQL Backend (Protected with Fail2Ban)

A RESTful API backend built with **Node.js**, **Express**, and **MySQL 8.0** to manage the perfume collection for the **Fragrance Corner** platform. All sensitive API endpoints require mandatory authentication using a **JWT Bearer Token** issued by Keycloak, and the container is protected against HTTP floods using **Nginx + Fail2Ban + `iptables`**.

---

## 🚀 Technologies Used

- **HTTP Server**: Node.js + Express
- **Database**: MySQL 8.0 (`mysql2/promise`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Security & Rate Limiting**: Nginx + Fail2Ban (`http-flood` jail) + `iptables`
- **Containerization**: Docker + Docker Compose (`NET_ADMIN` & `NET_RAW` capabilities, persistent volume)

---

## 🛡️ Fail2Ban HTTP Protection

Inside the `perfume-express-backend` container, **Nginx** listens on ports `80` and `3001`, recording every HTTP request in `/var/log/nginx/access.log` and proxying to the internal Express server (`127.0.0.1:3002`).

- **Jail**: `[http-flood]` defined in `jail.local`
- **Filter**: `filter-http-flood.conf`
- **Threshold**: `maxretry = 60` requests within `findtime = 10s`
- **Ban Action**: `iptables-allports` (`bantime = 10m`, escalating up to `1d`)

### Verify Fail2Ban Status:
```bash
docker exec perfume-express-backend fail2ban-client status http-flood
docker exec perfume-express-backend iptables -S | grep -i f2b
```

---

## 🔒 JWT Bearer Token Authentication

The server includes a `requireBearerToken` middleware that intercepts all incoming requests to `/api/perfumes`:

- Validates the presence of the `Authorization: Bearer <JWT_TOKEN>` header.
- Decodes the token claims and extracts user identity (Keycloak claims).
- If the header is missing or empty, the API immediately returns an `HTTP 401 Unauthorized` response.

---

## 📡 API Endpoints

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/` | Public | Root service health status (`200 OK`) |
| `GET` | `/api/health` | Public | Health check endpoint for service status |
| `GET` | `/api/perfumes` | Bearer Token JWT | Retrieves the complete perfume list ordered by creation date |
| `POST` | `/api/perfumes` | Bearer Token JWT | Registers a new perfume entry in MySQL |
| `DELETE` | `/api/perfumes/:id` | Bearer Token JWT | Deletes an existing perfume by its ID |

---

## 📦 Running with Docker Compose

```bash
docker compose up -d --build
```

### Deployed Containers:
- **`perfume-express-backend`**: Express + Nginx + Fail2Ban server at `http://localhost:3001`
- **`perfume-mysql-db`**: MySQL 8.0 database on `localhost:3307` (mapped to container port `3306`)
- **Persistent Volume**: `mysql_perfume_data`

---

## 📁 Project Structure

```text
perfume-backend/
├── db.js                   # MySQL pool connection, table initialization & CRUD operations
├── server.js               # Express server, JWT validation middleware & API routes
├── Dockerfile              # Docker image with Node 20, Nginx, Fail2Ban & iptables
├── docker-compose.yml      # Docker Compose orchestration (Express + MySQL + Volume)
├── entrypoint.sh           # Starts Express, Nginx, and Fail2Ban
├── filter-http-flood.conf  # Fail2Ban filter for HTTP flood detection
├── jail.local              # Fail2Ban jail configuration
├── nginx.conf              # Nginx reverse proxy & access log configuration
├── package.json
└── README.md
```
