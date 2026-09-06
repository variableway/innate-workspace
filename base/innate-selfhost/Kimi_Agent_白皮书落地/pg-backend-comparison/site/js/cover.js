// 封面 A · 无限递归：同一主题原子（PostgreSQL 磁盘缸体 × Slonik 大象）的自相似缩放
// 当前缸体缩成上一层 3×3 阵列的中心单元——每一只大象都是更大容量地图上的一个单元。
window.COVER_A = (() => {
  const cv = document.getElementById("cover-canvas");
  if (!cv) return null;
  const PAL = U.PAL;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PGBLUE = "#336791"; // PostgreSQL 品牌蓝（真实材质色，封面豁免）
  let BC = U.bindCanvas(cv), view = null;
  let active = true, t = 0, last = 0, raf = 0;
  const PERIOD = 12; // 每层 12s

  // ── Slonik 大象剪影（侧视，单位坐标 0..1，朝左） ──
  function elephant(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.beginPath();
    // 躯干
    ctx.moveTo(0.30, 0.30);
    ctx.bezierCurveTo(0.42, 0.16, 0.72, 0.14, 0.84, 0.26);
    ctx.bezierCurveTo(0.94, 0.36, 0.96, 0.52, 0.92, 0.62);
    ctx.lineTo(0.90, 0.78); // 后臀
    // 后腿
    ctx.lineTo(0.90, 0.98); ctx.lineTo(0.80, 0.98); ctx.lineTo(0.78, 0.72);
    ctx.lineTo(0.62, 0.74); ctx.lineTo(0.62, 0.98); ctx.lineTo(0.52, 0.98);
    ctx.lineTo(0.50, 0.70);
    ctx.lineTo(0.40, 0.70); ctx.lineTo(0.40, 0.98); ctx.lineTo(0.30, 0.98);
    ctx.lineTo(0.28, 0.66);
    // 头部 + 鼻
    ctx.bezierCurveTo(0.20, 0.62, 0.10, 0.60, 0.07, 0.50);
    ctx.bezierCurveTo(0.03, 0.38, 0.08, 0.24, 0.18, 0.22);
    ctx.bezierCurveTo(0.24, 0.20, 0.28, 0.24, 0.30, 0.30);
    ctx.closePath(); ctx.fill();
    // 长牙（留白刻出）
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(0.115, 0.56); ctx.quadraticCurveTo(0.16, 0.72, 0.13, 0.86);
    ctx.quadraticCurveTo(0.10, 0.72, 0.075, 0.60); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 耳朵（同色稍暗的叠片——独立件，不破坏剪影）
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.moveTo(0.30, 0.26); ctx.quadraticCurveTo(0.46, 0.22, 0.44, 0.44);
    ctx.quadraticCurveTo(0.38, 0.56, 0.28, 0.50); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ── 单元绘制：PG 磁盘缸体（细节随屏幕尺寸降级） ──
  function drawCell(ctx, x, y, s, phaseFlash) {
    if (s < 5) return;
    ctx.save();
    ctx.translate(x, y);
    if (s < 26) { // 远景：蓝点阵单元
      ctx.fillStyle = PGBLUE; ctx.globalAlpha = 0.85;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore(); return;
    }
    const w = s, h = s * 1.06, ry = w * 0.16;
    const big = s > 92;
    // 缸体侧面
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, "#274e6e"); g.addColorStop(0.45, PGBLUE); g.addColorStop(1, "#1d3a52");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + ry);
    ctx.lineTo(-w / 2, h / 2 - ry);
    ctx.ellipse(0, h / 2 - ry, w / 2, ry, 0, Math.PI, 0, true);
    ctx.lineTo(w / 2, -h / 2 + ry);
    ctx.closePath(); ctx.fill();
    // 盘片分隔线
    ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = Math.max(0.6, s * 0.006);
    for (let i = 1; i <= 3; i++) {
      const yy = -h / 2 + ry + (h - 2 * ry) * (i / 4);
      ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy); ctx.stroke();
    }
    // 顶盖椭圆
    ctx.fillStyle = "#e8eef3";
    ctx.beginPath(); ctx.ellipse(0, -h / 2 + ry, w / 2, ry, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#9fb4c4"; ctx.lineWidth = Math.max(0.7, s * 0.008); ctx.stroke();
    ctx.fillStyle = PGBLUE;
    ctx.beginPath(); ctx.ellipse(0, -h / 2 + ry, w * 0.30, ry * 0.62, 0, 0, U.TAU); ctx.fill();
    if (big) {
      // 大象徽记（缸体正面 = 该对象的身份部位）
      elephant(ctx, -s * 0.26, -s * 0.10, s * 0.52, "rgba(255,255,255,.92)");
      // 顶盖铭文
      ctx.fillStyle = "#051c2c";
      ctx.font = `700 ${Math.max(8, s * 0.075)}px Menlo, Consolas, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.save(); ctx.translate(0, -h / 2 + ry); ctx.scale(1, 0.42);
      ctx.fillText("POSTGRES", 0, 0); ctx.restore();
    }
    // 出生闪蓝（新一层单元显现时）
    if (phaseFlash > 0) {
      ctx.globalAlpha = phaseFlash * 0.5;
      ctx.strokeStyle = PAL.red; ctx.lineWidth = Math.max(1, s * 0.012);
      ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function draw(dt) {
    if (!view) view = BC.fit();
    const { w: W, h: H } = view;
    const ctx = BC.ctx;
    ctx.clearRect(0, 0, W, H);
    t += dt;
    const phase = REDUCE ? 0.42 : (t / PERIOD) % 1;
    const z = Math.pow(3, phase);
    const cx = W * 0.665, cy = H * 0.52;
    const S = Math.min(W, H) * 0.40;

    // 从远到近：先画大层（网格），中心单元被下一层覆盖
    for (let L = 4; L >= 0; L--) {
      const cell = S * z / Math.pow(3, L);
      if (cell > Math.max(W, H) * 2.2) continue;
      if (cell < 4) continue;
      const flash = (L === 3) ? U.clamp(1 - Math.abs(phase - 0.5) * 3, 0, 1) : 0;
      for (let gy = -1; gy <= 1; gy++) for (let gx = -1; gx <= 1; gx++) {
        drawCell(ctx, cx + gx * cell, cy + gy * cell, cell * 0.86, flash);
      }
    }
    // 取景框：框住「正在缩成单元」的当前缸体
    const f = S * z / 3 * 0.86 / 2 + 10;
    ctx.strokeStyle = PAL.red; ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.75 * (1 - phase * 0.4);
    const b = 16;
    [[cx - f, cy - f, 1, 1], [cx + f, cy - f, -1, 1], [cx - f, cy + f, 1, -1], [cx + f, cy + f, -1, -1]]
      .forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(x + sx * b, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * b); ctx.stroke();
      });
    ctx.globalAlpha = 1;
    // 左列文字洗白
    // 左列文字洗白:文字区近乎实底(0.97),向右侧渐隐,保证标题/正文对比度
    const wg = ctx.createLinearGradient(0, 0, W * 0.78, 0);
    wg.addColorStop(0, "rgba(255,255,255,.97)");
    wg.addColorStop(0.68, "rgba(255,255,255,.94)");
    wg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W * 0.78, H);
    // 右下题注
    ctx.font = "10.5px Menlo, Consolas, monospace";
    ctx.fillStyle = PAL.inkLo; ctx.textAlign = "right";
    ctx.fillText("FIG. A · 每一只大象，都是更大容量地图上的一个单元 —— 规模，一路向上", W - 26, H - 30);
    ctx.textAlign = "left";
  }

  function loop(ts) {
    if (!active) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function setActive(on) {
    active = on;
    cancelAnimationFrame(raf);
    if (on) {
      requestAnimationFrame(() => { view = BC.fit(); if (REDUCE) { draw(0); } else { last = performance.now(); raf = requestAnimationFrame(loop); } });
    }
  }
  if (REDUCE) { requestAnimationFrame(() => { view = BC.fit(); draw(0); }); }
  else { raf = requestAnimationFrame(loop); }
  addEventListener("resize", () => { if (active) { view = BC.fit(); if (REDUCE) draw(0); } });
  return { setActive };
})();
