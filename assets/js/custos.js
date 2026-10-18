// Estimativa de custos de terceiros (cartório e imposto) no fim do diagnóstico.
// ⚠️ Só aparece com calculadora_custos: true em config.json, depois da consulta à Comissão de Ética da OAB/RS.
// Nunca inclui honorários. Fontes e data de conferência em CUSTOS.fontes; atualizar todo ano (tabela de dezembro).
(function () {
  'use strict';

  // Faixas oficiais: [limite superior da faixa em R$, emolumento em R$].
  // Tabela de Emolumentos RS 2026 (Lei Estadual 12.692/06, reajuste de 5,86%, vigência 01/01/2026), DJE-RS Extra nº 8.048, 15/12/2025.
  var RS_NOTAS_1I = [   // Tabelionato de Notas, item 1, i: escritura com conteúdo financeiro
    [2481.80, 222.80], [7445.20, 252.50], [12408.70, 292.40], [18612.90, 346.10], [24816.80, 395.60], [37225.20, 468.10],
    [49633.80, 552.70], [74451.00, 628.70], [99267.80, 728.60], [124085.00, 828.50], [148901.60, 928.10], [198535.70, 1076.70],
    [248169.50, 1277.10], [297803.60, 1475.80], [347437.30, 1675.30], [397071.00, 1889.80], [446705.00, 2075.00],
    [496338.90, 2274.40], [545972.80, 2473.70], [595606.80, 2673.20], [645240.70, 2871.60], [694874.60, 3072.30],
    [744508.50, 3271.90], [992677.90, 3870.10], [1240847.60, 4867.50], [Infinity, 5482.90]];
  var RS_RI_1 = [       // Registro de Imóveis, item 1: registro com valor declarado
    [2481.80, 226.10], [4963.40, 230.80], [7445.20, 241.00], [9927.00, 251.10], [12408.70, 260.90], [14890.10, 271.00],
    [17371.50, 281.30], [19853.70, 291.30], [22335.10, 300.70], [24816.80, 310.40], [37225.20, 340.90], [49633.80, 390.80],
    [74451.00, 465.90], [99267.80, 565.50], [124085.00, 664.90], [148901.60, 764.70], [173718.60, 864.60], [198535.70, 964.20],
    [223352.70, 1064.20], [248169.50, 1163.90], [297803.60, 1313.30], [347437.30, 1512.30], [397071.00, 1712.00],
    [446705.00, 1911.30], [496338.90, 2111.70], [620424.00, 2460.80], [744508.50, 2958.90], [868593.30, 3458.00],
    [992677.90, 3956.20], [1116762.80, 4454.90], [1240847.60, 4953.60], [Infinity, 5482.90]];
  var ITBI = { poa: { nome: 'Porto Alegre', aliquota: 0.03 } };   // Prefeitura de Porto Alegre, alíquota geral de 3%

  var CUSTOS = window.CUSTOS = {
    verificado_em: '18/10/2026',
    fontes: [
      ['Tabela de Emolumentos RS 2026 (DJE-RS nº 8.048, 15/12/2025)', 'https://arpenrs.com.br/wp-content/uploads/2025/12/Tabela-de-Emolumentos-2026-1.pdf'],
      ['ITBI: Prefeitura de Porto Alegre (página atualizada em 16/04/2026)', 'https://prefeitura.poa.br/carta-de-servicos/imposto-sobre-transmissao-de-bens-imoveis-itbi'],
      ['Forma de cobrança: Provimento CNJ 149/2023, art. 440-AM', 'https://atos.cnj.jus.br/atos/detalhar/5243']
    ]
  };

  function faixa(t, v) { for (var i = 0; i < t.length; i++) if (v <= t[i][0]) return t[i][1]; return t[t.length - 1][1]; }
  function brl(n) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function num(s) { return Number(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }

  // Cálculo puro (testável): base = valor venal do IPTU ou ITR (ou o da compra, se maior, para o ITBI)
  CUSTOS.estimar = function (uf, municipio, valor) {
    if (uf !== 'RS' || !(valor > 0)) return null;
    var ata = faixa(RS_NOTAS_1I, valor), reg = faixa(RS_RI_1, valor), it = ITBI[municipio];
    var linhas = [
      ['Ata notarial (tabelionato de notas)', 'Escritura com conteúdo financeiro, item 1, i', ata],
      ['Processamento no Registro de Imóveis', '50% na apresentação e 50% no deferimento, item 1', reg],
      ['Registro em seu nome', 'Registro com valor declarado, item 1', reg],
      ['ITBI (prefeitura)', it ? 'Alíquota de ' + String(it.aliquota * 100).replace('.', ',') + '% em ' + it.nome : 'Alíquota do seu município', it ? valor * it.aliquota : null]
    ];
    var total = 0;
    linhas.forEach(function (l) { total += l[2] || 0; });
    return { linhas: linhas, total: total, semItbi: !it };
  };

  CUSTOS.render = function (host) {
    var box = el('section', null, 'custos no-print');
    box.setAttribute('aria-labelledby', 'custos-t');
    var h = el('h3', 'Custos de cartório e imposto (estimativa)'); h.id = 'custos-t';
    box.appendChild(h);
    box.appendChild(el('p', 'Valores pagos diretamente ao cartório e à prefeitura, pelas tabelas oficiais. Não incluem honorários.', 'muted'));
    var form = el('div', null, 'custos-campos');
    form.innerHTML =
      '<div class="field"><label for="c-uf">Estado do imóvel</label><select id="c-uf"><option value="RS">Rio Grande do Sul</option><option value="outro">Outro estado</option></select></div>' +
      '<div class="field"><label for="c-mun">Município</label><select id="c-mun"><option value="poa">Porto Alegre</option><option value="outro">Outro município do RS</option></select></div>' +
      '<div class="field"><label for="c-valor">Valor venal do imóvel (consta no carnê do IPTU)</label><input type="text" id="c-valor" inputmode="numeric" placeholder="Ex.: 250.000" autocomplete="off"></div>';
    box.appendChild(form);
    var out = el('div', null, 'custos-out'); out.setAttribute('aria-live', 'polite');
    box.appendChild(out);
    var aviso = el('p', null, 'custos-aviso');
    aviso.appendChild(el('strong', 'Estimativa; os valores oficiais são do cartório e da prefeitura. '));
    aviso.appendChild(document.createTextNode('Não inclui notificação do vendedor, certidões, diligências, selo digital nem honorários. O ITBI incide sobre o maior valor entre o venal e o da compra.'));
    box.appendChild(aviso);
    var fs = el('p', null, 'custos-fontes');
    fs.appendChild(document.createTextNode('Fontes, conferidas em ' + CUSTOS.verificado_em + ': '));
    CUSTOS.fontes.forEach(function (f, i) {
      var a = el('a', f[0]); a.href = f[1]; a.target = '_blank'; a.rel = 'noopener';
      if (i) fs.appendChild(document.createTextNode(' · '));
      fs.appendChild(a);
    });
    box.appendChild(fs);

    function upd() {
      var uf = box.querySelector('#c-uf').value, mun = box.querySelector('#c-mun');
      mun.parentNode.hidden = uf !== 'RS';
      out.textContent = '';
      if (uf !== 'RS') { out.appendChild(el('p', 'Ainda não temos a tabela oficial deste estado conferida. Os valores serão informados na consulta.', 'muted')); return; }
      var r = CUSTOS.estimar(uf, mun.value, num(box.querySelector('#c-valor').value));
      if (!r) { out.appendChild(el('p', 'Informe o valor venal para ver a estimativa.', 'muted')); return; }
      var t = el('table'), tb = el('tbody');
      r.linhas.forEach(function (l) {
        var tr = el('tr'); tr.appendChild(el('td', l[0])); tr.appendChild(el('td', l[1], 'muted'));
        tr.appendChild(el('td', l[2] === null ? 'consulte a prefeitura' : brl(l[2]), 'v')); tb.appendChild(tr);
      });
      var tr = el('tr', null, 'total'); tr.appendChild(el('td', 'Total estimado')); tr.appendChild(el('td', r.semItbi ? 'sem o ITBI' : '', 'muted'));
      tr.appendChild(el('td', brl(r.total), 'v')); tb.appendChild(tr);
      t.appendChild(tb); var w = el('div', null, 'tw'); w.appendChild(t); out.appendChild(w);
    }
    box.addEventListener('input', upd); box.addEventListener('change', upd);
    host.appendChild(box);
    upd();
  };
})();
