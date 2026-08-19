#!/usr/bin/env python3
"""QA: 双宽慢滚扫描 + 字体检查 + reduced-motion + 截图"""
import sys, os, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "file:///mnt/agents/output/pg-backend-comparison/site/index.html"
OUT = "/mnt/agents/output/pg-backend-comparison/qa"
os.makedirs(OUT, exist_ok=True)

def run(width, reduce=False, tag=""):
    errors, perrors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": width, "height": 900},
                            reduced_motion="reduce" if reduce else "no-preference")
        pg = ctx.new_page()
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: perrors.append(str(e)))
        pg.goto(URL, wait_until="load")
        pg.wait_for_timeout(1200)
        # 慢滚全程触发 IO
        y, H = 0, pg.evaluate("document.documentElement.scrollHeight")
        while y < H:
            pg.evaluate(f"scrollTo(0,{y})")
            pg.wait_for_timeout(140)
            y += 700
            H = pg.evaluate("document.documentElement.scrollHeight")
        pg.wait_for_timeout(1600)
        overflow = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        font_ok = pg.evaluate("document.fonts.check('16px et-book')")
        pg.screenshot(path=f"{OUT}/full-{width}{tag}.png", full_page=False)
        pg.evaluate("scrollTo(0,0)"); pg.wait_for_timeout(800)
        pg.screenshot(path=f"{OUT}/cover-{width}{tag}.png")
        # 各图表元素截图
        for cid in ["score-chart","cards-chart","matrix-chart","verdict-chart","cost-chart","stack-chart","evo-chart","risk-chart"]:
            try:
                el = pg.locator("#"+cid)
                el.scroll_into_view_if_needed(); pg.wait_for_timeout(1100)
                el.screenshot(path=f"{OUT}/{cid}-{width}{tag}.png")
            except Exception as ex:
                errors.append(f"shot {cid}: {ex}")
        b.close()
    print(f"[{width}{tag}] pageerrors={len(perrors)} console_errors={len(errors)} h-overflow={overflow}px et-book={font_ok}")
    for e in perrors[:5]: print("  PAGEERROR:", e[:300])
    for e in errors[:8]: print("  CONSOLE:", e[:300])
    return len(perrors), len(errors), overflow, font_ok

r1 = run(1680)
r2 = run(1280)
r3 = run(1680, reduce=True, tag="-rm")
ok = all(r[0]==0 and r[1]==0 and r[2]==0 for r in [r1,r2,r3]) and all(r[3] for r in [r1,r2,r3])
print("GATE:", "PASS" if ok else "FAIL")
