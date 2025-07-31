# Stage 1: Build the Angular application
FROM node:20 AS builder

WORKDIR /app

# Copia package.json e package-lock.json per installare le dipendenze
COPY package.json package-lock.json ./

# Pulisci la cache di npm (opzionale, ma può aiutare)
RUN npm cache clean --force

# Installa le dipendenze
RUN npm install

# Copia il resto dei file sorgente
COPY . .

# Costruisci l'app Angular con SSR e localizzazione
RUN npx ng build --configuration=production --localize \
  && npx ng run azzurra-makeup-fe-new:server:production

# Stage 2: Runtime minimal con solo i file buildati e dipendenze prod
FROM node:20

WORKDIR /usr/src/app

# Copia i bundle compilati da builder
COPY --from=builder /app/dist/server ./server
COPY --from=builder /app/dist/browser ./browser

# Copia package.json per eventuali dipendenze runtime
COPY --from=builder /app/package.json ./

# Installa solo le dipendenze di produzione (non serve reinstallare tutto)
RUN npm install --only=production

# Espone la porta 8080 per l'app SSR
EXPOSE 8080

# Avvia il server SSR con Node.js
CMD [ "node", "./server/server.mjs" ]
