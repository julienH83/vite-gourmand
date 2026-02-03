FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy config files needed at startup (src/ and public/ are bind-mounted)
COPY index.html vite.config.js ./

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0"]
