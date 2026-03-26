# 🚀 Quick Start Guide

## Run the Application

1. Open terminal in project directory
2. Run: `mvn spring-boot:run`
3. Open browser: `http://localhost:8080`

## Demo Steps

### Step 1: Add Transaction
- Fill in: ID=1, From=Alice, To=Bob, Amount=500
- Click "Add Transaction"
- Click "Refresh Nodes"
- **Result**: All 3 nodes show same hash ✅

### Step 2: Detect Tampering (Normal)
- Click "Detect Tampering"
- **Result**: "✓ All nodes synchronized - No tampering detected"

### Step 3: Tamper a Node
- Select "Node-B"
- Transaction ID: 1
- New Amount: 999
- Click "Tamper Node"
- Click "Refresh Nodes"
- **Result**: Node-B shows different hash and turns RED ⚠️

### Step 4: Detect Tampering (After Tampering)
- Click "Detect Tampering"
- **Result**: "⚠ Tampering detected in: Node-B"

### Step 5: Reset System
- Click "Reset System"
- Start over with clean state

## API Testing (Optional)

```bash
# Add transaction
curl -X POST http://localhost:8080/api/transaction -H "Content-Type: application/json" -d "{\"id\":1,\"from\":\"Alice\",\"to\":\"Bob\",\"amount\":100}"

# Detect tampering
curl http://localhost:8080/api/detect

# Get all nodes
curl http://localhost:8080/api/nodes
```

## Presentation Points

1. **Show Initial State**: All nodes synchronized with same hash
2. **Add Transactions**: Demonstrate how all nodes update together
3. **Tamper One Node**: Show how changing data changes the hash
4. **Detection**: System immediately identifies the tampered node
5. **Security**: Explain why this makes blockchain secure

## Key Concepts to Explain

- **Hash**: Digital fingerprint of data (SHA-256)
- **Tampering**: Any change to data changes the hash
- **Consensus**: All nodes must agree (same hash)
- **Detection**: Comparing hashes reveals tampering
- **Trust**: No single point of failure

## Troubleshooting

- **Port 8080 busy**: Change port in `application.properties`
- **Build fails**: Check Java version (`java -version` should be 17+)
- **Dashboard blank**: Ensure backend is running first
