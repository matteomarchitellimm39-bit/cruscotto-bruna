/* ================= Bruna27 · Fase 1: menu a 5 sezioni, Home a riquadri, richieste, il mio spazio ================= */
const SEZ=[
 {k:'eco',n:'Economia',i:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  v:[['s-bil','Bilancio 2026','pie'],['v-p27','Previsione 2027','trend'],['s-pre','Costi','down'],['s-ric','Ricavi','up'],['v-voci','Costi e guadagni per voce','eq'],['v-fatt','Fatture','doc'],['s-car','Carità','heart'],['s-ter','PIL generato','pin'],['s-for','Fornitori','list'],['v-prev','Preventivi','doc']]},
 {k:'evt',n:'Eventi',i:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  v:[['s-ev','Calendario','cal'],['v-crea','Crea un evento','plus'],['s-cs','Simulazione impatto','flask'],['v-perc','Percorsi','route']]},
 {k:'com',n:'Commerciale',i:'<path d="M4 7h16v13H4z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  v:[['v-sp26','Sponsor 2026','star'],['v-sp27','Sponsor 2027','star'],['v-altri','Altri sponsor','users'],['v-area','Area commerciale','tag']]},
 {k:'sic',n:'Sicurezza',i:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  v:[['s-map','Mappa e presenze','map'],['v-psic','Percorsi da convalidare','route'],['v-msic','Mappe degli ingegneri','doc']]},
 {k:'adm',n:'Amministrazione',i:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  v:[['v-prot','Protocollo','doc'],['v-aut','Autorizzazioni','check'],['v-req','Richieste di documenti','inbox']]}];
const IC2={pie:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/>',trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',down:'<path d="M12 5v14M5 12l7 7 7-7"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',eq:'<path d="M7 7h10v10H7zM4 12h3M17 12h3"/>',doc:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',heart:'<path d="M12 20s-7.5-4.6-9.2-9.4A5 5 0 0 1 12 6.8a5 5 0 0 1 9.2 3.8C19.5 15.4 12 20 12 20z"/>',pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',plus:'<path d="M12 5v14M5 12h14"/>',flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',route:'<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',check:'<path d="M5 12l5 5 9-10"/>',inbox:'<path d="M4 13l3-8h10l3 8v6H4z"/><path d="M4 13h5l1 3h4l1-3h5"/>',home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'};
const svg=(p,s)=>'<svg viewBox="0 0 24 24" width="'+(s||22)+'" height="'+(s||22)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const VOCE={};SEZ.forEach(s=>s.v.forEach(v=>{VOCE[v[0]]={t:v[1],sec:s.k,ic:v[2]};}));
const SECN={};SEZ.forEach(s=>SECN[s.k]=s);
const PAGEX={'p-home':'Home','p-me':'Il mio spazio','p-req':'Richieste del Presidente','p-cal':'Riunioni','s-adm':'Utenti e permessi','s-fon':'Fondo dei fornitori'};
SEZ.forEach(s=>PAGEX['sec-'+s.k]=s.n);
function pageTitle(id){return (VOCE[id]&&VOCE[id].t)||PAGEX[id]||'Bruna27';}
function eyb(n){const a=NUM2AREA[n];const v=VOCE[a];return v?SECN[v.sec].n:(a==='s-adm'?'Amministratore':'Bruna27');}
const canV=k=>CTX.canSee(k)||(k==='s-fon'&&CTX.canSee('s-car'));
const secVoci=s=>s.v.filter(v=>canV(v[0]));
const mySez=()=>SEZ.filter(s=>secVoci(s).length);
const PEOPLE={};
let NOTI=[],RICH=[],COMP=[],RIUN=[],INVM=[];
const fmtD=d=>d?new Date(d+(String(d).length===10?'T12:00:00':'')).toLocaleDateString('it-IT',{day:'numeric',month:'long'}):'';
const nome=id=>{const p=PEOPLE[id];return p?(p.nome||p.email):'—';};
const iniz=id=>(nome(id)||'?').trim().charAt(0).toUpperCase();
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};

/* --- pagine: sezioni create al volo --- */
const panel=document.querySelector('.panel');
function ensureSec(id){if(!document.getElementById(id)){const s=document.createElement('section');s.id=id;s.setAttribute('role','tabpanel');s.hidden=true;panel.appendChild(s);}return document.getElementById(id);}
['p-home','p-me','p-req','p-cal','v-p27','v-crea'].concat(Object.keys(VOCE)).concat(SEZ.map(s=>'sec-'+s.k)).forEach(ensureSec);
const _car=R['s-car'],_fon=R['s-fon'];
if(_car)R['s-car']=()=>{_car();if(_fon)_fon();};
R['p-home']=renderHome;R['p-me']=renderMe;R['p-req']=renderReq;R['p-cal']=renderCal;R['v-p27']=renderP27;R['v-crea']=()=>{R['s-ev']();};
SEZ.forEach(s=>R['sec-'+s.k]=()=>renderSec(s));

/* --- navigazione --- */
const NAVL=document.getElementById('navlist'),BOT=document.getElementById('botnav');
function navBtn(id,label,ic,cls){return '<button type="button" class="nv '+(cls||'')+'" data-go="'+id+'">'+svg(ic)+'<span>'+esc(label)+'</span></button>';}
function buildNav(){
  NAVL.innerHTML=navBtn('p-home','Home',IC2.home)+mySez().map(s=>navBtn('sec-'+s.k,s.n,s.i)).join('')+'<div style="flex-grow:1;min-height:16px"></div>'+navBtn('p-req','Richieste del Presidente',IC2.inbox,'small')+navBtn('p-cal','Riunioni',IC2.cal,'small')+(CTX.admin?navBtn('s-adm','Utenti e permessi',IC2.key,'small'):'')+navBtn('p-me','Il mio spazio','<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>','me');
  BOT.innerHTML=mySez().map(s=>navBtn('sec-'+s.k,s.n==='Amministrazione'?'Ammin.':s.n,s.i)).join('');
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;e.preventDefault();go(b.dataset.go);});
function secOf(id){if(id.startsWith('sec-'))return id.slice(4);if(VOCE[id])return VOCE[id].sec;if(id==='s-fon')return 'eco';return null;}
function markNav(id){const s=secOf(id);document.querySelectorAll('.nv').forEach(b=>{const g=b.dataset.go;b.setAttribute('aria-current',String(g===id||(s&&g==='sec-'+s)));});}
function go(id){if(!canOpen(id))id='p-home';show(id);window.scrollTo({top:0});
  if(id==='v-crea')setTimeout(()=>{const x=[...document.querySelectorAll('#s-ev h3')].find(e=>/Aggiungi un evento/.test(e.textContent));if(x)x.scrollIntoView({block:'start',behavior:'smooth'});},80);}
function canOpen(id){if(['p-home','p-me','p-req','p-cal'].includes(id))return true;if(id==='s-adm')return CTX.admin;if(id.startsWith('sec-'))return !!mySez().find(s=>'sec-'+s.k===id);return canV(id);}
show=function(id){
  if(!canOpen(id))id='p-home';if(id==='v-crea')id='s-ev';cur=id;applyEd();
  document.querySelectorAll('[role=tabpanel]').forEach(p=>{p.hidden=!(p.id===id||(id==='s-car'&&p.id==='s-fon'));});
  markNav(id);
  if(R[id])R[id]();else renderVoce(id);
  addBack(id);renderTop();refreshBell();
  const ed=document.getElementById('edt');if(ed)ed.hidden=!(CTX.anyEdit&&/^s-/.test(id)&&id!=='s-adm');
};
function addBack(id){const s=secOf(id);if(!s||id.startsWith('sec-'))return;const el=document.getElementById(id);if(!el||el.querySelector(':scope > .back'))return;
  el.insertBefore(h('<button type="button" class="back" data-go="sec-'+s+'">‹ '+esc(SECN[s].n)+'</button>'),el.firstChild);}
rerender=function(){const y=window.scrollY;applyEd();if(R[cur])R[cur]();else renderVoce(cur);addBack(cur);renderTop();window.scrollTo(0,y);};

