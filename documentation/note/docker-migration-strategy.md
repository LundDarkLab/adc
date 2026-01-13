# Strategia di Migrazione Docker - Lund Project

## Architettura Attuale

### Server e Ambienti
- **Laptop locale**: Sviluppo con Docker
- **Server A** (dietro VPN): 
  - `/var/www/plus` → Produzione (dyncolldev.ht.lu.se)
  - `/var/www/prototype_dev` → Development (dyncolldev.ht.lu.se)
  - **Senza Docker** (no permessi amministrativi)
- **Server B** (dietro VPN):
  - Virtual hosts: dyncoll.ht.lu.se, dyncolldev.ht.lu.se, lweb664.ht.lu.se
  - **Con Docker**
  - DB slave in replica (diventerà master)
- **Server C** (esterno VPN):
  - DB MySQL master attuale

### Obiettivi Migrazione
1. Migrare tutto su Server B
2. Server A come backup
3. Promuovere DB di Server B a master
4. Server C da master a slave (o backup)
5. Standardizzare ambiente con Docker (laptop + Server B)

---

## 1. Configurazione Docker

### docker-compose.yml

```yaml
services:
  web:
    build: .
    container_name: lund_web
    ports:
      - "${WEB_PORT:-8080}:80"
    volumes:
      - .:/var/www/html
    environment:
      - ENV=${ENV:-local}
      - BASE_PATH=${BASE_PATH:-/}
      - DB_HOST=${DB_HOST:-db}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
    depends_on:
      - db
    networks:
      - lund_network
    env_file:
      - .env

  db:
    image: mysql:8.0
    container_name: lund_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASS}
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d
      - ~/.my.cnf:/root/.my.cnf:ro  # Mount configurazione MySQL
    networks:
      - lund_network
    command: --default-authentication-plugin=mysql_native_password

volumes:
  db_data:
    driver: local

networks:
  lund_network:
    driver: bridge
```

---

## 2. File di Configurazione Ambiente

### .env.local (Laptop - Sviluppo)

```bash
# Ambiente
ENV=local
BASE_PATH=/

# Web server
WEB_PORT=8080

# Database locale
DB_HOST=db
DB_PORT=3306
DB_NAME=lund_dev
DB_USER=lund_user
DB_PASS=dev_password_123
DB_ROOT_PASSWORD=root_password_123
```

### .env.serverB.prod (Server B - Produzione)

```bash
# Ambiente
ENV=production
BASE_PATH=/

# Web server
WEB_PORT=80

# Database Server B (locale dopo migrazione)
DB_HOST=db
DB_PORT=3306
DB_NAME=lund_production
DB_USER=lund_prod
DB_PASS=STRONG_PASSWORD_HERE
DB_ROOT_PASSWORD=STRONG_ROOT_PASSWORD
```

### .env.serverB.dev (Server B - Test lweb664)

```bash
# Ambiente
ENV=development
BASE_PATH=/

# Web server
WEB_PORT=8082

# Database Server B (test)
DB_HOST=db
DB_PORT=3307
DB_NAME=lund_test
DB_USER=lund_test
DB_PASS=test_password_123
DB_ROOT_PASSWORD=test_root_password
```

### .env.example (Da committare nel repo)

```bash
# Ambiente
ENV=local
BASE_PATH=/

# Web server
WEB_PORT=8080

# Database
DB_HOST=db
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_user
DB_PASS=your_password
DB_ROOT_PASSWORD=your_root_password
```

**Importante**: Aggiungi al `.gitignore`:
```
.env
.env.local
.env.serverB.*
.my.cnf
```

---

## 3. Configurazione MySQL con .my.cnf

### Esempio ~/.my.cnf locale

```ini
[client]
user=lund_user
password=dev_password_123

[mysql]
database=lund_dev

[client-local]
host=localhost
port=3306

[client-serverB]
host=SERVER_B_IP
port=3306
user=lund_prod
password=STRONG_PASSWORD_HERE

[client-serverC]
host=SERVER_C_IP
port=3306
user=lund_prod
password=STRONG_PASSWORD_HERE
```

### Connessione con --defaults-group-suffix

