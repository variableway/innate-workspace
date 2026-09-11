#!/usr/bin/env bash
# health-check.sh — 服务健康检查
set -euo pipefail

echo "=== innate-selfhost 健康检查 ==="
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

OK=0
FAIL=0
SKIP=0

check_port() {
    local name="$1"
    local port="$2"
    local url="$3"

    if curl -sf -o /dev/null -m 5 "$url" 2>/dev/null; then
        echo "✅ $name (port $port) — 正常"
        ((OK++))
    else
        echo "❌ $name (port $port) — 无法访问"
        ((FAIL++))
    fi
}

check_container() {
    local name="$1"
    local container="$2"

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
        if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
            echo "✅ $name 容器 — $status"
            ((OK++))
        else
            echo "⚠️  $name 容器 — $status"
            ((FAIL++))
        fi
    else
        echo "⏭️  $name 容器 — 未运行"
        ((SKIP++))
    fi
}

# --- baas 服务检查 ---
echo "--- baas 服务 ---"
check_container "PostgreSQL (db)" "baas-db"
check_container "PostgREST" "baas-postgrest"
check_container "Authentik" "baas-authentik"
check_container "MinIO" "baas-minio"
check_container "Mercure" "baas-mercure"
check_container "Traefik" "baas-traefik"
check_port "PostgREST API" 3000 "http://localhost:3000/"
check_port "Traefik 网关" 8000 "http://localhost:8000/"
check_port "MinIO Console" 9001 "http://localhost:9001/"
check_port "Authentik" 9002 "http://localhost:9002/"

echo ""

# --- Docker 网络检查 ---
echo "--- 基础设施 ---"
if docker network inspect selfhost-net &>/dev/null; then
    echo "✅ Docker 网络 selfhost-net — 存在"
    ((OK++))
else
    echo "❌ Docker 网络 selfhost-net — 不存在（运行 scripts/setup.sh 创建）"
    ((FAIL++))
fi

echo ""
echo "=== 检查结果 ==="
echo "✅ 正常：$OK"
echo "❌ 异常：$FAIL"
echo "⏭️  跳过：$SKIP"

if [ $FAIL -gt 0 ]; then
    exit 1
fi
