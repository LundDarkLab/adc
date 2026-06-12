# Dynamic Collections Plus

**Dynamic Collections Plus** (ADC — Archaeological Dynamic Collections) is a web platform for building and curating digital collections of archaeological artefacts. It is designed as a local network of independently curated exhibits that share a collaboratively built pool of items: artefacts, 3D models, images, videos and documents, together with their metadata and paradata.

The platform is developed by the [DARKLab](https://www.ark.lu.se/) at Lund University.

- **Live instance:** https://dyncoll.ht.lu.se/
- **Documentation:** see the [`docs/`](docs/) folder (built with MkDocs)

## Features

- **Artefact catalogue** — record artefacts with structured metadata, inventory numbers, controlled vocabularies and external references.
- **3D model viewer** — interactive visualisation of 3D models directly in the browser, based on [3DHOP](https://3dhop.net/), with measurement and sectioning tools.
- **Media management** — attach images, videos, documents and bibliographic references to artefacts and models.
- **Collections** — group items into curated, exportable/importable collections (JSON).
- **Interactive map** — geographic visualisation of artefact provenance, based on [Leaflet](https://leafletjs.com/).
- **Timeline** — chronological browsing of the collection through hierarchical time periods.
- **Multi-institution support** — items are owned and managed by independent institutions.
- **User management** — role-based access (Administrator, Supervisor, Author) with email-based registration and password reset.

## Architecture

The application ships as a two-container Docker stack:

| Container  | Image            | Role                                              |
|------------|------------------|---------------------------------------------------|
| `web`      | `php:8.2-apache` | PHP application + REST API, served by Apache      |
| `db`       | `mysql:8.4`      | MySQL database, reachable only from the internal Docker network |

Uploaded files (3D models, images, documents) are stored on the host filesystem in the `archive/` directory, mounted into the web container. The database lives in a named Docker volume (`lund_db_data`), so it survives container rebuilds.

## Requirements

- A Linux server (the stack is developed and tested on Debian)
- [Docker Engine](https://docs.docker.com/engine/install/) with the [Compose plugin](https://docs.docker.com/compose/install/) (v2)
- `git`
- **RAM:** the default MySQL configuration allocates a 2 GB InnoDB buffer pool. A server with at least 4 GB of RAM is recommended; on smaller machines, lower `--innodb_buffer_pool_size` in `docker-compose.yml`.
- **Disk:** depends entirely on how many 3D models and media files you plan to host. 3D models are usually the dominant factor (tens of MB to several hundred MB each).
- For public production use: a domain name and a TLS certificate (see [Production deployment](#production-deployment)).

No PHP, Apache or MySQL installation is required on the host: everything runs inside the containers.

## Quick start

```bash
# 1. Get the code
git clone https://github.com/LundDarkLab/adc.git
cd adc

# 2. Create your configuration
cp .env.example .env
nano .env                  # set database passwords and SMTP parameters

# 3. Build and start the stack
docker compose up -d --build

# 4. Import the administrative boundaries for your countries (recommended)
#    ISO 3166-1 alpha-3 codes — used by the find-site forms and the map
./scripts/import-gadm.sh SWE NOR
```

> **Prefer a prebuilt image?** If you don't need to modify the code, skip the build and pull the image from the GitHub Container Registry: `docker compose -f docker-compose.ghcr.yml up -d`. Everything else stays the same.

On the **first start** the MySQL container automatically imports every `.sql` / `.sql.gz` file found in `db-init/`, in alphabetical order: the database schema (`00-schema.sql`), the base data — controlled vocabularies, time series, licenses (`01-seed-data.sql`) — and the first administrator account (`02-first-admin.sql`). This happens only once, while the database volume is empty.

The administrative boundaries used by the find-site forms and the map are **not bundled** with the platform: the [GADM](https://gadm.org) license does not allow redistribution. Import them for the countries you need with `scripts/import-gadm.sh` (any time, also later): the script downloads the official data from gadm.org and loads it using the GDAL Docker image — no local GDAL installation required.

### First login

Log in with the default administrator account:

- **email:** `admin@example.com`
- **password:** `changeme`

**Change the password immediately** (Settings → Manage your data profile), then update the account's name and email — or create your real administrator account and disable the default one.

Before contributors start creating records, an administrator must fill the vocabularies that ship empty because they depend on the scientific scope of each institution: **artefact categories** (Category class / Category specification, from the *Vocabularies* page) and at least one **timeline** with its periods (from the *Timeline* page). See the [installation guide](docs/developer/installation.md) for details.

The application is now listening on **http://127.0.0.1:8081**. The port is bound to the loopback interface on purpose: in production the application is meant to sit behind a reverse proxy that handles the public domain and HTTPS (see below). For a quick local test you can open `http://localhost:8081` directly, or temporarily change the port mapping in `docker-compose.yml` from `127.0.0.1:8081:80` to `8081:80` to reach it from other machines.

### Checking that everything is up

```bash
docker compose ps          # both containers should be "running",
                           # db should be "healthy"
docker compose logs -f web # application logs
docker compose logs -f db  # database logs (first import can take a while)
```

## Configuration

All configuration lives in the `.env` file at the project root. See [`.env.example`](.env.example) for the full commented reference.

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database hostname. Keep `db` (the internal Docker service name) unless using an external MySQL server. |
| `DB_NAME` | Application database name. |
| `DB_USER` / `DB_PASSWORD` | Application database credentials. |
| `DB_ROOT_PASSWORD` | MySQL root password (administration only). |
| `DB_PORT` | Host port (loopback only) where MySQL is exposed, for administration tools. |
| `MAILHOST` / `MAILPORT` | SMTP server used for registration and password-reset emails. |
| `MAILUSER` / `MAILPASSWORD` | SMTP credentials. |
| `MAILSETFROM` / `MAILSETFROMNAME` | "From" address and display name of outgoing emails. |

> **Changing database credentials after the first start:** the MySQL container creates users and database only when its volume is empty. If you change `DB_*` values later, either update the credentials inside MySQL manually, or wipe the database volume with `docker compose down -v` (**this deletes all data**) and start again.

## Production deployment

The stack is designed to run behind a reverse proxy on the host, which terminates TLS and forwards requests to the container on `127.0.0.1:8081`. You need a DNS record for your domain pointing to the server, and a TLS certificate (e.g. via [Let's Encrypt / certbot](https://certbot.eff.org/)).

### Apache example

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

Enable the required modules: `a2enmod proxy proxy_http ssl headers`.

### nginx example

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

### Persistent data

Two locations on the host hold all persistent state — include both in your backup strategy:

- **Database:** the `lund_db_data` Docker volume. Dump it with:
  ```bash
  docker exec lund-db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --routines "$MYSQL_DATABASE"' > backup-$(date +%F).sql
  ```
- **Uploaded files:** the `archive/` and `img/` directories of the repository, mounted into the web container. To store them elsewhere on the server, set `ARCHIVE_DIR` and `IMG_DIR` in `.env`.

## Updating

```bash
git pull
docker compose up -d --build
```

The database volume and the `archive/` directory are untouched by updates. Always take a backup before updating a production instance.

## Development

For local development, create a `docker-compose.override.yml` (not tracked by git) that mounts the source code into the container, so changes are visible without rebuilding:

```yaml
services:
  web:
    volumes:
      - .:/var/www/html
      - ./archive:/var/www/html/archive
      - ./img:/var/www/html/img
```

Compose picks the override up automatically with `docker compose up`.

The project documentation in `docs/` is built with [MkDocs](https://www.mkdocs.org/) (`mkdocs serve` for a local preview, configuration in `mkdocs.yml`).

## Project structure

```
├── api/                  # PHP REST API (endpoints + Adc\ classes, Composer)
├── assets/               # Shared page fragments (header, menu, meta, ...)
├── css/ js/ img/         # Frontend assets (vanilla JS + Bootstrap, 3DHOP, Leaflet)
├── db-init/              # SQL imported by MySQL on first start (schema + base data)
├── scripts/              # Helper scripts (GADM administrative-boundaries import)
├── docs/                 # MkDocs documentation (user + developer guides)
├── archive/              # Uploaded content: models, images, documents (not tracked)
├── docker-compose.yml    # Production stack definition
├── Dockerfile            # Web container image (php:8.2-apache)
├── docker-entrypoint.sh  # Aligns file-permission UIDs between host and container
└── .env.example          # Configuration template
```

## License

[![REUSE status](https://api.reuse.software/badge/github.com/LundDarkLab/adc)](https://api.reuse.software/info/github.com/LundDarkLab/adc)

The project source code is released under the **GNU Affero General Public License v3.0 or later** — see [LICENSE](LICENSE). Documentation is **CC BY 4.0**, the database schema and base data are **CC0 1.0**.

The repository bundles third-party components under their own licenses ([3DHOP](https://3dhop.net/) GPL-3.0-or-later, Nexus/Corto MIT, SpiderGL BSD-3-Clause, Leaflet plugins). The repository is [REUSE](https://reuse.software/) compliant: per-file licensing is declared in [REUSE.toml](REUSE.toml) and every license text lives in [LICENSES/](LICENSES/).

## Credits

Developed by the **DARKLab — Digital Archaeology Laboratory**, Department of Archaeology and Ancient History, Lund University.
