const fig_ids = [...document.querySelectorAll('.figure-container')].map(L => L.id);

[...document.getElementsByTagName('figref')].forEach(ref => {
  const refId = ref.getAttribute('ref');
  const counterValue = fig_ids.indexOf(refId)+1;
console.log(counterValue);
  if (counterValue) {
    ref.innerHTML = `<a href="#${refId}">${counterValue}</a>`;
  }
});
