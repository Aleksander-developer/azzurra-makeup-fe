# Stage 1: Build the Angular application
FROM node:20 AS builder

WORKDIR /app

# Copia package.json e package-lock.json
COPY package.json package-lock.json ./

# Pulisci la cache di npm
RUN npm cache clean --force 

# Installa le dipendenze
RUN npm install

# Copia il resto dei file sorgente
COPY . .

# Esegui la build SSR
RUN npx ng build --configuration=production --localize && npx ng run azzurra-makeup-fe-new:server:production

# Stage 2: Serve the application with a lightweight Node.js server
FROM node:20

WORKDIR /usr/src/app

# Copia i bundle compilati
COPY --from=builder /app/dist/server/ ./server 
COPY --from=builder /app/dist/browser/ ./browser 

# Copia i file per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

# Comando per avviare l'applicazione
CMD [ "node", "./server/main.js" ]