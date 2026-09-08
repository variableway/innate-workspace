// §5 SQLite × PG 演进 · 三阶段轨道图（x=规模对数轴；y=记忆逻辑位置：端侧↔中枢；阶段带 + 迁移触发旗标）
(() => {
  const host = document.getElementById("evo-chart");
  if (!host) return;
  const body = U.frame(host, {
    title: "记忆逻辑逐层下沉：Python → 汇聚 → PL/pgSQL，API 形状全程不变",
    sub: "横轴 = 规模（记忆条目，对数刻度）· 纵轴 = 记忆逻辑位置（上=端侧 SQLite，下=中枢 PG）· 旗标 = 迁移触发信号 · 点击节点 drill",
    src: "研究整理 — 报告 §6.3/§6.4（2026-08-16）；memweave 参考实现 K34",
  });
  const NS = "http://www.w3.org/2000/svg";
  const W = 880, H = 430, mL = 96, mR = 30, mT = 46, mB = 58;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.width = "100%"; svg.style.height = "auto";
  body.appendChild(svg);
  const el = (t, a, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const text = (x, y, s, o = {}, p = svg) => {
    const t = el("text", { x, y, "font-size": o.size || 10, fill: o.fill || "#8595a6", "paint-order": "stroke", stroke: "#fff", "stroke-width": 3.5 }, p);
    if (o.anchor) t.setAttribute("text-anchor", o.anchor);
    if (o.bold) t.setAttribute("font-weight", "700");
    if (o.serif) t.setAttribute("font-family", "'et-book', Palatino, Georgia, serif");
    t.textContent = s; return t;
  };
  const drill = (title, value, sub, src) => e => {
    e.stopPropagation();
    U.showDrill({ title, value, sub, source: src, x: e.clientX, y: e.clientY });
  };

  // 规模轴：1千 → 1亿 条（log）
  const x0 = 3, x1 = 8; // log10
  const x = lg => mL + (lg - x0) / (x1 - x0) * (W - mL - mR);
  const railEdge = mT + 30, railHub = H - mB - 30; // 端侧轨道 / 中枢轨道
  const y = pos => railEdge + pos * (railHub - railEdge);

  // 阶段带：S1 1千–1万，S2 1万–1百万，S3 1百万+
  const stages = [
    { a: 3, b: 5, d: window.RPT.evolution[0], tint: "rgba(5,28,44,.025)" },
    { a: 5, b: 6, d: window.RPT.evolution[1], tint: "rgba(34,81,255,.05)" },
    { a: 6, b: 8, d: window.RPT.evolution[2], tint: "rgba(34,81,255,.09)" },
  ];
  stages.forEach(s => {
    el("rect", { x: x(s.a), y: mT, width: x(s.b) - x(s.a), height: H - mT - mB, fill: s.tint });
    text((x(s.a) + x(s.b)) / 2, mT + 16, s.d.name, { anchor: "middle", size: 11, serif: true, bold: true, fill: "#051c2c" });
  });
  // 规模刻度
  [3, 4, 5, 6, 7, 8].forEach(lg => {
    el("line", { x1: x(lg), x2: x(lg), y1: H - mB, y2: H - mB + 5, stroke: "#8595a6", "stroke-width": 1 });
    text(x(lg), H - mB + 18, "10" + "⁰¹²³⁴⁵⁶⁷⁸"[lg] + " 条", { anchor: "middle", size: 9 });
  });
  text(mL, H - 12, "记忆条目规模（对数）· 阶段边界为触发信号而非硬阈值", { size: 9.5, fill: "#42566a", bold: true });
  // 双轨
  text(mL - 10, railEdge + 4, "端侧 SQLite", { anchor: "end", size: 10.5, bold: true, fill: "#42566a" });
  text(mL - 10, railHub + 4, "中枢 PG", { anchor: "end", size: 10.5, bold: true, fill: "#2251ff" });
  el("line", { x1: mL, x2: W - mR, y1: railEdge, y2: railEdge, stroke: "#dbe2ea", "stroke-width": 2 });
  el("line", { x1: mL, x2: W - mR, y1: railHub, y2: railHub, stroke: "#7d9bff", "stroke-width": 2 });

  // 记忆逻辑位置阶梯线：S1=端侧(0) → S2=过渡(0.5) → S3=中枢(1)
  const pts = [[x(3), y(0.02)], [x(5), y(0.02)], [x(5.35), y(0.5)], [x(6), y(0.5)], [x(6.35), y(0.98)], [x(8), y(0.98)]];
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const path = el("path", { d, fill: "none", stroke: "#2251ff", "stroke-width": 2.6, "stroke-linecap": "round" });
  // 端侧缓存余留虚线（阶段三 SQLite 退居缓存）
  el("path", { d: `M ${x(6.35)} ${y(0.06)} L ${x(8)} ${y(0.06)}`, fill: "none", stroke: "#42566a", "stroke-width": 1.4, "stroke-dasharray": "5 4" });
  text(x(7.2), y(0.06) - 10, "SQLite 退居端侧缓存与离线缓冲（健康的架构退位）", { anchor: "middle", size: 9.5, fill: "#42566a" });

  // 阶段节点（可 drill）
  const nodes = [
    { x: x(4), y: y(0.02), s: window.RPT.evolution[0] },
    { x: x(5.5), y: y(0.5), s: window.RPT.evolution[1] },
    { x: x(7), y: y(0.98), s: window.RPT.evolution[2] },
  ];
  nodes.forEach((n, i) => {
    const g = el("g", { class: "drillable", "data-drill-keep": "" });
    el("circle", { cx: n.x, cy: n.y, r: 8, fill: "#fff", stroke: "#2251ff", "stroke-width": 2.4 }, g);
    el("circle", { cx: n.x, cy: n.y, r: 3, fill: "#2251ff" }, g);
    const lab = text(n.x, n.y + (i === 1 ? -18 : i === 0 ? 26 : -18), n.s.logic, { anchor: "middle", size: 9.5, fill: "#051c2c", bold: true }, g);
    g.addEventListener("click", drill(n.s.name, n.s.scale, `栈形态：${n.s.stack}。记忆逻辑：${n.s.logic}。迁移成本：${n.s.cost}。`, window.srcLine(n.s.k)));
  });
  // 迁移触发旗标
  const flags = [
    { x: x(5.18), s: window.RPT.evolution[1] },
    { x: x(6.18), s: window.RPT.evolution[2] },
  ];
  flags.forEach(f => {
    const g = el("g", { class: "drillable", "data-drill-keep": "" });
    el("line", { x1: f.x, y1: mT + 6, x2: f.x, y2: H - mB, stroke: "#c22f4e", "stroke-width": 1.2, "stroke-dasharray": "4 4" }, g);
    el("path", { d: `M ${f.x} ${mT + 30} L ${f.x + 34} ${mT + 38} L ${f.x} ${mT + 46} Z`, fill: "#c22f4e" }, g);
    const ft = text(f.x + 6, mT + 62, "触发信号", { size: 9, fill: "#c22f4e", bold: true }, g);
    g.addEventListener("click", drill("迁移触发信号 → " + f.s.name, f.s.scale, f.s.trigger, window.srcLine(f.s.k)));
  });

  // 生长动画
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!REDUCE) {
    path.style.clipPath = "inset(0 100% 0 0)";
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const step = ts => {
        const p = U.clamp((ts - t0) / 1200, 0, 1);
        path.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.2 });
    io.observe(svg);
  }
})();
