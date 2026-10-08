// Diagnóstico interativo. As respostas ficam no navegador até a pessoa decidir enviar o caso.
(function () {
  'use strict';

  var Q = {
    doc: { s: 'A compra', h: 'Vale qualquer papel assinado: promessa, compromisso, recibo de sinal.', t: 'Existe documento escrito da compra?', o: [
      ['contrato', 'Sim, contrato, inclusive "contrato de gaveta"'],
      ['recibos', 'Só recibos, mensagens ou comprovantes, sem contrato'],
      ['nada', 'Nenhum documento'] ] },
    tipo: { s: 'A compra', w: function (a) { return a.doc !== 'nada'; }, t: 'Que negócio foi feito?', o: [
      ['venda', 'Compra e venda'],
      ['cessao', 'Comprei os direitos de quem já tinha comprado'],
      ['permuta', 'Troca (permuta)'],
      ['outro', 'Doação, herança informal ou outro'] ] },
    arrep: { s: 'A compra', h: 'Costuma aparecer como "arrependimento" ou "desistência". Se não tiver certeza, marque que não sabe.', w: function (a) { return a.doc === 'contrato'; }, t: 'O contrato permite desistir do negócio (cláusula de arrependimento)?', o: [
      ['nao', 'Não'], ['sim', 'Sim'], ['ns', 'Não sei'] ] },
    quem: { s: 'A compra', w: function (a) { return a.doc !== 'nada'; }, t: 'Quem fez a compra?', o: [
      ['eu', 'Eu (ou eu e meu cônjuge)'], ['herdei', 'Um familiar já falecido; sou herdeiro'] ] },
    quit: { s: 'O pagamento', w: function (a) { return a.doc !== 'nada'; }, t: 'O preço foi pago?', o: [
      ['total', 'Sim, integralmente'], ['parte', 'Em parte'], ['nao', 'Não'] ] },
    prova: { s: 'O pagamento', h: 'Escolha a mais forte que você tiver.', w: function (a) { return a.quit === 'total'; }, t: 'Qual é a melhor prova do pagamento que você tem?', o: [
      ['recibo', 'Termo de quitação ou recibos assinados'],
      ['banco', 'Comprovantes bancários'],
      ['indireta', 'Declaração de imposto de renda ou mensagens do vendedor'],
      ['nada', 'Nenhuma'] ] },
    imovel: { s: 'O imóvel', t: 'Que tipo de imóvel é?', o: [
      ['apto', 'Apartamento ou sala'], ['casa', 'Casa em área urbana'],
      ['lote', 'Lote em loteamento'], ['rural', 'Imóvel rural'] ] },
    matricula: { s: 'O imóvel', h: 'A matrícula é a "certidão de nascimento" do imóvel no cartório. O número costuma aparecer no IPTU ou em contratos antigos.', t: 'O imóvel tem matrícula no Registro de Imóveis?', o: [
      ['sim', 'Sim'], ['ns', 'Não sei'], ['nao', 'Não tem matrícula própria'] ] },
    titular: { s: 'O imóvel', w: function (a) { return a.matricula === 'sim'; }, t: 'Quem consta como proprietário na matrícula?', o: [
      ['vendedor', 'Quem me vendeu'], ['outro', 'Outra pessoa ou empresa'], ['ns', 'Não sei'] ] },
    cadeia: { s: 'O imóvel', h: 'Por exemplo: o dono no cartório vendeu a alguém, que depois vendeu a você.', w: function (a) { return a.titular === 'outro'; }, t: 'Existem contratos ligando o proprietário do cartório a quem vendeu para você?', o: [
      ['sim', 'Sim, tenho todos'], ['faltam', 'Faltam contratos'], ['ns', 'Não sei'] ] },
    onus: { s: 'O imóvel', w: function (a) { return a.matricula === 'sim'; }, t: 'Você sabe de hipoteca, penhora, alienação fiduciária (imóvel em garantia ao banco) ou bloqueio sobre o imóvel?', o: [
      ['nao', 'Não há'], ['sim', 'Há'], ['ns', 'Não sei'] ] },
    vtipo: { s: 'O vendedor', t: 'O vendedor é pessoa física ou empresa?', o: [
      ['pf', 'Pessoa física'], ['pj', 'Empresa (construtora, loteadora, outra)'] ] },
    vsit: { s: 'O vendedor', t: 'Qual é a situação do vendedor hoje?', o: [
      ['disp', 'Está localizado e disposto a assinar a escritura'],
      ['recusa', 'Está localizado, mas não assina'],
      ['morto', 'Faleceu'],
      ['sumiu', 'Não sei onde está'],
      ['extinta', 'Empresa encerrada ou falida'],
      ['exterior', 'Mora fora do país'],
      ['nunca', 'Nunca foi procurado'] ] },
    proc: { s: 'Situação atual', t: 'Existe processo judicial sobre o imóvel ou o contrato?', o: [
      ['nao', 'Não'], ['sim', 'Sim'], ['ns', 'Não sei'] ] },
    posse: { s: 'Situação atual', t: 'Quem ocupa o imóvel hoje?', o: [
      ['eu', 'Eu ou minha família'], ['alugado', 'Está alugado por mim'],
      ['terceiro', 'Outra pessoa, sem minha autorização'], ['vazio', 'Está vazio'] ] },
    tempo: { s: 'Situação atual', t: 'Há quanto tempo você tem o imóvel?', o: [
      ['m5', 'Menos de 5 anos'], ['5a10', 'De 5 a 10 anos'], ['10a15', 'De 10 a 15 anos'], ['15', '15 anos ou mais'] ] }
  };

  // Opções da situação do vendedor variam conforme pessoa física ou empresa
  Q.vsit.f = function (a, v) {
    if (a.vtipo === 'pj') return v !== 'morto' && v !== 'exterior';
    return v !== 'extinta';
  };
  var ORDER = ['doc', 'tipo', 'arrep', 'quem', 'quit', 'prova', 'imovel', 'matricula', 'titular', 'cadeia', 'onus', 'vtipo', 'vsit', 'proc', 'posse', 'tempo'];

  var stage = document.getElementById('wz-stage');
  if (!stage) return;
  var CFG = window.SITE_CONFIG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var a = {};          // respostas
  var current = null;  // chave da pergunta na tela
  var result = null;

  var $ = function (id) { return document.getElementById(id); };
  var top = $('wz-top'), bar = $('wz-progress'), count = $('wz-count');
  var pResult = $('wz-result'), pEnvio = $('wz-envio'), pProposta = $('wz-proposta'), pContrato = $('wz-contrato'), pPag = $('wz-pagamento'), pFalar = $('wz-falar');

  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function list(items, ordered) {
    var l = document.createElement(ordered ? 'ol' : 'ul');
    items.forEach(function (t) { l.appendChild(el('li', t)); });
    return l;
  }
  function label(k, v) {
    var r = '';
    Q[k].o.forEach(function (o) { if (o[0] === v) r = o[1]; });
    return r;
  }
  function visible() { return ORDER.filter(function (k) { return !Q[k].w || Q[k].w(a); }); }
  function prune() {   // descarta respostas de perguntas que deixaram de se aplicar
    var vis = visible();
    Object.keys(a).forEach(function (k) { if (vis.indexOf(k) < 0) delete a[k]; });
    if (a.vsit && Q.vsit.f && !Q.vsit.f(a, a.vsit)) delete a.vsit;
  }
  function nextKey() {
    var vis = visible();
    for (var i = 0; i < vis.length; i++) if (!a[vis[i]]) return vis[i];
    return null;
  }

  // Troca de painel com transição suave
  function swap(show, focusEl) {
    var panes = [stage, pResult, pEnvio, pProposta, pContrato, pPag, pFalar];
    panes.forEach(function (p) { if (p !== show) { p.hidden = true; p.classList.remove('in'); } });
    show.hidden = false;
    if (show !== stage) {
      show.classList.remove('in');
      void show.offsetWidth;
      show.classList.add('in');
    }
    top.hidden = show !== stage;
    if (focusEl) focusEl.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  function renderQuestion(k, back) {
    current = k;
    var q = Q[k], vis = visible(), idx = vis.indexOf(k);
    bar.value = Math.round((idx / vis.length) * 100);
    var secs = ['A compra', 'O pagamento', 'O imóvel', 'O vendedor', 'Situação atual'];
    count.textContent = 'Etapa ' + (secs.indexOf(q.s) + 1) + ' de ' + secs.length + (secs.indexOf(q.s) === secs.length - 1 ? ' · últimas perguntas' : '');

    var step = el('div', null, 'wz-step');
    step.appendChild(el('p', q.s, 'wz-section'));
    var h = el('h2', q.t, 'wz-q'); h.id = 'wz-q'; h.tabIndex = -1;
    step.appendChild(h);
    if (q.h) step.appendChild(el('p', q.h, 'wz-help'));
    var opts = el('div', null, 'wz-opts');
    opts.setAttribute('role', 'group'); opts.setAttribute('aria-labelledby', 'wz-q');
    q.o.forEach(function (o) {
      if (q.f && !q.f(a, o[0])) return;
      var b = el('button', o[1], 'wz-opt');
      b.type = 'button';
      b.setAttribute('aria-pressed', a[k] === o[0] ? 'true' : 'false');
      b.addEventListener('click', function () { answer(k, o[0], b); });
      opts.appendChild(b);
    });
    step.appendChild(opts);
    var nav = el('div', null, 'wz-nav');
    if (idx > 0) {
      var v = el('button', '← Voltar', 'btn link'); v.type = 'button';
      v.addEventListener('click', function () { goBack(); });
      nav.appendChild(v);
    } else nav.appendChild(el('span'));
    step.appendChild(nav);
    if (idx === 0) step.appendChild(el('p', 'Nada do que você responder é enviado ou gravado nesta etapa. O envio só acontece no fim, se você quiser.', 'wz-priv'));

    var old = stage.firstChild;
    function enter() {
      stage.textContent = '';
      stage.appendChild(step);
      void step.offsetWidth;
      step.classList.add('in');
      h.focus({ preventScroll: true });
    }
    if (old && !reduce) { old.classList.add('out'); setTimeout(enter, 200); } else enter();
    if (stage.hidden) swap(stage, null);
  }

  var busy = false;
  function answer(k, v, btn) {
    if (busy) return;
    busy = true;
    a[k] = v;
    prune();
    Array.prototype.forEach.call(stage.querySelectorAll('.wz-opt'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    setTimeout(function () {
      busy = false;
      var n = nextKey();
      if (n) renderQuestion(n); else showResult();
    }, reduce ? 0 : 260);
  }
  function goBack() {
    var vis = visible(), idx = vis.indexOf(current);
    if (idx > 0) renderQuestion(vis[idx - 1], true);
  }

  // Classificação. Devolve {pill, titulo, texto, atencao[], docs[], etapas[]}
  function classify(a) {
    var longa = a.tempo === '5a10' || a.tempo === '10a15' || a.tempo === '15';
    var ocupa = a.posse === 'eu' || a.posse === 'alugado';
    var at = [];

    var DOCS_ADJ = [
      'Contrato(s) da compra e das cessões anteriores, se houver',
      'Provas do pagamento: recibos, termo de quitação, comprovantes bancários, declarações de imposto de renda, mensagens',
      'Certidão atualizada da matrícula do imóvel',
      'Carnê ou certidão do IPTU (ou cadastro rural)',
      'Documentos pessoais e certidão de estado civil',
      'O que se souber do vendedor: nome completo, CPF ou CNPJ, últimos endereços'
    ];
    var ETAPAS_ADJ = [
      'Análise dos documentos e da matrícula por advogado',
      'Ata notarial em tabelionato de notas',
      'Requerimento ao Registro de Imóveis da situação do imóvel',
      'Notificação do vendedor ou de seus sucessores pelo cartório (ou edital)',
      'Decisão do oficial de registro',
      'Pagamento do ITBI e registro em nome do comprador'
    ];
    var DOCS_USU = [
      'Tudo o que demonstre a posse ao longo do tempo: contas de consumo, IPTU, fotos, reformas, correspondências',
      'Qualquer documento da origem da posse, mesmo informal',
      'Certidão da matrícula ou, se não houver, certidão negativa do Registro de Imóveis',
      'Nomes dos vizinhos confrontantes'
    ];
    var ETAPAS_USU = [
      'Análise da posse, do tempo e da modalidade de usucapião aplicável',
      'Planta e memorial descritivo por profissional habilitado, quando exigidos',
      'Ata notarial e requerimento ao Registro de Imóveis, ou ação judicial, conforme o caso'
    ];

    if (a.proc === 'sim') {
      return { pill: 'warn', cod: 'JUDICIAL', titulo: 'Depende do processo judicial em andamento',
        texto: 'Você informou que existe processo judicial sobre o imóvel ou o contrato. A via extrajudicial exige que não haja processo que possa impedir o registro. O primeiro passo é examinar esse processo: do que trata, quem são as partes e em que fase está.',
        atencao: ['Tenha em mãos o número do processo e a comarca.'], docs: DOCS_ADJ, etapas: ['Análise do processo existente', 'Definição do caminho: seguir na via judicial ou, se cabível, na extrajudicial'] };
    }
    if (a.doc === 'nada') {
      if (ocupa && longa) {
        return { pill: 'warn', cod: 'USUCAPIAO', titulo: 'O caminho a analisar é pelo tempo de posse', tecnico: 'usucapião',
          texto: 'Sem documento da compra, o fundamento deixa de ser o negócio e passa a ser a posse. Pelas informações fornecidas, há posse por tempo que justifica analisar a usucapião, extrajudicial ou judicial. Os prazos e requisitos variam conforme a modalidade.',
          atencao: ['A usucapião exige prova da posse contínua, sem oposição e com ânimo de dono.'], docs: DOCS_USU, etapas: ETAPAS_USU };
      }
      return { pill: 'bad', cod: 'INSUFICIENTE', titulo: 'Documentação insuficiente no momento',
        texto: 'Sem documento da compra e sem posse prolongada informada, não há, em princípio, elementos para a adjudicação compulsória nem para a usucapião. Vale reunir o que existir (recibos, mensagens, transferências, testemunhas) e reavaliar.',
        atencao: [], docs: ['Qualquer registro do negócio: mensagens, transferências, recibos, anúncios, testemunhas'], etapas: ['Reunir documentos', 'Nova análise'] };
    }
    if (a.tipo === 'outro') {
      return { pill: 'warn', cod: 'OUTRO_NEGOCIO', titulo: 'O negócio informado pede outra solução',
        texto: 'A adjudicação compulsória se apoia em promessa de compra e venda, de permuta ou em cessão desses direitos. Doação e herança seguem caminhos próprios, como a escritura de doação ou o inventário. É preciso ver os documentos para definir a medida.',
        atencao: [], docs: ['Documento que formalizou a doação ou a partilha, se houver', 'Certidão da matrícula', 'Certidão de óbito e documentos dos herdeiros, se for herança'], etapas: ['Análise documental', 'Definição da medida aplicável'] };
    }
    if (a.quit === 'parte' || a.quit === 'nao') {
      return { pill: 'warn', cod: 'NAO_QUITADO', titulo: 'O preço ainda não está quitado',
        texto: 'A adjudicação compulsória pressupõe o pagamento integral do preço ou o cumprimento da contraprestação. Enquanto houver saldo, o caminho passa por quitar, consignar o pagamento ou renegociar com o vendedor ou seus sucessores.',
        atencao: ['Se o vendedor não é encontrado para receber, existe a consignação em pagamento.'], docs: DOCS_ADJ, etapas: ['Apuração do saldo devido', 'Quitação ou consignação', 'Depois, análise da regularização'] };
    }
    if (a.matricula === 'nao') {
      return { pill: 'warn', cod: 'SEM_MATRICULA', titulo: 'Antes, o imóvel precisa ter matrícula própria no cartório',
        texto: 'Você informou que o imóvel não tem matrícula própria. A adjudicação compulsória transfere a propriedade de um imóvel já identificado no registro. Sem matrícula, costuma ser necessária outra providência antes ou em lugar dela: regularização do loteamento, desmembramento, regularização fundiária ou usucapião.',
        atencao: longa && ocupa ? ['Pelo tempo de posse informado, a usucapião é uma hipótese a estudar.'] : [],
        docs: ['Contrato e comprovantes', 'IPTU ou cadastro municipal', 'Certidão da matrícula da área maior (gleba), se existir', 'Planta do loteamento, se houver'], etapas: ['Pesquisa no Registro de Imóveis e na Prefeitura', 'Definição da medida registral aplicável'] };
    }
    if (a.titular === 'outro' && a.cadeia === 'faltam') {
      return { pill: 'warn', cod: 'CADEIA', titulo: 'Faltam contratos entre o dono no cartório e você',
        texto: 'O proprietário que consta na matrícula não é quem vendeu para você, e faltam contratos ligando um ao outro. Para a adjudicação compulsória, a ata notarial precisa trazer o histórico de todas as cessões. O caminho é tentar reconstituir essa sequência; não sendo possível, analisa-se a usucapião.',
        atencao: longa && ocupa ? ['Pelo tempo de posse informado, a usucapião é uma alternativa a estudar.'] : [],
        docs: DOCS_ADJ, etapas: ['Reconstituição da sequência de contratos', 'Definição entre adjudicação compulsória e usucapião'] };
    }
    if (a.vsit === 'disp') {
      return { pill: 'ok', cod: 'ESCRITURA', titulo: 'O caminho mais simples tende a ser a escritura pública',
        texto: 'Se o vendedor está localizado e disposto a assinar, normalmente basta lavrar a escritura de compra e venda em tabelionato e levá-la a registro, sem necessidade de adjudicação compulsória.',
        atencao: ['Confira antes a matrícula: é o vendedor quem consta como proprietário? Há ônus?'],
        docs: ['Contrato e comprovantes', 'Certidão da matrícula', 'Documentos das partes'], etapas: ['Conferência da matrícula', 'Escritura pública em tabelionato', 'ITBI e registro'] };
    }

    // Hipótese de adjudicação compulsória: reunir pontos de atenção
    if (a.doc === 'recibos') at.push('Não há contrato formal. É preciso avaliar se os recibos e demais documentos identificam o imóvel, as partes e o preço de modo suficiente para caracterizar a promessa de compra e venda.');
    if (a.arrep === 'sim') at.push('O contrato tem cláusula de arrependimento. Ela impede o procedimento se ainda puder ser exercida, salvo em loteamento urbano e em incorporação com carência vencida.');
    if (a.arrep === 'ns') at.push('Verificar no contrato se há cláusula de arrependimento.');
    if (a.quem === 'herdei') at.push('Sucessores do comprador podem requerer, mas a sucessão precisa estar documentada (inventário ou comprovação da qualidade de herdeiro).');
    if (a.prova === 'nada') at.push('Sem prova do pagamento, o procedimento não avança. As normas admitem vários meios: comprovantes bancários, recibos, mensagens do vendedor, declaração de imposto de renda, entre outros.');
    if (a.prova === 'indireta') at.push('Declaração de imposto de renda e mensagens do vendedor são meios de prova admitidos; a suficiência é avaliada pelo tabelião na ata notarial.');
    if (a.matricula === 'ns') at.push('Obter a certidão da matrícula é o primeiro passo: ela mostra quem é o proprietário registrado e se há ônus.');
    if (a.titular === 'ns') at.push('Conferir na matrícula se o proprietário registrado é quem vendeu para você.');
    if (a.titular === 'outro' && a.cadeia !== 'faltam') at.push('O proprietário registrado é outra pessoa: todos os contratos intermediários entram no procedimento e os envolvidos são notificados.');
    if (a.onus === 'sim') at.push('Ônus que não impedem a venda voluntária não obstam o pedido. Já a indisponibilidade de bens precisa ser cancelada até a decisão final.');
    if (a.onus === 'ns') at.push('Verificar na matrícula se existe hipoteca, penhora, alienação fiduciária (imóvel em garantia ao banco) ou indisponibilidade.');
    if (a.vsit === 'morto') at.push('Vendedor falecido: são notificados os herdeiros ou, havendo inventário, o inventariante.');
    if (a.vsit === 'sumiu') at.push('Vendedor em lugar desconhecido: a notificação por aviso público (edital) é possível, depois de demonstradas as tentativas de localização.');
    if (a.vsit === 'extinta') at.push('Empresa encerrada: a notificação vai ao liquidante ou ao último administrador conhecido; se não localizados, por aviso público (edital). Em caso de falência, o contrato precisa ser anterior a ela.');
    if (a.vsit === 'exterior') at.push('Vendedor residente no exterior sem procurador com poderes: a notificação pode ser feita por aviso público (edital).');
    if (a.vsit === 'nunca') at.push('O vendedor ainda não foi procurado. Se ele concordar em assinar, a escritura comum tende a ser mais simples.');
    if (a.posse === 'terceiro') at.push('Há outra pessoa ocupando o imóvel sem autorização: a regularização do registro não resolve, por si, a retomada da posse.');
    if (a.proc === 'ns') at.push('Confirmar, por certidões dos distribuidores forenses, que não há processo sobre o contrato.');
    if (a.imovel === 'rural') at.push('Imóvel rural tem exigências adicionais de cadastro (CCIR, ITR, CAR) e, conforme a área, georreferenciamento.');

    var serios = a.doc === 'recibos' || a.arrep === 'sim' || a.prova === 'nada';
    if (serios) {
      return { pill: 'warn', cod: 'ADJ_PENDENCIAS', titulo: 'Pode ser possível regularizar em cartório, mas há pontos a esclarecer antes', tecnico: 'adjudicação compulsória extrajudicial',
        texto: 'Pelas informações fornecidas, há elementos de uma compra quitada sem escritura, mas existem pontos que podem impedir a via extrajudicial e precisam de análise documental.',
        atencao: at, docs: DOCS_ADJ, etapas: ETAPAS_ADJ };
    }
    return { pill: 'ok', cod: 'ADJ', titulo: 'Seu caso tem os elementos para regularizar em cartório, sem processo judicial', tecnico: 'adjudicação compulsória extrajudicial',
      texto: 'Pelas informações fornecidas, existem elementos compatíveis com uma possível regularização pela via da adjudicação compulsória extrajudicial. A definição da medida adequada depende da análise da matrícula e dos documentos da aquisição.',
      atencao: at, docs: DOCS_ADJ, etapas: ETAPAS_ADJ };
  }

  // Faixa de complexidade: decide o que pode ser contratado direto e o que vai para atendimento do advogado
  function faixa(r) {
    if (r.cod !== 'ADJ' && r.cod !== 'ADJ_PENDENCIAS') return null;
    var complexo = r.cod === 'ADJ_PENDENCIAS' || a.vsit === 'morto' || a.vsit === 'extinta' || a.onus === 'sim' ||
      a.imovel === 'rural' || a.posse === 'terceiro' || a.quem === 'herdei';
    if (complexo) return 'complexo';
    var inter = a.tipo === 'cessao' || a.tipo === 'permuta' || a.titular === 'outro' || a.titular === 'ns' || a.prova === 'indireta' ||
      a.matricula === 'ns' || a.onus === 'ns' || a.arrep === 'ns' || a.proc === 'ns' || a.vsit === 'sumiu' || a.vsit === 'exterior';
    return inter ? 'intermediario' : 'simples';
  }
  var FAIXAS = {
    simples: ['Caso simples', 'Contrato direto com o dono registrado, preço quitado com prova e matrícula sem pendências conhecidas.'],
    intermediario: ['Caso com pontos a conferir', 'Há pontos que pedem trabalho documental adicional antes do pedido, como cessões, notificação por aviso público (edital) ou informações a confirmar na matrícula.'],
    complexo: ['Caso que pede análise individual', 'Envolve sucessão, empresa encerrada, ônus ou outro ponto que exige análise jurídica individual antes de qualquer procedimento.']
  };
  var TIMELINE = [
    ['Consulta de viabilidade', 'O advogado examina contrato, pagamento e matrícula.'],
    ['Procuração', 'Você assina a procuração específica para o procedimento.'],
    ['Preparo das peças', 'Levantamento de certidões e montagem do dossiê e do requerimento.'],
    ['Ata notarial', 'O tabelião registra em ata os contratos e a prova do pagamento.'],
    ['Protocolo', 'O pedido é apresentado ao Registro de Imóveis.'],
    ['Notificação', 'O cartório notifica o vendedor ou seus sucessores (ou publica edital).'],
    ['Exigências e resposta', 'Se o oficial pedir complementos, eles são atendidos no prazo.'],
    ['Registro', 'Pago o imposto de transmissão, o imóvel é registrado em seu nome.']
  ];
  function timeline() {
    var ol = el('ol', null, 'timeline');
    TIMELINE.forEach(function (x) { var li = el('li'); li.appendChild(el('strong', x[0])); li.appendChild(el('span', x[1])); ol.appendChild(li); });
    return ol;
  }

  function showResult() {
    result = classify(a);
    result.faixa = faixa(result);
    bar.value = 100;
    var vd = $('verdict');
    vd.className = 'verdict ' + result.pill;
    $('verdict-title').textContent = result.titulo;
    $('verdict-text').textContent = result.texto;
    var tec = $('verdict-tecnico');
    tec.hidden = !result.tecnico;
    if (result.tecnico) tec.textContent = 'Nome do procedimento: ' + result.tecnico + '.';
    var m = $('mapa'); m.textContent = '';
    if (result.faixa) {
      var fx = el('div', null, 'faixa faixa-' + result.faixa);
      fx.appendChild(el('strong', FAIXAS[result.faixa][0]));
      fx.appendChild(el('span', FAIXAS[result.faixa][1]));
      m.appendChild(fx);
    }
    if (result.atencao.length) { m.appendChild(el('h3', 'Pontos de atenção')); m.appendChild(list(result.atencao)); }
    m.appendChild(el('h3', 'Documentos normalmente relevantes')); m.appendChild(list(result.docs));
    if (result.faixa) { m.appendChild(el('h3', 'Como é o caminho até o registro')); m.appendChild(timeline()); }
    else { m.appendChild(el('h3', 'Etapas gerais')); m.appendChild(list(result.etapas, true)); }
    swap(pResult, $('verdict-title'));
  }

  $('refazer').addEventListener('click', function () { a = {}; result = null; renderQuestion(ORDER[0]); swap(stage, null); });
  $('imprimir').addEventListener('click', function () { window.print(); });
  ['abrir-envio', 'abrir-envio-2'].forEach(function (id) { $(id).addEventListener('click', function () { swap(pEnvio, $('envio-title')); }); });
  $('voltar-resultado').addEventListener('click', function () { swap(pResult, $('verdict-title')); });

  // ---------- Passo 1: dados e documentos ----------
  var form = $('caso');
  var MAX = 8 * 1024 * 1024;
  var caso = null;   // {protocolo, nome, email} depois do envio
  function setErr(input, errId, bad, msg) {
    var e = $(errId);
    if (msg) e.textContent = msg;
    e.hidden = !bad;
    if (input) input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  }
  function validate() {
    var first = null;
    function chk(id, errId, bad, msg) { if (setErr($(id), errId, bad, msg) && !first) first = $(id); }
    chk('f-nome', 'e-nome', $('f-nome').value.trim().split(/\s+/).length < 2);
    var em = $('f-email').value.trim(), emOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em), telOk = $('f-tel').value.replace(/\D/g, '').length >= 10;
    chk('f-email', 'e-email', em ? !emOk : !telOk);
    chk('f-cidade', 'e-cidade', $('f-cidade').value.trim().length < 2);
    chk('f-uf', 'e-uf', !$('f-uf').value);
    var total = 0, tipoRuim = false;
    ['f-contrato', 'f-matricula', 'f-pagamento'].forEach(function (id) {
      var f = $(id).files && $(id).files[0];
      if (f) { total += f.size; if (!/\.(pdf|jpe?g|png|heic)$/i.test(f.name)) tipoRuim = true; }
    });
    var arqMsg = tipoRuim ? 'Envie apenas arquivos PDF, JPG, PNG ou HEIC.' : 'Os arquivos somam mais de 8 MB. Remova algum; o restante pode ser enviado depois.';
    if (setErr(null, 'e-arq', tipoRuim || total > MAX, arqMsg) && !first) first = $('f-contrato');
    chk('f-c1', 'e-c1', !$('f-c1').checked);
    return first;
  }
  function protocolo() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    var r = '', abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var buf = new Uint8Array(5);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 5; i++) r += abc[buf[i] % abc.length];
    return 'RI-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
  }
  function setProt(p) {
    Array.prototype.forEach.call(document.querySelectorAll('.prot'), function (e) { e.textContent = p; });
  }
  function b64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  // Com endpoint (script do Google): JSON { form, campos, arquivos } em text/plain, que não exige pré-consulta do navegador.
  // Sem endpoint: formulário do Netlify, como antes.
  var anexosPendentes = false;
  function mandar(body) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 90000) : 0;
    return fetch(CFG.endpoint, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (txt) {
        var j; try { j = JSON.parse(txt); } catch (e) { throw new Error('resposta'); }
        if (!j || !j.ok) { var er = new Error('recusado'); er.codigo = j && j.erro; throw er; }
      }, function (e) { clearTimeout(t); throw e; });
  }
  function enviar(fd) {
    if (!CFG.endpoint) return fetch('/', { method: 'POST', body: fd }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
    var campos = {}, arquivos = [], files = [];
    fd.forEach(function (v, k) {
      if (k === 'form-name') return;
      if (typeof v === 'string') campos[k] = v;
      else if (v && v.size) files.push([k, v]);
    });
    var form_ = fd.get('form-name');
    try {
      var og = JSON.parse(sessionStorage.getItem('origem') || '{}');
      if (og.gclid) campos.gclid = og.gclid;
      if (Object.keys(og).length) campos.origem = JSON.stringify(og);
    } catch (e) {}
    // Lê os arquivos; se a leitura ou o envio com anexos falhar, envia os dados sem eles para não perder o caso.
    var lidos = Promise.all(files.map(function (kv) {
      return b64(kv[1]).then(function (d) { arquivos.push({ campo: kv[0], nome: kv[1].name, tipo: kv[1].type, dados: d }); });
    }));
    function semAnexos(motivo) {
      if (!files.length) throw motivo;
      if (window.console) console.error('envio com anexos falhou:', motivo && (motivo.codigo || motivo.message));
      campos.anexos_pendentes = files.map(function (kv) { return kv[1].name; }).join('; ');
      return mandar({ form: form_, campos: campos, arquivos: [] }).then(function () { anexosPendentes = true; });
    }
    return lidos.then(function () { return mandar({ form: form_, campos: campos, arquivos: arquivos }); })
      .catch(function (e) {
        if (e && e.codigo && e.codigo !== 'tamanho' && e.codigo !== 'servidor') throw e;
        return semAnexos(e);
      });
  }
  function post(fd, btn, rotulo, errBox, ok) {
    errBox.hidden = true;
    btn.disabled = true; btn.textContent = 'Enviando…';
    enviar(fd).then(function () {
      ok();
    }).catch(function (e) {
      var cod = (e && (e.codigo || (e.name === 'AbortError' ? 'tempo' : e.message))) || 'rede';
      if (window.console) console.error('envio falhou:', cod);
      var msg = cod === 'limite' ? 'Recebemos muitos envios nesta hora. Tente de novo em alguns minutos ou escreva para '
        : 'Não foi possível enviar agora. Verifique a conexão e tente de novo. Se o problema continuar, escreva para ';
      errBox.textContent = msg + (CFG.email || 'o e-mail da página de contato') + '. (código: ' + String(cod).slice(0, 40) + ')';
      errBox.hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = rotulo; });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); return; }
    var prot = caso ? caso.protocolo : protocolo();
    $('f-protocolo').value = prot;
    $('f-codigo').value = result ? result.cod : '';
    $('f-resultado').value = result ? result.titulo : '';
    $('f-respostas').value = visible().map(function (k) { return Q[k].t + ' ' + label(k, a[k]); }).join('\n');
    $('f-json').value = JSON.stringify(a);
    $('f-pontos').value = JSON.stringify(result ? result.atencao : []);
    $('f-faixa').value = result && result.faixa ? result.faixa : '';
    var fd = new FormData(form);
    ['arquivo_contrato', 'arquivo_matricula', 'arquivo_pagamento'].forEach(function (n) {
      var f = fd.get(n);
      if (f && typeof f === 'object' && !f.size) fd.delete(n);   // não envia campo de arquivo vazio
    });
    post(fd, $('enviar'), 'Enviar e ver a proposta', $('e-envio'), function () {
      caso = { protocolo: prot, nome: $('f-nome').value.trim(), email: $('f-email').value.trim() };
      setProt(prot);
      if (anexosPendentes && !$('aviso-anexos')) {
        var av = el('p', 'Seus dados foram recebidos, mas não foi possível receber os arquivos agora. Envie-os para ' + CFG.email + ' informando o protocolo ' + prot + '.', 'err');
        av.id = 'aviso-anexos'; av.setAttribute('role', 'status');
        $('offer-procedimento').parentNode.parentNode.insertBefore(av, $('offer-procedimento').parentNode);
      }
      // O contrato de regularização completa é o da adjudicação compulsória: só é oferecido quando o diagnóstico aponta essa via
      // Simples: contratação direta. Intermediário: só se houver preço da faixa em config. Complexo: consulta e atendimento do advogado.
      var fxa = result ? result.faixa : null, precoProc = 0;
      // A contratação do procedimento passou a acontecer depois do parecer (fluxo a definir): só com oferecer_procedimento = true
      if (CFG.oferecer_procedimento && fxa === 'simples') precoProc = CFG.preco_procedimento;
      if (CFG.oferecer_procedimento && fxa === 'intermediario') precoProc = CFG.preco_procedimento_intermediario || 0;
      PROD.procedimento.total = precoProc;
      PROD.procedimento.agora = Math.round(precoProc * CFG.entrada_procedimento_pct) / 100;
      $('offer-procedimento').hidden = !precoProc;
      if (precoProc) {
        $('preco-proc').textContent = brl(precoProc);
        $('entrada-proc').textContent = brl(PROD.procedimento.agora);
        $('parcela-proc').textContent = brl((precoProc - PROD.procedimento.agora) / 2);
        Array.prototype.forEach.call(document.querySelectorAll('.ct-total'), function (e) { e.textContent = brl(precoProc); });
        Array.prototype.forEach.call(document.querySelectorAll('.ct-entrada'), function (e) { e.textContent = brl(PROD.procedimento.agora); });
        Array.prototype.forEach.call(document.querySelectorAll('.ct-parcela'), function (e) { e.textContent = brl((precoProc - PROD.procedimento.agora) / 2); });
      }
      var nota = $('nota-so-analise');
      nota.hidden = fxa !== 'complexo';
      nota.textContent = 'Seu caso foi classificado como complexo e recebe análise jurídica individual: a orientação indicará se o caminho é o cartório ou outro, e a proposta virá de acordo com ela.';
      humano();
      swap(pProposta, $('proposta-title'));
    });
  });

  // ---------- Passo 2: proposta ----------
  var PROD = {
    analise: { nome: 'Consulta com análise documental', total: CFG.preco_analise, agora: CFG.preco_analise, link: CFG.link_cartao_analise, ct: 'ct-analise' },
    procedimento: { nome: 'Regularização completa', total: CFG.preco_procedimento, agora: Math.round(CFG.preco_procedimento * CFG.entrada_procedimento_pct) / 100, link: CFG.link_cartao_procedimento, ct: 'ct-procedimento' }
  };
  var produto = null;
  function brl(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); }

  Array.prototype.forEach.call(pProposta.querySelectorAll('[data-produto]'), function (b) {
    b.addEventListener('click', function () {
      produto = b.getAttribute('data-produto');
      var p = PROD[produto];
      $('ct-analise').hidden = produto !== 'analise';
      $('ct-procedimento').hidden = produto !== 'procedimento';
      $('k-resumo').textContent = brl(p.total) + (p.agora !== p.total ? ' (entrada de ' + brl(p.agora) + ' agora)' : '');
      $('k-aceite').checked = false;
      $('k-email-campo').hidden = !!caso.email;
      swap(pContrato, $('contrato-title'));
    });
  });
  $('voltar-proposta').addEventListener('click', function () { swap(pProposta, $('proposta-title')); });
  function humano() {
    var txt = encodeURIComponent('Protocolo ' + caso.protocolo + ' - quero falar com o advogado');
    var mail = 'mailto:' + CFG.email + '?subject=' + txt;
    var zap = CFG.whatsapp_e164 ? 'https://wa.me/' + CFG.whatsapp_e164.replace(/\D/g, '') + '?text=' + txt : '';
    Array.prototype.forEach.call(document.querySelectorAll('.humano-link'), function (l) {
      l.href = zap || mail;
      l.textContent = zap ? 'Atendimento humano por WhatsApp' : 'Atendimento humano por e-mail';
      if (zap) { l.target = '_blank'; l.rel = 'noopener'; }
    });
  }
  $('abrir-falar').addEventListener('click', function () {
    var assunto = encodeURIComponent('Protocolo ' + caso.protocolo + ' - falar com o advogado');
    $('falar-email').href = 'mailto:' + CFG.email + '?subject=' + assunto;
    if (CFG.whatsapp_e164) {
      var w = $('falar-whats');
      w.href = 'https://wa.me/' + CFG.whatsapp_e164.replace(/\D/g, '') + '?text=' + encodeURIComponent('Protocolo ' + caso.protocolo);
      w.hidden = false;
    }
    swap(pFalar, $('falar-title'));
  });
  $('falar-voltar').addEventListener('click', function () { swap(pProposta, $('proposta-title')); });

  // ---------- Passo 3: contrato e aceite ----------
  function cpfOk(v) {
    var c = v.replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    function dv(n) { var s = 0; for (var i = 0; i < n; i++) s += +c[i] * (n + 1 - i); var r = (s * 10) % 11; return r === 10 ? 0 : r; }
    return dv(9) === +c[9] && dv(10) === +c[10];
  }
  $('k-cpf').addEventListener('input', function () {
    var c = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = c.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  });
  var kform = $('contratacao');
  kform.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var first = null;
    function chk(id, errId, bad) { if (setErr($(id), errId, bad) && !first) first = $(id); }
    chk('k-cpf', 'e-cpf', !cpfOk($('k-cpf').value));
    chk('k-end', 'e-end', $('k-end').value.trim().length < 10);
    chk('k-aceite', 'e-aceite', !$('k-aceite').checked);
    if (first) { first.focus(); return; }
    var p = PROD[produto];
    $('k-protocolo').value = caso.protocolo;
    $('k-produto').value = produto;
    $('k-total').value = p.total;
    $('k-agora').value = p.agora;
    $('k-versao').value = CFG.versao_contrato || '';
    $('k-nome').value = caso.nome;
    if (!caso.email) {
      var ev2 = $('k-email-vis').value.trim();
      if (setErr($('k-email-vis'), 'e-kemail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ev2))) { $('k-email-vis').focus(); return; }
      caso.email = ev2;
    }
    $('k-email').value = caso.email;
    $('k-quando').value = new Date().toISOString();
    post(new FormData(kform), $('contratar'), 'Aceitar e ir para o pagamento', $('e-contratar'), function () { showPagamento(p); });
  });

  // ---------- Pagamento ----------
  function ascii(s, max) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max);
  }
  function crc16(s) {
    var crc = 0xFFFF;
    for (var i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
  }
  function pixCode(valor, txid) {   // BR Code estático (padrão EMV do Banco Central)
    function f(id, v) { return id + ('0' + v.length).slice(-2) + v; }
    var s = f('00', '01') + f('26', f('00', 'br.gov.bcb.pix') + f('01', CFG.pix_chave)) + f('52', '0000') + f('53', '986') +
      f('54', Number(valor).toFixed(2)) + f('58', 'BR') + f('59', ascii(CFG.pix_nome, 25)) + f('60', ascii(CFG.pix_cidade, 15)) +
      f('62', f('05', txid)) + '6304';
    return s + crc16(s);
  }

  function showPagamento(p) {
    $('pag-produto').textContent = p.nome;
    $('pag-valor').textContent = brl(p.agora);
    // Pix direto (código copia e cola) e, havendo link, cartão ou boleto pelo Mercado Pago, lado a lado
    var temCartao = !!p.link, temPix = !!(CFG.pix_chave && CFG.pix_nome);
    if (temPix) $('pix-code').value = pixCode(p.agora, caso.protocolo.replace(/[^A-Za-z0-9]/g, '').slice(0, 25));
    $('pag-pix').hidden = !temPix;
    if (temCartao) $('cartao-link').href = p.link;
    $('pag-cartao').hidden = !temCartao;
    $('pag-email').hidden = temPix || temCartao;
    var passos = produto === 'analise'
      ? [['Confirmação', 'Você recebe por e-mail a confirmação do pagamento e a cópia do contrato.'],
         ['Documentos', 'Se faltou o contrato ou a matrícula, envie em resposta a esse e-mail.'],
         ['Análise', 'O advogado examina os documentos e confirma a viabilidade do caso.'],
         ['Orientação e proposta', 'Você recebe a orientação assinada e a proposta detalhada do procedimento no prazo do contrato.']]
      : [['Confirmação', 'Você recebe por e-mail a confirmação do pagamento e a cópia do contrato.'],
         ['Revisão do caso', 'O advogado revisa o caso e confirma a contratação. Se não confirmar, o valor pago é devolvido integralmente.'],
         ['Início', 'Confirmado, você recebe a procuração para assinar e a lista do que falta. O procedimento começa.']];
    var ol = $('pag-passos'); ol.textContent = '';
    passos.forEach(function (x) { var li = el('li'); li.appendChild(el('strong', x[0])); li.appendChild(document.createTextNode(x[1])); ol.appendChild(li); });
    swap(pPag, $('pag-title'));
  }
  $('pix-copiar').addEventListener('click', function () {
    var b = this, t = $('pix-code');
    function ok() { b.textContent = 'Código copiado'; setTimeout(function () { b.textContent = 'Copiar código Pix'; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(ok, function () { t.select(); });
    else { t.select(); document.execCommand('copy'); ok(); }
  });

  // Respostas trazidas pelas páginas de cada situação (ex.: diagnostico.html?vsit=morto&vtipo=pf)
  (function () {
    var qs = window.location.search.replace(/^\?/, '').split('&');
    qs.forEach(function (kv) {
      var p = kv.split('='), k = p[0], v = decodeURIComponent(p[1] || '');
      if (Q[k] && Q[k].o.some(function (o) { return o[0] === v; })) a[k] = v;
    });
    prune();
  })();
  renderQuestion(nextKey() || ORDER[0]);
})();
(function () { var z = document.querySelector('.zap'); if (z) z.hidden = true; })();
