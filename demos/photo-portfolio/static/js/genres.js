(() => {
  const dialog = document.querySelector('.image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let opener;
  for (const button of document.querySelectorAll('[data-image]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      const image = dialog.querySelector('img') || document.createElement('img');
      image.src = button.dataset.image;
      image.alt = button.dataset.alt;
      if (!image.isConnected) dialog.append(image);
      dialog.showModal();
    });
  }
  dialog.querySelector('[data-close-image]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
})();
