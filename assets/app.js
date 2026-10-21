(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalize = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchText = s => normalize(s).replace(/[^a-z0-9]+/g, '');

  let colorImages = {};
  let products = [], filter = 'all', loadFailed = false, visibleLimit = 12;
  let config = { whatsapp: '5492236606864', catalogEnabled: false, catalogEndpoint: '/api/catalog' };

  const brandFilters = { apple: 'Apple', samsung: 'Samsung', motorola: 'Motorola', xiaomi: 'Xiaomi' };
  const filterNames = {
    macbook: 'una MacBook', ipad: 'un iPad', airpods: 'AirPods', android: 'un Android',
    iphone: 'un iPhone', all: 'un equipo', apple: 'un iPhone nuevo', used: 'un iPhone usado',
    asis: 'un iPhone ASIS o activado', samsung: 'un Samsung', motorola: 'un Motorola', xiaomi: 'un Xiaomi'
  };
  const stateLabel = { nuevo: 'Nuevo', usado: 'Usado', asis: 'ASIS', activado: 'Activado' };

  const money = p => (p.currency === 'USD' ? 'U$S ' : '$ ') + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(p.price);
  const pesos = n => '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
  const extraPrice = p => `${p.regularPrice ? `<p class="regular-price">Habitual: ${money({ ...p, price: p.regularPrice })}</p>` : ''}${p.priceARS ? `<p class="ars-price">En pesos: ${pesos(p.priceARS)}</p>` : ''}`;
  const specs = p => [p.capacity, p.ram ? 'RAM ' + p.ram : '', p.color].filter(Boolean).join(' · ');

  const safeImage = value => {
    if (typeof value !== 'string') return '';
    if (/^\/?assets\/[\w/.-]+$/.test(value) && !value.includes('..')) {
      return value.startsWith('/') ? value.slice(1) : value;
    }
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
    } catch {
      return '';
    }
  };

  const productMessage = p => `Hola, estoy viendo ${[p.model, p.capacity, p.ram ? 'RAM ' + p.ram : '', p.color].filter(Boolean).join(' ')} (${stateLabel[p.state] || p.state}${p.offer ? ', oferta de unidades seleccionadas' : ''}) en la web de Movil Zone / Apple Zone. Quería confirmar disponibilidad y precio.`;

  function contact(message) {
    const phone = String(config.whatsapp || '5492236606864');
    if (/^549\d{10}$/.test(phone)) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    $('contact-message').value = message;
    $('copy-feedback').textContent = '';
    if (!$('contact-dialog').open) $('contact-dialog').showModal();
  }

  const modelKey = value => searchText(value);
  const colorKey = value => normalize(value).trim().replace(/\s+/g, ' ');
  function exactColorImage(model, color) {
    const variants=Object.entries(colorImages).find(([name])=>modelKey(name)===modelKey(model))?.[1];
    return variants ? Object.entries(variants).find(([name])=>colorKey(name)===colorKey(color))?.[1] : '';
  }
  function photo(p, requireExactColor=false) {
    const exact = exactColorImage(p.model,p.color);
    const path = safeImage(exact || (requireExactColor && p.color ? '' : p.image));
    const src = window.MZ_PREVIEW?.images?.[path] || path;
    const pending = requireExactColor && p.color ? 'Foto del color '+p.color+' no disponible. Consultanos.' : 'Foto de referencia · Consultanos';
    return `<div class="product-image">${src ? `<img src="${escape(src)}" alt="${escape('Foto comercial de ' + p.model + (exact ? ' · ' + p.color : ''))}" width="720" height="720" loading="lazy" decoding="async"><span class="photo-caption">${exact ? escape('Foto del modelo · '+p.color) : 'Foto del modelo · Color de referencia'}</span>` : `<span class="image-pending-icon" aria-hidden="true">▧</span><span class="placeholder-text">${escape(pending)}</span>`}</div>`;
  }

  document.addEventListener('error', event => {
    const image = event.target;
    if (image.tagName !== 'IMG' || !image.closest('.product-image')) return;
    const box = image.closest('.product-image');
    box.innerHTML = '<span class="image-pending-icon" aria-hidden="true">▧</span><span class="placeholder-text">Foto no disponible · Consultanos</span>';
  }, true);

  function card(p) {
    return `<article class="product-card">${photo(p)}<p class="product-meta">${escape(p.brand)} · ${escape(stateLabel[p.state] || p.state)}${p.offer ? ' · Oferta' : ''}</p><h3>${escape(p.model)}</h3><p class="product-spec">${p.variants?.length > 1 ? escape(p.variants.length + ' variantes · Elegí capacidad y color') : escape(specs(p))}${p.state === 'usado' ? ` · Batería ${p.battery !== null && p.battery !== undefined ? escape(p.battery) + '%' : 'a consultar'}` : ''}</p>${p.publicNotes ? `<p class="product-notes">${escape(p.publicNotes)}</p>` : ''}<p class="product-price">${p.variants?.some(v => v.price !== p.price) ? '<small class="price-from">Desde </small>' : ''}${money(p)}</p>${extraPrice(p)}<p class="availability">Disponibilidad a confirmar</p><div class="card-actions"><button class="button" ${p.variants?.length > 1 || (p.color && p.color.includes('/')) ? 'data-product-detail' : 'data-product-contact'}="${escape(p.id)}">${p.variants?.length > 1 || (p.color && p.color.includes('/')) ? 'Elegir variante ↗' : 'Consultar por WhatsApp ↗'}</button><button class="detail-button" data-product-detail="${escape(p.id)}">Ver detalle</button></div></article>`;
  }

  function render() {
    const query = normalize($('search').value);
    let result = products.filter(p => (
      filter === 'all' ||
      (filter === 'used' ? p.brand === 'Apple' && p.state === 'usado' :
       filter === 'asis' ? p.brand === 'Apple' && ['asis', 'activado'].includes(p.state) :
       filter === 'macbook' ? p.model.startsWith('MacBook') :
       filter === 'ipad' ? p.model.startsWith('iPad') :
       filter === 'airpods' ? p.model.startsWith('AirPods') :
       filter === 'android' ? p.brand !== 'Apple' :
       filter === 'iphone' ? p.model.startsWith('iPhone') :
       p.brand === brandFilters[filter] && (filter !== 'apple' || (p.state === 'nuevo' && p.model.startsWith('iPhone'))))
    ) && query.split(/\s+/).filter(Boolean).every(term => searchText([p.brand, p.model, p.capacity, p.ram, p.color].join(' ')).includes(searchText(term))));

    const groups = new Map();
    for (const p of result) {
      const key = [p.model, p.state, p.offer ? 'offer' : 'regular', p.currency].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    result = Array.from(groups.values(), variants => ({ ...variants.reduce((a, b) => a.price <= b.price ? a : b), variants }));

    const sort = $('sort').value;
    if (sort === 'price-asc' || sort === 'price-desc') {
      result.sort((a, b) => a.currency.localeCompare(b.currency) || (sort === 'price-asc' ? a.price - b.price : b.price - a.price));
    }
    if (sort === 'model') {
      result.sort((a, b) => a.model.localeCompare(b.model, 'es', { numeric: true }));
    }

    $('reset-catalog').hidden = !query && filter === 'all' && sort === 'default';
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    $('result-count').textContent = products.length
      ? `${result.length} ${result.length === 1 ? 'opción' : 'opciones'} · Mostrando ${Math.min(visibleLimit, result.length)}`
      : (loadFailed ? 'Consultanos por el modelo que estás buscando.' : 'Consultanos por el modelo que estás buscando.');

    $('product-grid').innerHTML = result.slice(0, visibleLimit).map(card).join('');
    $('load-more').hidden = result.length <= visibleLimit;
    $('load-more').textContent = `Ver más equipos (${Math.min(12, result.length - visibleLimit)})`;
    $('empty-state').hidden = result.length > 0;
    $('empty-title').textContent = products.length ? 'No encontramos ese equipo.' : 'Consultanos por el modelo que estás buscando.';
    $('empty-description').textContent = products.length ? 'Probá con otro modelo o consultanos directamente por WhatsApp.' : 'Escribinos por WhatsApp y te confirmamos disponibilidad y cotización.';

    const offers = products.filter(p => p.offer);
    const featured = offers[0];
    $('hero-offer').hidden = !featured;
    if (featured) {
      if (featured.image) {
        $('hero-product-image').src = safeImage(featured.image);
        $('hero-product-image').alt = 'Foto comercial de ' + featured.model;
      }
      $('hero-offer').innerHTML = `
        <span class="offer-tag">OFERTA · UNIDADES SELECCIONADAS</span>
        <strong>${escape(featured.model)}<small>${escape(featured.capacity)} · ${escape(stateLabel[featured.state] || featured.state)}</small></strong>
        <div class="hero-offer-price">${featured.regularPrice ? `<del>${money({ ...featured, price: featured.regularPrice })}</del>` : ''}<b>${money(featured)}</b></div>
        <button class="button" data-product-detail="${escape(featured.id)}">Ver oferta ↗</button>
        <small>Confirmá disponibilidad, batería y estado por WhatsApp.</small>
      `;
    }

    $('offers-grid').innerHTML = offers.map(p => `
      <article class="offer-editorial">${photo(p)}
        <div class="offer-editorial-copy">
          <span class="offer-tag">APPLE ZONE · UNIDADES SELECCIONADAS</span>
          <h3>${escape(p.model)}</h3>
          <p class="offer-spec">${escape(p.capacity)} · ${escape(stateLabel[p.state] || p.state)}</p>
          <p class="offer-price">${p.regularPrice ? `<del>${money({ ...p, price: p.regularPrice })}</del>` : ''}<strong>${money(p)}</strong></p>
          ${p.regularPrice ? `<p class="offer-saving">Ahorrás ${money({ ...p, price: p.regularPrice - p.price })} respecto del precio habitual.</p>` : ''}
          <p class="offer-condition">${escape(p.publicNotes || 'Consultá condiciones de cada equipo.')} Batería y color: consultar.</p>
          <div class="dialog-actions">
            <button class="button" data-product-contact="${escape(p.id)}">Consultar esta oferta ↗</button>
            <button class="text-link" data-product-detail="${escape(p.id)}">Ver ficha →</button>
          </div>
        </div>
      </article>
    `).join('');
    $('offers-empty').hidden = offers.length > 0;
  }

  function showProduct(id, selectedColor) {
    const original = products.find(p => p.id === id);
    if (!original) return;
    const variants = products.filter(v => v.model === original.model && v.state === original.state && v.offer === original.offer && v.currency === original.currency);
    const colorOptions = v => String(v.color || '').split('/').map(c => c.trim()).filter(Boolean);
    const compatible = variants.filter(v => v.capacity === original.capacity && v.ram === original.ram);
    const colors = [...new Set(compatible.flatMap(colorOptions))];
    const chosen = colorOptions(original).includes(selectedColor) ? selectedColor : (colorOptions(original)[0] || '');
    const p = { ...original, color: chosen };

    history.replaceState(null, '', `#producto/${p.id}${chosen ? '/' + encodeURIComponent(chosen) : ''}`);
    $('product-detail').innerHTML = `
      ${photo(p,Boolean(chosen))}
      <p class="eyebrow">${escape(p.brand)} · ${escape(stateLabel[p.state] || p.state)}</p>
      <h2 id="product-title">${escape(p.model)}</h2>
      ${variants.length > 1 ? `<label class="variant-label" for="product-variant">Elegí capacidad y color</label><select class="variant-select" id="product-variant">${variants.map(v => `<option value="${escape(v.id)}" ${v.id === p.id ? 'selected' : ''}>${escape(specs(v) || v.model)} — ${money(v)}</option>`).join('')}</select>` : ''}
      ${colors.length > 1 ? `<label class="variant-label" for="product-color">Color</label><select class="variant-select" id="product-color">${colors.map(c => `<option ${c === chosen ? 'selected' : ''} value="${escape(c)}">${escape(c)}</option>`).join('')}</select>` : ''}
      <dl class="detail-specs">
        ${p.capacity ? `<div><dt>Capacidad</dt><dd>${escape(p.capacity)}</dd></div>` : ''}
        ${!p.model.startsWith('AirPods') ? `<div><dt>Color</dt><dd>${escape(p.color || 'Consultar')}</dd></div>` : ''}
        ${p.state === 'usado' ? `<div><dt>Batería</dt><dd>${p.battery !== null && p.battery !== undefined ? escape(p.battery) + '%' : 'Consultar'}</dd></div>` : ''}
        ${p.ram ? `<div><dt>Memoria RAM</dt><dd>${escape(p.ram)}</dd></div>` : ''}
        <div><dt>Disponibilidad</dt><dd>Consultar stock en local</dd></div>
      </dl>
      ${p.publicNotes ? `<p class="product-notes">${escape(p.publicNotes)}</p>` : ''}
      <div class="product-price">${money(p)}</div>
      ${extraPrice(p)}
      ${p.installments3 || p.installments6 ? `<div class="installment-options">${p.installments3 ? `<p>3 cuotas de <strong>${pesos(p.installments3)}</strong></p>` : ''}${p.installments6 ? `<p>6 cuotas de <strong>${pesos(p.installments6)}</strong></p>` : ''}<small>Con tarjeta de crédito. Consultá promociones vigentes.</small></div>` : ''}
      <div class="dialog-actions">
        <button class="button" data-product-contact="${escape(p.id)}" data-selected-color="${escape(chosen)}">Consultar por WhatsApp ↗</button>
      </div>
    `;

    $('product-color')?.addEventListener('change', event => {
      const color = event.target.value;
      const variant = compatible.find(v => colorOptions(v).includes(color));
      if (variant) {
        history.replaceState(null, '', `#producto/${variant.id}`);
        showProduct(variant.id, color);
        $('product-color')?.focus();
      }
    });

    $('product-variant')?.addEventListener('change', event => {
      history.replaceState(null, '', `#producto/${event.target.value}`);
      showProduct(event.target.value, chosen);
      $('product-variant')?.focus();
    });

    if (!$('product-dialog').open) $('product-dialog').showModal();
  }

  function route(scroll = false) {
    const hash = location.hash.replace(/^#/, '');
    if (hash.startsWith('producto/')) {
      const [id, encodedColor] = hash.slice(9).split('/');
      let color;
      try {
        color = encodedColor ? decodeURIComponent(encodedColor) : undefined;
      } catch {
        color = undefined;
      }
      if (products.some(p => p.id === id)) {
        showProduct(id, color);
      } else if (!loadFailed) {
        history.replaceState(null, '', '#equipos');
        $('equipos').scrollIntoView({ behavior: 'instant' });
      }
      return;
    }

    if ($('product-dialog').open) $('product-dialog').close();
    if (hash === 'equipos' || hash.startsWith('equipos/')) {
      const chosen = hash.split('/')[1] || 'all';
      if (scroll) $('search').value = '';
      filter = filterNames[chosen] ? chosen : 'all';
      visibleLimit = 12;
      render();
      if (scroll) {
        $(hash.startsWith('equipos/') ? 'catalogo' : 'equipos').scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start'
        });
      }
    }
  }

  document.addEventListener('click', event => {
    const categoryLink = event.target.closest('a[href^="#equipos/"]');
    if (categoryLink && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      history.replaceState(null, '', categoryLink.getAttribute('href'));
      route(true);
    }

    const btn = event.target.closest('[data-contact],[data-product-contact],[data-product-detail],[data-filter],[data-close]');
    if (btn) {
      if (btn.dataset.contact !== undefined) contact(btn.dataset.contact);
      if (btn.dataset.productContact) {
        const p = products.find(p => p.id === btn.dataset.productContact);
        if (p) {
          $('product-dialog').close();
          contact(productMessage(btn.dataset.selectedColor ? { ...p, color: btn.dataset.selectedColor } : p));
        }
      }
      if (btn.dataset.productDetail) {
        if (products.some(p => p.id === btn.dataset.productDetail)) {
          history.replaceState(null, '', `#producto/${btn.dataset.productDetail}`);
          showProduct(btn.dataset.productDetail);
        } else {
          contact('Hola, quisiera consultar por el equipo que aparece en la página.');
        }
      }
      if (btn.dataset.filter) {
        filter = btn.dataset.filter;
        visibleLimit = 12;
        history.replaceState(null, '', filter === 'all' ? '#equipos' : `#equipos/${filter}`);
        render();
      }
      if (btn.dataset.close) $(btn.dataset.close).close();
    }

    if (event.target.closest('nav a,nav button[data-contact]')) {
      $('main-nav').classList.remove('open');
      $('menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });

  $('menu-toggle').addEventListener('click', () => {
    const open = $('main-nav').classList.toggle('open');
    $('menu-toggle').setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $('main-nav').classList.remove('open');
      $('menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });

  $('reset-catalog').addEventListener('click', () => {
    $('search').value = '';
    $('sort').value = 'default';
    filter = 'all';
    visibleLimit = 12;
    history.replaceState(null, '', '#equipos');
    render();
    $('search').focus();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) {
      $('main-nav').classList.remove('open');
      $('menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });

  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        dialog.close();
      }
    }
  }));

  $('search').addEventListener('input', () => { visibleLimit = 12; render(); });
  $('sort').addEventListener('change', () => { visibleLimit = 12; render(); });
  $('load-more').addEventListener('click', () => { visibleLimit += 12; render(); });

  $('empty-contact').addEventListener('click', () => contact(`Hola, estoy viendo la web de Movil Zone. Quería consultar por ${$('search').value.trim() || filterNames[filter]}.`));

  $('copy-message').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('contact-message').value);
      $('copy-feedback').textContent = 'Mensaje copiado con éxito.';
    } catch {
      $('contact-message').select();
      $('copy-feedback').textContent = 'Seleccioná el texto y copialo para enviarlo.';
    }
  });

  $('product-dialog').addEventListener('close', () => {
    if (location.hash.startsWith('#producto/')) {
      history.replaceState(null, '', filter === 'all' ? '#equipos' : `#equipos/${filter}`);
    }
  });

  window.addEventListener('hashchange', () => route(true));

  const services = ['Módulo y pantalla', 'Batería', 'Flex de carga', 'Cámaras y tapa', 'Software', 'Reparación de placa', 'PC y notebooks', 'Consolas y joysticks'];
  $('services').innerHTML = services.map((s, i) => `
    <button class="service-row" data-repair="${escape(s)}">
      <span><small class="service-number">${String(i + 1).padStart(2, '0')}</small><strong>${escape(s)}</strong></span>
      <i aria-hidden="true">↗</i>
    </button>
  `).join('');

  $('services').addEventListener('click', event => {
    const button = event.target.closest('[data-repair]');
    if (!button) return;
    $('repair-service').value = button.dataset.repair;
    $('repair-form').scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'center'
    });
    $('repair-device').focus({ preventScroll: true });
  });

  $('repair-form').addEventListener('submit', event => {
    event.preventDefault();
    const device = $('repair-device').value.trim(), issue = $('repair-issue').value.trim();
    if (!device || !issue) {
      const input = !device ? $('repair-device') : $('repair-issue');
      input.setCustomValidity('Completá este dato para preparar tu consulta.');
      input.reportValidity();
      return;
    }
    contact(`Hola, estoy viendo el servicio técnico de Movil Zone en Mar del Plata.\nEquipo: ${device}\nConsulta: ${$('repair-service').value}\nFalla: ${issue}\nQuería consultar por el diagnóstico y presupuesto.`);
  });

  ['repair-device', 'repair-issue'].forEach(id => $(id).addEventListener('input', () => $(id).setCustomValidity('')));

  if ($('year')) $('year').textContent = new Date().getFullYear();

  async function json(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const r = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
      if (!r.ok) throw new Error('No disponible');
      return await r.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  (async () => {
    try {
      let data = null;
      if (window.MZ_PREVIEW) {
        config = { ...config, ...window.MZ_PREVIEW.config };
        data = window.MZ_PREVIEW.catalog;
        colorImages = window.MZ_PREVIEW.colorImages || {};
      } else {
        try {
          config = { ...config, ...(await json('config.json').catch(() => ({}))) };
          colorImages = await json('data/product-images.json').catch(() => ({}));
          if (config.catalogEnabled && config.catalogEndpoint) {
            data = await json(config.catalogEndpoint).catch(() => null);
          }
          if (!data) {
            [data, colorImages] = await Promise.all([
              json('data/catalog.json').catch(() => null),
              json('data/product-images.json').catch(() => ({}))
            ]);
          }
        } catch {
          // Fallback a objetos estáticos precargados
          data = window.MZ_STATIC_CATALOG;
          colorImages = window.MZ_STATIC_IMAGES || {};
        }
      }

      // Si fetch no devolvió datos (por ejemplo, en protocolo local file://), usar el fallback garantizado
      if (!data || !Array.isArray(data.products)) {
        if (window.MZ_STATIC_CATALOG && Array.isArray(window.MZ_STATIC_CATALOG.products)) {
          data = window.MZ_STATIC_CATALOG;
          colorImages = window.MZ_STATIC_IMAGES || {};
        } else {
          throw new Error('Catálogo no disponible');
        }
      }

      if ($('catalog-source')) {
        $('catalog-source').textContent = `${data.sourceLabel || 'Lista de precios'} · Disponibilidad y stock a confirmar por WhatsApp.`;
      }

      products = data.products.filter(p => p && typeof p.id === 'string' && typeof p.model === 'string' && typeof p.price === 'number' && Number.isFinite(p.price) && p.price > 0 && ['USD', 'ARS'].includes(p.currency));
    } catch {
      loadFailed = true;
      products = [];
    }
    render();
    route(false);
    if (!window.MZ_PREVIEW) {
      let refreshing=false;
      const refresh=async()=>{
        if(refreshing || document.hidden)return;
        refreshing=true;
        try{
          const data=await json(config.catalogEndpoint || 'data/catalog.json');
          if(!Array.isArray(data.products)||!data.products.length)throw Error('Catálogo inválido');
          if(JSON.stringify(products)!==JSON.stringify(data.products)){
            products=data.products;loadFailed=false;render();
            if($('product-dialog').open)route(false);
          }
          $('catalog-source').textContent=`${data.sourceLabel || 'Lista de precios'} · Disponibilidad y stock a confirmar por WhatsApp.`;
        }catch{$('catalog-source').textContent='No pudimos comprobar la última lista. Precios de referencia: confirmalos por WhatsApp.';}
        finally{refreshing=false;}
      };
      setInterval(refresh,60000);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    }
  })();
})();
