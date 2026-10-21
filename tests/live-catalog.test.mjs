import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {liveCatalog} from '../scripts/live-catalog.mjs';
const baseline=JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url)));
const head='MODELO,DETALLE,USD,PESOS,3 CUOTAS,6 CUOTAS,CATEGORÍA,DISPONIBILIDAD';
const rows=['IPHONE 11,64GB,180,279000,127420,73429,USADO,● EN STOCK','IPHONE 13,128GB,360,558000,254841,146857,USADO,● EN STOCK','AIRPODS 4,,185,,,,AIRPODS,CONSULTAR','AIRPODS 4,CON CANCELACIÓN,230,,,,AIRPODS,CONSULTAR','REDMI 15C,4/256GB,200,,,,XIAOMI,CONSULTAR','REDMI 15C,8/256GB,220,,,,XIAOMI,CONSULTAR'];
test('lee precios de venta y separa RAM y AirPods con cancelación',()=>{const d=liveCatalog([head,...rows].join('\n'),baseline);assert.equal(d.products.length,6);assert.equal(d.products[0].price,180);assert.equal(d.products[0].priceARS,279000);assert.equal(d.products[3].model,'AirPods 4 con cancelación');assert.notEqual(d.products[4].id,d.products[5].id);assert.equal(d.products[5].ram,'8 GB');assert.equal(d.live,true);});
test('refleja un cambio posterior sin reconstruir el catálogo',()=>{const csv=[head,...rows].join('\n');assert.equal(liveCatalog(csv.replace('64GB,180','64GB,199'),baseline).products[0].price,199);});
test('omite filas sin precio y columnas privadas',()=>{const csv=[head+',COSTO',...rows.map(r=>r+',1'),'MACBOOK NEO A18 13” BLUSH / INDIGO,8/256GB,,,,,MACBOOK,CONSULTAR,700'].join('\n');const d=liveCatalog(csv,baseline);assert.equal(d.products.length,6);assert.ok(d.products.every(p=>!('COSTO' in p)));});
test('rechaza una fuente incompleta en lugar de reemplazar el catálogo',()=>{assert.throws(()=>liveCatalog('login html',baseline));assert.throws(()=>liveCatalog(head,baseline));});

test('cambia modelo de oferta y no reutiliza el destacado anterior',()=>{
 const csv=['IPHONE 17 USADO · 256GB,,,,PRECIO HABITUAL · U$900,,OFERTA · U$880,',head,...rows,'IPHONE 17,256GB,880,,,,USADO,DISPONIBLE'].join('\n');
 const d=liveCatalog(csv,baseline),offers=d.products.filter(p=>p.offer);assert.equal(offers.length,1);assert.equal(offers[0].model,'iPhone 17');assert.equal(offers[0].price,880);assert.equal(offers[0].state,'usado');
 const noOffer=liveCatalog([head,...rows].join('\n'),baseline);assert.equal(noOffer.products.filter(p=>p.offer).length,0);
});
test('separa nombres y colores nuevos y conserva RAM cuando la capacidad es TB',()=>{
 const csv=[head,...rows,'MACBOOK AIR M5 13” SKY BLUE,16/1TB,1500,,,,MACBOOK,DISPONIBLE','MACBOOK NEO 13” INDIGO / SILVER,512GB,990,,,,MACBOOK,DISPONIBLE'].join('\n');
 const d=liveCatalog(csv,baseline,{'MacBook Air M5 13”':'/assets/products/macbook-m5-13.webp'});
 const mac=d.products.find(p=>p.model==='MacBook Air M5 13”');assert.equal(mac.color,'Sky Blue');assert.equal(mac.capacity,'1 TB');assert.equal(mac.ram,'16 GB');assert.equal(mac.image,'/assets/products/macbook-m5-13.webp');
 assert.equal(d.products.find(p=>p.model==='MacBook Neo 13”').color,'Indigo / Silver');
});
