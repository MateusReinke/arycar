FROM node:20
WORKDIR /app

COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY backend/src ./src

EXPOSE 3001
CMD ["npm", "start"]
