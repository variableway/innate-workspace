from playwright.sync_api import sync_playwright
import sys
def scan(url, width, tag, reduce=False):
    errs, perrs = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce" if reduce else "no-preference")
        pg = ctx.new_page()
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: perrs.append(str(e)))
        pg.goto(url, wait_until="load"); pg.wait_for_timeout(1500)
        y, H = 0, pg.evaluate("document.documentElement.scrollHeight")
        while y < H:
            pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(120); y += 700
            H = pg.evaluate("document.documentElement.scrollHeight")
        pg.wait_for_timeout(1500)
        ov = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        fk = pg.evaluate("document.fonts.check('16px et-book')")
        # 抽查 5 个 drill
        drills = []
        for sel, desc in [
            ("#score-chart .s-seg", "score-seg"),
            ("#cards-chart svg rect.drillable", "cards-bar"),
            ("table.mx td.cell", "matrix-cell"),
            ("#risk-chart tr.risk-row", "risk-row"),
            (".src[data-k='K34']", "inline-K34"),
        ]:
            loc = pg.locator(sel).first
            loc.scroll_into_view_if_needed(); pg.wait_for_timeout(700)
            loc.click(); pg.wait_for_timeout(350)
            card = pg.locator("#drill-card")
            if card.is_visible():
                t = card.inner_text()
                drills.append((desc, "OK" if ("Source" in t or "来源" in t or "K" in t) else "NO-SRC", t.replace("\n"," ")[:110]))
            else:
                drills.append((desc, "NOT-VISIBLE", ""))
            pg.mouse.click(5, 5); pg.wait_for_timeout(150)
        # 修复复查截图
        pg.locator("#cost-chart").scroll_into_view_if_needed(); pg.wait_for_timeout(1200)
        pg.locator("#cost-chart").screenshot(path=f"qa/cost-{tag}.png")
        pg.locator("#cards-chart").scroll_into_view_if_needed(); pg.wait_for_timeout(1200)
        pg.locator("#cards-chart").screenshot(path=f"qa/cards-{tag}.png")
        pg.locator("#evo-chart").scroll_into_view_if_needed(); pg.wait_for_timeout(1200)
        pg.locator("#evo-chart").screenshot(path=f"qa/evo-{tag}.png")
        if not reduce:
            pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(600)
            pg.click('#cover-mode button[data-mode="x"]'); pg.wait_for_timeout(2000)
            pg.screenshot(path=f"qa/coverX-{tag}.png")
        b.close()
    print(f"[{tag} w{width} rm={reduce}] perr={len(perrs)} cerr={len(errs)} ovf={ov} font={fk}")
    for e in (perrs+errs)[:6]: print("  ERR:", e[:240])
    for d in drills: print("  DRILL", d)
site = "file:///mnt/agents/output/pg-backend-comparison/site/index.html"
single = "file:///mnt/agents/output/pg-backend-comparison/report-interactive.html"
scan(site, 1680, "fix2")
scan(site, 1280, "fix2-1280")
scan(site, 1680, "fix2-rm", reduce=True)
scan(single, 1680, "single")
