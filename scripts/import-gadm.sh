#!/usr/bin/env bash
# ==============================================================================
# import-gadm.sh — Imports GADM administrative boundaries into the database.
#
# Usage:
#   ./scripts/import-gadm.sh SWE [NOR DNK ...]
#
# Arguments are ISO 3166-1 alpha-3 country codes (see https://gadm.org).
# Run it AFTER the stack is up (docker compose up -d): it connects to the
# database through the loopback port published by docker-compose.
#
# For each country it downloads the official GADM GeoPackage from
# geodata.ucdavis.edu and loads every administrative level (gadm0..gadm5)
# with ogr2ogr, run from the official GDAL Docker image — no local GDAL
# installation required. Re-running with new countries appends to the
# existing data.
#
# GADM data is freely available for academic and other non-commercial use
# and may NOT be redistributed (https://gadm.org/license.html): that is why
# each installation downloads it directly from the source.
#
# Requirements: docker, curl. Database credentials are read from .env.
# Environment variables DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_BIND
# override the values in .env (useful for testing).
# ==============================================================================
set -euo pipefail

GADM_VERSION="4.1"
GADM_PREFIX="gadm41"
GADM_URL_BASE="https://geodata.ucdavis.edu/gadm/gadm${GADM_VERSION}/gpkg"
GDAL_IMAGE="ghcr.io/osgeo/gdal:ubuntu-full-3.10.0"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

usage() { grep '^#' "$0" | sed -n '2,15p' | sed 's/^# \{0,1\}//'; exit 1; }
[ $# -ge 1 ] || usage
command -v docker >/dev/null || { echo "ERROR: docker is required"; exit 1; }
command -v curl   >/dev/null || { echo "ERROR: curl is required";   exit 1; }

# ------------------------------------------------------------------------------
# Read a KEY=value entry from .env (strips inline comments and quotes).
# Already-exported environment variables take precedence.
# ------------------------------------------------------------------------------
env_value() {
  local key="$1" raw
  if [ -n "${!key:-}" ]; then echo "${!key}"; return; fi
  [ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found" >&2; exit 1; }
  raw=$(grep -E "^${key}=" "$ENV_FILE" | tail -1 | cut -d= -f2-)
  case "$raw" in
    \'*) raw=${raw#\'}; raw=${raw%%\'*} ;;          # 'quoted value'
    \"*) raw=${raw#\"}; raw=${raw%%\"*} ;;          # "quoted value"
    *)   raw=$(echo "$raw" | sed -E 's/[[:space:]]+#.*$//; s/[[:space:]]+$//') ;;
  esac
  echo "$raw"
}

DB_NAME=$(env_value DB_NAME)
DB_USER=$(env_value DB_USER)
DB_PASSWORD=$(env_value DB_PASSWORD)
DB_PORT=$(env_value DB_PORT)
DB_BIND="${DB_BIND:-127.0.0.1}"   # loopback address where compose publishes MySQL

OGR_CONN="MYSQL:${DB_NAME},host=${DB_BIND},port=${DB_PORT},user=${DB_USER},password=${DB_PASSWORD}"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

for ISO in "$@"; do
  ISO=$(echo "$ISO" | tr '[:lower:]' '[:upper:]')
  GPKG="${GADM_PREFIX}_${ISO}.gpkg"
  echo "==> $ISO: downloading $GPKG"
  curl -fSL --progress-bar "$GADM_URL_BASE/$GPKG" -o "$TMP_DIR/$GPKG" || {
    echo "ERROR: download failed for '$ISO' — is it a valid ISO 3166-1 alpha-3 code?" >&2
    exit 1
  }

  # Administrative levels actually present in this country's GeoPackage
  LAYERS=$(docker run --rm -v "$TMP_DIR":/data:ro "$GDAL_IMAGE" \
           ogrinfo -ro -q "/data/$GPKG" | sed -E 's/^[0-9]+: ([A-Za-z_0-9]+).*/\1/')

  for LEVEL in 0 1 2 3 4 5; do
    LAYER=$(echo "$LAYERS" | grep -E "^ADM_ADM_${LEVEL}$" || true)
    [ -n "$LAYER" ] || continue
    echo "==> $ISO: importing level $LEVEL ($LAYER -> gadm$LEVEL)"
    docker run --rm --network host -v "$TMP_DIR":/data:ro "$GDAL_IMAGE" \
      ogr2ogr -f MySQL "$OGR_CONN" "/data/$GPKG" "$LAYER" \
        -nln "gadm$LEVEL" -append -update \
        -relaxedFieldNameMatch -gt 1000 --config MYSQL_TIMEOUT 3600
  done
  echo "==> $ISO: done"
done

echo "All imports completed."
