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
RUN npm run build:ssr

# Stage 2: Serve the application with a lightweight Node.js server
FROM node:20

WORKDIR /usr/src/app

# Copia i bundle compilati
# Il percorso di origine è /app/dist/server/
COPY --from=builder /app/dist/server/ ./server 

# Copia la cartella del browser buildata
# Il percorso di origine è /app/dist/browser/
COPY --from=builder /app/dist/browser/ ./browser 

# Copia i file per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

# Comando per avviare l'applicazione
# main.js è ora all'interno della cartella 'server' che è stata copiata
CMD [ "node", "./server/main.js" ]