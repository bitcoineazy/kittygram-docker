# syntax=docker/dockerfile:1

# ---------- build stage ----------
ARG GO_VERSION=1.27
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

# dependencies first: this layer is cached until go.mod / go.sum change
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .

ARG VERSION=dev
# static binary, no debug symbols (-s -w), no cgo -> runs on distroless/static
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" \
    -o /out/api ./cmd/api

# ---------- runtime stage ----------
# distroless: no shell, no package manager, runs as uid 65532 (nonroot)
FROM gcr.io/distroless/static-debian12:nonroot

LABEL org.opencontainers.image.title="momo-store-backend" \
      org.opencontainers.image.source="https://github.com/bitcoineazy/kittygram-docker"

WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /out/api /app/api

ENV PORT=8081
EXPOSE 8081
USER nonroot:nonroot

# the binary probes itself: there is no curl/wget in distroless
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/app/api", "healthcheck"]

ENTRYPOINT ["/app/api"]
