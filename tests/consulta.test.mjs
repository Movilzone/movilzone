import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(path, 'utf8');
test('consulta agrupada con estados accesibles y precios orientativos', () => {
  const html = read('index.html'), js = read('assets/app.js');
  assert.ok(html.includes('id="quote-dialog"'));
  assert.ok(html.includes('id="quote-whatsapp"'));
  assert.ok(html.includes('no constituye una reserva ni una compra'));
  assert.ok(html.includes('role="group" aria-label="Filtrar catálogo"'));
  assert.ok(js.includes('localStorage.setItem(QUOTE_KEY'));
  assert.ok(js.includes('window.MZ_STATIC_CATALOG'));
  assert.ok(js.includes('loadStaticFallback()'));
  assert.ok(js.includes('quoteMessage()'));
  assert.ok(!html.includes('<script src="data/catalog-fallback.js"></script>'));
});

test('experiencia de búsqueda, ficha compartible, SEO y navegación comercial', () => {
  const html = read('index.html'), js = read('assets/app.js');
  assert.ok(html.includes('id="model-suggestions"'));
  assert.ok(html.includes('id="como-comprar"'));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes('property="og:url"'));
  assert.ok(js.includes('updateSuggestions()'));
  assert.ok(js.includes('data-product-share'));
  assert.ok(js.includes('navigator.share'));
  assert.ok(js.includes("location.protocol !== 'file:'"));
});

test('estilo editorial sin números decorativos ni tarjetas apiladas', () => {
  const html = read('index.html');
  const js = read('assets/app.js');
  const css = read('assets/refinement.css');
  assert.ok(!html.includes('journey-number'));
  assert.ok(!js.includes('class="service-number"'));
  assert.ok(!js.includes("padStart(2, '0')"));
  assert.ok(html.includes('<article class="journey-step">'));
  assert.ok(css.includes('.journey-step + .journey-step'));
  assert.ok(css.includes('.repair-intro'));
  assert.ok(css.includes('.product-grid .product-card'));
  assert.ok(css.includes('.community-card'));
  assert.ok(css.includes('@media (max-width: 560px)'));
  assert.ok(html.includes('assets/refinement.css'));
});
