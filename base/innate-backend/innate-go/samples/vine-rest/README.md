# vine-rest

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
