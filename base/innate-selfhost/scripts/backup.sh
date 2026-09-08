#!/usr/bin/env bash
# backup.sh — 数据备份
# 备份 PostgreSQL 数据库和 Docker volumes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$ROOT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "=== innate-selfhost 数据备份 ==="
echo "备份目录：$BACKUP_DIR"
echo "时间戳：$TIMESTAMP"

# 1. PostgreSQL 备份（baas 服务）
if docker ps --format '{{.Names}}' | grep -q "baas-db"; then
    echo ""
    echo "📦 备份 PostgreSQL ..."
    PG_BACKUP="$BACKUP_DIR/pg_${TIMESTAMP}.dump"
    docker exec baas-db pg_dumpall -U postgres > "$PG_BACKUP"
    echo "✅ PostgreSQL 备份完成：$PG_BACKUP"
    echo "   大小：$(du -h "$PG_BACKUP" | cut -f1)"
else
    echo "⏭️  baas-db 容器未运行，跳过 PostgreSQL 备份"
fi

# 2. Docker volume 备份
echo ""
echo "📦 备份 Docker volumes ..."
for vol in pgdata redisdata authentik_media miniodata; do
    if docker volume inspect "$vol" &>/dev/null; then
        VOL_BACKUP="$BACKUP_DIR/${vol}_${TIMESTAMP}.tar.gz"
        docker run --rm -v "$vol":/source:ro -v "$BACKUP_DIR":/backup alpine \
            tar czf "/backup/${vol}_${TIMESTAMP}.tar.gz" -C /source .
        echo "✅ $vol 备份完成：$VOL_BACKUP"
    else
        echo "⏭️  volume $vol 不存在，跳过"
    fi
done

# 3. memweave 数据备份
MEMEWEAVE_DATA="$ROOT_DIR/services/memweave/data"
if [ -d "$MEMEWEAVE_DATA" ]; then
    echo ""
    echo "📦 备份 memweave 数据 ..."
    MEM_BACKUP="$BACKUP_DIR/memweave_${TIMESTAMP}.tar.gz"
    tar czf "$MEM_BACKUP" -C "$ROOT_DIR/services/memweave" data/
    echo "✅ memweave 备份完成：$MEM_BACKUP"
fi

echo ""
echo "=== 备份完成 ==="
echo "备份文件列表："
ls -lh "$BACKUP_DIR"/*_${TIMESTAMP}* 2>/dev/null || echo "  （无）"
echo ""
echo "恢复命令参考："
echo "  PG 恢复：docker exec -i baas-db psql -U postgres < backups/pg_${TIMESTAMP}.dump"
echo "  Volume 恢复：docker run --rm -v <vol>:/target -v $(pwd)/backups:/backup alpine tar xzf /backup/<file> -C /target"
