// 封面 C · 工程蓝图（X 射线线框，与 B 共享 PG_LAYERS 几何）+ 四态切换器
window.COVER_W = (() => {
  const cv = document.getElementById("cover-canvas-w");
  if (!cv) return null;
  const PAL = U.PAL;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let BC = U.bindCanvas(cv), view = null, active = false, raf = 0, t = 0, last = 0;

  function cam() {
    const W = view.w, H = view.h;
    const leftBound = 0.585 * W, right = W - 300;
    let u = Math.min((right - leftBound) / 44, H * 0.0132);
    if (u < 5.6) u = Math.min((W - 40 - leftBound) / 44, H * 0.0132);
    return { u: Math.max(5, u), cx: (leftBound + right) / 2, cy: H * 0.56 };
  }
  const proj = (x, y, z, c, yaw) => {
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
    return { x: c.cx + rx * c.u, y: c.cy + ry * c.u * 0.5 - z * c.u, ry };
  };

  function wireBox(ctx, c, yaw, w, d, z0, h, color) {
    const hw = w / 2, hd = d / 2;
    const cn = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => ({ b: proj(x, y, z0, c, yaw), t: proj(x, y, z0 + h, c, yaw), ry: x * Math.sin(yaw) + y * Math.cos(yaw) }));
    // 顶面白纱（前后层次）
    ctx.save(); ctx.globalAlpha = 0.62; ctx.fillStyle = "#fff";
    ctx.beginPath(); cn.forEach((p, i) => i ? ctx.lineTo(p.t.x, p.t.y) : ctx.moveTo(p.t.x, p.t.y)); ctx.closePath(); ctx.fill(); ctx.restore();
    const edge = (p, q, a, lw) => { ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    // 竖边 + 底边：远虚近实
    for (let i = 0; i < 4; i++) {
      const near = cn[i].ry > 0;
      edge(cn[i].b, cn[i].t, near ? 0.7 : 0.22, near ? 1 : 0.7);
      edge(cn[i].b, cn[(i + 1) % 4].b, near ? 0.5 : 0.16, 0.7);
    }
    // 顶面轮廓最重
    for (let i = 0; i < 4; i++) edge(cn[i].t, cn[(i + 1) % 4].t, 0.85, 1.3);
    ctx.globalAlpha = 1;
  }
  function wireCyl(ctx, c, yaw, r, z0, h, color) {
    const N = 26;
    for (const zz of [z0, z0 + h / 2, z0 + h]) {
      ctx.globalAlpha = zz === z0 + h ? 0.85 : 0.4;
      ctx.strokeStyle = color; ctx.lineWidth = zz === z0 + h ? 1.3 : 0.7;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = i / N * U.TAU;
        const p = proj(Math.cos(a) * r, Math.sin(a) * r, zz, c, yaw);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // 轴向母线
    ctx.globalAlpha = 0.3; ctx.lineWidth = 0.7;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const p1 = proj(Math.cos(a) * r, Math.sin(a) * r, z0, c, yaw), p2 = proj(Math.cos(a) * r, Math.sin(a) * r, z0 + h, c, yaw);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawFrame(dt) {
    if (!view || view.w < 10) view = BC.fit();
    const ctx = BC.ctx, { w: W, h: H } = view;
    const c = cam();
    const yaw = Math.PI / 4 + 0.12 * Math.sin(t * 0.14);
    ctx.clearRect(0, 0, W, H);
    // 十字网格底（52px）
    ctx.strokeStyle = PAL.lineLo; ctx.lineWidth = 0.6;
    for (let x = 0; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // 五层线框（分解态 k=1，层间距与 B 一致）
    window.PG_LAYERS.forEach((L, i) => {
      const sep = (4 - i) * 2.6 * 2.2;
      if (L.cyl) wireCyl(ctx, c, yaw, L.w / 2, L.z + sep, L.h, PAL.red);
      else wireBox(ctx, c, yaw, L.w, L.d, L.z + sep, L.h, L.neg ? PAL.neg : PAL.ink);
      // 引线端点空心圆
      const p = proj(L.w / 2, -L.d / 2, L.z + sep + L.h, c, yaw);
      ctx.strokeStyle = PAL.red; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, U.TAU); ctx.stroke();
      ctx.font = "9px Menlo, Consolas, monospace"; ctx.fillStyle = PAL.inkMd;
      ctx.fillText(L.key.toUpperCase(), p.x + 8, p.y + 3);
    });
    // 四角对位标记
    ctx.strokeStyle = PAL.red; ctx.lineWidth = 1.4;
    [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
    });
    // 左列洗白 + 签名条
    const wg = ctx.createLinearGradient(0, 0, W * 0.78, 0);
    wg.addColorStop(0, "rgba(255,255,255,.97)");
    wg.addColorStop(0.68, "rgba(255,255,255,.94)");
    wg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W * 0.78, H);
    ctx.font = "10.5px Menlo, Consolas, monospace"; ctx.fillStyle = PAL.inkLo; ctx.textAlign = "right";
    ctx.fillText("FIG. C · PG BACKEND STACK · 5 LAYERS · SCALE NTS · 蓝图线框", W - 26, H - 30);
    ctx.textAlign = "left";
  }

  function loop(ts) {
    if (!active) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; t += dt;
    drawFrame(dt); raf = requestAnimationFrame(loop);
  }
  function setActive(on) {
    active = on; cancelAnimationFrame(raf);
    if (!on) return;
    requestAnimationFrame(() => {
      view = BC.fit();
      if (REDUCE) { drawFrame(0.016); return; }
      last = performance.now(); raf = requestAnimationFrame(loop);
    });
  }
  addEventListener("resize", () => { if (active) { view = BC.fit(); if (REDUCE) drawFrame(0.016); } });
  return { setActive };
})();

// ── 四态切换器（最后加载；D 与 B 共享 COVER_X） ──
(() => {
  const A = window.COVER_A, X = window.COVER_X, W = window.COVER_W;
  const cvs = { rec: "cover-canvas", x: "cover-canvas-x", d: "cover-canvas-x", w: "cover-canvas-w" };
  const btns = document.querySelectorAll("#cover-mode button");
  const qs = new URLSearchParams(location.search);
  let cur = qs.get("cover") || localStorage.getItem("pgcover") || "rec";
  if (!cvs[cur]) cur = "rec";
  function setMode(m) {
    cur = m; localStorage.setItem("pgcover", m);
    Object.entries(cvs).forEach(([k, id]) => { if (k !== "d") document.getElementById(id).style.display = (id === cvs[m]) ? "" : "none"; });
    if (m === "d") document.getElementById("cover-canvas-x").style.display = "";
    btns.forEach(b => b.classList.toggle("on", b.dataset.mode === m));
    A && A.setActive(m === "rec");
    W && W.setActive(m === "w");
    if (X) { if (m === "x") X.setActive(true, { mode: "x" }); else if (m === "d") X.setActive(true, { mode: "d", intro: true }); else X.setActive(false); }
  }
  btns.forEach(b => b.addEventListener("click", e => { e.stopPropagation(); setMode(b.dataset.mode); }));
  setMode(cur);
})();
