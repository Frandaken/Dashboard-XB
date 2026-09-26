FROM node:20-alpine

WORKDIR /app

# Path di-prefix "backend/" karena build context adalah ROOT REPO
# (dipakai saat context: URL Git, yang selalu clone keseluruhan repo,
# bukan hanya subfolder backend/ ini).
COPY backend/package*.json ./
RUN npm install

COPY backend/ .

EXPOSE 3003
CMD ["npm", "start"]
