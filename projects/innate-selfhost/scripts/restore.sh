#!/usr/bin/env bash
# restore.sh — 数据恢复
# 用法：bash scripts/restore.sh <backup-file>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$ROOT_DIR/backups"

usage() {
    echo "用法：bash scripts/restore.sh <backup-file>"
    echo ""
    echo "可用备份文件："
    ls -lh "$BACKUP_DIR"/*.dump "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "  （无备份文件）"
    exit 1
}

if [ $# -eq 0 ]; then
    usage
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    # 尝试在 backups/ 目录下查找
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo "❌ 备份文件不存在：$BACKUP_FILE"
        exit 1
    fi
fi

echo "=== innate-selfhost 数据恢复 ==="
echo "备份文件：$BACKUP_FILE"

case "$BACKUP_FILE" in
    *.dump)
        echo ""
        echo "⚠️  即将恢复 PostgreSQL 数据库，这将覆盖当前数据！"
        read -p "确认继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 0
        fi
        echo "🔄 恢复 PostgreSQL ..."
        docker exec -i baas-db psql -U postgres < "$BACKUP_FILE"
        echo "✅ PostgreSQL 恢复完成"
        ;;
    *.tar.gz)
        # 根据文件名判断恢复目标
        FILENAME=$(basename "$BACKUP_FILE")
        if [[ "$FILENAME" == pgdata_* ]]; then
            VOL="pgdata"
        elif [[ "$FILENAME" == redisdata_* ]]; then
            VOL="redisdata"
        elif [[ "$FILENAME" == miniodata_* ]]; then
            VOL="miniodata"
        elif [[ "$FILENAME" == memweave_* ]]; then
            echo "🔄 恢复 memweave 数据 ..."
            tar xzf "$BACKUP_FILE" -C "$ROOT_DIR/services/memweave/"
            echo "✅ memweave 数据恢复完成"
            exit 0
        else
            echo "❌ 无法识别备份文件类型：$FILENAME"
            echo "   文件名格式：<volume>_<timestamp>.tar.gz"
            exit 1
        fi
        echo ""
        echo "⚠️  即将恢复 volume $VOL，这将覆盖当前数据！"
        read -p "确认继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 0
        fi
        echo "🔄 恢复 volume $VOL ..."
        docker run --rm -v "$VOL":/target -v "$(dirname "$BACKUP_FILE")":/backup alpine \
            sh -c "rm -rf /target/* && tar xzf /backup/$(basename "$BACKUP_FILE") -C /target"
        echo "✅ volume $VOL 恢复完成"
        ;;
    *)
        echo "❌ 不支持的文件格式（仅支持 .dump 和 .tar.gz）"
        exit 1
        ;;
esac

echo ""
echo "=== 恢复完成 ==="
