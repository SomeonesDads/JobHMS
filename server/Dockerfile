# Build Stage
FROM golang:alpine AS builder

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

# Expose port (Hugging Face Spaces defaults to 7860)
EXPOSE 7860

# Run
CMD ["./main"]
