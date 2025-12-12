# Build Stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
# Use npm ci for clean install based on lockfile
RUN npm ci

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the app
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Add nginx config for React Router if needed (optional, using default for now but routing might fail on refresh without it)
# For simplicity, we'll try default. If routing fails, we can add config later.
# Creating a simple default.conf to handle client-side routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
