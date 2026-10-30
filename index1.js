(function(){
'use strict';
/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const today=()=>ymd(new Date());
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)};
const addMonths=(s,n)=>{const d=parse(s);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return ymd(d)};
const diffDays=(a,b)=>Math.round((parse(a)-parse(b))/864e5);
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DIASL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const fdate=s=>{if(!s)return '—';const d=parse(s);return d.getDate()+' '+MES[d.getMonth()]+' '+d.getFullYear()};
const fshort=s=>{const d=parse(s);return d.getDate()+' '+MES[d.getMonth()]};
let HIDE=false;
const cop=n=>HIDE?'$ ••••••':(n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('es-CO');
const kfmt=n=>{if(HIDE)return '•••';const a=Math.abs(n);if(a>=1e6)return (n/1e6).toFixed(a>=1e7?0:1).replace('.',',')+' M';if(a>=1e3)return Math.round(n/1e3)+' k';return String(Math.round(n))};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const initials=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
const hashColor=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]};
const monthKey=s=>s.slice(0,7);
const mlabel=k=>{const p=k.split('-');return MES[+p[1]-1]};
const mlong=k=>{const p=k.split('-');return MESL[+p[1]-1]+' '+p[0]};

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
card:'<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18"/>'
};
const ico=(n,cls)=>'<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>';

/* ---------- datos ---------- */
const S={clients:[],transactions:[],tasks:[],settings:{goal:8000000,hideDemo:false},loaded:new Set(),timedOut:false};
const COLL=['clients','transactions','tasks'];
let db=null, cloud=false;
const LS='euko-dashboard-v1';

function lsLoad(){try{const r=JSON.parse(localStorage.getItem(LS)||'null');if(r){COLL.forEach(c=>S[c]=r[c]||[]);S.settings=Object.assign(S.settings,r.settings||{})}}catch(e){}}
function lsSave(){try{localStorage.setItem(LS,JSON.stringify({clients:S.clients,transactions:S.transactions,tasks:S.tasks,settings:S.settings}))}catch(e){}}

async function put(c,obj){
  if(cloud){const o=Object.assign({},obj);const id=o.id;delete o.id;await db.collection(c).doc(id).set(o)}
  else{const i=S[c].findIndex(x=>x.id===obj.id);if(i>=0)S[c][i]=obj;else S[c].push(obj);lsSave();scheduleRender()}
}
async function del(c,id){
  if(cloud){await db.collection(c).doc(id).delete()}
  else{S[c]=S[c].filter(x=>x.id!==id);lsSave();scheduleRender()}
}
async function saveSettings(patch){
  S.settings=Object.assign({},S.settings,patch);
  if(cloud){await db.doc('meta/settings').set(S.settings)}else{lsSave();scheduleRender()}
}
function safe(p){return Promise.resolve(p).catch(e=>{toast('No se pudo guardar. Revisa tu permiso de edición e inténtalo de nuevo.');console.error(e)})}

async function initStore(){
  let c=null;
  try{c=window.claude&&window.claude.use?await window.claude.use('db'):null}catch(e){c=null}
  if(!c){lsLoad();S.loaded=new Set(['clients','transactions','tasks','settings']);render(true);return}
  db=c;cloud=true;
  const mark=k=>{S.loaded.add(k)};
  const onErr=k=>e=>{console.error(k,e);mark(k);scheduleRender()};
  COLL.forEach(k=>db.collection(k).onSnapshot(snap=>{S[k]=snap.docs.map(d=>Object.assign({id:d.id},d.data()));mark(k);scheduleRender()},onErr(k)));
  db.doc('meta/settings').onSnapshot(d=>{if(d.exists)S.settings=Object.assign({goal:8000000,hideDemo:false},d.data());mark('settings');scheduleRender()},onErr('settings'));
}
const isReady=()=>S.loaded.size>=4||S.timedOut;

/* datos de ejemplo (no se guardan) */
let _demo=null;
function buildDemo(){
  if(_demo&&_demo.t===today())return _demo.d;
  const t=today();let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const names=['Camila Restrepo','Andrés Villamil','Laura Gómez','Julián Ortega','Valentina Cruz','Sebastián Mejía','Daniela Pardo','Mateo Arango','Sofía Linares','Felipe Cano','Isabela Duarte','Santiago Rueda','Natalia Barrios','Daniel Zapata'];
  const plans=[['Básico',120000],['Pro',250000],['VIP',480000]];
  const pi=[1,0,2,1,0,1,2,0,1,1,0,2,1,0], ago=[7,7,6,6,5,5,4,4,3,3,2,2,1,0], nxt=[3,-2,12,18,5,-5,9,22,1,-1,14,7,25,28];
  const clients=names.map((n,i)=>{
    const st=i===5||i===9?'Pendiente':i===12?'Inactivo':'Activo';
    return {id:'d-c'+i,demo:true,name:n,phone:'3'+(10+i%5)+' '+(200+i*13)+' '+(1000+i*37),email:n.toLowerCase().normalize('NFD').replace(/[^a-z ]/g,'').replace(/ /g,'.')+'@correo.com',
      plan:plans[pi[i]][0],fee:plans[pi[i]][1],status:st,joined:addDays(addMonths(t,-ago[i]),-((i*2)%10)),nextPay:st==='Inactivo'?'':addDays(t,nxt[i]),notes:''};
  });
  const tx=[];
  clients.forEach((c,i)=>{
    for(let k=0;k<=ago[i];k++){
      const d=addMonths(c.joined,k);if(d>t)break;
      if(c.status==='Inactivo'&&k>Math.max(0,ago[i]-2))break;
      const last=k===ago[i]||addMonths(c.joined,k+1)>t;
      tx.push({id:'d-t'+i+'-'+k,demo:true,type:'ingreso',date:d,amount:c.fee,category:'Membresías',concept:'Membresía '+c.plan,clientId:c.id,status:(c.status==='Pendiente'&&last)?'Pendiente':'Completado'});
    }
  });
  [[1,150000,0,'Asesoría puntual'],[2,220000,4,'Revisión de estrategia'],[3,300000,2,'Asesoría puntual'],[4,180000,10,'Análisis personalizado'],[1,260000,7,'Asesoría puntual']].forEach((a,j)=>{
    const d=addDays(t,-(a[0]*26+a[2]));tx.push({id:'d-a'+j,demo:true,type:'ingreso',date:d,amount:a[1],category:'Asesorías',concept:a[3],clientId:clients[(j*3+1)%clients.length].id,status:'Completado'})});
  for(let m=0;m<6;m++){
    const base=new Date();const mk=(day)=>{const d=new Date(base.getFullYear(),base.getMonth()-m,Math.min(day,28));return ymd(d)};
    [[5,'Datos deportivos (API)','Herramientas',190000],[8,'Suscripciones de análisis','Herramientas',95000],[12,'Publicidad en redes','Publicidad',Math.round((180000+rnd()*260000)/1000)*1000],[20,'Contabilidad','Servicios',150000],[25,'Impuestos','Impuestos',110000]].forEach((e,j)=>{
      const d=mk(e[0]);if(d<=t)tx.push({id:'d-e'+m+'-'+j,demo:true,type:'egreso',date:d,amount:e[3],category:e[2],concept:e[1],clientId:'',status:'Completado'})})
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
  const d={clients,transactions:tx,tasks};_demo={t,d};return d;
}
const demoOn=()=>!S.settings.hideDemo&&!S.clients.length&&!S.transactions.length&&!S.tasks.length;
const D=()=>demoOn()?buildDemo():S;
const cname=id=>{const c=D().clients.find(x=>x.id===id);return c?c.name:''};

/* ---------- cálculos ---------- */
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

/* ---------- estado de interfaz ---------- */
const ui={view:'resumen',clientQ:'',clientStatus:'todos',txType:'todos',txQ:'',txMonth:'todos',period:6,day:today(),animate:true};
const VIEWS=[
  {id:'resumen',label:'Resumen',icon:'home'},
  {id:'clientes',label:'Clientes',icon:'users'},
  {id:'movimientos',label:'Movimientos',icon:'swap'},
  {id:'reportes',label:'Reportes',icon:'chart'},
  {id:'agenda',label:'Gestión diaria',icon:'check'}
];

/* ---------- componentes ---------- */
const statusPill=s=>'<span class="pill '+(s==='Activo'||s==='Completado'?'ok':s==='Pendiente'?'warn':'off')+'">'+esc(s)+'</span>';
const count=(v,fmt)=>'<span class="num" data-count="'+Math.round(v)+'" data-fmt="'+(fmt||'cop')+'">'+(fmt==='n'?Math.round(v):cop(v))+'</span>';
const head=(t,sub,acts)=>'<header class="vhead rev" style="--d:0"><div><h1>'+t+'</h1><p>'+sub+'</p></div><div class="acts">'+(acts||'')+'</div></header>';
const demoBanner=()=>demoOn()?'<div class="banner rev" style="--d:1"><span><b>Datos de ejemplo.</b> Así se verá tu panel. Desaparecen cuando registres tu primer cliente, movimiento o tarea.</span><button class="btn sm ghost" data-act="hideDemo">Ocultar ejemplos</button></div>':'';
const niceMax=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const f=v/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p};
const tipAttr=t=>' data-tip="'+esc(t)+'"';

