FROM node:20-alpine

# Dependencies for bcrypt native compilation on Alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]
