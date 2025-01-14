const filterTagsOnLoad = () => {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  document.querySelectorAll('.tag-group')
    .forEach(el => {
      el.style.display = el.id !== hash ? 'none' : '';
    });
};

['load', 'hashchange'].forEach(event =>
  window.addEventListener(event, filterTagsOnLoad)
);
