# Stage 1: Build the Angular SSR application
FROM node:20 AS builder

WORKDIR /app

# Copia package.json e installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia tutto il codice sorgente
COPY . .

# Compila app Angular con localizzazione e SSR
RUN npx ng build --configuration=production --localize && \
    npx ng run azzurra-makeup-fe-new:server:production

# Stage 2: Serve app con Node.js
FROM node:20

WORKDIR /app

# Copia i file compilati necessari
COPY --from=builder /app/dist/browser /app/dist/browser
COPY --from=builder /app/dist/server /app/dist/server
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Espone la porta usata da Cloud Run
EXPOSE 8080

# Comando per avviare il server SSR
CMD ["node", "dist/server/main.js"]
