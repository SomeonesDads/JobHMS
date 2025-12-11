# Build Stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy gomod/gosum first to leverage cache
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server

# Run Stage
FROM alpine:latest

WORKDIR /root/

# Install CA certificates for external API calls (ImgBB, Email, Database)
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port (Render sets PORT env, but 8080 is good default)
EXPOSE 8080

# Run
CMD ["./main"]
