// Menu móvel. Nada é enviado a servidores; sem cookies.
(function () {
  var t = document.querySelector('.nav-toggle'), n = document.getElementById('nav');
  if (t && n) t.addEventListener('click', function () {
    var o = n.classList.toggle('open'); t.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
})();

// Origem da visita (anúncio): guarda o identificador do clique só durante a visita, para medir contratações. Sem cookies.
(function () {
  try {
    var q = new URLSearchParams(window.location.search), o = {};
    ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term'].forEach(function (k) {
      var v = q.get(k); if (v) o[k] = v.slice(0, 200);
    });
    if (Object.keys(o).length) sessionStorage.setItem('origem', JSON.stringify(o));
  } catch (e) {}
})();
