FROM node:20
WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/src ./src

EXPOSE 3001
CMD ["npm", "start"]
