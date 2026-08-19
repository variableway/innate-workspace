#!/usr/bin/env python3
"""修复前基线截图：PPT 封面/P2/P5 + 站点封面"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = "/mnt/agents/output/pg-backend-comparison"
OUT = sys.argv[1] if len(sys.argv) > 1 else f"{BASE}/scripts/qa-after/before"
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2)
    pg = ctx.new_page()
    errs, cerrs = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: cerrs.append(m.text) if m.type == "error" else None)

    # ---- PPT ----
    pg.goto(f"file://{BASE}/ppt/index.html", wait_until="load")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{OUT}/ppt-cover.png")
    for n in (2, 5):
        pg.evaluate(f"window.dispatchEvent(new KeyboardEvent('keydown',{{key:'ArrowRight'}}))")
        # 直接调用 go() 更稳
    for n in (1, 4):  # 0-based: P2=1, P5=4
        pg.evaluate(f"go({n})")
        pg.wait_for_timeout(1800)
        pg.screenshot(path=f"{OUT}/ppt-p{n+1}.png")
    # 封底
    pg.evaluate("go(19)")
    pg.wait_for_timeout(1800)
    pg.screenshot(path=f"{OUT}/ppt-closing.png")

    # ---- 站点封面 ----
    pg.goto(f"file://{BASE}/site/index.html", wait_until="load")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{OUT}/site-cover.png")

    print("pageerrors:", errs)
    print("console errors:", cerrs)
    b.close()
