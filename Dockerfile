FROM klakegg/hugo:latest as builder

WORKDIR /src

COPY . .

RUN hugo --gc --minify

FROM cgr.dev/chainguard/nginx:latest

EXPOSE 8080

COPY --from=builder /src/public /usr/share/nginx/html/

