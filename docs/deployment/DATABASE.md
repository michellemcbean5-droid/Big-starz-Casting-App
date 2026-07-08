# Database Operations Guide

This guide covers PostgreSQL setup, migrations, backups, and scaling for the Big Starz Platform.

---

## PostgreSQL Setup

### Local Development

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE bigstarz;
CREATE USER bigstarz WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE bigstarz TO bigstarz;
\q
```

### Docker

```bash
docker run -d \
  --name bigstarz-db \
  -e POSTGRES_USER=bigstarz \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=bigstarz \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### Cloud (AWS RDS)

```bash
# Create RDS instance via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier bigstarz-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 100 \
  --master-username bigstarz \
  --master-user-password your-secure-password \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name bigstarz-subnet-group \
  --backup-retention-period 7 \
  --enable-performance-insights
```

---

## Migration Commands

### Prisma Migrations

```bash
# Navigate to backend
cd backend

# Create a new migration (development)
npx prisma migrate dev --name add_user_preferences

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma Client after schema changes
npx prisma generate
```

### Migration Best Practices

1. **Always review migrations** before applying in production
2. **Backup before major migrations**
3. **Test migrations** on a copy of production data
4. **Use transactions** for data migrations
5. **Avoid destructive changes** without a deprecation period

---

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh — Run via cron daily

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="bigstarz"
RETENTION_DAYS=30

# Create backup
pg_dump -h localhost -U bigstarz -Fc $DB_NAME > "$BACKUP_DIR/bigstarz_$DATE.dump"

# Compress
gzip "$BACKUP_DIR/bigstarz_$DATE.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/bigstarz_$DATE.dump.gz" s3://bigstarz-backups/postgres/

# Clean old backups
find $BACKUP_DIR -name "bigstarz_*.dump.gz" -mtime +$RETENTION_DAYS -delete
```

### Cron Setup
```bash
# Edit crontab
crontab -e

# Daily at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/bigstarz-backup.log 2>&1
```

### Point-in-Time Recovery (PITR)

For production, enable WAL archiving:

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://bigstarz-backups/wal/%f'
max_wal_senders = 3
```

### Restore from Backup

```bash
# Drop and recreate database
dropdb -h localhost -U bigstarz bigstarz
createdb -h localhost -U bigstarz bigstarz

# Restore from custom format backup
pg_restore -h localhost -U bigstarz -d bigstarz --no-owner bigstarz_20240101_020000.dump

# Or restore from plain SQL
psql -h localhost -U bigstarz bigstarz < bigstarz_backup.sql
```

---

## Scaling Considerations

### Read Replicas

```bash
# AWS RDS — Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier bigstarz-replica-1 \
  --source-db-instance-identifier bigstarz-prod

# Application connection string (read/write split)
# Primary for writes, replicas for reads
DATABASE_URL=postgresql://bigstarz:pass@primary:5432/bigstarz
DATABASE_READ_URL=postgresql://bigstarz:pass@replica:5432/bigstarz
```

### Connection Pooling (PgBouncer)

```ini
# pgbouncer.ini
[databases]
bigstarz = host=localhost port=5432 dbname=bigstarz

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

### Sharding Strategy

For future scale, consider:
- **Tenant-based sharding** by geographic region
- **Table partitioning** by date for large tables (AiGeneration, AuditLog)
- **Separate databases** for analytics/reporting

### Performance Monitoring

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Maintenance

### Vacuum and Analyze

```bash
# Full vacuum (requires lock, use with caution)
VACUUM FULL;

# Standard vacuum
VACUUM;

# Update statistics
ANALYZE;

# Both at once
VACUUM ANALYZE;
```

### Scheduled Maintenance

```bash
# Run via cron weekly
0 3 * * 0 psql -h localhost -U bigstarz -d bigstarz -c "VACUUM ANALYZE;"
```

### Monitoring Alerts

Set up alerts for:
- Disk usage > 80%
- Connection count > 80% of max
- Replication lag > 30 seconds
- Query duration > 10 seconds
- Deadlock count > 0
