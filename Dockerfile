FROM php:8.2-apache AS production

LABEL org.opencontainers.image.source="https://github.com/LundDarkLab/adc" \
      org.opencontainers.image.description="Dynamic Collections Plus — a web platform for digital collections of archaeological artefacts" \
      org.opencontainers.image.licenses="AGPL-3.0"

# 1. Dipendenze di sistema + estensioni PHP + configurazione Apache
#    Tutto in un unico RUN: un solo layer, nessun residuo di apt cache
RUN apt-get update && apt-get install -y \
        libzip-dev \
        unzip \
    && docker-php-ext-install pdo pdo_mysql mysqli zip \
    && a2enmod rewrite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Composer dal layer ufficiale (nessun layer aggiuntivo)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 3. Composer install — layer separato e cacheable:
#    viene ricostruito SOLO se composer.json/lock cambiano
COPY api/composer.json api/composer.lock* ./api/
RUN cd api && composer install --no-dev --optimize-autoloader

# 4. Copia codice + permessi in un solo layer
#    --chown evita il RUN chown separato che duplicava tutti i file
COPY --chown=www-data:www-data . .
RUN chmod -R 755 /var/www/html

# 5. Configurazione PHP — COPY di un file .ini invece di 5 echo concatenati
#    Più leggibile, più manutenibile, stesso numero di layer
COPY --chown=www-data:www-data php-custom.ini /usr/local/etc/php/conf.d/custom.ini

# 6. Entrypoint — --chmod=+x elimina il RUN chmod separato
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 80