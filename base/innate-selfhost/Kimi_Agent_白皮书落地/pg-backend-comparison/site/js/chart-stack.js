// §4 应用类型 · 金融三层 2.5D 价值栈（P8）+ 四类应用汇总表
(() => {
  const host = document.getElementById("stack-chart");
  if (host) {
    const body = U.frame(host, {
      title: "金融交易数据的正确形态：PG 系三层组合，专用引擎只在触发条件命中时进入",
      sub: "2.5D 价值栈 · 顶层=研究副本，中层=派生视图，底层=不可变记录 · 点击层块查看许可证与版本事实",
      src: "厂商一手 — TimescaleDB releases/legal（2026-08-04/16）、DuckDB 文档（2026-08-16）",
    });
    const NS = "http://www.w3.org/2000/svg";
    const W = 880, H = 400;
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
      if (o.italic) t.setAttribute("font-style", "italic");
      t.textContent = s; return t;
    };
    const cx = 300, skew = 42, slabW = 380, slabH = 62, gap = 40;
    const stack = window.RPT.finStack; // LAYER 03 顶 → 01 底
    const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
    stack.forEach((L, i) => {
      const y = 70 + i * (slabH + gap);
      const g = el("g", { class: "drillable slab", "data-drill-keep": "" });
      if (!REDUCE) { g.style.opacity = 0; g.style.transform = "translateY(-16px)"; g.style.transition = `opacity .5s ease ${i * 140}ms, transform .5s cubic-bezier(.25,.7,.3,1) ${i * 140}ms`; }
      const main = L.thesis ? "#2251ff" : "#051c2c";
      // 顶面（斜平行四边形）
      el("path", { d: `M ${cx - slabW / 2} ${y} L ${cx + slabW / 2} ${y} L ${cx + slabW / 2 + skew} ${y - 22} L ${cx - slabW / 2 + skew} ${y - 22} Z`, fill: L.thesis ? "rgba(34,81,255,.16)" : "rgba(5,28,44,.08)", stroke: main, "stroke-width": L.thesis ? 1.6 : 1 }, g);
      // 正面
      el("rect", { x: cx - slabW / 2, y, width: slabW, height: slabH, fill: L.thesis ? "rgba(34,81,255,.07)" : "#fff", stroke: main, "stroke-width": L.thesis ? 1.6 : 1.2 }, g);
      // 右侧面
      el("path", { d: `M ${cx + slabW / 2} ${y} L ${cx + slabW / 2 + skew} ${y - 22} L ${cx + slabW / 2 + skew} ${y + slabH - 22} L ${cx + slabW / 2} ${y + slabH} Z`, fill: L.thesis ? "rgba(34,81,255,.10)" : "rgba(5,28,44,.05)", stroke: main, "stroke-width": 1 }, g);
      text(cx - slabW / 2 + 14, y + 22, L.layer, { size: 9, bold: true, fill: L.thesis ? "#2251ff" : "#8595a6" }, g);
      const tn = text(cx - slabW / 2 + 14, y + 42, `${L.name} · ${L.tech}`, { size: 13.5, serif: true, bold: true, fill: "#051c2c" }, g);
      // 右列：控制度 + 一句注
      const rx = cx + slabW / 2 + skew + 26;
      text(rx, y + 10, "自管可控度 " + "●".repeat(L.control) + "○".repeat(3 - L.control), { size: 10, fill: "#2251ff", bold: true }, g);
      text(rx, y + 28, L.note.length > 24 ? L.note.slice(0, 24) + " …" : L.note, { size: 10.5, serif: true, italic: true, fill: "#42566a" }, g);
      g.addEventListener("click", e => {
        e.stopPropagation();
        U.showDrill({ title: `${L.layer} · ${L.name}`, value: L.tech, sub: L.note + "。", source: window.srcLine(L.k), x: e.clientX, y: e.clientY });
      });
    });
    // 触发条件注脚
    text(70, H - 40, "↑ 未触发前不引入：kdb+（TB 级 tick 毫秒回放）/ ClickHouse（>10 万行/秒全市场行情）——为不存在的问题付利息", { size: 10, fill: "#42566a" });
    text(70, H - 22, "证据链：不可变记录（WAL 审计）→ 派生视图（连续聚合 · TSL）→ 研究副本（只读快照）", { size: 10, fill: "#8595a6" });
    if (!REDUCE) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; io.disconnect();
        svg.querySelectorAll(".slab").forEach(s => { s.style.opacity = 1; s.style.transform = "none"; });
      }), { threshold: 0.2 });
      io.observe(svg);
    }
  }

  // 四类应用汇总表（§5.5）
  const at = document.getElementById("app-table");
  if (at) {
    const body = U.frame(at, {
      title: "四类应用 × 最小栈 / 升级栈 / 明确不要选",
      sub: "共同主线：默认从「PG + 扩展」出发，只在量化触发条件命中时引入专用引擎 · 点击行回溯来源",
      src: "研究整理 — 报告 §5.1–§5.5（2026-08-16）",
    });
    const wrap = document.createElement("div");
    wrap.className = "tbl-wrap";
    const tbl = document.createElement("table");
    tbl.className = "dt";
    tbl.innerHTML = `<thead><tr><th>应用类型</th><th>最小可行栈</th><th>升级栈（触发条件）</th><th>明确不要选</th></tr></thead>`;
    const tb = tbl.createTBody();
    window.RPT.apps.forEach(a => {
      const tr = tb.insertRow();
      tr.className = "risk-row";
      tr.setAttribute("data-drill-keep", "");
      tr.innerHTML = `<td><b>${a.name}</b><br><span style="font-family:var(--mono);font-size:9.5px;color:var(--ink-lo)">${a.en}</span></td>
        <td>${a.min}</td><td>${a.upgrade}</td><td style="color:var(--neg)">${a.avoid}</td>`;
      tr.addEventListener("click", e => {
        U.showDrill({
          title: `${a.name} · 选型路径`, value: a.en,
          sub: `最小栈：${a.min}。升级：${a.upgrade}。`,
          source: window.srcLine(a.k), x: e.clientX, y: e.clientY,
        });
      });
    });
    wrap.appendChild(tbl); body.appendChild(wrap);
  }
})();