```bash
# Locale (Docker)
docker exec -it lund_db mysql --defaults-group-suffix=-local

# Server B (remoto)
mysql --defaults-group-suffix=-serverB

# Server C (remoto)
mysql --defaults-group-suffix=-serverC

# Dump da Server C
mysqldump --defaults-group-suffix=-serverC lund_production > dump_$(date +%Y%m%d).sql

# Import su Server B
docker exec -i lund_db mysql --defaults-group-suffix=-local lund_production < dump_20260108.sql
```

---

## 4. Script di Deploy Automatico

### deploy.sh

```bash
#!/bin/bash
# deploy.sh - Script di deployment automatizzato

TARGET=$1

case $TARGET in
  local)
    cp .env.local .env
    docker-compose up -d
    echo "✅ Locale avviato su http://localhost:8080"
    echo "📊 Connetti al DB: docker exec -it lund_db mysql --defaults-group-suffix=-local"
    ;;
    
  serverB-prod)
    ssh user@SERVER_B << 'EOF'
      cd /var/www/html
      git pull origin main
      cp .env.serverB.prod .env
      docker-compose up -d --build
      docker-compose ps
EOF
    echo "✅ Server B production aggiornato"
    ;;
    
  serverB-dev)
    ssh user@SERVER_B << 'EOF'
      cd /var/www/test
      git pull origin develop
      cp .env.serverB.dev .env
      docker-compose up -d --build
EOF
    echo "✅ Server B test (lweb664) aggiornato"
    ;;
    
  serverA-dev)
    ssh user@SERVER_A << 'EOF'
      cd /var/www/prototype_dev
      git pull origin develop
EOF
    echo "✅ Server A dev aggiornato (no Docker)"
    ;;
    
  serverA-prod)
    ssh user@SERVER_A << 'EOF'
      cd /var/www/plus
      git pull origin main
EOF
    echo "✅ Server A production aggiornato (no Docker)"
    ;;
    
  *)
    echo "Usage: ./deploy.sh [local|serverB-prod|serverB-dev|serverA-dev|serverA-prod]"
    exit 1
    ;;
esac
```

Rendilo eseguibile:
```bash
chmod +x deploy.sh
```

---

## 5. Piano di Migrazione Step-by-Step

### Fase 1: Setup Iniziale (Laptop + Server B)

#### Laptop
```bash
# 1. Crea file di configurazione
cp .env.example .env.local
nano .env.local  # Modifica con i tuoi valori

# 2. Configura .my.cnf
nano ~/.my.cnf  # Aggiungi sezioni [client-*]

# 3. Avvia Docker
cp .env.local .env
docker-compose up -d

# 4. Verifica
docker-compose ps
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SHOW DATABASES;"

# 5. Test applicazione
curl http://localhost:8080
```

#### Server B (Test su lweb664)
```bash
# SSH su Server B
ssh user@SERVER_B

# 1. Prepara ambiente test
mkdir -p /var/www/test
cd /var/www/test
git clone <repo> .

# 2. Configura
cp .env.example .env.serverB.dev
nano .env.serverB.dev
cp .env.serverB.dev .env

# 3. Avvia Docker
docker-compose up -d

# 4. Test
curl http://localhost:8082
```

### Fase 2: Migrazione Database

#### Step 1: Backup DB da Server C
```bash
# Da laptop o server con accesso a Server C
mysqldump --defaults-group-suffix=-serverC \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  lund_production > dump_migration_$(date +%Y%m%d_%H%M).sql

# Comprimi
gzip dump_migration_*.sql
```

#### Step 2: Import su Server B
```bash
# Copia dump su Server B
scp dump_migration_*.sql.gz user@SERVER_B:/tmp/

# SSH su Server B
ssh user@SERVER_B

# Decomprimi
gunzip /tmp/dump_migration_*.sql.gz

# Import nel container Docker
cd /var/www/html  # o /var/www/test per test
docker exec -i lund_db mysql --defaults-group-suffix=-local lund_production < /tmp/dump_migration_*.sql

# Verifica
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "USE lund_production; SHOW TABLES;"
```

#### Step 3: Setup Replicazione (Server B → Server C)

**Su Server B (nuovo master)**:
```sql
-- Crea utente di replica
CREATE USER 'repl_user'@'SERVER_C_IP' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'SERVER_C_IP';
FLUSH PRIVILEGES;

-- Abilita binary log (aggiungi a my.cnf del container)
-- server-id=2
-- log-bin=mysql-bin
-- binlog-do-db=lund_production

-- Ottieni posizione binary log
SHOW MASTER STATUS;
-- Annota: File e Position
```

