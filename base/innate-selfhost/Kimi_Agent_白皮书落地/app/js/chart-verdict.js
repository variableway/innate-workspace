// §2 权重敏感性 · 裁决天平（P18：省心托管 vs 零锁定自管；倾斜方向=证据权重；虚线砝码=权重翻转触发条件；底部=共享证伪条）
(() => {
  const host = document.getElementById("verdict-chart");
  if (!host) return;
  const body = U.frame(host, {
    title: "裁决天平：默认等权偏向自管派，但砝码位置由你的权重决定",
    sub: "盘内砝码 = 已成立证据 · 悬空虚线砝码 = 权重翻转触发条件 · 底部红纹条 = 共享证伪条件 · 点击砝码 drill",
    src: "研究整理 — 报告 §3.3 敏感性检验（2026-08-16）；倾斜为定性表达，不是得分",
  });
  const NS = "http://www.w3.org/2000/svg";
  const W = 880, H = 470;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.width = "100%"; svg.style.height = "auto";
  body.appendChild(svg);
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  };
  const text = (x, y, s, o = {}, parent = svg) => {
    const t = el("text", { x, y, "font-size": o.size || 10, fill: o.fill || "#8595a6", "paint-order": "stroke", stroke: "#fff", "stroke-width": 3.5 }, parent);
    if (o.anchor) t.setAttribute("text-anchor", o.anchor);
    if (o.bold) t.setAttribute("font-weight", "700");
    if (o.serif) t.setAttribute("font-family", "'et-book', Palatino, Georgia, serif");
    if (o.italic) t.setAttribute("font-style", "italic");
    t.textContent = s; return t;
  };
  const drill = (title, value, sub, src) => e => {
    e.stopPropagation();
    U.showDrill({ title, value, sub, source: src, x: e.clientX, y: e.clientY });
  };

  const CX = 440, TOP = 96, BEAM = 300, TILT = 4.5; // 度，右盘（自管）下沉
  const rad = TILT * Math.PI / 180;

  // 立柱 + 基座
  el("rect", { x: CX - 7, y: TOP + 10, width: 14, height: 240, fill: "#051c2c" });
  el("rect", { x: CX - 90, y: TOP + 250, width: 180, height: 10, fill: "#051c2c" });
  // 支点表盘：三区刻度 + 指针停在当前裁决区
  el("circle", { cx: CX, cy: TOP + 66, r: 30, fill: "#fff", stroke: "#051c2c", "stroke-width": 1.5 });
  for (let i = -2; i <= 2; i++) {
    const a = -Math.PI / 2 + i * 0.42;
    el("line", { x1: CX + Math.cos(a) * 22, y1: TOP + 66 + Math.sin(a) * 22, x2: CX + Math.cos(a) * 28, y2: TOP + 66 + Math.sin(a) * 28, stroke: i > 0 ? "#2251ff" : "#8595a6", "stroke-width": 1.4 });
  }
  const na = -Math.PI / 2 + 0.42; // 指针停在右区（自管侧）但不越界
  el("line", { x1: CX, y1: TOP + 66, x2: CX + Math.cos(na) * 24, y2: TOP + 66 + Math.sin(na) * 24, stroke: "#2251ff", "stroke-width": 2.4, "stroke-linecap": "round" });
  text(CX, TOP + 118, "等权假设下：组合栈 25 > InsForge 21 > Supabase 19 = 19 > Nubase 14", { anchor: "middle", size: 10.5, fill: "#42566a" });

  // 横梁（倾斜）
  const beamG = el("g", { transform: `rotate(${TILT} ${CX} ${TOP})` });
  el("rect", { x: CX - BEAM, y: TOP - 4, width: BEAM * 2, height: 8, fill: "#051c2c" }, beamG);
  el("circle", { cx: CX, cy: TOP, r: 9, fill: "#2251ff" }, beamG);

  // 盘组：整体按梁端高度平移（不随梁旋转）
  const endY = side => TOP + Math.tan(rad) * BEAM * side;
  function pan(side, label, weights, hoverW) {
    const px = CX + BEAM * side, py = endY(side);
    const g = el("g", { class: "pan-g" });
    // 链条
    el("line", { x1: px, y1: py, x2: px - 52, y2: py + 86, stroke: "#42566a", "stroke-width": 1.4 }, g);
    el("line", { x1: px, y1: py, x2: px + 52, y2: py + 86, stroke: "#42566a", "stroke-width": 1.4 }, g);
    el("line", { x1: px, y1: py, x2: px, y2: py + 86, stroke: "#42566a", "stroke-width": 1.4 }, g);
    // 盘
    el("path", { d: `M ${px - 62} ${py + 86} L ${px + 62} ${py + 86} L ${px + 46} ${py + 104} L ${px - 46} ${py + 104} Z`, fill: "#fff", stroke: "#051c2c", "stroke-width": 1.6 }, g);
    // 砝码堆（梯形实体，自盘向上）
    weights.forEach((wt, i) => {
      const wy = py + 86 - (i + 1) * 30;
      const wg = el("g", { class: "drillable w-item", "data-drill-keep": "", opacity: 0 }, g);
      el("path", { d: `M ${px - 44} ${wy + 30} L ${px + 44} ${wy + 30} L ${px + 34} ${wy} L ${px - 34} ${wy} Z`, fill: side > 0 ? "#2251ff" : "#051c2c" }, wg);
      el("circle", { cx: px, cy: wy - 5, r: 4, fill: side > 0 ? "#1233b8" : "#42566a" }, wg);
      const tw = text(px, wy + 19, wt.t, { anchor: "middle", size: 9.5, fill: "#fff", bold: true }, wg);
      tw.setAttribute("stroke", "none");
      wg.addEventListener("click", drill(wt.t, side > 0 ? "自管派证据" : "托管派证据", wt.sub, wt.src));
    });
    // 悬空虚线砝码（未满足时读数不升级）
    hoverW.forEach((wt, i) => {
      const hx = px + side * (88 + i * 8), hy = py - 30 - i * 44;
      const hg = el("g", { class: "drillable", "data-drill-keep": "", opacity: 0 }, g);
      el("path", { d: `M ${hx - 46} ${hy + 26} L ${hx + 46} ${hy + 26} L ${hx + 37} ${hy} L ${hx - 37} ${hy} Z`, fill: "rgba(255,255,255,.85)", stroke: side > 0 ? "#2251ff" : "#051c2c", "stroke-width": 1.4, "stroke-dasharray": "5 4" }, hg);
      const th = text(hx, hy + 16, wt.t, { anchor: "middle", size: 9, fill: side > 0 ? "#2251ff" : "#051c2c", bold: true }, hg);
      th.setAttribute("stroke", "#fff"); th.setAttribute("stroke-width", 3); th.setAttribute("paint-order", "stroke");
      el("line", { x1: hx - side * 46, y1: hy + 13, x2: px + side * 40, y2: py + 40, stroke: "#8595a6", "stroke-width": 1, "stroke-dasharray": "3 4" }, hg);
      hg.addEventListener("click", drill(wt.t, "触发条件（未满足）", wt.sub, wt.src));
    });
    text(px, py + 126, label, { anchor: "middle", size: 13, serif: true, bold: true, fill: "#051c2c" }, g);
    return g;
  }
  const srcEq = "研究整理 · 报告 §3.2/§3.3（2026-08-16）";
  const lp = pan(-1, "省心托管派（Supabase 托管）", [
    { t: "生态断层第一", sub: "SDK/教程/人才/第三方集成全面第一，维度⑥ 5 分无争议。", src: window.srcLine("K22") },
    { t: "开箱即用", sub: "Free 层开箱即得 PG+Auth+Storage+Realtime 全家桶，维度① 5 分。", src: window.srcLine(["K1", "K22"]) },
    { t: "运维外包", sub: "托管备份/PITR/监控/升级由平台承担，审计可外包给厂商 SOC2。", src: window.srcLine("K1") },
  ], [
    { t: "维度①权重>30%", sub: "开发便利性加权至 40% 时 Supabase 托管版以约 3.9 加权分反超第一——初创/MVP 直接上托管。", src: srcEq },
  ]);
  const rp = pan(1, "零锁定自管派（组合栈）", [
    { t: "每层可替换", sub: "Hasura 换 PostgREST、R2 换 MinIO、Neon 换自建 PG——维度④ 满分 5 分。", src: window.srcLine("K19") },
    { t: "数据即物理库", sub: "标准 PG 物理库，pg_dump 即退出路径；迁出无需重建周边栈。", src: window.srcLine("K19") },
    { t: "唯一已落地 LPK", sub: "懒猫私有云打包 + deploy.sh 已交付，维度⑤ 唯一 5 分。", src: window.srcLine(["K20", "K21"]) },
    { t: "€22 平成本", sub: "4C8G VPS €22/月承载 1–10 万日活，成本曲线是平的。", src: window.srcLine("K24") },
  ], [
    { t: "维度④+⑤>35%", sub: "不锁定+私有云合计权重超 35% 时组合栈约 4.6 分断层领先，托管版跌至倒数第二。", src: srcEq },
  ]);

  // 读数牌
  el("rect", { x: CX - 128, y: TOP + 282, width: 256, height: 34, fill: "#051c2c" });
  const rd = text(CX, TOP + 304, "当前读数：等权偏向自管派 · 非得分，倾斜为定性", { anchor: "middle", size: 10.5, fill: "#fff", bold: true });
  rd.setAttribute("stroke", "none");

  // 底部共享证伪条（红纹封印）
  const fz = el("g", { class: "drillable", "data-drill-keep": "" });
  el("rect", { x: 60, y: H - 46, width: W - 120, height: 30, fill: "rgba(194,47,78,.06)", stroke: "#c22f4e", "stroke-width": 1, "stroke-dasharray": "6 3" }, fz);
  for (let x = 60; x < W - 60; x += 14) el("line", { x1: x, y1: H - 46, x2: x + 8, y2: H - 16, stroke: "rgba(194,47,78,.25)", "stroke-width": 1 }, fz);
  const fzT = text(W / 2, H - 26, "共享证伪条：快照半衰期仅数月（InsForge 日更 / Nubase v0.1.x）· 维度⑤ 5 分依赖本项目 LPK 参照实现 · 合计分不可线性引用", { anchor: "middle", size: 10, fill: "#c22f4e", bold: true }, fz);
  fzT.setAttribute("stroke", "#fff");
  fz.addEventListener("click", drill("误用警告（三条证伪条件）", "§3.3", "① 2026-08-16 时点快照，分数半衰期可能只有数月；② 换其他私有云目标（群晖、K8s homelab）时维度⑤分数需重估；③ 合计分不应引用为线性优劣陈述。", srcEq));

  // 入场：砝码交替弹落 → 梁倾斜（reduced-motion 直接完成帧）
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = svg.querySelectorAll(".w-item, .pan-g > g.drillable");
  if (REDUCE) { items.forEach(i => i.setAttribute("opacity", 1)); }
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.disconnect();
      items.forEach((it, i) => {
        setTimeout(() => {
          it.style.transition = "opacity .35s ease, transform .35s cubic-bezier(.3,1.4,.5,1)";
          it.style.transform = "translateY(0)";
          it.setAttribute("opacity", 1);
        }, i * 130);
        it.style.transform = "translateY(-14px)";
      });
    }), { threshold: 0.25 });
    io.observe(svg);
  }
})();
