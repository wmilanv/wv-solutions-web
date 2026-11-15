(function () {
  'use strict';

  var WHATSAPP = '573150659653';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* =======================================================
     SERVICIOS: edita aquí títulos, descripciones y procesos
     ======================================================= */
  var SERVICES = [
    {
      title: 'Integración de procesos',
      what: 'Conectamos tus áreas y herramientas para que la información fluya sola, sin digitar dos veces.',
      flow: ['Pedido o venta', 'Sincronización', 'Factura + Inventario'],
      procs: [
        ['Pedido → factura → inventario', 'Un pedido genera su factura y descuenta el inventario automáticamente.'],
        ['Ventas y contabilidad sincronizadas', 'Lo que vendes queda registrado en contabilidad sin copiar datos.'],
        ['Notificaciones automáticas', 'Correos o mensajes a clientes y equipos cuando cambia un estado.'],
        ['Consolidación entre áreas o sedes', 'Un solo consolidado con la información de todos.']
      ]
    },
    {
      title: 'Automatización con Apps Script',
      what: 'Automatizamos tus Hojas de cálculo, Gmail, Drive y Formularios para que las tareas repetitivas se hagan solas.',
      flow: ['Google Sheets / Gmail', 'Apps Script', 'PDFs + Reportes'],
      procs: [
        ['Facturación masiva', 'Genera y envía las facturas del mes desde una hoja de cálculo.'],
        ['Conciliación bancaria', 'Cruza extractos con tus registros y marca las diferencias.'],
        ['Reportes programados', 'El resumen llega solo al correo de gerencia cada día, semana o mes.'],
        ['Documentos automáticos', 'Cotizaciones, certificados y cuentas de cobro en PDF con un clic.']
      ]
    },
    {
      title: 'Sistemas y APIs',
      what: 'Conectamos tu software contable, tienda en línea y pasarelas de pago para que compartan datos en tiempo real.',
      flow: ['Tienda / Pasarela', 'API / Webhook', 'ERP al día'],
      procs: [
        ['Integración con tu ERP o software contable', 'Envío y lectura de facturas, terceros y movimientos.'],
        ['Tienda en línea y pasarelas de pago', 'Pedidos y pagos registrados automáticamente.'],
        ['Sincronización en tiempo real', 'Webhooks que avisan a tus sistemas apenas algo cambia.'],
        ['APIs a medida', 'Servicios propios para tus aplicaciones y aliados.']
      ]
    },
    {
      title: 'Bases de datos',
      what: 'Centralizamos tu información en una base de datos ordenada y segura para encontrar cualquier registro al instante.',
      flow: ['Hojas dispersas', 'Base central', 'Búsqueda + Respaldo'],
      procs: [
        ['Migración desde Excel', 'Pasamos tus hojas dispersas a una base de datos central.'],
        ['Directorio de clientes y proveedores', 'Toda la información de contacto e historial en un solo lugar.'],
        ['Búsquedas y filtros rápidos', 'Encuentra registros por ciudad, estado o fecha en segundos.'],
        ['Copias de seguridad automáticas', 'Respaldos programados para no perder información.']
      ]
    },
    {
      title: 'Desarrollo Full Stack',
      what: 'Construimos aplicaciones web completas —pantallas, servidor y base de datos— listas para usar desde cualquier lugar.',
      flow: ['Tu necesidad', 'App Web a medida', 'Control en tiempo real'],
      procs: [
        ['Tableros de indicadores', 'Tus ventas, pedidos y metas en tiempo real.'],
        ['Aplicaciones internas', 'Gestión de pedidos, inventario o solicitudes a tu medida.'],
        ['Portales para clientes', 'Consulta de facturas, pedidos y estados de cuenta.'],
        ['Flujos de aprobación', 'Formularios con aprobaciones por rol y trazabilidad.']
      ]
    },
    {
      title: 'Seguridad de la información',
      what: 'Protegemos los datos de tu empresa con permisos por rol, cifrado y respaldos sin frenar a tu equipo.',
      flow: ['Accesos y datos', 'Cifrado + Roles', 'Auditoría + Respaldo'],
      procs: [
        ['Usuarios y permisos por rol', 'Cada persona ve y edita solo lo que le corresponde.'],
        ['Cifrado de datos', 'La información viaja y se guarda protegida.'],
        ['Respaldos y recuperación', 'Copias periódicas y plan para restaurar en caso de fallas.'],
        ['Registro de actividad', 'Quién hizo qué y cuándo, para auditoría y control.']
      ]
    }
  ];

  function $(id) { return document.getElementById(id); }

  function createCheckIcon() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#7EE2A8');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M20 6 9 17l-5-5');
    svg.appendChild(path);
    return svg;
  }

  function buildProcItem(proc) {
    var item = document.createElement('div');
    item.className = 'proc';
    item.appendChild(createCheckIcon());

    var copy = document.createElement('div');
    var title = document.createElement('b');
    title.textContent = proc[0];
    var desc = document.createElement('span');
    desc.textContent = proc[1];
    copy.appendChild(title);
    copy.appendChild(desc);
    item.appendChild(copy);
    return item;
  }

  function createArrowIcon() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'svc-flow-arrow');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M5 12h14m-6-6 6 6-6 6');
    svg.appendChild(path);
    return svg;
  }

  function renderFlow(steps) {
    var flowEl = $('svcFlow');
    if (!flowEl || !steps) return;
    var frag = document.createDocumentFragment();
    steps.forEach(function (label, idx) {
      if (idx > 0) frag.appendChild(createArrowIcon());
      var step = document.createElement('span');
      step.className = 'svc-flow-step' + (idx === 1 ? ' is-mid' : idx === 2 ? ' is-end' : '');
      step.textContent = label;
      frag.appendChild(step);
    });
    flowEl.replaceChildren(frag);
  }

  /* ---------- Pestañas de servicios ---------- */
  var tabs = $('svcTabs');
  var panel = $('svcPanel');
  var buttons = [];

  if (tabs && panel) {
    var tabFrag = document.createDocumentFragment();
    SERVICES.forEach(function (s, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill';
      btn.setAttribute('role', 'tab');
      btn.id = 'svc-tab-' + i;
      btn.setAttribute('aria-controls', 'svcPanel');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('data-i', String(i));
      btn.textContent = s.title;
      buttons.push(btn);
      tabFrag.appendChild(btn);
    });
    tabs.appendChild(tabFrag);

    function showService(index) {
      if (index < 0 || index >= SERVICES.length) return;
      var s = SERVICES[index];
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-selected', j === index ? 'true' : 'false');
        b.tabIndex = j === index ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'svc-tab-' + index);
      $('svcTitle').textContent = s.title;
      $('svcWhat').textContent = s.what;
      renderFlow(s.flow);

      var procsEl = $('svcProcs');
      var procFrag = document.createDocumentFragment();
      s.procs.forEach(function (p) { procFrag.appendChild(buildProcItem(p)); });
      procsEl.replaceChildren(procFrag);

      $('svcCta').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola WV Solutions, me interesa el servicio de ' + s.title);
      panel.classList.remove('fade');
      void panel.offsetWidth;
      panel.classList.add('fade');
    }

    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.pill');
      if (b) showService(Number(b.getAttribute('data-i')));
    });

    tabs.addEventListener('keydown', function (e) {
      var cur = buttons.indexOf(document.activeElement);
      if (cur < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = (cur + 1) % buttons.length;
      else if (e.key === 'ArrowLeft') next = (cur - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;
      if (next !== null) {
        e.preventDefault();
        buttons[next].focus();
        showService(next);
      }
    });

    showService(0);

    // Enlaces del pie que abren un servicio concreto
    document.querySelectorAll('[data-svc]').forEach(function (a) {
      a.addEventListener('click', function () {
        showService(Number(a.getAttribute('data-svc')));
      });
    });
  }

  /* ---------- Menú móvil y navegación ---------- */
  var nav = $('nav');
  var menuBtn = $('menuBtn');
  var header = $('siteHeader');
  var toTopBtn = $('toTopBtn');

  function closeMenu(restoreFocus) {
    if (!nav || !menuBtn || !nav.classList.contains('open')) return;
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuBtn.focus();
  }

  if (nav && menuBtn) {
    var links = nav.querySelectorAll('a');
    function setActive(id) {
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }

    links.forEach(function (a) {
      a.addEventListener('click', function () {
        setActive(a.getAttribute('href').slice(1));
        closeMenu(false);
      });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActive(en.target.id);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) {
        var sec = document.querySelector(a.getAttribute('href'));
        if (sec) io.observe(sec);
      });
    }

    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu(true);
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMenu(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeMenu(false);
    });

    /* ---------- Scroll: encabezado fijo, pie activo y volver arriba ---------- */
    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (toTopBtn) toTopBtn.hidden = y < 500;
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 40) {
        setActive('contacto');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Fotos del equipo: si no existe la imagen, se muestran las iniciales ---------- */
  document.querySelectorAll('.photo img').forEach(function (img) {
    function fail() { img.parentNode.classList.add('no-img'); }
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });

  var yearEl = $('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
