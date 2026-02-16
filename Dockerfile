FROM php:8.2-apache AS production
# Questa etichetta ti aiuta a ricordare dove si trova il progetto sul tuo PC
LABEL com.lund.project.path="/Lavoro/sviluppo/lund/dyncoll.v1"

# 1. Installazione dipendenze di sistema e estensioni PHP
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql mysqli zip \
    && a2enmod rewrite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Installazione Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 3. Copia solo i file dei package per sfruttare la cache di Docker
COPY api/composer.json api/composer.lock* ./api/
RUN cd api && composer install --no-dev --optimize-autoloader

# 4. Copia il resto dell'applicazione
# Grazie al .dockerignore, copierà solo il codice necessario
COPY . .

# 5. Imposta permessi corretti per Apache
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

RUN echo "error_log = /var/log/apache2/php_errors.log" >> /usr/local/etc/php/php.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/php.ini \
    && echo "display_errors = Off" >> /usr/local/etc/php/php.ini \
    && echo "upload_max_filesize = 200M" >> /usr/local/etc/php/php.ini \
    && echo "post_max_size = 200M" >> /usr/local/etc/php/php.ini

EXPOSE 80