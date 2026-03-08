FROM ghcr.io/hugomods/hugo:nightly-non-root AS builder

WORKDIR /src

COPY --chown=hugo:hugo . .

RUN hugo --gc --minify

FROM nginx:alpine

EXPOSE 80

COPY --from=builder /src/public /usr/share/nginx/html/

