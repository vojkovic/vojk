.PHONY: serve build docker

serve:
	hugo serve --bind 0.0.0.0 --watch --disableFastRender

build:
	hugo --minify --destination public

docker:
	docker build -t vojk .
	docker run -p 127.0.0.1:8080:8080 vojk