/* --- pagina di una sezione: le voci come grandi tessere --- */
function renderSec(s){const el=document.getElementById('sec-'+s.k);el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Scegli cosa aprire</span><h2>'+esc(s.n)+'</h2></div>'));
  const g=h('<div class="tilegrid"></div>');
  secVoci(s).forEach(([k,t,ic],i)=>{const sub=tileInfo(k);g.appendChild(h('<button type="button" class="vtile'+(i===0?' first':'')+'" data-go="'+k+'"><span class="vic">'+svg(IC2[ic]||IC2.doc)+'</span><span class="vt">'+esc(t)+'</span>'+(sub?'<span class="vs">'+sub+'</span>':'')+'</button>'));});
  el.appendChild(g);}
function tileInfo(k){try{
  if(k==='s-bil')return eur(D.tot26);if(k==='v-p27'){const C=calc();return (C.ris>=0?'+':'−')+eur(Math.abs(C.ris))+' previsto';}
  if(k==='s-ric')return '2026: '+eur(D.ric26);if(k==='s-pre')return 'Previsione 2027: '+eur(calc().costi);if(k==='s-for')return D.forn.length+' fornitori';
  if(k==='s-map'){const t=PLACES.reduce((a,p)=>a+pVal(p).n,0);return '≈ '+nf.format(t)+' persone ora';}
  if(k==='s-ev')return D.ev.length+' eventi in programma';
  const L=VD[k];if(L)return L.length?L.length+(L.length===1?' voce':' voci'):'Ancora vuoto';
 }catch(e){}return '';}

/* --- Previsione 2027 in breve --- */
function renderP27(){const el=document.getElementById('v-p27');const C=calc();el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Economia</span><h2>Previsione 2027</h2><p>Il risultato dell’anno prossimo, con le scelte fatte nelle voci Costi e Ricavi.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Ricavi previsti</span><b>'+eur(C.ricavi)+'</b></div><div class="kpi"><span>Costi previsti</span><b>'+eur(C.costi)+'</b></div><div class="kpi dark"><span>Risultato</span><b class="'+(C.ris>=0?'pos':'neg')+'">'+(C.ris>=0?'+':'−')+eur(Math.abs(C.ris))+'</b></div></div>'));
  el.appendChild(h('<div class="big-btns"><button type="button" class="bb" data-go="s-pre">Vedi i costi</button><button type="button" class="bb" data-go="s-ric">Vedi i ricavi</button></div>'));}

/* --- elenchi semplici (sponsor, protocollo, autorizzazioni…) --- */
const EL={
 'v-voci':{f:[['nome','Voce','t'],['anno','Anno','s',['2026','2027']],['costo','Quanto è costato (€)','n'],['ricavo','Quanto è entrato (€)','n'],['nota','Nota','ta']],intro:'Per ogni voce: quanto è costata, quanto ha fatto entrare e il guadagno.',add:'Aggiungi una voce',group:'anno'},
 'v-fatt':{f:[['soggetto','Fornitore o cliente','t'],['tipo','È un…','s',['Costo','Ricavo']],['importo','Importo (€)','n'],['data','Data','d'],['numero','Numero','t'],['voce','Voce del bilancio','t']],intro:'Le fatture ricevute ed emesse. Presto potrai caricare il file e la piattaforma leggerà da sola i dati.',add:'Aggiungi una fattura',group:'tipo'},
 'v-prev':{f:[['voce','Voce del bilancio','t'],['fornitore','Fornitore','t'],['importo','Importo (€)','n'],['stato','Stato','s',['Da chiedere','Chiesto','Arrivato','Accettato','Scartato']],['nota','Nota','ta']],intro:'I preventivi per ogni voce, da confrontare prima di scegliere.',add:'Aggiungi un preventivo',group:'voce'},
 'v-sp26':{f:[['nome','Sponsor','t'],['importo','Importo 2026 (€)','n'],['conferma','Ha confermato per il 2027?','s',['Da sentire','Sì','No']],['contatto','Contatto (persona, telefono, email)','t'],['nota','Nota','ta']],intro:'Gli sponsor del 2026 e chi ha già confermato per il 2027.',add:'Aggiungi uno sponsor',group:'conferma'},
 'v-sp27':{f:[['nome','Sponsor','t'],['importo','Importo 2027 (€)','n'],['stato','Stato','s',['Proposta inviata','Confermato','Firmato','Pagato']],['cosa','Cosa ottiene (banner, ledwall…)','t'],['contatto','Contatto','t']],intro:'Gli sponsor del 2027 e a che punto siamo.',add:'Aggiungi uno sponsor',group:'stato'},
 'v-altri':{f:[['nome','Azienda','t'],['regione','Regione','s',['Basilicata','Puglia']],['settore','Settore','t'],['citta','Città','t'],['telefono','Telefono','t'],['email','Email','t'],['contattato','Contattata?','s',['No','Sì']],['nota','Nota','ta']],intro:'Aziende di Basilicata e Puglia da proporre come sponsor.',add:'Aggiungi un’azienda',group:'regione'},
 'v-area':{f:[['spazio','Spazio','s',['Banner','Programma','Striscioni','Ledwall','Diretta','Social','Comunicazione']],['descr','Descrizione','t'],['prezzo','Prezzo (€)','n'],['stato','Stato','s',['Libero','Opzionato','Venduto']],['a','Venduto a','t']],intro:'Gli spazi in vendita: banner, programma, striscioni, ledwall, diretta, social, comunicazione.',add:'Aggiungi uno spazio',group:'spazio'},
 'v-prot':{f:[['oggetto','Oggetto','t'],['verso','Entrata o uscita','s',['Entrata','Uscita']],['soggetto','Da / a chi','t'],['data','Data','d'],['numero','Numero di protocollo','t']],intro:'Il registro di protocollo dell’Associazione.',add:'Protocolla',group:'verso'},
 'v-aut':{f:[['cosa','Autorizzazione','t'],['ente','Ente','t'],['stato','Stato','s',['Da chiedere','Chiesta','Ottenuta','Negata']],['chiesta','Chiesta il','d'],['scadenza','Scadenza','d'],['nota','Nota','ta']],intro:'Permessi e autorizzazioni per la Festa, con lo stato di ognuno.',add:'Aggiungi un’autorizzazione',group:'stato'},
 'v-req':{f:[['documento','Documento richiesto','t'],['a','A chi','t'],['entro','Entro il','d'],['stato','Stato','s',['Richiesto','Arrivato']],['nota','Nota','ta']],intro:'I documenti chiesti alle persone e quelli già arrivati.',add:'Chiedi un documento',group:'stato'}};
