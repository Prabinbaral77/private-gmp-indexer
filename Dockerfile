FROM node:18-alpine as build-env

WORKDIR /usr/app
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build && npm prune --production

FROM gcr.io/distroless/nodejs18-debian11
WORKDIR /usr/app
COPY --from=build-env /usr/app/dist /usr/app/dist
COPY --from=build-env /usr/app/node_modules ./node_modules
CMD ["dist/server.js"]
