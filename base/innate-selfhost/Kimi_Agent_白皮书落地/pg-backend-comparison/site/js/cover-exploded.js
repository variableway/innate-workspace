// 封面 B/D · 真实材质分解视图 + 开箱冲击（共享引擎与画布 #cover-canvas-x）
// 主题原子：PostgreSQL 后端栈的五层分解——网关 / 自动API / 周边服务 / 扩展层 / 数据库内核（缸体×大象）
window.PG_LAYERS = [ // C 蓝图复用同一几何定义（cover-wire.js 在其后加载）
  { key: "gw",  name: "网关 / 接入层", sub: "Kong ↔ Traefik · 可替换", thesis: "网关可换：路由与 TLS 是商品", color: "#42566a", w: 13, d: 13, h: 1.7, z: 10.4 },
  { key: "api", name: "自动 API 层", sub: "PostgREST / Hasura", thesis: "建表即 API：RLS 即安全边界", color: "#8595a6", w: 15, d: 15, h: 2.0, z: 8.4 },
  { key: "svc", name: "周边服务层", sub: "Auth · Storage · Realtime", thesis: "平台锁定主要发生在这一层", color: "#5a6f84", w: 17, d: 17, h: 2.2, z: 6.2, neg: true },
  { key: "ext", name: "扩展层", sub: "pgvector · pg_search · TimescaleDB · pgai", thesis: "一个库干五件事：TB 内收敛", color: "#7d9bff", w: 16, d: 16, h: 2.4, z: 3.8 },
  { key: "core", name: "数据库内核", sub: "PostgreSQL 物理库 · Slonik", thesis: "数据始终是物理库 · pg_dump 即退出路径", color: "#336791", w: 18, d: 18, h: 3.8, z: 0, cyl: true },
];

