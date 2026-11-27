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

test('clasifica equipos sellados por su marca sin cambiar condición ni precio',()=>{
 const csv=[head,...rows,
  'SAMSUNG GALAXY A57 5G,8/256GB,485,759025,,,SELLADO,CONSULTAR',
  'MOTOROLA MOTO G17,4/128GB,210,,,,SELLADO,CONSULTAR',
  'POCO X8 PRO 5G,8/256GB,440,,,,SELLADO,CONSULTAR',
  'IPHONE 16,128GB,820,,,,SELLADO,CONSULTAR',
 ].join('\n');
 const products=liveCatalog(csv,baseline).products.slice(-4);
 assert.deepEqual(products.map(p=>[p.brand,p.state,p.price]),[
  ['Samsung','nuevo',485],['Motorola','nuevo',210],['Xiaomi','nuevo',440],['Apple','nuevo',820],
 ]);
 assert.equal(products[0].priceARS,759025);
});

test('lee miles con punto y conserva el color de una oferta seleccionada',()=>{
 const csv=['IPHONE 17 PRO MAX SELLADO · 256GB · BLUE,,,,PRECIO HABITUAL · U$1.400,,OFERTA · U$1.300,',head,...rows,
 'IPHONE 17 PRO MAX ORANGE / BLUE,256GB,1300,,,,SELLADO,DISPONIBLE',
 'IPHONE 17 PRO MAX SILVER,256GB,1335,,,,SELLADO,DISPONIBLE'].join('\n');
 const offer=liveCatalog(csv,baseline).products.find(p=>p.offer);
 assert.equal(offer.price,1300);assert.equal(offer.regularPrice,1400);
 assert.equal(offer.color,'Blue');assert.equal(offer.state,'nuevo');
 const withdrawn=liveCatalog([head,...rows].join('\n'),baseline);
 assert.equal(withdrawn.products.filter(p=>p.offer).length,0);
});

test('separa colores en español del modelo sin alterar precios ni inventar variantes',()=>{
 const csv=[head,...rows,
 'IPHONE 18 PRO MAX GLACIAR / BLACK,256GB,1555,,,,SELLADO,DISPONIBLE',
 'REDMI NOTE 15 PRO AZUL GLACIAR,8/256GB,360,,,,XIAOMI,DISPONIBLE',
 'MOTOROLA MOTO G86 POWER 5G CEREZA,8/256GB,360,,,,MOTOROLA,DISPONIBLE',
 'SAMSUNG GALAXY A37 5G BLANCO,8/256GB,445,,,,SAMSUNG,DISPONIBLE',
 'IPHONE 17 TODOS LOS COLORES,256GB,1035,,,,SELLADO,DISPONIBLE'].join('\n');
 const products=liveCatalog(csv,baseline).products;
 for(const [model,color,price] of [['iPhone 18 Pro Max','Glacier / Black',1555],['Redmi Note 15 Pro','Glacier Blue',360],['Motorola Moto G86 Power 5G','Cherry',360],['Samsung Galaxy A37 5G','White',445],['iPhone 17','',1035]]){
  const p=products.find(p=>p.model===model&&p.price===price);assert.ok(p,model);assert.equal(p.color,color);
 }
});

test('separa los colores compuestos de Apple Watch sin cambiar sus importes',()=>{
 const csv=[head,...rows,
 'APPLE WATCH SERIES 11 JET BLACK,46MM,445,758725,346311,199569,SELLADO,DISPONIBLE',
 'APPLE WATCH SERIES 12 LIGHT GOLD,42MM,495,,,,SELLADO,DISPONIBLE',
 'APPLE WATCH SERIES 12 BRONZE / GRAY / JET BLACK,46MM,545,,,,SELLADO,DISPONIBLE',
 'APPLE WATCH SE 3 STARLIGHT,40MM,325,,,,SELLADO,DISPONIBLE',
 'IPHONE 17 OTROS COLORES,256GB,1060,,,,SELLADO,DISPONIBLE'].join('\n');
 const p=liveCatalog(csv,baseline).products.slice(-5);
 assert.deepEqual(p.map(v=>[v.model,v.color,v.price]),[
 ['Apple Watch Series 11','Jet Black',445],['Apple Watch Series 12','Light Gold',495],['Apple Watch Series 12','Bronze / Gray / Jet Black',545],['Apple Watch SE 3','Starlight',325],['iPhone 17','Otros Colores',1060]]);
 assert.equal(p[0].priceARS,758725);assert.equal(p[0].installments3,346311);assert.equal(p[0].capacity,'46MM');
});
