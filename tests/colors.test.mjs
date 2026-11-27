import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
const catalog=JSON.parse((await readFile(new URL('../data/catalog.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const colorImages=JSON.parse(await readFile(new URL('../data/product-images.json',import.meta.url),'utf8'));
function boot(hash='', previewCatalog=catalog) {
 const nodes=new Map(),events={},opened=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='sort'?'default':'',dataset:{},classList:{remove(){},toggle(){return false;}},handlers:{},innerHTML:'',textContent:'',hidden:false,open:false,addEventListener(t,f){this.handlers[t]=f;},setAttribute(){},focus(){},scrollIntoView(options){this.scrollOptions=options;this.scrollCount=(this.scrollCount||0)+1;},showModal(){this.open=true;},close(){this.open=false;},setCustomValidity(){},reportValidity(){}});return nodes.get(id);};
 const document={getElementById:node,querySelectorAll:()=>[],addEventListener(t,f){(events[t]??=[]).push(f);}};
 const location={hash};
 const window={MZ_PREVIEW:{config:{whatsapp:'5492236606864'},catalog:previewCatalog,colorImages},addEventListener(t,f){(events['window:'+t]??=[]).push(f);},open(url){opened.push(url);},matchMedia:()=>({matches:true})};
 vm.runInNewContext(code,{document,window,location,history:{replaceState(_a,_b,h){location.hash=h;}},Intl,URL,AbortSignal,navigator:{}});
 return {node,events,opened,location};
}
test('elegir color cambia foto, precio e identificador de consulta',()=>{
 const model='iPhone 17 Pro Max';
 const base={model,brand:'Apple',state:'nuevo',capacity:'256 GB',currency:'USD'};
 const blue={...base,id:'fixture-blue',color:'Blue',price:100};
 const orange={...base,id:'fixture-orange',color:'Orange',price:200};
 // Keep the interaction check independent of which variants are on sale.
 const app=boot('#producto/'+blue.id,{...catalog,products:[blue,orange]});
 assert.ok(app.node('product-detail').innerHTML.includes(colorImages[blue.model].blue.slice(1)));
 app.node('product-color').handlers.change({target:{value:'Orange'}});
 const html=app.node('product-detail').innerHTML;
 assert.ok(html.includes(colorImages[blue.model].orange.slice(1)));
 assert.ok(!html.includes('src="'+colorImages[blue.model].blue.slice(1)+'"'));
 assert.ok(html.includes('data-product-contact="'+orange.id+'"'));
 assert.ok(html.includes('data-selected-color="Orange"'));
 assert.ok(html.includes(new Intl.NumberFormat('es-AR').format(orange.price)));
 assert.ok(app.location.hash.endsWith('/Orange'));
});
test('enlace directo conserva el color y la foto elegidos',()=>{
 const p={id:'fixture-iphone16-teal',model:'iPhone 16',brand:'Apple',state:'nuevo',capacity:'128 GB',currency:'USD',price:100,color:'Teal'};
 const html=boot('#producto/'+p.id+'/Teal',{...catalog,products:[p]}).node('product-detail').innerHTML;
 assert.ok(html.includes(colorImages[p.model].teal.slice(1)));
 assert.ok(html.includes('data-selected-color="Teal"'));
});
test('color desconocido no muestra una foto de otro color',()=>{
 const p=catalog.products.find(p=>p.color);
 const prior=p.color;p.color='Color sin foto';
 try{const html=boot('#producto/'+p.id).node('product-detail').innerHTML;assert.ok(html.includes('Foto del color Color sin foto no disponible'));assert.ok(!html.includes('<img'));}finally{p.color=prior;}
});
test('variantes usan foto de su color o avisan cuando falta, sin sustituir otro color',()=>{
 const key=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
 for(const p of catalog.products)for(const color of String(p.color||'').split('/').map(s=>s.trim()).filter(Boolean)){
  const variants=Object.entries(colorImages).find(([name])=>key(name)===key(p.model))?.[1];
  const image=variants&&Object.entries(variants).find(([c])=>key(c)===key(color))?.[1];
  const html=boot('#producto/'+p.id+'/'+encodeURIComponent(color)).node('product-detail').innerHTML;
  if(image)assert.ok(html.includes(image.replace(/^\//,'')),p.model+' '+color);
  else{assert.ok(html.includes('Foto del color '+color+' no disponible'),p.model+' '+color);assert.ok(!html.includes('<img'),p.model+' '+color);}
 }
});
test('Apple Watch tiene filtro propio y muestra tamaño y correa',()=>{
 const base={brand:'Apple',state:'nuevo',capacity:'46MM',currency:'USD',color:'Jet Black',image:'',price:445};
 const watch={...base,id:'watch-test',model:'Apple Watch Series 11'};
 const other={...base,id:'phone-test',model:'iPhone 16'};
 const sample={products:[watch,other]};
 const app=boot('#equipos/watch',sample);assert.ok(app.node('product-grid').innerHTML.includes(watch.model));assert.ok(!app.node('product-grid').innerHTML.includes(other.model));
 assert.ok(boot('#producto/'+watch.id,sample).node('product-detail').innerHTML.includes('Tamaño y correa'));
});
