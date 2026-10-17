# Dockerfile for Go REST Backend
# Multi-stage build for minimal security surface area

FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install security certificates & build dependencies
RUN apk add --no-cache ca-certificates git

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source code
COPY . .

# Build static binaries with CGO disabled (public API + isolated admin dashboard)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/admin ./cmd/admin

# Final production stage
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Run as non-root user for security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/server /app/server
COPY --from=builder /app/admin /app/admin

EXPOSE 8080

# Default entrypoint is the public API; the admin service overrides the
# command with /app/admin in docker-compose.yml.
CMD ["/app/server"]
