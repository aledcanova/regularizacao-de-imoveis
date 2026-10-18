// Menu móvel. Nada é enviado a servidores; sem cookies.
(function () {
  var t = document.querySelector('.nav-toggle'), n = document.getElementById('nav');
  if (t && n) t.addEventListener('click', function () {
    var o = n.classList.toggle('open'); t.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
})();

// Submenus do topo: abre um de cada vez; fecha ao clicar fora ou com Esc.
(function () {
  var dds = document.querySelectorAll('.nav .dd');
  if (!dds.length) return;
  dds.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) dds.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
  document.addEventListener('click', function (e) {
    dds.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    dds.forEach(function (d) { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
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

// Balão de WhatsApp: mensagem inicial com a página de origem.
(function () {
  var z = document.querySelector('.zap'); if (!z) return;
  var h1 = document.querySelector('h1');
  var an = ''; try { if (sessionStorage.getItem('origem')) an = ' (anúncio)'; } catch (e) {}
  z.href += '?text=' + encodeURIComponent('Olá. Vim pelo site' + an + ', página "' + (h1 ? h1.textContent.trim() : document.title) + '".');
})();