window.COVER_X = (() => {
  const cv = document.getElementById("cover-canvas-x");
  if (!cv) return null;
  const PAL = U.PAL;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let BC = U.bindCanvas(cv), view = null;
  let active = false, raf = 0, t = 0, last = 0;
  let kTgt = 1, kCur = 1;              // 爆炸主参数 0=合拢 1=分解
  let mode = "x";                       // x=分解视图 d=开箱
  let mouseX = 0;
  const INTRO = { on: false, t: 0 };
  let particles = [], rings = [];
  let shakeAmp = 0, uK = 1, yawExtra = 0;
  let crate = { lidA: 1, wallA: 1, lidX: 0, lidY: 0, lidR: 0 };

  const shade = (hex, f) => { // f<0 加深 f>0 加白
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = v => U.clamp(Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f), 0, 255);
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };

  function cam() {
    const W = view.w, H = view.h;
    const leftBound = 0.585 * W, right = W - 332;
    let u = Math.min((right - leftBound) / 44, H * 0.0132);
    let labels = true;
    if (u < 5.6) { labels = false; u = Math.min((W - 40 - leftBound) / 44, H * 0.0132); }
    const cx = (leftBound + right) / 2, cy = H * 0.56;
    return { u: Math.max(5, u) * uK, cx, cy, labels, right };
  }
  function proj(x, y, z, c, yaw) {
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
    return { x: c.cx + rx * c.u, y: c.cy + ry * c.u * 0.5 - z * c.u, rx, ry };
  }

  // ── 大象剪影（与 cover.js 同款，独立实现以免跨模块耦合） ──
  function elephant(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0.30, 0.30);
    ctx.bezierCurveTo(0.42, 0.16, 0.72, 0.14, 0.84, 0.26);
    ctx.bezierCurveTo(0.94, 0.36, 0.96, 0.52, 0.92, 0.62);
    ctx.lineTo(0.90, 0.78); ctx.lineTo(0.90, 0.98); ctx.lineTo(0.80, 0.98); ctx.lineTo(0.78, 0.72);
    ctx.lineTo(0.62, 0.74); ctx.lineTo(0.62, 0.98); ctx.lineTo(0.52, 0.98); ctx.lineTo(0.50, 0.70);
    ctx.lineTo(0.40, 0.70); ctx.lineTo(0.40, 0.98); ctx.lineTo(0.30, 0.98); ctx.lineTo(0.28, 0.66);
    ctx.bezierCurveTo(0.20, 0.62, 0.10, 0.60, 0.07, 0.50);
    ctx.bezierCurveTo(0.03, 0.38, 0.08, 0.24, 0.18, 0.22);
    ctx.bezierCurveTo(0.24, 0.20, 0.28, 0.24, 0.30, 0.30);
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.moveTo(0.115, 0.56); ctx.quadraticCurveTo(0.16, 0.72, 0.13, 0.86);
    ctx.quadraticCurveTo(0.10, 0.72, 0.075, 0.60); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath(); ctx.moveTo(0.30, 0.26); ctx.quadraticCurveTo(0.46, 0.22, 0.44, 0.44);
    ctx.quadraticCurveTo(0.38, 0.56, 0.28, 0.50); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  // 盒体：四个侧面（painter 排序）+ 顶面
  function drawBox(ctx, c, yaw, w, d, z0, h, color, opts = {}) {
    const hw = w / 2, hd = d / 2;
    const cn = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => ({ b: proj(x, y, z0, c, yaw), t: proj(x, y, z0 + h, c, yaw), rx: x * Math.cos(yaw) - y * Math.sin(yaw), ry: x * Math.sin(yaw) + y * Math.cos(yaw) }));
    // 可见侧面：ry>0 的两个面（+x 面、+y 面随 yaw 而定）
    const faces = [
      { i: [1, 2], rySign: 1 }, { i: [2, 3], rySign: 1 },
      { i: [3, 0], rySign: 1 }, { i: [0, 1], rySign: 1 },
    ];
    // 侧面排序：按面心 ry 升序（远的先画）
    const sideF = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const my = (cn[i].ry + cn[j].ry) / 2;
      if (my > -0.01) sideF.push({ i, j, my });
    }
    sideF.sort((a, b) => a.my - b.my);
    sideF.forEach((f, k) => {
      const a = cn[f.i], b = cn[f.j];
      const g = ctx.createLinearGradient(0, a.t.y, 0, a.b.y);
      g.addColorStop(0, shade(color, 0.16 - k * 0.06));
      g.addColorStop(0.55, shade(color, -0.04 - k * 0.09));
      g.addColorStop(1, shade(color, -0.16 - k * 0.10));
      poly(ctx, [a.b, b.b, b.t, a.t], g, shade(color, -0.3), 0.8);
    });
    // 顶面：斜向高光 + 亮边
    const tg = ctx.createLinearGradient(cn[0].t.x, cn[0].t.y, cn[2].t.x, cn[2].t.y);
    tg.addColorStop(0, shade(color, 0.42)); tg.addColorStop(0.5, shade(color, 0.24)); tg.addColorStop(1, shade(color, 0.10));
    poly(ctx, cn.map(p => p.t), tg, "rgba(255,255,255,.55)", 1);
    if (opts.topDetail) opts.topDetail(cn.map(p => p.t));
  }

  // 内核缸体（cyl:true）
  function drawCore(ctx, c, yaw, z0, lay) {
    const L = window.PG_LAYERS[4];
    const r = L.w / 2, h = L.h, zz = z0;
    const N = 28, pts = { tb: [], bb: [] };
    for (let i = 0; i <= N; i++) {
      const a = i / N * U.TAU;
      pts.tb.push(proj(Math.cos(a) * r, Math.sin(a) * r, zz + h, c, yaw));
      pts.bb.push(proj(Math.cos(a) * r, Math.sin(a) * r, zz, c, yaw));
    }
    // 侧面带
    const g = ctx.createLinearGradient(0, c.cy - (zz + h) * c.u - r * c.u * 0.4, 0, c.cy - zz * c.u + r * c.u * 0.4);
    g.addColorStop(0, shade("#336791", 0.22)); g.addColorStop(0.5, "#336791"); g.addColorStop(1, shade("#336791", -0.3));
    ctx.beginPath();
    pts.tb.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    for (let i = N; i >= 0; i--) ctx.lineTo(pts.bb[i].x, pts.bb[i].y);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = shade("#336791", -0.35); ctx.lineWidth = 0.8; ctx.stroke();
    // 盘片线
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    for (let q = 1; q <= 3; q++) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = i / N * U.TAU;
        const p = proj(Math.cos(a) * r, Math.sin(a) * r, zz + h * q / 4, c, yaw);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // 顶盖
    const tg = ctx.createLinearGradient(c.cx - r * c.u, c.cy - (zz + h) * c.u, c.cx + r * c.u, c.cy - (zz + h) * c.u);
    tg.addColorStop(0, "#eef3f7"); tg.addColorStop(1, "#c9d6e0");
    poly(ctx, pts.tb, tg, "rgba(255,255,255,.6)", 1);
    // 大象徽记：贴在朝前侧面的正中（front-most 方向 = (sin yaw, cos yaw)·r）
    if (lay > 0.05) {
      const p0 = proj(r * Math.sin(yaw), r * Math.cos(yaw), zz + h * 0.42, c, yaw);
      const es = r * c.u * 0.34;
      ctx.save(); ctx.globalAlpha = Math.min(1, lay * 1.4);
      elephant(ctx, p0.x - es * 0.48, p0.y - es * 0.5, es, "rgba(255,255,255,.95)");
      ctx.restore();
    }
  }

  // ── 板条箱（D 开箱） ──
  function drawCrate(ctx, c, yaw) {
    if (crate.wallA <= 0.01 && crate.lidA <= 0.01) return;
    const W2 = 23 / 2, H2 = 23 / 2, zH = 15;
    ctx.save();
    // 四壁（木纹 = 板条缝 + 角铁）
    if (crate.wallA > 0.01) {
      ctx.globalAlpha = crate.wallA;
      const cn = [[-W2, -H2], [W2, -H2], [W2, H2], [-W2, H2]].map(([x, y]) => ({ b: proj(x, y, 0, c, yaw), t: proj(x, y, zH, c, yaw), ry: x * Math.sin(yaw) + y * Math.cos(yaw) }));
      const sideF = [];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; const my = (cn[i].ry + cn[j].ry) / 2; if (my > -0.01) sideF.push({ i, j, my }); }
      sideF.sort((a, b) => a.my - b.my);
      sideF.forEach((f, k) => {
        const a = cn[f.i], b = cn[f.j];
        poly(ctx, [a.b, b.b, b.t, a.t], k ? "#a9805a" : "#bd9268", "#8a6844", 1);
        ctx.strokeStyle = "rgba(90,60,35,.5)"; ctx.lineWidth = 0.7;
        for (let q = 1; q <= 3; q++) { // 板条缝
          const y0 = a.b.y + (a.t.y - a.b.y) * q / 4, y1 = b.b.y + (b.t.y - b.b.y) * q / 4;
          ctx.beginPath(); ctx.moveTo(a.b.x + (a.t.x - a.b.x) * 0, y0); ctx.lineTo(b.b.x, y1); ctx.stroke();
        }
      });
      // 正面模板喷字（正立、不随斜面旋转）
      const front = sideF[sideF.length - 1];
      const a = cn[front.i], b = cn[front.j];
      const mxx = (a.b.x + b.b.x + a.t.x + b.t.x) / 4, myy = (a.b.y + b.b.y + a.t.y + b.t.y) / 4;
      ctx.fillStyle = "rgba(40,25,12,.78)";
      ctx.font = `700 ${Math.max(9, c.u * 0.9)}px Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("FRAGILE · POSTGRES", mxx, myy - c.u * 0.8);
      ctx.fillText("THIS SIDE UP ↑", mxx, myy + c.u * 0.7);
      ctx.textAlign = "left";
    }
    // 盖（独立件：z 升 + 屏幕空间漂移 + 翻滚 + 淡出）
    if (crate.lidA > 0.01) {
      ctx.globalAlpha = crate.lidA;
      ctx.save(); ctx.translate(crate.lidX, crate.lidY); ctx.rotate(crate.lidR);
      const zL = zH + 0.4;
      const cn = [[-W2, -H2], [W2, -H2], [W2, H2], [-W2, H2]].map(([x, y]) => proj(x, y, zL, c, yaw));
      poly(ctx, cn, "#cda176", "#8a6844", 1.2);
      const p1 = proj(-W2, 0, zL, c, yaw), p2 = proj(W2, 0, zL, c, yaw);
      ctx.strokeStyle = "#7a5a38"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function spawnRing(c) { rings.push({ r: 6, a: 0.55, cx: c.cx, cy: c.cy - 2 * c.u }); }
  function spawnDust(c, n, up) {
    const rng = U.makeRng(Date.now() & 0xffff);
    for (let i = 0; i < n; i++) particles.push({
      x: c.cx + (rng() - 0.5) * 20 * c.u, y: c.cy - (2 + rng() * 8) * c.u,
      vx: (rng() - 0.5) * 90, vy: up ? -(40 + rng() * 130) : -(10 + rng() * 40),
      g: 320, life: 0.9 + rng() * 0.9, t: 0, s: 1.5 + rng() * 3,
      col: rng() > 0.4 ? "#a9805a" : "#8595a6",
    });
  }

  function drawFrame(dt) {
    if (!view || view.w < 10) view = BC.fit();
    const ctx = BC.ctx, { w: W, h: H } = view;
    const c = cam();
    // 爆炸主参数
    let kEff;
    if (INTRO.on) {
      INTRO.t += dt; const T = INTRO.t;
      // 时间线（COVER.md §6）
      if (T < 0.5) { shakeAmp = 1.2 + 1.2 * Math.abs(Math.sin(T * 34)); kEff = 0; }
      else {
        if (T - dt < 0.5) { shakeAmp = 15; spawnRing(c); spawnDust(c, 26, true); }
        kEff = U.clamp((T - 0.6) / 1.4, 0, 1);
        crate.lidA = U.clamp(1 - (T - 0.5) / 0.85, 0, 1);
        const eoc = U.clamp((T - 0.5) / 0.85, 0, 1);
        crate.lidX = -150 * eoc; crate.lidY = -40 * eoc; crate.lidR = -0.85 * eoc;
        const wA = U.clamp(1 - (T - 0.55) / 0.45, 0, 1);
        if (wA < crate.wallA && crate.wallA === 1) { spawnRing(c); spawnDust(c, 18, false); }
        crate.wallA = wA;
        uK = 1.34 - 0.34 * U.clamp((T - 0.55) / 1.55, 0, 1);
        yawExtra = 0.55 * (1 - U.clamp((T - 0.55) / 1.55, 0, 1));
        if (T >= 2.95) finishIntro();
      }
      // backOut 过冲
      const e = kEff, A = 3.1;
      kEff = 1 + (A + 1) * Math.pow(e - 1, 3) + A * Math.pow(e - 1, 2);
      kEff = U.clamp(kEff, 0, 1.12);
    } else {
      kCur = U.ease(kCur, kTgt, dt, 0.10);
      kEff = kCur;
      shakeAmp *= Math.exp(-dt * 5.5);
    }
    const yaw = Math.PI / 4 + 0.3 * Math.sin(t * 0.11) * 0.5 + mouseX * 0.11 + yawExtra;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shakeAmp > 0.05) ctx.translate(Math.sin(t * 96) * shakeAmp, Math.cos(t * 81) * shakeAmp * 0.7);

    // 地面阴影
    const gs = ctx.createRadialGradient(c.cx, c.cy + 1.2 * c.u, 4, c.cx, c.cy + 1.2 * c.u, 16 * c.u);
    gs.addColorStop(0, "rgba(5,28,44,.20)"); gs.addColorStop(1, "rgba(5,28,44,0)");
    ctx.save(); ctx.translate(c.cx, c.cy + 1.2 * c.u); ctx.scale(1, 0.36); ctx.translate(-c.cx, -(c.cy + 1.2 * c.u));
    ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(c.cx, c.cy + 1.2 * c.u, 16 * c.u, 0, U.TAU); ctx.fill(); ctx.restore();

    // 五层（自下而上画）
    const layK = i => U.clamp(kEff * 1.55 - i * 0.17, 0, 1);
    const anchors = [];
    window.PG_LAYERS.forEach((L, i) => {
      const li = layK(4 - i); // 底层先起
      const e = li, A = 1.7; // easeOutBack
      const eo = 1 + (A + 1) * Math.pow(e - 1, 3) + A * Math.pow(e - 1, 2);
      const sep = eo * (4 - i) * 2.6 + Math.sin(t * 1.1 + i) * 0.06 * eo;
      const z0 = L.z + sep * 2.2;
      if (L.cyl) drawCore(ctx, c, yaw, z0, li);
      else drawBox(ctx, c, yaw, L.w, L.d, z0, L.h, L.color, {
        topDetail: L.key === "ext" ? (pts) => { // 扩展层顶面：四枚扩展芯片（身份细节）
          const cxp = pts.reduce((s, p) => s + p.x, 0) / 4, cyp = pts.reduce((s, p) => s + p.y, 0) / 4;
          ctx.fillStyle = "rgba(5,28,44,.55)";
          [["pgv", -1, -1], ["pgs", 1, -1], ["ts", -1, 1], ["ai", 1, 1]].forEach(([nm, sx, sy]) => {
            const x = cxp + sx * c.u * 3.2, y = cyp + sy * c.u * 1.6;
            ctx.fillRect(x - c.u * 1.1, y - c.u * 0.55, c.u * 2.2, c.u * 1.1);
            ctx.fillStyle = "#fff"; ctx.font = `${Math.max(7, c.u * 0.72)}px Menlo, monospace`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(nm, x, y); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "rgba(5,28,44,.55)";
          });
        } : undefined,
      });
      // 层间软影
      if (i < 4) {
        const alpha = U.clamp(0.20 - (sep * 2.2) * 0.007 * 3, 0.04, 0.2);
        const p = proj(0, 0, z0 + L.h + 0.4, c, yaw);
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = "#051c2c";
        ctx.beginPath(); ctx.ellipse(p.x, p.y, L.w * 0.5 * c.u, L.w * 0.24 * c.u, 0, 0, U.TAU); ctx.fill(); ctx.restore();
      }
      // 标注锚点：取该层顶面最右投影角
      const hw = L.w / 2, hd = L.d / 2;
      const cands = [[hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => proj(x, y, z0 + L.h, c, yaw));
      const best = cands.reduce((a, b) => b.x > a.x ? b : a);
      anchors.push({ L, x: best.x, y: best.y, k: li });
    });

    if (mode === "d" && (INTRO.on || crate.lidA > 0.01 || crate.wallA > 0.01)) drawCrate(ctx, c, yaw);

    // 粒子与冲击环
    particles = particles.filter(p => (p.t += dt) < p.life);
    particles.forEach(p => {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = U.clamp(1 - p.t / p.life, 0, 1) * 0.85;
      ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s * 0.7);
    });
    ctx.globalAlpha = 1;
    rings = rings.filter(r => (r.r += dt * 340) < 200);
    rings.forEach(r => {
      ctx.save(); ctx.translate(r.cx, r.cy); ctx.scale(1, 0.5);
      ctx.globalAlpha = r.a * (1 - r.r / 200); ctx.strokeStyle = PAL.red; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r.r, 0, U.TAU); ctx.stroke(); ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.restore(); // 震动坐标系结束

    // 标注列（不随震动）
    if (c.labels) {
      const la = INTRO.on ? U.clamp((INTRO.t - 1.9) / 0.9, 0, 1) : U.clamp((kEff - 0.45) * 2.4, 0, 1);
      if (la > 0.01) {
        const lx = W - 312;
        let ly = H * 0.20;
        ctx.save(); ctx.globalAlpha = la;
        anchors.slice().reverse().forEach(a => { // 自上而下：网关→内核
          if (ly < a.y - 6) ly = a.y - 6;
          ctx.strokeStyle = PAL.inkLo; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x + 4, a.y); ctx.lineTo(lx - 10, ly + 4); ctx.lineTo(lx - 2, ly + 4); ctx.stroke();
          ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(a.x + 3, a.y, 2, 0, U.TAU); ctx.fill();
          ctx.font = "700 12.5px 'et-book', Palatino, Georgia, serif";
          ctx.fillStyle = PAL.ink; ctx.fillText(a.L.name, lx, ly + 6);
          ctx.font = "9.5px Menlo, Consolas, monospace"; ctx.fillStyle = PAL.inkLo;
          ctx.fillText(a.L.sub.toUpperCase().slice(0, 34), lx, ly + 19);
          ctx.font = "italic 11px 'et-book', Palatino, Georgia, serif";
          ctx.fillStyle = a.L.neg ? PAL.neg : PAL.red;
          ctx.fillText("· " + a.L.thesis, lx, ly + 32);
          ly += 62; if (ly < a.y + 28) ly = a.y + 28;
        });
        ctx.restore();
      }
    }

    // 左列洗白 + 题注
    const wg = ctx.createLinearGradient(0, 0, W * 0.78, 0);
    wg.addColorStop(0, "rgba(255,255,255,.97)");
    wg.addColorStop(0.68, "rgba(255,255,255,.94)");
    wg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W * 0.78, H);
    ctx.font = "10.5px Menlo, Consolas, monospace"; ctx.fillStyle = PAL.inkLo; ctx.textAlign = "right";
    const cap = INTRO.on ? "FIG. B · UNBOXING… 开箱中"
      : (kTgt >= 1 ? "FIG. B · EXPLODED 分解态 · 点击空白处合拢" : "FIG. B · ASSEMBLED 合拢态 · 点击空白处分解");
    ctx.fillText(cap, W - 26, H - 30); ctx.textAlign = "left";
  }

  function finishIntro() {
    INTRO.on = false; kCur = kTgt = 1; uK = 1; yawExtra = 0;
    particles = []; rings = []; shakeAmp = 0;
    crate = { lidA: 0, wallA: 0, lidX: 0, lidY: 0, lidR: 0 };
  }
  function playIntro() {
    if (REDUCE) { finishIntro(); requestAnimationFrame(() => { view = BC.fit(); drawFrame(0.016); }); return; }
    INTRO.on = true; INTRO.t = 0; kCur = 0; kTgt = 1;
    crate = { lidA: 1, wallA: 1, lidX: 0, lidY: 0, lidR: 0 };
    uK = 1.34; yawExtra = 0.55;
  }

  function loop(ts) {
    if (!active) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; t += dt;
    drawFrame(dt);
    raf = requestAnimationFrame(loop);
  }
  function setActive(on, opts = {}) {
    active = on; cancelAnimationFrame(raf);
    if (!on) return;
    if (opts.mode) mode = opts.mode;
    requestAnimationFrame(() => {
      view = BC.fit();
      if (mode === "d" && opts.intro) playIntro();
      if (REDUCE) { if (mode === "d") finishIntro(); drawFrame(0.016); return; }
      last = performance.now(); raf = requestAnimationFrame(loop);
    });
  }

  cv.addEventListener("click", e => {
    if (INTRO.on) return;
    if (e.target.closest("button, a, .chip, .cover-mode")) return;
    kTgt = kTgt >= 1 ? 0 : 1;
  });
  cv.addEventListener("dblclick", () => { if (mode === "d" && !INTRO.on) playIntro(); });
  addEventListener("mousemove", e => { mouseX = (e.clientX / innerWidth - 0.5) * 2; });
  addEventListener("resize", () => { if (active) { view = BC.fit(); if (REDUCE) drawFrame(0.016); } });
  return { setActive, playIntro, get mode() { return mode; } };
})();
