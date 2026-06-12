# Maintenance

## Backups

All persistent state lives in two places — back up **both**:

### Database

```bash
docker exec lund-db sh -c \
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --routines "$MYSQL_DATABASE"' \
  > backup-$(date +%F).sql
```

Schedule it with cron and rotate the dumps. Compress with `gzip` if the database grows large.

### Uploaded files

Copy the `archive/` and `img/` directories mounted into the web container (check the host paths in the `volumes:` section of `docker-compose.yml`):

```bash
rsync -a /path/to/archive/ /backup/archive/
rsync -a /path/to/img/     /backup/img/
```

## Restore

1. Stop the stack: `docker compose down`
2. Restore the file directories with `rsync` (reverse direction).
3. Start only the database: `docker compose up -d db`
4. Import the dump:
   ```bash
   docker exec -i lund-db sh -c \
     'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backup.sql
   ```
5. Start the rest: `docker compose up -d`

For a **disaster recovery on a fresh server**: install Docker, clone the repository, restore `.env` (you did back it up somewhere safe, didn't you?), restore the file directories, then follow the steps above.

## Updating

```bash
git pull
docker compose up -d --build
```

If you run the prebuilt image instead of building from source:

```bash
git pull        # keeps db-init/, scripts/ and compose files current
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

The database volume and the uploaded files are untouched by updates. **Always take a backup before updating a production instance.**

Schema changes between releases ship as plain SQL scripts in `scripts/migrations/`, named by date and listed in the release notes. Apply the ones newer than your current version, in chronological order:

```bash
docker exec -i lund-db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  < scripts/migrations/<migration>.sql
```

Each script documents its own pre-checks in the header comment. Fresh installations never need them: `db-init/00-schema.sql` is always current.

## Logs

| What | Command |
|------|---------|
| Application / Apache | `docker compose logs -f web` |
| Database | `docker compose logs -f db` |
| Containers status | `docker compose ps` |

In development, the compose override enables the MySQL *general log* (very verbose — never enable it in production).

## Troubleshooting

### The `db` container never becomes healthy

- First start: the import of `db-init/` can take several minutes — watch `docker compose logs -f db`.
- Insufficient RAM: the default configuration allocates a 2 GB InnoDB buffer pool. On small machines lower `--innodb_buffer_pool_size` in `docker-compose.yml`.
- Volume from a previous attempt with different credentials: MySQL only applies `DB_*` values on an **empty** volume. Either restore matching credentials in `.env`, or wipe and reinitialise with `docker compose down -v` (**deletes all data**).

### "Permission denied" on uploads, or files unreadable

The entrypoint aligns the `www-data` UID with the owner of the mounted `archive/` directory at container start. If you changed the ownership of the host directory, restart the web container (`docker compose restart web`) and check its logs (`[entrypoint] ...` lines).

### Emails are not sent (registration, password reset)

- Verify the `MAIL*` values in `.env`, then recreate the containers so the new environment is applied (`docker compose up -d`).
- Test the SMTP credentials from the host (`openssl s_client -starttls smtp -connect smtp.example.com:587`).
- Some institutional SMTP servers restrict the allowed `From` address: `MAILSETFROM` must usually match the authenticated account.

### Port already in use

Another service occupies `8081` (or the `DB_PORT` you chose). Change the host-side mapping in `docker-compose.yml` / `.env` and `docker compose up -d` again.

### 3D models do not load

- The viewer only accepts the Nexus format (`.nxz`); other formats must be converted first (see the [FAQ](../user/faq.md)).
- Check the reverse-proxy upload limits (`client_max_body_size` in nginx, `LimitRequestBody` in Apache) — large uploads truncated by the proxy fail silently.

### Resetting a forgotten admin password

Users can self-reset via email. If the mail subsystem itself is the problem, an administrator with database access can set the password manually. Generate a bcrypt hash:

```bash
docker exec lund-web-app php -r "echo password_hash('NewPassword', PASSWORD_BCRYPT), PHP_EOL;"
```

then store it in the `password_hash` column of the `user` table for the affected account.
