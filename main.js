(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = innerWidth < 760;
  const loader = $("#loader");
  const hideLoader = () => { if (loader) loader.style.display = "none"; };

  /* ---------- Config-driven UI (works without any library) ---------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
  const wa = $("#waBtn");
  if (wa) wa.href = `https://wa.me/${SAM.whatsapp}?text=${encodeURIComponent(SAM.whatsappMessage)}`;

  const grid = $("#serviceGrid");
  if (grid) {
    const enquire = grid.hasAttribute("data-enquire");
    grid.innerHTML = SAM.services.map(s =>
      `<article class="glass card reveal"><div class="ico">${s.icon}</div><h3>${s.title}</h3><p>${s.text}</p>` +
      (enquire ? `<a class="card-link" href="contact.html?service=${encodeURIComponent(s.title)}">Enquire <span>→</span></a>` : "") +
      `</article>`).join("");
  }

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger"), menu = $("#menu");
  const setMenu = open => {
    burger.classList.toggle("open", open); menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", () => setMenu(false));
  addEventListener("resize", () => { if (innerWidth > 760) setMenu(false); });

  /* ---------- Fallback if animation libraries fail to load ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove("js"); hideLoader();
    counters.forEach(el => el.textContent = el.dataset.count + (el.dataset.suffix || ""));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let scrollY = window.scrollY;
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on("scroll", e => { ScrollTrigger.update(); scrollY = e.scroll; });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else addEventListener("scroll", () => scrollY = window.scrollY, { passive: true });

  /* ---------- Intro timeline (plays after the loader) ---------- */
  gsap.set(".line span", { yPercent: 110 });
  gsap.set(".hero .reveal", { y: 24 });
  const intro = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
    .from(".nav", { y: -60, opacity: 0, duration: 1 })
    .to(".line span", { yPercent: 0, duration: 1.3, stagger: .15 }, "-=.6")
    .to(".hero .reveal", { opacity: 1, y: 0, duration: 1, stagger: .12 }, "-=.8");

  /* ---------- Premium loader ---------- */
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    try { sessionStorage.setItem("sam", "1"); } catch (e) {}
    if (!loader) return intro.play();
    gsap.to(loader, { yPercent: -100, duration: .9, ease: "power4.inOut", onComplete: hideLoader });
    gsap.delayedCall(.45, () => intro.play());
  };
  if (root.classList.contains("skip") || !loader) { hideLoader(); intro.play(); done = true; }
  else {
    const bar = $("#ldBar"), num = $("#ldNum"), p = { v: 0 };
    const loaded = new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r));
    new Promise(r => gsap.to(p, {
      v: 100, duration: reduce ? .4 : 1.7, ease: "power2.inOut", onComplete: r,
      onUpdate: () => { bar.style.transform = `scaleX(${p.v / 100})`; num.textContent = Math.round(p.v); }
    })).then(() => loaded).then(finish);
    setTimeout(finish, 4500); // failsafe
  }

  /* ---------- Scroll reveals ---------- */
  gsap.utils.toArray(".reveal").filter(el => !el.closest(".hero")).forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 60, scale: .96 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out", delay: (i % 4) * .06,
        scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
  counters.forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => el.textContent = Math.round(o.v) + (el.dataset.suffix || "") });
  });
  if ($(".hero-title")) gsap.to(".hero-title", { yPercent: -15, ease: "none",
    scrollTrigger: { trigger: ".hero", scrub: true, start: "top top", end: "bottom top" } });
  addEventListener("load", () => ScrollTrigger.refresh());

  /* ---------- Card tilt + glow follow (desktop / hover devices) ---------- */
  if (!mobile && matchMedia("(hover:hover)").matches) {
    document.querySelectorAll(".card").forEach(c => {
      c.addEventListener("mousemove", e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
        gsap.to(c, { rotateY: (x - .5) * 10, rotateX: (.5 - y) * 10, transformPerspective: 900, duration: .4, overwrite: "auto" });
      });
      c.addEventListener("mouseleave", () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: .6, overwrite: "auto" }));
    });
  }

  /* ---------- Three.js 3D scene ---------- */
  const canvas = $("#bg3d");
  if (!window.THREE || !canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { canvas.style.display = "none"; return; } // WebGL unavailable: site still works
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 100);
  const group = new THREE.Group(); scene.add(group);
  const wire = (geo, color, opacity) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity }));
  const core = wire(new THREE.IcosahedronGeometry(1.7, 1), 0x1e90ff, .55);
  const inner = wire(new THREE.IcosahedronGeometry(1.1, 0), 0x00d4ff, .9);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, .012, 8, 140), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: .6 }));
  ring.rotation.x = 1.2;
  const ring2 = ring.clone(); ring2.scale.setScalar(1.35); ring2.rotation.set(.4, 1, 0);
  group.add(core, inner, ring, ring2);

  const N = mobile ? 600 : 1600, pos = new Float32Array(N * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - .5) * 28;
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x66bbff, size: .035, transparent: true, opacity: .7 }));
  scene.add(stars);

  let lastW = 0, lastH = 0;
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 150) return; // ignore iOS address-bar jitter
    lastW = w; lastH = h;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w < 760 ? 9.5 : 7; camera.updateProjectionMatrix();
    group.position.x = w < 760 ? 0 : 2.4;
  };
  resize(); addEventListener("resize", resize);

  let mx = 0, my = 0, pulse = 0, visible = true;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  addEventListener("pointerdown", () => pulse = 1, { passive: true });
  document.addEventListener("visibilitychange", () => visible = !document.hidden);

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime(), s = scrollY / 1000;
    if (!reduce) {
      core.rotation.set(t * .15 + s, t * .2, 0);
      inner.rotation.set(-t * .3, -t * .25 + s, 0);
      ring.rotation.z = t * .2; ring2.rotation.z = -t * .15;
      stars.rotation.y = t * .01 + s * .1;
      group.position.y += (-my * .6 - scrollY * .0012 - group.position.y) * .05;
      group.rotation.y += (mx * .8 - group.rotation.y) * .05;
    }
    pulse *= .92;
    core.scale.setScalar(1 + Math.sin(t * 1.2) * .03 + pulse * .25);
    renderer.render(scene, camera);
  })();
})();
