# 🔒 Ledger Tampering Detection System

A demonstration project showing how distributed ledger systems detect data tampering through cryptographic hashing and consensus verification.

## 📋 Project Overview

This system simulates a distributed ledger network with multiple nodes. Each node maintains a copy of the transaction ledger, and any unauthorized modification to one node's data is immediately detected through hash comparison.

### Key Features
- ✅ Multiple node simulation (Node-A, Node-B, Node-C)
- ✅ SHA-256 cryptographic hashing
- ✅ Real-time tampering detection
- ✅ Interactive web dashboard
- ✅ REST API for all operations
- ✅ Transaction management

## 🏗️ Architecture

```
           +-------------+
           |  Dashboard  |
           +-------------+
                  |
                  | REST API
                  |
        +-------------------+
        |  Spring Boot App  |
        +-------------------+
          /        |        \
         /         |         \
    Node-A      Node-B     Node-C
     Ledger      Ledger      Ledger
     Hash        Hash        Hash
```

## 🛠️ Technologies Used

- **Backend**: Java 17, Spring Boot 3.2.0
- **Hashing**: SHA-256
- **Frontend**: HTML5, CSS3, JavaScript
- **Build Tool**: Maven
- **Libraries**: Lombok, Jackson

## 📁 Project Structure

```
ledger-tampering-detection/
├── src/
│   └── main/
│       ├── java/com/ledger/
│       │   ├── LedgerTamperingDetectionApplication.java
│       │   ├── controller/
│       │   │   └── LedgerController.java
│       │   ├── service/
│       │   │   ├── LedgerService.java
│       │   │   └── HashService.java
│       │   └── model/
│       │       ├── Transaction.java
│       │       ├── Ledger.java
│       │       └── Node.java
│       └── resources/
│           ├── application.properties
│           └── static/
│               └── index.html
└── pom.xml
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Any modern web browser

### Installation & Running

1. **Navigate to project directory**
   ```bash
   cd Ledger-Tampering-Detection
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Access the dashboard**
   Open your browser and go to: `http://localhost:8080`

## 📡 REST API Endpoints

### Add Transaction
```http
POST /api/transaction
Content-Type: application/json

{
  "id": 1,
  "from": "UserA",
  "to": "UserB",
  "amount": 500
}
```

### Tamper Node (Demo)
```http
POST /api/tamper?nodeId=Node-B&transactionId=1&newAmount=999
```

### Detect Tampering
```http
GET /api/detect
```

### Get All Nodes
```http
GET /api/nodes
```

### Get Specific Node
```http
GET /api/nodes/Node-A
```

### Reset System
```http
POST /api/reset
```

## 🎯 How to Demonstrate

### Scenario 1: Normal Operation
1. Add a transaction (e.g., UserA → UserB, $500)
2. Click "Refresh Nodes" - all nodes show same hash ✅
3. Click "Detect Tampering" - shows "All nodes synchronized"

### Scenario 2: Tampering Detection
1. Add a transaction
2. Select "Node-B" and tamper the transaction (change amount to $999)
3. Click "Detect Tampering"
4. System shows: ⚠️ **Tampering detected in Node-B**
5. Node-B card turns red with "TAMPERED" status
6. Hash comparison shows Node-B has different hash

### Scenario 3: Multiple Transactions
1. Add multiple transactions
2. Tamper one transaction in Node-C
3. System detects the specific tampered node
4. Shows all transactions with modified data highlighted

## 🔐 How It Works

### 1. Hash Generation
Each node generates a SHA-256 hash of its entire ledger:
```
Ledger Data → SHA-256 → Hash (64 characters)
```

### 2. Tampering Detection Algorithm
```java
referenceHash = nodes[0].hash
for each node:
    if node.hash != referenceHash:
        node.tampered = true
```

### 3. Consensus Verification
- All nodes must have identical hashes
- Any mismatch indicates tampering
- Majority consensus determines valid state

## 📊 Example Output

**Before Tampering:**
```
Node-A: Hash = 7f3a9c2b... ✅ OK
Node-B: Hash = 7f3a9c2b... ✅ OK
Node-C: Hash = 7f3a9c2b... ✅ OK
Status: All nodes synchronized
```

**After Tampering Node-B:**
```
Node-A: Hash = 7f3a9c2b... ✅ OK
Node-B: Hash = 8ac24f1d... ⚠️ TAMPERED
Node-C: Hash = 7f3a9c2b... ✅ OK
Status: ⚠ Tampering detected in Node-B
```

## 🎓 Educational Value

This project demonstrates:
- **Data Integrity**: How hashing ensures data hasn't been modified
- **Distributed Trust**: Multiple nodes verify each other
- **Cryptographic Security**: SHA-256 makes tampering detectable
- **Consensus Mechanisms**: How blockchain systems maintain agreement
- **Immutability Concept**: Changes are immediately visible

## 🔧 Advanced Features (Optional Extensions)

You can extend this project with:
- Blockchain-style linking (previousHash)
- Timestamp for each transaction
- Digital signatures
- Consensus algorithms (PBFT, PoW)
- Network simulation with delays
- Automatic node recovery
- Merkle tree implementation

## 📝 Testing with cURL

```bash
# Add transaction
curl -X POST http://localhost:8080/api/transaction \
  -H "Content-Type: application/json" \
  -d '{"id":1,"from":"Alice","to":"Bob","amount":100}'

# Tamper node
curl -X POST "http://localhost:8080/api/tamper?nodeId=Node-B&transactionId=1&newAmount=999"

# Detect tampering
curl http://localhost:8080/api/detect

# Get all nodes
curl http://localhost:8080/api/nodes
```

## 🐛 Troubleshooting

**Port 8080 already in use:**
- Change port in `application.properties`: `server.port=8081`

**Maven build fails:**
- Ensure Java 17+ is installed: `java -version`
- Update Maven: `mvn -version`

**Dashboard not loading:**
- Check if backend is running: `http://localhost:8080/api/nodes`
- Check browser console for errors

## 👨‍💻 Author

Created as an educational demonstration of distributed ledger security principles.

## 📄 License

This project is open source and available for educational purposes.

---

**Note**: This is a demonstration project for learning purposes. Production blockchain systems require additional security measures, network protocols, and consensus algorithms.
