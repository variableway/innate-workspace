// §6 风险登记册（12 行台账：严重度徽标 + 缓解措施 + 逐行 drill）+ 验证清单交互
(() => {
  const host = document.getElementById("risk-chart");
  if (host) {
    const body = U.frame(host, {
      title: "风险登记册：四条高危——密钥回退链、Nubase 两条、AGPL 商用场景",
      sub: "高 = 采用前必须处置 · 中 = 不处置则随规模放大 · 低 = 需知晓可接受 · 点击行查看完整风险与缓解",
      src: "研究整理 — 报告 §7.1（2026-08-16）；每条可回溯 §2 方案卡事实",
    });
    const wrap = document.createElement("div");
    wrap.className = "tbl-wrap";
    const tbl = document.createElement("table");
    tbl.className = "dt";
    tbl.innerHTML = `<thead><tr><th>#</th><th>方案</th><th>风险</th><th>严重度</th><th>缓解措施</th></tr></thead>`;
    const tb = tbl.createTBody();
    window.RPT.risks.forEach((r, i) => {
      const tr = tb.insertRow();
      tr.className = "risk-row rv";
      tr.style.transitionDelay = (i * 40) + "ms";
      tr.setAttribute("data-drill-keep", "");
      const sevCls = r.sev.startsWith("高") ? "hi" : r.sev === "中" ? "md" : "lo";
      tr.innerHTML = `<td class="num">${r.id}</td><td>${r.plan}</td>
        <td><span class="r-title">${r.title}</span><br><span style="font-size:12px;color:var(--ink-md)">${r.text.length > 64 ? r.text.slice(0, 64) + "…" : r.text}</span></td>
        <td><span class="sev ${sevCls}">${r.sev}</span></td>
        <td style="font-size:12px;color:var(--ink-md)">${r.fix.length > 48 ? r.fix.slice(0, 48) + "…" : r.fix}</td>`;
      tr.addEventListener("click", e => {
        U.showDrill({
          title: `${r.id} · ${r.plan} · ${r.title}`,
          value: r.sev,
          sub: `<b>风险：</b>${r.text}<br><b>缓解：</b>${r.fix}`,
          source: window.srcLine(r.k), x: e.clientX, y: e.clientY,
        });
      });
    });
    wrap.appendChild(tbl); body.appendChild(wrap);
  }

  // 验证清单（可勾选，状态本地持久化）
  const cl = document.getElementById("checklist");
  if (cl) {
    const saved = JSON.parse(localStorage.getItem("pgcheck") || "[]");
    window.RPT.checklist.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "chk" + (saved.includes(i) ? " done" : "");
      div.innerHTML = `<div class="box" role="checkbox" aria-checked="${saved.includes(i)}"></div>
        <div><div class="c-name">${i + 1}. ${c.name}</div><div class="c-note">${c.note}</div></div>`;
      const toggle = () => {
        div.classList.toggle("done");
        const done = [...document.querySelectorAll(".chk")].map((d, j) => d.classList.contains("done") ? j : -1).filter(j => j >= 0);
        localStorage.setItem("pgcheck", JSON.stringify(done));
        div.querySelector(".box").setAttribute("aria-checked", div.classList.contains("done"));
      };
      div.querySelector(".box").addEventListener("click", toggle);
      div.querySelector(".c-name").addEventListener("click", toggle);
      cl.appendChild(div);
    });
  }
})();
