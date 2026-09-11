# Scripts — 运维脚本

通用运维脚本，用于环境初始化、部署、备份和健康检查。

## 脚本列表

| 脚本 | 说明 | 用法 |
|------|------|------|
| `setup.sh` | 首次环境初始化 | `bash scripts/setup.sh` |
| `deploy.sh` | 统一部署入口 | `bash scripts/deploy.sh baas` 或 `--all` |
| `backup.sh` | 数据备份 | `bash scripts/backup.sh` |
| `restore.sh` | 数据恢复 | `bash scripts/restore.sh <backup-file>` |
| `health-check.sh` | 服务健康检查 | `bash scripts/health-check.sh` |

## 注意事项

- 所有脚本应在仓库根目录执行
- 备份文件保存在 `backups/` 目录
- 恢复操作会覆盖当前数据，请确认后再执行
