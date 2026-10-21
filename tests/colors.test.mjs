import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
const catalog=JSON.parse((await readFile(new URL('../data/catalog.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const colorImages=JSON.parse(await readFile(new URL('../data/product-images.json',import.meta.url),'utf8'));
function boot(hash='') {
 const nodes=new Map(),events={},opened=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='sort'?'default':'',dataset:{},classList:{remove(){},toggle(){return false;}},handlers:{},innerHTML:'',textContent:'',hidden:false,open:false,addEventListener(t,f){this.handlers[t]=f;},setAttribute(){},focus(){},scrollIntoView(options){this.scrollOptions=options;this.scrollCount=(this.scrollCount||0)+1;},showModal(){this.open=true;},close(){this.open=false;},setCustomValidity(){},reportValidity(){}});return nodes.get(id);};
 const document={getElementById:node,querySelectorAll:()=>[],addEventListener(t,f){(events[t]??=[]).push(f);}};
 const location={hash};
 const window={MZ_PREVIEW:{config:{whatsapp:'5492236606864'},catalog,colorImages},addEventListener(t,f){(events['window:'+t]??=[]).push(f);},open(url){opened.push(url);},matchMedia:()=>({matches:true})};
 vm.runInNewContext(code,{document,window,location,history:{replaceState(_a,_b,h){location.hash=h;}},Intl,URL,AbortSignal,navigator:{}});
 return {node,events,opened,location};
}
test('elegir color cambia foto, precio e identificador de consulta',()=>{
 const blue=catalog.products.find(p=>p.model==='iPhone 17 Pro'&&p.color==='Blue'&&p.capacity==='256 GB');
 const orange=catalog.products.find(p=>p.model===blue.model&&p.state===blue.state&&p.capacity===blue.capacity&&p.color==='Orange');
 const app=boot('#producto/'+blue.id);
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
 const p=catalog.products.find(p=>p.model==='iPhone 16'&&p.color.includes('Teal'));
 const html=boot('#producto/'+p.id+'/Teal').node('product-detail').innerHTML;
 assert.ok(html.includes(colorImages[p.model].teal.slice(1)));
 assert.ok(html.includes('data-selected-color="Teal"'));
});
test('color desconocido no muestra una foto de otro color',()=>{
 const p=catalog.products.find(p=>p.color);
 const prior=p.color;p.color='Color sin foto';
 try{const html=boot('#producto/'+p.id).node('product-detail').innerHTML;assert.ok(html.includes('Foto del color Color sin foto no disponible'));assert.ok(!html.includes('<img'));}finally{p.color=prior;}
});
test('todas las variantes actuales tienen fotografía de su color',()=>{
 const key=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
 for(const p of catalog.products)for(const color of String(p.color||'').split('/').map(s=>s.trim()).filter(Boolean)){
 const variants=Object.entries(colorImages).find(([name])=>key(name)===key(p.model))?.[1];
 assert.ok(variants&&Object.keys(variants).some(c=>key(c)===key(color)),p.model+' '+color);
 }
});
