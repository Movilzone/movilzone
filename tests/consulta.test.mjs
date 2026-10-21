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
