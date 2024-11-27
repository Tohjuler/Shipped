FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb

RUN bun install --production

FROM oven/bun

RUN apt-get update && apt-get install -y git
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts
COPY package.json package.json
COPY tsconfig.json tsconfig.json

ENV NODE_ENV=production

CMD ["bun", "start"]

EXPOSE 5055