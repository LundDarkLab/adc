# Architecture

## Container stack

```
                          ┌──────────────────────── host ────────────────────────┐
 Internet ──► reverse     │  ┌─────────────────────┐      ┌─────────────────┐    │
              proxy ──────┼─►│  web (php:8.2-apache)│─────►│  db (mysql:8.4) │    │
              (Apache/    │  │  127.0.0.1:8081 → 80 │      │  internal net   │    │
               nginx,TLS) │  └──────────┬──────────┘      └────────┬────────┘    │
                          │             │ bind mounts              │ named volume │
                          │      archive/  img/              lund_db_data         │
                          └───────────────────────────────────────────────────────┘
```

- **`web`** — built from the project `Dockerfile` (PHP 8.2 + Apache, extensions `pdo_mysql`, `mysqli`, `zip`, `mod_rewrite`). Serves the PHP pages and the API. Composer dependencies (PHPMailer, ramsey/uuid) are installed at build time.
- **`db`** — stock MySQL 8.4 image, attached to an internal Docker network only: it is never exposed to the outside (a loopback port mapping exists solely for administration tools on the host). The compose file passes a set of MySQL options tuned for importing large spatial datasets (administrative boundaries).
- **`docker-entrypoint.sh`** — at container start, aligns the UID/GID of the Apache user (`www-data`) with the owner of the mounted `archive/` directory, so that host-owned files remain readable and writable from both sides.

## Request flow

1. The reverse proxy forwards the request to the web container.
2. Pages (`*.php` at the project root) render the HTML skeleton and include shared fragments from `assets/`.
3. The frontend JavaScript calls the internal API (`api/endpoint_private.php`) via `fetch`, posting `{class, action, ...params}` requests; the API dispatches them to the corresponding `Adc\*` class (see [API](api.md)).
4. Data access goes through `Adc\Conn`, a thin PDO wrapper providing prepared-statement CRUD helpers.

## Code layout

```
├── *.php                    # Pages (server-rendered shells; data arrives via the API)
├── assets/                  # Shared fragments: header, menu, footer, meta, forms
├── api/
│   ├── endpoint.php         # Public JSON-LD API (read-only)
│   ├── endpoint_private.php # Internal RPC-style API used by the frontend
│   ├── composer.json        # PHP dependencies
│   └── src/                 # Adc\ namespace (PSR-4)
│       ├── Conn.php         #   PDO wrapper (CRUD helpers, prepared statements)
│       ├── Config.php       #   Storage paths configuration
│       ├── Api.php          #   JSON-LD / CIDOC-CRM export
│       ├── Artifact.php, Model.php, Media.php, Collection.php,
│       ├── Institution.php, Person.php, User.php, Vocabulary.php,
│       └── Timeline.php, Geom.php, Stats.php, Get.php, File.php
├── js/
│   ├── config.js            # API base URL and constants
│   ├── components/          # Reusable UI builders (gallery, viewer, charts, maps…)
│   ├── features/            # Page-level logic (artifact, model, dashboard, timeline…)
│   ├── modules/             # Domain modules (collection, user, institution…)
│   ├── helpers/ shared/     # Utilities
│   └── maps/                # Leaflet plugins
├── css/  img/               # Styles and static images
├── db-init/                 # SQL imported by MySQL on first start
└── docs/                    # This documentation (MkDocs)
```

There is **no JavaScript build step**: the frontend is vanilla ES modules served as-is, with Bootstrap for the UI, [Leaflet](https://leafletjs.com/) (+ markercluster) for maps and [3DHOP](https://3dhop.net/) for the 3D viewer.

### Frontend state

Client-side state is centralised in a `state` object (see `js/`): frequently used data is kept in RAM and synchronised with `localStorage`, instead of having every function read and write `localStorage` directly. When modifying frontend code, go through the state object rather than touching `localStorage` yourself.

## Storage

All persistent state lives in two places:

| What | Where | Notes |
|------|-------|-------|
| Database | `lund_db_data` named Docker volume | Survives container rebuilds |
| Uploaded files | `archive/` bind mount | Subfolders: `models/`, `image/`, `video/`, `document/`, `reference/`, `thumb/`, `tmp/` |
| Logos & icons | `img/` bind mount | `logo/`, `ico/` |

Paths inside the application are resolved by `Adc\Config`, which derives the absolute storage directories from the document root.

## Database

MySQL 8.4, `utf8mb4` everywhere. Beyond the catalogue tables (artefacts, models, media, institutions, persons, users, vocabularies), two aspects deserve attention:

- **Spatial data** — the find-site forms and the map rely on administrative-boundary geometries (country → province → district → municipality, GADM-derived). These tables are large; the MySQL options in `docker-compose.yml` (1 GB `max_allowed_packet`, long timeouts, large buffers) exist to support importing and querying them.
- **Views** — the timeline reads from the `time_series_complete` view, which resolves each artefact's effective start/end date from the most specific chronological level defined (specific → generic → macro period).

A reference diagram of the database structure is available in the application itself, under **db model** in the menu.

## Sessions and security

- Authentication is session-based (PHP sessions); cookies are `httponly`, and `secure` + `SameSite=None` when served over HTTPS.
- The API rejects non-POST requests on the private endpoint; write operations require a valid session.
- `.htaccess` rules disable directory listing and block direct access to `.ini`, `.sql`, `.log` and `.sh` files; a Content-Security-Policy restricts framing to the platform itself plus the supported video platforms (YouTube, Vimeo).
