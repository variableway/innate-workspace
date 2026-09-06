// main.js · 滚动引擎（章节 IO / 顶部进度栏 / 入场动画 / ◆K 锚点 / 来源登记册渲染）
(() => {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── 入场动画：.rv 与 .band 内图表框 ──
  document.querySelectorAll(".chart-frame, .term-mag, table.dt, .quote-card").forEach(el => el.classList.add("rv"));
  if (REDUCE) document.querySelectorAll(".rv").forEach(el => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".rv").forEach(el => io.observe(el));
  }

  // ── chips 跳转 ──
  document.querySelectorAll("[data-goto]").forEach(b =>
    b.addEventListener("click", () => document.querySelector(b.dataset.goto)?.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" })));

  // ── 顶部进度栏（章节段） ──
  const rail = document.getElementById("era-rail");
  const track = document.getElementById("rail-track");
  const railYear = document.getElementById("rail-year");
  const secs = [...document.querySelectorAll("[data-win]")];
  const segs = secs.map(s => {
    const seg = document.createElement("div");
    seg.className = "seg";
    const lab = s.id.replace("sec-", "").toUpperCase();
    seg.innerHTML = `<span class="seg-label">${lab}</span>`;
    seg.style.pointerEvents = "auto";
    seg.addEventListener("click", () => s.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" }));
    track.appendChild(seg);
    return seg;
  });
  function layoutSegs() {
    const doc = document.documentElement;
    const total = doc.scrollHeight - innerHeight;
    secs.forEach((s, i) => {
      const a = s.offsetTop / total, b = (secs[i + 1] ? secs[i + 1].offsetTop : doc.scrollHeight) / total;
      segs[i].style.left = (a * 100) + "%";
      segs[i].style.width = Math.max(1, (b - a) * 100) + "%";
    });
  }
  layoutSegs(); addEventListener("load", layoutSegs); addEventListener("resize", layoutSegs);

  // ── 章节 IO：驱动进度栏 + 右栏 ──
  const winIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const win = e.target.dataset.win;
    const i = secs.indexOf(e.target);
    segs.forEach((sg, j) => sg.classList.toggle("active", j === i));
    railYear.textContent = win === "sources" ? "K" : "§" + Math.max(0, i);
    window.DASH && DASH.set(win);
  }), { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
  secs.forEach(s => winIO.observe(s));

  // 右栏在离开封面后滑入
  const coverIO = new IntersectionObserver(es => es.forEach(e => {
    window.DASH && DASH.show(!e.isIntersecting);
    rail.classList.toggle("on", !e.isIntersecting);
  }), { threshold: 0.25 });
  coverIO.observe(document.getElementById("cover"));

  // ── ◆K 锚点：正文内联来源 drill ──
  document.querySelectorAll(".src[data-k]").forEach(b => {
    b.setAttribute("data-drill-keep", "");
    b.addEventListener("click", e => {
      e.stopPropagation();
      const s = window.srcByKey(b.dataset.k);
      if (!s) return;
      U.showDrill({
        title: `${s.k} · 来源锚点`,
        value: s.date,
        sub: s.fact,
        source: s.urls.join("；"),
        x: e.clientX, y: e.clientY,
      });
    });
  });

  // ── 来源登记册渲染（K1–K41） ──
  const list = document.getElementById("source-list");
  if (list) {
    const CAT = { company: "厂商一手", industry: "行业 & 官方", broker: "第三方交叉", kimi: "研究整理" };
    window.SOURCES.forEach(s => {
      const row = document.createElement("div");
      row.className = "src-row rv";
      row.id = "src-" + s.k;
      row.innerHTML = `<span class="s-fact"><span class="s-k">${s.k}</span><span class="src-cat ${s.cat}">${CAT[s.cat]}</span>${s.fact}</span>
        <span class="s-cite">${s.urls.map(u => u.startsWith("http") ? `<a href="${u}" target="_blank" rel="noopener">${u}</a>` : u).join(" · ")} · ${s.date}</span>`;
      list.appendChild(row);
    });
    if (REDUCE) list.querySelectorAll(".rv").forEach(el => el.classList.add("in"));
    else {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }), { threshold: 0.05 });
      list.querySelectorAll(".rv").forEach(el => io.observe(el));
    }
  }
})();
