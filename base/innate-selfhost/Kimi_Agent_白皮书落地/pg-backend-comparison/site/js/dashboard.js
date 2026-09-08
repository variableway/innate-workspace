// 持久右栏仪表盘（P14：随滚动切换窗口；窗口徽标 + 阶段条 + 大读数 + 五方案状态格，全部可 drill）
window.DASH = (() => {
  const rail = document.getElementById("dash-rail");
  const cv = document.getElementById("dash-canvas");
  if (!rail || !cv) return null;
  const PAL = U.PAL;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let BC = U.bindCanvas(cv), view = null, cur = "exec", pulse = 0, raf = 0;

  const WINS = {
    exec:      { no: "§0", title: "执行摘要", big: "25/30", bigSub: "开源组合栈 · 等权总分第一", stat: ["21 InsForge", "19 Supabase 托管", "19 Supabase 自托管", "14 Nubase"] },
    cards:     { no: "§1", title: "五大方案逐卡", big: "12,757", bigSub: "InsForge stars（GitHub API 2026-08-14）", stat: ["620 Nubase stars（0 issues 异常）", "$25 Supabase Pro/组织", "€22 组合栈 4C8G VPS", "v0.1.4 Nubase 最新版"] },
    matrix:    { no: "§2", title: "六维评分矩阵", big: ">35%", bigSub: "维度④+⑤ 权重临界：组合栈断层胜出", stat: [">30% 维度①临界：托管版反超", "5 组合栈 PG 原生度", "1 Nubase 周边生态", "★ 每格判词可回溯"] },
    tier:      { no: "§3", title: "规模分层", big: "€22/月", bigSub: "4C8G VPS 承载 1–10 万 DAU（平曲线）", stat: ["$260 托管推演账单 @10万 DAU [derived]", "T1 Supabase Free 起步", "T2 三轴选边", "T3 收回自管 + Citus"] },
    app:       { no: "§4", title: "应用类型", big: "0.25.2", bigSub: "pg_search：BM25+向量混合（AGPL 注意）", stat: ["建表即 API PostgREST", "2.29.1 TimescaleDB", "DuckDB 嵌入 OLAP", "pgai 自动 embedding"] },
    evolution: { no: "§5", title: "SQLite × PG 演进", big: "7/7", bigSub: "memweave pytest 全通过（参考实现）", stat: ["100–200 行 Python 记忆逻辑", "0.95^d 时间衰减", "MMR λ=0.7", "API 形状全程不变"] },
    risk:      { no: "§6", title: "风险与验证", big: "4 高危", bigSub: "R1 密钥回退 · R3/R5 Nubase · R9 AGPL", stat: ["12 条已登记风险", "6 项采用前验证", "#1552 加固仍 open", "AGPL 商用须法务确认"] },
    sources:   { no: "K", title: "来源附录", big: "K1–K41", bigSub: "41 条锚点，逐条带日期", stat: ["厂商一手 > 行业官方", "> 第三方交叉 > 研究整理", "厂商自测已标注", "传闻按无证据处理"] },
  };
  const ORDER = ["exec", "cards", "matrix", "tier", "app", "evolution", "risk", "sources"];

  function draw() {
    if (!view || view.w < 10) view = BC.fit();
    const ctx = BC.ctx, { w: W, h: H } = view;
    ctx.clearRect(0, 0, W, H);
    const w = WINS[cur];
    const X = 44, CW = W - X - 40;
    let y = 54;
    // 窗口徽标 + 标题
    ctx.fillStyle = PAL.red;
    ctx.font = "700 11px Menlo, Consolas, monospace";
    ctx.fillText("■ " + w.no, X, y);
    ctx.fillStyle = PAL.ink;
    ctx.font = "700 20px 'et-book', Palatino, Georgia, serif";
    ctx.fillText(w.title, X, y + 26);
    y += 52;
    // 阶段条（8 段，当前蓝，可脉冲）
    const segW = (CW - 7 * 6) / 8;
    ORDER.forEach((o, i) => {
      const on = o === cur;
      ctx.fillStyle = on ? PAL.red : PAL.line;
      const ph = on && !REDUCE ? 0.75 + 0.25 * Math.sin(pulse * 3) : 1;
      ctx.globalAlpha = ph;
      ctx.fillRect(X + i * (segW + 6), y, segW, on ? 6 : 3);
      ctx.globalAlpha = 1;
    });
    y += 30;
    // 大读数
    ctx.font = "700 46px 'et-book', Palatino, Georgia, serif";
    ctx.fillStyle = PAL.red;
    ctx.fillText(w.big, X, y + 44);
    ctx.font = "12.5px 'et-book', Palatino, Georgia, serif";
    ctx.fillStyle = PAL.inkMd;
    wrapText(ctx, w.bigSub, X, y + 68, CW, 17);
    y += 108;
    // 分隔
    ctx.strokeStyle = PAL.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + CW, y); ctx.stroke();
    y += 22;
    // 四状态行
    ctx.font = "11px Menlo, Consolas, monospace";
    w.stat.forEach(s => {
      ctx.fillStyle = PAL.inkLo; ctx.fillText("·", X, y + 4);
      ctx.fillStyle = PAL.inkMd;
      ctx.fillText(s.length > 30 ? s.slice(0, 29) + "…" : s, X + 14, y + 4);
      y += 24;
    });
    y += 18;
    // 五方案总分迷你条（持久锚点）
    ctx.font = "700 9.5px Menlo, Consolas, monospace";
    ctx.fillStyle = PAL.inkLo;
    ctx.fillText("等权总分 /30（§2 矩阵）", X, y); y += 12;
    window.RPT.matrix.slice().sort((a, b) => b.total - a.total).forEach(p => {
      const bw = (p.total / 30) * CW;
      ctx.fillStyle = p.neg ? PAL.neg : (p.top ? PAL.red : PAL.ink);
      ctx.globalAlpha = p.neg || p.top ? 0.95 : 0.55;
      ctx.fillRect(X, y, bw, 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = PAL.inkMd;
      ctx.font = "10px Menlo, Consolas, monospace";
      ctx.fillText(`${p.short} ${p.total}`, X + 4, y + 10);
      y += 19;
    });
    // 底部提示
    ctx.font = "9.5px Menlo, Consolas, monospace";
    ctx.fillStyle = PAL.inkLo;
    ctx.fillText("点击图表任意数字 → 回溯 K 来源锚点", X, H - 26);
  }
  function wrapText(ctx, s, x, y, maxW, lh) {
    let line = "", yy = y;
    for (const ch of s) {
      if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
      else line += ch;
    }
    ctx.fillText(line, x, yy);
  }
  function loop() { pulse += 0.016; draw(); raf = requestAnimationFrame(loop); }
  function set(win) {
    if (!WINS[win] || win === cur) return;
    cur = win;
    if (REDUCE) draw();
  }
  function show(on) {
    rail.classList.toggle("on", on);
    cancelAnimationFrame(raf);
    if (on) { view = BC.fit(); if (REDUCE) draw(); else loop(); }
  }
  cv.addEventListener("click", e => {
    const w = WINS[cur];
    U.showDrill({ title: `${w.no} · ${w.title}`, value: w.big, sub: w.bigSub + "。", source: "研究整理 · 报告（2026-08-16）", x: e.clientX, y: e.clientY });
  });
  addEventListener("resize", () => { if (rail.classList.contains("on")) { view = BC.fit(); draw(); } });
  return { set, show };
})();
