/* EUKO · Panel — lógica
   Datos: se guardan en este navegador (localStorage, clave "euko-dashboard-v1") con copia automática,
   respaldo/restauración en JSON, exportación CSV y deshacer. */
(function(){
'use strict';
/* ===== utilidades ===== */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const today=()=>ymd(new Date());
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parse(s).getTime());
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)};
const addMonths=(s,n)=>{const d=parse(s);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return ymd(d)};
const diffDays=(a,b)=>Math.round((parse(a)-parse(b))/864e5);
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DIASL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const fdate=s=>{if(!isDate(s))return '—';const d=parse(s);return d.getDate()+' '+MES[d.getMonth()]+' '+d.getFullYear()};
const group=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
let HIDE=false;
const copRaw=n=>{n=Number(n)||0;return (n<0?'-':'')+'$'+group(Math.abs(Math.round(n)))};
const cop=n=>'<span class="mv">'+copRaw(n)+'</span>';
const kfmt=n=>{n=Number(n)||0;const a=Math.abs(n);if(a>=1e6)return (n/1e6).toFixed(a>=1e7?0:1).replace('.',',')+' M';if(a>=1e3)return Math.round(n/1e3)+' k';return String(Math.round(n))};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const initials=n=>String(n).split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
const hashColor=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]};
const monthKey=s=>String(s).slice(0,7);
const mlabel=k=>MES[+k.split('-')[1]-1];
const mlong=k=>{const p=k.split('-');return MESL[+p[1]-1]+' '+p[0]};
const numOnly=v=>+String(v||'').replace(/[^\d]/g,'')||0;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDemoId=id=>String(id).indexOf('d-')===0;


/* ===== entidades: bancos, billeteras, casas de apuestas, créditos y comercios ===== */
/* Para usar el logo oficial de una entidad: pon el archivo en la carpeta logos/ (por ejemplo logos/nequi.png)
   y agrega su id a esta lista: const LOGO_FILES=['nequi','bancolombia']; */
const LOGO_FILES=[];
const ENT=[
 {id:'bancolombia',n:'Bancolombia',cat:'banco',bg:'#FDDA24',fg:'#16181d',t:'B',al:['bancolombia','sucursal virtual']},
 {id:'nequi',n:'Nequi',cat:'billetera',bg:'#200020',fg:'#E6007E',t:'n',al:['nequi']},
 {id:'daviplata',n:'Daviplata',cat:'billetera',bg:'#E1261C',fg:'#fff',t:'DP',al:['davi plata']},
 {id:'davivienda',n:'Davivienda',cat:'banco',bg:'#CC0000',fg:'#fff',t:'Davi',al:['davivienda']},
 {id:'nu',n:'Nu',cat:'banco',bg:'#820AD1',fg:'#fff',t:'nu',credit:true,al:['nubank','nu bank']},
 {id:'bbva',n:'BBVA',cat:'banco',bg:'#004481',fg:'#fff',t:'BBVA',credit:true,al:['bbva']},
 {id:'bogota',n:'Banco de Bogotá',cat:'banco',bg:'#0A3A8C',fg:'#fff',t:'BdB',credit:true,al:['bogota','banco bogota']},
 {id:'occidente',n:'Banco de Occidente',cat:'banco',bg:'#0A5BA8',fg:'#fff',t:'Occ',credit:true,al:['occidente']},
 {id:'colpatria',n:'Scotiabank Colpatria',cat:'banco',bg:'#EC111A',fg:'#fff',t:'SC',credit:true,al:['colpatria','scotiabank']},
 {id:'popular',n:'Banco Popular',cat:'banco',bg:'#00843D',fg:'#fff',t:'BP',al:['popular']},
 {id:'lulo',n:'Lulo Bank',cat:'banco',bg:'#D8FF3E',fg:'#16181d',t:'lulo',credit:true,al:['lulo']},
 {id:'falabella',n:'Falabella · CMR',cat:'comercio',bg:'#78B600',fg:'#fff',t:'F',credit:true,al:['falabella','cmr','banco falabella']},
 {id:'exito',n:'Éxito',cat:'comercio',bg:'#FFE600',fg:'#111',t:'éxito',credit:true,al:['exito','tarjeta exito']},
 {id:'rappi',n:'Rappi · RappiPay',cat:'comercio',bg:'#FF441F',fg:'#fff',t:'R',credit:true,al:['rappi','rappipay','rappi pay']},
 {id:'didi',n:'DiDi',cat:'comercio',bg:'#FC6A19',fg:'#fff',t:'DiDi',al:['didi','didi food']},
 {id:'betano',n:'Betano',cat:'apuestas',bg:'#FF5A00',fg:'#fff',t:'B',al:['betano']},
 {id:'betplay',n:'Betplay',cat:'apuestas',bg:'#F4D100',fg:'#111',t:'bp',al:['betplay','bet play']},
 {id:'wplay',n:'Wplay',cat:'apuestas',bg:'#00A94F',fg:'#fff',t:'W',al:['wplay','w play']},
 {id:'rushbet',n:'Rushbet',cat:'apuestas',bg:'#E3004F',fg:'#fff',t:'RB',al:['rushbet','rush bet']},
 {id:'codere',n:'Codere',cat:'apuestas',bg:'#C8102E',fg:'#fff',t:'Cod',al:['codere']},
 {id:'bet365',n:'Bet365',cat:'apuestas',bg:'#0F7B5C',fg:'#FFDF1B',t:'365',al:['bet365','bet 365']},
 {id:'betfair',n:'Betfair',cat:'apuestas',bg:'#FFB80C',fg:'#111',t:'BF',al:['betfair','exchange']},
 {id:'stake',n:'Stake',cat:'apuestas',bg:'#0F212E',fg:'#00E701',t:'S',al:['stake']},
 {id:'pinnacle',n:'Pinnacle',cat:'apuestas',bg:'#E4572E',fg:'#fff',t:'Pin',al:['pinnacle']},
 {id:'paypal',n:'PayPal',cat:'pagos',bg:'#003087',fg:'#fff',t:'PP',al:['paypal','pay pal']},
 {id:'skrill',n:'Skrill',cat:'pagos',bg:'#862165',fg:'#fff',t:'Sk',al:['skrill']},
 {id:'neteller',n:'Neteller',cat:'pagos',bg:'#84BD00',fg:'#111',t:'N',al:['neteller']},
 {id:'binance',n:'Binance',cat:'cripto',bg:'#F3BA2F',fg:'#16181d',t:'BNB',al:['binance','cripto','usdt']},
 {id:'mercadopago',n:'Mercado Pago',cat:'pagos',bg:'#00AEEF',fg:'#fff',t:'MP',al:['mercado pago','mercadopago']},
 {id:'pse',n:'PSE',cat:'pagos',bg:'#0066B3',fg:'#fff',t:'PSE',al:['pse','transferencia pse']},
 {id:'efecty',n:'Efecty',cat:'pagos',bg:'#FFD200',fg:'#B3000C',t:'Efecty',al:['efecty','giro']},
 {id:'addi',n:'Addi',cat:'credito',bg:'#2F5BFF',fg:'#fff',t:'addi',credit:true,al:['addi']},
 {id:'sistecredito',n:'Sistecrédito',cat:'credito',bg:'#F57C00',fg:'#fff',t:'Siste',credit:true,al:['sistecredito','siste credito']},
 {id:'visa',n:'Visa',cat:'pagos',bg:'#1A1F71',fg:'#fff',t:'VISA',credit:true,al:['visa']},
 {id:'mastercard',n:'Mastercard',cat:'pagos',bg:'#1B1B1F',fg:'#FF5F00',t:'MC',credit:true,al:['mastercard','master card']}
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const entById=id=>ENT.find(e=>e.id===id)||null;
function entFind(q){const n=norm(q);if(!n)return null;return ENT.find(e=>e.id===n||norm(e.n)===n||e.al.some(a=>norm(a)===n))||null}
const entName=v=>{const e=entById(v)||entFind(v);return e?e.n:String(v||'')};
const resolveEnt=v=>{v=String(v||'').trim();const e=entFind(v);return e?e.id:v};
function entMatches(q,credit){
  const n=norm(q);
  if(!n)return ENT.filter(e=>credit?e.credit:true);
  const sc=e=>{const names=[norm(e.n)].concat(e.al.map(norm));if(names.some(x=>x.indexOf(n)===0))return 0;if(names.some(x=>x.indexOf(n)>=0))return 1;return 9};
  return ENT.map(e=>({e,s:sc(e)+(credit&&!e.credit?3:0)})).filter(x=>x.s<9).sort((a,b)=>a.s-b.s).map(x=>x.e);
}
function logoHtml(val,size){
  size=size||40;val=String(val||'').trim();if(!val)return '';
  const e=entById(val)||entFind(val);
  if(e){const L=e.t.length,cl=L>=4?' l4':L===3?' l3':L===2?' l2':'';
    return '<span class="logo-b'+cl+'" style="--s:'+size+'px;--lb:'+e.bg+';--lf:'+e.fg+'" title="'+esc(e.n)+'" role="img" aria-label="'+esc(e.n)+'">'+esc(e.t)+(LOGO_FILES.indexOf(e.id)>=0?'<img src="logos/'+e.id+'.png" alt="" loading="lazy" onerror="this.remove()">':'')+'</span>'}
  let h=0;for(const c of val)h=(h*31+c.charCodeAt(0))>>>0;
  return '<span class="logo-b l2" style="--s:'+size+'px;--lb:hsl('+(h%360)+' 38% 34%);--lf:#fff" title="'+esc(val)+'" role="img" aria-label="'+esc(val)+'">'+esc(initials(val)||'?')+'</span>';
}
const genLogo=size=>'<span class="logo-b gen" style="--s:'+(size||34)+'px">'+ico('search')+'</span>';
function entTiles(q,credit){
  const list=entMatches(q,credit).slice(0,26),sel=entFind(q);
  if(!list.length)return '<div class="ent-none">Sin coincidencias: se guardará como «'+esc(q)+'».</div>';
  return list.map(e=>'<button type="button" class="ent-tile'+(sel&&sel.id===e.id?' on':'')+'" data-act="pickEnt" data-id="'+e.id+'">'+logoHtml(e.id,52)+'<span class="nm">'+esc(e.n)+'</span></button>').join('');
}
function entPicker(name,val,o){
  o=o||{};
  return '<div class="ent" data-ent data-credit="'+(o.credit?1:0)+'"><span class="elbl">'+esc(o.label||'Entidad')+'</span><div class="ent-in"><span class="ent-sel">'+(logoHtml(val,36)||genLogo(36))+'</span>'
   +'<input name="'+name+'" data-entq value="'+esc(entName(val))+'" placeholder="'+esc(o.ph||'Escribe: Nequi, Bancolombia, Betano…')+'" maxlength="40" autocomplete="off" aria-label="'+esc(o.label||'Entidad')+'"><button type="button" class="ent-x" data-act="clearEnt" aria-label="Quitar">'+ico('x')+'</button></div>'
   +'<div class="ent-row">'+entTiles(entName(val),!!o.credit)+'</div></div>';
}
function refreshEnt(box){
  const inp=box.querySelector('[data-entq]'),credit=box.dataset.credit==='1';
  box.querySelector('.ent-sel').innerHTML=logoHtml(inp.value,36)||genLogo(36);
  const row=box.querySelector('.ent-row');row.innerHTML=entTiles(inp.value,credit);row.scrollLeft=0;
}

const IC={
home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6"/><path d="M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
swap:'<path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8"/>',
chart:'<path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/>',
check:'<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="m8 12.5 3 3 5-6"/>',
tick:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
download:'<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
upload:'<path d="M12 16V5"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
x:'<path d="m6 6 12 12M18 6 6 18"/>',
trash:'<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6.5 7l1 13h9l1-13"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
in:'<path d="M17 7 7 17"/><path d="M7 8v9h9"/>',
out:'<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
up:'<path d="m6 14 6-6 6 6"/>',
down:'<path d="m6 10 6 6 6-6"/>',
wallet:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="7.5" width="17" height="12" rx="3"/><circle cx="16.5" cy="13.5" r="1.2"/>',
target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1.5 1.5 0 0 1-1.6 1.5C10.5 20 4 13.5 4 5.6A1.5 1.5 0 0 1 5 4Z"/>',
mail:'<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m4 8 8 6 8-6"/>',
calendar:'<rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
chevL:'<path d="m14 6-6 6 6 6"/>',
chevR:'<path d="m10 6 6 6-6 6"/>',
trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
eye:'<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
eyeOff:'<path d="M3 3l18 18"/><path d="M10.6 6A10.5 10.5 0 0 1 12 5.5C18.4 5.5 22 12 22 12a17 17 0 0 1-3.2 3.9"/><path d="M6.6 7.2A16.6 16.6 0 0 0 2 12s3.6 6.5 10 6.5c1.5 0 2.8-.3 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
card:'<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
clip:'<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 17.3a1.7 1.7 0 0 1-2.4-2.4L15 7"/>',
doc:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
print:'<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2.5"/><path d="M7 14h10v6H7z"/>'
};
const ico=(n,cls)=>'<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>';

/* ===== datos y guardado ===== */
const LS='euko-dashboard-v1',LSB=LS+'-bak';
const S={clients:[],transactions:[],tasks:[],files:[],settings:{goal:8000000,hideDemo:false}};
const FKINDS=['Comprobante de pago','Pendiente por cobrar','Crédito','Otro'];
const METHODS=['Efectivo','Transferencia','Tarjeta','Crédito'];
const meta={saveErr:false,savedAt:0,noStorage:false,recovered:false};
let bakAt=0;
const STATUS_C=['Activo','Pendiente','Inactivo'];

function sanitize(r){
  const o={clients:[],transactions:[],tasks:[],files:[],settings:{goal:8000000,hideDemo:false}};
  if(!r||typeof r!=='object')return o;
  const str=v=>typeof v==='string'?v:(v==null?'':String(v));
  const num=v=>{v=Number(v);return isFinite(v)&&v>0?Math.round(v):0};
  const dt=v=>isDate(v)?v:'';
  const mk=()=>{const set=new Set();return v=>{v=str(v);if(!v||set.has(v))v=uid();set.add(v);return v}};
  const arr=v=>Array.isArray(v)?v:[];
  const ic=mk(),it=mk(),ik=mk();
  arr(r.clients).forEach(c=>{if(!c||typeof c!=='object')return;const name=str(c.name).trim();if(!name)return;
    o.clients.push({id:ic(c.id),name,phone:str(c.phone),email:str(c.email),plan:str(c.plan),fee:num(c.fee),status:STATUS_C.indexOf(c.status)>=0?c.status:'Activo',joined:dt(c.joined)||today(),nextPay:dt(c.nextPay),notes:str(c.notes),payEntity:str(c.payEntity).slice(0,40)})});
  arr(r.transactions).forEach(x=>{if(!x||typeof x!=='object')return;const amount=num(x.amount);if(!amount||(x.type!=='ingreso'&&x.type!=='egreso'))return;
    o.transactions.push({id:it(x.id),type:x.type,date:dt(x.date)||today(),amount,category:str(x.category).trim()||'Otros',concept:str(x.concept),clientId:str(x.clientId),status:x.status==='Pendiente'?'Pendiente':'Completado',method:METHODS.indexOf(x.method)>=0?x.method:'',entity:str(x.entity).slice(0,40),installments:Math.min(60,num(x.installments))})});
  arr(r.tasks).forEach(t=>{if(!t||typeof t!=='object')return;const text=str(t.text).trim();if(!text)return;
    o.tasks.push({id:ik(t.id),date:dt(t.date)||today(),text,done:!!t.done,clientId:str(t.clientId),createdAt:str(t.createdAt)})});
  const owners=new Set(o.clients.map(c=>'client:'+c.id).concat(o.transactions.map(x=>'tx:'+x.id))),ifl=mk();
  arr(r.files).forEach(f=>{if(!f||typeof f!=='object')return;const owner=str(f.owner),mime=str(f.mime);if(!owners.has(owner))return;if(!/^image\/(jpeg|png|webp|gif)$/.test(mime)&&mime!=='application/pdf')return;
    o.files.push({id:ifl(f.id),owner,name:str(f.name).slice(0,80)||'soporte',mime,size:num(f.size),kind:FKINDS.indexOf(f.kind)>=0?f.kind:'Otro',date:dt(f.date)||today()})});
  const st=r.settings&&typeof r.settings==='object'?r.settings:{};
  o.settings={goal:isFinite(Number(st.goal))&&Number(st.goal)>=0?Math.round(Number(st.goal)):8000000,hideDemo:!!st.hideDemo};
  return o;
}
const snapshotJSON=()=>JSON.stringify({clients:S.clients,transactions:S.transactions,tasks:S.tasks,files:S.files,settings:S.settings});
function readKey(k){const t=localStorage.getItem(k);return t?JSON.parse(t):null}
function load(){
  let r=null;
  try{
    try{r=readKey(LS)}catch(e){r=null;if(localStorage.getItem(LS)){const b=readKey(LSB);if(b){r=b;meta.recovered=true}}}
  }catch(e){meta.noStorage=true}
  Object.assign(S,sanitize(r));
}
function save(force){
  const json=snapshotJSON();
  try{
    const now=Date.now(),prev=localStorage.getItem(LS);
    if(prev&&(force||now-bakAt>300000)){try{localStorage.setItem(LSB,prev);bakAt=now}catch(e){}}
    localStorage.setItem(LS,json);
    meta.saveErr=false;meta.savedAt=now;
  }catch(e){meta.saveErr=true;console.error(e)}
  saveUI(true);
  if(meta.saveErr)toast('No se pudo guardar en este navegador. Descarga un respaldo desde Ajustes.');
  return !meta.saveErr;
}
function saveUI(pulse){
  const c=$('#savechip');
  if(c){const d=new Date(meta.savedAt||Date.now());c.textContent=meta.saveErr?'Sin guardar':(meta.savedAt?'Guardado '+pad(d.getHours())+':'+pad(d.getMinutes()):'Datos locales');
    c.classList.toggle('err',meta.saveErr);if(pulse&&!meta.saveErr){c.classList.remove('pulse');void c.offsetWidth;c.classList.add('pulse')}}
  const g=$('#gearbtn');if(g)g.classList.toggle('err',meta.saveErr||meta.noStorage);
}
const undoStack=[];
function snap(){undoStack.push(snapshotJSON());if(undoStack.length>25)undoStack.shift()}
function doUndo(){const s=undoStack.pop();if(!s){toast('No hay nada que deshacer');return}Object.assign(S,sanitize(JSON.parse(s)));save();render(false);refreshFiles();toast('Cambio deshecho')}
function commit(msg,canUndo){save();render(false);if(msg)toast(msg,canUndo?'Deshacer':'',canUndo?'undo':'')}
function upsert(coll,o){const a=S[coll],i=a.findIndex(x=>x.id===o.id);if(i>=0)a[i]=o;else a.push(o)}
function removeItem(coll,id){S[coll]=S[coll].filter(x=>x.id!==id)}


/* ===== soportes (comprobantes): los archivos viven en IndexedDB, los datos en localStorage ===== */
let idbP=null;
function idb(){return idbP||(idbP=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('noidb'));const r=indexedDB.open('euko-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('blobs');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'))}))}
const idbTx=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{const t=db.transaction('blobs',mode),q=fn(t.objectStore('blobs'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}));
const fput=(id,blob)=>idbTx('readwrite',s=>s.put(blob,id));
const fget=id=>idbTx('readonly',s=>s.get(id));
const fdel=id=>idbTx('readwrite',s=>s.delete(id));
const fkeys=()=>idbTx('readonly',s=>s.getAllKeys());
const fsize=n=>n>=1048576?(n/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';
const blobToDataUrl=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b)});
function dataUrlToBlob(u){const m=/^data:([^;,]+)?(;base64)?,(.*)$/.exec(u);if(!m)return null;const bin=m[2]?atob(m[3]):decodeURIComponent(m[3]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m[1]||'application/octet-stream'})}
async function prepFile(f){
  if(/^image\//.test(f.type)){
    try{const bmp=await createImageBitmap(f),sc=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*sc));c.height=Math.max(1,Math.round(bmp.height*sc));
      const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);
      const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.8));if(blob)return {blob,mime:'image/jpeg',ext:'jpg'}}catch(e){}
    if(/^image\/(jpeg|png|webp|gif)$/.test(f.type)&&f.size<=3e6)return {blob:f,mime:f.type,ext:f.type.split('/')[1]};
    return null}
  if(f.type==='application/pdf'&&f.size<=4e6)return {blob:f,mime:'application/pdf',ext:'pdf'};
  return null;
}
let FC={};
const calcFC=()=>{FC={};S.files.forEach(f=>{FC[f.owner]=(FC[f.owner]||0)+1})};
const clipHtml=k=>FC[k]?'<span class="clip">'+ico('clip')+FC[k]+'</span>':'';
async function gcFiles(){try{const keys=await fkeys();if(draft.length||ov.classList.contains('open'))return;const ids=new Set(S.files.map(f=>f.id));for(const k of keys){if(!ids.has(k))await fdel(k)}}catch(e){}}
const dropFilesOf=owner=>{S.files=S.files.filter(f=>f.owner!==owner)};

