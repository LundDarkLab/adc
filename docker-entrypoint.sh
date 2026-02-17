#!/bin/bash
set -e

FOLDER_UID=$(stat -c "%u" /var/www/html/archive)
FOLDER_GID=$(stat -c "%g" /var/www/html/archive)

echo "Detected archive owner: UID=$FOLDER_UID GID=$FOLDER_GID"

if [ "$FOLDER_UID" != "0" ]; then
    usermod -u $FOLDER_UID www-data
    groupmod -g $FOLDER_GID www-data

    # Riallinea solo le cartelle dell'app, non il bind mount
    chown -R www-data:www-data /var/www/html/api
fi

exec apache2-foreground