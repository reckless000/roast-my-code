FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
