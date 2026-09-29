/* =========================================================
   PAPA BEAR — interactions & animations
   GSAP + ScrollTrigger + Lenis (graceful fallback if missing)
   ========================================================= */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animate = hasGSAP && !reduceMotion;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  root.classList.add("js");
  if (animate) root.classList.add("anim");
  body.classList.add("is-loading");
  $("#year").textContent = new Date().getFullYear();

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ force3D: true });
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (animate && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = (hash) => {
    const target = hash === "#top" ? 0 : $(hash);
    if (target === null) return;
    if (lenis) lenis.scrollTo(target, { offset: hash === "#top" ? 0 : -70 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href");
      if (hash.length < 2) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(hash);
    });
  });

  /* ---------- Split text into masked words ---------- */
  const splitWords = (el) => {
    const frag = document.createDocumentFragment();
    const addWord = (word, className) => {
      const outer = document.createElement("span");
      outer.className = "w";
      const inner = document.createElement("span");
      if (className) inner.className = className;
      inner.textContent = word;
      outer.appendChild(inner);
      frag.appendChild(outer);
      frag.appendChild(document.createTextNode(" "));
    };
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/\s+/).filter(Boolean).forEach((w) => addWord(w));
      } else if (node.nodeName === "BR") {
        frag.appendChild(document.createElement("br"));
      } else {
        node.textContent.split(/\s+/).filter(Boolean).forEach((w) => addWord(w, node.className));
      }
    });
    el.replaceChildren(frag);
  };
  if (animate) $$(".split").forEach(splitWords);

  /* ---------- Button text roll (text slides up, copy slides in) ---------- */
  const makeRoll = (text) => {
    const roll = document.createElement("span");
    roll.className = "roll";
    const inner = document.createElement("span");
    inner.dataset.text = text;
    inner.textContent = text;
    roll.appendChild(inner);
    return roll;
  };
  $$(".btn > span").forEach((el) => {
    const text = el.textContent.trim();
    if (text) el.replaceChildren(makeRoll(text));
  });
  $$(".link-arrow").forEach((el) => {
    const node = el.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      node.replaceWith(makeRoll(node.textContent.trim()), " ");
    }
  });

  /* ---------- Preloader (short: waits for fonts, not every image) ---------- */
  const preloader = $("#preloader");
  const countEl = $("#loadCount");
  const barEl = $(".preloader__bar span", preloader);

  const finishLoading = () => {
    body.classList.remove("is-loading");
    if (lenis) lenis.start();
    if (!animate) {
      preloader.remove();
      $$(".step").forEach((s) => s.classList.add("is-active"));
      return;
    }
    gsap.to(preloader, { yPercent: -100, duration: 0.8, ease: "power4.inOut", onComplete: () => preloader.remove() });
    heroIntro();
  };

  if (!animate) {
    finishLoading();
  } else {
    gsap.set(".hero__title .word", { yPercent: 115 });
    gsap.set("[data-hero]", { autoAlpha: 0, y: 30 });
    gsap.set(".hero__bear", { autoAlpha: 0, scale: 0.7, rotate: -8 });
    gsap.set(".orbit", { autoAlpha: 0, scale: 0.6 });
    gsap.set(".chip", { autoAlpha: 0, scale: 0.4 });
    gsap.set(".header__inner", { yPercent: -150, autoAlpha: 0 });

    const progress = { v: 0 };
    barEl.style.width = "100%";
    barEl.style.transformOrigin = "left";
    const render = () => {
      countEl.textContent = Math.round(progress.v);
      barEl.style.transform = `scaleX(${progress.v / 100})`;
    };
    render();

    const ready = Promise.race([
      Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 450))]),
      new Promise((r) => setTimeout(r, 1500)), // never block longer than this
    ]);
    gsap.to(progress, { v: 85, duration: 0.45, ease: "power2.out", onUpdate: render });
    ready.then(() =>
      gsap.to(progress, { v: 100, duration: 0.25, ease: "power2.in", overwrite: true, onUpdate: render, onComplete: finishLoading })
    );
  }

  function heroIntro() {
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: "power4.out" } });
    tl.to(".header__inner", { yPercent: 0, autoAlpha: 1, duration: 1 }, 0)
      .to(".hero__title .word", { yPercent: 0, duration: 1.1, stagger: 0.06 }, 0.05)
      .to("[data-hero]", { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.35)
      .to(".orbit", { autoAlpha: 1, scale: 1, duration: 1.5, stagger: 0.1, ease: "expo.out" }, 0.15)
      .to(".hero__bear", { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.5, ease: "expo.out" }, 0.25)
      .to(".chip", { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(2)" }, 0.75)
      .add(floatChips, 1.5);
  }

  function floatChips() {
    $$("[data-float]").forEach((chip, i) => {
      gsap.to(chip, {
        y: i % 2 ? 14 : -14,
        x: i % 2 ? -6 : 6,
        duration: 2.6 + i * 0.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  /* ---------- Header behaviour (rAF-throttled) ---------- */
  const header = $("#header");
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 600 && y > lastY && !body.classList.contains("menu-open"));
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  function closeMenu() {
    if (!body.classList.contains("menu-open")) return;
    body.classList.remove("menu-open");
    burger.classList.remove("is-open");
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", () => {
    if (body.classList.contains("menu-open")) return closeMenu();
    body.classList.add("menu-open");
    burger.classList.add("is-open");
    menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Sliding nav indicator ---------- */
  const nav = $("#nav");
  const pill = $(".nav__pill", nav);
  const movePill = (link) => {
    if (!link) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1;
    pill.style.width = link.offsetWidth + "px";
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  const activeLink = () => $(".nav__link.is-active", nav);
  $$(".nav__link", nav).forEach((l) => l.addEventListener("mouseenter", () => movePill(l)));
  nav.addEventListener("mouseleave", () => movePill(activeLink()));

  /* ---------- Custom cursor (with labels) ---------- */
  if (finePointer && hasGSAP) {
    const cursor = $(".cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const label = $(".cursor__label", cursor);
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 });
    const dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    let shown = false;
    window.addEventListener("mousemove", (e) => {
      if (!shown) {
        shown = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
      }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener("mouseover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const hoverable = e.target.closest("a, button");
      const overButton = hoverable && labelled && labelled.contains(hoverable) && hoverable !== labelled;
      const showLabel = labelled && !overButton;
      cursor.classList.toggle("has-label", !!showLabel);
      cursor.classList.toggle("is-hover", !showLabel && !!hoverable);
      if (showLabel) label.textContent = labelled.dataset.cursor;
    });
    document.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }));
    document.addEventListener("mouseenter", () => shown && gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }));
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && animate) {
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      let rect = null;
      el.addEventListener("mouseenter", () => { rect = el.getBoundingClientRect(); });
      el.addEventListener("mousemove", (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * 0.3);
        yTo((e.clientY - (rect.top + rect.height / 2)) * 0.4);
      });
      el.addEventListener("mouseleave", () => { rect = null; xTo(0); yTo(0); });
    });
  }

  /* ---------- Spotlight + 3D tilt (rect cached on enter) ---------- */
  if (finePointer) {
    $$(".spotlight, .tilt").forEach((el) => {
      const isTilt = animate && el.classList.contains("tilt");
      const isSpot = el.classList.contains("spotlight");
      const max = parseFloat(el.dataset.tiltMax || 8);
      let rect = null, rX, rY;
      if (isTilt) {
        gsap.set(el, { transformPerspective: 1000 });
        rX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
        rY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
      }
      el.addEventListener("pointerenter", () => { rect = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (isSpot) { el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`); }
        if (isTilt) { rY((x / rect.width - 0.5) * max * 2); rX(-(y / rect.height - 0.5) * max * 2); }
      });
      el.addEventListener("pointerleave", () => { rect = null; if (isTilt) { rX(0); rY(0); } });
    });
  }

  /* ---------- Hero mouse parallax (layers at different depths) ---------- */
  if (finePointer && animate) {
    const hero = $(".hero");
    const layers = $$(".hero__layer").map((el) => ({
      d: parseFloat(el.dataset.depth),
      x: gsap.quickTo(el, "x", { duration: 1, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 1, ease: "power3" }),
    }));
    const glowX = gsap.quickTo(".hero__glow--1", "x", { duration: 2, ease: "power2" });
    const glowY = gsap.quickTo(".hero__glow--1", "y", { duration: 2, ease: "power2" });
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * 30 * l.d); l.y(ny * 30 * l.d); });
      glowX(nx * 120); glowY(ny * 120);
    });
    hero.addEventListener("pointerleave", () => layers.forEach((l) => { l.x(0); l.y(0); }));
  }

  /* ---------- Gold dust particles (sprite-based, no per-frame shadowBlur) ---------- */
  const canvas = $("#particles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    const mouse = { x: -9999, y: -9999 };
    let w, h, particles = [], running = true, raf;

    // Pre-render one glowing dot, then just stamp it with drawImage
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext("2d");
    const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255, 240, 190, 1)");
    g.addColorStop(0.25, "rgba(245, 215, 122, 0.9)");
    g.addColorStop(0.6, "rgba(212, 175, 55, 0.25)");
    g.addColorStop(1, "rgba(212, 175, 55, 0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 32, 32);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(finePointer ? 70 : 35, (w * h) / 18000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random() * 7 + 3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.35 + 0.08),
        a: Math.random() * 0.6 + 0.25,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.t += 0.02;
        p.x += p.vx + Math.sin(p.t) * 0.12;
        p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const dist = Math.sqrt(d2) || 1; p.x += (dx / dist) * 1.4; p.y += (dy / dist) * 1.4; }
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        ctx.globalAlpha = p.a * (0.6 + Math.sin(p.t * 1.5) * 0.4);
        ctx.drawImage(sprite, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const setRunning = (on) => {
      cancelAnimationFrame(raf);
      running = on;
      if (running) raf = requestAnimationFrame(draw);
    };
    let heroVisible = true;

    resize();
    let rT;
    window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(resize, 150); });
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      setRunning(heroVisible && !document.hidden);
    }).observe(hero);
    document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));
  }

  /* ---------- Pause CSS loops in sections that are off-screen ---------- */
  const pauseIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-paused", !e.isIntersecting));
  }, { rootMargin: "100px" });
  $$(".hero, .marquee, .business, .cta, .footer").forEach((el) => pauseIO.observe(el));

  if (!animate) return;

  /* =========================================================
     Scroll-driven animations
     ========================================================= */
  const mm = gsap.matchMedia();

  // Scroll progress bar
  gsap.to(".scroll-progress span", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  // Hero parallax on exit
  gsap.to(".hero__visual", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  mm.add("(min-width: 901px)", () => {
    gsap.to(".hero__content", {
      yPercent: -12,
      autoAlpha: 0.2,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "center center", end: "bottom top", scrub: true },
    });
  });

  // Marquee skews with scroll velocity
  const skewTo = gsap.quickTo(".marquee__skew", "skewX", { duration: 0.5, ease: "power3" });
  ScrollTrigger.create({
    onUpdate: (self) => skewTo(gsap.utils.clamp(-12, 12, self.getVelocity() / -250)),
  });
  ScrollTrigger.addEventListener("scrollEnd", () => skewTo(0));

  // Statement — words light up one by one as you scroll
  const statement = $("#statement");
  if (statement) {
    const words = [];
    const frag = document.createDocumentFragment();
    const addWord = (text, gold) => {
      const s = document.createElement("span");
      s.className = gold ? "sw is-gold" : "sw";
      s.textContent = text;
      words.push(s);
      frag.appendChild(s);
    };
    statement.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (part.trim()) addWord(part, false);
          else if (part) frag.appendChild(document.createTextNode(" "));
        });
      } else if (node.nodeName === "EM") {
        node.textContent.split(/\s+/).filter(Boolean).forEach((part, i) => {
          if (i) frag.appendChild(document.createTextNode(" "));
          addWord(part, true);
        });
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    statement.replaceChildren(frag);
    let lastLit = -1;
    ScrollTrigger.create({
      trigger: statement,
      start: "top 80%",
      end: "bottom 45%",
      onUpdate: (self) => {
        const lit = Math.round(self.progress * words.length);
        if (lit === lastLit) return;
        words.forEach((wd, i) => wd.classList.toggle("is-lit", i < lit));
        lastLit = lit;
      },
    });
    gsap.from(".statement__icon", {
      scale: 0,
      rotate: -30,
      duration: 0.9,
      stagger: 0.15,
      ease: "back.out(2)",
      scrollTrigger: { trigger: statement, start: "top 75%" },
    });
  }

  // Eyebrow lines grow in
  $$(".eyebrow").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => el.classList.add("is-in") });
  });

  // Split-word headings
  $$(".split").forEach((el) => {
    gsap.from($$(".w > span", el), {
      yPercent: 110,
      rotate: 4,
      duration: 1.1,
      stagger: 0.05,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // Generic reveals
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    onEnter: (els) => gsap.from(els, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "power3.out", overwrite: true }),
    once: true,
  });

  // Bento cards — 3D flip up + image un-zoom
  gsap.set(".bento .card", { autoAlpha: 0 });
  ScrollTrigger.batch(".bento .card", {
    start: "top 92%",
    onEnter: (els) => {
      gsap.fromTo(els,
        { y: 100, rotationX: -25, transformPerspective: 1200, transformOrigin: "50% 100%", autoAlpha: 0 },
        { y: 0, rotationX: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }
      );
      gsap.from(els.map((c) => $(".card__media img", c)), { scale: 1.3, duration: 1.6, stagger: 0.1, ease: "power3.out" });
    },
    once: true,
  });

  // Platforms
  gsap.from(".platform", {
    y: 100,
    autoAlpha: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: "power4.out",
    scrollTrigger: { trigger: ".platforms__grid", start: "top 85%" },
  });
  gsap.from(".platform__img img", {
    y: 60,
    rotate: (i) => [-10, 0, 10][i],
    duration: 1.4,
    stagger: 0.15,
    ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".platforms__grid", start: "top 85%" },
  });

  // Collage parallax + reveal
  $$("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed);
    gsap.fromTo(el, { yPercent: -speed * 100 }, {
      yPercent: speed * 100,
      ease: "none",
      scrollTrigger: { trigger: ".love", start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.from(el, {
      clipPath: "inset(100% 0% 0% 0%)",
      duration: 1.4,
      ease: "power4.inOut",
      scrollTrigger: { trigger: ".love__collage", start: "top 80%" },
    });
    gsap.from($("img", el), {
      scale: 1.35,
      duration: 1.8,
      ease: "power3.out",
      scrollTrigger: { trigger: ".love__collage", start: "top 80%" },
    });
  });

  // Categories: curtain reveal, then pinned horizontal scroll on desktop
  gsap.from(".cat", {
    clipPath: "inset(100% 0% 0% 0% round 22px)",
    duration: 1.3,
    stagger: 0.12,
    ease: "power4.inOut",
    scrollTrigger: { trigger: ".cats", start: "top 85%" },
  });

  mm.add("(min-width: 1101px)", () => {
    const track = $(".cats");
    const section = $(".categories");
    const inner = $(".container", section);
    const distance = () => Math.max(0, track.scrollWidth - inner.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + Math.max(700, distance() * 2.2),
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(".cats__hint i", { scaleX: self.progress }),
      },
    });
    // Images drift inside their cards while the row moves
    $$(".cat img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -6, scale: 1.18 }, {
        xPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
      });
    });
  });
  mm.add("(max-width: 1100px)", () => {
    gsap.from(".cat img", {
      scale: 1.4,
      duration: 1.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ".cats", start: "top 85%" },
    });
  });

  // Business panel
  gsap.from(".business__panel", {
    y: 80,
    autoAlpha: 0,
    scale: 0.96,
    duration: 1.3,
    ease: "power4.out",
    scrollTrigger: { trigger: ".business", start: "top 80%" },
  });
  gsap.from(".business__photo", {
    x: 80,
    rotate: 6,
    autoAlpha: 0,
    duration: 1.4,
    ease: "power4.out",
    scrollTrigger: { trigger: ".business__visual", start: "top 80%" },
  });
  gsap.fromTo(".business__photo img", { scale: 1.25 }, {
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: ".business__visual", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.from(".notif", {
    y: 40,
    scale: 0.8,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.2,
    delay: 0.5,
    ease: "back.out(1.8)",
    scrollTrigger: { trigger: ".business__visual", start: "top 80%" },
  });
  $$(".notif").forEach((n, i) => {
    gsap.to(n, { yPercent: i % 2 ? 16 : -16, duration: 2.8 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
  });
  gsap.from(".perk__ico", {
    scale: 0,
    rotate: -90,
    duration: 0.8,
    stagger: 0.12,
    ease: "back.out(2)",
    scrollTrigger: { trigger: ".perks", start: "top 85%" },
  });

  // Steps progress line
  const steps = $$(".step");
  mm.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)" }, (ctx) => {
    const prop = ctx.conditions.desktop ? "scaleX" : "scaleY";
    gsap.fromTo(".steps__line span", { [prop]: 0 }, {
      [prop]: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".steps",
        start: "top 70%",
        end: ctx.conditions.desktop ? "top 30%" : "bottom 60%",
        scrub: 0.5,
        onUpdate: (self) => {
          steps.forEach((s, i) => s.classList.toggle("is-active", self.progress >= i / (steps.length - 1) - 0.02));
        },
      },
    });
  });
  gsap.from(".step", {
    y: 50,
    autoAlpha: 0,
    duration: 1,
    stagger: 0.15,
    ease: "power3.out",
    scrollTrigger: { trigger: ".steps", start: "top 85%" },
  });

  // CTA card zoom in
  gsap.from(".cta__card", {
    scale: 0.88,
    borderRadius: 80,
    duration: 1.4,
    ease: "power4.out",
    scrollTrigger: { trigger: ".cta", start: "top 85%" },
  });
  gsap.fromTo(".cta__bear", { rotate: -30, y: 80 }, {
    rotate: -8,
    y: 0,
    ease: "none",
    scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
  });

  // Footer giant word — letters rise in, then wave on hover
  const big = $(".footer__big");
  if (big) {
    big.replaceChildren(...[...big.textContent].map((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? " " : c;
      return s;
    }));
    const chars = $$(".ch", big);
    gsap.from(chars, {
      yPercent: 100,
      rotate: 12,
      autoAlpha: 0,
      duration: 1.2,
      stagger: 0.05,
      ease: "power4.out",
      scrollTrigger: { trigger: ".footer", start: "top 90%" },
    });
    if (finePointer) {
      chars.forEach((ch, i) => ch.addEventListener("mouseenter", () => {
        chars.forEach((c, j) => {
          const d = Math.abs(i - j);
          if (d > 2) return;
          gsap.fromTo(c, { y: 0 }, { y: -30 + d * 10, duration: 0.35, ease: "power2.out", yoyo: true, repeat: 1, overwrite: "auto" });
        });
      }));
    }
  }

  // Active nav link + indicator
  $$(".nav__link").forEach((link) => {
    const section = $(link.getAttribute("href"));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        link.classList.toggle("is-active", self.isActive);
        if (!nav.matches(":hover")) movePill(activeLink());
      },
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