const COMING={'v-perc':'Disegnerai il percorso delle processioni sulla mappa di Matera: tappe, ordine del corteo, soste, lunghezza. Poi passa alla Sicurezza e ai fornitori.','v-psic':'Qui arriveranno i percorsi da convalidare, con uscite, bagni e soccorsi da aggiungere sulla mappa.','v-msic':'Qui potrai caricare i PDF delle mappe degli ingegneri: la piattaforma li ricostruirà in digitale.'};
const VD={};
async function loadVD(){if(!CTX.sb)return;const keys=Object.keys(EL).filter(canV);if(!keys.length)return;const {data}=await CTX.sb.from('voci_dati').select('*').in('voce',keys).order('creato');keys.forEach(k=>VD[k]=[]);(data||[]).forEach(r=>{(VD[r.voce]=VD[r.voce]||[]).push(r);});}
let elFilt={};
function renderVoce(id){const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">'+esc(SECN[VOCE[id].sec].n)+'</span><h2>'+esc(VOCE[id].t)+'</h2>'+(EL[id]?'<p>'+esc(EL[id].intro)+'</p>':'')+'<div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(COMING[id]){el.appendChild(h('<div class="card soon"><span class="lvl n">In arrivo</span><p style="font-size:18px;margin:6px 0 0">'+esc(COMING[id])+'</p></div>'));return;}
  const E=EL[id];if(!E)return;const L=VD[id]||[];const can=CTX.canEdit(id);
  const nums=E.f.filter(f=>f[2]==='n');
  if(id==='v-voci'){const yr=elFilt[id]||'2026';const LL=L.filter(r=>(r.dati.anno||'2026')===yr);const c=LL.reduce((a,r)=>a+(+r.dati.costo||0),0),ri=LL.reduce((a,r)=>a+(+r.dati.ricavo||0),0);
    const seg=h('<div class="seg">'+['2026','2027'].map(y=>'<button type="button" aria-pressed="'+(y===yr)+'">'+y+'</button>').join('')+'</div>');seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{elFilt[id]=b.textContent;renderVoce(id);}));el.appendChild(seg);
    el.appendChild(h('<div class="big3"><div class="kpi"><span>Speso</span><b>'+eur(c)+'</b></div><div class="kpi"><span>Entrato</span><b>'+eur(ri)+'</b></div><div class="kpi dark"><span>Differenza</span><b class="'+(ri-c>=0?'pos':'neg')+'">'+(ri-c>=0?'+':'−')+eur(Math.abs(ri-c))+'</b></div></div>'));
    const g=h('<div class="cgrid"></div>');
    LL.forEach(r=>{const d=r.dati,co=+d.costo||0,rc=+d.ricavo||0,mx=Math.max(co,rc,1),df=rc-co;
      const c2=h('<article class="card vc"><b class="vn">'+esc(d.nome||'Senza nome')+'</b><div class="bar2"><div><span>Costato</span><b>'+(d.costo!==''&&d.costo!=null?eur(co):'da inserire')+'</b></div><i><i style="width:'+(co/mx*100)+'%;background:#9A9CA6"></i></i><div><span>Entrato</span><b>'+(d.ricavo!==''&&d.ricavo!=null?eur(rc):'da inserire')+'</b></div><i><i style="width:'+(rc/mx*100)+'%;background:var(--acc)"></i></i></div><div class="res '+(df>=0?'pos':'neg')+'">'+(df>=0?'Guadagno':'Differenza')+': <b>'+(df>=0?'+':'−')+eur(Math.abs(df))+'</b></div>'+(d.nota?'<p class="muted small">'+esc(d.nota)+'</p>':'')+'</article>');
      if(can)c2.appendChild(rowBtns(id,r));g.appendChild(c2);});
    el.appendChild(g);
    if(can&&CTX.eco&&!L.length)el.appendChild(addBtn('Riempi con le 7 aree del bilancio 2026',async()=>{const rows=D.bil.map(a=>({voce:id,dati:{nome:a.n,anno:'2026',costo:Math.round(a.t),ricavo:'',nota:''}}));await CTX.sb.from('voci_dati').insert(rows);await loadVD();renderVoce(id);}));
    if(can)el.appendChild(addBtn('+ '+E.add,()=>editRec(id,null)));
    if(!LL.length&&!can)el.appendChild(h('<div class="card soon"><p>Ancora nessuna voce.</p></div>'));
    return;}
  const gf=E.f.find(f=>f[0]===E.group);const opts=gf&&gf[3]?gf[3]:[...new Set(L.map(r=>r.dati[E.group]).filter(Boolean))];
  const fv=elFilt[id]||'';
  if(opts.length){const seg=h('<div class="seg wrap"><button type="button" aria-pressed="'+(!fv)+'">Tutti ('+L.length+')</button>'+opts.map(o=>'<button type="button" aria-pressed="'+(fv===o)+'" data-v="'+esc(o)+'">'+esc(o)+' ('+L.filter(r=>r.dati[E.group]===o).length+')</button>').join('')+'</div>');
    seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{elFilt[id]=b.dataset.v||'';renderVoce(id);}));el.appendChild(seg);}
  const LL=L.filter(r=>!fv||r.dati[E.group]===fv);
  if(nums.length&&L.length){const tot=LL.reduce((a,r)=>a+(+r.dati[nums[0][0]]||0),0);el.appendChild(h('<div class="big3"><div class="kpi"><span>Quanti</span><b>'+LL.length+'</b></div><div class="kpi"><span>Totale</span><b>'+eur(tot)+'</b></div></div>'));}
  if(can)el.appendChild(addBtn('+ '+E.add,()=>editRec(id,null)));
  const g=h('<div class="cgrid"></div>');
  LL.slice().reverse().forEach(r=>{const d=r.dati;const title=d[E.f[0][0]]||'Senza titolo';
    const chips=E.f.slice(1).filter(f=>f[2]==='s'&&d[f[0]]).map(f=>'<span class="chip2'+(/^(Sì|Confermato|Firmato|Pagato|Ottenuta|Arrivato|Accettato|Venduto)$/.test(d[f[0]])?' ok':/^(No|Negata|Scartato)$/.test(d[f[0]])?' ko':'')+'">'+esc(d[f[0]])+'</span>').join('');
    const facts=E.f.slice(1).filter(f=>f[2]!=='s'&&d[f[0]]!==''&&d[f[0]]!=null).map(f=>'<div class="fact2"><span>'+esc(f[1].replace(/ \(.*\)$/,''))+'</span><b>'+(f[2]==='n'?eur(+d[f[0]]):f[2]==='d'?fmtD(d[f[0]]):esc(d[f[0]]))+'</b></div>').join('');
    const c2=h('<article class="card rc"><b class="vn">'+esc(title)+'</b>'+(chips?'<div class="chips">'+chips+'</div>':'')+facts+'</article>');
    if(can)c2.appendChild(rowBtns(id,r));g.appendChild(c2);});
  el.appendChild(g);
  if(!LL.length)el.appendChild(h('<div class="card soon"><p>'+(can?'Ancora vuoto: tocca il pulsante qui sopra per iniziare.':'Ancora vuoto.')+'</p></div>'));}
function addBtn(t,fn){const b=h('<button type="button" class="bigadd">'+esc(t)+'</button>');b.addEventListener('click',fn);return b;}
function rowBtns(id,r){const b=h('<div class="rowb"><button type="button">Modifica</button><button type="button" class="ko">Elimina</button></div>');
  b.children[0].addEventListener('click',()=>editRec(id,r));
  b.children[1].addEventListener('click',()=>ask('Eliminare «'+(Object.values(r.dati)[0]||'')+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);await loadVD();rerender();}));return b;}
function sheet(title,body,okLabel,onOk){const d=h('<div class="sdlg" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="box glass"><div class="sr"><h3 style="flex:1;font-size:22px">'+esc(title)+'</h3><button class="x" type="button" aria-label="Chiudi">×</button></div><div class="edform">'+body+'</div><p class="smsg" role="status"></p><div class="big-btns"><button type="button" class="bb" aria-pressed="true" data-ok>'+esc(okLabel)+'</button><button type="button" class="bb soft" data-no>Annulla</button></div></div></div>');
  document.body.appendChild(d);const close=()=>d.remove();d.querySelector('.x').addEventListener('click',close);d.querySelector('[data-no]').addEventListener('click',close);d.addEventListener('click',e=>{if(e.target===d)close();});
  d.querySelector('[data-ok]').addEventListener('click',async()=>{const m=d.querySelector('.smsg');m.textContent='Salvo…';try{const r=await onOk(d);if(r===false){return;}close();}catch(e){m.textContent=e.message||String(e);}});
  setTimeout(()=>{const f=d.querySelector('input,textarea,select');if(f)f.focus();},40);return d;}
