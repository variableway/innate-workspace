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
    echo "      bash scripts/deploy.sh dev [--profile queue]"
    echo "      bash scripts/deploy.sh --all"
    echo ""
    echo "可部署服务："
    for svc in "${DEPLOYABLE_SERVICES[@]}"; do
        echo "  - $svc"
    done
    echo "  - dev（Postgres + pgvector；可选 Valkey queue profile）"
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

deploy_dev() {
    cd "$ROOT_DIR"
    if [ ! -f "$ROOT_DIR/.env.dev" ]; then
        cp "$ROOT_DIR/infra/env.dev.example" "$ROOT_DIR/.env.dev"
        echo "✅ 已创建 .env.dev（开发态默认值）"
    fi
    echo "🚀 启动开发态基础设施 ..."
    local compose_args=()
    local services=()
    while [ $# -gt 0 ]; do
        if [ "$1" = "--profile" ]; then
            [ $# -ge 2 ] || { echo "❌ --profile 需要名称"; return 1; }
            compose_args+=("--profile" "$2")
            shift 2
        else
            services+=("$1")
            shift
        fi
    done
    docker compose --env-file .env.dev -f infra/docker-compose.dev.yml "${compose_args[@]}" up -d "${services[@]}"
    echo "✅ 开发态基础设施已启动（Postgres: localhost:${DEV_POSTGRES_PORT:-55432}）"
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
    if [ "$1" = "dev" ]; then
        shift
        deploy_dev "$@"
    else
        deploy_service "$1"
    fi
fi
