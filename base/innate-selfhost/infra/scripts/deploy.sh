#!/usr/bin/env bash
# deploy.sh — 统一部署入口
# 用法：bash scripts/deploy.sh <service-name>
#       bash scripts/deploy.sh --all
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICES_DIR="$ROOT_DIR/services"

# 可部署服务列表（有 docker-compose.yml 的服务）
DEPLOYABLE_SERVICES=("baas")

usage() {
    echo "用法：bash scripts/deploy.sh <service-name>"
    echo "      bash scripts/deploy.sh --all"
    echo ""
    echo "可部署服务："
    for svc in "${DEPLOYABLE_SERVICES[@]}"; do
        echo "  - $svc"
    done
    echo ""
    echo "其他服务（非 Docker 部署）："
    echo "  - memweave: cd services/memweave && pip install -e ."
    exit 1
}

deploy_service() {
    local svc="$1"
    local svc_dir="$SERVICES_DIR/$svc"

    if [ ! -d "$svc_dir" ]; then
        echo "❌ 服务目录不存在：$svc_dir"
        return 1
    fi

    if [ ! -f "$svc_dir/docker-compose.yml" ]; then
        echo "⚠️  $svc 没有 docker-compose.yml，跳过 Docker 部署"
        return 0
    fi

    echo "🚀 部署 $svc ..."
    cd "$svc_dir"
    docker compose up -d
    echo "✅ $svc 部署完成"
}

# 主逻辑
if [ $# -eq 0 ]; then
    usage
fi

if [ "$1" = "--all" ]; then
    echo "=== 部署所有服务 ==="
    for svc in "${DEPLOYABLE_SERVICES[@]}"; do
        deploy_service "$svc"
    done
    echo ""
    echo "=== 全部部署完成 ==="
    bash "$SCRIPT_DIR/health-check.sh"
else
    deploy_service "$1"
fi
