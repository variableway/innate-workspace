from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1680,"height":950})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file:///mnt/agents/output/pg-backend-comparison/site/index.html", wait_until="load")
    pg.wait_for_timeout(2500)
    pg.screenshot(path="qa/coverA.png")
    for m,t in [("x",2200),("w",1500),("d",3600)]:
        pg.click(f'#cover-mode button[data-mode="{m}"]')
        pg.wait_for_timeout(t)
        pg.screenshot(path=f"qa/cover{m.upper()}.png")
    # D 完成后再拍一张稳态
    pg.wait_for_timeout(1200); pg.screenshot(path="qa/coverD-done.png")
    # drill 抽查：点击矩阵一格
    pg.locator("#matrix-chart").scroll_into_view_if_needed(); pg.wait_for_timeout(1200)
    pg.locator("table.mx td.cell").nth(4).click(); pg.wait_for_timeout(500)
    pg.screenshot(path="qa/drill-matrix.png")
    print("pageerrors:", errs)
    b.close()
