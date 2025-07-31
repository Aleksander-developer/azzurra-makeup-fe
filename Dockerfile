# Stage 1: Build the Angular application
FROM node:20-bullseye AS builder 

# Aggiunto: ARG per la variabile d'ambiente che verrà passata durante la build
ARG API_BACKEND_URL="http://localhost:8080" 
ENV API_BACKEND_URL=$API_BACKEND_URL 

WORKDIR /app 

# Copia package.json e package-lock.json (sono nella root di QUESTA REPO)
COPY package.json package-lock.json ./ 

# Pulisci la cache di npm per assicurare un'installazione fresca
RUN npm cache clean --force 

# Installa le dipendenze del progetto
RUN npm install

# Copia il resto dei file sorgente (dalla root del contesto a /app)
COPY . .

# Esegui la build del CLIENT (browser)
RUN npx ng build --configuration=production --localize

# Esegui la build del SERVER (SSR)
# Assicurati che il nome del progetto qui sia azzurra-makeup-fe-new
RUN npx ng run azzurra-makeup-fe-new:server:production 

# Stage 2: Serve the application with a lightweight Node.js server
FROM node:20-bullseye 

WORKDIR /usr/src/app 

# Copia il contenuto della cartella 'dist/server' direttamente nella root del WORKDIR finale
COPY --from=builder /app/dist/server/ ./server 

# Copia il contenuto della cartella 'dist/browser' direttamente nella cartella 'browser' del WORKDIR finale
COPY --from=builder /app/dist/browser/ ./browser 

# Copia package.json e node_modules per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

# Comando per avviare l'applicazione
CMD [ "node", "./server/main.js" ]