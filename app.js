(() => {
  "use strict";
  const S = window.SHOP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Fill the page from config.js ---------- */
  const digits = n => n.replace(/[^\d+]/g, "");
  const tel = n => "tel:" + digits(n);
  const wa = (n, msg) => "https://wa.me/" + digits(n).replace("+", "") + (msg ? "?text=" + encodeURIComponent(msg) : "");
  const primary = S.phones.find(p => p.primary) || S.phones[0];
  const primaryWa = S.phones.find(p => p.primary && p.whatsapp) || S.phones.find(p => p.whatsapp);
  const q = encodeURIComponent(S.address.mapsQuery);
  const links = {
    "call:primary": primary ? tel(primary.number) : null,
    "whatsapp:primary": primaryWa ? wa(primaryWa.number, S.whatsappMessage) : null,
    "directions": `https://www.google.com/maps/dir/?api=1&destination=${q}`
  };
  const get = path => path.split(".").reduce((o, k) => (o == null ? o : o[k]), S);

  $$("[data-text]").forEach(el => { const v = get(el.dataset.text); if (v) el.textContent = v; });
  $$("[data-link]").forEach(a => {
    const href = links[a.dataset.link];
    if (!href) { a.remove(); return; }
    a.href = href;
    if (href.startsWith("http")) { a.target = "_blank"; a.rel = "noopener"; }
  });

  const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("#phones").innerHTML = S.phones.map(p => `
    <li>
      <span><span class="ph-label">${esc(p.label)}</span><a class="ph-num" href="${tel(p.number)}">${esc(p.number)}</a></span>
      <span class="ph-acts">
        <a href="${tel(p.number)}" aria-label="Call ${esc(p.number)}">${icon("i-call")}</a>
        ${p.whatsapp ? `<a class="wa" href="${wa(p.number, S.whatsappMessage)}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(p.number)}">${icon("i-wa")}</a>` : ""}
      </span>
    </li>`).join("");

  const extras = [];
  if (S.email) extras.push(`<li><a href="mailto:${esc(S.email)}">${icon("i-mail")}${esc(S.email)}</a></li>`);
  (S.socials || []).forEach(s => extras.push(`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${icon("i-route")}${esc(s.label)}</a></li>`));
  $("#extra").innerHTML = extras.join("");

  $("#hours").innerHTML = S.hours && S.hours.length
    ? `<b>Opening hours</b>${S.hours.map(h => `<span style="display:block">${esc(h)}</span>`).join("")}`
    : `<b>Opening hours</b>Please call before your visit to check today's hours.`;

  if (S.slogan) $("#slogan").hidden = false;

  // Map loads only on request (lighter page, no third-party request by default)
  $("#showMap").addEventListener("click", e => {
    const box = $("#mapbox");
    box.innerHTML = `<iframe title="Map: ${esc(S.address.mapsQuery)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${q}&output=embed"></iframe>`;
    box.hidden = false;
    e.currentTarget.remove();
  });

  // Structured data built from the same config (only verified fields)
  const ld = {
    "@context": "https://schema.org", "@type": "GroceryStore",
    name: S.name, alternateName: S.nameArabic,
    image: new URL("media/storefront.webp", location.href).href,
    telephone: primary && digits(primary.number),
    address: { "@type": "PostalAddress", streetAddress: `${S.address.street} (${S.address.landmark})`, addressLocality: "Dubai", addressCountry: "AE" }
  };
  if (S.email) ld.email = S.email;
  const ldEl = document.createElement("script"); ldEl.type = "application/ld+json"; ldEl.textContent = JSON.stringify(ld);
  document.head.append(ldEl);

  $("#yr").textContent = new Date().getFullYear();

  /* ---------- 2. Header, current section in the nav, simple reveals ---------- */
  const hdr = $("#hdr");
  const tour = $("#tour");
  const inTour = () => { if (!tour) return false; const r = tour.getBoundingClientRect(); return r.top <= 0 && r.bottom > innerHeight; };
  const onScrollHdr = () => hdr.classList.toggle("solid", scrollY > innerHeight * 0.6 && !inTour());
  addEventListener("scroll", onScrollHdr, { passive: true });
  onScrollHdr();

  const navLinks = $$(".nav a");
  const navIO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => { if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["about", "staples", "visit"].forEach(id => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  const fx = !reduceMotion;
  if (fx) {
    document.documentElement.classList.add("fx");
    // elements driven by the scroll engine drop the one-shot CSS reveal
    $$("[data-fx]").forEach(el => { el.classList.remove("rv"); $$(".rv", el).forEach(c => c.classList.remove("rv")); });
  }
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".rv").forEach(el => io.observe(el));

  const loader = $("#loader");
  if (!fx) { // reduced motion: everything stays static and fully visible
    clearTimeout(window.__poaFailsafe);
    document.documentElement.classList.remove("loading");
    if (loader) loader.remove();
    return;
  }

  /* ---------- Preloader: counts up while the storefront, fonts and first video frames load ---------- */
  const loaderCtl = (() => {
    clearTimeout(window.__poaFailsafe); // the scripts loaded: this controller takes over
    if (!loader) { document.documentElement.classList.remove("loading"); return { frames() {} }; }
    const html = document.documentElement;
    html.classList.add("loading");
    const pctEl = $("#loaderPct"), ring = $("#loaderRing");
    const parts = { photo: 0, fonts: 0, frames: 0 }, weights = { photo: 0.35, fonts: 0.15, frames: 0.5 };
    let target = 0, shown = 0, done = false, raf = 0, quick = false;
    try { quick = sessionStorage.getItem("poa-seen") === "1"; sessionStorage.setItem("poa-seen", "1"); } catch (e) { /* storage blocked: full intro */ }
    const t0 = performance.now(), minTime = quick ? 450 : 1500;
    const loop = () => { if (!raf && !done) raf = requestAnimationFrame(step); };
    function set(k, v) {
      parts[k] = clamp(v, 0, 1);
      target = Object.keys(parts).reduce((a, key) => a + parts[key] * weights[key], 0);
      loop();
    }
    function step() {
      raf = 0;
      // the counter never runs ahead of the clock, so it reads as a smooth count
      const goal = Math.min(target, clamp((performance.now() - t0) / minTime, 0, 1));
      shown += (goal - shown) * 0.12;
      if (goal - shown < 0.003) shown = goal;
      pctEl.textContent = Math.round(shown * 100);
      ring.style.strokeDashoffset = (295.31 * (1 - shown)).toFixed(2);
      if (shown >= 0.999) finish(); else raf = requestAnimationFrame(step);
    }
    function finish() {
      if (done) return;
      done = true;
      pctEl.textContent = "100"; ring.style.strokeDashoffset = "0";
      setTimeout(() => {
        loader.classList.add("out");
        html.classList.remove("loading");
        setTimeout(() => loader.remove(), 1200);
        queue();
      }, 220);
    }
    setTimeout(() => { parts.photo = parts.fonts = parts.frames = 1; target = 1; loop(); }, 5000); // never wait longer than 5 s
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => set("fonts", 1), () => set("fonts", 1));
    const ph = $(".tour .photo");
    if (!ph || ph.complete) set("photo", 1);
    else { ph.addEventListener("load", () => set("photo", 1), { once: true }); ph.addEventListener("error", () => set("photo", 1), { once: true }); }
    loop();
    return { frames: v => set("frames", v) };
  })();

  /* ---------- 3. Scroll engine: every section after the tour follows the scroll ---------- */
  let VH = innerHeight, VW = document.documentElement.clientWidth;
  const scenes = [];
  const scene = (el, fn) => { if (el) scenes.push({ el, fn }); };
  // 0 → 1 while the element's top travels from a·VH to b·VH
  const enter = (r, a, b) => clamp((a * VH - r.top) / ((a - b) * VH), 0, 1);
  // 0 → 1 over the element's whole passage through the viewport
  const through = r => clamp((VH - r.top) / (VH + r.height), 0, 1);
  const bar = $(".progress");

  let queued = false;
  function render() {
    queued = false;
    VH = innerHeight; VW = document.documentElement.clientWidth;
    const max = document.documentElement.scrollHeight - VH;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : 0})`;
    const rects = scenes.map(s => s.el.getBoundingClientRect());
    scenes.forEach((s, i) => {
      const r = rects[i];
      if (r.top > VH * 1.3) { s.above = false; return; }   // far below: nothing to do yet
      if (r.bottom < -VH * 0.3) {                           // far above: settle on the final state once
        if (!s.above) { s.fn(r); s.above = true; }
        return;
      }
      s.above = false;
      s.fn(r);
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);

  // Headings and lead text light up word by word
  function splitWords(el) {
    const out = [];
    (function walk(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement("span"); w.className = "w"; w.textContent = part;
            out.push(w); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }
  $$('[data-fx="words"]').forEach(el => {
    const ws = splitWords(el), n = ws.length;
    let last = -1;
    scene(el, r => {
      const t = enter(r, 0.92, 0.45);
      if (Math.abs(t - last) < 0.003) return;
      last = t;
      ws.forEach((w, i) => { const k = clamp(t * (n + 3) - i, 0, 3) / 3; w.style.opacity = (0.16 + 0.84 * k).toFixed(3); });
    });
  });

  // Lists slide in one item after another
  $$('[data-fx="stagger"]').forEach(list => {
    const items = [...list.children];
    scene(list, r => {
      const t = enter(r, 0.95, 0.5), n = items.length;
      items.forEach((it, i) => {
        const k = smooth(clamp(t * (n + 1) - i, 0, 1));
        it.style.opacity = k.toFixed(3);
        it.style.transform = `translate3d(0,${((1 - k) * 26).toFixed(1)}px,0)`;
      });
    });
  });

  $$('[data-fx="slide"]').forEach(el => scene(el, r => {
    const k = smooth(enter(r, 0.98, 0.62));
    el.style.opacity = (0.1 + 0.9 * k).toFixed(3);
    el.style.transform = `translate3d(0,${((1 - k) * 34).toFixed(1)}px,0)`;
  }));

  // About: the framed storefront opens up and its picture drifts (parallax)
  const frame = $('[data-fx="frame"]');
  if (frame) {
    const box = $(".frame-led", frame), img = $("img", box);
    scene(frame, r => {
      const k = smooth(enter(r, 1, 0.35));
      box.style.clipPath = k >= 1 ? "none" : `inset(${((1 - k) * 12).toFixed(2)}% ${((1 - k) * 9).toFixed(2)}% round 6px)`;
      img.style.transform = `translate3d(0,${((through(r) - 0.5) * -10).toFixed(2)}%,0) scale(${(1.16 - 0.16 * k).toFixed(4)})`;
    });
  }

  // Name band: two rows slide in opposite directions
  const band = $('[data-fx="band"]');
  if (band) {
    const r1 = $(".r1", band), r2 = $(".r2", band);
    scene(band, r => {
      const t = through(r), d = VW * 0.7;
      r1.style.transform = `translate3d(${(-t * d).toFixed(1)}px,0,0)`;
      r2.style.transform = `translate3d(${(-d + t * d).toFixed(1)}px,0,0)`;
    });
  }

  // Origin: the landscape mosaic zooms out from the centre until the waterfall fills the screen
  // (each tile scales from the viewport centre at its own rate, so the outer ones fly past)
  const zoom = $('[data-fx="zoom"]');
  if (zoom) {
    const stageZ = $(".origin-stage", zoom), tiles = $$(".zp-img", zoom);
    const shade = $(".zp-shade", zoom), lead = $(".origin-lead", zoom), copy = $(".origin-copy", zoom);
    const factor = [1, 1.3, 1.55, 1.3, 1.55, 1.9, 2.3];
    let k0 = 4, lastZ = -1;
    const measureZ = () => {
      const W = stageZ.clientWidth, H = stageZ.clientHeight;
      tiles.forEach(t => { t.style.transformOrigin = `${(W / 2 - t.offsetLeft).toFixed(1)}px ${(H / 2 - t.offsetTop).toFixed(1)}px`; });
      k0 = Math.max(W / (tiles[0].offsetWidth || 1), H / (tiles[0].offsetHeight || 1)) * 1.02;
      lastZ = -1;
    };
    measureZ();
    addEventListener("resize", measureZ);
    scene(zoom, r => {
      const total = r.height - VH;
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      if (Math.abs(p - lastZ) < 0.0005) return;
      lastZ = p;
      const e = smooth(clamp(p / 0.72, 0, 1));
      tiles.forEach((t, i) => { t.style.transform = `scale(${(1 + (k0 * factor[i] - 1) * e).toFixed(4)})`; });
      shade.style.opacity = smooth(clamp((p - 0.45) / 0.3, 0, 1)).toFixed(3);
      const lo = 1 - smooth(clamp(p / 0.16, 0, 1));
      lead.style.opacity = lo.toFixed(3);
      lead.style.transform = `translate3d(0,${(-p * 180).toFixed(1)}px,0) scale(${(1 + p * 0.5).toFixed(3)})`;
      const co = smooth(clamp((p - 0.66) / 0.16, 0, 1));
      copy.style.opacity = co.toFixed(3);
      copy.style.transform = `translate3d(0,${((1 - co) * 30).toFixed(1)}px,0)`;
      copy.style.visibility = co > 0.01 ? "visible" : "hidden";
    });
  }

  // Inside: cards stick, the next one slides over and the previous recedes
  const stack = $('[data-fx="stack"]');
  if (stack) {
    const cards = $$(".card", stack);
    const inners = cards.map(c => $(".card-in", c)), dims = cards.map(c => $(".card-dim", c)), pics = cards.map(c => $("img", c));
    let tops = [], h = 1;
    const measure = () => { tops = cards.map(c => parseFloat(getComputedStyle(c).top) || 0); h = cards[0].offsetHeight || 1; };
    measure();
    addEventListener("resize", measure);
    scene(stack, () => {
      const rs = cards.map(c => c.getBoundingClientRect());
      cards.forEach((c, i) => {
        const e = smooth(clamp((VH - rs[i].top) / Math.max(1, VH - tops[i]), 0, 1)); // arriving
        let q = 0;                                                                     // being covered
        if (i < cards.length - 1) q = clamp((tops[i] + h - rs[i + 1].top) / Math.max(1, h - (tops[i + 1] - tops[i])), 0, 1);
        inners[i].style.transform = `scale(${((0.92 + 0.08 * e) * (1 - 0.08 * q)).toFixed(4)})`;
        dims[i].style.opacity = (0.65 * q).toFixed(3);
        pics[i].style.transform = `translate3d(0,${(clamp(rs[i].top / VH, -1, 1) * 7).toFixed(2)}%,0)`;
      });
    });
  }

  // Visit: a golden LED line draws itself, the contact card tilts up into place
  const led = $('[data-fx="led"]');
  scene(led, r => { led.style.transform = `scaleX(${smooth(enter(r, 0.95, 0.55)).toFixed(4)})`; });

  const tilt = $('[data-fx="tilt"]');
  if (tilt) {
    const card = $(".contact", tilt), rows = $$("#phones li", tilt);
    scene(tilt, r => {
      const k = smooth(enter(r, 1, 0.5));
      card.style.transform = `translate3d(0,${((1 - k) * 80).toFixed(1)}px,0) rotateX(${((1 - k) * 16).toFixed(2)}deg) scale(${(0.94 + 0.06 * k).toFixed(4)})`;
      card.style.opacity = (0.2 + 0.8 * k).toFixed(3);
      const n = rows.length;
      rows.forEach((li, i) => {
        const m = smooth(clamp(k * (n + 1) - i - 0.3, 0, 1));
        li.style.opacity = m.toFixed(3);
        li.style.transform = `translate3d(0,${((1 - m) * 18).toFixed(1)}px,0)`;
      });
    });
  }

  // Finale: the name rises letter by letter as the page ends
  const fin = $('[data-fx="finale"]');
  if (fin) {
    const mark = $(".ftr-mark", fin), emb = $(".ftr-emblem", fin), ar = $(".ftr-ar", fin);
    const chars = [];
    const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = mark.textContent.replace(/\s+/g, " ").trim();
    $$(".ln", mark).forEach(ln => {
      const txt = ln.textContent; ln.textContent = ""; ln.setAttribute("aria-hidden", "true");
      [...txt].forEach(ch => { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch === " " ? " " : ch; ln.append(s); chars.push(s); });
    });
    mark.removeAttribute("aria-label"); mark.prepend(sr);
    scene(fin, r => {
      const t = clamp((VH - r.top) / (r.height * 0.85), 0, 1), n = chars.length;
      chars.forEach((c, i) => {
        const k = smooth(clamp((t - (i / n) * 0.45) / 0.55, 0, 1));
        c.style.transform = `translate3d(0,${((1 - k) * 105).toFixed(1)}%,0)`;
      });
      emb.style.transform = `rotate(${((1 - t) * -120).toFixed(1)}deg) scale(${(0.6 + 0.4 * smooth(t)).toFixed(3)})`;
      emb.style.opacity = smooth(t).toFixed(3);
      ar.style.opacity = smooth(clamp((t - 0.45) / 0.55, 0, 1)).toFixed(3);
    });
  }

  render();
  addEventListener("load", queue, { once: true });

  /* ---------- 4. Arrival & walk-through (photo → video frames), then the stage recedes ---------- */
  if (!tour || !HTMLCanvasElement.prototype.getContext) { loaderCtl.frames(1); return; }
  document.documentElement.classList.add("tour-on");
  const stage = $(".stage", tour);
  const photo = $(".photo", tour);
  const film = $(".film", tour);
  const ctx = film.getContext("2d", { alpha: false });
  const intro = $(".intro", tour);
  const exitShade = $(".exit-shade", tour);
  const caps = $$(".cap", tour).map(el => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const railFill = $(".rail-fill", tour);
  const railItems = $$(".rail li", tour);

  // Fewer frames on phones / data saver (every 2nd frame)
  const TOTAL = S.media.frameCount;
  const lite = matchMedia("(max-width: 767px)").matches || (navigator.connection && navigator.connection.saveData);
  const step = lite ? 2 : 1;
  const idx = [];
  for (let i = 0; i < TOTAL; i += step) idx.push(i);
  if (idx[idx.length - 1] !== TOTAL - 1) idx.push(TOTAL - 1);
  const imgs = new Array(idx.length);
  const src = i => S.media.framePath.replace("{n}", String(idx[i]).padStart(3, "0"));

  // Progressive loading: a coarse pass first, then the gaps are filled in
  const order = [], seen = new Set();
  for (const stride of [16, 8, 4, 2, 1]) for (let i = 0; i < idx.length; i += stride) if (!seen.has(i)) { seen.add(i); order.push(i); }
  if (!seen.has(idx.length - 1)) order.push(idx.length - 1);
  let cursor = 0, active = 0, dirty = true;
  // the preloader waits for the coarse first pass of frames (every 16th / 8th)
  const FIRST = Math.min(order.length, lite ? 7 : 13);
  let firstDone = 0;
  const firstTick = pos => { if (pos < FIRST) loaderCtl.frames(++firstDone / FIRST); };
  function pump() {
    while (active < 6 && cursor < order.length) {
      const pos = cursor, i = order[cursor++]; active++;
      const im = new Image(); im.decoding = "async";
      im.onload = () => { imgs[i] = im; active--; dirty = true; firstTick(pos); kick(); pump(); };
      im.onerror = () => { active--; firstTick(pos); pump(); };
      im.src = src(i);
    }
  }
  pump();

  function nearest(i) {
    for (let d = 0; d < imgs.length; d++) {
      if (imgs[i - d]) return imgs[i - d];
      if (imgs[i + d]) return imgs[i + d];
    }
    return null;
  }

  // Sizing, plus the zoom (and its origin) that lands the photo on the first video frame.
  // The façade spans ~97% of the photo width and ~90.6% of the first frame; the frame centre
  // sits at ~(52%, 48.6%) of the photo.
  let W = 0, H = 0, dpr = 1, zoomEnd = 1.1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    film.width = Math.round(W * dpr); film.height = Math.round(H * dpr);
    const sF = Math.max(W / 1280, H / 720);
    const contain = getComputedStyle(photo).objectFit === "contain";
    const sP = contain ? Math.min(W / 1053, H / 849) : Math.max(W / 1053, H / 849);
    const dw = 1053 * sP, dh = 849 * sP;
    const ox = (W - dw) / 2, oy = contain ? (H - dh) * 0.24 : (H - dh) / 2;
    zoomEnd = clamp((sF * 1280 * 0.906) / (dw * 0.97), 1, 4.5) * (contain ? 1 : 1.05);
    const px = ox + dw * 0.52, py = oy + dh * 0.486;
    if (zoomEnd > 1.001) {
      const s = zoomEnd;
      photo.style.transformOrigin = `${(W / 2 - s * px) / (1 - s)}px ${(H / 2 - s * py) / (1 - s)}px`;
    }
    dirty = true;
  }
  let lastDrawn = -1;
  function draw(i) {
    const im = nearest(i);
    if (!im) return false;
    const iw = im.naturalWidth, ih = im.naturalHeight;
    const s = Math.max(film.width / iw, film.height / ih);
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(im, (film.width - dw) / 2, (film.height - dh) / 2, dw, dh);
    return true;
  }

  const band01 = (p, a, b, e = 0.035) => clamp(Math.min((p - a) / e, (b - p) / e), 0, 1);
  const RAIL = [0, 0.2, 0.47, 0.74];

  function apply(p) {
    // Outside: the photo eases towards the door, the title lifts away faster (depth)
    const a = smooth(clamp(p / 0.17, 0, 1));
    photo.style.transform = `scale(${1 + (zoomEnd - 1) * a})`;
    const ip = clamp(p / 0.1, 0, 1);
    intro.style.transform = `translate3d(0,${-ip * 110}px,0)`;
    intro.style.opacity = String(1 - ip);
    intro.style.visibility = ip >= 1 ? "hidden" : "visible";

    // Cross-fade into the walk-through once its first frame is ready
    const x = imgs[0] ? smooth(clamp((p - 0.13) / 0.07, 0, 1)) : 0;
    film.style.opacity = String(x);
    // once fully covered, drop the (large, zoomed) photo layer to spare GPU memory on phones
    photo.style.visibility = x >= 1 ? "hidden" : "visible";
    film.style.transform = `scale(${1.05 - 0.05 * smooth(clamp((p - 0.1) / 0.25, 0, 1))})`;

    // Inside: the video frame follows the scroll position, forwards and backwards
    const fi = Math.round(clamp((p - 0.17) / (0.97 - 0.17), 0, 1) * (idx.length - 1));
    if ((fi !== lastDrawn || dirty) && x > 0 && draw(fi)) { lastDrawn = fi; dirty = false; }

    for (const c of caps) {
      const o = band01(p, c.a, c.b);
      c.el.style.opacity = String(o);
      c.el.style.transform = `translate3d(0,${(1 - o) * 14}px,0)`;
      c.el.style.visibility = o > 0.01 ? "visible" : "hidden";
      if (o > 0.5) c.el.removeAttribute("inert"); else c.el.setAttribute("inert", "");
    }
    if (railFill) railFill.style.transform = `scaleY(${p})`;
    railItems.forEach((li, i) => li.classList.toggle("on", p >= RAIL[i] && (i === RAIL.length - 1 || p < RAIL[i + 1])));
  }

  // When the tour ends, the stage sinks slower than the page and darkens
  // while the next section slides over it.
  let lastE = -1;
  function exit(r) {
    const e = clamp((H - r.bottom) / H, 0, 1);
    if (e === lastE) return;
    lastE = e;
    stage.style.transform = e ? `translate3d(0,${(e * H * 0.45).toFixed(1)}px,0) scale(${(1 - 0.08 * e).toFixed(4)})` : "";
    exitShade.style.opacity = (e * 0.75).toFixed(3);
  }

  // Visual progress eases towards the scroll position (the page itself scrolls natively)
  let cur = 0, lastP = -1, raf = 0;
  function tick() {
    raf = 0;
    const r = tour.getBoundingClientRect();
    const total = r.height - H;
    const t = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    cur += (t - cur) * 0.2;
    if (Math.abs(t - cur) < 0.0004) cur = t;
    if (cur !== lastP || dirty) { apply(cur); lastP = cur; }
    exit(r);
    if (cur !== t) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener("scroll", kick, { passive: true });

  // Mouse parallax on the storefront / walk-through (idea from the ScrollVideo kit), desktop only:
  // the picture drifts against the pointer, the text slightly with it, for depth.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const sceneEl = $(".scene", tour), capsEl = $(".caps", tour);
    let mx = 0, my = 0, cx = 0, cy = 0, mr = 0;
    sceneEl.style.transform = "scale(1.05)";
    const mstep = () => {
      mr = 0;
      cx += (mx - cx) * 0.07; cy += (my - cy) * 0.07;
      sceneEl.style.transform = `translate3d(${(-cx * 22).toFixed(2)}px,${(-cy * 14).toFixed(2)}px,0) scale(1.05)`;
      intro.style.translate = `${(cx * 10).toFixed(2)}px ${(cy * 6).toFixed(2)}px`;
      if (capsEl) capsEl.style.translate = `${(cx * 8).toFixed(2)}px ${(cy * 5).toFixed(2)}px`;
      if (Math.abs(mx - cx) > 0.0005 || Math.abs(my - cy) > 0.0005) mr = requestAnimationFrame(mstep);
    };
    addEventListener("mousemove", e => {
      mx = e.clientX / innerWidth * 2 - 1;
      my = e.clientY / innerHeight * 2 - 1;
      const r = tour.getBoundingClientRect();
      if (!mr && r.bottom > 0 && r.top < innerHeight) mr = requestAnimationFrame(mstep);
    }, { passive: true });
  }

  let rz = 0;
  new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { size(); lastP = -1; kick(); queue(); }); }).observe(stage);
  size();
  { const r = tour.getBoundingClientRect(); const total = r.height - H; cur = total > 0 ? clamp(-r.top / total, 0, 1) : 0; }
  apply(cur); lastP = cur;
  exit(tour.getBoundingClientRect());
})();
