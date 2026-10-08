/* Contact form → opens WhatsApp with a pre-filled message. */
(() => {
  "use strict";
  const form = document.getElementById("contactForm");
  if (!form) return;
  const select = form.elements.service;

  // Populate services from config (add a service in config.js → appears here)
  [...SAM.services.map(s => s.title), "Other / Not sure"].forEach(t => select.add(new Option(t, t)));
  const pre = new URLSearchParams(location.search).get("service");
  if (pre) select.value = pre;

  // Direct WhatsApp button on this page
  document.getElementById("waDirect").href =
    `https://wa.me/${SAM.whatsapp}?text=${encodeURIComponent(SAM.whatsappMessage)}`;

  const rules = {
    name:    v => v.trim().length >= 2 || "Please enter your name.",
    phone:   v => /^\+?[\d\s-]{7,16}$/.test(v.trim()) || "Enter a valid phone number.",
    service: v => !!v || "Please choose a service.",
    message: v => v.trim().length >= 5 || "Please tell us a little more."
  };

  const check = el => {
    const r = rules[el.name](el.value), box = el.closest(".field");
    box.classList.toggle("err", r !== true);
    box.querySelector("small").textContent = r === true ? "" : r;
    return r === true;
  };
  Object.keys(rules).forEach(n => form.elements[n].addEventListener("input", e => check(e.target)));

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!Object.keys(rules).map(n => check(form.elements[n])).every(Boolean)) return;
    const f = form.elements;
    const text = `Hello SAM AI,\n\n*Name:* ${f.name.value.trim()}\n*Phone:* ${f.phone.value.trim()}\n*Service:* ${f.service.value}\n*Message:* ${f.message.value.trim()}`;
    const url = `https://wa.me/${SAM.whatsapp}?text=${encodeURIComponent(text)}`;
    const w = window.open(url, "_blank"); // iOS/popup-blocker fallback below
    if (w) w.opener = null; else location.href = url;
    document.getElementById("formNote").textContent = "Opening WhatsApp… tap Send to deliver your message.";
  });
})();
