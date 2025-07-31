# Stage 1: Build the Angular application
FROM node:20-bullseye AS builder 

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
FROM node:20-bullseye 

WORKDIR /usr/src/app

# Copia il contenuto della cartella 'dist/server' direttamente in ./server
COPY --from=builder /app/dist/server/ ./server 

# Copia il contenuto della cartella 'dist/browser' direttamente in ./browser
COPY --from=builder /app/dist/browser/ ./browser 

# Copia package.json e node_modules per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

# Comando per avviare l'applicazione
# main.js si trova in /usr/src/app/server/main.js
CMD [ "node", "./server/main.js" ] 