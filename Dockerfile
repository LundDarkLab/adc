# Stage 1: Build frontend assets
# FROM node:18-alpine AS frontend
# WORKDIR /app
# COPY package.json package-lock.json* ./
# RUN npm ci --only=production
# COPY . .
# RUN npm run build && ls -la dist/

# Stage 2: PHP/Apache
FROM php:8.2-apache AS production

# Installa dipendenze di sistema e estensioni PHP
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql mysqli zip \
    && a2enmod rewrite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installa Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copia e installa dipendenze PHP
COPY api/composer.json api/composer.lock* ./api/
RUN cd api && composer install --no-dev --optimize-autoloader

# Copia l'applicazione (incluso il file .env)
COPY . .

# Copia gli asset buildati dal frontend stage (se esistono)
# COPY --from=frontend /app/dist ./public/dist

# Imposta permessi
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80