function barChart(ms){
  const W=380,H=210,pl=40,pr=6,pt=10,pb=24;
  const mx=niceMax(Math.max(1,...ms.map(m=>Math.max(m.inc,m.exp))));
  const gw=(W-pl-pr)/ms.length,bw=Math.min(15,gw*.3),y=v=>pt+(H-pt-pb)*(1-v/mx);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingresos y egresos por mes">';
  for(let i=0;i<=4;i++){const v=mx/4*i,yy=y(v);s+='<line class="grid" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'"/><text x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">'+kfmt(v)+'</text>'}
  ms.forEach((m,i)=>{
    const cx=pl+gw*i+gw/2,hi=(H-pt-pb)*m.inc/mx,he=(H-pt-pb)*m.exp/mx;
    s+='<g class="bar-g"'+tipAttr(mlong(m.key)+'\nIngresos '+cop(m.inc)+'\nEgresos '+cop(m.exp))+'>'
      +'<rect x="'+(cx-gw/2)+'" y="'+pt+'" width="'+gw+'" height="'+(H-pt-pb)+'" fill="transparent"/>'
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
  const X=i=>pl+step*i,Y=v=>pt+(H-pt-pb)*(1-v/mx);
  const pi=ms.map((m,i)=>[X(i),Y(m.inc)]),pe=ms.map((m,i)=>[X(i),Y(m.exp)]);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingresos y egresos en el periodo"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c1)" stop-opacity=".35"/><stop offset="1" stop-color="var(--c1)" stop-opacity="0"/></linearGradient></defs>';
  for(let i=0;i<=4;i++){const v=mx/4*i,yy=Y(v);s+='<line class="grid" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'"/><text x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">'+kfmt(v)+'</text>'}
  const di=smooth(pi);
  s+='<path class="areafade" d="'+di+' L'+X(n-1)+' '+(H-pb)+' L'+X(0)+' '+(H-pb)+'Z" fill="url(#ga)"/>';
  s+='<path class="draw" pathLength="1" d="'+smooth(pe)+'" fill="none" stroke="var(--c5)" stroke-width="2.5" stroke-linecap="round"/>';
  s+='<path class="draw" pathLength="1" d="'+di+'" fill="none" stroke="var(--c1)" stroke-width="3" stroke-linecap="round"/>';
  const every=n>8?2:1;
  ms.forEach((m,i)=>{
    if(i%every===0||i===n-1)s+='<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="middle">'+mlabel(m.key)+'</text>';
    s+='<g class="bar-g"'+tipAttr(mlong(m.key)+'\nIngresos '+cop(m.inc)+'\nEgresos '+cop(m.exp)+'\nUtilidad '+cop(m.inc-m.exp))+'><rect x="'+(X(i)-Math.max(step,30)/2)+'" y="'+pt+'" width="'+Math.max(step,30)+'" height="'+(H-pt-pb)+'" fill="transparent"/></g>';
  });
  const L=n-1;
  s+='<circle cx="'+pi[L][0]+'" cy="'+pi[L][1]+'" r="5" fill="var(--c1)" stroke="var(--bg)" stroke-width="2"/><circle cx="'+pe[L][0]+'" cy="'+pe[L][1]+'" r="4.5" fill="var(--c5)" stroke="var(--bg)" stroke-width="2"/>';
  return s+'</svg>';
}
function donut(items,total){
  const R=54,C=2*Math.PI*R;let off=0,s='<div style="position:relative;width:150px;height:150px"><svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Distribución de egresos"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="var(--field)" stroke-width="16"/>';
  items.forEach((it,i)=>{const len=Math.max(total?it.v/total*C-3:0,0);
    s+='<circle class="seg" style="--i:'+i+'" cx="70" cy="70" r="'+R+'" fill="none" stroke="'+COLORS[i%6]+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 70 70)" data-tip="'+esc(it.k+'\n'+cop(it.v)+' · '+Math.round(it.v/total*100)+'%')+'"/>';
    off+=total?it.v/total*C:0});
  return s+'</svg><div class="dtxt"><div><b class="num">'+kfmt(total)+'</b><small>total</small></div></div></div>';
}
const groupBy=(arr,f)=>{const m={};arr.forEach(x=>{const k=f(x)||'Sin categoría';m[k]=(m[k]||0)+x.amount});return Object.keys(m).map(k=>({k,v:m[k]})).sort((a,b)=>b.v-a.v)};

function txRow(x,withAct){
  const inn=x.type==='ingreso';
  return '<div class="tr tx"><div class="who"><div class="tico '+(inn?'in':'out')+'">'+ico(inn?'in':'out')+'</div><div style="min-width:0"><b>'+esc(x.concept||x.category)+'</b><small>'+esc(cname(x.clientId)||'Sin cliente')+'</small></div></div>'
   +'<div class="cell c-cat mut">'+esc(x.category)+'</div><div class="cell amt '+(inn?'in':'')+'">'+(inn?'+':'-')+cop(x.amount)+'</div><div class="cell c-st">'+statusPill(x.status)+'</div><div class="cell c-date mut">'+fdate(x.date)+'</div>'
   +(withAct?'<div class="c-act"><button class="iconbtn" style="width:32px;height:32px" data-act="editTx" data-id="'+x.id+'" aria-label="Editar movimiento">'+ico('edit')+'</button></div>':'')+'</div>';
}

/* ---------- vistas ---------- */
const V={};
V.resumen=function(){
  const d=D(),keys=monthKeys(6),ms=totals(keys),cur=ms[5],prev=ms[4];
  const active=d.clients.filter(c=>c.status==='Activo'),pend=pending(),pendSum=pend.reduce((a,b)=>a+b.amount,0);
  const util=cur.inc-cur.exp,putil=prev.inc-prev.exp;
  const prevActive=d.clients.filter(c=>c.status!=='Inactivo'&&c.joined<=addMonths(today(),-1)).length;
  const plans=groupBy(active.map(c=>({k:c.plan||'Sin plan',amount:1})),x=>x.k).slice(0,3);
  const meta=S.settings.goal||0,pct=meta?Math.min(100,Math.round(cur.inc/meta*100)):0;
  const due=d.clients.map(c=>({c,i:dueInfo(c)})).filter(x=>x.i&&x.i.d<=10).sort((a,b)=>a.i.d-b.i.d).slice(0,4);
  const recent=d.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,6);
  const hr=new Date().getHours(),sal=hr<12?'Buenos días':hr<19?'Buenas tardes':'Buenas noches';
  return head(sal+', EUKO','Resumen de '+mlong(keys[5])+'. Tu operación, al día.','<button class="btn ghost" data-act="addTx" data-type="egreso">'+ico('out')+'Egreso</button><button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Ingreso</button>')
  +demoBanner()
  +'<div class="grid">'
  +'<article class="card glass s4 rev" style="--d:1"><div class="lbl up">Utilidad del mes</div><div class="big">'+count(util)+'</div><div class="flex">'+delta(util,putil)+'<span class="sub">vs. mes anterior</span></div>'
    +'<div class="minis">'+(plans.length?plans.map(p=>'<div class="mini"><b class="num">'+p.v+'</b><span>'+esc(p.k)+'</span></div>').join(''):'<div class="mini" style="grid-column:1/-1"><span>Sin clientes activos todavía</span></div>')+'</div>'
    +'<div class="btnrow"><button class="btn dark" data-act="addClient">'+ico('users')+'Nuevo cliente</button><button class="btn ghost" data-act="nav" data-v="reportes">'+ico('chart')+'Reportes</button></div></article>'
  +'<div class="kpis">'
    +'<article class="kpi glass hero rev" style="--d:2"><div class="top2"><span class="lbl">Clientes activos</span><span class="ico">'+ico('users')+'</span></div><div class="mid">'+count(active.length,'n')+'</div><div class="flex">'+delta(d.clients.filter(c=>c.status!=='Inactivo').length,prevActive)+'</div></article>'
    +'<article class="kpi glass rev" style="--d:3"><div class="top2"><span class="lbl">Ingresos</span><span class="ico">'+ico('in')+'</span></div><div class="mid">'+count(cur.inc)+'</div>'+delta(cur.inc,prev.inc)+'</article>'
    +'<article class="kpi glass rev" style="--d:4"><div class="top2"><span class="lbl">Egresos</span><span class="ico">'+ico('out')+'</span></div><div class="mid">'+count(cur.exp)+'</div>'+delta(cur.exp,prev.exp,true)+'</article>'
    +'<article class="kpi glass rev" style="--d:5"><div class="top2"><span class="lbl">Por cobrar</span><span class="ico">'+ico('clock')+'</span></div><div class="mid">'+count(pendSum)+'</div><span class="sub">'+pend.length+(pend.length===1?' pago pendiente':' pagos pendientes')+'</span></article>'
  +'</div>'
  +'<article class="card glass s4 rev" style="--d:3"><div class="flex sb wrap"><h2 class="ct">Ingresos vs egresos</h2><div class="legend"><span><i style="background:var(--c1)"></i>Ingresos</span><span><i style="background:var(--c5)"></i>Egresos</span></div></div><p class="sub" style="margin:2px 0 8px">Últimos 6 meses</p>'+barChart(ms)+'</article>'
  +'<div class="s4 stack">'
    +'<article class="card glass rev" style="--d:4"><div class="flex sb"><div class="lbl">'+ico('target')+'Meta de ingresos del mes</div><button class="btn sm ghost" data-act="editGoal">Editar</button></div><div class="bar"><i style="--w:'+pct+'%"></i></div><div class="flex sb"><b class="num">'+cop(cur.inc)+'</b><span class="sub num">de '+cop(meta)+' · '+pct+'%</span></div></article>'
    +'<article class="card glass rev" style="--d:5"><div class="lbl up" style="margin-bottom:6px">Próximos cobros</div>'
      +(due.length?'<div class="ul">'+due.map(x=>'<div class="li"><div class="av" style="--c:'+hashColor(x.c.name)+'">'+initials(x.c.name)+'</div><div class="grow"><b>'+esc(x.c.name)+'</b><small>'+cop(x.c.fee)+' · '+esc(x.c.plan)+'</small></div><span class="pill '+x.i.cls+'">'+x.i.txt+'</span></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Todo al día</b>No hay cobros en los próximos 10 días.</div>')
    +'</article></div>'
  +'<article class="card glass s8 rev" style="--d:6"><div class="flex sb" style="margin-bottom:8px"><h2 class="ct">Actividad reciente</h2><button class="btn sm ghost" data-act="nav" data-v="movimientos">Ver todo</button></div>'
    +'<div class="tbl"><div class="tr th rc"><div>Concepto</div><div class="c-cat">Categoría</div><div>Monto</div><div class="c-st">Estado</div><div class="c-date">Fecha</div></div>'
    +(recent.length?recent.map(x=>txRow(x,false).replace('tr tx','tr rc')).join(''):'<div class="empty"><b>Aún no hay movimientos</b>Registra tu primer ingreso o egreso para verlo aquí.</div>')+'</div></article>'
  +'</div>';
};

V.clientes=function(){
  const d=D(),q=ui.clientQ.trim().toLowerCase();
  let list=d.clients.filter(c=>(ui.clientStatus==='todos'||c.status===ui.clientStatus)&&(!q||(c.name+' '+(c.phone||'')+' '+(c.email||'')+' '+(c.plan||'')).toLowerCase().includes(q)));
  list=list.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const act=d.clients.filter(c=>c.status==='Activo'),mrr=act.reduce((a,b)=>a+(+b.fee||0),0);
  const cnt=s=>d.clients.filter(c=>c.status===s).length;
  return head('Clientes',d.clients.length+(d.clients.length===1?' cliente registrado':' clientes registrados')+' · cuotas recurrentes de '+cop(mrr)+' al mes','<button class="btn pri" data-act="addClient">'+ico('plus')+'Nuevo cliente</button>')
  +demoBanner()
  +'<div class="grid" style="margin-bottom:14px">'
    +[['Total',d.clients.length,'users'],['Activos',cnt('Activo'),'check'],['Pendientes',cnt('Pendiente'),'clock'],['Ingreso recurrente',mrr,'wallet']].map((k,i)=>'<article class="card glass s3 rev" style="--d:'+(i+1)+';padding:16px"><div class="flex sb"><span class="lbl">'+k[0]+'</span><span class="ico" style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid">'+count(k[1],i===3?'cop':'n')+'</div></article>').join('')
  +'</div>'
  +'<article class="card glass rev" style="--d:5"><div class="tools"><label class="field" aria-label="Buscar cliente">'+ico('search')+'<input id="clientQ" data-bind="clientQ" value="'+esc(ui.clientQ)+'" placeholder="Buscar por nombre, teléfono o plan" autocomplete="off"></label>'
    +'<div class="chips">'+['todos','Activo','Pendiente','Inactivo'].map(s=>'<button class="chip'+(ui.clientStatus===s?' on':'')+'" data-act="set" data-k="clientStatus" data-v="'+s+'">'+(s==='todos'?'Todos':s)+'</button>').join('')+'</div></div>'
    +'<div class="tbl"><div class="tr th cl"><div>Cliente</div><div class="c-plan">Plan</div><div class="c-fee">Cuota</div><div>Estado</div><div class="c-next">Próximo pago</div><div class="c-act"></div></div>'
    +(list.length?list.map(c=>{const i=dueInfo(c);return '<div class="tr cl" data-act="openClient" data-id="'+c.id+'" tabindex="0"><div class="who"><div class="av" style="--c:'+hashColor(c.name)+'">'+initials(c.name)+'</div><div style="min-width:0"><b>'+esc(c.name)+'</b><small>'+esc(c.phone||c.email||'Sin contacto')+'</small></div></div>'
      +'<div class="cell c-plan"><span class="tag">'+esc(c.plan||'—')+'</span></div><div class="cell c-fee amt">'+cop(c.fee||0)+'</div><div>'+statusPill(c.status)+'</div>'
      +'<div class="cell c-next">'+(i?'<span class="pill '+i.cls+'">'+i.txt+'</span>':'<span class="mut">—</span>')+'</div><div class="c-act mut">'+ico('chevR')+'</div></div>'}).join(''):'<div class="empty"><b>'+(d.clients.length?'Sin resultados':'Aún no tienes clientes')+'</b>'+(d.clients.length?'Prueba con otro nombre o cambia el filtro.':'Agrega tu primer cliente para empezar a llevar su historial.')+'</div>')
    +'</div></article>';
};

V.movimientos=function(){
  const d=D(),q=ui.txQ.trim().toLowerCase();
  const months=[...new Set(d.transactions.map(x=>monthKey(x.date)))].sort().reverse();
  let list=d.transactions.filter(x=>(ui.txType==='todos'||x.type===ui.txType)&&(ui.txMonth==='todos'||monthKey(x.date)===ui.txMonth)&&(!q||(x.concept+' '+x.category+' '+cname(x.clientId)).toLowerCase().includes(q)));
  list=list.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  const inc=list.filter(x=>x.type==='ingreso'&&x.status!=='Pendiente').reduce((a,b)=>a+b.amount,0),exp=list.filter(x=>x.type==='egreso'&&x.status!=='Pendiente').reduce((a,b)=>a+b.amount,0);
  return head('Movimientos','Ingresos y egresos registrados, con filtros por tipo y mes','<button class="btn ghost" data-act="addTx" data-type="egreso">'+ico('out')+'Egreso</button><button class="btn pri" data-act="addTx" data-type="ingreso">'+ico('plus')+'Ingreso</button>')
  +demoBanner()
  +'<div class="grid" style="margin-bottom:14px">'
   +[['Ingresos',inc,'in'],['Egresos',exp,'out'],['Balance',inc-exp,'wallet']].map((k,i)=>'<article class="card glass s4 rev" style="--d:'+(i+1)+';padding:16px"><div class="flex sb"><span class="lbl">'+k[0]+(ui.txMonth==='todos'?'':' · '+mlong(ui.txMonth))+'</span><span style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid">'+count(k[1])+'</div></article>').join('')
  +'</div>'
  +'<article class="card glass rev" style="--d:4"><div class="tools"><label class="field" aria-label="Buscar movimiento">'+ico('search')+'<input id="txQ" data-bind="txQ" value="'+esc(ui.txQ)+'" placeholder="Buscar concepto, categoría o cliente" autocomplete="off"></label>'
    +'<div class="chips">'+[['todos','Todos'],['ingreso','Ingresos'],['egreso','Egresos']].map(s=>'<button class="chip'+(ui.txType===s[0]?' on':'')+'" data-act="set" data-k="txType" data-v="'+s[0]+'">'+s[1]+'</button>').join('')+'</div>'
    +'<select class="sel" id="txMonth" data-bind="txMonth" aria-label="Filtrar por mes"><option value="todos">Todos los meses</option>'+months.map(m=>'<option value="'+m+'"'+(ui.txMonth===m?' selected':'')+'>'+mlong(m)+'</option>').join('')+'</select></div>'
    +'<div class="tbl"><div class="tr th tx"><div>Concepto</div><div class="c-cat">Categoría</div><div>Monto</div><div class="c-st">Estado</div><div class="c-date">Fecha</div><div class="c-act"></div></div>'
    +(list.length?list.map(x=>txRow(x,true)).join(''):'<div class="empty"><b>'+(d.transactions.length?'Sin resultados':'Aún no hay movimientos')+'</b>'+(d.transactions.length?'Cambia los filtros para ver más.':'Registra tu primer ingreso o egreso con los botones de arriba.')+'</div>')+'</div></article>';
};

V.reportes=function(){
  const d=D(),n=ui.period,keys=monthKeys(n),ms=totals(keys);
  const inc=ms.reduce((a,b)=>a+b.inc,0),exp=ms.reduce((a,b)=>a+b.exp,0),ut=inc-exp,mg=inc?Math.round(ut/inc*100):0;
  const inRange=x=>keys.includes(monthKey(x.date))&&x.status!=='Pendiente';
  const cats=groupBy(d.transactions.filter(x=>x.type==='egreso'&&inRange(x)),x=>x.category).slice(0,6);
  const catTotal=cats.reduce((a,b)=>a+b.v,0);
  const byPlan=groupBy(d.transactions.filter(x=>x.type==='ingreso'&&inRange(x)),x=>{const c=d.clients.find(c=>c.id===x.clientId);return c?c.plan:x.category}).slice(0,5);
  const pmax=Math.max(1,...byPlan.map(p=>p.v));
  const top=groupBy(d.transactions.filter(x=>x.type==='ingreso'&&x.clientId&&inRange(x)),x=>cname(x.clientId)).slice(0,5);
  const tmax=Math.max(1,...top.map(p=>p.v));
  return head('Reportes','Estado de resultados de los últimos '+n+' meses','<div class="chips">'+[3,6,12].map(p=>'<button class="chip'+(ui.period===p?' on':'')+'" data-act="setNum" data-k="period" data-v="'+p+'">'+p+' meses</button>').join('')+'</div><button class="btn pri" data-act="export">'+ico('download')+'Exportar CSV</button>')
  +demoBanner()
  +'<div class="grid">'
   +[['Ingresos',inc,'in',null],['Egresos',exp,'out',null],['Utilidad',ut,'trend',null],['Margen',mg,'target','pct']].map((k,i)=>'<article class="card glass s3 rev" style="--d:'+(i+1)+';padding:16px"><div class="flex sb"><span class="lbl">'+k[0]+'</span><span style="color:var(--fg2)">'+ico(k[2])+'</span></div><div class="mid">'+(k[3]?'<span class="num">'+k[1]+'%</span>':count(k[1]))+'</div></article>').join('')
   +'<article class="card glass s8 rev" style="--d:5"><div class="flex sb wrap"><div><h2 class="ct">Ingresos vs egresos</h2><p class="sub">Pasa el cursor sobre un mes para ver el detalle</p></div><div class="legend"><span><i style="background:var(--c1)"></i>Ingresos</span><span><i style="background:var(--c5)"></i>Egresos</span></div></div><div style="margin-top:10px">'+lineChart(ms)+'</div></article>'
   +'<article class="card glass s4 rev" style="--d:6"><h2 class="ct">Egresos por categoría</h2><div class="donutwrap" style="margin-top:14px;grid-template-columns:1fr;justify-items:center;gap:16px">'
     +(cats.length?donut(cats,catTotal)+'<div class="lg">'+cats.map((c,i)=>'<div><i style="background:'+COLORS[i%6]+'"></i><span>'+esc(c.k)+'</span><b class="num">'+Math.round(c.v/catTotal*100)+'%</b></div>').join('')+'</div>':'<div class="empty"><b>Sin egresos</b>No hay egresos en este periodo.</div>')+'</div></article>'
   +'<article class="card glass s6 rev" style="--d:7"><h2 class="ct">Ingresos por plan</h2><div style="margin-top:10px">'+(byPlan.length?byPlan.map((p,i)=>'<div class="hbar" style="--i:'+i+'"><span>'+esc(p.k)+'</span><div class="t"><i style="--w:'+Math.round(p.v/pmax*100)+'%;--c:'+COLORS[i%6]+'"></i></div><b class="num">'+kfmt(p.v)+'</b></div>').join(''):'<div class="empty"><b>Sin ingresos</b>Registra ingresos para ver este reporte.</div>')+'</div></article>'
   +'<article class="card glass s6 rev" style="--d:8"><h2 class="ct">Clientes que más aportan</h2><div style="margin-top:10px">'+(top.length?top.map((p,i)=>'<div class="hbar" style="--i:'+i+'"><span>'+esc(p.k)+'</span><div class="t"><i style="--w:'+Math.round(p.v/tmax*100)+'%;--c:'+COLORS[(i+1)%6]+'"></i></div><b class="num">'+kfmt(p.v)+'</b></div>').join(''):'<div class="empty"><b>Sin datos</b>Asocia tus ingresos a un cliente para ver su aporte.</div>')+'</div></article>'
   +'<article class="card glass s12 rev" style="--d:9"><h2 class="ct" style="margin-bottom:8px">Estado de resultados mensual</h2><div style="overflow-x:auto"><table style="width:100%;min-width:480px;border-collapse:collapse"><thead><tr style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--fg3)"><th style="text-align:left;padding:8px 10px">Mes</th><th style="padding:8px 10px">Ingresos</th><th style="padding:8px 10px">Egresos</th><th style="padding:8px 10px">Utilidad</th><th style="padding:8px 10px">Margen</th></tr></thead><tbody>'
     +ms.slice().reverse().map(m=>{const u=m.inc-m.exp;return '<tr style="text-align:right;border-top:1px solid var(--line)"><td style="text-align:left;padding:11px 10px;font-weight:700;text-transform:capitalize">'+mlong(m.key)+'</td><td class="num" style="padding:11px 10px">'+cop(m.inc)+'</td><td class="num" style="padding:11px 10px">'+cop(m.exp)+'</td><td class="num" style="padding:11px 10px;font-weight:700;color:'+(u>=0?'var(--good)':'var(--bad)')+'">'+cop(u)+'</td><td class="num mut" style="padding:11px 10px">'+(m.inc?Math.round(u/m.inc*100)+'%':'—')+'</td></tr>'}).join('')
   +'</tbody></table></div></article></div>';
};

V.agenda=function(){
  const d=D(),t=today(),day=ui.day;
  const dd=parse(day),dow=(dd.getDay()+6)%7,mon=addDays(day,-dow);
  const tasks=d.tasks.filter(x=>x.date===day).sort((a,b)=>(a.done-b.done)||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  const dn=tasks.filter(x=>x.done).length,pct=tasks.length?Math.round(dn/tasks.length*100):0;
  const over=d.tasks.filter(x=>x.date<t&&!x.done).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const txs=d.transactions.filter(x=>x.date===day);
  const week=[...Array(7)].map((_,i)=>{const s=addDays(mon,i);return {s,n:d.tasks.filter(x=>x.date===s).length}});
  const label=day===t?'Hoy':day===addDays(t,1)?'Mañana':day===addDays(t,-1)?'Ayer':DIASL[dd.getDay()];
  const R=40,C=2*Math.PI*R;
  return head('Gestión diaria',label+', '+dd.getDate()+' de '+MESL[dd.getMonth()]+' · '+dn+' de '+tasks.length+' tareas completadas','<button class="btn ghost" data-act="setDay" data-v="'+t+'">Ir a hoy</button>')
  +demoBanner()
  +'<div class="week rev" style="--d:1"><button class="iconbtn" data-act="setDay" data-v="'+addDays(day,-7)+'" aria-label="Semana anterior">'+ico('chevL')+'</button>'
    +week.map((w,i)=>'<button class="dayb'+(w.s===day?' on':'')+(w.s===t?' now':'')+'" data-act="setDay" data-v="'+w.s+'"'+tipAttr(w.n+(w.n===1?' tarea':' tareas'))+'><span>'+DIAS[i]+'</span><b class="num">'+parse(w.s).getDate()+'</b></button>').join('')
    +'<button class="iconbtn" data-act="setDay" data-v="'+addDays(day,7)+'" aria-label="Semana siguiente">'+ico('chevR')+'</button></div>'
  +'<div class="grid">'
   +'<article class="card glass s8 rev" style="--d:2"><div class="flex sb" style="margin-bottom:8px;gap:16px"><div><h2 class="ct">Tareas de '+label.toLowerCase()+'</h2><p class="sub">Seguimientos, llamadas, cobros y entregas del día</p></div>'
     +'<div class="ring"><svg viewBox="0 0 100 100" width="96" height="96"><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="var(--field)" stroke-width="10"/><circle class="seg" style="--i:0" cx="50" cy="50" r="'+R+'" fill="none" stroke="var(--mint)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(C*pct/100)+' '+C+'" transform="rotate(-90 50 50)"/></svg><b class="num">'+pct+'%</b></div></div>'
     +(tasks.length?tasks.map(x=>'<div class="task'+(x.done?' done':'')+'"><button class="chk" data-act="toggleTask" data-id="'+x.id+'" aria-label="'+(x.done?'Marcar como pendiente':'Marcar como hecha')+'">'+ico('tick')+'</button><div class="tt2"><span>'+esc(x.text)+'</span>'+(x.clientId&&cname(x.clientId)?'<small>'+esc(cname(x.clientId))+'</small>':'')+'</div><button class="iconbtn" style="width:32px;height:32px" data-act="delTask" data-id="'+x.id+'" aria-label="Eliminar tarea">'+ico('trash')+'</button></div>').join(''):'<div class="empty"><b>Sin tareas para este día</b>Agrega la primera abajo.</div>')
     +'<form class="addtask" data-form="task"><label class="field" aria-label="Nueva tarea">'+ico('plus')+'<input id="taskText" name="text" placeholder="Nueva tarea, por ejemplo: llamar a un cliente" autocomplete="off" required></label>'
     +'<select class="sel" name="clientId" aria-label="Cliente relacionado"><option value="">Sin cliente</option>'+d.clients.filter(c=>c.status!=='Inactivo').map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')+'</select><button class="btn pri" type="submit">Agregar</button></form></article>'
   +'<div class="s4 stack">'
     +'<article class="card glass rev" style="--d:3"><div class="lbl up" style="margin-bottom:6px">Seguimiento pendiente</div>'+(over.length?'<div class="ul">'+over.map(x=>'<div class="li"><button class="chk" data-act="toggleTask" data-id="'+x.id+'" aria-label="Marcar como hecha">'+ico('tick')+'</button><div class="grow"><b>'+esc(x.text)+'</b><small>'+fdate(x.date)+(cname(x.clientId)?' · '+esc(cname(x.clientId)):'')+'</small></div></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Sin pendientes atrasados</b>Buen trabajo.</div>')+'</article>'
     +'<article class="card glass rev" style="--d:4"><div class="lbl up" style="margin-bottom:6px">Movimientos del día</div>'+(txs.length?'<div class="ul">'+txs.map(x=>'<div class="li"><div class="tico '+(x.type==='ingreso'?'in':'out')+'">'+ico(x.type==='ingreso'?'in':'out')+'</div><div class="grow"><b>'+esc(x.concept||x.category)+'</b><small>'+esc(cname(x.clientId)||x.category)+'</small></div><span class="amt '+(x.type==='ingreso'?'in':'')+'">'+(x.type==='ingreso'?'+':'-')+kfmt(x.amount)+'</span></div>').join('')+'</div>':'<div class="empty" style="padding:18px 0"><b>Sin movimientos</b>No hay ingresos ni egresos este día.</div>')+'</article></div></div>';
};

/* ---------- render ---------- */
let rq=0;
function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render(false)})}
function render(animate){
  const view=$('#view');
  const ae=document.activeElement;const fid=ae&&ae.id&&view.contains(ae)?ae.id:null;const pos=fid&&ae.selectionStart!=null?ae.selectionStart:null;
  const sy=window.scrollY;
  if(!isReady()){view.className='view';view.innerHTML='<div class="vhead"><div><h1>Cargando tu panel</h1><p>Un momento…</p></div></div><div class="grid"><div class="skel s4"></div><div class="skel s4"></div><div class="skel s4"></div></div>';return}
  if(!S._shown){animate=true;S._shown=true}
  view.className='view'+(animate?' enter':'');
  view.innerHTML=V[ui.view]();
  navUI();
  if(animate)runCounts();
  if(fid){const el=document.getElementById(fid);if(el){el.focus();if(pos!=null&&el.setSelectionRange)try{el.setSelectionRange(pos,pos)}catch(e){}}}
  if(!animate)window.scrollTo(0,sy);
}
function runCounts(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('[data-count]').forEach(el=>{
    const to=+el.dataset.count,f=el.dataset.fmt,t0=performance.now(),dur=900;
    const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4),v=to*e;el.textContent=f==='n'?Math.round(v):cop(v);if(p<1)requestAnimationFrame(step);else el.textContent=f==='n'?to:cop(to)};
    requestAnimationFrame(step);
  });
}
function navUI(){
  $('#dock').innerHTML=VIEWS.map(v=>'<button class="dk'+(ui.view===v.id?' on':'')+'" data-act="nav" data-v="'+v.id+'" aria-label="'+v.label+'"'+(ui.view===v.id?' aria-current="page"':'')+'>'+ico(v.icon)+'<span>'+v.label+'</span></button>').join('')
    +'<div style="position:relative"><button class="plus" id="plusbtn" data-act="quick" aria-label="Agregar" aria-expanded="false">'+ico('plus')+'</button><div class="quick glass" id="quick">'
    +'<button data-act="addClient">'+ico('users')+'Nuevo cliente</button><button data-act="addTx" data-type="ingreso">'+ico('in')+'Registrar ingreso</button><button data-act="addTx" data-type="egreso">'+ico('out')+'Registrar egreso</button><button data-act="quickTask">'+ico('check')+'Tarea de hoy</button></div></div>';
  $('#rail').innerHTML='<span class="logo-m" style="--h:26px;margin:6px 0 8px" role="img" aria-label="EUKO"><i class="ld"></i><i class="ll"></i></span>'+VIEWS.map(v=>'<button class="rbtn'+(ui.view===v.id?' on':'')+'" data-act="nav" data-v="'+v.id+'" aria-label="'+v.label+'">'+ico(v.icon)+'<span class="tt">'+v.label+'</span></button>').join('')
    +'<div class="sep"></div><button class="rbtn'+(HIDE?' on2':'')+'" data-act="hide" aria-label="'+(HIDE?'Mostrar valores':'Ocultar valores')+'">'+ico(HIDE?'eyeOff':'eye')+'<span class="tt">'+(HIDE?'Mostrar valores':'Ocultar valores')+'</span></button><button class="rbtn" data-act="export" aria-label="Exportar datos">'+ico('download')+'<span class="tt">Exportar CSV</span></button>';
  const gs=$('#gsearch');if(gs&&document.activeElement!==gs)gs.value=ui.view==='clientes'?ui.clientQ:gs.value;
}
function navigate(v){
  if(!V[v])v='resumen';
  const go=()=>{ui.view=v;render(true);window.scrollTo({top:0})};
  const el=$('#view');
  if(v===ui.view&&el.innerHTML&&el.dataset.v===v){return}
  closeOverlay();$('#quick')&&$('#quick').classList.remove('open');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!isReady()){go();el.dataset.v=v;return}
  el.classList.add('leaving');setTimeout(()=>{go();el.dataset.v=v},180);
}