**Su Server C (nuovo slave)**:
```sql
-- Ferma slave esistente
STOP SLAVE;
RESET SLAVE ALL;

-- Configura nuovo master (Server B)
CHANGE MASTER TO
  MASTER_HOST='SERVER_B_IP',
  MASTER_USER='repl_user',
  MASTER_PASSWORD='repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',  -- Da SHOW MASTER STATUS
  MASTER_LOG_POS=107;                  -- Da SHOW MASTER STATUS

-- Avvia slave
START SLAVE;

-- Verifica
SHOW SLAVE STATUS\G
```

### Fase 3: Test su Server B (lweb664)

```bash
# Testa ambiente completo
curl https://lweb664.ht.lu.se:8082

# Verifica connessione DB
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SELECT VERSION();"

# Monitora logs
docker-compose logs -f web
docker-compose logs -f db

# Test applicazione (inserisci/modifica dati)
# Verifica replica su Server C
```

### Fase 4: Deployment Produzione Server B

```bash
# Su Server B
cd /var/www/html
git clone <repo> .
cp .env.serverB.prod .env
nano .env.serverB.prod  # Verifica credenziali

# Avvia produzione
docker-compose up -d

# Verifica
docker-compose ps
curl http://localhost

# Test completo dell'applicazione
```

### Fase 5: Switch DNS

**Prima dello switch**:
```bash
# 1. Verifica Server B completamente funzionante
# 2. Notifica utenti di manutenzione programmata
# 3. Backup finale Server A

ssh user@SERVER_A
cd /var/www/plus
tar -czf backup_pre_migration_$(date +%Y%m%d).tar.gz .
```

**Switch DNS**:
1. Cambia DNS per `dyncoll.ht.lu.se` → IP Server B
2. Cambia DNS per `dyncolldev.ht.lu.se` → IP Server B
3. Attendi propagazione DNS (24-48h)

**Dopo lo switch**:
```bash
# Monitora Server B per 48h
docker-compose logs -f

# Verifica carico
docker stats

# Controlla replica DB
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SHOW SLAVE STATUS\G"
```

### Fase 6: Server A come Backup

#### Script di Backup Automatico (su Server A)

```bash
#!/bin/bash
# /usr/local/bin/backup_from_serverB.sh

BACKUP_DIR="/backup/lund"
DATE=$(date +%Y%m%d_%H%M)

# Backup database
ssh user@SERVER_B "docker exec lund_db mysqldump --defaults-group-suffix=-local --single-transaction lund_production | gzip" > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Backup files
rsync -avz --delete user@SERVER_B:/var/www/html/ ${BACKUP_DIR}/files/

# Pulizia backup vecchi (conserva ultimi 7 giorni)
find ${BACKUP_DIR} -name "db_*.sql.gz" -mtime +7 -delete

echo "✅ Backup completato: ${DATE}"
```

**Cron job**:
```bash
# Aggiungi a crontab di Server A
crontab -e

# Backup giornaliero alle 2 AM
0 2 * * * /usr/local/bin/backup_from_serverB.sh >> /var/log/backup_lund.log 2>&1
```

---

## 6. Gestione Codice (apiConfig.js)

### js/shared/config/apiConfig.js

Mantieni compatibilità Server A (senza Docker) e Server B (con Docker):

```javascript
const getBasePath = () => {
  const path = window.location.pathname;
  
  // Server A (senza Docker, con sottocartelle)
  if (path.includes('/prototype_dev/')) { return '/prototype_dev/'; }
  if (path.includes('/plus/')) { return '/plus/'; }
  
  // Server B e Laptop (con Docker, root)
  return '/';
};

const BASE_PATH = getBasePath();
const API = BASE_PATH + 'api/';
export const ENDPOINT = window.location.origin + API + 'endpoint_private.php';
```

---

## 7. Comandi Utili

### Docker

