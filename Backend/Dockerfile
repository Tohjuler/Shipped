FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb

RUN bun install --production

FROM oven/bun

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