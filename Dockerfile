# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend JAR
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -q
COPY backend/src ./src
COPY --from=frontend-build /frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -q -Dcopy-frontend.skip=true

# Stage 3: Install blockchain bridge deps + compile contract
FROM node:20-alpine AS blockchain-build
WORKDIR /blockchain
COPY blockchain/package*.json ./
RUN npm install
COPY blockchain/ ./
RUN npx hardhat compile

# Stage 4: Final runtime image — Node + Java together
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install Node.js into the JRE image
RUN apk add --no-cache nodejs npm wget

# Copy Spring Boot JAR
COPY --from=backend-build /backend/target/ledger-tampering-detection-1.0.0.jar app.jar

# Copy blockchain bridge (with node_modules and compiled artifacts)
COPY --from=blockchain-build /blockchain /blockchain

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 10000

ENTRYPOINT ["/start.sh"]
