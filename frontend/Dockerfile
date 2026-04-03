# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:alpine
RUN apk add --no-cache bash gettext
COPY --from=builder /app/dist /usr/share/nginx/html
# nginx.conf uses ${BACKEND_URL} — envsubst fills it in at container start
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
# nginx docker image auto-runs envsubst on /etc/nginx/templates/*.template → /etc/nginx/conf.d/
CMD ["nginx", "-g", "daemon off;"]
