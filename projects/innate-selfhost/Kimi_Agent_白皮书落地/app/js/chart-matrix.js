// §2 六维矩阵热表（P5 DOM 版：分数 → 蓝色浓度；当前最优格 ★；逐格 drill）
(() => {
  const host = document.getElementById("matrix-chart");
  if (!host) return;
  const body = U.frame(host, {
    title: "5 方案 × 6 维总表：组合栈在「不锁定 × 私有云」上断层，托管版在「省心 × 生态」上断层",
    sub: "蓝色浓度 = 得分（1–5）· ★ = 该维最强 · 点击任意格查看判词与事实来源",
    src: "研究整理 — 报告 §3.2（2026-08-16）；评分方法见 §3.1",
  });
  const { dims, matrix } = window.RPT;
  const tbl = document.createElement("table");
  tbl.className = "mx";
  const thead = tbl.createTHead().insertRow();
  thead.insertCell().outerHTML = `<th class="dim-h">维度 \\ 方案</th>`;
  matrix.forEach(p => {
    const th = document.createElement("th");
    th.innerHTML = `<span class="mx-plan">${p.name}</span><span class="p-total">合计 ${p.total}/30</span>`;
    thead.appendChild(th);
  });
  dims.forEach((d, di) => {
    const tr = tbl.insertRow();
    const td = tr.insertCell();
    td.className = "dim";
    td.innerHTML = `${"①②③④⑤⑥"[di]} ${d.name}<span class="d-en">${d.en}</span>`;
    const best = Math.max(...matrix.map(p => p.scores[di].v));
    matrix.forEach(p => {
      const s = p.scores[di];
      const c = tr.insertCell();
      c.className = "cell";
      const a = 0.06 + (s.v / 5) * 0.30;
      c.style.background = `rgba(34,81,255,${a.toFixed(3)})`;
      if (s.v === best) c.style.outline = "1.5px solid #2251ff", c.style.outlineOffset = "-1.5px";
      c.innerHTML = `${s.v === best ? "★ " : ""}${s.v}<span class="c-note">${s.note}</span>`;
      c.setAttribute("data-drill-keep", "");
      c.addEventListener("click", e => {
        e.stopPropagation();
        U.showDrill({
          title: `${p.name} × ${d.name}`,
          value: `${s.v} / 5${s.v === best ? " · 该维最强" : ""}`,
          sub: s.note,
          source: window.srcLine(s.k),
          x: e.clientX, y: e.clientY,
        });
      });
    });
  });
  const tr = tbl.insertRow();
  tr.className = "total-row";
  tr.insertCell().outerHTML = `<td class="dim">等权合计</td>`;
  matrix.forEach(p => {
    const c = tr.insertCell();
    c.textContent = p.total;
    c.style.color = p.neg ? "#c22f4e" : (p.top ? "#2251ff" : "#051c2c");
  });
  body.appendChild(tbl);
  const leg = document.createElement("p");
  leg.className = "tbl-note";
  leg.textContent = "★ = 该维度五方案中最强或接近理论上限；蓝框 = 最强格。Nubase 在任何合理权重下都不进入前三——低分集中在稚嫩的硬事实，不是权重能救的。";
  body.appendChild(leg);
})();
