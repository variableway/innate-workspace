#!/usr/bin/env bash
# setup.sh — 首次环境初始化
# 检查依赖、创建 .env、创建 Docker 网络
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== innate-selfhost 环境初始化 ==="

# 1. 检查 Docker
if ! command -v docker &>/dev/null; then
    echo "❌ 未安装 Docker。请先安装：https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✅ Docker: $(docker --version)"

# 2. 检查 Docker Compose
if docker compose version &>/dev/null; then
    echo "✅ Docker Compose: $(docker compose version --short)"
elif command -v docker-compose &>/dev/null; then
    echo "✅ Docker Compose (standalone): $(docker-compose --version)"
else
    echo "❌ 未安装 Docker Compose。请先安装：https://docs.docker.com/compose/install/"
    exit 1
fi

# 3. 创建 .env
if [ ! -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/infra/env.example" "$ROOT_DIR/.env"
    echo "✅ 已创建 .env（从 infra/env.example 复制）"
    echo "   ⚠️  请编辑 .env 修改默认密码和密钥"
else
    echo "⏭️  .env 已存在，跳过"
fi

# 4. 创建 Docker 网络
if docker network inspect selfhost-net &>/dev/null; then
    echo "⏭️  Docker 网络 selfhost-net 已存在"
else
    docker network create selfhost-net
    echo "✅ 已创建 Docker 网络 selfhost-net"
fi

# 5. 创建数据目录
mkdir -p "$ROOT_DIR/data"
echo "✅ 数据目录: $ROOT_DIR/data"

echo ""
echo "=== 初始化完成 ==="
echo "下一步："
echo "  1. 编辑 .env 修改密码和密钥"
echo "  2. 部署服务：bash scripts/deploy.sh baas"
