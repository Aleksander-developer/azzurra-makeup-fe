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

# Esegui la build del CLIENT (browser)
RUN npx ng build --configuration=production --localize

# Esegui la build del SERVER (SSR)
# CAMBIATO: Correzione del nome del progetto
RUN npx ng run azzurra-makeup-fe-new:server:production 

# Stage 2: Serve the application
FROM node:20

WORKDIR /usr/src/app

# Copia i bundle compilati
# I percorsi devono essere relativi al nome del progetto
COPY --from=builder /app/dist/azzurra-makeup-fe-new/server/ ./server 
COPY --from=builder /app/dist/azzurra-makeup-fe-new/browser/ ./browser 

# Copia i file per il runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 8080

CMD [ "node", "./server/main.js" ]