/* datos de ejemplo (no se guardan) */
let _demo=null;
function buildDemo(){
  if(_demo&&_demo.t===today())return _demo.d;
  const t=today();let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const names=['Camila Restrepo','Andrés Villamil','Laura Gómez','Julián Ortega','Valentina Cruz','Sebastián Mejía','Daniela Pardo','Mateo Arango','Sofía Linares','Felipe Cano','Isabela Duarte','Santiago Rueda','Natalia Barrios','Daniel Zapata'];
  const plans=[['Básico',120000],['Pro',250000],['VIP',480000]];
  const pi=[1,0,2,1,0,1,2,0,1,1,0,2,1,0],ago=[7,7,6,6,5,5,4,4,3,3,2,2,1,0],nxt=[3,-2,12,18,5,-5,9,22,1,-1,14,7,25,28];
  const clients=names.map((n,i)=>{
    const st=i===5||i===9?'Pendiente':i===12?'Inactivo':'Activo';
    return {id:'d-c'+i,demo:true,name:n,phone:'3'+(10+i%5)+' '+(200+i*13)+' '+(1000+i*37),email:n.toLowerCase().normalize('NFD').replace(/[^a-z ]/g,'').replace(/ /g,'.')+'@correo.com',
      plan:plans[pi[i]][0],fee:plans[pi[i]][1],payEntity:['nequi','bancolombia','daviplata','nu','davivienda'][i%5],status:st,joined:addDays(addMonths(t,-ago[i]),-((i*2)%10)),nextPay:st==='Inactivo'?'':addDays(t,nxt[i]),notes:''};
  });
  const tx=[];
  clients.forEach((c,i)=>{
    for(let k=0;k<=ago[i];k++){
      const d=addMonths(c.joined,k);if(d>t)break;
      if(c.status==='Inactivo'&&k>Math.max(0,ago[i]-2))break;
      const last=k===ago[i]||addMonths(c.joined,k+1)>t;
      tx.push({id:'d-t'+i+'-'+k,demo:true,type:'ingreso',date:d,amount:c.fee,category:'Membresías',concept:'Membresía '+c.plan,clientId:c.id,method:'Transferencia',entity:c.payEntity,status:(c.status==='Pendiente'&&last)?'Pendiente':'Completado'});
    }
  });
  [[1,150000,0,'Asesoría puntual'],[2,220000,4,'Revisión de estrategia'],[3,300000,2,'Asesoría puntual'],[4,180000,10,'Análisis personalizado'],[1,260000,7,'Asesoría puntual']].forEach((a,j)=>{
    const d=addDays(t,-(a[0]*26+a[2]));tx.push({id:'d-a'+j,demo:true,type:'ingreso',date:d,amount:a[1],category:'Asesorías',concept:a[3],clientId:clients[(j*3+1)%clients.length].id,method:'Transferencia',entity:['bancolombia','nequi','nu'][j%3],status:'Completado'})});
  for(let m=0;m<6;m++){
    const base=new Date();const mk=day=>ymd(new Date(base.getFullYear(),base.getMonth()-m,Math.min(day,28)));
    [[5,'Datos deportivos (API)','Herramientas',190000,'Tarjeta','visa'],[8,'Suscripciones de análisis','Herramientas',95000,'Tarjeta','mastercard'],[12,'Publicidad en redes','Publicidad',Math.round((180000+rnd()*260000)/1000)*1000,'Crédito','addi'],[20,'Contabilidad','Servicios',150000,'Transferencia','bancolombia'],[25,'Impuestos','Impuestos',110000,'Transferencia','pse']].forEach((e,j)=>{
      const d=mk(e[0]);if(d<=t)tx.push({id:'d-e'+m+'-'+j,demo:true,type:'egreso',date:d,amount:e[3],category:e[2],concept:e[1],clientId:'',method:e[4],entity:e[5],installments:e[4]==='Crédito'?3:0,status:'Completado'})})
  }
  const tasks=[
    {id:'d-k1',demo:true,date:t,text:'Enviar el análisis de la jornada a los clientes VIP',done:true,clientId:''},
    {id:'d-k2',demo:true,date:t,text:'Confirmar el pago de Valentina Cruz',done:false,clientId:'d-c4'},
    {id:'d-k3',demo:true,date:t,text:'Revisar el rendimiento semanal',done:true,clientId:''},
    {id:'d-k4',demo:true,date:t,text:'Publicar el resumen en el canal privado',done:false,clientId:''},
    {id:'d-k5',demo:true,date:t,text:'Llamar a Felipe Cano por su renovación',done:false,clientId:'d-c9'},
    {id:'d-k6',demo:true,date:addDays(t,-1),text:'Responder la consulta de Mateo Arango',done:false,clientId:'d-c7'},
    {id:'d-k7',demo:true,date:addDays(t,1),text:'Preparar el reporte mensual para clientes',done:false,clientId:''}
  ];
  const d={clients,transactions:tx,tasks,files:[]};_demo={t,d};return d;
}
const demoOn=()=>!S.settings.hideDemo&&!S.clients.length&&!S.transactions.length&&!S.tasks.length;
const D=()=>demoOn()?buildDemo():S;
const cname=id=>{const c=D().clients.find(x=>x.id===id);return c?c.name:''};

/* ===== cálculos ===== */
function monthKeys(n){const t=new Date();const a=[];for(let i=n-1;i>=0;i--){const d=new Date(t.getFullYear(),t.getMonth()-i,1);a.push(d.getFullYear()+'-'+pad(d.getMonth()+1))}return a}
function totals(keys){
  const map={};keys.forEach(k=>map[k]={key:k,inc:0,exp:0});
  D().transactions.forEach(x=>{if(x.status==='Pendiente')return;const m=map[monthKey(x.date)];if(!m)return;if(x.type==='ingreso')m.inc+=x.amount;else m.exp+=x.amount});
  return keys.map(k=>map[k]);
}
const pending=()=>D().transactions.filter(x=>x.type==='ingreso'&&x.status==='Pendiente');
function delta(cur,prev,inv){
  if(!prev&&!cur)return '<span class="delta flat">sin cambio</span>';
  if(!prev)return '<span class="delta up">'+ico('up')+'nuevo</span>';
  const p=Math.round((cur-prev)/prev*100);if(p===0)return '<span class="delta flat">0%</span>';
  const good=inv?p<0:p>0;
  return '<span class="delta '+(good?'up':'down')+'">'+ico(p>0?'up':'down')+Math.abs(p)+'%</span>';
}
function dueInfo(c){
  if(!c.nextPay||c.status==='Inactivo')return null;
  const d=diffDays(c.nextPay,today());
  if(d<0)return {txt:'Vencido hace '+(-d)+(d===-1?' día':' días'),cls:'bad',d};
  if(d===0)return {txt:'Vence hoy',cls:'warn',d};
  if(d<=7)return {txt:'En '+d+(d===1?' día':' días'),cls:'warn',d};
  return {txt:fdate(c.nextPay),cls:'off',d};
}
const groupBy=(arr,f)=>{const m={};arr.forEach(x=>{const k=f(x)||'Sin categoría';m[k]=(m[k]||0)+x.amount});return Object.keys(m).map(k=>({k,v:m[k]})).sort((a,b)=>b.v-a.v)};

/* ===== estado de interfaz ===== */
const UIK='euko-ui';
const ui={view:'resumen',clientQ:'',clientStatus:'todos',clientPlan:'todos',clientSort:'name',txType:'todos',txQ:'',txMonth:'todos',txStatus:'todos',txCat:'todos',period:6,day:today(),lim:{c:30,t:30}};
try{const u=JSON.parse(localStorage.getItem(UIK)||'null');if(u){if([3,6,12].indexOf(u.period)>=0)ui.period=u.period;if(['name','fee','due','new'].indexOf(u.clientSort)>=0)ui.clientSort=u.clientSort}}catch(e){}
const saveUi=()=>{try{localStorage.setItem(UIK,JSON.stringify({period:ui.period,clientSort:ui.clientSort}))}catch(e){}};
const DEF={clientQ:'',clientStatus:'todos',clientPlan:'todos',txType:'todos',txQ:'',txMonth:'todos',txStatus:'todos',txCat:'todos'};
function resetFilters(){Object.assign(ui,DEF);ui.lim={c:30,t:30};const g=$('#gsearch');if(g)g.value=''}
const VIEWS=[
  {id:'resumen',label:'Resumen',short:'Resumen',icon:'home'},
  {id:'clientes',label:'Clientes',short:'Clientes',icon:'users'},
  {id:'movimientos',label:'Movimientos',short:'Dinero',icon:'swap'},
  {id:'reportes',label:'Reportes',short:'Reportes',icon:'chart'},
  {id:'agenda',label:'Gestión diaria',short:'Agenda',icon:'check'}
];

/* ===== componentes ===== */
const statusPill=s=>'<span class="pill '+(s==='Activo'||s==='Completado'?'ok':s==='Pendiente'?'warn':'off')+'">'+esc(s)+'</span>';
const count=(v,fmt)=>'<span class="num'+(fmt==='n'?'':' mv')+'" data-count="'+Math.round(v)+'" data-fmt="'+(fmt||'cop')+'">'+(fmt==='n'?Math.round(v):copRaw(v))+'</span>';
const head=(t,sub,acts)=>'<header class="vhead rev" style="--d:0"><div><h1>'+t+'</h1><p>'+sub+'</p></div><div class="acts">'+(acts||'')+'</div></header>';
const demoBanner=()=>demoOn()?'<div class="banner rev" style="--d:1"><span><b>Datos de ejemplo.</b> Así se verá tu panel. Desaparecen cuando registres tu primer cliente, movimiento o tarea.</span><button class="btn sm ghost" data-act="hideDemo">Ocultar ejemplos</button></div>':'';
const niceMax=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const f=v/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p};
const tipA=(t,hint)=>' data-tip="'+esc(t)+'"'+(hint?' data-hint="'+esc(hint)+'" data-arm="1"':'');
const drillA=(v,f)=>' data-act="drill" data-v="'+v+'" data-f="'+esc(JSON.stringify(f||{}))+'"';
const tapA=(v,f,label)=>drillA(v,f)+' role="button" tabindex="0" aria-label="'+esc(label)+'"';

