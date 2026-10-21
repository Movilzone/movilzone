const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const slug=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function matrix(csv){if(csv.length>1000000)throw Error('size');const rows=[];let row=[],v='',q=false;for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(q&&csv[i+1]==='"'){v+='"';i++;}else q=!q;}else if(c===','&&!q){row.push(v);v='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(v);rows.push(row);row=[];v='';}else v+=c;}if(q)throw Error('csv');row.push(v);if(row.some(Boolean))rows.push(row);return rows;}
function amount(v){const s=String(v||'').replace(/US\$|U\$|\$|\s/g,'').replace(/,/g,'');return /^\d+(\.\d+)?$/.test(s)&&Number(s)>0?Number(s):null;}
export function liveCatalog(csv,baseline,modelImages={}){
 const rows=matrix(csv),header=rows.findIndex(r=>r.slice(0,8).join('|')==='MODELO|DETALLE|USD|PESOS|3 CUOTAS|6 CUOTAS|CATEGORÍA|DISPONIBILIDAD');if(header<0)throw Error('layout');
 const categories={USADO:'Apple',ACTIVADO:'Apple',SELLADO:'Apple',SAMSUNG:'Samsung',MOTOROLA:'Motorola',XIAOMI:'Xiaomi',POCO:'Xiaomi',MACBOOK:'Apple',IPAD:'Apple',AIRPODS:'Apple'};
 const known=[...new Set(baseline.products.map(p=>p.model))].sort((a,b)=>b.length-a.length);
 const products=[],ids=new Set();
 for(const r of rows.slice(header+1)){
  const [name,detail,usd,ars,q3,q6,category]=r;if(!categories[category]||!name||String(name).startsWith('REDMI PAD'))continue;
  const price=amount(usd);if(!price)continue;
  const parts=name.split(' · '),raw=parts[0].replace(/\s*\.\s*AS\s*IS\s*$/i,'').trim();const colorMatch=raw.match(/\s(SKY BLUE|LIGHT BLUE|AWESOME CHARCOAL|CHARCOAL|GOLD CYPRESS|BLACK|WHITE|BLUE|SILVER|SAGE|LAVENDER|ORANGE|GLACIER|BURGUNDY|GREY|GRAY|PINK|GREEN|PURPLE|GOLD|CITRUS|INDIGO|BLUSH|MIDNIGHT|SPACE|STARLIGHT|NAVY|VIOLET|CHERRY|SPELLBOUND|TEAL)\b/i);
  const modelText=(colorMatch?raw.slice(0,colorMatch.index):raw).trim();
  let model=known.find(m=>norm(m)===norm(modelText))||modelText.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/^Iphone/,'iPhone').replace(/^Ipad/,'iPad').replace(/^Macbook/,'MacBook').replace(/^Airpods/,'AirPods').replace(/Poco/g,'POCO').replace(/\b5g\b/g,'5G').replace(/17t\b/g,'17T');
  model=model.replace(/\b5g\b/gi,'5G').replace(/17t\b/gi,'17T');
  const color=colorMatch?raw.slice(colorMatch.index).trim().toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):'';

  let capacity=String(detail||''),ram;const memory=capacity.match(/^(\d+)\/(\d+)(GB|TB)$/i);if(memory){ram=memory[1]+' GB';capacity=memory[2]+' '+memory[3].toUpperCase();}else capacity=capacity.replace(/(\d+)GB/gi,'$1 GB');
  if(model.startsWith('AirPods')){if(detail)model+=' '+String(detail).toLowerCase();capacity='';}
  const state=/AS\s*IS/i.test(name)?'asis':category==='USADO'?'usado':category==='ACTIVADO'?'activado':'nuevo';
  const old=baseline.products.find(p=>!p.offer&&norm(p.model)===norm(model)&&norm(p.capacity)===norm(capacity)&&norm(p.color)===norm(color)&&norm(p.ram)===norm(ram)&&p.state===state);
  const id=old?.id||slug(`${model}-${detail}-${color}-${state}`);if(ids.has(id))throw Error('duplicate '+id+' '+name);ids.add(id);
  const notes=[];if(parts.slice(1).some(x=>/FALLA/i.test(x)))notes.push('Falla informada: no funciona la cámara 0,5x.');if(state==='activado')notes.push('Equipo activado. Consultá condición y garantía.');if(state==='asis')notes.push('Condición AS IS. Consultá detalles del equipo antes de comprar.');
  const photo=modelImages[model]||old?.image||baseline.products.find(p=>norm(p.model)===norm(model))?.image||'';
  const p={id,brand:categories[category],model,capacity,color,state,battery:old?.battery??null,price,currency:'USD',availability:'consultar',offer:false,image:photo,publicNotes:notes.join(' '),priceARS:amount(ars),installments3:amount(q3),installments6:amount(q6)};if(ram)p.ram=ram;products.push(p);
 }
 if(products.length<5)throw Error('empty');
 const offerRows=rows.slice(0,header).filter(r=>/OFERTA\s*·?\s*U\$[\d,]+/.test(r[6]||''));
 for(const row of offerRows){
  const title=String(row[0]||''),parts=title.split(' · '),model=norm(parts[0].replace(/\bUSADO\b|\bSELLADO\b|\bNUEVO\b|\bACTIVADO\b/gi,'')),capacity=norm(parts[1]);
  const state=/USADO/i.test(title)?'usado':/ACTIVADO/i.test(title)?'activado':/AS\s*IS/i.test(title)?'asis':/NUEVO|SELLADO/i.test(title)?'nuevo':null;
  const matches=products.filter(p=>norm(p.model)===model&&norm(p.capacity)===capacity&&(!state||p.state===state));
  if(!matches.length||(!state&&new Set(matches.map(p=>p.state)).size>1))continue;
  const original=matches[0],price=amount(row[6].match(/U\$([\d,]+)/)?.[1]),regularPrice=amount((row[4]||'').match(/U\$([\d,]+)/)?.[1]);
  if(!price)continue;
  const offer={...original,id:original.id+'-unidades-seleccionadas',price,offer:true,priceARS:null,installments3:null,installments6:null,publicNotes:'Oferta sujeta a disponibilidad. Consultá condiciones y estado de cada equipo. Unidades seleccionadas.'};
  if(regularPrice&&regularPrice>price)offer.regularPrice=regularPrice;
  products.unshift(offer);
 }

 return {products,sourceLabel:rows.find(r=>(r[2]||'').startsWith('Actualizada'))?.[2]||'Hoja 3',checkedAt:new Date().toISOString(),live:true};
}
