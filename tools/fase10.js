/* ================= Bruna27 · Economia riorganizzata: barra con 8 voci e sottosezioni (le pagine e i dati restano gli stessi) ================= */
const ECO_G=[
  {k:'b26',t:'Bilancio 2026',ic:'pie',p:[['s-bil','Bilancio'],['s-c26','Costi 2026'],['s-r26','Ricavi 2026']]},
  {k:'b27',t:'Bilancio 2027',ic:'trend',p:[['v-p27','Bilancio di previsione'],['s-pre','Costi 2027'],['s-ric','Ricavi 2027'],['v-cv','Schede delle voci']]},
  {k:'voci',t:'Costi e ricavi per voce',ic:'eq',p:[['v-voci','Costi e ricavi per voce']]},
  {k:'fatt',t:'Fatture',ic:'doc',p:[['v-fatt','Fatture'],['v-femit','Fatture da emettere']]},
  {k:'car',t:'Carità',ic:'heart',p:[['s-car','Fondo e contributi'],['v-care','Erogazioni']]},
  {k:'pil',t:'PIL generato',ic:'pin',p:[['s-ter','PIL generato']]},
  {k:'forn',t:'Fornitori',ic:'users',p:[['s-for','Fornitori 2026'],['v-for27','Fornitori 2027'],['v-pag','Pagamenti fornitori']]},
  {k:'prev',t:'Preventivi',ic:'doc',p:[['v-prev','Preventivi']]}];
const ECO_ID={};ECO_G.forEach(g=>g.p.forEach(([id])=>ECO_ID[id]=g));
// nomi più chiari, anche nella pagina dei permessi
[['v-p27','Bilancio di previsione 2027'],['s-pre','Costi 2027'],['s-ric','Ricavi 2027'],['v-voci','Costi e ricavi per voce'],['s-car','Carità: fondo e contributi']].forEach(([k,t])=>{if(VOCE[k])VOCE[k].t=t;const s=SEZ.find(x=>x.k==='eco');const v=s&&s.v.find(x=>x[0]===k);if(v)v[1]=t;});
// Costi 2026 e Ricavi 2026: due viste nuove sugli stessi dati del Bilancio 2026, con gli stessi permessi
VOCE['s-c26']={t:'Costi 2026',sec:'eco',ic:'down'};VOCE['s-r26']={t:'Ricavi 2026',sec:'eco',ic:'up'};
const _canSee10=CTX.canSee,_canEdit10=CTX.canEdit;const AL10={'s-c26':'s-bil','s-r26':'s-bil'};
CTX.canSee=k=>_canSee10(AL10[k]||k);CTX.canEdit=k=>_canEdit10(AL10[k]||k);
ensureSec('s-c26');ensureSec('s-r26');
function ecoVisibili(g){return g.p.filter(([id])=>canOpen(id));}
function primaDi(g){const v=ecoVisibili(g);return v.length?v[0][0]:null;}
function ecoBar(id){const g0=ECO_ID[id];const gs=ECO_G.filter(g=>primaDi(g));
  const w=h('<div class="ecobar"><nav class="ecotop" aria-label="Sezioni di Economia">'+gs.map(g=>'<button type="button" data-go="'+primaDi(g)+'"'+(g===g0?' aria-current="page"':'')+'>'+svg(IC2[g.ic]||IC2.doc)+'<span>'+esc(g.t)+'</span></button>').join('')+'</nav>'+
    (g0&&ecoVisibili(g0).length>1?'<div class="seg wrap ecosub" role="tablist">'+ecoVisibili(g0).map(([pid,t])=>'<button type="button" role="tab" data-go="'+pid+'" aria-pressed="'+(pid===id)+'" aria-selected="'+(pid===id)+'">'+esc(t)+'</button>').join('')+'</div>':'')+'</div>');
  return w;}
function mettiEcoBar(id){if(!ECO_ID[id])return;const el=document.getElementById(id);if(!el)return;const old=el.querySelector(':scope > .ecobar');if(old)old.remove();
  const b=ecoBar(id);const back=el.querySelector(':scope > .back');if(back)back.after(b);else el.insertBefore(b,el.firstChild);
  const a=b.querySelector('.ecotop [aria-current]');if(a)requestAnimationFrame(()=>{try{a.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}});}
