# Ledger Tampering Detection System

**Live Demo**: [https://ledger-tampering-detection.onrender.com](https://ledger-tampering-detection.onrender.com)

> Hosted on Render free tier — may take ~30s to wake up on first visit.

A demonstration project showing how distributed ledger systems detect data tampering through cryptographic hashing and consensus verification.

## Project Overview

This system simulates a distributed ledger network with multiple nodes. Each node maintains a copy of the transaction ledger, and any unauthorized modification to one node's data is immediately detected through hash comparison.

### Key Features
- Multiple node simulation (Node-A, Node-B, Node-C)
- SHA-256 cryptographic hashing & Merkle trees
- Real-time tampering detection via WebSocket
- Interactive React dashboard
- REST API for all operations
- JWT authentication with role-based access (ADMIN, AUDITOR, USER, VIEWER)
- Audit logs, snapshots & forensics

## Architecture

```
           +-------------+
           |  React SPA  |
           +-------------+
                  |
                  | REST API + WebSocket
                  |
        +-------------------+
        |  Spring Boot App  |
        +-------------------+
                  |
            MongoDB Atlas
          /        |        \
         /         |         \
    Node-A      Node-B     Node-C
     Ledger      Ledger      Ledger
     Hash        Hash        Hash
```

## Technologies Used

- **Backend**: Java 17, Spring Boot 3.2.0
- **Frontend**: React 19, Vite, React Router
- **Database**: MongoDB Atlas
- **Auth**: JWT (roles: ADMIN, AUDITOR, USER, VIEWER)
- **Hashing**: SHA-256, Merkle Trees
- **Real-time**: WebSocket (STOMP)
- **Build**: Maven, Docker (multi-stage)
- **Deployment**: Render
- **Libraries**: Lombok, Jackson, jjwt

## Project Structure

```
Ledger-Tampering-Detection/
├── backend/
│   ├── src/main/java/com/ledger/
│   │   ├── controller/        # REST endpoints
│   │   ├── service/           # Business logic
│   │   ├── model/             # MongoDB documents
│   │   ├── repository/        # Spring Data repos
│   │   ├── security/          # JWT filter & config
│   │   └── config/            # CORS, WebSocket
│   └── pom.xml
├── frontend/
│   └── src/
│       ├── pages/             # Dashboard, Alerts, Audit, etc.
│       ├── components/        # Navbar, NodeCard, Toast
│       ├── context/           # AuthContext
│       ├── api/               # Axios API calls
│       └── hooks/             # useAlertSocket
├── Dockerfile                 # Multi-stage build
├── render.yaml                # Render deployment config
└── README.md
```

## Demo Credentials

| Username | Password | Role    | Access                       |
|----------|----------|---------|------------------------------|
| admin    | admin123 | ADMIN   | Full access                  |
| auditor  | audit123 | AUDITOR | Detect, forensics, snapshots |
| user1    | user123  | USER    | Add transactions             |
| viewer   | view123  | VIEWER  | Read-only                    |

## Role-Based Access

| Feature              | VIEWER | USER | AUDITOR | ADMIN |
|----------------------|--------|------|---------|-------|
| View nodes           | yes    | yes  | yes     | yes   |
| Add transactions     | no     | yes  | yes     | yes   |
| Detect tampering     | yes    | yes  | yes     | yes   |
| Audit log            | yes    | yes  | yes     | yes   |
| Alerts (view)        | yes    | yes  | yes     | yes   |
| Alerts (resolve)     | no     | no   | yes     | yes   |
| Integrity report     | yes    | yes  | yes     | yes   |
| Snapshots/Forensics  | no     | no   | yes     | yes   |
| Tamper/Reset/Users   | no     | no   | no      | yes   |

## Getting Started (Local)

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 20+
- MongoDB (local or Atlas)

### Run Backend
```bash
cd backend
mvn spring-boot:run
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

## REST API Endpoints

### Auth
```http
POST /api/auth/login
POST /api/auth/signup
```

### Transactions
```http
POST /api/transaction
GET  /api/nodes
GET  /api/detect
POST /api/tamper?nodeId=Node-B&transactionId=TX-001&newAmount=999
POST /api/reset
```

### Reports
```http
GET /api/audit
GET /api/alerts
GET /api/integrity
GET /api/forensics/{nodeId}
GET /api/snapshots
```

## How It Works

### 1. Hash Generation
Each node generates a SHA-256 hash of its entire ledger:
```
Ledger Data → SHA-256 → Hash (64 characters)
```

### 2. Merkle Tree
Transactions are organized in a Merkle tree — any single change invalidates the root hash.

### 3. Tampering Detection
```java
referenceHash = nodes[0].hash
for each node:
    if node.hash != referenceHash:
        node.tampered = true
```

### 4. Consensus Verification
- All nodes must have identical hashes
- Any mismatch indicates tampering
- Majority consensus determines valid state

## Deployment

Deployed as a single Docker container on Render:
- Multi-stage Dockerfile builds React frontend and Spring Boot backend
- React build is bundled into the Spring Boot JAR as static resources
- MongoDB Atlas used as the cloud database

## Troubleshooting

**Port already in use:**
- Change port in `application.properties`: `server.port=8081`

**Maven build fails:**
- Ensure Java 17+ is installed: `java -version`

**Dashboard not loading:**
- Check backend: `http://localhost:8080/api/nodes`

## Author

Created as an educational demonstration of distributed ledger security principles.

## License

This project is open source and available for educational purposes.

---

**Note**: This is a demonstration project for learning purposes. Production blockchain systems require additional security measures, network protocols, and consensus algorithms.
