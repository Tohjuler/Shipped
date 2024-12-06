FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb
COPY tsconfig.json tsconfig.json

RUN bun install --production

COPY ./src ./src

ENV NODE_ENV=production

RUN bun run build

FROM debian:bullseye-slim AS packages
RUN apt update && apt install -y curl

WORKDIR /src

ENV DOCKERVERSION=27.3.1
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKERVERSION}.tgz \
    && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 \
    -C /usr/local/bin docker/docker \
    && rm docker-${DOCKERVERSION}.tgz

FROM debian:bullseye-slim

RUN apt update && apt install -y --no-install-recommends curl git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Docker
COPY --from=packages /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker/compose-bin:edge /docker-compose /usr/libexec/docker/cli-plugins/docker-compose

COPY drizzle drizzle

COPY --from=build /app/server server
RUN chmod +x /app/server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 5055