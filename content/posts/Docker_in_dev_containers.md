+++
authors = ["Brock Vojkovic"]
title = "Docker in dev containers"
date = "2025-03-10"
tags = [
    "docker",
    "github",
    "containers",
]
+++
---

Recently, I needed to use docker in a dev container for testing the docker build of [SearXNG](https://github.com/searxng/searxng/pull/4475). I was surprised to find that the Docker CLI was not running in the dev container. I had to do some digging to figure out how to get it running. 

You can enable docker by adding the following to your `devcontainer.json`:

```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker": {}
  }
}
```

This will use [docker-in-docker](https://github.com/devcontainers/features/tree/main/src/docker-in-docker) from [devcontainer/features](https://github.com/devcontainers/features). It will run another docker daemon from within the dev container. This means any child containers are completely independent of the host's docker daemon. This can be useful for testing docker builds in a clean environment.

Alternatively, you can use [docker-outside-of-docker](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker) which will use the host's docker daemon, which will increase performance but it might have some security implications.

Now, rebuild your dev container and you should be able to run docker commands inside it.
