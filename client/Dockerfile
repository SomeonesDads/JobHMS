# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install dependencies
RUN npm ci

COPY . .

# Receive API URL from Railway Variables (Required for React Build)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build
RUN npm run build

# Run Stage
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/build ./build

# Serve on dynamic port
CMD sh -c "serve -s build -l $PORT"
