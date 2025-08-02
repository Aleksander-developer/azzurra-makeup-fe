# =================================================================
# FASE 1: "Builder" - Costruisce l'applicazione Angular
# Questa fase rimane quasi identica.
# =================================================================
FROM node:20 AS builder
WORKDIR /app

# Copia i file di dipendenze. Usiamo * per includere anche il lockfile.
COPY package*.json ./

# Installa TUTTE le dipendenze necessarie per la build
RUN npm install

# Copia tutto il resto del codice sorgente
COPY . .

# Esegui lo script di build per SSR
RUN npm run build:ssr

# =================================================================
# FASE 2: "Runner" - Crea l'immagine finale di produzione
# Qui facciamo le ottimizzazioni più importanti.
# =================================================================
FROM node:20
WORKDIR /usr/src/app

# Copia solo i file di dipendenze dalla fase "builder"
COPY --from=builder /app/package*.json ./

# ---> MODIFICA CHIAVE <---
# Invece di copiare la pesante cartella node_modules dalla fase builder,
# reinstalliamo SOLO le dipendenze di produzione.
# Questo riduce drasticamente le dimensioni dell'immagine finale.
RUN npm install --only=production

# ---> MODIFICA CHIAVE <---
# Copiamo l'intera cartella 'dist' in un solo comando. È più pulito.
COPY --from=builder /app/dist ./dist

# Esponi la porta che l'applicazione userà all'interno del container
EXPOSE 8080

# ---> MODIFICA CHIAVE <---
# Aggiorniamo il comando per puntare al percorso corretto dopo la copia.
CMD [ "node", "dist/server/main.js" ]