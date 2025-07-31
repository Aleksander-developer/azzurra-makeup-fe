# Stage 1: Build the Angular application
FROM node:20 AS builder

# Imposta la directory di lavoro principale per il progetto Angular
WORKDIR /app/azzurra-makeup-fe

# Copia i file di configurazione essenziali
COPY package.json package-lock.json ./
COPY . .

# Installa le dipendenze
RUN npm ci

# Esegui la build SSR
RUN npx ng build --configuration=production --localize && npx ng run azzurra-makeup-fe:server:production

# Stage 2: Serve the application with a lightweight Node.js server
FROM node:20

WORKDIR /usr/src/app

# Copia i bundle compilati
COPY --from=builder /app/dist/azzurra-makeup-fe/server/ ./server
COPY --from=builder /app/dist/azzurra-makeup-fe/browser/ ./browser

# Copia i file per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

CMD [ "node", "./server/main.js" ]