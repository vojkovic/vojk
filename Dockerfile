FROM ghcr.io/hugomods/hugo:nightly-non-root AS builder

WORKDIR /src

COPY --chown=hugo:hugo . .

RUN hugo --gc --minify

FROM cgr.dev/chainguard/nginx:latest

EXPOSE 8080

COPY --from=builder /src/public /usr/share/nginx/html/

