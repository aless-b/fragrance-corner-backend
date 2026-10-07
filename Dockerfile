FROM node:20-alpine

# Instalar Nginx, Fail2Ban, iptables e iproute2 para protección HTTP Flood
RUN apk add --no-cache nginx fail2ban bash iptables iproute2

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalación limpia de dependencias
RUN npm install --production

# Copiar el código fuente
COPY . .

# Copiar configuraciones de Nginx y Fail2Ban
COPY nginx.conf /etc/nginx/nginx.conf
COPY jail.local /etc/fail2ban/jail.local
COPY filter-http-flood.conf /etc/fail2ban/filter.d/http-flood.conf
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Exponer puertos HTTP (80 y 3001)
EXPOSE 80 3001

ENTRYPOINT ["/entrypoint.sh"]
