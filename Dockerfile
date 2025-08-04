# FASE 1: "Builder" - Usiamo l'immagine Alpine
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ssr

# FASE 2: "Runner" - Usiamo l'immagine Alpine anche per la produzione
FROM node:20-alpine

WORKDIR /usr/src/app
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 8080

RUN ls -la /usr/src/app/dist/server && cat /usr/src/app/dist/server/main.js || echo "main.js non trovato o vuoto"



# Usiamo npm start come comando di avvio standard
CMD [ "npm", "start" ]