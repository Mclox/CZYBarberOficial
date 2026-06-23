# Usamos una imagen ligera de Node.js
FROM node:20-alpine

# Definimos el directorio de trabajo
WORKDIR /app

# Copiamos solo los archivos de configuración de dependencias primero
COPY package*.json ./

# Instalamos las dependencias de forma limpia
RUN npm install

# Copiamos el resto del código del frontend
COPY . .

# Exponemos el puerto 3000 que configuraste en Vite
EXPOSE 3000

# Ejecutamos Vite forzando el "host" para que Docker permita las conexiones externas
# y desactivamos el auto-open para evitar errores en el contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--no-open"]