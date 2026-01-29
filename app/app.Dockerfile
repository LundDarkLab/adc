FROM php:8.4-apache

COPY /api/config/logging.ini /usr/local/etc/php/conf.d/docker-php-logging.ini
COPY /api/config/php-upload.ini /usr/local/etc/php/conf.d/php-upload.ini
COPY /api/config/apache.conf /etc/apache2/conf-enabled/


# Installazione dipendenze di sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql zip

# Installazione Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN a2enmod rewrite headers mime setenvif

WORKDIR /var/www/html

# Copiamo tutto il codice prima (perché il composer.json è annidato)
COPY . .

# Ci spostiamo dove c'è il composer.json ed eseguiamo l'installazione
RUN cd api && composer install --no-interaction --optimize-autoloader

# Impostiamo i permessi globali
RUN mkdir -p /var/www/html/archive/image \
    && mkdir -p /var/www/html/archive/document \
    && mkdir -p /var/www/html/archive/tmp \
    && chown -R www-data:www-data /var/www/html/archive \
    && chmod -R 0777 /var/www/html/archive

# Configurazione Apache (AllowOverride)
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf