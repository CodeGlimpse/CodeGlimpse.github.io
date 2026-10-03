(() => {
  "use strict";
  for (const root of document.querySelectorAll("[data-gallery]")) {
    const slides = Array.from(root.querySelectorAll("[data-gallery-slide]"));
    const thumbnails = Array.from(root.querySelectorAll("[data-gallery-select]"));
    const controls = root.querySelector("[data-gallery-controls]");
    const thumbnailBar = root.querySelector("[data-gallery-thumbnails]");
    const previous = root.querySelector("[data-gallery-previous]");
    const next = root.querySelector("[data-gallery-next]");
    const counter = root.querySelector("[data-gallery-counter]");
    const status = root.querySelector("[data-gallery-status]");
    const keyboardNote = root.querySelector("[data-gallery-keyboard-note]");
    if (!slides.length || thumbnails.length !== slides.length ||
        ![controls, thumbnailBar, previous, next, counter, status, keyboardNote].every(Boolean) ||
        thumbnails.some((button, index) => Number(button.dataset.gallerySelect) !== index)) continue;

    let current = 0;
    const focusButton = root.querySelector('[data-gallery-focus-toggle]');
    function focusImage(enabled) {
      root.dataset.galleryFocus = String(enabled);
      focusButton.setAttribute('aria-pressed', String(enabled));
      focusButton.querySelector('[data-gallery-focus-label]').textContent = enabled ? '恢复文字' : '只看影像';
    }
    if (focusButton) {
      focusButton.hidden = false;
      focusButton.disabled = false;
      focusButton.addEventListener('click', () => focusImage(root.dataset.galleryFocus !== 'true'));
    }
    function show(index, announce = true) {
      current = (index + slides.length) % slides.length;
      const focused = document.activeElement;
      const returnFocus = focused && slides.some((slide, candidate) => candidate !== current && slide.contains(focused));
      slides.forEach((slide, candidate) => {
        const selected = candidate === current;
        slide.hidden = !selected;
        slide.dataset.current = String(selected);
      });
      thumbnails.forEach((button, candidate) => button.setAttribute("aria-pressed", String(candidate === current)));
      const position = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      counter.textContent = position;
      if (announce) status.textContent = `${position} · ${slides[current].dataset.galleryTitle}`;
      root.dataset.galleryCurrent = String(current);
      if (returnFocus) root.focus({ preventScroll: true });
    }

    previous.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
    thumbnails.forEach((button, index) => button.addEventListener("click", () => show(index)));
    root.addEventListener("keydown", (event) => {
      if (event.key === 'Escape' && focusButton && root.dataset.galleryFocus === 'true') {
        event.preventDefault();
        focusImage(false);
        focusButton.focus({ preventScroll: true });
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest("input, textarea, select, [contenteditable]")) return;
      const targets = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      show(targets[event.key]);
    });
    show(0, false);
    root.setAttribute("role", "region");
    root.tabIndex = 0;
    root.dataset.galleryReady = "true";
    counter.setAttribute("aria-live", "off");
    controls.hidden = false;
    thumbnailBar.hidden = false;
    status.hidden = false;
    keyboardNote.hidden = slides.length < 2;
    previous.disabled = next.disabled = slides.length < 2;
    previous.hidden = next.hidden = slides.length < 2;
    for (const button of thumbnails) button.disabled = false;
  }
})();
