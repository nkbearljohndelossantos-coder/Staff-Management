FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PORT=39102
ENV NODE_ENV=production

EXPOSE 39102

CMD ["node", "server.js"]
