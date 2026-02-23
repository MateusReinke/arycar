FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_PLATE_API_URL
ARG VITE_PLATE_API_TOKEN
ARG VITE_FIPE_API_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PLATE_API_URL=$VITE_PLATE_API_URL
ENV VITE_PLATE_API_TOKEN=$VITE_PLATE_API_TOKEN
ENV VITE_FIPE_API_URL=$VITE_FIPE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
