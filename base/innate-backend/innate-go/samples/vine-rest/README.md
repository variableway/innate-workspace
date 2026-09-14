# vine-rest

当前基线：Vine v0.15.7、skelc v0.19.0。示例代码可能随 Vine 发布落后；使用前按 `backend-go` Skill 的最新版本门禁重新生成 `skeled/`。

Vine **standalone REST** 样例（归属 `base/innate-backend/innate-go`）。

```bash
cd base/innate-backend/innate-go
task run:vine
# 或
cd samples/vine-rest && make build && make run
curl -s http://127.0.0.1:18081/health
curl -s http://127.0.0.1:18081/items
```

安装工具链：`../../scripts/install-vine.sh` 或本目录 `scripts/install-vine.sh`。
