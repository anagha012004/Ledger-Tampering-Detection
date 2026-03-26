# Ledger Tampering Detection — Monorepo

```
Ledger-Tampering-Detection/
├── backend/    Spring Boot 3 + Java 17 + H2 + JWT
└── frontend/   React 18 + Vite + React Router
```

## Running

### Backend (port 8080)
```bash
cd backend
mvn spring-boot:run
```

### Frontend (port 5173)
```bash
cd frontend
npm install   # first time only
npm run dev
```

Open http://localhost:5173

## Pages
| Route        | Description                        |
|--------------|------------------------------------|
| /            | Login                              |
| /dashboard   | Node grid, add tx, tamper, detect  |
| /audit       | Audit log viewer with search/filter|
| /alerts      | Active alerts + resolve button     |
| /integrity   | Merkle root + integrity report     |
| /snapshots   | Create, list, compare snapshots    |
| /forensics   | Per-node hash chain forensics      |
