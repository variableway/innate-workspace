// §0 总分 hero · 六维分段阶梯（每方案一行；段宽=该维得分；点击任意段 drill 到判词与来源）
(() => {
  const host = document.getElementById("score-chart");
  if (!host) return;
  const body = U.frame(host, {
    title: "等权六维总分：组合栈 25 分居首，但排序是价值观的产物",
    sub: "每行 = 一个方案 · 段宽 = 该维得分（1–5）· 色阶 = 六个维度 · 点击任意分段查看判词与来源",
    src: "研究整理 — 报告 §3.2 总表（2026-08-16），逐格判词可回溯 §2 方案卡",
  });
  const { dims, matrix } = window.RPT;
  // 维度蓝阶（同一蓝色族）
  const dimColor = i => ["#051c2c", "#1233b8", "#2251ff", "#5f7fff", "#7d9bff", "#b9c8ff"][i];

  const legend = document.createElement("div");
  legend.className = "score-legend";
  dims.forEach((d, i) => {
    const el = document.createElement("span");
    el.className = "lg";
    el.innerHTML = `<i style="background:${dimColor(i)}"></i>${"①②③④⑤⑥"[i]} ${d.name}`;
    legend.appendChild(el);
  });
  body.appendChild(legend);

  const sorted = matrix.slice().sort((a, b) => b.total - a.total);
  sorted.forEach((p, ri) => {
    const row = document.createElement("div");
    row.className = "score-row rv";
    row.style.transitionDelay = (ri * 70) + "ms";
    const nameColor = p.neg ? "var(--neg)" : (p.top ? "var(--red)" : "var(--ink)");
    row.innerHTML = `<div class="s-name" style="color:${nameColor}">${p.name}<span class="s-en">${p.short} · ${p.verdict}</span></div>
      <div class="s-bar"></div>
      <div class="s-total" style="color:${nameColor}">${p.total}<small> /30</small></div>`;
    const bar = row.querySelector(".s-bar");
    p.scores.forEach((s, i) => {
      const seg = document.createElement("div");
      seg.className = "s-seg";
      seg.style.cssText = `width:${s.v / 30 * 100}%;background:${dimColor(i)}`;
      seg.setAttribute("data-drill-keep", "");
      seg.addEventListener("click", e => {
        e.stopPropagation();
        U.showDrill({
          title: `${p.name} · ${dims[i].name}`,
          value: `${s.v} / 5`,
          sub: s.note,
          source: window.srcLine(s.k),
          x: e.clientX, y: e.clientY,
        });
      });
      seg.addEventListener("mousemove", e => U.showTip(`${dims[i].name} · ${s.v}/5`, e.clientX, e.clientY));
      seg.addEventListener("mouseleave", U.hideTip);
      bar.appendChild(seg);
    });
    row.addEventListener("click", e => {
      U.showDrill({
        title: `${p.name} · 等权合计`,
        value: `${p.total} / 30`,
        sub: p.verdict + "。排序随权重翻转：维度①>30% 时托管版胜出；维度④+⑤>35% 时组合栈胜出。",
        source: "研究整理 · 报告 §3.2/§3.3（2026-08-16）",
        x: e.clientX, y: e.clientY,
      });
    });
    row.setAttribute("data-drill-keep", "");
    body.appendChild(row);
  });
})();
