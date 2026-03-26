# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app
COPY backend/pom.xml ./backend/
RUN mvn -f backend/pom.xml dependency:go-offline -q
COPY backend/src ./backend/src
COPY --from=frontend-build /frontend/dist ./frontend/dist
WORKDIR /app/backend
RUN mvn clean package -DskipTests -q

# Stage 3: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/ledger-tampering-detection-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
