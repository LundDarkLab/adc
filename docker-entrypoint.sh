#!/bin/bash
# ==============================================================================
# docker-entrypoint.sh — Gestione permessi e avvio Apache
#
# Problema risolto: quando i volumi ./archive e ./img sono montati da host
# Linux, i file appartengono all'UID dell'utente host (es. 1000) invece che
# a www-data (UID 33 in Debian). Apache non riesce a leggere/scrivere.
#
# Soluzione: allinea l'UID/GID di www-data a quello del volume montato,
# solo se diverso da root (UID 0 = volume vuoto o già corretto).
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# Allineamento permessi
# Legge l'owner effettivo del volume montato e adatta www-data di conseguenza
# ------------------------------------------------------------------------------
FOLDER_UID=$(stat -c "%u" /var/www/html/archive)
FOLDER_GID=$(stat -c "%g" /var/www/html/archive)

echo "[entrypoint] Volume archive owner: UID=$FOLDER_UID GID=$FOLDER_GID"

if [ "$FOLDER_UID" != "0" ] && [ "$FOLDER_UID" != "33" ]; then
    # L'UID host è diverso da root e da www-data: allineiamo www-data
    echo "[entrypoint] Allineamento www-data → UID=$FOLDER_UID GID=$FOLDER_GID"

    # Cambia GID prima (se il gruppo con quel GID esiste già, lo rinomina)
    if getent group "$FOLDER_GID" > /dev/null 2>&1; then
        # Il GID esiste già: rimuove il gruppo www-data e riassegna
        groupmod -g "$((FOLDER_GID + 1000))" www-data 2>/dev/null || true
    fi
    groupmod -g "$FOLDER_GID" www-data

    # Cambia UID (stessa logica)
    if getent passwd "$FOLDER_UID" > /dev/null 2>&1; then
        usermod -u "$((FOLDER_UID + 1000))" www-data 2>/dev/null || true
    fi
    usermod -u "$FOLDER_UID" www-data

    # Riallinea i file interni al container (non i bind mount, quelli rimangono dell'host)
    echo "[entrypoint] Riallineamento permessi file interni..."
    chown -R www-data:www-data /var/www/html/api 2>/dev/null || true
    chown -R www-data:www-data /var/log/apache2   2>/dev/null || true

    echo "[entrypoint] Permessi allineati"
else
    echo "[entrypoint] Permessi già corretti (UID=$FOLDER_UID), nessun cambio necessario"
fi

# ------------------------------------------------------------------------------
# Avvio Apache
# ------------------------------------------------------------------------------
echo "[entrypoint] Avvio Apache..."
exec apache2-foreground
