FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@12

ENV HUSKY=0

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml  ./
RUN pnpm install  --frozen-lockfile  --loglevel=error

COPY . .

RUN pnpm build
RUN pnpm prune --prod

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000
USER node

CMD [ "node", "dist/src/main" ]