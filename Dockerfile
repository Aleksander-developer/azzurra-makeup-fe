# FASE 1: "Builder"
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ssr

# FASE 2: "Runner"
FROM node:20
WORKDIR /usr/src/app
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 8080

# ---> MODIFICA CHIAVE <---
# Invece di usare "node" direttamente, usiamo lo script "start" di npm.
# Questo è il metodo standard e più robusto per avviare app Node.js.
CMD [ "npm", "start" ]