const _addBack10=addBack;addBack=function(id){_addBack10(id);mettiEcoBar(id);};
// la pagina Economia: la barra e le otto voci
const _renderSec10=renderSec;renderSec=function(s){if(s.k!=='eco')return _renderSec10(s);const el=document.getElementById('sec-eco');el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Economia</span><h2>Economia</h2><p>Scegli una sezione per vederne i contenuti.</p></div>'));
  const gs=ECO_G.filter(g=>primaDi(g));const grid=h('<div class="tilegrid eco8"></div>');
  gs.forEach((g,i)=>{const sub=ecoVisibili(g).length>1?ecoVisibili(g).map(x=>x[1]).join(' · '):(tileInfo(g.p[0][0])||'');grid.appendChild(h('<button type="button" class="vtile'+(i===0?' first':'')+'" data-go="'+primaDi(g)+'"><span class="vic">'+svg(IC2[g.ic]||IC2.doc)+'</span><span class="vt">'+esc(g.t)+'</span>'+(sub?'<span class="vs">'+esc(sub)+'</span>':'')+'</button>'));});
  if(!gs.length)grid.appendChild(h('<div class="card soon"><p>Non hai ancora pagine di Economia.</p></div>'));el.appendChild(grid);};
SEZ.forEach(s=>{if(s.k==='eco')R['sec-eco']=()=>renderSec(s);});
// Costi 2026
R['s-c26']=function(){const el=document.getElementById('s-c26');el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Bilancio 2026</span><h2>Costi 2026</h2><p>Quanto è stato speso nel 2026, area per area. Tocca un’area per vedere le singole voci.</p></div>'));
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Costi 2026</span><b>'+eur(D.tot26)+'</b></div><div class="kpi"><span>Aree</span><b>'+D.bil.length+'</b></div><div class="kpi dark"><span>Ancora da pagare ai fornitori</span><b>'+eur(D.forn.reduce((s,f)=>s+(f.deb||0),0))+'</b></div></div>'));
  const max=Math.max(...D.bil.map(a=>a.t));
  D.bil.slice().sort((a,b)=>b.t-a.t).forEach(a=>{const vmax=Math.max(...a.voci.map(v=>v.v),1);
    el.appendChild(h('<details class="card ar10"><summary><span class="t">'+esc(a.n)+'</span><b>'+eur(a.t)+'</b><span class="pc">'+(D.tot26?Math.round(a.t/D.tot26*1000)/10:0).toLocaleString('it-IT')+'%</span><i style="--w:'+(a.t/max*100)+'%"></i></summary><div class="rows">'+a.voci.map((v,vi)=>'<div class="row" data-ed="bilV:'+a.id+'.'+vi+'"><span class="n">'+esc(v.n)+'</span><span class="num">'+eur(v.v)+'</span><div class="d">'+bar(v.v,vmax)+'</div></div>').join('')+'</div></details>'));});
  el.appendChild(h('<p class="muted small">Per modificare un importo usa «✎ Modifica» in alto (se hai il permesso): il totale e il Bilancio si aggiornano da soli.</p>'));};
// Ricavi 2026
R['s-r26']=function(){const el=document.getElementById('s-r26');el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Bilancio 2026</span><h2>Ricavi 2026</h2><p>Le entrate del 2026, voce per voce. Sono la base da cui partono i Ricavi 2027.</p></div>'));
  const own=D.ric.filter(r=>r.own).reduce((a,r)=>a+r.v26,0);
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Ricavi 2026</span><b>'+eur(D.ric26)+'</b></div><div class="kpi"><span>Entrate proprie</span><b>'+eur(own)+'</b></div><div class="kpi dark"><span>Risultato 2026</span><b class="'+(D.ric26-D.tot26<0?'neg':'pos')+'">'+eur(D.ric26-D.tot26)+'</b></div></div>'));
  const vmax=Math.max(...D.ric.map(r=>r.v26),1);
  el.appendChild(h('<section class="card"><div class="rows">'+D.ric.slice().sort((a,b)=>b.v26-a.v26).map(r=>'<div class="row"><span class="n">'+esc(r.n)+(r.own?' <span class="chip2">entrata propria</span>':'')+'</span><span class="num">'+eur(r.v26)+'</span><div class="d">'+bar(r.v26,vmax)+'</div></div>').join('')+'</div></section>'));
  el.appendChild(h('<p class="muted small">Gli importi del 2027 si scelgono in Bilancio 2027 → Ricavi 2027.</p>'));};
// richieste di fattura: solo chi può modificare l'area Economia (Fatture da emettere)
const puoFatt=()=>CTX.canEdit('v-femit');
