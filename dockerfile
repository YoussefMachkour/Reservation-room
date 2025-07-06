# Build stage
FROM golang:1.23.8-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy only the go.mod and go.sum files first
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the source code
COPY . .
RUN go mod tidy



# Build the application
RUN go build -o main ./cmd/app/main.go

# Final stage
FROM alpine:3.18

# Add timezone data
RUN apk add --no-cache tzdata

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .
# COPY --from=builder /app/assets ./assets
COPY .env .env

# Create non-root user
RUN adduser -D appuser

# Set permissions
RUN chown -R appuser:appuser /app

USER appuser

# Expose the port
EXPOSE ${PORT}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run the application
CMD ["./main"]