/* ---------- overlay y formularios ---------- */
const ov=$('#overlay');
function openOverlay(html,drawer){ov.className='open'+(drawer?' drawer':'');ov.innerHTML='<div class="modal glass" role="document">'+html+'</div>';const f=ov.querySelector('input:not([type=hidden]),select,textarea');if(f)setTimeout(()=>f.focus({preventScroll:true}),60)}
function closeOverlay(){ov.className='';ov.innerHTML=''}
const dl=(id,items)=>'<datalist id="'+id+'">'+items.map(i=>'<option value="'+esc(i)+'">').join('')+'</datalist>';
const numOnly=v=>+String(v||'').replace(/[^\d]/g,'')||0;

function clientForm(c){
  const d=D(),isNew=!c;c=c||{};
  const plans=[...new Set(['Básico','Pro','VIP'].concat(d.clients.map(x=>x.plan).filter(Boolean)))];
  const hist=c.id?d.transactions.filter(x=>x.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8):[];
  return '<div class="mh"><h2>'+(isNew?'Nuevo cliente':esc(c.name))+'</h2><button class="iconbtn" data-act="close" aria-label="Cerrar">'+ico('x')+'</button></div>'
  +'<form data-form="client" data-id="'+(c.id||'')+'"><div class="fg">'
  +'<label class="fl full">Nombre completo<input name="name" required value="'+esc(c.name)+'" placeholder="Nombre y apellido"></label>'
  +'<label class="fl">Teléfono<input name="phone" inputmode="tel" value="'+esc(c.phone)+'" placeholder="300 000 0000"></label>'
  +'<label class="fl">Correo<input name="email" type="email" value="'+esc(c.email)+'" placeholder="cliente@correo.com"></label>'
  +'<label class="fl">Plan<input name="plan" list="planl" value="'+esc(c.plan||'')+'" placeholder="Básico, Pro, VIP…"></label>'+dl('planl',plans)
  +'<label class="fl">Cuota mensual (COP)<input name="fee" inputmode="numeric" value="'+(c.fee||'')+'" placeholder="250000"></label>'
  +'<label class="fl">Estado<select name="status">'+['Activo','Pendiente','Inactivo'].map(s=>'<option'+((c.status||'Activo')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'
  +'<label class="fl">Fecha de ingreso<input name="joined" type="date" value="'+(c.joined||today())+'"></label>'
  +'<label class="fl full">Próximo pago<input name="nextPay" type="date" value="'+(c.nextPay||'')+'"></label>'
  +'<label class="fl full">Notas<textarea name="notes" placeholder="Preferencias, acuerdos, observaciones…">'+esc(c.notes)+'</textarea></label></div>'
  +'<div class="mf">'+(isNew?'<span></span>':'<button type="button" class="btn ghost danger" data-act="delClient" data-id="'+c.id+'">'+ico('trash')+'Eliminar</button>')
  +'<div class="flex">'+(isNew?'':'<button type="button" class="btn dark" data-act="payClient" data-id="'+c.id+'">'+ico('card')+'Registrar pago</button>')+'<button class="btn pri" type="submit">Guardar</button></div></div></form>'
  +(hist.length?'<div class="hist"><h3>Historial de pagos</h3><div class="ul">'+hist.map(x=>'<div class="li"><div class="tico in">'+ico('in')+'</div><div class="grow"><b>'+esc(x.concept||x.category)+'</b><small>'+fdate(x.date)+'</small></div><span class="amt in">'+cop(x.amount)+'</span>'+statusPill(x.status)+'</div>').join('')+'</div></div>':'');
}
function txForm(x,type){
  const d=D(),isNew=!x.id;type=x.type||type||'ingreso';
  const cats=[...new Set(['Membresías','Asesorías','Herramientas','Publicidad','Servicios','Impuestos','Otros'].concat(d.transactions.map(t=>t.category).filter(Boolean)))];
  return '<div class="mh"><h2>'+(isNew?'Nuevo movimiento':'Editar movimiento')+'</h2><button class="iconbtn" data-act="close" aria-label="Cerrar">'+ico('x')+'</button></div>'
  +'<form data-form="tx" data-id="'+(x.id||'')+'"><input type="hidden" name="type" value="'+type+'"><div class="fg">'
  +'<div class="full seg2" role="group" aria-label="Tipo"><button type="button" class="'+(type==='ingreso'?'on in':'')+'" data-act="txType" data-v="ingreso">Ingreso</button><button type="button" class="'+(type==='egreso'?'on out':'')+'" data-act="txType" data-v="egreso">Egreso</button></div>'
  +'<label class="fl">Monto (COP)<input name="amount" required inputmode="numeric" value="'+(x.amount||'')+'" placeholder="250000"></label>'
  +'<label class="fl">Fecha<input name="date" type="date" required value="'+(x.date||today())+'"></label>'
  +'<label class="fl full">Concepto<input name="concept" value="'+esc(x.concept)+'" placeholder="Ej. Membresía de octubre"></label>'
  +'<label class="fl">Categoría<input name="category" list="catl" required value="'+esc(x.category||'')+'" placeholder="Membresías, Publicidad…"></label>'+dl('catl',cats)
  +'<label class="fl">Estado<select name="status">'+['Completado','Pendiente'].map(s=>'<option'+((x.status||'Completado')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'
  +'<label class="fl full">Cliente (opcional)<select name="clientId"><option value="">Sin cliente</option>'+d.clients.map(c=>'<option value="'+c.id+'"'+(x.clientId===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label></div>'
  +'<div class="mf">'+(isNew?'<span></span>':'<button type="button" class="btn ghost danger" data-act="delTx" data-id="'+x.id+'">'+ico('trash')+'Eliminar</button>')+'<button class="btn pri" type="submit">Guardar</button></div></form>';
}
function goalForm(){
  return '<div class="mh"><h2>Meta de ingresos</h2><button class="iconbtn" data-act="close" aria-label="Cerrar">'+ico('x')+'</button></div><form data-form="goal"><label class="fl">Meta mensual (COP)<input name="goal" inputmode="numeric" required value="'+(S.settings.goal||'')+'" placeholder="8000000"></label><div class="mf"><span></span><button class="btn pri" type="submit">Guardar meta</button></div></form>';
}

/* ---------- acciones ---------- */
const guardDemo=()=>{if(demoOn()){toast('Son datos de ejemplo. Registra tu primer dato para empezar con los tuyos.');return true}return false};
const ACT={
  nav:el=>{location.hash=el.dataset.v},
  set:el=>{ui[el.dataset.k]=el.dataset.v;render(false)},
  setNum:el=>{ui[el.dataset.k]=+el.dataset.v;render(true)},
  setDay:el=>{ui.day=el.dataset.v;render(false)},
  theme:()=>toggleTheme(),
  hide:()=>{HIDE=!HIDE;try{localStorage.setItem('euko-hide',HIDE?'1':'0')}catch(e){}applyHide();render(false);toast(HIDE?'Valores ocultos. Los porcentajes siguen visibles':'Valores visibles')},
  close:()=>closeOverlay(),
  quick:()=>{const q=$('#quick'),b=$('#plusbtn');const o=!q.classList.contains('open');q.classList.toggle('open',o);b.classList.toggle('open',o);b.setAttribute('aria-expanded',o)},
  addClient:()=>{closeQuick();openOverlay(clientForm(null),true)},
  openClient:el=>{const c=D().clients.find(x=>x.id===el.dataset.id);if(c){if(c.demo){openOverlay(clientForm(c).replace('data-form="client"','data-form="demo"'),true);return}openOverlay(clientForm(c),true)}},
  addTx:el=>{closeQuick();openOverlay(txForm({},el.dataset.type))},
  editTx:el=>{const x=D().transactions.find(t=>t.id===el.dataset.id);if(x){if(guardDemo())return;openOverlay(txForm(x))}},
  txType:el=>{const f=el.closest('form');f.elements.type.value=el.dataset.v;f.querySelectorAll('.seg2 button').forEach(b=>{const on=b.dataset.v===el.dataset.v;b.className=on?'on '+(b.dataset.v==='ingreso'?'in':'out'):''})},
  editGoal:()=>{if(guardDemo())return;openOverlay(goalForm())},
  hideDemo:()=>{safe(saveSettings({hideDemo:true}))},
  toggleTask:el=>{if(guardDemo())return;const t=S.tasks.find(x=>x.id===el.dataset.id);if(t)safe(put('tasks',Object.assign({},t,{done:!t.done})))},
  delTask:el=>{if(guardDemo())return;safe(del('tasks',el.dataset.id))},
  quickTask:()=>{closeQuick();ui.day=today();if(ui.view!=='agenda'){location.hash='agenda'}else render(false);setTimeout(()=>{const i=$('#taskText');i&&i.focus()},300)},
  delClient:el=>{const id=el.dataset.id;if(id.startsWith('d-'))return toast('Son datos de ejemplo');if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Confirmar eliminación';return}safe(del('clients',id)).then(()=>{closeOverlay();toast('Cliente eliminado')})},
  delTx:el=>{if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Confirmar eliminación';return}safe(del('transactions',el.dataset.id)).then(()=>{closeOverlay();toast('Movimiento eliminado')})},
  payClient:async el=>{
    const c=S.clients.find(x=>x.id===el.dataset.id);if(!c)return toast('Son datos de ejemplo');
    const t=today(),next=addMonths(c.nextPay&&c.nextPay>t?c.nextPay:t,1);
    await safe(put('transactions',{id:uid(),type:'ingreso',date:t,amount:+c.fee||0,category:'Membresías',concept:'Membresía '+(c.plan||''),clientId:c.id,status:'Completado'}));
    await safe(put('clients',Object.assign({},c,{nextPay:next,status:'Activo'})));
    closeOverlay();toast('Pago registrado. Próximo cobro: '+fdate(next));
  },
  export:()=>exportCsv()
};
function closeQuick(){const q=$('#quick');if(q){q.classList.remove('open');$('#plusbtn').classList.remove('open')}}

document.addEventListener('click',e=>{
  if(e.target===ov){closeOverlay();return}
  const el=e.target.closest('[data-act]');
  if(!el){const q=$('#quick');if(q&&q.classList.contains('open')&&!e.target.closest('#quick'))closeQuick();return}
  const f=ACT[el.dataset.act];if(f)f(el);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeOverlay();closeQuick()}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.tr[data-act]')){e.preventDefault();e.target.click()}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset&&t.dataset.bind){ui[t.dataset.bind]=t.value;render(false)}
  if(t.id==='gsearch'){ui.clientQ=t.value;if(ui.view!=='clientes'){ui.clientStatus='todos';location.hash='clientes'}else render(false)}
});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.bind&&t.tagName==='SELECT'){ui[t.dataset.bind]=t.value;render(false)}});
document.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();
  const k=f.dataset.form,v=Object.fromEntries(new FormData(f).entries());
  if(k==='demo'){toast('Son datos de ejemplo. Agrega tu primer cliente para empezar.');return}
  if(k==='client'){
    const old=S.clients.find(c=>c.id===f.dataset.id)||{};
    const o=Object.assign({},old,{id:f.dataset.id||uid(),name:v.name.trim(),phone:v.phone.trim(),email:v.email.trim(),plan:v.plan.trim(),fee:numOnly(v.fee),status:v.status,joined:v.joined||today(),nextPay:v.nextPay||'',notes:v.notes.trim()});
    await safe(put('clients',o));closeOverlay();toast(f.dataset.id?'Cliente actualizado':'Cliente agregado');
  }else if(k==='tx'){
    const old=S.transactions.find(c=>c.id===f.dataset.id)||{};
    const amt=numOnly(v.amount);if(!amt){toast('Escribe un monto mayor a cero');return}
    const o=Object.assign({},old,{id:f.dataset.id||uid(),type:v.type,amount:amt,date:v.date,concept:v.concept.trim(),category:v.category.trim()||'Otros',status:v.status,clientId:v.clientId||''});
    await safe(put('transactions',o));closeOverlay();toast(f.dataset.id?'Movimiento actualizado':(v.type==='ingreso'?'Ingreso registrado':'Egreso registrado'));
  }else if(k==='goal'){
    await safe(saveSettings({goal:numOnly(v.goal)}));closeOverlay();toast('Meta actualizada');
  }else if(k==='task'){
    const txt=v.text.trim();if(!txt)return;
    await safe(put('tasks',{id:uid(),date:ui.day,text:txt,done:false,clientId:v.clientId||'',createdAt:new Date().toISOString()}));
    const i=$('#taskText');if(i){i.value='';i.focus()}
  }
});

/* brillo que sigue el cursor, tooltips */
document.addEventListener('pointermove',e=>{
  const g=e.target.closest&&e.target.closest('.glass');
  if(g){const r=g.getBoundingClientRect();g.style.setProperty('--mx',(e.clientX-r.left)+'px');g.style.setProperty('--my',(e.clientY-r.top)+'px')}
  const t=e.target.closest&&e.target.closest('[data-tip]'),tip=$('#tip');
  if(t){tip.innerHTML=esc(t.dataset.tip).replace(/\n/g,'<br>');tip.classList.add('on');
    const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY-h-12;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y<8)y=e.clientY+18;tip.style.left=x+'px';tip.style.top=y+'px'}
  else tip.classList.remove('on');
});
document.addEventListener('pointerleave',()=>$('#tip').classList.remove('on'));

let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3200)}

