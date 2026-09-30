FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalación limpia de dependencias
RUN npm install --production

# Copiar el código fuente
COPY . .

# Exponer el puerto del backend
EXPOSE 3001

# Comando de inicio
CMD ["node", "server.js"]
