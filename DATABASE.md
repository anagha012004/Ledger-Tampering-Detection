# 🗄️ Database Integration Guide

## Database Configuration

Your Ledger Tampering Detection System now uses **H2 Database** for persistent storage.

### What Changed?

✅ **Before**: Data stored in memory (lost on restart)  
✅ **After**: Data persisted in H2 database file

## Database Details

- **Type**: H2 (Embedded SQL Database)
- **Location**: `./data/ledgerdb.mv.db`
- **Console**: `http://localhost:8080/h2-console`

## Database Schema

### Tables Created Automatically

#### 1. **nodes** table
```sql
CREATE TABLE nodes (
    node_id VARCHAR(255) PRIMARY KEY,
    ledger_hash VARCHAR(64),
    tampered BOOLEAN
);
```

#### 2. **transactions** table
```sql
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    from_user VARCHAR(255),
    to_user VARCHAR(255),
    amount DOUBLE,
    node_id VARCHAR(255)
);
```

## How to Access H2 Console

1. Start the application: `mvn spring-boot:run`
2. Open browser: `http://localhost:8080/h2-console`
3. Enter connection details:
   - **JDBC URL**: `jdbc:h2:file:./data/ledgerdb`
   - **Username**: `sa`
   - **Password**: (leave empty)
4. Click "Connect"

## Database Operations

### View All Nodes
```sql
SELECT * FROM nodes;
```

### View All Transactions
```sql
SELECT * FROM transactions;
```

### View Transactions by Node
```sql
SELECT * FROM transactions WHERE node_id = 'Node-A';
```

### Check Tampering Status
```sql
SELECT node_id, tampered, ledger_hash FROM nodes;
```

### Count Transactions per Node
```sql
SELECT node_id, COUNT(*) as transaction_count 
FROM transactions 
GROUP BY node_id;
```

## Benefits of Database Integration

✅ **Persistence**: Data survives application restarts  
✅ **Scalability**: Can handle large transaction volumes  
✅ **Query Power**: SQL queries for analysis  
✅ **Audit Trail**: Complete transaction history  
✅ **Real-world Simulation**: More realistic blockchain demo

## Configuration (application.properties)

```properties
# H2 Database Configuration
spring.datasource.url=jdbc:h2:file:./data/ledgerdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

## Testing Database Integration

### Test 1: Add Transaction
```bash
curl -X POST http://localhost:8080/api/transaction \
  -H "Content-Type: application/json" \
  -d '{"transactionId":1,"from":"Alice","to":"Bob","amount":100}'
```

Check database:
```sql
SELECT * FROM transactions;
```

### Test 2: Tamper Node
```bash
curl -X POST "http://localhost:8080/api/tamper?nodeId=Node-B&transactionId=1&newAmount=999"
```

Check database:
```sql
SELECT * FROM nodes WHERE node_id = 'Node-B';
SELECT * FROM transactions WHERE node_id = 'Node-B' AND transaction_id = 1;
```

### Test 3: Restart Application
1. Stop application (Ctrl+C)
2. Restart: `mvn spring-boot:run`
3. Check: `http://localhost:8080`
4. **Result**: All data is still there! ✅

## Switching to MySQL/PostgreSQL (Optional)

To use a production database, update `pom.xml` and `application.properties`:

### For MySQL:
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
```

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ledgerdb
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

### For PostgreSQL:
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ledgerdb
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## Troubleshooting

**Database file locked:**
- Close H2 console before restarting app

**Data not persisting:**
- Check `./data/` folder exists
- Verify `spring.jpa.hibernate.ddl-auto=update`

**H2 console not accessible:**
- Ensure `spring.h2.console.enabled=true`
- Check URL: `http://localhost:8080/h2-console`

## Database Location

The database file is created at:
```
Ledger-Tampering-Detection/
└── data/
    ├── ledgerdb.mv.db
    └── ledgerdb.trace.db
```

**Note**: Add `data/` to `.gitignore` if you don't want to commit database files.
