(() => {
  "use strict";
  const root = document.querySelector("[data-archive]");
  if (!root) return;
  const preview = root.querySelector("[data-archive-preview]");
  if (!preview) return;
  const media = preview.querySelector("[data-archive-preview-media]");
  const title = preview.querySelector("[data-archive-preview-title]");
  const category = preview.querySelector("[data-archive-preview-category]");
  const summary = preview.querySelector("[data-archive-preview-summary]");
  const detail = preview.querySelector("[data-archive-preview-detail]");
  const number = preview.querySelector("[data-archive-preview-number]");
  const status = preview.querySelector("[data-archive-status]");
  const records = Array.from(root.querySelectorAll("[data-archive-entry]")).map((element) => ({
    element,
    image: element.querySelector(".archive-entry-media img"),
    title: element.querySelector("[data-archive-detail]"),
    category: element.querySelector("[data-archive-category]"),
    summary: element.querySelector("[data-archive-summary]"),
    button: element.querySelector("[data-archive-preview-button]")
  }));
  if (![media, title, category, summary, detail, number, status].every(Boolean) || !records.length ||
      records.some((record) => ![record.image, record.title, record.category, record.summary, record.button].every(Boolean))) return;

  function show(index, userInitiated = false) {
    const record = records[index];
    const image = record.image.cloneNode(true);
    image.loading = "eager";
    media.replaceChildren(image);
    title.textContent = record.title.textContent;
    category.textContent = record.category.textContent;
    summary.textContent = record.summary.textContent;
    detail.href = record.title.href;
    number.textContent = String(index + 1).padStart(2, "0");
    status.textContent = `${number.textContent} / ${String(records.length).padStart(2, "0")} · ${record.title.textContent}`;
    for (const candidate of records) {
      const selected = candidate === record;
      candidate.element.dataset.selected = String(selected);
      candidate.button.setAttribute("aria-pressed", String(selected));
    }
    root.dataset.archiveCurrent = record.element.id;
    if (userInitiated && window.matchMedia("(max-width: 900px)").matches) {
      preview.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  show(0);
  preview.hidden = false;
  root.dataset.archiveReady = "true";
  records.forEach((record, index) => {
    record.button.addEventListener("click", () => show(index, true));
    record.button.disabled = false;
    record.button.hidden = false;
  });
})();
