# Requirements

Everything runs inside Docker containers: **no PHP, Apache, MySQL or Composer installation is required on the host**.

## Server

- A Linux server (the stack is developed and tested on Debian; any distribution supported by Docker works).
- [Docker Engine](https://docs.docker.com/engine/install/) with the [Compose plugin](https://docs.docker.com/compose/install/) (v2 — the `docker compose` command, not the legacy `docker-compose`).
- `git`, to clone the repository and pull updates.

## Resources

| Resource | Recommendation |
|----------|----------------|
| **RAM** | 4 GB or more. The default MySQL configuration allocates a 2 GB InnoDB buffer pool; on smaller machines lower `--innodb_buffer_pool_size` in `docker-compose.yml`. |
| **CPU** | No special requirement; 2 cores are plenty for a small/medium instance. |
| **Disk** | Driven almost entirely by the uploaded content. 3D models in Nexus format typically weigh tens to hundreds of MB each — plan according to the size of your collection, and leave room for database growth and backups. |

## Network

| Port | Use |
|------|-----|
| `8081` (loopback) | The web container. Bound to `127.0.0.1` by design: the public traffic should arrive through a reverse proxy. |
| `3306` (loopback, configurable via `DB_PORT`) | MySQL, exposed on the loopback interface only, for administration tools. |
| `80` / `443` | Your reverse proxy (Apache or nginx on the host), for public access. |

## For public production use

- A **domain name** with a DNS record pointing to the server.
- A **TLS certificate** — free via [Let's Encrypt](https://letsencrypt.org/) (certbot).
- An **SMTP account** for the platform emails (user registration, password reset): host, port, username and password. Ask your institution's IT department.

## Optional (development only)

- [MkDocs](https://www.mkdocs.org/) with the [Material theme](https://squidfunk.github.io/mkdocs-material/) (`pip install mkdocs-material`) to preview this documentation locally with `mkdocs serve`. The published documentation is built automatically by GitHub Actions.

Next step: [Installation](installation.md).
