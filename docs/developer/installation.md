# Installation

Make sure you meet the [requirements](requirements.md) first.

## 1. Get the code

```bash
git clone https://github.com/LundDarkLab/adc.git
cd adc
```

## 2. Configure

Create your `.env` from the template and fill in your values:

```bash
cp .env.example .env
nano .env
```

The file is fully commented; in short you must set:

- the **database** credentials (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_ROOT_PASSWORD`) — the MySQL container is initialised with these values on its first start;
- the **SMTP** parameters (`MAIL*`) used for registration and password-reset emails.

!!! note "Values with special characters"
    Wrap passwords containing `!`, `$`, `#`, `&` or spaces in single quotes: `DB_PASSWORD='my&secret!'`.

## 3. Build and start

Two equivalent options:

**A — Build from source** (default):

```bash
docker compose up -d --build
```

**B — Prebuilt image** from the GitHub Container Registry, if you don't need to modify the code:

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

This pulls `ghcr.io/lunddarklab/adc` instead of building locally — faster, and updates are a `docker compose -f docker-compose.ghcr.yml pull && docker compose -f docker-compose.ghcr.yml up -d` away. Everything else (configuration, database initialisation, storage) is identical.

On the **first start** the MySQL container imports every `.sql` / `.sql.gz` file found in `db-init/`, in alphabetical order:

| File | Content |
|------|---------|
| `00-schema.sql` | Database schema and views |
| `01-seed-data.sql` | Base data: controlled vocabularies, time series, licenses |
| `02-first-admin.sql` | The default administrator account |

This happens only once, while the database volume is empty.

Check that everything is up:

```bash
docker compose ps          # web "running", db "running (healthy)"
docker compose logs -f db  # follow the first import
```

The application now answers on **http://127.0.0.1:8081**.

## 4. Import the geographic dataset (recommended)

The find-site forms and the map rely on the administrative boundaries published by [GADM](https://gadm.org) (country → province → district → municipality). They are **not bundled** with the platform — the [GADM license](https://gadm.org/license.html) allows free academic and non-commercial use but not redistribution — so each installation downloads them directly from the source, only for the countries it actually needs.

With the stack running, import one or more countries by their ISO 3166-1 alpha-3 code:

```bash
./scripts/import-gadm.sh SWE            # Sweden
./scripts/import-gadm.sh NOR DNK FIN    # add more countries at any time
```

For each country the script downloads the official GeoPackage from gadm.org and loads every administrative level into the `gadm0`…`gadm5` tables with `ogr2ogr`, run from the official [GDAL Docker image](https://github.com/OSGeo/gdal/pkgs/container/gdal) — no local GDAL installation required. Re-running the script with new codes appends to the existing data.

!!! note
    The first run pulls the GDAL image (~1.5 GB, one-time). The platform works without the geographic dataset, but the find-site selectors and the geographic layers of the map stay empty until you import at least one country.

??? info "Manual import (what the script does under the hood)"
    Each administrative level `N` is a layer named `ADM_ADM_N` in the GADM GeoPackage, loaded into the corresponding `gadmN` table:

    ```bash
    curl -fLO https://geodata.ucdavis.edu/gadm/gadm4.1/gpkg/gadm41_SWE.gpkg
    ogr2ogr -f MySQL "MYSQL:dbname,host=127.0.0.1,port=3306,user=...,password=..." \
        gadm41_SWE.gpkg ADM_ADM_1 \
        -nln gadm1 -append -update -relaxedFieldNameMatch
    ```

    The target tables already exist (created by `00-schema.sql`) with `SRID 4326` geometry columns, so any import method that respects their structure works.

## 5. First login

Log in with the default administrator account:

- **email:** `admin@example.com`
- **password:** `changeme`

**Change the password immediately** (Settings → Manage your data profile), then update the account's name and email — or create your real administrator account and disable the default one.

### Initial configuration

Most controlled vocabularies ship pre-filled (materials, conservation states, licenses, user roles…), but the ones that depend on the scientific scope of your institution ship **empty on purpose** and must be filled by an administrator **before contributors start creating records**:

| What | Where to fill it | Needed for |
|------|------------------|------------|
| **Category class** and **Category specification** | *Vocabularies* page | Classifying artefacts |
| At least one **timeline**, with its macro / generic / specific periods | *Timeline* page | The chronological definition of artefacts and the timeline browsing |

Optionally, the `cultural_generic_period` table feeds the chronological-distribution chart; it has no editing interface yet and can be populated directly in the database if you want that chart.

!!! warning "Re-running the initialisation"
    The `db-init/` files are applied only to an **empty** database volume. If the first import fails midway (or you want to start over), wipe the volume with `docker compose down -v` — this deletes all data — and run `docker compose up -d` again.

## 6. Reverse proxy and HTTPS

The web container is bound to the loopback interface on purpose: public traffic should arrive through a reverse proxy on the host, which owns the domain and terminates TLS.

### Apache

```apache
<VirtualHost *:443>
    ServerName collections.example.org

    SSLEngine on
    SSLCertificateFile      /etc/letsencrypt/live/collections.example.org/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/collections.example.org/privkey.pem

    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:8081/
    ProxyPassReverse / http://127.0.0.1:8081/

    # Uploads of 3D models can be large
    LimitRequestBody 0
</VirtualHost>
```

Required modules: `a2enmod proxy proxy_http ssl headers`.

### nginx

```nginx
server {
    listen 443 ssl;
    server_name collections.example.org;

    ssl_certificate     /etc/letsencrypt/live/collections.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/collections.example.org/privkey.pem;

    client_max_body_size 0;   # uploads of 3D models can be large

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain the certificates with [certbot](https://certbot.eff.org/).

!!! tip "Local test without a proxy"
    For a quick test you can open `http://localhost:8081` directly, or temporarily change the port mapping in `docker-compose.yml` from `127.0.0.1:8081:80` to `8081:80` to reach the instance from other machines on the network. Do not run a public production instance without TLS.

## 7. Storage directories

Uploaded content is stored outside the container: `archive/` (models, images, documents — the repository already contains the required folder skeleton) and `img/` (logos and icons), both mounted into the web container. By default they are the folders of the repository itself; to keep the data elsewhere on the server, set `ARCHIVE_DIR` and `IMG_DIR` in `.env`:

```bash
ARCHIVE_DIR=/srv/dyncoll/archive
IMG_DIR=/srv/dyncoll/img
```

The container entrypoint automatically aligns file-ownership UIDs between the host directories and the Apache user.

## 8. Repository files are not web-exposed

The repository ships build, CI, documentation and configuration files (`Dockerfile`, `docker-compose*.yml`, `.github/`, `db-init/`, `.env.example`, …) that have no business being reachable over HTTP: exposing them is an information-disclosure issue (OWASP A05 *Security Misconfiguration*; MITRE [CWE-538](https://cwe.mitre.org/data/definitions/538.html) / [CWE-552](https://cwe.mitre.org/data/definitions/552.html)). Two layers, both shipped with the project, keep them out of reach on every installation:

- **`.dockerignore`** — these files are never copied into the image, so in a production (image-based) deployment they are not in the web root at all (HTTP 404).
- **`.htaccess`** — Apache additionally denies (HTTP 403) dot-files and dot-folders (`.env`, `.git/`, `.github/`), config/build artefacts (`*.ini`, `*.yml`, `*.sql`, `*.sh`, `Dockerfile`, `composer.json`/`composer.lock`), the `api/config/` directory, and editor/backup leftovers (`*.bak`, `*~`, …). This also covers the few files that must stay in the build context (`docker-entrypoint.sh`, `php-custom.ini`).

The real `.env` is never in the web root: Compose reads it on the host and injects it as environment variables (`env_file`), and it is listed in `.dockerignore` as well.

!!! note "Verify after deployment"
    Both files take effect after a `docker compose up -d --build`. From outside the server, every sensitive path must answer `403` or `404`, never `200`:

    ```bash
    for f in .env .env.example Dockerfile docker-compose.yml \
             .github/workflows/docker.yml api/composer.json; do
      printf '%-32s ' "$f"; curl -sko /dev/null -w '%{http_code}\n' "https://your-domain/$f"
    done
    ```

## Development setup

For local development, create a `docker-compose.override.yml` (ignored by git) that mounts the source code into the container, so changes are visible without rebuilding:

```yaml
services:
  web:
    volumes:
      - .:/var/www/html
      - ./archive:/var/www/html/archive
      - ./img:/var/www/html/img
```

Compose picks the override up automatically with `docker compose up`.

!!! warning "Local use only"
    This override bind-mounts the **whole repository** into the web root, which bypasses the `.dockerignore` protection described in [section 8](#8-repository-files-are-not-web-exposed): build, CI and config files become reachable over HTTP. Use it only on a local, non-public instance — never on a server exposed to the internet.

Next: [Architecture](architecture.md) · [Maintenance](maintenance.md)