/* ocultar valores */
function applyHide(){
  document.documentElement.classList.toggle('hide-money',HIDE);
  const b=$('#hidebtn');if(!b)return;
  b.innerHTML=ico(HIDE?'eyeOff':'eye');b.classList.toggle('on',HIDE);b.setAttribute('aria-pressed',HIDE?'true':'false');
  const l=HIDE?'Mostrar valores':'Ocultar valores';b.setAttribute('aria-label',l);b.title=l;
}
/* tema */
function setTheme(t){
  if(t)document.documentElement.setAttribute('data-theme',t);
  const dark=t?t==='dark':!matchMedia('(prefers-color-scheme: light)').matches;
  $('#themebtn').innerHTML=ico(dark?'sun':'moon');
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  const n=cur==='dark'?'light':'dark';setTheme(n);try{localStorage.setItem('euko-theme',n)}catch(e){}
}

/* exportar */
async function exportCsv(){
  const d=D();const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const rows=[['CLIENTES'],['Nombre','Teléfono','Correo','Plan','Cuota','Estado','Ingreso','Próximo pago','Notas']].concat(d.clients.map(c=>[c.name,c.phone,c.email,c.plan,c.fee,c.status,c.joined,c.nextPay,c.notes]))
   .concat([[],['MOVIMIENTOS'],['Fecha','Tipo','Concepto','Categoría','Cliente','Monto','Estado']]).concat(d.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>[x.date,x.type,x.concept,x.category,cname(x.clientId),x.amount,x.status]));
  const csv='﻿'+rows.map(r=>r.map(q).join(';')).join('\n');
  let dls=null;try{dls=window.claude&&window.claude.use?await window.claude.use('downloads'):null}catch(e){}
  if(!dls){toast('La descarga no está disponible en esta vista');return}
  try{await dls.save({filename:'euko-datos-'+today()+'.csv',data:csv});toast('Archivo listo')}catch(e){if(!e||e.code!=='declined')toast('No se pudo exportar el archivo')}
}

/* arranque */
$('#i-s').innerHTML=IC.search;
$('#dchip').textContent=(()=>{const d=new Date();return DIASL[d.getDay()]+' '+d.getDate()+' '+MES[d.getMonth()]})();
try{const t=localStorage.getItem('euko-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}
setTheme(document.documentElement.getAttribute('data-theme'));
matchMedia('(prefers-color-scheme: light)').addEventListener&&matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>setTheme(document.documentElement.getAttribute('data-theme')));
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
const h=location.hash.slice(1);if(V[h])ui.view=h;
try{HIDE=localStorage.getItem('euko-hide')==='1'}catch(e){}
applyHide();
navUI();render(true);$('#view').dataset.v=ui.view;
setTimeout(()=>{if(!isReady()){S.timedOut=true;render(true)}},4000);
initStore().then(()=>{if(isReady()&&!$('#view').querySelector('.grid'))render(true)});
})();
