FROM node:20
WORKDIR /app

COPY backend/package.json ./package.json
RUN /usr/local/bin/npm ci --omit=dev

COPY backend/src ./src

EXPOSE 3001
CMD ["npm", "start"]