function barChart(ms){
  const W=380,H=210,pl=40,pr=6,pt=10,pb=24;
  const mx=niceMax(Math.max(1,...ms.map(m=>Math.max(m.inc,m.exp))));
  const gw=(W-pl-pr)/ms.length,bw=Math.min(15,gw*.3),y=v=>pt+(H-pt-pb)*(1-v/mx);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingresos y egresos por mes">';
  for(let i=0;i<=4;i++){const v=mx/4*i,yy=y(v);s+='<line class="gridl" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'"/><text class="mv" x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">'+kfmt(v)+'</text>'}
  ms.forEach((m,i)=>{
    const cx=pl+gw*i+gw/2,hi=(H-pt-pb)*m.inc/mx,he=(H-pt-pb)*m.exp/mx;
    s+='<g class="bar-g" tabindex="0" role="button" aria-label="'+esc(mlong(m.key))+': ver movimientos"'+drillA('movimientos',{txMonth:m.key,txType:'todos'})+tipA(mlong(m.key)+'\nIngresos '+copRaw(m.inc)+'\nEgresos '+copRaw(m.exp),'Toca otra vez para ver los movimientos')+'>'
      +'<rect class="hit" x="'+(cx-gw/2)+'" y="'+pt+'" width="'+gw+'" height="'+(H-pt-pb)+'"/>'
      +'<rect class="b" style="--i:'+i+'" x="'+(cx-bw-1.5)+'" y="'+(H-pb-hi)+'" width="'+bw+'" height="'+Math.max(hi,1)+'" rx="5" fill="var(--c1)"/>'
      +'<rect class="b" style="--i:'+(i+.5)+'" x="'+(cx+1.5)+'" y="'+(H-pb-he)+'" width="'+bw+'" height="'+Math.max(he,1)+'" rx="5" fill="var(--c5)"/>'
      +'<text x="'+cx+'" y="'+(H-6)+'" text-anchor="middle">'+mlabel(m.key)+'</text></g>';
  });
  return s+'</svg>';
}
function smooth(p){let d='M'+p[0][0]+' '+p[0][1];for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c;d+=' C'+(b[0]+(c[0]-a[0])/6)+' '+(b[1]+(c[1]-a[1])/6)+','+(c[0]-(e[0]-b[0])/6)+' '+(c[1]-(e[1]-b[1])/6)+','+c[0]+' '+c[1]}return d}
function lineChart(ms){
  const W=720,H=250,pl=44,pr=14,pt=14,pb=26;
  const mx=niceMax(Math.max(1,...ms.map(m=>Math.max(m.inc,m.exp)))),n=ms.length,step=n>1?(W-pl-pr)/(n-1):0;
  const X=i=>n>1?pl+step*i:(W+pl-pr)/2,Y=v=>pt+(H-pt-pb)*(1-v/mx);
  const pi=ms.map((m,i)=>[X(i),Y(m.inc)]),pe=ms.map((m,i)=>[X(i),Y(m.exp)]);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingresos y egresos en el periodo"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c1)" stop-opacity=".35"/><stop offset="1" stop-color="var(--c1)" stop-opacity="0"/></linearGradient></defs>';
  for(let i=0;i<=4;i++){const v=mx/4*i,yy=Y(v);s+='<line class="gridl" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'"/><text class="mv" x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">'+kfmt(v)+'</text>'}
  if(n>1){const di=smooth(pi);
    s+='<path class="areafade" d="'+di+' L'+X(n-1)+' '+(H-pb)+' L'+X(0)+' '+(H-pb)+'Z" fill="url(#ga)"/>';
    s+='<path class="draw" pathLength="1" d="'+smooth(pe)+'" fill="none" stroke="var(--c5)" stroke-width="2.5" stroke-linecap="round"/>';
    s+='<path class="draw" pathLength="1" d="'+di+'" fill="none" stroke="var(--c1)" stroke-width="3" stroke-linecap="round"/>'}
  const every=n>8?2:1,hw=Math.max(step,30);
  ms.forEach((m,i)=>{
    if(i%every===0||i===n-1)s+='<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="middle">'+mlabel(m.key)+'</text>';
    s+='<g class="bar-g" tabindex="0" role="button" aria-label="'+esc(mlong(m.key))+': ver movimientos"'+drillA('movimientos',{txMonth:m.key,txType:'todos'})+tipA(mlong(m.key)+'\nIngresos '+copRaw(m.inc)+'\nEgresos '+copRaw(m.exp)+'\nUtilidad '+copRaw(m.inc-m.exp),'Toca otra vez para ver los movimientos')+'>'
      +'<rect class="hit" x="'+(X(i)-hw/2)+'" y="'+pt+'" width="'+hw+'" height="'+(H-pt-pb)+'"/>'
      +'<line class="gl" x1="'+X(i)+'" x2="'+X(i)+'" y1="'+pt+'" y2="'+(H-pb)+'"/>'
      +'<circle class="gd" cx="'+X(i)+'" cy="'+pi[i][1]+'" r="5" fill="var(--c1)" stroke="var(--bg)" stroke-width="2"/><circle class="gd" cx="'+X(i)+'" cy="'+pe[i][1]+'" r="4.5" fill="var(--c5)" stroke="var(--bg)" stroke-width="2"/></g>';
  });
  const L=n-1;
  s+='<circle cx="'+pi[L][0]+'" cy="'+pi[L][1]+'" r="5" fill="var(--c1)" stroke="var(--bg)" stroke-width="2" pointer-events="none"/><circle cx="'+pe[L][0]+'" cy="'+pe[L][1]+'" r="4.5" fill="var(--c5)" stroke="var(--bg)" stroke-width="2" pointer-events="none"/>';
  return s+'</svg>';
}
function donut(items,total,fFor){
  const R=54,C=2*Math.PI*R;let off=0;
  let s='<div class="dwrap"><svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Distribución de egresos"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="var(--field)" stroke-width="16"/>';
  items.forEach((it,i)=>{const len=Math.max(total?it.v/total*C-3:0,0);
    s+='<circle class="seg seg-c" style="--i:'+i+'" cx="70" cy="70" r="'+R+'" fill="none" stroke="'+COLORS[i%6]+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 70 70)" tabindex="0" role="button" aria-label="'+esc(it.k)+'"'+drillA('movimientos',fFor(it))+tipA(it.k+'\n'+copRaw(it.v)+' · '+Math.round(it.v/total*100)+'%','Toca otra vez para ver los movimientos')+'/>';
    off+=total?it.v/total*C:0});
  return s+'</svg><div class="dtxt"><div><b class="num mv">'+kfmt(total)+'</b><small>total</small></div></div></div>';
}

function txRow(x,mode){
  const inn=x.type==='ingreso',c=cname(x.clientId),full=mode==='full';
  const act=full?'<div class="c-act">'+(inn&&x.status==='Pendiente'?'<button class="iconbtn sm" data-act="markPaid" data-id="'+x.id+'" aria-label="Marcar como cobrado" data-tip="Marcar como cobrado">'+ico('tick')+'</button>':'<span class="mut">'+ico('chevR')+'</span>')+'</div>':'';
  const lead=x.entity?logoHtml(x.entity,38):'<div class="tico '+(inn?'in':'out')+'">'+ico(inn?'in':'out')+'</div>';
  const sub=esc(c||'Sin cliente')+(x.method==='Crédito'?' · Crédito'+(x.installments?' · '+x.installments+' cuotas':''):x.entity?' · '+esc(entName(x.entity)):'');
  return '<div class="tr '+(full?'tx':'rc')+'" data-act="editTx" data-id="'+x.id+'" tabindex="0"><div class="who">'+lead+'<div><b>'+esc(x.concept||x.category)+'</b><small>'+sub+' '+clipHtml('tx:'+x.id)+'</small></div></div>'
   +'<div class="cell c-cat mut">'+esc(x.category)+'</div><div class="cell amt '+(inn?'in':'')+'">'+(inn?'+':'-')+cop(x.amount)+'</div><div class="cell c-st">'+statusPill(x.status)+'</div><div class="cell c-date mut">'+fdate(x.date)+'</div>'
   +'<div class="c-sub"><span>'+esc(x.category)+'</span><span>·</span><span>'+fdate(x.date)+'</span>'+(x.status==='Pendiente'?statusPill(x.status):'')+'</div>'+act+'</div>';
}

/* ===== vistas ===== */
const V={};
V.resumen=function(){
  const d=D(),keys=monthKeys(6),ms=totals(keys),cur=ms[5],prev=ms[4],ck=keys[5];
  const active=d.clients.filter(c=>c.status==='Activo'),pend=pending(),pendSum=pend.reduce((a,b)=>a+b.amount,0);
  const util=cur.inc-cur.exp,putil=prev.inc-prev.exp;
  const prevActive=d.clients.filter(c=>c.status!=='Inactivo'&&c.joined<=addMonths(today(),-1)).length;
  const plans=groupBy(active.map(c=>({k:c.plan||'Sin plan',amount:1})),x=>x.k).slice(0,3);
  const meta_=S.settings.goal||0,pct=meta_?Math.min(100,Math.round(cur.inc/meta_*100)):0;
  const due=d.clients.map(c=>({c,i:dueInfo(c)})).filter(x=>x.i&&x.i.d<=10).sort((a,b)=>a.i.d-b.i.d).slice(0,4);
  const recent=d.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,6);
  const hr=new Date().getHours(),sal=hr<12?'Buenos días':hr<19?'Buenas tardes':'Buenas noches';
  return head(sal+', EUKO','Resumen de '+mlong(ck)+'. Toca cualquier dato para ver su detalle.','<button class="btn ghost" data-act="addTx" data-type="egreso">'+ico('out')+'Egreso</button><button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Ingreso</button>')
  +demoBanner()
  +'<div class="grid">'
  +'<article class="card sg s4 rev" style="--d:1"><div class="lbl up">Utilidad del mes</div><div class="big">'+count(util)+'</div><div class="flex">'+delta(util,putil)+'<span class="sub">vs. mes anterior</span></div>'
    +'<div class="minis">'+(plans.length?plans.map(p=>'<button class="mini tap" data-act="drill" data-v="clientes" data-f="'+esc(JSON.stringify({clientStatus:'Activo',clientPlan:p.k}))+'"><b class="num">'+p.v+'</b><span>'+esc(p.k)+'</span></button>').join(''):'<div class="mini" style="grid-column:1/-1"><span>Sin clientes activos todavía</span></div>')+'</div>'
    +'<div class="btnrow"><button class="btn dark" data-act="addClient">'+ico('users')+'Nuevo cliente</button><button class="btn ghost" data-act="nav" data-v="reportes">'+ico('chart')+'Reportes</button></div></article>'
  +'<div class="kpis">'
    +'<div class="kpi sg hero tap rev" style="--d:2"'+tapA('clientes',{clientStatus:'Activo'},'Ver clientes activos')+'><div class="top2"><span class="lbl">Clientes activos</span><span class="ico">'+ico('users')+'</span></div><div class="mid">'+count(active.length,'n')+'</div><div class="flex">'+delta(d.clients.filter(c=>c.status!=='Inactivo').length,prevActive)+'</div></div>'
    +'<div class="kpi sg tap rev" style="--d:3"'+tapA('movimientos',{txType:'ingreso',txMonth:ck},'Ver ingresos del mes')+'><div class="top2"><span class="lbl">Ingresos</span><span class="ico">'+ico('in')+'</span></div><div class="mid">'+count(cur.inc)+'</div>'+delta(cur.inc,prev.inc)+'</div>'
    +'<div class="kpi sg tap rev" style="--d:4"'+tapA('movimientos',{txType:'egreso',txMonth:ck},'Ver egresos del mes')+'><div class="top2"><span class="lbl">Egresos</span><span class="ico">'+ico('out')+'</span></div><div class="mid">'+count(cur.exp)+'</div>'+delta(cur.exp,prev.exp,true)+'</div>'
    +'<div class="kpi sg tap rev" style="--d:5"'+tapA('movimientos',{txType:'ingreso',txStatus:'Pendiente'},'Ver pagos pendientes')+'><div class="top2"><span class="lbl">Por cobrar</span><span class="ico">'+ico('clock')+'</span></div><div class="mid">'+count(pendSum)+'</div><span class="sub">'+pend.length+(pend.length===1?' pago pendiente':' pagos pendientes')+'</span></div>'
  +'</div>'
  +'<article class="card sg s4 rev" style="--d:3"><div class="flex sb wrap"><h2 class="ct">Ingresos vs egresos</h2><div class="legend"><span><i style="background:var(--c1)"></i>Ingresos</span><span><i style="background:var(--c5)"></i>Egresos</span></div></div><p class="sub" style="margin:2px 0 8px">Últimos 6 meses · toca un mes</p>'+barChart(ms)+'</article>'
  +'<div class="s4 stack">'
    +'<article class="card sg rev" style="--d:4"><div class="flex sb"><div class="lbl">'+ico('target')+'Meta de ingresos del mes</div><button class="btn sm ghost" data-act="editGoal">Editar</button></div><div class="bar"><i style="--w:'+pct+'%"></i></div><div class="flex sb"><b class="num">'+cop(cur.inc)+'</b><span class="sub num">de '+cop(meta_)+' · '+pct+'%</span></div></article>'
    +'<article class="card sg rev" style="--d:5"><div class="lbl up" style="margin-bottom:6px">Próximos cobros</div>'
      +(due.length?'<div class="ul">'+due.map(x=>'<div class="li" data-act="openClient" data-id="'+x.c.id+'" tabindex="0"><div class="av" style="--c:'+hashColor(x.c.name)+'">'+initials(x.c.name)+'</div><div class="grow"><b>'+esc(x.c.name)+'</b><small>'+cop(x.c.fee)+' · '+esc(x.c.plan)+'</small></div><span class="pill '+x.i.cls+'">'+x.i.txt+'</span><button class="iconbtn sm" data-act="payClient" data-id="'+x.c.id+'" aria-label="Registrar pago de '+esc(x.c.name)+'" data-tip="Registrar pago">'+ico('tick')+'</button></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Todo al día</b>No hay cobros en los próximos 10 días.</div>')
    +'</article></div>'
  +'<article class="card sg s8 rev" style="--d:6"><div class="flex sb" style="margin-bottom:8px"><h2 class="ct">Actividad reciente</h2><button class="btn sm ghost" data-act="drill" data-v="movimientos" data-f="{}">Ver todo</button></div>'
    +'<div class="tbl"><div class="tr th rc"><div>Concepto</div><div class="c-cat">Categoría</div><div>Monto</div><div class="c-st">Estado</div><div class="c-date">Fecha</div></div>'
    +(recent.length?recent.map(x=>txRow(x,'rc')).join(''):'<div class="empty"><b>Aún no hay movimientos</b>Registra tu primer ingreso o egreso para verlo aquí.<br><button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Registrar ingreso</button></div>')+'</div></article>'
  +'</div>';
};

