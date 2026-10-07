(() => {
  "use strict";
  const root = document.querySelector("[data-editorial]");
  if (!root) return;
  const chapters = Array.from(root.querySelectorAll("[data-editorial-chapter]"));
  const links = Array.from(root.querySelectorAll("[data-editorial-target]"));
  const status = root.querySelector("[data-editorial-status]");
  if (!chapters.length || !links.length || !status) return;

  let frame = 0;
  function update() {
    frame = 0;
    const marker = Math.min(window.innerHeight * 0.4, 320);
    let current = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= marker) current = chapter;
    }
    for (const chapter of chapters) chapter.dataset.active = String(chapter === current);
    for (const link of links) {
      if (link.dataset.editorialTarget === current.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    root.dataset.editorialCurrent = current.id;
    status.textContent = `${current.dataset.chapterNumber} / ${String(chapters.length).padStart(2, "0")}`;
  }
  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  update();
  status.hidden = false;
  root.dataset.editorialReady = "true";
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.dataset.inView = String(entry.isIntersecting);
    }, { threshold: 0.15 });
    for (const chapter of chapters) observer.observe(chapter);
  }
})();
