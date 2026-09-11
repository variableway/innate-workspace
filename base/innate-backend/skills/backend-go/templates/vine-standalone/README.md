# vine-standalone（拷贝用脚手架）

最小 Vine standalone 应用。Agent 新建 Vine 项目时复制本目录，**不要**复制
`innate-go/samples/vine-rest`（那是完整 demo）。

完整 REST 行为参考仍读：`base/innate-backend/innate-go/samples/vine-rest`。

## Copy

```bash
DEST=../my-vine-app   # 改成目标路径
cp -R templates/vine-standalone "$DEST"
cd "$DEST"
go mod edit -module example.com/my-vine-app
go get go.yorun.ai/vine@latest
go install go.yorun.ai/vine/cmd/vine@latest
go install go.yorun.ai/skelc/cmd/skelc@latest
go mod tidy
go run .
```

`Ctrl+C` 后按 Hub → Portal → Link → App 的逆序关停。首次运行会在当前目录写 `vine.sqlite`。

## Next

1. 加 `.skel` 契约，`skelc gen go --skel-in ./skel --go-out ./skeled`（skelc 须满足当前 Vine 的 `MinSkelcVersion()`）。
2. 声明 `app.WebberEnabled` / `ServicerEnabled` 等能力，见 [01-app-startup](../../refs/01-app-startup.md)。
3. Portal 规则用 `match*` / `route*`，见 [14-seed-portal-yaml](../../refs/14-seed-portal-yaml.md)。
