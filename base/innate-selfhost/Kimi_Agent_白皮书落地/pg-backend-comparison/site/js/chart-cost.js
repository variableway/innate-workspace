// §3 规模分层 · 成本曲线（对数 DAU × 月度成本）+ 三层速查表
(() => {
  const host = document.getElementById("cost-chart");
  if (host) {
    const body = U.frame(host, {
      title: "同一负载三条成本曲线：计量计费随规模线性恶化，€22 组合栈是平的",
      sub: "横轴 = 日活（对数刻度）· 纵轴 = 月度成本（$）· 虚线 = 推演模型 [derived] · 点击节点查看账单构成",
      src: "推演模型 [derived] — 基于 K2/K7/K24 定价事实（2026-08 核验）；非厂商报价",
    });
    const CC = window.RPT.costCurves;
    const NS = "http://www.w3.org/2000/svg";
    const W = 880, H = 420, mL = 64, mR = 26, mT = 30, mB = 46;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.width = "100%"; svg.style.height = "auto";
    body.appendChild(svg);
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    const text = (x, y, s, o = {}) => {
      const t = el("text", { x, y, "font-size": o.size || 10, fill: o.fill || "#8595a6", "paint-order": "stroke", stroke: "#fff", "stroke-width": 3.5 });
      if (o.anchor) t.setAttribute("text-anchor", o.anchor);
      if (o.bold) t.setAttribute("font-weight", "700");
      t.textContent = s; return t;
    };
    const xs = CC.points;
    const x = v => mL + (Math.log10(v) - Math.log10(xs[0])) / (Math.log10(xs[xs.length - 1]) - Math.log10(xs[0])) * (W - mL - mR);
    const yMax = 2200, y = v => H - mB - (v / yMax) * (H - mT - mB);
    // 网格
    [0, 500, 1000, 1500, 2000].forEach(v => {
      el("line", { x1: mL, x2: W - mR, y1: y(v), y2: y(v), stroke: "#eef1f6", "stroke-width": 1 });
      text(mL - 8, y(v) + 3, "$" + v, { anchor: "end", size: 9 });
    });
    xs.forEach(v => text(x(v), H - mB + 16, v >= 1000 ? (v / 1000) + "k" : v, { anchor: "middle", size: 9 }));
    text(mL, H - 12, CC.xLabel, { size: 9.5, fill: "#42566a", bold: true });
    // 层带（Tier 背景）
    const tierX = [[xs[0], 10000, "TIER 1"], [10000, 100000, "TIER 2"], [100000, xs[xs.length - 1], "TIER 3"]];
    tierX.forEach(([a, b, lab], i) => {
      el("rect", { x: x(a), y: mT, width: x(b) - x(a), height: H - mT - mB, fill: i === 1 ? "rgba(34,81,255,.045)" : "rgba(5,28,44,.02)" });
      text((x(a) + x(b)) / 2, mT + 14, lab, { anchor: "middle", size: 9.5, bold: true, fill: i === 1 ? "#2251ff" : "#8595a6" });
    });
    const colors = { ink: "#051c2c", blueSoft: "#7d9bff", red: "#2251ff" };
    const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
    CC.series.forEach((s, si) => {
      const col = colors[s.color];
      const pts = s.vals.map((v, i) => [x(xs[i]), y(v)]);
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const path = el("path", { d, fill: "none", stroke: col, "stroke-width": s.id === "combo" ? 2.6 : 1.8, "stroke-dasharray": s.derived ? "6 4" : "none", "stroke-linecap": "round" });
      // 生长动画
      if (!REDUCE) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = s.derived ? "6 4" : "none";
        path.style.transition = "none";
        const io = new IntersectionObserver(es => es.forEach(e => {
          if (!e.isIntersecting) return; io.disconnect();
          const t0 = performance.now();
          const step = ts => {
            const p = U.clamp((ts - t0) / (900 + si * 250), 0, 1);
            path.setAttribute("stroke-dashoffset", 0);
            path.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }), { threshold: 0.2 });
        io.observe(svg);
      }
      // 节点 + drill
      pts.forEach((p, i) => {
        if (i % 2 === 1 && s.id !== "combo") return; // 减密
        const c = el("circle", { cx: p[0], cy: p[1], r: 4.5, fill: "#fff", stroke: col, "stroke-width": 2, class: "drillable", "data-drill-keep": "" });
        c.addEventListener("click", e => {
          e.stopPropagation();
          U.showDrill({
            title: `${s.name} @ ${xs[i] >= 1000 ? xs[i] / 1000 + "k" : xs[i]} DAU`,
            value: `$${s.vals[i]}/月${s.derived ? " [derived]" : ""}`,
            sub: s.note,
            source: "推演模型 · 基于 " + (s.id === "supa" ? window.srcLine(["K2", "K39"]) : s.id === "insforge" ? window.srcLine("K7") : window.srcLine("K24")),
            x: e.clientX, y: e.clientY,
          });
        });
      });
      // 末端标签（交错防重叠：InsForge 在上、组合栈在下）
      const lp = pts[pts.length - 1];
      const dy = s.id === "insforge" ? -10 : s.id === "combo" ? 18 : -8;
      text(lp[0] - 6, lp[1] + dy, s.name, { anchor: "end", size: 10, bold: true, fill: col });
    });
    text(mL + 4, mT - 8, "读法：10 万 DAU 处，托管推演账单 ≈ $260/月，组合栈仍 ≈ $24/月——「用得越多单价项越多」vs「容量上限即硬件上限」", { size: 9.5, fill: "#42566a" });
  }

  // 三层速查表（§4.4）
  const tt = document.getElementById("tier-table");
  if (tt) {
    const body = U.frame(tt, {
      title: "三层速查表：推荐 / 次选 / 明确不要选",
      sub: "每层一句话结论 · 点击行查看升级触发条件与来源",
      src: "研究整理 — 报告 §4.1–§4.4（2026-08-16）",
    });
    const wrap = document.createElement("div");
    wrap.className = "tbl-wrap";
    const tbl = document.createElement("table");
    tbl.className = "dt";
    tbl.innerHTML = `<thead><tr><th>层</th><th>推荐</th><th>次选</th><th>明确不要选</th></tr></thead>`;
    const tb = tbl.createTBody();
    window.RPT.tiers.forEach((t, i) => {
      const tr = tb.insertRow();
      tr.className = "risk-row" + (i === 1 ? " hl" : "");
      tr.setAttribute("data-drill-keep", "");
      tr.innerHTML = `<td><b>${t.name}</b><br><span style="font-family:var(--mono);font-size:10px;color:var(--ink-lo)">${t.dau}</span></td>
        <td>${t.rec}</td><td>${t.alt}</td><td style="color:var(--neg)">${t.avoid}</td>`;
      tr.addEventListener("click", e => {
        U.showDrill({
          title: t.name, value: t.dau,
          sub: `推荐：${t.rec}。不要选：${t.avoid}。`,
          source: window.srcLine(t.k), x: e.clientX, y: e.clientY,
        });
      });
    });
    wrap.appendChild(tbl); body.appendChild(wrap);
  }
})();