function ask(q,ok,fn){sheet(q,'<p style="font-size:17px">L’operazione non si può annullare.</p>',ok,async()=>{await fn();});}
function fieldHtml(f,v){const [k,l,t,o]=f;const val=v==null?'':v;
  if(t==='s')return '<div class="ctl"><label for="fx_'+k+'">'+esc(l)+'</label><select id="fx_'+k+'">'+o.map(x=>'<option'+(x===val?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
  if(t==='ta')return '<div class="ctl"><label for="fx_'+k+'">'+esc(l)+'</label><textarea id="fx_'+k+'">'+esc(val)+'</textarea></div>';
  return '<div class="ctl"><label for="fx_'+k+'">'+esc(l)+'</label><input id="fx_'+k+'" type="'+(t==='n'?'number':t==='d'?'date':'text')+'" value="'+esc(val)+'"'+(t==='n'?' step="any" inputmode="decimal"':'')+'></div>';}
function editRec(id,r){const E=EL[id];const d=r?r.dati:{};if(id==='v-voci'&&!r)d.anno=elFilt[id]||'2026';
  sheet((r?'Modifica':E.add),E.f.map(f=>fieldHtml(f,d[f[0]])).join(''),'Salva',async(dl)=>{const o={};E.f.forEach(([k,,t])=>{let v=dl.querySelector('#fx_'+k).value;if(t==='n')v=v===''?'':Number(String(v).replace(',','.'));o[k]=typeof v==='string'?v.trim():v;});
    if(!o[E.f[0][0]]){dl.querySelector('.smsg').textContent='Scrivi almeno «'+E.f[0][1]+'».';return false;}
    const q=r?CTX.sb.from('voci_dati').update({dati:o,aggiornato:new Date().toISOString()}).eq('id',r.id):CTX.sb.from('voci_dati').insert({voce:id,dati:o});
    const {error}=await q;if(error)throw new Error('Non salvato: '+error.message);await loadVD();rerender();stEl.textContent='Salvato. Lo vedono tutti quelli che hanno accesso.';});}

/* --- dati di Home, richieste, compiti, riunioni, notifiche --- */
async function loadSocial(){if(!CTX.sb)return;
  const [p,n,rq,cp,ri,iv]=await Promise.all([CTX.sb.from('profili').select('id,nome,email,admin,presidente'),CTX.sb.from('notifiche').select('*').order('quando',{ascending:false}).limit(40),CTX.sb.from('richieste').select('*').order('creato',{ascending:false}),CTX.sb.from('compiti').select('*').order('creato',{ascending:false}),CTX.sb.from('riunioni').select('*').order('quando'),CTX.sb.from('inviti_riunione').select('*')]);
  (p.data||[]).forEach(x=>PEOPLE[x.id]=x);NOTI=n.data||[];RICH=rq.data||[];COMP=cp.data||[];RIUN=ri.data||[];INVM=iv.data||[];}
const isPres=()=>CTX.admin||!!(PEOPLE[CTX.user.id]&&PEOPLE[CTX.user.id].presidente)||!!CTX.prof.presidente;
function refreshBell(){const n=NOTI.filter(x=>!x.letto).length;const b=document.getElementById('bellN');if(b){b.textContent=n?String(n):'';b.hidden=!n;}}
document.getElementById('bell').addEventListener('click',()=>{go('p-me');});

/* --- Home a riquadri --- */
const WIDX={promemoria:'I miei promemoria',presenze:'Presenze in mappa',sponsor:'Sponsor da contattare',modifiche:'Ultime modifiche'};
let PREF={w:[]};
async function loadPref(){if(!CTX.sb)return;const {data}=await CTX.sb.from('preferenze').select('*').eq('user_id',CTX.user.id).maybeSingle();if(data&&data.dati)PREF=Object.assign({w:[]},data.dati);}
async function savePref(){await CTX.sb.from('preferenze').upsert({user_id:CTX.user.id,dati:PREF});}
function countdown(){const t=new Date('2027-07-02T00:00:00');const n=Math.ceil((t-new Date())/86400000);return Math.max(0,n);}
function myTodo(){const me=CTX.user.id;return COMP.filter(c=>c.per===me&&!c.fatto);}
function briefing(){const me=CTX.user.id,today=todayISO();const parts=[];
  const ap=RICH.filter(r=>r.stato==='aperta');if(ap.length)parts.push('<b>'+ap.length+' '+(ap.length===1?'richiesta del Presidente':'richieste del Presidente')+'</b> ancora da prendere');
  const mine=RICH.filter(r=>r.preso_da===me&&r.stato==='presa');const late=mine.filter(r=>r.entro&&r.entro<today);
  if(late.length)parts.push('<b class="neg">'+late.length+' tua'+(late.length>1?'e':'')+' in ritardo</b>');else if(mine.length)parts.push(mine.length+' presa da te: la prossima scade il <b>'+fmtD(mine.map(r=>r.entro).sort()[0])+'</b>');
  const td=myTodo();if(td.length)parts.push('<b>'+td.length+' cos'+(td.length===1?'a':'e')+' da fare</b>');
  const inv=INVM.filter(i=>i.user_id===me&&i.stato==='invitato');if(inv.length)parts.push('<b>'+inv.length+' invit'+(inv.length===1?'o':'i')+'</b> a cui rispondere');
  const nx=RIUN.filter(r=>new Date(r.quando)>new Date()&&(r.creato_da===me||INVM.some(i=>i.riunione_id===r.id&&i.user_id===me&&i.stato!=='rifiuta')))[0];
  if(nx)parts.push('prossima riunione: <b>'+esc(nx.titolo)+'</b> '+new Date(nx.quando).toLocaleString('it-IT',{weekday:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}));
  return parts.length?'Oggi hai '+parts.join(', ')+'.':'Tutto in ordine: nessuna scadenza e nessuna richiesta aperta.';}
function coreCard(){const s=mySez()[0];if(!s)return '';let big='',sub='',lab='';
  try{if(s.k==='eco'&&CTX.eco){const C=calc();lab='Risultato previsto 2027';big=(C.ris>=0?'+':'−')+eur(Math.abs(C.ris));sub='Costi 2026: '+eur(D.tot26)+' · Ricavi 2026: '+eur(D.ric26);}
   else if(s.k==='sic'){const t=PLACES.reduce((a,p)=>a+pVal(p).n,0);lab='Persone stimate adesso nei luoghi della Festa';big='≈ '+nf.format(t);sub='La mappa si aggiorna ogni minuto';}
   else if(s.k==='evt'){lab='Eventi in programma';big=String(D.ev.length||'—');sub='Dal 15 maggio al 15 agosto';}
   else{const ks=secVoci(s).map(v=>v[0]);const n=ks.reduce((a,k)=>a+((VD[k]||[]).length),0);lab='Voci registrate';big=String(n);sub=secVoci(s).map(v=>v[1]).join(' · ');}}catch(e){}
  return '<section class="w wcore"><span class="wl">'+esc(s.n)+' · il tuo riquadro</span><span class="wsub">'+esc(lab)+'</span><b class="wbig">'+big+'</b><span class="wsub">'+esc(sub)+'</span><button type="button" class="bb dark" data-go="sec-'+s.k+'">Apri '+esc(s.n)+'</button></section>';}
function weekStrip(){const d0=new Date();d0.setHours(0,0,0,0);const days=[];for(let i=0;i<7;i++){const d=new Date(d0);d.setDate(d0.getDate()+i);days.push(d);}
  const me=CTX.user.id;const mine=RIUN.filter(r=>r.creato_da===me||INVM.some(i=>i.riunione_id===r.id&&i.user_id===me&&i.stato!=='rifiuta')||CTX.admin);
  const has=d=>mine.some(r=>new Date(r.quando).toDateString()===d.toDateString());
  return '<div class="week">'+days.map((d,i)=>'<div class="day2'+(i===0?' on':'')+'"><span>'+d.toLocaleDateString('it-IT',{weekday:'short'})+'</span><b>'+d.getDate()+'</b>'+(has(d)?'<i></i>':'')+'</div>').join('')+'</div>'+
    mine.filter(r=>new Date(r.quando)>=d0).slice(0,3).map(r=>{const iv=INVM.find(i=>i.riunione_id===r.id&&i.user_id===me);return '<div class="ev2"><b>'+new Date(r.quando).toLocaleString('it-IT',{weekday:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</b><span>'+esc(r.titolo)+(r.luogo?' · '+esc(r.luogo):'')+'</span>'+(iv?'<em class="'+(iv.stato==='accetta'?'ok':iv.stato==='rifiuta'?'ko':'')+'">'+(iv.stato==='accetta'?'Ci sarai':iv.stato==='rifiuta'?'Non ci sarai':'Da rispondere')+'</em>':'')+'</div>';}).join('');}
function renderHome(){const el=document.getElementById('p-home');el.innerHTML='';
  const ora=new Date().getHours();const sal=ora<13?'Buongiorno':ora<18?'Buon pomeriggio':'Buonasera';
  el.appendChild(h('<div class="hello"><span>'+new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})+'</span><h1>'+sal+', <b>'+esc((CTX.prof.nome||'').split(' ')[0]||'')+'</b></h1></div>'));
  const me=CTX.user.id;const ap=RICH.filter(r=>r.stato!=='fatta').slice(0,3);
  const g=h('<div class="wgrid"></div>');
  g.appendChild(h(coreCard()||'<section class="w"><span class="wl">Benvenuto</span><p>Non hai ancora sezioni assegnate.</p></section>'));
  g.appendChild(h('<section class="w wdark"><span class="wl">Alla Bruna mancano</span><b class="wbig">'+countdown()+'<small> giorni</small></b><span class="wsub">2 luglio 2027</span></section>'));
  g.appendChild(h('<section class="w"><div class="wh"><span class="orb"></span><b>Il briefing di oggi</b></div><p class="brief">'+briefing()+'</p></section>'));
  const rq=h('<section class="w"><div class="wh"><b>Richieste del Presidente</b><button type="button" class="lnk2" data-go="p-req">Tutte</button></div>'+(ap.length?ap.map(r=>'<div class="rq"><div><b>'+esc(r.titolo)+'</b><span class="'+(r.stato==='aperta'?'neg':'')+'">'+(r.stato==='aperta'?'Nessuno l’ha presa':'Presa da '+esc(nome(r.preso_da))+' · entro il '+fmtD(r.entro))+'</span></div>'+(r.stato==='aperta'?'<button type="button" class="bb dark sm" data-take="'+r.id+'">La prendo io</button>':'')+'</div>').join(''):'<p class="muted">Nessuna richiesta aperta.</p>')+'</section>');
  rq.querySelectorAll('[data-take]').forEach(b=>b.addEventListener('click',()=>takeReq(b.dataset.take)));g.appendChild(rq);
  const td=myTodo();const tw=h('<section class="w"><div class="wh"><b>Da fare oggi</b><button type="button" class="lnk2" data-go="p-me">Il mio spazio</button></div>'+(td.length?td.slice(0,5).map(c=>'<label class="todo"><input type="checkbox" data-done="'+c.id+'"><span>'+esc(c.titolo)+(c.entro?' <em>entro il '+fmtD(c.entro)+'</em>':'')+'</span></label>').join(''):'<p class="muted">Niente da fare. Aggiungi un promemoria da Il mio spazio.</p>')+'</section>');
  tw.querySelectorAll('[data-done]').forEach(x=>x.addEventListener('change',()=>doneTask(x.dataset.done)));g.appendChild(tw);
  g.appendChild(h('<section class="w wide"><div class="wh"><b>Questa settimana</b><button type="button" class="lnk2" data-go="p-cal">Riunioni</button></div>'+weekStrip()+'</section>'));
  (PREF.w||[]).forEach(k=>{const w=extraW(k);if(w)g.appendChild(w);});
  const add=h('<button type="button" class="w wadd"><span>+</span><b>Aggiungi un riquadro</b></button>');add.addEventListener('click',pickW);g.appendChild(add);
  el.appendChild(g);}
function extraW(k){const rm='<button type="button" class="wx" aria-label="Togli riquadro" data-rm="'+k+'">×</button>';let html='';
  if(k==='promemoria'){const L=COMP.filter(c=>c.per===CTX.user.id&&c.privato&&!c.fatto);html='<section class="w">'+rm+'<div class="wh"><b>I miei promemoria</b></div>'+(L.length?L.slice(0,4).map(c=>'<p>· '+esc(c.titolo)+'</p>').join(''):'<p class="muted">Nessun promemoria.</p>')+'</section>';}
  else if(k==='presenze'){if(!canV('s-map'))return null;const t=PLACES.reduce((a,p)=>a+pVal(p).n,0);html='<section class="w">'+rm+'<span class="wl">Presenze in mappa</span><b class="wbig">≈ '+nf.format(t)+'</b><button type="button" class="bb" data-go="s-map">Apri la mappa</button></section>';}
  else if(k==='sponsor'){if(!canV('v-altri'))return null;const L=(VD['v-altri']||[]).filter(r=>r.dati.contattato!=='Sì');html='<section class="w">'+rm+'<span class="wl">Sponsor da contattare</span><b class="wbig">'+L.length+'</b><button type="button" class="bb" data-go="v-altri">Apri</button></section>';}
  else if(k==='modifiche'){html='<section class="w">'+rm+'<div class="wh"><b>Ultime novità</b></div>'+(NOTI.slice(0,4).map(n=>'<p class="small">· '+esc(n.testo)+'</p>').join('')||'<p class="muted">Nessuna novità.</p>')+'</section>';}
  if(!html)return null;const w=h(html);w.querySelector('[data-rm]').addEventListener('click',async()=>{PREF.w=PREF.w.filter(x=>x!==k);renderHome();await savePref();});return w;}
function pickW(){const av=Object.entries(WIDX).filter(([k])=>!(PREF.w||[]).includes(k));
  if(!av.length){stEl.textContent='Hai già tutti i riquadri disponibili.';return;}
  sheet('Aggiungi un riquadro','<div class="sgrid">'+av.map(([k,t])=>'<button type="button" data-w="'+k+'">'+esc(t)+'</button>').join('')+'</div>','Chiudi',async()=>{});
  document.querySelectorAll('[data-w]').forEach(b=>b.addEventListener('click',async()=>{PREF.w=(PREF.w||[]).concat([b.dataset.w]);document.querySelector('.sdlg').remove();renderHome();await savePref();}));}

/* --- Richieste del Presidente --- */
function takeReq(id){const r=RICH.find(x=>x.id===id);if(!r)return;
  sheet('La prendo io: «'+r.titolo+'»','<div class="ctl"><label for="tk_d">Entro quando la consegni?</label><input type="date" id="tk_d" min="'+todayISO()+'"></div><p class="muted">Senza data non si può confermare.</p>','Conferma',async(dl)=>{const d=dl.querySelector('#tk_d').value;if(!d){dl.querySelector('.smsg').textContent='Scegli la data.';return false;}
    const {error}=await CTX.sb.rpc('prendi_richiesta',{rid:id,data_entro:d});if(error)throw new Error(error.message);await loadSocial();rerender();stEl.textContent='Presa in carico. Il Presidente è stato avvisato.';});}
function renderReq(){const el=document.getElementById('p-req');el.innerHTML='';const me=CTX.user.id;
  el.appendChild(h('<div class="sh"><span class="eyb">Per tutti</span><h2>Richieste del Presidente</h2><p>Le vedono tutti. Chi ne prende una scrive entro quando la consegna.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(isPres())el.appendChild(addBtn('+ Nuova richiesta',()=>sheet('Nuova richiesta','<div class="ctl"><label for="rq_t">Cosa serve</label><input type="text" id="rq_t"></div><div class="ctl"><label for="rq_x">Dettagli</label><textarea id="rq_x"></textarea></div>','Invia a tutti',async(dl)=>{const t=dl.querySelector('#rq_t').value.trim();if(!t){dl.querySelector('.smsg').textContent='Scrivi cosa serve.';return false;}const {error}=await CTX.sb.from('richieste').insert({titolo:t,testo:dl.querySelector('#rq_x').value.trim()||null});if(error)throw new Error(error.message);await loadSocial();renderReq();stEl.textContent='Richiesta inviata a tutti.';})));
  const grp=[['aperta','Da prendere'],['presa','In lavorazione'],['fatta','Completate']];
  grp.forEach(([st,lab])=>{const L=RICH.filter(r=>r.stato===st);if(!L.length)return;el.appendChild(h('<h3 class="gh">'+lab+' · '+L.length+'</h3>'));const g=h('<div class="cgrid"></div>');
    L.forEach(r=>{const late=st==='presa'&&r.entro&&r.entro<todayISO();
      const c=h('<article class="card rc'+(st==='aperta'?' hot':'')+'"><div class="chips"><span class="chip2 '+(st==='aperta'?'ko':st==='fatta'?'ok':'')+'">'+lab+'</span>'+(late?'<span class="chip2 ko">In ritardo</span>':'')+'</div><b class="vn">'+esc(r.titolo)+'</b>'+(r.testo?'<p>'+esc(r.testo)+'</p>':'')+(r.preso_da?'<div class="who"><span class="av">'+iniz(r.preso_da)+'</span><span><b>'+esc(nome(r.preso_da))+'</b> · entro il '+fmtD(r.entro)+'</span></div>':'')+'<span class="muted small">Chiesta da '+esc(nome(r.creato_da))+' il '+new Date(r.creato).toLocaleDateString('it-IT')+'</span></article>');
      if(st==='aperta'){const b=h('<button type="button" class="bb dark">La prendo io</button>');b.addEventListener('click',()=>takeReq(r.id));c.appendChild(b);}
      if(st==='presa'&&(r.preso_da===me||isPres())){const b=h('<button type="button" class="bb">Segna come fatta</button>');b.addEventListener('click',async()=>{const {error}=await CTX.sb.rpc('chiudi_richiesta',{rid:r.id});if(error){stEl.textContent=error.message;return;}await loadSocial();renderReq();});c.appendChild(b);}
      if(isPres()){const b=h('<button type="button" class="lnk2 ko">Elimina</button>');b.addEventListener('click',()=>ask('Eliminare la richiesta?','Elimina',async()=>{await CTX.sb.from('richieste').delete().eq('id',r.id);await loadSocial();renderReq();}));c.appendChild(b);}
      g.appendChild(c);});el.appendChild(g);});
  if(!RICH.length)el.appendChild(h('<div class="card soon"><p>Ancora nessuna richiesta.'+(isPres()?'':' Le richieste le crea il Presidente.')+'</p></div>'));}

/* --- Riunioni con inviti --- */
function renderCal(){const el=document.getElementById('p-cal');el.innerHTML='';const me=CTX.user.id;
  el.appendChild(h('<div class="sh"><span class="eyb">Per tutti</span><h2>Riunioni</h2><p>Crea una riunione e scegli chi invitare: gli invitati accettano o rifiutano.</p></div>'));
  el.appendChild(addBtn('+ Nuova riunione',()=>{const ppl=Object.values(PEOPLE).filter(p=>p.id!==me);
    sheet('Nuova riunione','<div class="ctl"><label for="ri_t">Titolo</label><input type="text" id="ri_t" placeholder="Riunione del direttivo"></div><div class="when"><div class="ctl"><label for="ri_d">Giorno</label><input type="date" id="ri_d" min="'+todayISO()+'"></div><div class="ctl"><label for="ri_o">Ora</label><input type="time" id="ri_o" value="18:30"></div></div><div class="ctl"><label for="ri_l">Luogo</label><input type="text" id="ri_l"></div><div class="lab">Chi inviti</div><div class="checks">'+ppl.map(p=>'<label><input type="checkbox" value="'+p.id+'"> '+esc(p.nome||p.email)+'</label>').join('')+'</div>','Crea e invita',async(dl)=>{const t=dl.querySelector('#ri_t').value.trim(),d=dl.querySelector('#ri_d').value,o=dl.querySelector('#ri_o').value||'18:00';if(!t||!d){dl.querySelector('.smsg').textContent='Scrivi titolo e giorno.';return false;}
      const {data,error}=await CTX.sb.from('riunioni').insert({titolo:t,quando:new Date(d+'T'+o).toISOString(),luogo:dl.querySelector('#ri_l').value.trim()||null}).select().single();if(error)throw new Error(error.message);
      const inv=[...dl.querySelectorAll('.checks input:checked')].map(x=>({riunione_id:data.id,user_id:x.value}));if(inv.length){const r2=await CTX.sb.from('inviti_riunione').insert(inv);if(r2.error)throw new Error(r2.error.message);}
      await loadSocial();renderCal();stEl.textContent='Riunione creata, invitati avvisati.';});}));
  const now=new Date();const L=RIUN.filter(r=>new Date(r.quando)>=new Date(now.getTime()-86400000));
  const g=h('<div class="cgrid"></div>');
  L.forEach(r=>{const my=INVM.find(i=>i.riunione_id===r.id&&i.user_id===me);const inv=INVM.filter(i=>i.riunione_id===r.id);
    const c=h('<article class="card rc"><b class="vn">'+esc(r.titolo)+'</b><div class="fact2"><span>Quando</span><b>'+new Date(r.quando).toLocaleString('it-IT',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})+'</b></div>'+(r.luogo?'<div class="fact2"><span>Dove</span><b>'+esc(r.luogo)+'</b></div>':'')+'<div class="chips">'+inv.map(i=>'<span class="chip2 '+(i.stato==='accetta'?'ok':i.stato==='rifiuta'?'ko':'')+'">'+esc(nome(i.user_id))+'</span>').join('')+'</div><span class="muted small">Organizza '+esc(nome(r.creato_da))+'</span></article>');
    if(my&&my.stato==='invitato'){const b=h('<div class="rowb"><button type="button" class="okb">Ci sarò</button><button type="button" class="ko">Non posso</button></div>');
      b.children[0].addEventListener('click',()=>answer(r.id,'accetta'));b.children[1].addEventListener('click',()=>answer(r.id,'rifiuta'));c.appendChild(b);}
    if(r.creato_da===me){const b=h('<button type="button" class="lnk2 ko">Annulla la riunione</button>');b.addEventListener('click',()=>ask('Annullare la riunione?','Annulla',async()=>{await CTX.sb.from('riunioni').delete().eq('id',r.id);await loadSocial();renderCal();}));c.appendChild(b);}
    g.appendChild(c);});
  el.appendChild(g);if(!L.length)el.appendChild(h('<div class="card soon"><p>Nessuna riunione in programma.</p></div>'));}
async function answer(rid,st){const {error}=await CTX.sb.from('inviti_riunione').update({stato:st}).eq('riunione_id',rid).eq('user_id',CTX.user.id);if(error){stEl.textContent=error.message;return;}await loadSocial();rerender();}

/* --- Il mio spazio --- */
let AREE_P=[];
async function loadAree(){const {data}=await CTX.sb.from('aree_personali').select('*').order('aggiornato',{ascending:false});AREE_P=data||[];}
async function doneTask(id){await CTX.sb.from('compiti').update({fatto:true}).eq('id',id);await loadSocial();rerender();}
async function renderMe(){const el=document.getElementById('p-me');el.innerHTML='';const me=CTX.user.id;
  await loadAree();if(cur!=='p-me')return;
  el.appendChild(h('<div class="mehead"><span class="av big">'+iniz(me)+'</span><div><span class="eyb">Il mio spazio</span><h2>'+esc(CTX.prof.nome||CTX.prof.email)+'</h2><span class="muted">'+(CTX.admin?'Amministratore':isPres()?'Presidente':'Collaboratore')+'</span></div></div>'));
  const un=NOTI.filter(n=>!n.letto);
  const nc=h('<section class="card"><div class="wh"><h3>Notifiche</h3>'+(un.length?'<button type="button" class="lnk2" id="allread">Segna tutte come lette</button>':'')+'</div>'+(NOTI.length?NOTI.slice(0,15).map(n=>'<button type="button" class="noti'+(n.letto?'':' new')+'" data-n="'+n.id+'" data-link="'+esc(n.link||'')+'"><i></i><span>'+esc(n.testo)+'<em>'+new Date(n.quando).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</em></span></button>').join(''):'<p class="muted">Nessuna notifica.</p>')+'</section>');
  nc.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',async()=>{await CTX.sb.from('notifiche').update({letto:true}).eq('id',+b.dataset.n);const x=NOTI.find(n=>n.id===+b.dataset.n);if(x)x.letto=true;refreshBell();if(b.dataset.link)go(b.dataset.link);else renderMe();}));
  const ar=nc.querySelector('#allread');if(ar)ar.addEventListener('click',async()=>{await CTX.sb.from('notifiche').update({letto:true}).eq('per',me).eq('letto',false);NOTI.forEach(n=>n.letto=true);refreshBell();renderMe();});
  el.appendChild(nc);
  const mine=COMP.filter(c=>c.per===me);const fatti=mine.filter(c=>c.fatto).length;
  const cc=h('<section class="card"><div class="wh"><h3>I miei compiti e promemoria</h3><span class="muted">'+fatti+' su '+mine.length+' fatti</span></div><div class="gauge sm"><i style="display:block;height:100%;width:'+(mine.length?fatti/mine.length*100:0)+'%;background:var(--good)"></i></div>'+mine.filter(c=>!c.fatto).map(c=>'<label class="todo"><input type="checkbox" data-done="'+c.id+'"><span>'+esc(c.titolo)+(c.entro?' <em>entro il '+fmtD(c.entro)+'</em>':'')+(c.da!==me?' <em>da '+esc(nome(c.da))+'</em>':'')+'</span></label>').join('')+'<div class="when"><div class="ctl" style="flex:3 1 220px"><label for="pm_t">Nuovo promemoria</label><input type="text" id="pm_t" placeholder="Scrivi qui…"></div><div class="ctl"><label for="pm_d">Entro</label><input type="date" id="pm_d"></div></div><div class="big-btns"><button type="button" class="bb dark" id="pm_ok">Salva promemoria</button><button type="button" class="bb" id="as_ok">Assegna un compito a un collega</button></div></section>');
  cc.querySelectorAll('[data-done]').forEach(x=>x.addEventListener('change',()=>doneTask(x.dataset.done)));
  cc.querySelector('#pm_ok').addEventListener('click',async()=>{const t=cc.querySelector('#pm_t').value.trim();if(!t)return;const {error}=await CTX.sb.from('compiti').insert({per:me,titolo:t,entro:cc.querySelector('#pm_d').value||null,privato:true});if(error){stEl.textContent=error.message;return;}await loadSocial();renderMe();});
  cc.querySelector('#as_ok').addEventListener('click',()=>{const ppl=Object.values(PEOPLE).filter(p=>p.id!==me);sheet('Assegna un compito','<div class="ctl"><label for="as_p">A chi</label><select id="as_p">'+ppl.map(p=>'<option value="'+p.id+'">'+esc(p.nome||p.email)+'</option>').join('')+'</select></div><div class="ctl"><label for="as_t">Cosa deve fare</label><input type="text" id="as_t"></div><div class="ctl"><label for="as_d">Entro</label><input type="date" id="as_d" min="'+todayISO()+'"></div>','Assegna',async(dl)=>{const t=dl.querySelector('#as_t').value.trim();if(!t){dl.querySelector('.smsg').textContent='Scrivi cosa deve fare.';return false;}const {error}=await CTX.sb.from('compiti').insert({per:dl.querySelector('#as_p').value,titolo:t,entro:dl.querySelector('#as_d').value||null});if(error)throw new Error(error.message);await loadSocial();renderMe();stEl.textContent='Compito assegnato: riceverà una notifica.';});});
  el.appendChild(cc);
  const given=COMP.filter(c=>c.da===me&&c.per!==me);
  if(given.length)el.appendChild(h('<section class="card"><h3>Compiti che hai assegnato</h3>'+given.map(c=>'<div class="rq"><div><b>'+esc(c.titolo)+'</b><span>'+esc(nome(c.per))+(c.entro?' · entro il '+fmtD(c.entro):'')+'</span></div><span class="chip2 '+(c.fatto?'ok':'')+'">'+(c.fatto?'Fatto':'Da fare')+'</span></div>').join('')+'</section>'));
  const myA=AREE_P.filter(a=>a.owner===me),oth=AREE_P.filter(a=>a.owner!==me);
  const ac=h('<section class="card"><div class="wh"><h3>Le mie aree</h3><button type="button" class="bb dark sm" id="na">+ Nuova area</button></div><p class="muted">Pagine tue per appunti e lavori. Scegli se renderle visibili a tutti.'+(CTX.admin?' Come amministratore vedi anche quelle degli altri.':'')+'</p><div class="cgrid"></div></section>');
  const ag=ac.querySelector('.cgrid');
  myA.concat(oth).forEach(a=>{const own=a.owner===me;const c=h('<article class="card rc"><div class="chips"><span class="chip2 '+(a.visibile?'ok':'')+'">'+(a.visibile?'Visibile a tutti':'Solo per '+(own?'te':esc(nome(a.owner))))+'</span>'+(own?'':'<span class="chip2">di '+esc(nome(a.owner))+'</span>')+'</div><b class="vn">'+esc(a.titolo)+'</b><p style="white-space:pre-line">'+esc((a.testo||'').slice(0,400))+'</p></article>');
    if(own){const b=h('<div class="rowb"><button type="button">Modifica</button><button type="button" class="ko">Elimina</button></div>');b.children[0].addEventListener('click',()=>editArea(a));b.children[1].addEventListener('click',()=>ask('Eliminare «'+a.titolo+'»?','Elimina',async()=>{await CTX.sb.from('aree_personali').delete().eq('id',a.id);renderMe();}));c.appendChild(b);}
    ag.appendChild(c);});
  ac.querySelector('#na').addEventListener('click',()=>editArea(null));el.appendChild(ac);
  el.appendChild(h('<section class="card"><h3>Profilo</h3><div class="big-btns"><button type="button" class="bb" id="pw">Cambia password</button><button type="button" class="bb" id="out2">Esci</button></div></section>'));
  el.querySelector('#out2').addEventListener('click',()=>CTX.logout());
  el.querySelector('#pw').addEventListener('click',()=>sheet('Cambia password','<div class="ctl"><label for="np2">Nuova password (almeno 8 caratteri)</label><input type="password" id="np2" autocomplete="new-password"></div>','Salva',async(dl)=>{const p=dl.querySelector('#np2').value;if(p.length<8){dl.querySelector('.smsg').textContent='Almeno 8 caratteri.';return false;}const {error}=await CTX.sb.auth.updateUser({password:p});if(error)throw new Error(error.message);stEl.textContent='Password cambiata.';}));}
function editArea(a){sheet(a?'Modifica area':'Nuova area','<div class="ctl"><label for="ap_t">Titolo</label><input type="text" id="ap_t" value="'+esc(a?a.titolo:'')+'"></div><div class="ctl"><label for="ap_x">Contenuto</label><textarea id="ap_x" style="min-height:180px">'+esc(a?a.testo||'':'')+'</textarea></div><label style="display:flex;gap:10px;align-items:center;font-size:17px"><input type="checkbox" id="ap_v"'+(a&&a.visibile?' checked':'')+'> Visibile a tutti</label>','Salva',async(dl)=>{const t=dl.querySelector('#ap_t').value.trim();if(!t){dl.querySelector('.smsg').textContent='Scrivi un titolo.';return false;}const o={titolo:t,testo:dl.querySelector('#ap_x').value,visibile:dl.querySelector('#ap_v').checked,aggiornato:new Date().toISOString()};const q=a?CTX.sb.from('aree_personali').update(o).eq('id',a.id):CTX.sb.from('aree_personali').insert(o);const {error}=await q;if(error)throw new Error(error.message);renderMe();});}

/* --- permessi a due livelli: sezioni e voci --- */
const AREEP2=[];SEZ.forEach(s=>s.v.forEach(v=>AREEP2.push([v[0],s.n+' › '+v[1],s.k])));

const LIV2=[['','Non vede'],['vedi','Guarda'],['modifica','Modifica']];
const expand=k=>k==='s-car'?['s-car','s-fon']:[k];
function sel2(v,attr,mixed){return '<select '+attr+'>'+(mixed?'<option value="*" selected>Misto</option>':'')+LIV2.map(([k,l])=>'<option value="'+k+'"'+(!mixed&&(v||'')===k?' selected':'')+'>'+l+'</option>').join('')+'</select>';}
function permEditor(get,set){const box=h('<div class="pe"></div>');const OPEN=new Set();
  const draw=()=>{box.innerHTML='';SEZ.forEach(s=>{const lv=s.v.map(v=>get(v[0])||'');const same=lv.every(x=>x===lv[0]);
    const r=h('<details class="pes"><summary><span class="pen">'+svg(s.i,20)+'<b>'+esc(s.n)+'</b></span>'+sel2(lv[0],'data-sec="'+s.k+'"',!same)+'</summary><div class="pev">'+s.v.map(v=>'<label><span>'+esc(v[1])+'</span>'+sel2(get(v[0]),'data-v="'+v[0]+'"')+'</label>').join('')+'</div></details>');
    const ss=r.querySelector('[data-sec]');ss.addEventListener('click',e=>e.stopPropagation());
    ss.addEventListener('change',async()=>{if(ss.value==='*')return;await set(s.v.flatMap(v=>expand(v[0])),ss.value);draw();});
    r.querySelectorAll('[data-v]').forEach(x=>x.addEventListener('change',async()=>{await set(expand(x.dataset.v),x.value);draw();}));
    r.open=OPEN.has(s.k);r.addEventListener('toggle',()=>{if(r.open)OPEN.add(s.k);else OPEN.delete(s.k);});
    box.appendChild(r);});};
  draw();return box;}
async function renderAdm2(){const el=document.getElementById('s-adm');if(cur!=='s-adm')return;el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Amministratore</span><h2>Utenti e permessi</h2><p>Inviti le persone e scegli le sezioni. Dentro ogni sezione puoi decidere voce per voce. Il controllo vero lo fa il database.</p></div>'));
  const [pf,pm,iv,rg]=await Promise.all([CTX.sb.from('profili').select('*').order('creato'),CTX.sb.from('permessi').select('*'),CTX.sb.from('inviti').select('*').eq('usato',false).order('creato'),CTX.sb.from('registro').select('*').order('quando',{ascending:false}).limit(60)]);
  if(cur!=='s-adm')return;
  const NP={};
  const inv=h('<section class="card"><h3>Invita una persona</h3><div class="when"><div class="ctl"><label for="ie">Email</label><input type="text" inputmode="email" id="ie" autocomplete="off" autocapitalize="off"></div><div class="ctl"><label for="in">Nome</label><input type="text" id="in"></div></div><div class="lab">Cosa può vedere</div><div class="pehost"></div><label class="ck"><input type="checkbox" id="ipres"> È il Presidente (crea le richieste per tutti)</label><label class="ck"><input type="checkbox" id="iadm"> È amministratore (vede e modifica tutto)</label><div class="big-btns"><button type="button" class="bb dark" id="invia">Invita</button></div><p class="muted small" id="imsg">Dopo l’invito la persona apre il sito, sceglie «Primo accesso» e crea la password con questa email.</p></section>');
  inv.querySelector('.pehost').appendChild(permEditor(a=>NP[a],async(as,l)=>{as.forEach(a=>{if(l)NP[a]=l;else delete NP[a];});}));
  inv.querySelector('#invia').addEventListener('click',async()=>{const email=inv.querySelector('#ie').value.trim().toLowerCase();const msg=inv.querySelector('#imsg');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){msg.textContent='Scrivi un’email valida.';return;}
    const permessi=Object.assign({},NP);if(inv.querySelector('#ipres').checked)permessi._presidente='si';
    const {error}=await CTX.sb.from('inviti').upsert({email,nome:inv.querySelector('#in').value.trim()||null,admin:inv.querySelector('#iadm').checked,permessi,usato:false});
    msg.textContent=error?'Non sono riuscito a salvare l’invito: '+error.message:'Invito salvato. Manda a '+email+' il link del sito.';if(!error)setTimeout(renderAdm2,1200);});
  el.appendChild(inv);
  const P=pf.data||[],M=pm.data||[];
  const pc=h('<section class="card"><h3>Persone con accesso · '+P.length+'</h3><p class="muted small">Tocca una persona per cambiare cosa vede. Le modifiche valgono dal suo prossimo accesso.</p><div class="ppl"></div></section>');
  P.forEach(u=>{const mine=M.filter(x=>x.user_id===u.id);const secs=SEZ.filter(s=>s.v.some(v=>mine.some(m=>m.area===v[0]))).map(s=>s.n);
    const d=h('<details class="person"><summary><span class="av">'+esc((u.nome||u.email||'?').charAt(0).toUpperCase())+'</span><span class="pn"><b>'+esc(u.nome||u.email)+'</b><span class="muted small">'+(u.admin?'Amministratore · vede tutto':(secs.join(' · ')||'Nessuna sezione'))+(u.presidente?' · Presidente':'')+'</span></span></summary><div class="pbody"></div></details>');
    const b=d.querySelector('.pbody');
    const pr=h('<label class="ck"><input type="checkbox"'+(u.presidente?' checked':'')+'> È il Presidente</label>');pr.querySelector('input').addEventListener('change',async e=>{const {error}=await CTX.sb.from('profili').update({presidente:e.target.checked}).eq('id',u.id);stEl.textContent=error?'Errore: '+error.message:'Aggiornato.';u.presidente=e.target.checked;if(PEOPLE[u.id])PEOPLE[u.id].presidente=u.presidente;});
    b.appendChild(pr);
    if(u.admin)b.appendChild(h('<p class="muted">È amministratore: vede e modifica tutto.</p>'));
    else b.appendChild(permEditor(a=>{const m=M.find(x=>x.user_id===u.id&&x.area===a);return m&&m.livello;},async(as,l)=>{
      const q=l?CTX.sb.from('permessi').upsert(as.map(a=>({user_id:u.id,area:a,livello:l}))):CTX.sb.from('permessi').delete().eq('user_id',u.id).in('area',as);
      const {error}=await q;if(error){stEl.textContent='Errore: '+error.message;return;}
      as.forEach(a=>{const i=M.findIndex(x=>x.user_id===u.id&&x.area===a);if(i>=0)M.splice(i,1);if(l)M.push({user_id:u.id,area:a,livello:l});});stEl.textContent='Permesso aggiornato.';}));
    pc.querySelector('.ppl').appendChild(d);});
  el.appendChild(pc);
  const I=iv.data||[];
  if(I.length){const ic=h('<section class="card"><h3>Inviti in attesa · '+I.length+'</h3></section>');
    I.forEach(x=>{const ks=Object.keys(x.permessi||{}).filter(k=>k[0]!=='_');const secs=SEZ.filter(s=>s.v.some(v=>ks.includes(v[0]))).map(s=>s.n);
      const r=h('<div class="rq"><div><b>'+esc(x.nome||x.email)+'</b><span>'+esc(x.email)+' · '+(x.admin?'amministratore':(secs.join(', ')||'nessuna sezione'))+'</span></div><button type="button" class="bb soft sm">Annulla</button></div>');
      r.querySelector('button').addEventListener('click',async()=>{await CTX.sb.from('inviti').delete().eq('email',x.email);renderAdm2();});ic.appendChild(r);});
    el.appendChild(ic);}
  const G=rg.data||[];
  el.appendChild(h('<section class="card"><h3>Ultime modifiche</h3>'+(G.slice(0,30).map(x=>'<div class="rq"><div><b>'+esc(x.email||'—')+'</b><span>'+esc(x.cosa||'')+' · '+esc(pageTitle(x.area||''))+'</span></div><span class="muted small">'+new Date(x.quando).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</span></div>').join('')||'<p class="muted">Ancora nessuna modifica.</p>')+'</section>'));}
R['s-adm']=renderAdm2;

/* --- tempo reale e avvisi sul dispositivo --- */
function avviso(t){try{if(window.Notification&&Notification.permission==='granted'&&document.hidden)new Notification('Bruna27',{body:t});}catch(e){}}
function liveF1(){if(!CTX.sb)return;
  CTX.sb.channel('fase1')
   .on('postgres_changes',{event:'*',schema:'public',table:'voci_dati'},async()=>{await loadVD();if(EL[cur]||cur.startsWith('sec-')||cur==='p-home')rerender();})
   .on('postgres_changes',{event:'*',schema:'public',table:'richieste'},async()=>{await loadSocial();if(cur==='p-home'||cur==='p-req')rerender();})
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifiche'},async p=>{const n=p.new;if(!n||n.per!==CTX.user.id)return;NOTI.unshift(n);refreshBell();stEl.textContent=n.testo;avviso(n.testo);await loadSocial();if(cur==='p-home'||cur==='p-me'||cur==='p-cal')rerender();})
   .subscribe();}
async function avviaF1(){document.getElementById('avt').textContent=((CTX.prof.nome||CTX.prof.email||'?').trim().charAt(0)||'?').toUpperCase();buildNav();show('p-home');
  try{await Promise.all([loadSocial(),loadVD(),loadPref()]);}catch(e){}
  rerender();refreshBell();liveF1();}
