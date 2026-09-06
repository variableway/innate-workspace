// §1 方案卡 · 关键数字小倍数面板（P9：stars / 月价 / 版本 三个基准，同一对象多基准）
(() => {
  const host = document.getElementById("cards-chart");
  if (!host) return;
  const body = U.frame(host, {
    title: "关键数字三面观：生态热度、入场价格与版本成熟度并不同步",
    sub: "三块面板同一标尺逻辑 · stars 为对数刻度 · 价格为单位月价 · 点击任意数字回溯来源",
    src: "厂商一手 & 第三方交叉 — GitHub API（2026-08-14）、官方定价页（2026-08 核验）",
  });
  const KN = window.RPT.keyNumbers;
  const W = 860, H = 300, PW = W / 3;
  const svg = d3svg(body, W, H);
  const ns = "http://www.w3.org/2000/svg";
  const txt = (x, y, s, o = {}) => {
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", x); t.setAttribute("y", y);
    t.setAttribute("font-size", o.size || 10);
    t.setAttribute("fill", o.fill || "#8595a6");
    if (o.anchor) t.setAttribute("text-anchor", o.anchor);
    if (o.bold) t.setAttribute("font-weight", "700");
    if (o.serif) t.setAttribute("font-family", "'et-book', Palatino, Georgia, serif");
    if (o.css) t.setAttribute("style", o.css);
    t.textContent = s;
    svg.appendChild(t); return t;
  };

  const drill = (title, value, sub, k) => e => {
    e.stopPropagation();
    U.showDrill({ title, value, sub, source: window.srcLine(k), x: e.clientX, y: e.clientY });
  };

  // 面板 1 · stars（对数刻度）
  {
    const x0 = 0, maxLog = Math.log10(100000);
    txt(x0 + 8, 24, "GitHub STARS（对数刻度）", { bold: true, fill: "#42566a", size: 10.5 });
    KN.stars.forEach((d, i) => {
      const y = 58 + i * 64, bw = (Math.log10(d.v) / maxLog) * (PW - 120);
      const col = d.neg ? "#c22f4e" : (i === 0 ? "#2251ff" : "#051c2c");
      const r = document.createElementNS(ns, "rect");
      r.setAttribute("x", x0 + 8); r.setAttribute("y", y); r.setAttribute("height", 20);
      r.setAttribute("width", 0); r.setAttribute("fill", col); r.setAttribute("class", "drillable");
      r.setAttribute("data-drill-keep", "");
      svg.appendChild(r);
      animateWidth(r, bw, 300 + i * 160);
      txt(x0 + 8, y - 7, d.name, { serif: true, bold: true, fill: "#051c2c", size: 12.5 });
      const v = txt(x0 + 16 + bw, y + 15, d.label, { bold: true, fill: col, size: 13 });
      v.setAttribute("class", "drillable"); v.setAttribute("data-drill-keep", "");
      const fn = drill(`${d.name} · GitHub stars`, d.label, d.note, d.k);
      r.addEventListener("click", fn); v.addEventListener("click", fn);
    });
  }
  // 面板 2 · 月价
  {
    const x0 = PW;
    txt(x0 + 8, 24, "单位月价（名义入场价）", { bold: true, fill: "#42566a", size: 10.5 });
    KN.price.forEach((d, i) => {
      const y = 58 + i * 64, bw = (d.v / 25) * (PW - 130);
      const col = d.name === "组合栈" ? "#2251ff" : "#051c2c";
      const r = document.createElementNS(ns, "rect");
      r.setAttribute("x", x0 + 8); r.setAttribute("y", y); r.setAttribute("height", 20);
      r.setAttribute("width", 0); r.setAttribute("fill", col); r.setAttribute("class", "drillable");
      r.setAttribute("data-drill-keep", "");
      svg.appendChild(r); animateWidth(r, bw, 500 + i * 160);
      txt(x0 + 8, y - 7, `${d.name} · ${d.unit}`, { serif: true, bold: true, fill: "#051c2c", size: 12.5 });
      const v = txt(x0 + 16 + bw, y + 15, d.label, { bold: true, fill: col, size: 13 });
      v.setAttribute("class", "drillable"); v.setAttribute("data-drill-keep", "");
      const fn = drill(`${d.name} · 月价`, `${d.label}${d.unit}`, d.note, d.k);
      r.addEventListener("click", fn); v.addEventListener("click", fn);
    });
    txt(x0 + 8, 268, "注：Supabase $25 只是入场价，另有 20+ 计量项；组合栈 €22 成本曲线是平的", { size: 9.5 });
  }
  // 面板 3 · 版本成熟度
  {
    const x0 = PW * 2;
    txt(x0 + 8, 24, "最新版本（2026-08-16 核查）", { bold: true, fill: "#42566a", size: 10.5 });
    KN.version.forEach((d, i) => {
      const y = 64 + i * 52;
      const col = d.neg ? "#c22f4e" : "#051c2c";
      txt(x0 + 8, y, d.name, { serif: true, bold: true, fill: "#051c2c", size: 12.5 });
      const v = txt(x0 + 8, y + 19, d.v, { bold: true, fill: col, size: 14 });
      v.setAttribute("class", "drillable"); v.setAttribute("data-drill-keep", "");
      v.addEventListener("click", drill(`${d.name} · 版本`, d.v, d.note, d.k));
    });
  }
  // 分隔线
  [1, 2].forEach(i => {
    const l = document.createElementNS(ns, "line");
    l.setAttribute("x1", PW * i); l.setAttribute("x2", PW * i);
    l.setAttribute("y1", 14); l.setAttribute("y2", H - 24);
    l.setAttribute("stroke", "#eef1f6"); svg.appendChild(l);
  });

  function d3svg(host, w, h) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", `0 0 ${w} ${h}`);
    s.style.width = "100%"; s.style.height = "auto";
    host.appendChild(s); return s;
  }
  function animateWidth(r, to, delay) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { r.setAttribute("width", to); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const step = ts => {
        const p = U.clamp((ts - t0 - delay) / 700, 0, 1);
        r.setAttribute("width", to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.2 });
    io.observe(r);
  }
})();