```bash
# Avvio/Stop
docker-compose up -d
docker-compose down
docker-compose restart

# Rebuild dopo modifiche Dockerfile
docker-compose up -d --build

# Logs
docker-compose logs -f
docker-compose logs -f web
docker-compose logs -f db

# Status
docker-compose ps
docker stats

# Accesso shell container
docker exec -it lund_web bash
docker exec -it lund_db bash

# Pulizia
docker-compose down -v  # Rimuove anche volumi (ATTENZIONE: cancella DB!)
docker system prune -a  # Pulizia completa
```

### MySQL

```bash
# Connessione DB nel container
docker exec -it lund_db mysql --defaults-group-suffix=-local

# Dump database
docker exec lund_db mysqldump --defaults-group-suffix=-local lund_production > backup.sql

# Import database
docker exec -i lund_db mysql --defaults-group-suffix=-local lund_production < backup.sql

# Verifica replica
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SHOW SLAVE STATUS\G"

# Monitor in tempo reale
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SHOW PROCESSLIST;"
```

### Git (Workflow Multi-Remote)

```bash
# Setup remoti
git remote add serverA user@SERVER_A:/path/to/repo.git
git remote add serverB user@SERVER_B:/path/to/repo.git

# Push su entrambi
git push serverA main
git push serverB main

# O crea alias
git config alias.pushall '!git push serverA main && git push serverB main'
git pushall
```

---

## 8. Troubleshooting

### Docker non si avvia

```bash
# Verifica porte occupate
sudo lsof -i :8080
sudo lsof -i :3306

# Cambia porta in .env
WEB_PORT=8090
DB_PORT=3307

# Riavvia
docker-compose down
docker-compose up -d
```

### Database non si connette

```bash
# Verifica credenziali .env
cat .env | grep DB_

# Verifica container attivo
docker-compose ps

# Logs database
docker-compose logs db

# Test connessione
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SELECT 1;"
```

### Replica non funziona

```bash
# Su slave (Server C)
docker exec -it lund_db mysql --defaults-group-suffix=-local -e "SHOW SLAVE STATUS\G"

# Verifica:
# - Slave_IO_Running: Yes
# - Slave_SQL_Running: Yes
# - Last_Error: (vuoto)

# Se errore, reset
STOP SLAVE;
RESET SLAVE;
# Riconfigura CHANGE MASTER TO...
START SLAVE;
```

### Permessi file

```bash
# Se errori di permessi
docker exec -it lund_web chown -R www-data:www-data /var/www/html
docker exec -it lund_web chmod -R 755 /var/www/html
```

---

## 9. Checklist Finale

### Pre-Migrazione
- [ ] Docker configurato su laptop
- [ ] Docker configurato su Server B
- [ ] File `.env` creati per ogni ambiente
- [ ] `.my.cnf` configurato con tutti i suffix
- [ ] Test completo su lweb664
- [ ] Backup Server A completo
- [ ] Backup DB Server C completo
- [ ] Script deploy testato

### Durante Migrazione
- [ ] Dump DB da Server C
- [ ] Import DB su Server B
- [ ] Replica configurata (Server B → Server C)
- [ ] Test applicazione su Server B
- [ ] Notifica utenti
- [ ] Switch DNS
- [ ] Monitoraggio 24h

### Post-Migrazione
- [ ] Applicazione funzionante su Server B
- [ ] Replica DB stabile
- [ ] Backup automatico configurato (Server A)
- [ ] Server A come fallback attivo
- [ ] Documentazione aggiornata
- [ ] Team informato delle nuove procedure

---

## 10. Contatti e Risorse

### Repository
- **Git Server A**: `user@SERVER_A:/path/to/repo.git`
- **Git Server B**: `user@SERVER_B:/path/to/repo.git`

### Ambienti
- **Locale**: http://localhost:8080
- **Server A Dev**: https://dyncolldev.ht.lu.se/prototype_dev
- **Server A Prod**: https://dyncolldev.ht.lu.se/plus
- **Server B Test**: https://lweb664.ht.lu.se:8082
- **Server B Prod**: https://dyncoll.ht.lu.se (post-migrazione)

### Note Importanti
- Server A mantiene configurazione tradizionale (no Docker)
- Server B usa Docker per consistenza ambiente
- Laptop usa Docker per sviluppo locale
- Connessioni DB sempre tramite `.my.cnf` con suffix
- Nessun phpMyAdmin: tutto da terminale

---

**Ultimo aggiornamento**: 8 gennaio 2026