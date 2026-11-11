/* The home page's name animation: "Chayan Roy" flies across the page for 5 seconds, then vanishes.
   - Plays once per visit (sessionStorage), on index.html only (build.py links it from the template).
   - Sits on top of the page but lets every tap through, so links and search keep working;
     a tap, click, key or mouse-wheel turn fades it out at once.
   - Online only: build.py leaves this file out of the offline list (see OFFLINE_SKIP), and the
     animation is skipped when its font (Lilita One, from Google Fonts) does not load in 4 seconds.
   - Colours come from the page's own --accent / --gold / --paper, so it follows light and dark mode.
   - With "reduce motion" turned on, the name only fades in and out in the middle. */
(function () {
  "use strict";
  var KEY = "study_flyby_seen";
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) { return; }
  if (!window.requestAnimationFrame || !document.fonts || !document.fonts.load) return;

  var NAME = "Chayan Roy", EYE_INDEX = NAME.indexOf("o"), BASE = 0.42;   // BASE: height of the flight line
  var T = { inEnd: 1.5, bonkEnd: 1.9, backEnd: 3.2, landEnd: 3.9, swellEnd: 4.3, end: 5.0 };
  var FONT_URL = "https://fonts.googleapis.com/css2?family=Lilita+One&display=swap&text=" + encodeURIComponent(NAME + "BOING!");
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var INPUTS = ["pointerdown", "keydown", "wheel"];

  function c01(x) { return Math.min(1, Math.max(0, x)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function seg(t, a, b) { return c01((t - a) / (b - a)); }
  function inOut(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function out(p) { return 1 - Math.pow(1 - p, 3); }
  function elastic(p) { return p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI / 3)) + 1; }
  function backOut(p) { var c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function font(px) { return px + 'px "Lilita One", "Arial Black", sans-serif'; }

  // Fixed random numbers, so the burst looks the same in every frame and every visit.
  var seed = 20261111;
  function rand() {
    seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  var scatter = NAME.split("").map(function () {
    return { ang: (rand() - .5) * 1.8, up: -(.3 + rand() * .9), dist: .55 + rand() * .6, spin: (rand() - .5) * 2 };
  });
  var sparks = [];
  for (var n = 0; n < 34; n++) sparks.push({ ang: rand() * Math.PI * 2, dist: .35 + rand() * .75, size: .04 + rand() * .07, col: n % 2, delay: rand() * .15 });

  var overlay = null, canvas = null, ctx = null, t0 = null, started = false, finished = false, skip = null;
  var W = 0, H = 0, fs = 40, half = 100, capA = 30, letters = [], eye = { x: 0, y: 0, r: 8 };

  // A tap or key before the font arrives cancels the show; during it, fades it out.
  var touched = false;
  function onInput() { touched = true; if (skip) skip(); }
  INPUTS.forEach(function (type) { addEventListener(type, onInput, { capture: true, passive: true }); });

  function finish() {
    if (finished) return;
    finished = true;
    INPUTS.forEach(function (type) { removeEventListener(type, onInput, { capture: true, passive: true }); });
    removeEventListener("resize", measure);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function measure() {
    W = document.documentElement.clientWidth || innerWidth;
    H = innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fs = Math.min(W * .12, H * .16, 120);
    ctx.font = font(fs);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    var total = ctx.measureText(NAME).width;
    half = total / 2;
    letters = NAME.split("").map(function (ch, i) {
      var x0 = ctx.measureText(NAME.slice(0, i)).width, w = ctx.measureText(ch).width;
      return { ch: ch, i: i, off: x0 + w / 2 - half };
    });
    capA = ctx.measureText("C").actualBoundingBoxAscent || fs * .7;
    var o = ctx.measureText("o");
    var oL = o.actualBoundingBoxLeft || fs * .27, oR = o.actualBoundingBoxRight || fs * .27;
    var oA = o.actualBoundingBoxAscent || fs * .52, oD = o.actualBoundingBoxDescent || 0;
    eye = { x: (oR - oL) / 2, y: capA / 2 - (oA - oD) / 2, r: (oL + oR) * .3 };
  }

  // Where the whole word is at time t (seconds). Depends on t only, so the ghost trail can ask about the past.
  function pose(t) {
    var xR = W - half - W * .03, xL = half + W * .03, x0 = -half - W * .08;
    var p = { cx: W / 2, cy: H * BASE, spacing: 1, anchor: 0, gsx: 1, gsy: 1, flip: 1, scale: 1, alpha: .85,
              amp: 0, lsx: 1, lsy: 1, jx: 0, jy: 0, tumble: null, burst: -1, visible: true };
    var s, c, j, sh;
    if (reduce) {
      p.alpha = .85 * Math.min(seg(t, 0, .6), 1 - seg(t, 4.2, T.end));
      p.visible = t < T.end;
      return p;
    }
    if (t < 0) { p.cx = x0; return p; }
    if (t < T.inEnd) {                       // fly in from the left, wiggling
      s = seg(t, 0, T.inEnd);
      c = 1 - seg(t, 1.1, T.inEnd);
      p.cx = lerp(x0, xR, .45 * s + .55 * s * s);
      p.cy = H * BASE + Math.sin(t * 5) * H * .04 * c;
      p.amp = H * .06 * c;
    } else if (t < T.bonkEnd) {              // hit the right edge: letters pile up
      s = seg(t, T.inEnd, T.bonkEnd);
      c = s < .6 ? .36 * Math.sin(Math.PI * s / .6) : -.07 * Math.sin(Math.PI * (s - .6) / .4);
      p.cx = xR - W * .015 * Math.sin(Math.PI * s);
      p.spacing = 1 - c; p.anchor = half;
      p.lsx = 1 - c * .55; p.lsy = 1 + c * .45;
    } else if (t < T.backEnd) {              // turn round like a coin, hop back to the left, cartwheeling
      p.flip = Math.cos(2 * Math.PI * inOut(seg(t, T.bonkEnd, 2.3)));
      s = seg(t, 2.05, T.backEnd);
      p.cx = lerp(xR, xL, inOut(s));
      p.cy = H * BASE - Math.sin(Math.PI * s) * H * .2;
      p.tumble = s;
      p.amp = H * .025 * Math.sin(Math.PI * s);
    } else if (t < T.landEnd) {              // spring to the middle and wobble
      s = seg(t, T.backEnd, T.landEnd);
      j = Math.sin(s * Math.PI * 5) * (1 - s);
      p.cx = lerp(xL, W / 2, elastic(s));
      p.gsy = 1 + .16 * j; p.gsx = 1 - .1 * j;
    } else if (t < T.swellEnd) {             // swell up and shake
      s = seg(t, T.landEnd, T.swellEnd);
      sh = fs * .04 * s;
      p.scale = 1 + .26 * s * s;
      p.spacing = 1 + .06 * s;
      p.jx = Math.sin(t * 97) * sh; p.jy = Math.cos(t * 83) * sh;
    } else if (t < T.end) {                  // burst
      p.scale = 1.26; p.spacing = 1.06;
      p.burst = seg(t, T.swellEnd, T.end);
    } else {
      p.visible = false;
    }
    return p;
  }

  function placeLetters(p, t) {
    return letters.map(function (L, i) {
      if (L.ch === " ") return null;
      var ph = t * 11 - i * .75;
      var dy = p.amp * Math.sin(ph);
      var rot = (p.amp / (H * .06)) * .22 * Math.cos(ph);
      if (p.tumble !== null) rot -= 2 * Math.PI * inOut(c01((p.tumble - .18 - i * .035) / .45));
      var lx = p.anchor + (L.off - p.anchor) * p.spacing;
      var x = p.cx + lx * p.flip * p.gsx * p.scale + p.jx;
      var y = p.cy + dy * p.gsy * p.scale + p.jy;
      var sx = p.flip * p.gsx * p.scale * p.lsx, sy = p.gsy * p.scale * p.lsy, a = p.alpha;
      if (p.burst >= 0) {
        var b = p.burst, e = out(b), S = scatter[i], k = 1 - .55 * b;
        x += ((L.off / half) * .9 + S.ang * .45) * W * .34 * S.dist * e;
        y += S.up * H * .4 * S.dist * e + b * b * H * .3;
        rot += S.spin * 3 * Math.PI * e;
        sx *= k; sy *= k;
        a *= Math.pow(1 - b, 1.3);
      }
      return { ch: L.ch, i: i, x: x, y: y, rot: rot, sx: sx, sy: sy, a: a };
    });
  }

  // Where the googly eye (the "o" of Roy) looks.
  function lookAt(t) {
    if (t < T.inEnd) return [1, .25 * Math.sin(t * 11)];
    if (t < 2.3) { var a = (t - T.inEnd) * 26; return [Math.cos(a), Math.sin(a)]; }   // dizzy
    if (t < T.backEnd) return [-1, -.35];
    if (t < T.landEnd) { var s = seg(t, T.backEnd, T.landEnd); return [Math.sin(s * 30) * (1 - s) * .9, .1]; }
    if (t < T.swellEnd) return [Math.sin(t * 40) > 0 ? .9 : -.9, -.2];   // nervous
    return [0, -1];
  }

  function drawEye(o, look) {
    var r = eye.r, pr = r * .52, c = Math.cos(-o.rot), s = Math.sin(-o.rot);
    ctx.globalAlpha = Math.min(1, o.a * 1.15);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(eye.x, eye.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(1, fs * .018); ctx.strokeStyle = "#10181B"; ctx.stroke();
    var lx = look[0] * c - look[1] * s, ly = look[0] * s + look[1] * c, m;
    if (o.sx < 0) lx = -lx;
    m = Math.sqrt(lx * lx + ly * ly); if (m > 1) { lx /= m; ly /= m; }
    var px = eye.x + lx * (r - pr) * .95, py = eye.y + ly * (r - pr) * .95;
    ctx.fillStyle = "#10181B";
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(px - pr * .35, py - pr * .35, pr * .28, 0, Math.PI * 2); ctx.fill();
  }

  function drawLetter(o, C, alphaMul, main, look) {
    if (Math.abs(o.sx) < .01 || o.a * alphaMul < .005) return;
    ctx.save();
    ctx.translate(o.x, o.y); ctx.rotate(o.rot); ctx.scale(o.sx, o.sy);
    if (main) {   // a halo in the page colour keeps the name readable over the text behind it
      ctx.globalAlpha = o.a * .7;
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = Math.max(2, fs * .1);
      ctx.strokeText(o.ch, 0, capA / 2);
    }
    ctx.globalAlpha = o.a * alphaMul;
    ctx.fillStyle = C.letters[o.i % 2];
    ctx.fillText(o.ch, 0, capA / 2);
    if (main && o.i === EYE_INDEX) drawEye(o, look);
    ctx.restore();
  }

  function drawSpeedLines(t, p, C) {
    if (!p.visible || p.burst >= 0) return;
    var vx = (p.cx - pose(t - .02).cx) / .02, v = Math.abs(vx);
    if (v < W * .45) return;
    var k = c01((v - W * .45) / (W * .8)), dir = vx > 0 ? 1 : -1, tail = p.cx - dir * (half * p.scale + fs * .15);
    ctx.save();
    ctx.strokeStyle = C.muted; ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, fs * .035);
    ctx.globalAlpha = .3 * k;
    [-.32, -.08, .18, .4].forEach(function (off, j) {
      var start = tail - dir * j * fs * .1, len = fs * (1 + (j % 2) * .8) * (.5 + k), y = p.cy + off * fs;
      ctx.beginPath(); ctx.moveTo(start, y); ctx.lineTo(start - dir * len, y); ctx.stroke();
    });
    ctx.restore();
  }

  function drawBonk(t, C) {
    if (t < T.inEnd || t > T.inEnd + .7) return;
    var s = seg(t, T.inEnd, T.inEnd + .7), wx = W - W * .03 + fs * .05, wy = H * BASE, k, a, r0, r1;
    ctx.save();
    ctx.lineCap = "round"; ctx.strokeStyle = C.letters[1];
    ctx.lineWidth = Math.max(2, fs * .05);
    ctx.globalAlpha = 1 - s;
    for (k = 0; k < 7; k++) {
      a = Math.PI * (.5 + k / 6);
      r0 = fs * (.25 + .6 * out(s)); r1 = r0 + fs * .28 * (1 - s);
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * r0, wy + Math.sin(a) * r0);
      ctx.lineTo(wx + Math.cos(a) * r1, wy + Math.sin(a) * r1);
      ctx.stroke();
    }
    var pop = Math.max(.01, backOut(c01(s * 2.5)));
    ctx.translate(wx - fs * .2, wy - fs * .95 - s * fs * .3);
    ctx.rotate(-.18); ctx.scale(pop, pop);
    ctx.font = font(fs * .42); ctx.textAlign = "right";
    ctx.globalAlpha = 1 - s * s;
    ctx.lineWidth = fs * .08; ctx.strokeStyle = C.paper;
    ctx.strokeText("BOING!", 0, 0);
    ctx.fillStyle = C.letters[1];
    ctx.fillText("BOING!", 0, 0);
    ctx.restore();
  }

  function drawPoof(t, C) {
    if (reduce || t < T.swellEnd || t >= T.end) return;
    var b = seg(t, T.swellEnd, T.end), e = out(b), cx = W / 2, cy = H * BASE, k, a, d, r, x, y;
    ctx.save();
    ctx.fillStyle = C.muted;
    ctx.globalAlpha = .14 * (1 - b) * (1 - b);
    ctx.beginPath();
    for (k = 0; k < 8; k++) {
      a = k / 8 * Math.PI * 2 + .3; d = fs * (.2 + 1.1 * e); r = fs * (.25 + .55 * e) * (k % 2 ? .85 : 1.1);
      x = cx + Math.cos(a) * d * 1.6; y = cy + Math.sin(a) * d * .8;
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    sparks.forEach(function (sp) {
      var bb = c01((b - sp.delay) / (1 - sp.delay));
      if (bb <= 0) return;
      var dd = out(bb) * sp.dist * Math.min(W * .45, fs * 5);
      ctx.globalAlpha = 1 - bb;
      ctx.fillStyle = C.letters[sp.col];
      ctx.beginPath();
      ctx.arc(cx + Math.cos(sp.ang) * dd, cy + Math.sin(sp.ang) * dd * .6 + bb * bb * H * .1, fs * sp.size * (1 - bb * .5), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { return cs.getPropertyValue(name).trim() || fallback; }
    return { letters: [v("--accent", "#14624A"), v("--gold", "#8A6212")], paper: v("--paper", "#F5F8F4"), muted: v("--muted", "#5B6D61") };
  }

  function tick(now) {
    if (finished) return;
    if (t0 === null) t0 = now;
    var t = (now - t0) / 1000, C = colours(), p = pose(t), k, tg, pg;
    ctx.clearRect(0, 0, W, H);
    if (!reduce) {
      drawSpeedLines(t, p, C);
      for (k = 5; k >= 1; k--) {             // see-through ghost trail
        tg = t - k * .035; pg = pose(tg);
        if (pg.visible) placeLetters(pg, tg).forEach(function (o) { if (o) drawLetter(o, C, .16 * (1 - k / 6), false); });
      }
      drawBonk(t, C);
    }
    if (p.visible) {
      var look = reduce ? [0, 0] : lookAt(t);
      placeLetters(p, t).forEach(function (o) { if (o) drawLetter(o, C, 1, true, look); });
    }
    drawPoof(t, C);
    if (t >= T.end + .2) finish();
    else requestAnimationFrame(tick);
  }

  function start() {
    if (started) return;
    if (finished || touched) return finish();
    started = true;
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;transition:opacity .25s ease";
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:block";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    ctx = canvas.getContext("2d");
    if (!ctx) return finish();
    measure();
    addEventListener("resize", measure);
    skip = function () { skip = null; overlay.style.opacity = "0"; setTimeout(finish, 260); };
    requestAnimationFrame(tick);
  }

  // Start once the page is on screen (not in a background tab).
  function whenVisible() {
    if (document.visibilityState !== "hidden") return start();
    document.addEventListener("visibilitychange", function onVis() {
      if (document.visibilityState === "hidden") return;
      document.removeEventListener("visibilitychange", onVis);
      start();
    });
  }

  var gaveUp = false;
  var timer = setTimeout(function () { gaveUp = true; finish(); }, 4000);
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_URL;
  link.onload = function () {
    document.fonts.load(font(48), NAME).then(function (faces) {
      if (gaveUp) return;
      clearTimeout(timer);
      if (!faces || !faces.length) return finish();
      whenVisible();
    }, function () { clearTimeout(timer); finish(); });
  };
  link.onerror = function () { clearTimeout(timer); finish(); };
  document.head.appendChild(link);
})();
