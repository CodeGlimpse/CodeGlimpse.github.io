(() => {
  "use strict";
  const main = document.querySelector("main#main");
  const progress = document.querySelector("[data-reading-progress]");
  const meter = progress?.querySelector("[data-reading-meter]");
  const value = progress?.querySelector("[data-reading-value]");
  if (!main || !progress || !meter || !value) return;

  let frame = 0;
  function update() {
    frame = 0;
    const bounds = main.getBoundingClientRect();
    const start = bounds.top + window.scrollY;
    const distance = Math.max(1, bounds.height - window.innerHeight);
    const percentage = Math.round(Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100)));
    meter.value = percentage;
    meter.setAttribute("aria-valuetext", `已阅读 ${percentage}%`);
    value.textContent = `${percentage}%`;
    progress.dataset.readingPercent = String(percentage);
  }
  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  progress.hidden = false;
  progress.dataset.readingReady = "true";
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule, { once: true });
  main.addEventListener("load", schedule, true);
  if (document.fonts?.ready) document.fonts.ready.then(schedule);
})();
