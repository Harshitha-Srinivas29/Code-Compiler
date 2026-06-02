FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip gcc g++ openjdk21-jre

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 8000
ENV NODE_ENV=production
CMD ["node", "index.js"]