FROM node:20-bookworm-slim
WORKDIR /app

COPY media-proxy/package.json ./package.json
RUN npm install --omit=dev

COPY media-proxy/server.js ./server.js

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