/* clientes */
const planList=()=>[...new Set(D().clients.map(c=>c.plan).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
function filtClients(){
  const q=ui.clientQ.trim().toLowerCase();
  let list=D().clients.filter(c=>(ui.clientStatus==='todos'||c.status===ui.clientStatus)&&(ui.clientPlan==='todos'||c.plan===ui.clientPlan)&&(!q||(c.name+' '+(c.phone||'')+' '+(c.email||'')+' '+(c.plan||'')).toLowerCase().includes(q)));
  const s=ui.clientSort;
  list=list.slice().sort((a,b)=>s==='fee'?(b.fee||0)-(a.fee||0):s==='due'?(a.nextPay||'9999').localeCompare(b.nextPay||'9999'):s==='new'?b.joined.localeCompare(a.joined):a.name.localeCompare(b.name,'es'));
  return list;
}
function fbarHtml(items){return items.length?items.map(i=>'<span class="fchip">'+esc(i[1])+'<button data-act="clearF" data-k="'+i[0]+'" aria-label="Quitar filtro">'+ico('x')+'</button></span>').join('')+'<button class="fchip clear" data-act="clearAll">Limpiar todo</button>':''}
function clientFbar(){const a=[];if(ui.clientQ.trim())a.push(['clientQ','Búsqueda: '+ui.clientQ.trim()]);if(ui.clientPlan!=='todos')a.push(['clientPlan','Plan: '+ui.clientPlan]);return fbarHtml(a)}
function clientList(){
  const all=filtClients(),list=all.slice(0,ui.lim.c),d=D();
  return '<div class="tbl"><div class="tr th cl"><div>Cliente</div><div class="c-plan">Plan</div><div class="c-fee">Cuota</div><div class="c-st">Estado</div><div class="c-next">Próximo pago</div><div class="c-act"></div></div>'
  +(list.length?list.map(c=>{const i=dueInfo(c);return '<div class="tr cl" data-act="openClient" data-id="'+c.id+'" tabindex="0"><div class="who"><div class="av" style="--c:'+hashColor(c.name)+'">'+initials(c.name)+'</div><div><b>'+esc(c.name)+'</b><small>'+esc(c.phone||c.email||'Sin contacto')+' '+clipHtml('client:'+c.id)+'</small></div></div>'
    +'<div class="cell c-plan"><span class="ent-mini">'+(c.payEntity?logoHtml(c.payEntity,24):'')+'<span class="tag">'+esc(c.plan||'—')+'</span></span></div><div class="cell c-fee amt">'+cop(c.fee||0)+'</div><div class="c-st">'+statusPill(c.status)+'</div>'
    +'<div class="cell c-next">'+(i?'<span class="pill '+i.cls+'">'+i.txt+'</span>':'<span class="mut">—</span>')+'</div>'
    +'<div class="c-sub"><span class="tag">'+esc(c.plan||'Sin plan')+'</span><span class="amt">'+cop(c.fee||0)+'</span>'+(i?'<span class="pill '+i.cls+'">'+i.txt+'</span>':'')+'</div>'
    +'<div class="c-act mut c-chev">'+ico('chevR')+'</div></div>'}).join(''):'<div class="empty"><b>'+(d.clients.length?'Sin resultados':'Aún no tienes clientes')+'</b>'+(d.clients.length?'Prueba con otro nombre o cambia los filtros.':'Agrega tu primer cliente para empezar a llevar su historial.')+'<br>'+(d.clients.length?'<button class="btn ghost" data-act="clearAll">Limpiar filtros</button>':'<button class="btn pri" data-act="addClient">'+ico('plus')+'Nuevo cliente</button>')+'</div>')
  +'</div>'+(all.length>list.length?'<div class="more"><button class="btn ghost" data-act="more" data-k="c">Ver más ('+(all.length-list.length)+')</button></div>':'');
}
V.clientes=function(){
  const d=D();
  const act=d.clients.filter(c=>c.status==='Activo'),mrr=act.reduce((a,b)=>a+(+b.fee||0),0);
  const cnt=s=>d.clients.filter(c=>c.status===s).length;
  const plans=planList();
  const kp=[['Total',d.clients.length,'users',{clientStatus:'todos'},'n'],['Activos',cnt('Activo'),'check',{clientStatus:'Activo'},'n'],['Pendientes',cnt('Pendiente'),'clock',{clientStatus:'Pendiente'},'n'],['Ingreso recurrente',mrr,'wallet',null,'cop']];
  return head('Clientes',d.clients.length+(d.clients.length===1?' cliente registrado':' clientes registrados')+' · cuotas recurrentes de '+cop(mrr)+' al mes','<button class="btn ghost" data-act="export" data-k="clients">'+ico('download')+'Exportar</button><button class="btn pri" data-act="addClient">'+ico('plus')+'Nuevo cliente</button>')
  +demoBanner()
  +'<div class="grid" style="margin-bottom:14px">'
    +kp.map((k,i)=>'<div class="card sg s3 tap rev" style="--d:'+(i+1)+';padding:16px"'+(k[3]?tapA('clientes',Object.assign({clientPlan:'todos',clientQ:''},k[3]),'Filtrar: '+k[0]):tapA('reportes',{},'Ver reportes'))+'><div class="flex sb"><span class="lbl">'+k[0]+'</span><span style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid">'+count(k[1],k[4])+'</div></div>').join('')
  +'</div>'
  +'<article class="card sg rev" style="--d:5"><div class="tools"><label class="field" aria-label="Buscar cliente">'+ico('search')+'<input id="clientQ" data-bind="clientQ" type="search" value="'+esc(ui.clientQ)+'" placeholder="Buscar por nombre, teléfono o plan" autocomplete="off"></label>'
    +'<div class="chips">'+['todos','Activo','Pendiente','Inactivo'].map(s=>'<button class="chip'+(ui.clientStatus===s?' on':'')+'" data-act="set" data-k="clientStatus" data-v="'+s+'">'+(s==='todos'?'Todos':s)+'</button>').join('')+'</div>'
    +(plans.length?'<select class="sel" data-bind="clientPlan" aria-label="Filtrar por plan"><option value="todos">Todos los planes</option>'+plans.map(p=>'<option'+(ui.clientPlan===p?' selected':'')+' value="'+esc(p)+'">'+esc(p)+'</option>').join('')+'</select>':'')
    +'<select class="sel" data-bind="clientSort" aria-label="Ordenar"><option value="name"'+(ui.clientSort==='name'?' selected':'')+'>Orden: nombre</option><option value="fee"'+(ui.clientSort==='fee'?' selected':'')+'>Orden: mayor cuota</option><option value="due"'+(ui.clientSort==='due'?' selected':'')+'>Orden: próximo pago</option><option value="new"'+(ui.clientSort==='new'?' selected':'')+'>Orden: más recientes</option></select></div>'
    +'<div class="fbar" id="cfbar">'+clientFbar()+'</div><div id="clist">'+clientList()+'</div></article>';
};

/* movimientos */
function filtTx(){
  const q=ui.txQ.trim().toLowerCase();
  return D().transactions.filter(x=>(ui.txType==='todos'||x.type===ui.txType)&&(ui.txMonth==='todos'||monthKey(x.date)===ui.txMonth)&&(ui.txStatus==='todos'||x.status===ui.txStatus)&&(ui.txCat==='todos'||x.category===ui.txCat)&&(!q||(x.concept+' '+x.category+' '+cname(x.clientId)).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}
function txFbar(){const a=[];if(ui.txQ.trim())a.push(['txQ','Búsqueda: '+ui.txQ.trim()]);if(ui.txMonth!=='todos')a.push(['txMonth',mlong(ui.txMonth)]);if(ui.txCat!=='todos')a.push(['txCat','Categoría: '+ui.txCat]);if(ui.txStatus!=='todos')a.push(['txStatus','Estado: '+ui.txStatus]);return fbarHtml(a)}
function txSum(list){
  const inc=list.filter(x=>x.type==='ingreso'&&x.status!=='Pendiente').reduce((a,b)=>a+b.amount,0),exp=list.filter(x=>x.type==='egreso'&&x.status!=='Pendiente').reduce((a,b)=>a+b.amount,0);
  return [['Ingresos',inc,'in'],['Egresos',exp,'out'],['Balance',inc-exp,'wallet']].map(k=>'<div class="card sg s4" style="padding:16px"><div class="flex sb"><span class="lbl">'+k[0]+'</span><span style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid num">'+cop(k[1])+'</div></div>').join('');
}
function txList(list){
  const rows=list.slice(0,ui.lim.t),d=D();
  return '<div class="tbl"><div class="tr th tx"><div>Concepto</div><div class="c-cat">Categoría</div><div>Monto</div><div class="c-st">Estado</div><div class="c-date">Fecha</div><div class="c-act"></div></div>'
  +(rows.length?rows.map(x=>txRow(x,'full')).join(''):'<div class="empty"><b>'+(d.transactions.length?'Sin resultados':'Aún no hay movimientos')+'</b>'+(d.transactions.length?'Cambia los filtros para ver más.':'Registra tu primer ingreso o egreso.')+'<br>'+(d.transactions.length?'<button class="btn ghost" data-act="clearAll">Limpiar filtros</button>':'<button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Registrar ingreso</button>')+'</div>')+'</div>'
  +(list.length>rows.length?'<div class="more"><button class="btn ghost" data-act="more" data-k="t">Ver más ('+(list.length-rows.length)+')</button></div>':'');
}
V.movimientos=function(){
  const d=D(),list=filtTx();
  const months=[...new Set(d.transactions.map(x=>monthKey(x.date)).concat(ui.txMonth!=='todos'?[ui.txMonth]:[]))].sort().reverse();
  const cats=[...new Set(d.transactions.map(x=>x.category))].sort((a,b)=>a.localeCompare(b,'es'));
  return head('Movimientos','Ingresos y egresos registrados, con filtros','<button class="btn ghost" data-act="export" data-k="tx">'+ico('download')+'Exportar</button><button class="btn ghost" data-act="addTx" data-type="egreso">'+ico('out')+'Egreso</button><button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Ingreso</button>')
  +demoBanner()
  +'<div class="grid" style="margin-bottom:14px" id="tsum">'+txSum(list)+'</div>'
  +'<article class="card sg rev" style="--d:4"><div class="tools"><label class="field" aria-label="Buscar movimiento">'+ico('search')+'<input id="txQ" data-bind="txQ" type="search" value="'+esc(ui.txQ)+'" placeholder="Buscar concepto, categoría o cliente" autocomplete="off"></label>'
    +'<div class="chips">'+[['todos','Todos'],['ingreso','Ingresos'],['egreso','Egresos']].map(s=>'<button class="chip'+(ui.txType===s[0]?' on':'')+'" data-act="set" data-k="txType" data-v="'+s[0]+'">'+s[1]+'</button>').join('')+'</div>'
    +'<select class="sel" data-bind="txMonth" aria-label="Filtrar por mes"><option value="todos">Todos los meses</option>'+months.map(m=>'<option value="'+m+'"'+(ui.txMonth===m?' selected':'')+'>'+mlong(m)+'</option>').join('')+'</select>'
    +'<select class="sel" data-bind="txStatus" aria-label="Filtrar por estado"><option value="todos">Todos los estados</option><option'+(ui.txStatus==='Completado'?' selected':'')+'>Completado</option><option'+(ui.txStatus==='Pendiente'?' selected':'')+'>Pendiente</option></select>'
    +(cats.length?'<select class="sel" data-bind="txCat" aria-label="Filtrar por categoría"><option value="todos">Todas las categorías</option>'+cats.map(c=>'<option value="'+esc(c)+'"'+(ui.txCat===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>':'')+'</div>'
    +'<div class="fbar" id="tfbar">'+txFbar()+'</div><div id="tlist">'+txList(list)+'</div></article>';
};

/* reportes */
V.reportes=function(){
  const d=D(),n=ui.period,keys=monthKeys(n),ms=totals(keys);
  const inc=ms.reduce((a,b)=>a+b.inc,0),exp=ms.reduce((a,b)=>a+b.exp,0),ut=inc-exp,mg=inc?Math.round(ut/inc*100):0;
  const inRange=x=>keys.includes(monthKey(x.date))&&x.status!=='Pendiente';
  const cats=groupBy(d.transactions.filter(x=>x.type==='egreso'&&inRange(x)),x=>x.category).slice(0,6);
  const catTotal=cats.reduce((a,b)=>a+b.v,0);
  const byPlan=groupBy(d.transactions.filter(x=>x.type==='ingreso'&&inRange(x)),x=>{const c=d.clients.find(c=>c.id===x.clientId);return c&&c.plan?c.plan:x.category}).slice(0,5);
  const pmax=Math.max(1,...byPlan.map(p=>p.v));
  const topc=groupBy(d.transactions.filter(x=>x.type==='ingreso'&&x.clientId&&inRange(x)),x=>x.clientId).slice(0,5).map(p=>({id:p.k,k:cname(p.k)||'Cliente eliminado',v:p.v}));
  const tmax=Math.max(1,...topc.map(p=>p.v));
  const catF=it=>({txType:'egreso',txCat:it.k,txMonth:'todos'});
  const planOf=k=>d.clients.some(c=>c.plan===k)?tapA('clientes',{clientPlan:k,clientStatus:'todos'},'Ver clientes del plan '+k):tapA('movimientos',{txType:'ingreso',txCat:k},'Ver ingresos de '+k);
  return head('Reportes','Estado de resultados de los últimos '+n+' meses','<div class="chips">'+[3,6,12].map(p=>'<button class="chip'+(ui.period===p?' on':'')+'" data-act="setNum" data-k="period" data-v="'+p+'">'+p+' meses</button>').join('')+'</div><button class="btn ghost" data-act="print">'+ico('print')+'Imprimir</button><button class="btn pri" data-act="export" data-k="report">'+ico('download')+'Exportar CSV</button>')
  +demoBanner()
  +'<div class="grid">'
   +[['Ingresos',inc,'in',null],['Egresos',exp,'out',null],['Utilidad',ut,'trend',null],['Margen',mg,'target','pct']].map((k,i)=>'<div class="card sg s3 rev" style="--d:'+(i+1)+';padding:16px"><div class="flex sb"><span class="lbl">'+k[0]+'</span><span style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid">'+(k[3]?'<span class="num">'+k[1]+'%</span>':count(k[1]))+'</div></div>').join('')
   +'<article class="card sg s8 rev" style="--d:5"><div class="flex sb wrap"><div><h2 class="ct">Ingresos vs egresos</h2><p class="sub">Pasa el cursor o toca un mes para ver el detalle</p></div><div class="legend"><span><i style="background:var(--c1)"></i>Ingresos</span><span><i style="background:var(--c5)"></i>Egresos</span></div></div><div style="margin-top:10px">'+lineChart(ms)+'</div></article>'
   +'<article class="card sg s4 rev" style="--d:6"><h2 class="ct">Egresos por categoría</h2><div class="donutwrap">'
     +(cats.length?donut(cats,catTotal,catF)+'<div class="lg">'+cats.map((c,i)=>'<button'+drillA('movimientos',catF(c))+'><i style="background:'+COLORS[i%6]+'"></i><span>'+esc(c.k)+'</span><b class="num">'+Math.round(c.v/catTotal*100)+'%</b></button>').join('')+'</div>':'<div class="empty"><b>Sin egresos</b>No hay egresos en este periodo.</div>')+'</div></article>'
   +'<article class="card sg s6 rev" style="--d:7"><h2 class="ct">Ingresos por plan</h2><p class="sub">Toca una barra para ver el detalle</p><div style="margin-top:8px">'+(byPlan.length?byPlan.map((p,i)=>'<button class="hbar" style="--i:'+i+'"'+planOf(p.k).replace(' role="button" tabindex="0"','')+'><span>'+esc(p.k)+'</span><div class="t"><i style="--w:'+Math.round(p.v/pmax*100)+'%;--c:'+COLORS[i%6]+'"></i></div><b class="num mv">'+kfmt(p.v)+'</b></button>').join(''):'<div class="empty"><b>Sin ingresos</b>Registra ingresos para ver este reporte.</div>')+'</div></article>'
   +'<article class="card sg s6 rev" style="--d:8"><h2 class="ct">Clientes que más aportan</h2><p class="sub">Toca un cliente para abrir su ficha</p><div style="margin-top:8px">'+(topc.length?topc.map((p,i)=>'<button class="hbar" style="--i:'+i+'" data-act="openClient" data-id="'+esc(p.id)+'"><span>'+esc(p.k)+'</span><div class="t"><i style="--w:'+Math.round(p.v/tmax*100)+'%;--c:'+COLORS[(i+1)%6]+'"></i></div><b class="num mv">'+kfmt(p.v)+'</b></button>').join(''):'<div class="empty"><b>Sin datos</b>Asocia tus ingresos a un cliente para ver su aporte.</div>')+'</div></article>'
   +'<article class="card sg s12 rev" style="--d:9"><h2 class="ct" style="margin-bottom:4px">Estado de resultados mensual</h2><p class="sub" style="margin-bottom:6px">Toca un mes para ver sus movimientos</p><div class="rscroll"><table class="rtable"><thead><tr><th>Mes</th><th>Ingresos</th><th>Egresos</th><th>Utilidad</th><th>Margen</th></tr></thead><tbody>'
     +ms.slice().reverse().map(m=>{const u=m.inc-m.exp;return '<tr'+drillA('movimientos',{txMonth:m.key,txType:'todos'})+'><td>'+mlong(m.key)+'</td><td class="num">'+cop(m.inc)+'</td><td class="num">'+cop(m.exp)+'</td><td class="num" style="font-weight:700;color:'+(u>=0?'var(--good)':'var(--bad)')+'">'+cop(u)+'</td><td class="num mut">'+(m.inc?Math.round(u/m.inc*100)+'%':'—')+'</td></tr>'}).join('')
   +'</tbody></table></div></article></div>';
};

/* gestión diaria */
V.agenda=function(){
  const d=D(),t=today(),day=ui.day;
  const dd=parse(day),dow=(dd.getDay()+6)%7,mon=addDays(day,-dow);
  const tasks=d.tasks.filter(x=>x.date===day).sort((a,b)=>(a.done-b.done)||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  const dn=tasks.filter(x=>x.done).length,pct=tasks.length?Math.round(dn/tasks.length*100):0;
  const over=d.tasks.filter(x=>x.date<t&&!x.done).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const txs=d.transactions.filter(x=>x.date===day);
  const cobros=d.clients.filter(c=>c.nextPay===day&&c.status!=='Inactivo');
  const week=[...Array(7)].map((_,i)=>{const s=addDays(mon,i);return {s,n:d.tasks.filter(x=>x.date===s).length}});
  const label=day===t?'Hoy':day===addDays(t,1)?'Mañana':day===addDays(t,-1)?'Ayer':DIASL[dd.getDay()];
  const R=40,C=2*Math.PI*R;
  return head('Gestión diaria',label+', '+dd.getDate()+' de '+MESL[dd.getMonth()]+' · '+dn+' de '+tasks.length+' tareas completadas','<button class="btn ghost" data-act="setDay" data-v="'+t+'">Ir a hoy</button>')
  +demoBanner()
  +'<div class="weekhead rev" style="--d:1"><button class="iconbtn" data-act="setDay" data-v="'+addDays(day,-7)+'" aria-label="Semana anterior">'+ico('chevL')+'</button>'
    +'<div class="wl">'+MESL[dd.getMonth()]+' '+dd.getFullYear()+'<label class="iconbtn sm datepick" aria-label="Elegir una fecha">'+ico('calendar')+'<input type="date" data-bind="day" value="'+day+'"></label></div>'
    +'<button class="iconbtn" data-act="setDay" data-v="'+addDays(day,7)+'" aria-label="Semana siguiente">'+ico('chevR')+'</button></div>'
  +'<div class="week rev" style="--d:1">'+week.map((w,i)=>'<button class="dayb'+(w.s===day?' on':'')+(w.s===t?' now':'')+'" data-act="setDay" data-v="'+w.s+'" aria-label="'+DIAS[i]+' '+parse(w.s).getDate()+': '+w.n+' tareas"><span>'+DIAS[i]+'</span><b class="num">'+parse(w.s).getDate()+'</b><span class="dots">'+'<i></i>'.repeat(Math.min(3,w.n))+'</span></button>').join('')+'</div>'
  +'<div class="grid">'
   +'<article class="card sg s8 rev" style="--d:2"><div class="flex sb" style="margin-bottom:8px;gap:16px"><div><h2 class="ct">Tareas de '+label.toLowerCase()+'</h2><p class="sub">Seguimientos, llamadas, cobros y entregas del día</p></div>'
     +'<div class="ring"><svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="var(--field)" stroke-width="10"/><circle class="seg" style="--i:0" cx="50" cy="50" r="'+R+'" fill="none" stroke="var(--mint)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(C*pct/100)+' '+C+'" transform="rotate(-90 50 50)"/></svg><b class="num">'+pct+'%</b></div></div>'
     +(tasks.length?tasks.map(x=>'<div class="task'+(x.done?' done':'')+'"><button class="chk" data-act="toggleTask" data-id="'+x.id+'" aria-label="'+(x.done?'Marcar como pendiente':'Marcar como hecha')+'">'+ico('tick')+'</button><div class="tt2" data-act="editTask" data-id="'+x.id+'" role="button" tabindex="0"><span>'+esc(x.text)+'</span>'+(x.clientId&&cname(x.clientId)?'<small>'+esc(cname(x.clientId))+'</small>':'')+'</div><button class="iconbtn sm" data-act="delTask" data-id="'+x.id+'" aria-label="Eliminar tarea">'+ico('trash')+'</button></div>').join(''):'<div class="empty"><b>Sin tareas para este día</b>Agrega la primera abajo.</div>')
     +'<form class="addtask" data-form="task"><label class="field" aria-label="Nueva tarea">'+ico('plus')+'<input id="taskText" name="text" placeholder="Nueva tarea, por ejemplo: llamar a un cliente" autocomplete="off" required maxlength="200"></label>'
     +'<select class="sel" name="clientId" aria-label="Cliente relacionado"><option value="">Sin cliente</option>'+d.clients.filter(c=>c.status!=='Inactivo').map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select><button class="btn pri" type="submit">Agregar</button></form></article>'
   +'<div class="s4 stack">'
     +'<article class="card sg rev" style="--d:3"><div class="lbl up" style="margin-bottom:6px">Seguimiento pendiente</div>'+(over.length?'<div class="ul">'+over.map(x=>'<div class="li"><button class="chk" data-act="toggleTask" data-id="'+x.id+'" aria-label="Marcar como hecha">'+ico('tick')+'</button><div class="grow"><b>'+esc(x.text)+'</b><small>'+fdate(x.date)+(cname(x.clientId)?' · '+esc(cname(x.clientId)):'')+'</small></div><button class="iconbtn sm" data-act="moveTask" data-id="'+x.id+'" aria-label="Pasar a hoy" data-tip="Pasar a hoy">'+ico('calendar')+'</button></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Sin pendientes atrasados</b>Buen trabajo.</div>')+'</article>'
     +'<article class="card sg rev" style="--d:4"><div class="lbl up" style="margin-bottom:6px">Cobros de este día</div>'+(cobros.length?'<div class="ul">'+cobros.map(c=>'<div class="li" data-act="openClient" data-id="'+c.id+'" tabindex="0"><div class="av" style="--c:'+hashColor(c.name)+'">'+initials(c.name)+'</div><div class="grow"><b>'+esc(c.name)+'</b><small>'+cop(c.fee)+' · '+esc(c.plan)+'</small></div><button class="btn sm pri" data-act="payClient" data-id="'+c.id+'">Cobrar</button></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Sin cobros programados</b>Ningún cliente vence este día.</div>')+'</article>'
     +'<article class="card sg rev" style="--d:5"><div class="lbl up" style="margin-bottom:6px">Movimientos del día</div>'+(txs.length?'<div class="ul">'+txs.map(x=>'<div class="li" data-act="editTx" data-id="'+x.id+'" tabindex="0"><div class="tico '+(x.type==='ingreso'?'in':'out')+'">'+ico(x.type==='ingreso'?'in':'out')+'</div><div class="grow"><b>'+esc(x.concept||x.category)+'</b><small>'+esc(cname(x.clientId)||x.category)+'</small></div><span class="amt mv '+(x.type==='ingreso'?'in':'')+'">'+(x.type==='ingreso'?'+':'-')+kfmt(x.amount)+'</span></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Sin movimientos</b>No hay ingresos ni egresos este día.</div>')+'</article></div></div>';
};

/* ===== render ===== */
let rq=0,shown=false;
function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render(false)})}
function render(animate){
  const view=$('#view');
  const ae=document.activeElement;const fid=ae&&ae.id&&view.contains(ae)?ae.id:null;const pos=fid&&ae.selectionStart!=null?ae.selectionStart:null;
  const sy=window.scrollY;
  if(!shown){animate=true;shown=true}
  let html;calcFC();
  try{html=V[ui.view]()}catch(err){console.error(err);html='<div class="empty"><b>No se pudo mostrar esta sección</b>Tus datos siguen guardados. Recarga la página para intentarlo de nuevo.<br><button class="btn pri" data-act="reload">Recargar</button></div>'}
  view.className='view'+(animate?' enter':'');
  view.innerHTML=html;
  navUI();
  if(animate)runCounts();
  if(fid){const el=document.getElementById(fid);if(el){el.focus({preventScroll:true});if(pos!=null&&el.setSelectionRange)try{el.setSelectionRange(pos,pos)}catch(e){}}}
  if(!animate)window.scrollTo(0,sy);
}
function runCounts(){
  if(reduced())return;
  const els=Array.from(document.querySelectorAll('[data-count]'));if(!els.length)return;
  const t0=performance.now(),dur=850;
  const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);
    els.forEach(el=>{if(!el.isConnected)return;const to=+el.dataset.count,f=el.dataset.fmt,v=to*e;el.textContent=f==='n'?Math.round(v):copRaw(v)});
    if(p<1)requestAnimationFrame(step);else els.forEach(el=>{if(el.isConnected){const to=+el.dataset.count;el.textContent=el.dataset.fmt==='n'?to:copRaw(to)}})};
  requestAnimationFrame(step);
}
function refreshClients(){const a=$('#clist'),b=$('#cfbar');if(!a){return render(false)}a.innerHTML=clientList();b.innerHTML=clientFbar()}
function refreshTx(){const a=$('#tlist');if(!a){return render(false)}const l=filtTx();$('#tsum').innerHTML=txSum(l);a.innerHTML=txList(l);$('#tfbar').innerHTML=txFbar()}
function refreshFilters(){ui.lim={c:30,t:30};const g=$('#gsearch');if(g&&document.activeElement!==g)g.value=ui.clientQ;ui.view==='clientes'?refreshClients():ui.view==='movimientos'?refreshTx():render(false)}

/* navegación (menú lateral y barra inferior se crean una sola vez) */
function buildNav(){
  $('#dock').innerHTML='<span class="lens" aria-hidden="true"></span>'+VIEWS.map(v=>'<button class="dk" data-act="nav" data-v="'+v.id+'" aria-label="'+v.label+'">'+ico(v.icon)+'<span class="lb">'+v.short+'</span></button>').join('')
    +'<div class="plusw"><button class="plus" id="plusbtn" data-act="quick" aria-label="Agregar" aria-expanded="false" aria-haspopup="menu">'+ico('plus')+'</button><div class="quick" id="quick" role="menu">'
    +'<button data-act="addClient" role="menuitem">'+ico('users')+'Nuevo cliente</button><button data-act="addTx" data-type="ingreso" role="menuitem">'+ico('in')+'Registrar ingreso</button><button data-act="addTx" data-type="egreso" role="menuitem">'+ico('out')+'Registrar egreso</button><button data-act="quickTask" role="menuitem">'+ico('check')+'Tarea de hoy</button></div></div>';
  $('#rail').innerHTML='<span class="lens" aria-hidden="true"></span><span class="logo-m" style="--h:26px;margin:6px 0 8px" role="img" aria-label="EUKO"><i class="ld"></i><i class="ll"></i></span>'+VIEWS.map(v=>'<button class="rbtn" data-act="nav" data-v="'+v.id+'" aria-label="'+v.label+'">'+ico(v.icon)+'<span class="tt">'+v.label+'</span></button>').join('')
    +'<div class="sep"></div><button class="rbtn" id="railhide" data-act="hide"></button><button class="rbtn" data-act="settings" aria-label="Ajustes y respaldo">'+ico('gear')+'<span class="tt">Ajustes y respaldo</span></button>';
}
function placeLens(nav,sel){
  const lens=nav.querySelector('.lens'),on=nav.querySelector(sel+'.on');
  if(!lens||!on||!on.offsetWidth)return;
  lens.style.left='0';lens.style.top='0';
  lens.style.width=on.offsetWidth+'px';lens.style.height=on.offsetHeight+'px';
  lens.style.transform='translate3d('+on.offsetLeft+'px,'+on.offsetTop+'px,0)';
  if(!lens.classList.contains('ready'))requestAnimationFrame(()=>lens.classList.add('ready'));
}
function navUI(){
  document.querySelectorAll('#dock .dk,#rail .rbtn[data-v]').forEach(b=>{const on=b.dataset.v===ui.view;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  placeLens($('#dock'),'.dk');placeLens($('#rail'),'.rbtn[data-v]');
  const rh=$('#railhide');if(rh){rh.className='rbtn'+(HIDE?' on2':'');rh.innerHTML=ico(HIDE?'eyeOff':'eye')+'<span class="tt">'+(HIDE?'Mostrar valores':'Ocultar valores')+'</span>';rh.setAttribute('aria-label',HIDE?'Mostrar valores':'Ocultar valores')}
}
function show(v){
  if(ui.view===v){render(true);window.scrollTo({top:0});return}
  location.hash=v;
}
function navigate(v){
  if(!V[v])v='resumen';
  if(v===ui.view)return;
  closeOverlay(true);closeQuick();hideTip();
  const el=$('#view');
  const go=()=>{ui.view=v;render(true);window.scrollTo(0,0)};
  if(reduced()){go();return}
  el.classList.add('leaving');setTimeout(go,150);
}

/* ===== ventanas y formularios ===== */
const ov=$('#overlay');
let ovOpener=null,ovDirty=false,ovArmed=false;
function openOverlay(html,drawer){
  if(!ov.classList.contains('open'))ovOpener=document.activeElement;
  ovDirty=false;ovArmed=false;
  if(html.indexOf('id="filesbox"')<0){fOwner='';draft=[]}
  ov.className='open'+(drawer?' drawer':'');ov.innerHTML='<div class="modal glass" role="document"><div class="grab" aria-hidden="true"></div>'+html+'</div>';
  document.body.classList.add('lock');
  if(ov.querySelector('#filesbox'))hydrateThumbs();
  if(matchMedia('(hover:hover)').matches){const f=ov.querySelector('input:not([type=hidden]):not([type=file]),select,textarea');if(f)setTimeout(()=>f.focus({preventScroll:true}),60)}
}
function closeOverlay(force){
  if(!ov.classList.contains('open'))return true;
  if(!force&&ovDirty&&!ovArmed){ovArmed=true;toast('Tienes cambios sin guardar. Cierra otra vez para descartarlos.');return false}
  ov.className='';ov.innerHTML='';if(!$('#viewer').classList.contains('open'))document.body.classList.remove('lock');ovDirty=false;ovArmed=false;pendingImport=null;pendingData={};urlCache.forEach(u=>URL.revokeObjectURL(u));urlCache.clear();draft=[];fOwner='';
  if(ovOpener&&ovOpener.isConnected&&ovOpener.focus){try{ovOpener.focus({preventScroll:true})}catch(e){}}ovOpener=null;
  return true;
}
const dl=(id,items)=>'<datalist id="'+id+'">'+items.map(i=>'<option value="'+esc(i)+'">').join('')+'</datalist>';
const xbtn='<button class="iconbtn sm" data-act="close" aria-label="Cerrar" type="button">'+ico('x')+'</button>';
function waLink(p){const n=String(p||'').replace(/\D/g,'');if(n.length<7)return '';return 'https://wa.me/'+(n.length===10&&n[0]==='3'?'57'+n:n)}

/* ----- soportes en formularios ----- */
let fOwner='',draft=[];const urlCache=new Map();
function thumbHtml(f,isDraft){
  const img=/^image\//.test(f.mime),dr=isDraft?' data-draft="1"':'';
  return '<div class="fthumb" data-act="viewFile" data-id="'+f.id+'"'+dr+' role="button" tabindex="0" aria-label="Ver '+esc(f.name)+'">'+(img?'<img data-fid="'+f.id+'" alt="">':'<div class="pdf">'+ico('doc')+'PDF</div>')
   +'<span class="fk">'+esc(f.kind)+'</span><button type="button" class="fx" data-act="delFile" data-id="'+f.id+'"'+dr+' aria-label="Quitar soporte">'+ico('x')+'</button></div>';
}
function filesInner(kindDef){
  const saved=fOwner?S.files.filter(f=>f.owner===fOwner):[];
  return '<div class="fh"><h3>'+ico('clip')+'Soportes <span class="sub">('+(saved.length+draft.length)+')</span></h3><select class="sel" id="fkind" aria-label="Tipo de soporte">'+FKINDS.map(k=>'<option'+(k===kindDef?' selected':'')+'>'+k+'</option>').join('')+'</select></div>'
   +'<div class="fgrid">'+saved.map(f=>thumbHtml(f,false)).join('')+draft.map(f=>thumbHtml(f,true)).join('')+'<label class="fadd">'+ico('plus')+'<span>Agregar</span><input type="file" id="fileinp" accept="image/*,application/pdf" multiple></label></div>'
   +'<p class="hint">Foto o PDF del comprobante de pago, del pendiente o del crédito.'+(fOwner?' Se guardan al instante en este navegador.':' Se guardan al presionar Guardar.')+'</p>';
}
const filesBox=kindDef=>'<div class="files" id="filesbox" data-kind="'+esc(kindDef)+'">'+filesInner(kindDef)+'</div>';
async function thumbUrl(id,blob){if(urlCache.has(id))return urlCache.get(id);const b=blob||await fget(id);if(!b)return '';const u=URL.createObjectURL(b);urlCache.set(id,u);return u}
function hydrateThumbs(){document.querySelectorAll('#filesbox img[data-fid]').forEach(async im=>{const id=im.dataset.fid,d=draft.find(x=>x.id===id);try{const u=await thumbUrl(id,d&&d.blob);if(u&&im.isConnected)im.src=u}catch(e){}})}
function refreshFiles(){const b=$('#filesbox');if(!b)return;const k=($('#fkind')||{}).value||b.dataset.kind;b.innerHTML=filesInner(k);hydrateThumbs()}
async function addFiles(list){
  list=Array.from(list||[]);if(!list.length)return;
  const key=fOwner,kind=($('#fkind')||{}).value||FKINDS[0];
  let n=0,bad=0,total=(key?S.files.filter(f=>f.owner===key).length:0)+draft.length;
  for(const f of list){
    if(total>=12){toast('Máximo 12 soportes por registro');break}
    const p=await prepFile(f);if(!p){bad++;continue}
    const base=String(f.name||'soporte').replace(/\.[^.]+$/,'').slice(0,60)||'soporte';
    const meta={id:uid(),name:base+'.'+p.ext,mime:p.mime,size:p.blob.size,kind,date:today()};
    if(key){
      try{await fput(meta.id,p.blob)}catch(e){toast('Este navegador no permite guardar archivos');return}
      if(!n)snap();S.files.push(Object.assign(meta,{owner:key}));
    }else draft.push(Object.assign(meta,{blob:p.blob}));
    n++;total++;
  }
  if(n){if(key){save();render(false)}else ovDirty=true}
  refreshFiles();
  if(n&&key)toast('Soporte guardado','Deshacer','undo');
  if(bad)toast(bad+(bad===1?' archivo no se pudo agregar':' archivos no se pudieron agregar')+' (usa fotos o PDF de hasta 4 MB)');
}
async function flushDraft(owner){
  const out=[];
  for(const d of draft){try{await fput(d.id,d.blob);out.push({id:d.id,owner,name:d.name,mime:d.mime,size:d.size,kind:d.kind,date:d.date})}catch(e){toast('No se pudo guardar un soporte en este navegador')}}
  return out;
}
let viewerUrl='';
async function viewFile(id,isDraft){
  const f=isDraft?draft.find(x=>x.id===id):S.files.find(x=>x.id===id);if(!f)return;
  let blob=null;try{blob=isDraft?f.blob:await fget(id)}catch(e){}
  if(!blob){toast('No se encontró el archivo en este navegador');return}
  closeViewer();viewerUrl=URL.createObjectURL(blob);
  const v=$('#viewer');
  v.innerHTML='<div class="vbar"><div class="grow"><b>'+esc(f.name)+'</b><small>'+esc(f.kind)+' · '+fdate(f.date)+' · '+fsize(f.size)+'</small></div><a class="iconbtn" href="'+viewerUrl+'" download="'+esc(f.name)+'" aria-label="Descargar">'+ico('download')+'</a><button class="iconbtn" data-act="closeViewer" aria-label="Cerrar">'+ico('x')+'</button></div>'
   +'<div class="vbody">'+(f.mime==='application/pdf'?'<iframe src="'+viewerUrl+'" title="'+esc(f.name)+'"></iframe>':'<img src="'+viewerUrl+'" alt="'+esc(f.name)+'">')+'</div>';
  v.classList.add('open');document.body.classList.add('lock');
}
function closeViewer(){const v=$('#viewer');if(!v||!v.classList.contains('open')){return false}v.classList.remove('open');v.innerHTML='';if(viewerUrl){URL.revokeObjectURL(viewerUrl);viewerUrl=''}if(!ov.classList.contains('open'))document.body.classList.remove('lock');return true}

function clientForm(c,demoView){
  const d=D(),isNew=!c;c=c||{};
  const plans=[...new Set(['Básico','Pro','VIP'].concat(d.clients.map(x=>x.plan).filter(Boolean)))];
  const hist=c.id?d.transactions.filter(x=>x.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8):[];
  const tel=String(c.phone||'').replace(/[^\d+]/g,''),wa=waLink(c.phone);
  if(!demoView){fOwner=c.id?'client:'+c.id:'';draft=[]}
  return '<div class="mh"><h2 class="flex" style="gap:12px">'+(c.payEntity?logoHtml(c.payEntity,34):'')+'<span>'+(isNew?'Nuevo cliente':esc(c.name))+'</span></h2>'+xbtn+'</div>'
  +(!isNew&&(tel||wa||c.email)?'<div class="qa">'+(tel?'<a class="btn sm ghost" href="tel:'+esc(tel)+'">'+ico('phone')+'Llamar</a>':'')+(wa?'<a class="btn sm ghost" href="'+esc(wa)+'" target="_blank" rel="noopener">'+ico('phone')+'WhatsApp</a>':'')+(c.email?'<a class="btn sm ghost" href="mailto:'+esc(c.email)+'">'+ico('mail')+'Correo</a>':'')+'</div>':'')
  +(demoView?'<div class="banner" style="margin-bottom:12px"><span><b>Dato de ejemplo.</b> Solo lectura.</span></div>':'')
  +'<form data-form="'+(demoView?'demo':'client')+'" data-id="'+esc(c.id||'')+'" autocomplete="off"><div class="fg">'
  +'<label class="fl full">Nombre completo<input name="name" required maxlength="80" value="'+esc(c.name)+'" placeholder="Nombre y apellido"></label>'
  +'<label class="fl">Teléfono<input name="phone" inputmode="tel" maxlength="30" value="'+esc(c.phone)+'" placeholder="300 000 0000"></label>'
  +'<label class="fl">Correo<input name="email" type="email" maxlength="80" value="'+esc(c.email)+'" placeholder="cliente@correo.com"></label>'
  +'<label class="fl">Plan<input name="plan" list="planl" maxlength="40" value="'+esc(c.plan||'')+'" placeholder="Básico, Pro, VIP…"></label>'+dl('planl',plans)
  +'<label class="fl">Cuota mensual (COP)<input name="fee" data-money inputmode="numeric" value="'+(c.fee?group(c.fee):'')+'" placeholder="250.000"></label>'
  +'<label class="fl">Estado<select name="status">'+STATUS_C.map(s=>'<option'+((c.status||'Activo')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'
  +'<label class="fl">Fecha de ingreso<input name="joined" type="date" value="'+(c.joined||today())+'"></label>'
  +'<label class="fl full">Próximo pago<input name="nextPay" type="date" value="'+(c.nextPay||'')+'"></label>'
  +entPicker('payEntity',c.payEntity,{label:'Medio de pago habitual del cliente',ph:'Escribe: Nequi, Bancolombia, Daviplata…'})
  +'<label class="fl full">Notas<textarea name="notes" maxlength="1000" placeholder="Preferencias, acuerdos, observaciones…">'+esc(c.notes)+'</textarea></label>'
  +(demoView?'':filesBox('Comprobante de pago'))+'</div>'
  +'<div class="mf">'+(isNew?'<span></span>':'<button type="button" class="btn ghost danger" data-act="delClient" data-id="'+esc(c.id)+'">'+ico('trash')+'Eliminar</button>')
  +'<div class="flex">'+(isNew?'':'<button type="button" class="btn dark" data-act="payClient" data-id="'+esc(c.id)+'">'+ico('card')+'Registrar pago</button>')+'<button class="btn pri" type="submit">Guardar</button></div></div></form>'
  +(hist.length?'<div class="hist"><h3>Historial de movimientos</h3><div class="ul">'+hist.map(x=>'<div class="li"><div class="tico '+(x.type==='ingreso'?'in':'out')+'">'+ico(x.type==='ingreso'?'in':'out')+'</div><div class="grow"><b>'+esc(x.concept||x.category)+'</b><small>'+fdate(x.date)+(x.entity?' · '+esc(entName(x.entity)):'')+'</small></div><span class="amt in">'+cop(x.amount)+'</span>'+statusPill(x.status)+'</div>').join('')+'</div></div>':'');
}
function txForm(x,type){
  const d=D(),isNew=!x.id;type=x.type||type||'ingreso';
  const method=x.method||(isNew?'Transferencia':'Efectivo');
  fOwner=x.id?'tx:'+x.id:'';draft=[];
  const kindDef=method==='Crédito'?'Crédito':(x.status==='Pendiente'?'Pendiente por cobrar':'Comprobante de pago');
  const cats=[...new Set(['Membresías','Asesorías','Herramientas','Publicidad','Servicios','Impuestos','Otros'].concat(d.transactions.map(t=>t.category).filter(Boolean)))];
  const isCred=method==='Crédito',isPay=method==='Transferencia'||method==='Tarjeta';
  return '<div class="mh"><h2>'+(isNew?'Nuevo movimiento':'Editar movimiento')+'</h2>'+xbtn+'</div>'
  +'<form data-form="tx" data-id="'+esc(x.id||'')+'" autocomplete="off"><input type="hidden" name="type" value="'+type+'"><input type="hidden" name="method" value="'+method+'"><div class="fg">'
  +'<div class="full seg2" role="group" aria-label="Tipo"><button type="button" class="'+(type==='ingreso'?'on in':'')+'" data-act="txType" data-v="ingreso">Ingreso</button><button type="button" class="'+(type==='egreso'?'on out':'')+'" data-act="txType" data-v="egreso">Egreso</button></div>'
  +'<label class="fl">Monto (COP)<input name="amount" data-money required inputmode="numeric" value="'+(x.amount?group(x.amount):'')+'" placeholder="250.000"></label>'
  +'<label class="fl">Fecha<input name="date" type="date" required value="'+(x.date||today())+'"></label>'
  +'<label class="fl full">Concepto<input name="concept" maxlength="120" value="'+esc(x.concept)+'" placeholder="Ej. Membresía de octubre"></label>'
  +'<label class="fl">Categoría<input name="category" list="catl" required maxlength="40" value="'+esc(x.category||'')+'" placeholder="Membresías, Publicidad…"></label>'+dl('catl',cats)
  +'<label class="fl">Estado<select name="status">'+['Completado','Pendiente'].map(s=>'<option'+((x.status||'Completado')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'
  +'<label class="fl full">Cliente (opcional)<select name="clientId"><option value="">Sin cliente</option>'+d.clients.map(c=>'<option value="'+esc(c.id)+'"'+(x.clientId===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'
  +'<div class="full"><div class="elbl" style="font-size:12px;font-weight:700;color:var(--fg2);margin-bottom:6px">Método de pago</div><div class="seg4" role="group" aria-label="Método de pago">'+METHODS.map(m=>'<button type="button" class="'+(method===m?'on':'')+'" data-act="method" data-v="'+m+'">'+(m==='Transferencia'?'Transfer.':m)+'</button>').join('')+'</div></div>'
  +'<div class="full" id="payWrap"'+(isPay?'':' hidden')+'>'+entPicker('entity',isPay?x.entity:'',{label:'Banco, billetera o comercio'})+'</div>'
  +'<div class="credit-box full" id="credWrap"'+(isCred?'':' hidden')+'><div class="cb-h">'+ico('card')+'Crédito<span class="pill warn">Casilla de crédito</span></div>'
    +entPicker('credEntity',isCred?x.entity:'',{credit:true,label:'Entidad del crédito',ph:'Escribe: Addi, Sistecrédito, Falabella…'})
    +'<label class="fl">Número de cuotas<input name="installments" inputmode="numeric" maxlength="2" value="'+(x.installments||'')+'" placeholder="Ej. 6"></label></div>'
  +filesBox(kindDef)+'</div>'
  +'<div class="mf">'+(isNew?'<span></span>':'<button type="button" class="btn ghost danger" data-act="delTx" data-id="'+esc(x.id)+'">'+ico('trash')+'Eliminar</button>')+'<div class="flex">'+(!isNew&&x.type==='ingreso'&&x.status==='Pendiente'?'<button type="button" class="btn dark" data-act="markPaid" data-id="'+esc(x.id)+'">'+ico('tick')+'Marcar cobrado</button>':'')+'<button class="btn pri" type="submit">Guardar</button></div></div></form>';
}
function goalForm(){
  return '<div class="mh"><h2>Meta de ingresos</h2>'+xbtn+'</div><form data-form="goal" autocomplete="off"><label class="fl">Meta mensual (COP)<input name="goal" data-money inputmode="numeric" required value="'+(S.settings.goal?group(S.settings.goal):'')+'" placeholder="8.000.000"></label><div class="mf"><span></span><button class="btn pri" type="submit">Guardar meta</button></div></form>';
}
function taskForm(t){
  const d=D();
  return '<div class="mh"><h2>Editar tarea</h2>'+xbtn+'</div><form data-form="taskedit" data-id="'+esc(t.id)+'" autocomplete="off"><div class="fg">'
  +'<label class="fl full">Tarea<input name="text" required maxlength="200" value="'+esc(t.text)+'"></label>'
  +'<label class="fl">Fecha<input name="date" type="date" required value="'+t.date+'"></label>'
  +'<label class="fl">Cliente<select name="clientId"><option value="">Sin cliente</option>'+d.clients.map(c=>'<option value="'+esc(c.id)+'"'+(t.clientId===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label></div>'
  +'<div class="mf"><button type="button" class="btn ghost danger" data-act="delTask" data-id="'+esc(t.id)+'" data-close="1">'+ico('trash')+'Eliminar</button><button class="btn pri" type="submit">Guardar</button></div></form>';
}
function searchSheet(){
  return '<div class="mh"><h2>Buscar cliente</h2>'+xbtn+'</div><label class="field" style="max-width:none;margin-bottom:10px">'+ico('search')+'<input id="msq" type="search" placeholder="Nombre, teléfono o plan" autocomplete="off"></label><div id="msr" class="ul"></div>';
}
function searchResults(q){
  q=q.trim().toLowerCase();
  const list=D().clients.filter(c=>!q||(c.name+' '+(c.phone||'')+' '+(c.plan||'')).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'es')).slice(0,12);
  return list.length?list.map(c=>'<div class="li" data-act="openClient" data-id="'+c.id+'" tabindex="0"><div class="av" style="--c:'+hashColor(c.name)+'">'+initials(c.name)+'</div><div class="grow"><b>'+esc(c.name)+'</b><small>'+esc(c.plan||'Sin plan')+' · '+esc(c.status)+'</small></div>'+ico('chevR')+'</div>').join(''):'<div class="empty" style="padding:18px 0"><b>Sin resultados</b>Prueba con otro nombre.</div>';
}

/* ajustes y respaldo */
let pendingImport=null,pendingData={};
function settingsForm(){
  const fs=S.files.reduce((a,f)=>a+(f.size||0),0),n=S.clients.length+' clientes · '+S.transactions.length+' movimientos · '+S.tasks.length+' tareas · '+S.files.length+' soportes'+(S.files.length?' ('+fsize(fs)+')':'');
  let size='';try{size=Math.max(1,Math.round(snapshotJSON().length/1024))+' KB'}catch(e){}
  let hasBak=false;try{hasBak=!!localStorage.getItem(LSB)}catch(e){}
  const wasDemo=S.settings.hideDemo&&!S.clients.length&&!S.transactions.length&&!S.tasks.length;
  return '<div class="mh"><h2>Ajustes y respaldo</h2>'+xbtn+'</div>'
  +(meta.noStorage||meta.saveErr?'<div class="banner"><span><b>Atención.</b> Este navegador no está guardando los datos (¿modo privado o sin espacio?). Descarga un respaldo para no perderlos.</span></div>':'')
  +'<div class="setsec"><h3>Meta de ingresos</h3><p>Meta mensual actual: <b class="num">'+cop(S.settings.goal||0)+'</b></p><div class="setrow"><button class="btn ghost" data-act="editGoal">'+ico('target')+'Cambiar meta</button></div></div>'
  +'<div class="setsec"><h3>Respaldo de tus datos</h3><p>Tus datos se guardan en este navegador ('+n+(size?' · '+size:'')+'). Descarga un respaldo con frecuencia (incluye los comprobantes) y úsalo para llevarlos a otro dispositivo.</p>'
  +'<div class="setrow"><button class="btn pri" data-act="exportJson">'+ico('download')+'Descargar respaldo (.json)</button><label class="btn ghost" style="cursor:pointer">'+ico('upload')+'Restaurar desde archivo<input type="file" id="impfile" accept=".json,application/json" class="vh"></label></div>'
  +'<div class="setrow" style="margin-top:8px"><button class="btn ghost" data-act="export" data-k="all">'+ico('download')+'Exportar todo a CSV</button>'+(hasBak?'<button class="btn ghost" data-act="restoreBak">Recuperar copia automática</button>':'')+'</div><div id="impres"></div></div>'
  +(wasDemo?'<div class="setsec"><h3>Datos de ejemplo</h3><p>Los ocultaste. Puedes volver a mostrarlos mientras no tengas datos propios.</p><div class="setrow"><button class="btn ghost" data-act="showDemo">Mostrar ejemplos</button></div></div>':'')
  +'<div class="setsec"><h3>Zona de cuidado</h3><p>Borra todos los clientes, movimientos y tareas de este navegador. Puedes deshacerlo justo después.</p><div class="setrow"><button class="btn ghost danger" data-act="wipe">'+ico('trash')+'Borrar todos los datos</button></div></div>';
}
function importSummary(p){
  const total=p.clients.length+p.transactions.length+p.tasks.length+p.files.length;
  if(!total)return '<div class="impbox">El archivo no contiene datos válidos.</div>';
  return '<div class="impbox"><b>Archivo listo</b><br>'+p.clients.length+' clientes · '+p.transactions.length+' movimientos · '+p.tasks.length+' tareas · '+p.files.length+' soportes<div class="setrow" style="margin-top:12px"><button class="btn pri" data-act="importMerge">Combinar con mis datos</button><button class="btn ghost danger" data-act="importReplace">Reemplazar todo</button></div></div>';
}

/* ===== exportar ===== */
function download(name,mime,text){
  try{const b=new Blob([text],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);return true}catch(e){console.error(e);return false}
}
const csvCell=v=>{if(typeof v==='number')return String(v);v=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
function exportCsv(kind){
  const d=D(),rows=[];
  const cl=list=>[['Nombre','Teléfono','Correo','Plan','Cuota','Estado','Ingreso','Próximo pago','Medio de pago','Notas']].concat(list.map(c=>[c.name,c.phone,c.email,c.plan,c.fee,c.status,c.joined,c.nextPay,c.payEntity?entName(c.payEntity):'',c.notes]));
  const tx=list=>[['Fecha','Tipo','Concepto','Categoría','Cliente','Monto','Estado','Método','Entidad','Cuotas']].concat(list.map(x=>[x.date,x.type,x.concept,x.category,cname(x.clientId),x.amount,x.status,x.method||'',x.entity?entName(x.entity):'',x.installments||'']));
  let name='euko-datos';
  if(kind==='clients'){rows.push(...cl(filtClients()));name='euko-clientes'}
  else if(kind==='tx'){rows.push(...tx(filtTx()));name='euko-movimientos'}
  else if(kind==='report'){const ms=totals(monthKeys(ui.period));rows.push(['Mes','Ingresos','Egresos','Utilidad','Margen %']);ms.forEach(m=>rows.push([mlong(m.key),m.inc,m.exp,m.inc-m.exp,m.inc?Math.round((m.inc-m.exp)/m.inc*100):0]));name='euko-reporte'}
  else{rows.push(['CLIENTES'],...cl(d.clients),[],['MOVIMIENTOS'],...tx(d.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date))),[],['TAREAS'],['Fecha','Tarea','Hecha','Cliente'],...d.tasks.map(t=>[t.date,t.text,t.done?'Sí':'No',cname(t.clientId)]))}
  if(rows.length<=1&&kind!=='report'){toast('No hay datos para exportar');return}
  const ok=download(name+'-'+today()+'.csv','text/csv;charset=utf-8','﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'));
  toast(ok?'Archivo descargado':'No se pudo descargar el archivo');
}
async function exportJson(){
  toast('Preparando respaldo…');
  const files=[];
  for(const f of S.files){try{const b=await fget(f.id);if(b)files.push(Object.assign({},f,{data:await blobToDataUrl(b)}))}catch(e){}}
  const ok=download('euko-respaldo-'+today()+'.json','application/json',JSON.stringify({app:'euko',version:2,exportedAt:new Date().toISOString(),data:{clients:S.clients,transactions:S.transactions,tasks:S.tasks,files,settings:S.settings}}));
  toast(ok?'Respaldo descargado'+(files.length?' con '+files.length+' soportes':'')+'. Guárdalo en un lugar seguro':'No se pudo descargar el respaldo');
}
async function putImportBlob(id){const u=pendingData[id];if(!u)return false;const b=dataUrlToBlob(u);if(!b)return false;try{await fput(id,b);return true}catch(e){return false}}
function readFile(f){return f.text?f.text():new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(f)})}

/* ===== acciones ===== */
const guardDemo=()=>{if(demoOn()){toast('Son datos de ejemplo. Registra tu primer dato para empezar con los tuyos.');return true}return false};
function closeQuick(){const q=$('#quick'),b=$('#plusbtn');if(q){q.classList.remove('open');b&&b.classList.remove('open');b&&b.setAttribute('aria-expanded','false')}}
function nextPayFor(c){const t=today();return addMonths(c.nextPay&&c.nextPay>t?c.nextPay:t,1)}
const ACT={
  nav:el=>{closeQuick();show(el.dataset.v)},
  drill:el=>{let f={};try{f=JSON.parse(el.dataset.f||'{}')}catch(e){}resetFilters();Object.assign(ui,f);closeOverlay(true);show(el.dataset.v)},
  set:el=>{ui[el.dataset.k]=el.dataset.v;ui.lim={c:30,t:30};render(false)},
  setNum:el=>{ui[el.dataset.k]=+el.dataset.v;saveUi();render(true)},
  setDay:el=>{if(isDate(el.dataset.v)){ui.day=el.dataset.v;render(false)}},
  more:el=>{ui.lim[el.dataset.k]+=30;ui.view==='clientes'?refreshClients():refreshTx()},
  clearF:el=>{ui[el.dataset.k]=el.dataset.k==='clientQ'||el.dataset.k==='txQ'?'':'todos';const q=$('#clientQ')||$('#txQ');if(q&&(el.dataset.k==='clientQ'||el.dataset.k==='txQ'))q.value='';render(false)},
  clearAll:()=>{resetFilters();render(false)},
  theme:()=>toggleTheme(),
  hide:()=>{HIDE=!HIDE;try{localStorage.setItem('euko-hide',HIDE?'1':'0')}catch(e){}applyHide();navUI();toast(HIDE?'Valores ocultos. Los porcentajes siguen visibles':'Valores visibles')},
  close:()=>{if(!closeOverlay(false))return},
  reload:()=>location.reload(),
  print:()=>window.print(),
  undo:()=>doUndo(),
  quick:()=>{const q=$('#quick'),b=$('#plusbtn');const o=!q.classList.contains('open');q.classList.toggle('open',o);b.classList.toggle('open',o);b.setAttribute('aria-expanded',o)},
  settings:()=>{closeQuick();openOverlay(settingsForm(),true)},
  searchm:()=>{openOverlay(searchSheet(),false);const r=$('#msr');if(r)r.innerHTML=searchResults('')},
  addClient:()=>{closeQuick();openOverlay(clientForm(null),true)},
  openClient:el=>{const c=D().clients.find(x=>x.id===el.dataset.id);if(!c){toast('No se encontró el cliente');return}closeOverlay(true);openOverlay(clientForm(c,isDemoId(c.id)),true)},
  addTx:el=>{closeQuick();openOverlay(txForm({},el.dataset.type))},
  editTx:el=>{const x=D().transactions.find(t=>t.id===el.dataset.id);if(x){if(guardDemo())return;openOverlay(txForm(x))}},
  txType:el=>{const f=el.closest('form');f.elements.type.value=el.dataset.v;f.querySelectorAll('.seg2 button').forEach(b=>{b.className=b.dataset.v===el.dataset.v?'on '+(b.dataset.v==='ingreso'?'in':'out'):''});ovDirty=true},
  editGoal:()=>{if(guardDemo())return;closeOverlay(true);openOverlay(goalForm())},
  hideDemo:()=>{snap();S.settings.hideDemo=true;commit('Ejemplos ocultos',true)},
  showDemo:()=>{S.settings.hideDemo=false;save();closeOverlay(true);render(false);toast('Ejemplos visibles')},
  toggleTask:el=>{if(guardDemo())return;const t=S.tasks.find(x=>x.id===el.dataset.id);if(t){snap();t.done=!t.done;commit('')}},
  delTask:el=>{if(guardDemo())return;snap();removeItem('tasks',el.dataset.id);if(el.dataset.close)closeOverlay(true);commit('Tarea eliminada',true)},
  moveTask:el=>{if(guardDemo())return;const t=S.tasks.find(x=>x.id===el.dataset.id);if(t){snap();t.date=today();ui.day=today();commit('Tarea movida a hoy',true)}},
  editTask:el=>{if(guardDemo())return;const t=S.tasks.find(x=>x.id===el.dataset.id);if(t)openOverlay(taskForm(t))},
  quickTask:()=>{closeQuick();ui.day=today();if(ui.view!=='agenda')location.hash='agenda';else render(false);setTimeout(()=>{const i=$('#taskText');if(i){i.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'});i.focus({preventScroll:true})}},400)},
  delClient:el=>{const id=el.dataset.id;if(isDemoId(id))return toast('Son datos de ejemplo');
    if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Toca de nuevo para confirmar';return}
    snap();removeItem('clients',id);dropFilesOf('client:'+id);S.tasks.forEach(t=>{if(t.clientId===id)t.clientId=''});S.transactions.forEach(x=>{if(x.clientId===id)x.clientId=''});closeOverlay(true);commit('Cliente eliminado',true)},
  delTx:el=>{if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Toca de nuevo para confirmar';return}snap();removeItem('transactions',el.dataset.id);dropFilesOf('tx:'+el.dataset.id);closeOverlay(true);commit('Movimiento eliminado',true)},
  markPaid:el=>{if(guardDemo())return;const x=S.transactions.find(t=>t.id===el.dataset.id);if(!x)return;snap();x.status='Completado';closeOverlay(true);commit('Marcado como cobrado',true)},
  payClient:el=>{
    if(demoOn())return guardDemo();
    const c=S.clients.find(x=>x.id===el.dataset.id);if(!c){toast('No se encontró el cliente');return}
    const t=today(),next=nextPayFor(c);snap();
    S.transactions.push({id:uid(),type:'ingreso',date:t,amount:+c.fee||0,category:'Membresías',concept:'Membresía '+(c.plan||''),clientId:c.id,method:c.payEntity?'Transferencia':'',entity:c.payEntity||'',installments:0,status:'Completado'});
    c.nextPay=next;c.status='Activo';
    if(!(+c.fee))toast('Pago registrado en $0: define la cuota del cliente');else{}
    closeOverlay(true);commit('Pago registrado. Próximo cobro: '+fdate(next),true);
  },
  method:el=>{const f=el.closest('form'),m=el.dataset.v;f.elements.method.value=m;f.querySelectorAll('.seg4 button').forEach(b=>b.classList.toggle('on',b.dataset.v===m));
    $('#payWrap').hidden=!(m==='Transferencia'||m==='Tarjeta');$('#credWrap').hidden=m!=='Crédito';ovDirty=true;
    const k=$('#fkind');if(k&&m==='Crédito')k.value='Crédito'},
  pickEnt:el=>{const box=el.closest('[data-ent]'),e=entById(el.dataset.id);if(!e)return;box.querySelector('[data-entq]').value=e.n;refreshEnt(box);ovDirty=true},
  clearEnt:el=>{const box=el.closest('[data-ent]'),i=box.querySelector('[data-entq]');i.value='';refreshEnt(box);i.focus();ovDirty=true},
  viewFile:el=>viewFile(el.dataset.id,!!el.dataset.draft),
  closeViewer:()=>closeViewer(),
  delFile:el=>{
    if(el.dataset.draft){draft=draft.filter(x=>x.id!==el.dataset.id);refreshFiles();return}
    snap();S.files=S.files.filter(f=>f.id!==el.dataset.id);save();render(false);refreshFiles();toast('Soporte eliminado','Deshacer','undo')},
  export:el=>exportCsv(el.dataset.k||'all'),
  exportJson:()=>exportJson(),
  restoreBak:()=>{try{const b=readKey(LSB);if(!b)throw 0;const p=sanitize(b);snap();Object.assign(S,p);save();closeOverlay(true);render(false);toast('Copia automática recuperada',  'Deshacer','undo')}catch(e){toast('No hay una copia válida para recuperar')}},
  wipe:el=>{if(el.dataset.sure!=='1'){el.dataset.sure='1';el.lastChild.textContent='Toca de nuevo para confirmar';return}
    snap();save(true);S.clients=[];S.transactions=[];S.tasks=[];S.files=[];S.settings.hideDemo=true;closeOverlay(true);commit('Todos los datos fueron borrados',true)},
  importMerge:async()=>{if(!pendingImport)return;const p=pendingImport;snap();
    ['clients','transactions','tasks'].forEach(k=>{const have=new Set(S[k].map(x=>x.id));p[k].forEach(x=>{if(!have.has(x.id))S[k].push(x)})});
    const have=new Set(S.files.map(f=>f.id)),owners=new Set(S.clients.map(c=>'client:'+c.id).concat(S.transactions.map(x=>'tx:'+x.id)));
    for(const f of p.files){if(have.has(f.id)||!owners.has(f.owner))continue;if(await putImportBlob(f.id))S.files.push(f)}
    pendingImport=null;closeOverlay(true);commit('Datos combinados',true)},
  importReplace:async()=>{if(!pendingImport)return;const p=pendingImport;snap();save(true);const ok=[];
    for(const f of p.files){if(await putImportBlob(f.id))ok.push(f)}
    p.files=ok;Object.assign(S,p);pendingImport=null;closeOverlay(true);commit('Datos restaurados',true)}
};

/* clic global, con ondas y "doble toque" en gráficas táctiles */
let lastPT='mouse',armed=null,armT=0;
document.addEventListener('pointerdown',e=>{
  lastPT=e.pointerType||'mouse';
  const b=e.target.closest&&e.target.closest('.btn,.chip,.iconbtn,.plus,.dayb');
  if(b&&!reduced()&&!b.disabled){const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*1.6,sp=document.createElement('span');sp.className='rip';sp.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';b.appendChild(sp);setTimeout(()=>sp.remove(),650)}
},true);
function disarm(){if(armed)armed.classList.remove('act');armed=null;clearTimeout(armT)}
document.addEventListener('click',e=>{
  if(e.target===ov){ACT.close();return}
  if(e.target.id==='viewer'||(e.target.classList&&e.target.classList.contains('vbody'))){closeViewer();return}
  const el=e.target.closest('[data-act]');
  if(!el){const q=$('#quick');if(q&&q.classList.contains('open')&&!e.target.closest('#quick'))closeQuick();if(armed&&!e.target.closest('[data-arm]')){disarm();hideTip()}return}
  if(el.hasAttribute('data-arm')&&lastPT!=='mouse'&&e.detail!==0&&armed!==el){
    disarm();armed=el;el.classList.add('act');showTipEl(el,true);armT=setTimeout(()=>{disarm();hideTip()},4500);return}
  disarm();hideTip();
  const f=ACT[el.dataset.act];if(f)f(el);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(closeViewer()){e.preventDefault();return}if(ov.classList.contains('open'))ACT.close();closeQuick();hideTip()}
  if(e.key==='Tab'&&ov.classList.contains('open')){
    const fs=Array.from(ov.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex="0"]')).filter(x=>x.offsetParent!==null);
    if(fs.length){const a=fs[0],z=fs[fs.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button][data-act],.tr[data-act],.li[data-act],.bar-g')){e.preventDefault();e.target.click()}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(ov.contains(t)&&t.form&&t.form.dataset.form)ovDirty=true;
  if(t.hasAttribute&&t.hasAttribute('data-money')){
    const digits=t.value.replace(/\D/g,''),before=t.value.slice(0,t.selectionStart||0).replace(/\D/g,'').length;
    const f=digits?group(+digits):'';t.value=f;let n=0,p=0;if(before>0){for(;p<f.length&&n<before;p++){if(/\d/.test(f[p]))n++}}else p=0;try{t.setSelectionRange(p,p)}catch(x){}
  }
  if(t.hasAttribute&&t.hasAttribute('data-entq')){refreshEnt(t.closest('[data-ent]'));return}
  if(t.id==='msq'){$('#msr').innerHTML=searchResults(t.value);return}
  if(t.dataset&&t.dataset.bind&&t.tagName==='INPUT'){clearTimeout(t._d);t._d=setTimeout(()=>{ui[t.dataset.bind]=t.value;const g=$('#gsearch');if(g&&t.dataset.bind==='clientQ'&&g!==t)g.value=t.value;refreshFilters()},110)}
  if(t.id==='gsearch'){clearTimeout(t._d);t._d=setTimeout(()=>{ui.clientQ=t.value;ui.lim.c=30;if(ui.view!=='clientes'){ui.clientStatus='todos';ui.clientPlan='todos';location.hash='clientes'}else refreshClients()},130)}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='fileinp'){addFiles(t.files).then(()=>{try{t.value=''}catch(e){}});return}
  if(t.id==='impfile'){
    const f=t.files&&t.files[0];if(!f)return;
    if(f.size>8*1024*1024){$('#impres').innerHTML='<div class="impbox">El archivo es demasiado grande.</div>';return}
    readFile(f).then(txt=>{const j=JSON.parse(txt),raw=j&&j.data?j.data:j;pendingData={};(Array.isArray(raw.files)?raw.files:[]).forEach(x=>{if(x&&typeof x.data==='string'&&x.data.indexOf('data:')===0&&x.id)pendingData[String(x.id)]=x.data});pendingImport=sanitize(raw);pendingImport.files=pendingImport.files.filter(x=>pendingData[x.id]);$('#impres').innerHTML=importSummary(pendingImport)}).catch(()=>{pendingImport=null;$('#impres').innerHTML='<div class="impbox">No se pudo leer el archivo. Usa un respaldo .json descargado desde este panel.</div>'});
    return;
  }
  if(t.dataset&&t.dataset.bind&&t.tagName==='SELECT'){ui[t.dataset.bind]=t.value;if(t.dataset.bind==='clientSort')saveUi();ui.lim={c:30,t:30};render(false)}
  if(t.dataset&&t.dataset.bind==='day'&&isDate(t.value)){ui.day=t.value;render(false)}
});
document.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();
  const k=f.dataset.form,v=Object.fromEntries(new FormData(f).entries());
  const str=x=>String(x==null?'':x).trim();
  if(k==='demo'){toast('Son datos de ejemplo. Agrega tu primer cliente para empezar.');return}
  if(k==='client'){
    const name=str(v.name);if(!name){toast('Escribe el nombre del cliente');return}
    if(v.joined&&!isDate(v.joined)||v.nextPay&&!isDate(v.nextPay)){toast('Revisa las fechas');return}
    const old=S.clients.find(c=>c.id===f.dataset.id)||{},cid=f.dataset.id||uid();
    const sb=f.querySelector('[type=submit]');if(sb)sb.disabled=true;
    const metas=draft.length?await flushDraft('client:'+cid):[];
    snap();upsert('clients',Object.assign({},old,{id:cid,name,phone:str(v.phone),email:str(v.email),plan:str(v.plan),fee:numOnly(v.fee),status:STATUS_C.indexOf(v.status)>=0?v.status:'Activo',joined:v.joined||today(),nextPay:v.nextPay||'',notes:str(v.notes),payEntity:resolveEnt(v.payEntity).slice(0,40)}));
    S.files.push(...metas);
    closeOverlay(true);commit(f.dataset.id?'Cliente actualizado':'Cliente agregado',true);
  }else if(k==='tx'){
    const amt=numOnly(v.amount);if(!amt){toast('Escribe un monto mayor a cero');return}
    if(!isDate(v.date)){toast('Escribe una fecha válida');return}
    const old=S.transactions.find(c=>c.id===f.dataset.id)||{},tid=f.dataset.id||uid();
    const method=METHODS.indexOf(v.method)>=0?v.method:'';
    const entity=method==='Crédito'?resolveEnt(v.credEntity):(method==='Transferencia'||method==='Tarjeta')?resolveEnt(v.entity):'';
    const sb=f.querySelector('[type=submit]');if(sb)sb.disabled=true;
    const metas=draft.length?await flushDraft('tx:'+tid):[];
    snap();upsert('transactions',Object.assign({},old,{id:tid,type:v.type==='egreso'?'egreso':'ingreso',amount:amt,date:v.date,concept:str(v.concept),category:str(v.category)||'Otros',status:v.status==='Pendiente'?'Pendiente':'Completado',clientId:v.clientId||'',method,entity:entity.slice(0,40),installments:method==='Crédito'?Math.min(60,numOnly(v.installments)):0}));
    S.files.push(...metas);
    closeOverlay(true);commit(f.dataset.id?'Movimiento actualizado':(v.type==='egreso'?'Egreso registrado':'Ingreso registrado'),true);
  }else if(k==='goal'){
    snap();S.settings.goal=numOnly(v.goal);closeOverlay(true);commit('Meta actualizada',true);
  }else if(k==='task'){
    const txt=str(v.text);if(!txt)return;
    snap();S.tasks.push({id:uid(),date:ui.day,text:txt,done:false,clientId:v.clientId||'',createdAt:new Date().toISOString()});
    save();render(false);const i=$('#taskText');if(i)i.focus({preventScroll:true});
  }else if(k==='taskedit'){
    const t=S.tasks.find(x=>x.id===f.dataset.id);const txt=str(v.text);if(!t||!txt||!isDate(v.date)){toast('Revisa los datos de la tarea');return}
    snap();Object.assign(t,{text:txt,date:v.date,clientId:v.clientId||''});closeOverlay(true);commit('Tarea actualizada',true);
  }
});

/* hoja inferior arrastrable (celular) */
document.addEventListener('pointerdown',e=>{
  const g=e.target.closest&&e.target.closest('.grab');if(!g)return;
  const m=g.closest('.modal');let y0=e.clientY,dy=0;
  try{g.setPointerCapture(e.pointerId)}catch(x){}
  m.style.animation='none';m.style.transition='none';
  const mv=ev=>{dy=Math.max(0,ev.clientY-y0);m.style.transform='translate3d(0,'+dy+'px,0)'};
  const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);
    if(dy>110&&closeOverlay(false))return;m.style.transition='transform .25s';m.style.transform=''};
  g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
});

/* brillo del cursor y tooltips */
const tip=$('#tip');
function hideTip(){tip.classList.remove('on')}
function fillTip(el,hint){let t=esc(el.dataset.tip).replace(/\n/g,'<br>');if(HIDE)t=t.replace(/\$ ?[\d.]+/g,'<span class="mv">$&</span>');tip.innerHTML=t+(hint&&el.dataset.hint?'<small>'+esc(el.dataset.hint)+'</small>':'')}
function showTipEl(el,hint){
  fillTip(el,hint);tip.classList.add('on');
  const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h-10;
  x=Math.max(8,Math.min(innerWidth-w-8,x));if(y<8)y=r.bottom+10;
  tip.style.left=x+'px';tip.style.top=y+'px';
}
let mvE=null,mvR=0;
document.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;mvE=e;if(mvR)return;
  mvR=requestAnimationFrame(()=>{mvR=0;const e=mvE;if(!e)return;
    const tg=e.target;
    const g=tg.closest&&tg.closest('.glass,.sg');
    if(g){const r=g.getBoundingClientRect();g.style.setProperty('--mx',(e.clientX-r.left)+'px');g.style.setProperty('--my',(e.clientY-r.top)+'px')}
    const t=tg.closest&&tg.closest('[data-tip]');
    if(t){fillTip(t,false);tip.classList.add('on');const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY-h-12;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y<8)y=e.clientY+18;tip.style.left=x+'px';tip.style.top=y+'px'}
    else hideTip();
  });
},{passive:true});
document.addEventListener('focusin',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t&&e.target.matches(':focus-visible'))showTipEl(t,false)});
document.addEventListener('focusout',hideTip);
window.addEventListener('scroll',()=>{if(tip.classList.contains('on')&&lastPT!=='mouse')hideTip()},{passive:true});
document.addEventListener('mouseleave',hideTip);

let tt;
function toast(m,label,act){const t=$('#toast');t.innerHTML='<span></span>'+(label?'<button data-act="'+act+'">'+esc(label)+'</button>':'');t.firstChild.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),label?6000:3400)}

/* ocultar valores y tema */
function applyHide(){
  document.documentElement.classList.toggle('hide-money',HIDE);
  const b=$('#hidebtn');if(!b)return;
  b.innerHTML=ico(HIDE?'eyeOff':'eye');b.classList.toggle('on',HIDE);b.setAttribute('aria-pressed',HIDE?'true':'false');
  const l=HIDE?'Mostrar valores':'Ocultar valores';b.setAttribute('aria-label',l);b.title=l;
}
function setTheme(t){
  if(t)document.documentElement.setAttribute('data-theme',t);
  const dark=t?t==='dark':!matchMedia('(prefers-color-scheme: light)').matches;
  $('#themebtn').innerHTML=ico(dark?'sun':'moon');
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#050506':'#e5e7eb';
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  const n=cur==='dark'?'light':'dark';setTheme(n);try{localStorage.setItem('euko-theme',n)}catch(e){}
}

/* ===== arranque ===== */
function setDateChip(){const d=new Date();$('#dchip').textContent=DIASL[d.getDay()]+' '+d.getDate()+' '+MES[d.getMonth()]}
$('#i-s').innerHTML=IC.search;
$('#gearbtn').innerHTML=ico('gear');$('#searchbtn').innerHTML=ico('search');
setDateChip();
try{const t=localStorage.getItem('euko-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}
setTheme(document.documentElement.getAttribute('data-theme'));
const mq=matchMedia('(prefers-color-scheme: light)');mq.addEventListener&&mq.addEventListener('change',()=>setTheme(document.documentElement.getAttribute('data-theme')));
try{HIDE=localStorage.getItem('euko-hide')==='1'}catch(e){}
try{localStorage.setItem('euko-probe','1');localStorage.removeItem('euko-probe')}catch(e){meta.noStorage=true}
load();
buildNav();applyHide();
{const h=location.hash.slice(1);if(V[h])ui.view=h}
render(true);saveUI(false);
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
window.addEventListener('storage',e=>{if(e.key===LS){load();render(false)}});
window.addEventListener('resize',()=>{navUI()});
if('ResizeObserver' in window){const ro=new ResizeObserver(()=>navUI());ro.observe($('#dock'));ro.observe($('#rail'))}
document.fonts&&document.fonts.ready&&document.fonts.ready.then(()=>navUI());
let lastDay=today();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&today()!==lastDay){const was=ui.day===lastDay;lastDay=today();if(was)ui.day=lastDay;setDateChip();render(false)}});
gcFiles();
if(meta.recovered)setTimeout(()=>toast('Se recuperó la copia automática de tus datos'),600);
if(meta.noStorage)setTimeout(()=>toast('Este navegador no permite guardar datos. Descarga respaldos desde Ajustes.'),900);
})();
