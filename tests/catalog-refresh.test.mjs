import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
const endpoint='https://raw.githubusercontent.com/Movilzone/movilzone/main/data/catalog.json';
const photoEndpoint=endpoint.replace('catalog.json','product-images.json');
const sample={id:'blue-phone',model:'iPhone 16',brand:'Apple',capacity:'128 GB',color:'Blue',state:'nuevo',currency:'USD',price:800,image:'/assets/reference.webp'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function boot(fail=false){
 const nodes=new Map(),intervals=[],requests=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='sort'?'default':'',dataset:{},classList:{remove(){},toggle(){}},innerHTML:'',textContent:'',hidden:false,open:false,addEventListener(){},setAttribute(){},focus(){},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};
 const state={fail,price:800,image:'/assets/blue.webp'};
 const document={hidden:false,getElementById:node,querySelectorAll:()=>[],addEventListener(){}};
 const location={href:'https://movilzone.github.io/movilzone/',hash:'#producto/blue-phone/Blue'};
 const window={MZ_STATIC_CATALOG:{products:[sample],sourceLabel:'Respaldo'},MZ_STATIC_IMAGES:{'iPhone 16':{blue:'/assets/backup-blue.webp'}},addEventListener(){},matchMedia:()=>({matches:true})};
 const fetch=async(url,options)=>{requests.push({url,options});const u=new URL(url);let data;if(u.pathname.endsWith('config.json'))data={catalogEnabled:true,catalogEndpoint:endpoint,colorImagesEndpoint:photoEndpoint};else if(url.startsWith(photoEndpoint))data={'iPhone 16':{blue:state.image}};else if(url.startsWith(endpoint)){if(state.fail)throw Error('offline');data={products:[{...sample,price:state.price}],sourceLabel:'Lista actual'};}else data={products:[sample],sourceLabel:'Respaldo local'};return {ok:true,json:async()=>data};};
 vm.runInNewContext(code,{document,window,location,history:{replaceState(_a,_b,h){location.hash=h;}},URL,Intl,AbortController,Date,fetch,setTimeout:()=>1,clearTimeout(){},setInterval:fn=>intervals.push(fn)});
 for(let i=0;i<6;i++)await tick();
 return {node,state,requests,refresh:()=>intervals[0]()};
}
test('lee el catálogo remoto sin depender de reconstruir GitHub Pages',async()=>{
 const app=await boot();assert.match(app.node('product-detail').innerHTML,/assets\/blue.webp/);assert.ok(app.requests.some(r=>r.url.startsWith(endpoint)&&r.url.includes('_mz=')));assert.match(app.node('catalog-source').textContent,/Lista actual/);
});
test('actualiza precio y foto por color en la ficha abierta',async()=>{
 const app=await boot();app.state.price=825;app.state.image='/assets/new-blue.webp';await app.refresh();
 const detail=app.node('product-detail').innerHTML;assert.match(detail,/825/);assert.match(detail,/assets\/new-blue.webp/);assert.ok(!detail.includes('src="assets/blue.webp"'));
});
test('si falla la fuente conserva el precio y muestra aviso; luego se recupera',async()=>{
 const app=await boot();app.state.fail=true;await app.refresh();assert.match(app.node('catalog-source').textContent,/No pudimos comprobar/);assert.match(app.node('product-detail').innerHTML,/800/);app.state.fail=false;app.state.price=830;await app.refresh();assert.match(app.node('product-detail').innerHTML,/830/);assert.ok(!app.node('catalog-source').textContent.includes('No pudimos'));
});
test('avisa cuando inicia con un catálogo de respaldo',async()=>{const app=await boot(true);assert.match(app.node('catalog-source').textContent,/mostramos el respaldo/);});
