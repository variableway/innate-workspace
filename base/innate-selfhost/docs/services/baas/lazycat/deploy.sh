#!/usr/bin/env bash
# 懒猫私有云一键部署脚本 —— 自托管 BaaS
# 用法：
#   bash deploy.sh           # 打包并安装到默认微服盒子
#   bash deploy.sh --build   # 只打包出 .lpk（可拷到懒猫网盘点击安装 / 上架商店）
# 前置：npm install -g @lazycatcloud/lzc-cli，且盒子已装「开发者工具」应用
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v lzc-cli >/dev/null 2>&1; then
  echo "未找到 lzc-cli，请先安装：npm install -g @lazycatcloud/lzc-cli" >&2
  exit 1
fi

# 1. 准备打包内容：数据库初始化 SQL 需随包分发（挂载到 ParadeDB 初始化目录）
mkdir -p content
cp ../init.sql content/init.sql

# 2. 打包
echo "==> 构建 LPK 包..."
lzc-cli project build -f
LPK=$(ls -t ./*.lpk | head -1)
echo "==> 产物：$LPK"

# 3. 仅打包则退出
if [[ "${1:-}" == "--build" ]]; then
  echo "已生成 $LPK，可放入懒猫网盘点击安装，或 lzc-cli appstore publish 上架。"
  exit 0
fi

# 4. 安装到默认盒子
BOX=$(lzc-cli box default)
echo "==> 安装到微服盒子：$BOX"
lzc-cli app install "$LPK"

cat <<EOF

✅ 部署完成。入口（替换 <box-domain> 为你的微服域名）：
   REST API  : https://baas.<box-domain>/api/
   认证服务  : https://baas.<box-domain>/auth/
   实时推送  : https://baas.<box-domain>/realtime/
   MinIO 控制台: https://baas.<box-domain>/minio/
   PostgreSQL: <box-domain>:15432（局域网 TCP 转发）

提示：
- 所有密码由 stable_secret 在首次安装时自动生成并稳定保存，无需手动配置；
- Authentik 首次启动前需在数据库执行 CREATE DATABASE authentik;
  （lzc-cli docker exec -it <db容器> psql -U postgres -c 'CREATE DATABASE authentik;'）
- 查看日志：lzc-cli docker ps -a / lzc-cli docker logs -f <容器名>
EOF
