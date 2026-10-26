/* ================= Bruna27 · Percorsi sulla mappa: vie → percorso, elementi, Sicurezza, planimetrie, pubblicazione ================= */
let MAPEDIT=false;const MAPS={};const PSEL={};
const MATERA=[40.6664,16.6090];
const SOSTE=['Preghiera','Fuochi','Riposo','Musica','Benedizione','Altro'];
/* elementi della mappa: [nome, sigla, colore, è una linea, conta nella durata] */
const PT={uscita:['Uscita di emergenza','B','#1F6B4F'],bagno:['Bagni e servizi igienici','S','#2F6FD6'],soccorso:['Punto di soccorso','A','#C0392B'],acqua:['Distribuzione dell’acqua','T','#1A9BB0'],
  transenne:['Transenne','V','#6B6E7A',1],varco:['Varco di accesso','I','#D9822B'],preghiera:['Punto di preghiera','P','#7A4FB5',0,1],fuochi:['Punto fuochi','F','#E0662C',0,1],
  sosta:['Sosta del corteo','R','#0B2147',0,1],musica:['Momento musicale','M','#2A8C6F',0,1],altro:['Altro','+','#4B4E5A']};
const ATTIVITA=['sosta','preghiera','fuochi','musica'];
const FORN_COSA=['Transenne','Bagni chimici','Illuminazione','Impianto audio','Palco','Pulizia','Ambulanza'];
const STATI=['Bozza','Alla Sicurezza','Convalidato','Pubblicato'];
const SASSI=[[40.6713,16.6079],[40.6707,16.6127],[40.6668,16.6152],[40.6624,16.6143],[40.6629,16.6104],[40.6659,16.6093],[40.6689,16.6066]];
EL['v-perc']={f:[['nome','Nome del percorso','t']],intro:'',add:'Nuovo percorso',group:''};
EL['v-msic']={f:[['nome','Nome della mappa','t']],intro:'',add:'Carica una mappa',group:''};
delete COMING['v-perc'];delete COMING['v-psic'];delete COMING['v-msic'];
function extraVD(){return ['v-perc'];}
PAGEX['p-pub']='Percorsi pubblicati';ensureSec('p-pub');
R['v-perc']=renderPerc;R['v-psic']=renderPsic;R['v-msic']=renderMsic;R['p-pub']=renderPub;

/* --- strumenti di base --- */
async function leaflet(){if(window.L)return;const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l);
  await loadJs('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js');}
function mkMap(el,key,center,zoom){if(MAPS[key]){try{MAPS[key].remove();}catch(e){}}
  const m=L.map(el,{zoomControl:true,attributionControl:true}).setView(center||MATERA,zoom||16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);MAPS[key]=m;setTimeout(()=>m.invalidateSize(),60);return m;}
const pinIcon=(n,c,cls)=>L.divIcon({className:'pin '+(cls||''),html:'<b style="background:'+(c||'#0B2147')+'">'+n+'</b>',iconSize:[30,30],iconAnchor:[15,15]});
function distM(a,b){const R2=6371000,r=x=>x*Math.PI/180;const dl=r(b.lat-a.lat),dg=r(b.lng-a.lng);const s=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R2*Math.asin(Math.sqrt(s));}
function lung(T){let s=0;for(let i=1;i<T.length;i++)s+=distM(T[i-1],T[i]);return s;}
const pt=a=>({lat:a[0],lng:a[1]});
function linea(P){return (P.traccia&&P.traccia.length>1)?P.traccia.map(pt):(P.tappe||[]);}
function lungP(P){if(P.tratti&&P.tratti.length&&P.traccia)return P.tratti.reduce((a,b)=>a+b,0);return lung(P.tappe||[]);}
function inSassi(p){let c=false;for(let i=0,j=SASSI.length-1;i<SASSI.length;j=i++){const [yi,xi]=SASSI[i],[yj,xj]=SASSI[j];if(((yi>p.lat)!==(yj>p.lat))&&(p.lng<(xj-xi)*(p.lat-yi)/(yj-yi)+xi))c=!c;}return c;}
const fmtM=m=>m>=1000?(Math.round(m/100)/10).toString().replace('.',',')+' km':Math.round(m/10)*10+' m';
const elem=P=>P.elementi||[];
function durata(P){const cam=lungP(P)/1000*30;const so=elem(P).filter(e=>ATTIVITA.includes(e.t)).reduce((a,e)=>a+(+e.durata||0),0)+(P.tappe||[]).reduce((a,t)=>a+(t.sosta?(+t.min||0):0),0);return Math.round(cam+so);}
const fmtMin=m=>m>=60?Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m+' min';
function fine(P){if(!P.ora)return '';const [h,mi]=P.ora.split(':').map(Number);const t=h*60+mi+durata(P);return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
const uid=()=>'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
/* vecchi dati: soste nelle tappe e punti della Sicurezza diventano elementi della mappa */
function migra(P){P.elementi=P.elementi||[];let ch=false;
  (P.tappe||[]).forEach(t=>{if(t.sosta){P.elementi.push({id:uid(),t:{Preghiera:'preghiera',Fuochi:'fuochi',Musica:'musica'}[t.sosta]||'sosta',lat:t.lat,lng:t.lng,n:t.n||t.sosta,durata:+t.min||0});delete t.sosta;delete t.min;ch=true;}});
  if(P.sic&&P.sic.punti&&P.sic.punti.length){P.sic.punti.forEach(p=>P.elementi.push({id:uid(),t:p.t,lat:p.lat,lng:p.lng,n:p.n||'',da:'sicurezza'}));P.sic.punti=[];ch=true;}
  P.corteo=(P.corteo||[]).map(c=>typeof c==='string'?{n:c,funzione:'',note:''}:c);P.vie=P.vie||[];P.versioni=P.versioni||[];return ch;}
function firma(P){return hashS(JSON.stringify([(P.tappe||[]).map(t=>[+t.lat.toFixed(5),+t.lng.toFixed(5)]),elem(P).map(e=>[e.t,+e.lat.toFixed(5),+e.lng.toFixed(5),e.linea||0])]));}
function versione(P,evento){P.versioni=P.versioni||[];P.versioni.unshift({quando:new Date().toISOString(),chi:CTX.user.id,evento,tappe:(P.tappe||[]).length,elementi:elem(P).length});P.versioni=P.versioni.slice(0,40);}
const cambiataDopoVerifica=P=>!!(P.firma_verifica&&P.firma_verifica!==firma(P));
/* distanza lungo il percorso del punto più vicino */
function lungoIlPercorso(P,p){const Lp=linea(P);let acc=0,best=1e12,pos=0;for(let i=0;i<Lp.length;i++){if(i)acc+=distM(Lp[i-1],Lp[i]);const d=distM(Lp[i],p);if(d<best){best=d;pos=acc;}}return {pos,lontano:best};}
function percorsoPerAI(P){const T=P.tappe||[];return {nome:P.nome,data:P.data,ora:P.ora,anziani_o_disabili:!!P.fragili,vie:P.vie,lunghezza_m:Math.round(lungP(P)),durata_min:durata(P),segue_le_strade:!!P.traccia,
  tappe:T.map((t,i)=>({n:i+1,nome:t.n||'',lat:+t.lat.toFixed(5),lng:+t.lng.toFixed(5),nei_sassi:inSassi(t)})),
  elementi:elem(P).map(e=>({tipo:(PT[e.t]||PT.altro)[0],nome:e.n||'',orario:e.orario||'',durata_min:e.durata||0,responsabile:e.resp?nome(e.resp):'',lat:+e.lat.toFixed(5),lng:+e.lng.toFixed(5),metri_dal_via:Math.round(lungoIlPercorso(P,e).pos)})),
  corteo:(P.corteo||[]).map(c=>c.n+(c.funzione?' ('+c.funzione+')':'')),cambiata_dopo_la_verifica:cambiataDopoVerifica(P),avvisi_automatici:avvisi(P).map(a=>a[1])};}

/* --- controlli automatici --- */
function avvisi(P){const T=P.tappe||[],E=elem(P),out=[];const L1=lungP(P),du=durata(P);
  if(T.length<2){out.push(['info','Scrivi le vie e premi «Genera percorso», oppure tocca la mappa per mettere partenza e arrivo.']);return out;}
  if(cambiataDopoVerifica(P))out.push(['warn','La mappa è cambiata dopo la verifica della Sicurezza: va controllata di nuovo.']);
  if(!P.traccia)out.push(['info','Il tracciato è in linea retta tra le tappe: la lunghezza è approssimata. Premi «Ricalcola sulle strade».']);
  if(P.traccia_dubbi&&P.traccia_dubbi.length)out.push(['warn','Il tracciato potrebbe non passare da: '+P.traccia_dubbi.join(', ')+'. Controllalo sulla mappa.']);
  if(L1>2500)out.push(['warn','Il percorso è lungo '+fmtM(L1)+': controlla che il corteo riesca a farlo nei tempi.']);
  const h=P.ora?+P.ora.split(':')[0]:null;const mese=P.data?+P.data.slice(5,7):7;
  if(h!=null&&h>=11&&h<18&&mese>=6&&mese<=8)out.push(['warn','Si cammina nelle ore calde: prevedi acqua e tratti all’ombra.']);
  if(h!=null&&(h>=21||h<6))out.push(['info','Si cammina col buio: verifica l’illuminazione lungo tutto il percorso.']);
  const att=E.filter(e=>ATTIVITA.includes(e.t)).map(e=>({e,pos:lungoIlPercorso(P,e).pos})).sort((a,b)=>a.pos-b.pos);
  E.forEach(e=>{const x=lungoIlPercorso(P,e);if(ATTIVITA.includes(e.t)&&x.lontano>60)out.push(['info','«'+(e.n||PT[e.t][0])+'» è a '+Math.round(x.lontano)+' m dal percorso: controlla la posizione.']);});
  att.forEach(a=>{if(!a.e.durata)out.push(['info','Manca la durata di «'+(a.e.n||PT[a.e.t][0])+'».']);});
  for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++)if(E[i].t===E[j].t&&distM(E[i],E[j])<4){out.push(['info','Due elementi «'+PT[E[i].t][0]+'» sono uno sopra l’altro: forse uno è in più.']);i=E.length;break;}
  if(P.fragili){
    if(L1>1200)out.push(['warn','Per anziani e persone con disabilità '+fmtM(L1)+' sono tanti: accorcia il percorso o aggiungi soste di riposo.']);
    const marks=[0].concat(att.map(a=>a.pos)).concat([L1]);for(let i=1;i<marks.length;i++){if(marks[i]-marks[i-1]>500){out.push(['warn','C’è un tratto di '+fmtM(marks[i]-marks[i-1])+' senza soste: aggiungi una sosta di riposo.']);break;}}
    if(T.some(inSassi)||linea(P).some(inSassi))out.push(['warn','Il percorso entra nella zona dei Sassi: scalinate e salite, difficile per carrozzine e per chi cammina male. Prevedi un percorso alternativo o un mezzo.']);
    if(du>75)out.push(['warn','Durata stimata '+fmtMin(du)+': per anziani e disabili è lunga.']);}
  if(P.stato&&P.stato!=='Bozza'&&P.stato!=='Rimandato'){
    if(!E.some(e=>e.t==='soccorso'))out.push(['warn','Manca un punto di soccorso.']);
    if(!E.some(e=>e.t==='uscita'))out.push(['info','Non è segnata nessuna uscita di emergenza.']);
    const bagni=E.filter(e=>e.t==='bagno');att.forEach(a=>{if(!bagni.length||Math.min(...bagni.map(b=>distM(b,a.e)))>400)out.push(['info','Nessun bagno entro 400 m da «'+(a.e.n||PT[a.e.t][0])+'».']);});}
  if(!out.length)out.push(['ok','Nessun problema trovato dai controlli automatici.']);return out;}
function avvisiHtml(P){return '<section class="card"><div class="wh"><span class="orb"></span><b>Avvisi sul percorso</b></div>'+avvisi(P).map(([k,t])=>'<p class="avv '+k+'">'+esc(t)+'</p>').join('')+'<p class="muted small">Sono controlli automatici di supporto: la zona dei Sassi è indicativa. Le verifiche vere spettano alla Sicurezza, con sopralluogo.</p></section>';}
function statoChip(s){const c=s==='Pubblicato'||s==='Convalidato'?'ok':s==='Rimandato'?'ko':'';return '<span class="chip2 '+c+'">'+esc(s||'Bozza')+'</span>';}
function steps(s){const i=s==='Rimandato'?0:Math.max(0,STATI.indexOf(s||'Bozza'));return '<div class="flow">'+['Bozza','Sicurezza','Convalidato','Pubblicato'].map((n,k)=>'<span class="'+(k<i?'done':k===i?'now':'')+'">'+n+'</span>').join('')+'</div>';}
const legenda=()=>'<div class="legend">'+Object.values(PT).map(d=>'<span><i style="background:'+d[2]+'">'+d[1]+'</i>'+d[0]+'</span>').join('')+'</div>';

/* --- disegno di percorso ed elementi --- */
function drawRoute(m,P,opt){opt=opt||{};const T=P.tappe||[];const lay=L.layerGroup().addTo(m);
  const Lp=linea(P);if(Lp.length>1)L.polyline(Lp.map(t=>[t.lat,t.lng]),{color:'#24478F',weight:6,opacity:.85,dashArray:P.traccia?null:'8 8'}).addTo(lay);
  T.forEach((t,i)=>{const mk=L.marker([t.lat,t.lng],{icon:pinIcon(i===0?'P':i===T.length-1?'A':i+1,i===0?'#1F6B4F':i===T.length-1?'#C0392B':'#0B2147','tp'),draggable:!!opt.drag}).addTo(lay);
    mk.bindTooltip((i===0?'Partenza':i===T.length-1?'Arrivo':'Tappa '+(i+1))+(t.n?' · '+t.n:''));if(opt.drag)mk.on('dragend',()=>{const p=mk.getLatLng();t.lat=p.lat;t.lng=p.lng;opt.onChange&&opt.onChange('tappe');});});
  elem(P).forEach(e=>{const d=PT[e.t]||PT.altro;
    if(e.linea&&e.linea.length>1){const pl=L.polyline(e.linea,{color:d[2],weight:7,opacity:.9,dashArray:'2 10',lineCap:'round'}).addTo(lay);pl.bindTooltip(d[0]+(e.n?' · '+e.n:''));if(opt.onElem)pl.on('click',ev=>{L.DomEvent.stopPropagation(ev);opt.onElem(e);});}
    const mk=L.marker([e.lat,e.lng],{icon:pinIcon(d[1],d[2],'sq'),draggable:!!opt.dragElem}).addTo(lay);
    mk.bindTooltip(d[0]+(e.n?' · '+e.n:'')+(e.orario?' · ore '+e.orario:'')+(e.durata&&ATTIVITA.includes(e.t)?' · '+e.durata+' min':''));
    if(opt.onElem)mk.on('click',ev=>{L.DomEvent.stopPropagation(ev);opt.onElem(e);});
    if(opt.dragElem)mk.on('dragend',()=>{const p=mk.getLatLng();const dl=p.lat-e.lat,dg=p.lng-e.lng;e.lat=p.lat;e.lng=p.lng;if(e.linea)e.linea=e.linea.map(q=>[q[0]+dl,q[1]+dg]);opt.onChange&&opt.onChange('elementi');});});
  const all=Lp.map(t=>[t.lat,t.lng]).concat(elem(P).map(e=>[e.lat,e.lng]));
  if(all.length&&opt.fit!==false)m.fitBounds(L.latLngBounds(all).pad(0.25),{maxZoom:18});return lay;}

/* --- strade: cerca le vie e segui le strade a piedi (OpenStreetMap, gratuito) --- */
const NOMI='https://nominatim.openstreetmap.org/search';
const ROUTERS=['https://routing.openstreetmap.de/routed-foot/route/v1/driving/','https://router.project-osrm.org/route/v1/foot/'];
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const normNome=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\b(via|vico|piazza|piazzetta|largo|corso|viale|strada|contrada|recinto|rione|salita|discesa|vicolo|della|delle|dello|dei|degli|del|di|de|san|santa|ss)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
async function cercaVia(q){const u=NOMI+'?format=jsonv2&polygon_geojson=1&limit=5&countrycodes=it&viewbox=16.55,40.70,16.66,40.63&bounded=1&accept-language=it&q='+encodeURIComponent(q+', Matera');
  const res=await fetch(u,{headers:{'Accept':'application/json'}});if(!res.ok)throw new Error('servizio');const L1=await res.json();if(!L1.length)return null;
  const best=L1.find(x=>x.category==='highway'||x.class==='highway')||L1.find(x=>/square|place|pedestrian/.test(x.type||''))||L1[0];
  const g=best.geojson||{type:'Point',coordinates:[+best.lon,+best.lat]};let pts=[];
  const add=c=>pts.push({lat:c[1],lng:c[0]});
  if(g.type==='Point')add(g.coordinates);else if(g.type==='LineString')g.coordinates.forEach(add);else if(g.type==='MultiLineString')g.coordinates.forEach(l=>l.forEach(add));
  else if(g.type==='Polygon')g.coordinates[0].forEach(add);else if(g.type==='MultiPolygon')g.coordinates.forEach(p=>p[0].forEach(add));
  if(!pts.length)add([+best.lon,+best.lat]);return {q,nome:best.name||best.display_name.split(',')[0],pts,linea:g.type.includes('Line'),centro:{lat:+best.lat,lng:+best.lon}};}
function vicini(A,B){let best={d:1e12};A.pts.forEach(a=>B.pts.forEach(b=>{const d=distM(a,b);if(d<best.d)best={d,a,b};}));return best;}
async function instrada(T){let ultimo='';for(const base of ROUTERS){try{const u=base+T.map(t=>t.lng.toFixed(6)+','+t.lat.toFixed(6)).join(';')+'?overview=full&geometries=geojson&steps=true';
    const res=await fetch(u);if(!res.ok){ultimo=String(res.status);continue;}const j=await res.json();if(j.code!=='Ok'||!j.routes||!j.routes[0]){ultimo=j.code||'';continue;}
    const r=j.routes[0];return {traccia:r.geometry.coordinates.map(c=>[c[1],c[0]]),tratti:r.legs.map(l=>l.distance),nomi:r.legs.flatMap(l=>(l.steps||[]).map(s=>s.name||''))};}catch(e){ultimo=e.message;}}
  throw new Error('Il servizio delle strade non risponde'+(ultimo?' ('+ultimo+')':''));}
async function generaDaVie(P,vie,partenza,arrivo,log){const items=[];const ord=[];if(partenza)ord.push(['p',partenza]);vie.forEach(v=>ord.push(['v',v]));if(arrivo)ord.push(['a',arrivo]);
  if(ord.filter(o=>o[0]==='v').length<1)throw new Error('Scrivi almeno una via.');
  for(const [k,q] of ord){log('Cerco «'+q+'»…');const r=await cercaVia(q);if(!r)throw new Error('Non trovo «'+q+'» a Matera: controlla come è scritto.');r.k=k;items.push(r);await pausa(1100);}
  const way=[];const nomiTappe=[];
  for(let i=0;i<items.length-1;i++){const v=vicini(items[i],items[i+1]);if(v.d>60&&!(items[i].k!=='v'||items[i+1].k!=='v'))throw new Error('«'+items[i].q+'» e «'+items[i+1].q+'» non si toccano (distano '+Math.round(v.d)+' m): aggiungi in mezzo la via che le collega.');
    items[i].uscita=v.a;items[i+1].entrata=v.b;}
  items.forEach((it,i)=>{
    if(i===0){const p=it.k==='v'&&it.uscita&&it.linea?it.pts.reduce((b,x)=>distM(x,it.uscita)>distM(b,it.uscita)?x:b,it.pts[0]):(it.k==='v'?it.pts[0]:it.centro);way.push(p);nomiTappe.push(it.nome);}
    if(i>0&&it.entrata){if(it.k==='v'&&items[i-1].k==='v'){const mid={lat:(it.entrata.lat+items[i-1].uscita.lat)/2,lng:(it.entrata.lng+items[i-1].uscita.lng)/2};way.push(mid);nomiTappe.push(items[i-1].nome+' / '+it.nome);}else if(it.k==='v'){way.push(it.entrata);nomiTappe.push(it.nome);}}
    if(it.linea&&it.pts.length>2&&it.entrata&&it.uscita){const ia=it.pts.indexOf(it.entrata),ib=it.pts.indexOf(it.uscita);if(ia>=0&&ib>=0&&Math.abs(ia-ib)>2){const mid=it.pts[Math.round((ia+ib)/2)];way.push(mid);nomiTappe.push(it.nome);}}
    if(i===items.length-1){const p=it.k==='v'&&it.entrata&&it.linea?it.pts.reduce((b,x)=>distM(x,it.entrata)>distM(b,it.entrata)?x:b,it.pts[0]):(it.k==='v'?it.pts[it.pts.length-1]:it.centro);way.push(p);nomiTappe.push(it.nome);}});
  log('Disegno il percorso sulle strade…');let r;
  try{r=await instrada(way);}catch(e){const tr=[];items.forEach(it=>{if(it.k!=='v'||!it.linea){tr.push(it.k==='v'?it.pts[0]:it.centro);return;}
      const a=it.entrata?it.pts.indexOf(it.entrata):-1,b=it.uscita?it.pts.indexOf(it.uscita):-1;let s0=a>=0?a:(b>=0&&b<it.pts.length/2?it.pts.length-1:0),s1=b>=0?b:(s0===0?it.pts.length-1:0);
      const seg=s0<=s1?it.pts.slice(s0,s1+1):it.pts.slice(s1,s0+1).reverse();seg.forEach(q=>tr.push(q));});
    if(tr.length<2)throw e;const cum=[0];for(let i=1;i<tr.length;i++)cum.push(cum[i-1]+distM(tr[i-1],tr[i]));
    let j0=0;const pos=way.map(w=>{let bi=j0,bd=1e12;for(let j=j0;j<tr.length;j++){const d=distM(tr[j],w);if(d<bd){bd=d;bi=j;}}j0=bi;return cum[bi];});pos[pos.length-1]=cum[cum.length-1];
    const tratti=pos.slice(1).map((x,i)=>Math.max(0,x-pos[i]));r={traccia:tr.map(q=>[q.lat,q.lng]),tratti,nomi:items.map(it=>it.nome)};log('Il servizio delle strade non risponde: uso le vie trovate.');}
  const visti=r.nomi.map(normNome).join(' | ');const dubbi=items.filter(it=>it.k==='v'&&normNome(it.nome)&&!visti.includes(normNome(it.nome))).map(it=>it.q);
  P.tappe=way.map((p,i)=>({lat:p.lat,lng:p.lng,n:nomiTappe[i]||''}));P.traccia=r.traccia;P.tratti=r.tratti;P.traccia_dubbi=dubbi;P.vie=vie;P.partenza=partenza;P.arrivo=arrivo;return dubbi;}
async function ricalcola(P){if((P.tappe||[]).length<2){P.traccia=null;P.tratti=null;return;}const r=await instrada(P.tappe);P.traccia=r.traccia;P.tratti=r.tratti;P.traccia_dubbi=[];}

/* --- salvataggio e avvisi --- */
async function salvaP(r){r.dati.aggiornato_il=new Date().toISOString();const {error}=await CTX.sb.from('voci_dati').update({dati:r.dati,aggiornato:new Date().toISOString()}).eq('id',r.id);stEl.textContent=error?'Non salvato: '+error.message:'Salvato.';return !error;}
let saveT=null;function autoSave(r){clearTimeout(saveT);stEl.textContent='Salvo…';saveT=setTimeout(()=>salvaP(r),700);}
async function avvisa(area,testo,link){try{await CTX.sb.rpc('notifica_area',{a_area:area,a_testo:testo,a_link:link});}catch(e){}}
async function avvisaUtente(uid,testo,link){try{await CTX.sb.rpc('notifica_utente',{a_uid:uid,a_testo:testo,a_link:link});}catch(e){}}
const vperc=()=>VD['v-perc']||[];
const findP=id=>vperc().find(r=>r.id===id);
function percCard(r,sel,key){const P=r.dati;migra(P);const c=h('<article class="card rc"><div class="chips">'+statoChip(P.stato)+(P.fragili?'<span class="chip2">Anziani e disabili</span>':'')+(cambiataDopoVerifica(P)?'<span class="chip2 ko">Cambiato dopo la verifica</span>':'')+'</div><b class="vn">'+esc(P.nome||'Senza nome')+'</b><div class="fact2"><span>Quando</span><b>'+(P.data?fmtD(P.data):'data da decidere')+(P.ora?' · ore '+esc(P.ora):'')+'</b></div><div class="fact2"><span>Lunghezza</span><b>'+fmtM(lungP(P))+' · '+fmtMin(durata(P))+'</b></div><div class="fact2"><span>Sulla mappa</span><b>'+(P.tappe||[]).length+' tappe · '+elem(P).length+' elementi</b></div><button type="button" class="bb dark">Apri</button></article>');
  c.querySelector('.bb').addEventListener('click',()=>{PSEL[key]=r.id;rerender();window.scrollTo({top:0});});return c;}
function backTo(key,label){const b=h('<button type="button" class="back">‹ '+esc(label)+'</button>');b.addEventListener('click',()=>{PSEL[key]=null;MAPEDIT=false;rerender();});return b;}
function prevPerc(P){return (VD['v-prev']||[]).filter(x=>(x.dati.voce||'').startsWith('Percorso '+P.nome+' – '));}

/* --- la mappa con la barra degli strumenti (organizzatori e Sicurezza) --- */
function editorMappa(box,r,o){const P=r.dati;let tool=o.route?'tappa':null,lineaTmp=null;
  const tb=h('<div class="mtools">'+(o.route?'<button type="button" data-tool="tappa" aria-pressed="true"><i class="dotp" style="background:#0B2147">+</i> Tappa del percorso</button>':'')+(o.elem?Object.entries(PT).map(([k,d])=>'<button type="button" data-tool="'+k+'" aria-pressed="false" title="'+esc(d[0])+'"><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> '+esc(d[0])+'</button>').join(''):'')+'</div>');
  const hint=h('<p class="hint"></p>');const fineL=h('<button type="button" class="bb dark sm" hidden>Fine transenne</button>');
  if(o.route||o.elem){box.appendChild(tb);box.appendChild(hint);}
  const mapEl=h('<div class="lmap tall"></div>');box.appendChild(mapEl);if(o.route||o.elem)box.appendChild(fineL);box.appendChild(h(legenda()));
  const m=mkMap(mapEl,o.key);let lay=null,tmp=null;
  const setHint=()=>{hint.textContent=!tool?'':tool==='tappa'?'Tocca la mappa per aggiungere una tappa. Trascina i numeri per spostarli: il percorso si ridisegna sulle strade.':PT[tool][3]?'Tocca la mappa punto per punto lungo le transenne, poi premi «Fine transenne».':'Tocca la mappa dove mettere «'+PT[tool][0]+'». Toccalo di nuovo per scrivere orario, durata, responsabile e note, spostarlo, duplicarlo o eliminarlo.';};
  const draw=fit=>{if(!document.body.contains(m.getContainer()))return;if(lay)lay.remove();lay=drawRoute(m,P,{fit,drag:o.route,dragElem:o.elem,onChange:k=>{if(k==='tappe')o.onRoute();else o.onChange();draw(false);},onElem:e=>schedaElemento(P,e,o.elem,()=>{o.onChange();draw(false);})});};
  tb.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;lineaTmp=null;if(tmp){tmp.remove();tmp=null;}fineL.hidden=true;tb.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));setHint();}));
  m.on('click',e=>{if(!tool)return;const p={lat:e.latlng.lat,lng:e.latlng.lng};
    if(tool==='tappa'){P.tappe=P.tappe||[];P.tappe.push({lat:p.lat,lng:p.lng,n:''});o.onRoute();draw(false);return;}
    if(PT[tool][3]){lineaTmp=lineaTmp||[];lineaTmp.push([p.lat,p.lng]);if(tmp)tmp.remove();tmp=L.polyline(lineaTmp,{color:PT[tool][2],weight:7,dashArray:'2 10'}).addTo(m);fineL.hidden=lineaTmp.length<2;return;}
    const el={id:uid(),t:tool,lat:p.lat,lng:p.lng,n:'',da:o.chi,quando:new Date().toISOString()};P.elementi=P.elementi||[];P.elementi.push(el);o.onChange();draw(false);
    if(ATTIVITA.includes(tool))schedaElemento(P,el,true,()=>{o.onChange();draw(false);});});
  fineL.addEventListener('click',()=>{if(!lineaTmp||lineaTmp.length<2)return;const c=lineaTmp[Math.floor(lineaTmp.length/2)];P.elementi=P.elementi||[];P.elementi.push({id:uid(),t:'transenne',lat:c[0],lng:c[1],linea:lineaTmp,n:'',da:o.chi,quando:new Date().toISOString()});lineaTmp=null;if(tmp){tmp.remove();tmp=null;}fineL.hidden=true;o.onChange();draw(false);});
  setHint();draw(true);return {redraw:draw,map:m};}
function schedaElemento(P,e,can,dopo){const d=PT[e.t]||PT.altro;const ppl=Object.values(PEOPLE);
  if(!can){sheet(d[0]+(e.n?' · '+e.n:''),'<div class="fact2"><span>Orario</span><b>'+esc(e.orario||'—')+'</b></div>'+(ATTIVITA.includes(e.t)?'<div class="fact2"><span>Durata</span><b>'+(e.durata?e.durata+' min':'—')+'</b></div>':'')+'<div class="fact2"><span>Responsabile</span><b>'+(e.resp?esc(nome(e.resp)):'—')+'</b></div>'+(e.descr?'<p>'+esc(e.descr)+'</p>':'')+(e.sicur?'<p><b>Sicurezza:</b> '+esc(e.sicur)+'</p>':'')+(e.note?'<p class="muted">'+esc(e.note)+'</p>':''),'Chiudi',async()=>{});return;}
  const dl=sheet(d[0],'<div class="ctl"><label for="el_t">Tipo</label><select id="el_t">'+Object.entries(PT).map(([k,x])=>'<option value="'+k+'"'+(k===e.t?' selected':'')+'>'+esc(x[0])+'</option>').join('')+'</select></div><div class="ctl"><label for="el_n">Nome o descrizione breve</label><input type="text" id="el_n" value="'+esc(e.n||'')+'" placeholder="Per esempio: preghiera davanti a San Francesco"></div><div class="when"><div class="ctl"><label for="el_o">Orario previsto</label><input type="time" id="el_o" value="'+esc(e.orario||'')+'"></div><div class="ctl"><label for="el_d">Durata (minuti)</label><input type="number" id="el_d" inputmode="numeric" min="0" value="'+esc(e.durata||'')+'"></div></div><div class="ctl"><label for="el_r">Responsabile</label><select id="el_r"><option value="">Nessuno</option>'+ppl.map(p=>'<option value="'+p.id+'"'+(p.id===e.resp?' selected':'')+'>'+esc(p.nome||p.email)+'</option>').join('')+'</select></div><div class="ctl"><label for="el_x">Cosa serve (organizzazione)</label><textarea id="el_x">'+esc(e.descr||'')+'</textarea></div><div class="ctl"><label for="el_s">Esigenze di sicurezza</label><input type="text" id="el_s" value="'+esc(e.sicur||'')+'"></div><label class="ck"><input type="checkbox" id="el_f"'+(e.forn?' checked':'')+'> Servono fornitori qui</label><div class="ctl"><label for="el_no">Note</label><textarea id="el_no">'+esc(e.note||'')+'</textarea></div><div class="big-btns"><button type="button" class="bb soft sm" id="el_dup">Duplica</button><button type="button" class="bb soft sm ko" id="el_del">Elimina</button></div>','Salva',async(x)=>{
    e.t=x.querySelector('#el_t').value;e.n=x.querySelector('#el_n').value.trim();e.orario=x.querySelector('#el_o').value;e.durata=Math.max(0,+x.querySelector('#el_d').value||0);e.resp=x.querySelector('#el_r').value;e.descr=x.querySelector('#el_x').value.trim();e.sicur=x.querySelector('#el_s').value.trim();e.forn=x.querySelector('#el_f').checked;e.note=x.querySelector('#el_no').value.trim();
    if(e.resp&&e.resp!==CTX.user.id&&!e.avvisato){e.avvisato=e.resp;avvisaUtente(e.resp,'Sei responsabile di «'+(e.n||d[0])+'» nel percorso «'+P.nome+'»','v-perc');}dopo();});
  dl.querySelector('#el_dup').addEventListener('click',()=>{const c=JSON.parse(JSON.stringify(e));c.id=uid();c.lat+=0.00012;c.lng+=0.00012;if(c.linea)c.linea=c.linea.map(q=>[q[0]+0.00012,q[1]+0.00012]);delete c.avvisato;P.elementi.push(c);dl.remove();dopo();});
  dl.querySelector('#el_del').addEventListener('click',()=>{P.elementi=P.elementi.filter(x=>x!==e);dl.remove();dopo();});}
function listaElementi(P){const E=elem(P);if(!E.length)return '<p class="muted">Nessun elemento sulla mappa.</p>';const g={};E.forEach(e=>(g[e.t]=g[e.t]||[]).push(e));
  return Object.entries(g).map(([t,L1])=>{const d=PT[t]||PT.altro;return '<div class="eg"><div class="egh"><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> <b>'+esc(d[0])+'</b> <span class="muted small">'+L1.length+'</span></div>'+L1.map(e=>'<div class="egi">'+esc(e.n||'senza nome')+(e.orario?' · ore '+esc(e.orario):'')+(e.durata&&ATTIVITA.includes(e.t)?' · '+e.durata+' min':'')+(e.resp?' · '+esc(nome(e.resp)):'')+(e.forn?' · servono fornitori':'')+'</div>').join('')+'</div>';}).join('');}
function storicoHtml(P){const V=P.versioni||[];if(!V.length)return '';return '<details class="card storico"><summary><b>Storico delle modifiche</b> <span class="muted small">'+V.length+'</span></summary>'+V.map(v=>'<div class="rq"><div><b>'+esc(v.evento)+'</b><span>'+esc(nome(v.chi))+' · '+new Date(v.quando).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</span></div><span class="muted small">'+v.tappe+' tappe · '+v.elementi+' elementi</span></div>').join('')+'</details>';}

/* --- Percorsi (Eventi) --- */
async function renderPerc(){const id='v-perc',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);
  const r=PSEL[id]&&findP(PSEL[id]);if(r)return editorPerc(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Eventi</span><h2>Percorsi</h2><p>Scrivi le vie in ordine e premi «Genera percorso»: il tracciato segue le strade di Matera. Poi aggiungi soste, preghiere, fuochi e servizi con i pulsanti sulla mappa, e lo mandi alla Sicurezza.</p></div>'));
  if(can)el.appendChild(addBtn('+ Nuovo percorso',()=>sheet('Nuovo percorso','<div class="ctl"><label for="np_n">Nome</label><input type="text" id="np_n" placeholder="Processione dei pastori"></div><div class="when"><div class="ctl"><label for="np_d">Giorno</label><input type="date" id="np_d"></div><div class="ctl"><label for="np_o">Ora di partenza</label><input type="time" id="np_o"></div></div><label class="ck"><input type="checkbox" id="np_f"> Partecipano anziani o persone con disabilità</label>','Crea',async(dl)=>{
    const n=dl.querySelector('#np_n').value.trim();if(!n){dl.querySelector('.smsg').textContent='Scrivi il nome.';return false;}
    const dati={nome:n,data:dl.querySelector('#np_d').value,ora:dl.querySelector('#np_o').value,fragili:dl.querySelector('#np_f').checked,tappe:[],elementi:[],vie:[],corteo:[],forn:{serve:false,cosa:[]},stato:'Bozza',autore:CTX.user.id,versioni:[]};versione(dati,'Percorso creato');
    const {data,error}=await CTX.sb.from('voci_dati').insert({voce:id,dati}).select().single();if(error)throw new Error(error.message);
    await loadVD();PSEL[id]=data.id;rerender();})));
  const L1=vperc();const g=h('<div class="cgrid"></div>');L1.slice().reverse().forEach(r=>g.appendChild(percCard(r,null,id)));el.appendChild(g);
  if(!L1.length)el.appendChild(h('<div class="card soon"><p>Ancora nessun percorso.</p></div>'));}
async function editorPerc(el,r,can){const P=r.dati;if(migra(P)&&can)autoSave(r);const edit=can&&(P.stato==='Bozza'||P.stato==='Rimandato'||!P.stato);MAPEDIT=true;
  el.appendChild(backTo('v-perc','Tutti i percorsi'));
  el.appendChild(h('<div class="sh"><span class="eyb">Percorso</span><h2>'+esc(P.nome)+'</h2>'+steps(P.stato)+'<div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(P.stato==='Rimandato'&&P.nota_sic)el.appendChild(h('<section class="card hot"><b>La Sicurezza lo ha rimandato indietro</b><p style="margin:0">'+esc(P.nota_sic)+'</p></section>'));
  if(P.riaperto)el.appendChild(h('<section class="card hot"><b>Percorso riaperto dopo la verifica</b><p style="margin:0">Quando hai finito le modifiche rimandalo alla Sicurezza: va controllato di nuovo.</p></section>'));
  const gen=h('<section class="card"><h3>Genera il percorso dalle vie</h3><p class="muted small">Scrivi le vie nell’ordine in cui passa il corteo. Partenza e arrivo sono facoltativi (per esempio una piazza).</p><div class="ctl"><label for="gv_p">Partenza</label><input type="text" id="gv_p" value="'+esc(P.partenza||'')+'" placeholder="Per esempio: Piazza San Francesco"></div><div class="lab">Vie attraversate, in ordine</div><div class="vlist"></div><button type="button" class="lnk2" id="gv_add">+ Aggiungi una via</button><div class="ctl"><label for="gv_a">Arrivo</label><input type="text" id="gv_a" value="'+esc(P.arrivo||'')+'" placeholder="Per esempio: Piazza Duomo"></div><div class="big-btns"><button type="button" class="bb dark" id="gv_go">Genera percorso</button>'+((P.tappe||[]).length>1?'<button type="button" class="bb soft" id="gv_rc">Ricalcola sulle strade</button>':'')+'</div><p class="gmsg" role="status"></p></section>');
  if(edit)el.appendChild(gen);
  const mapC=h('<section class="card mapcard"></section>');el.appendChild(mapC);
  const info=h('<div class="big3 mini"><div class="kpi"><span>Lunghezza</span><b id="pl"></b></div><div class="kpi"><span>Durata stimata</span><b id="pdu"></b></div><div class="kpi dark"><span>Orario</span><b id="por"></b></div></div>');el.appendChild(info);
  const tl=h('<section class="card"><h3>Tappe del percorso</h3><div class="tlist"></div></section>');el.appendChild(tl);
  const el2=h('<section class="card"><h3>Elementi sulla mappa</h3><div class="elist"></div></section>');el.appendChild(el2);
  const avv=h('<div></div>');el.appendChild(avv);
  const cor=h('<section class="card"><h3>Ordine del corteo</h3><p class="muted small">Dall’alto in basso: chi apre e chi chiude il corteo. Per ogni gruppo puoi scrivere la funzione e delle note.</p><div class="clist"></div>'+(edit?'<div class="when"><div class="ctl" style="flex:3 1 200px"><label for="ca">Aggiungi un gruppo o un’associazione</label><input type="text" id="ca" placeholder="Per esempio: Banda di Matera"></div></div><button type="button" class="bb sm" id="cadd">Aggiungi al corteo</button>':'')+'</section>');el.appendChild(cor);
  const dati=h('<section class="card"><h3>Dati del percorso</h3><div class="when"><div class="ctl"><label for="pd_d">Giorno</label><input type="date" id="pd_d" value="'+esc(P.data||'')+'"></div><div class="ctl"><label for="pd_o">Ora di partenza</label><input type="time" id="pd_o" value="'+esc(P.ora||'')+'"></div></div><label class="ck"><input type="checkbox" id="pd_f"'+(P.fragili?' checked':'')+'> Partecipano anziani o persone con disabilità</label><div class="ctl"><label for="pd_v">Vincoli logistici</label><textarea id="pd_v" placeholder="Per esempio: passaggio stretto in via Ridola">'+esc(P.vincoli||'')+'</textarea></div><div class="lab">Servono fornitori?</div><label class="ck"><input type="checkbox" id="pd_fs"'+(P.forn&&P.forn.serve?' checked':'')+'> Sì, dopo la Sicurezza chiedo i preventivi per:</label><div class="checks fc">'+FORN_COSA.map(x=>'<label><input type="checkbox" value="'+esc(x)+'"'+(P.forn&&(P.forn.cosa||[]).includes(x)?' checked':'')+'> '+esc(x)+'</label>').join('')+'</div></section>');
  if(!edit)dati.querySelectorAll('input,textarea').forEach(x=>x.disabled=true);el.appendChild(dati);
  await leaflet();if(cur!=='v-perc')return;
  const changedP=()=>{if(edit)autoSave(r);refreshInfo();};
  let routeT=null;const onRoute=()=>{refreshInfo();clearTimeout(routeT);routeT=setTimeout(async()=>{try{stEl.textContent='Ridisegno sulle strade…';await ricalcola(P);}catch(e){P.traccia=null;P.tratti=null;stEl.textContent=e.message+': per ora il tracciato è in linea retta.';}ed.redraw(false);refreshInfo();changedP();},700);changedP();};
  const ed=editorMappa(mapC,r,{key:'perc',route:edit,elem:edit,chi:'organizzazione',onRoute,onChange:changedP});
  function refreshInfo(){info.querySelector('#pl').textContent=fmtM(lungP(P));info.querySelector('#pdu').textContent=fmtMin(durata(P));info.querySelector('#por').textContent=P.ora?P.ora+(fine(P)?' → '+fine(P):''):'da decidere';
    avv.innerHTML='';const ah=h(avvisiHtml(P));aiPercBtn(ah,P);avv.appendChild(ah);drawList();el2.querySelector('.elist').innerHTML=listaElementi(P);}
  function drawList(){const box=tl.querySelector('.tlist');box.innerHTML='';const T=P.tappe||[];
    if(!T.length)box.appendChild(h('<p class="muted">Nessuna tappa.</p>'));
    T.forEach((t,i)=>{const dd=P.tratti&&P.traccia&&P.tratti[i]!=null&&i<T.length-1?P.tratti[i]:(i<T.length-1?distM(t,T[i+1]):null);
      const row=h('<div class="tappa"><span class="tn">'+(i===0?'P':i===T.length-1?'A':i+1)+'</span><div class="tb2">'+(edit?'<input type="text" class="tnm" value="'+esc(t.n||'')+'" placeholder="'+(i===0?'Partenza':i===T.length-1?'Arrivo':'Nome del luogo')+'" aria-label="Nome della tappa '+(i+1)+'">':'<b>'+esc(t.n||(i===0?'Partenza':i===T.length-1?'Arrivo':'Tappa '+(i+1)))+'</b>')+(dd!=null?'<span class="muted small">'+fmtM(dd)+' fino alla tappa successiva</span>':'')+'</div>'+(edit?'<div class="tbtn"><button type="button" aria-label="Su">↑</button><button type="button" aria-label="Giù">↓</button><button type="button" class="ko" aria-label="Togli">×</button></div>':'')+'</div>');
      if(edit){row.querySelector('.tnm').addEventListener('change',e=>{t.n=e.target.value.trim();changedP();});const [up,dn,x]=row.querySelectorAll('.tbtn button');
        up.addEventListener('click',()=>{if(i>0){[T[i-1],T[i]]=[T[i],T[i-1]];ed.redraw(false);onRoute();}});dn.addEventListener('click',()=>{if(i<T.length-1){[T[i+1],T[i]]=[T[i],T[i+1]];ed.redraw(false);onRoute();}});x.addEventListener('click',()=>{T.splice(i,1);ed.redraw(false);onRoute();});}
      box.appendChild(row);});}
  const drawCor=()=>{const box=cor.querySelector('.clist');box.innerHTML='';const C=P.corteo=P.corteo||[];
    if(!C.length)box.appendChild(h('<p class="muted">Nessun gruppo inserito.</p>'));
    C.forEach((c,i)=>{const row=h('<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2">'+(edit?'<input type="text" class="cn" value="'+esc(c.n)+'" aria-label="Gruppo"><div class="trow"><input type="text" class="cf" value="'+esc(c.funzione||'')+'" placeholder="Funzione (porta lo stendardo…)"><input type="text" class="cno" value="'+esc(c.note||'')+'" placeholder="Note"></div>':'<b>'+esc(c.n)+'</b>'+(c.funzione||c.note?'<span class="muted small">'+esc([c.funzione,c.note].filter(Boolean).join(' · '))+'</span>':''))+'</div>'+(edit?'<div class="tbtn"><button type="button" aria-label="Su">↑</button><button type="button" aria-label="Giù">↓</button><button type="button" class="ko" aria-label="Togli">×</button></div>':'')+'</div>');
      if(edit){row.querySelector('.cn').addEventListener('change',e=>{c.n=e.target.value.trim();changedP();});row.querySelector('.cf').addEventListener('change',e=>{c.funzione=e.target.value.trim();changedP();});row.querySelector('.cno').addEventListener('change',e=>{c.note=e.target.value.trim();changedP();});
        const [up,dn,x]=row.querySelectorAll('.tbtn button');up.addEventListener('click',()=>{if(i>0){[C[i-1],C[i]]=[C[i],C[i-1]];drawCor();changedP();}});dn.addEventListener('click',()=>{if(i<C.length-1){[C[i+1],C[i]]=[C[i],C[i+1]];drawCor();changedP();}});x.addEventListener('click',()=>{C.splice(i,1);drawCor();changedP();});}
      box.appendChild(row);});};
  if(edit){const vl=gen.querySelector('.vlist');const drawVie=()=>{vl.innerHTML='';(P.vie_bozza=P.vie_bozza||(P.vie&&P.vie.length?P.vie.slice():['',''])).forEach((v,i)=>{const row=h('<div class="vrow"><span class="tn c">'+(i+1)+'</span><input type="text" value="'+esc(v)+'" placeholder="Per esempio: Via Ridola" aria-label="Via '+(i+1)+'"><div class="tbtn"><button type="button" aria-label="Su">↑</button><button type="button" aria-label="Giù">↓</button><button type="button" class="ko" aria-label="Togli">×</button></div></div>');
      const A=P.vie_bozza;row.querySelector('input').addEventListener('input',e=>{A[i]=e.target.value;});const [up,dn,x]=row.querySelectorAll('.tbtn button');
      up.addEventListener('click',()=>{if(i>0){[A[i-1],A[i]]=[A[i],A[i-1]];drawVie();}});dn.addEventListener('click',()=>{if(i<A.length-1){[A[i+1],A[i]]=[A[i],A[i+1]];drawVie();}});x.addEventListener('click',()=>{A.splice(i,1);drawVie();});vl.appendChild(row);});};drawVie();
    gen.querySelector('#gv_add').addEventListener('click',()=>{P.vie_bozza.push('');drawVie();const ins=vl.querySelectorAll('input');ins[ins.length-1].focus();});
    const msg=gen.querySelector('.gmsg');
    gen.querySelector('#gv_go').addEventListener('click',async()=>{const vie=P.vie_bozza.map(v=>v.trim()).filter(Boolean);const go=async()=>{const b=gen.querySelector('#gv_go');b.disabled=true;msg.className='gmsg';
      try{const dub=await generaDaVie(P,vie,gen.querySelector('#gv_p').value.trim(),gen.querySelector('#gv_a').value.trim(),t=>{msg.textContent=t;});versione(P,'Percorso generato dalle vie');
        msg.textContent=dub.length?'Fatto, ma controlla: il tracciato potrebbe non passare da '+dub.join(', ')+'.':'Fatto. È una prima proposta: puoi spostare le tappe con il dito.';msg.className='gmsg '+(dub.length?'warn':'ok');ed.redraw(true);refreshInfo();changedP();}
      catch(e){msg.textContent=e.message;msg.className='gmsg warn';}b.disabled=false;};
      if((P.tappe||[]).length)sheet('Rifare il percorso?','<p style="font-size:17px">Le tappe attuali vengono sostituite. Gli elementi sulla mappa (soste, bagni, uscite…) restano.</p>','Genera',async()=>{go();});else go();});
    const rc=gen.querySelector('#gv_rc');if(rc)rc.addEventListener('click',async()=>{msg.textContent='Ridisegno sulle strade…';try{await ricalcola(P);msg.textContent='Fatto.';msg.className='gmsg ok';}catch(e){msg.textContent=e.message;msg.className='gmsg warn';}ed.redraw(false);refreshInfo();changedP();});
    cor.querySelector('#cadd').addEventListener('click',()=>{const v=cor.querySelector('#ca').value.trim();if(!v)return;P.corteo.push({n:v,funzione:'',note:''});cor.querySelector('#ca').value='';drawCor();changedP();});
    dati.querySelector('#pd_d').addEventListener('change',e=>{P.data=e.target.value;changedP();});
    dati.querySelector('#pd_o').addEventListener('change',e=>{P.ora=e.target.value;changedP();});
    dati.querySelector('#pd_f').addEventListener('change',e=>{P.fragili=e.target.checked;changedP();});
    dati.querySelector('#pd_v').addEventListener('change',e=>{P.vincoli=e.target.value;changedP();});
    const fsync=()=>{P.forn={serve:dati.querySelector('#pd_fs').checked,cosa:[...dati.querySelectorAll('.fc input:checked')].map(x=>x.value)};changedP();};
    dati.querySelectorAll('#pd_fs,.fc input').forEach(x=>x.addEventListener('change',fsync));}
  refreshInfo();drawCor();
  const act=h('<div class="big-btns"></div>');
  if(edit){const b=h('<button type="button" class="bb dark">Manda alla Sicurezza</button>');b.addEventListener('click',()=>{if((P.tappe||[]).length<2){stEl.textContent='Servono almeno partenza e arrivo.';return;}
      sheet('Mandare alla Sicurezza?','<p style="font-size:17px">La Sicurezza riceve una notifica, controlla il percorso, aggiunge uscite, bagni e soccorsi e lo convalida. Nel frattempo non puoi modificarlo.</p>','Manda',async()=>{clearTimeout(saveT);P.stato='Alla Sicurezza';P.inviato_il=new Date().toISOString();P.riaperto=false;versione(P,'Mandato alla Sicurezza');if(!await salvaP(r))return false;
        await avvisa('v-psic','Percorso da convalidare: «'+P.nome+'»'+(P.firma_verifica?' (modificato dopo la verifica)':''),'v-psic');await loadVD();rerender();});});act.appendChild(b);}
  if(can&&P.stato==='Convalidato'){const b=h('<button type="button" class="bb dark">Pubblica a tutti</button>');b.addEventListener('click',()=>sheet('Pubblicare il percorso?','<p style="font-size:17px">Tutti gli utenti vedranno orario, lunghezza, percorso, elementi, corteo e stato della verifica.</p>','Pubblica',async()=>{P.stato='Pubblicato';P.pubblicato_il=new Date().toISOString();versione(P,'Pubblicato');if(!await salvaP(r))return false;await avvisa('*','Pubblicato il percorso «'+P.nome+'»','p-pub');await loadVD();rerender();}));act.appendChild(b);}
  if(can&&(P.stato==='Convalidato'||P.stato==='Pubblicato')){const b=h('<button type="button" class="bb soft">Modifica il percorso</button>');b.addEventListener('click',()=>sheet('Modificare un percorso già verificato?','<p style="font-size:17px">La verifica della Sicurezza non vale più: il percorso torna in bozza'+(P.stato==='Pubblicato'?' e viene tolto dai pubblicati':'')+'. Quando hai finito, rimandalo alla Sicurezza.</p>','Sì, modifica',async()=>{P.stato='Bozza';P.riaperto=true;versione(P,'Riaperto dopo la verifica');if(!await salvaP(r))return false;await avvisa('v-psic','Il percorso «'+P.nome+'» è stato riaperto per modifiche: andrà verificato di nuovo','v-psic');await loadVD();rerender();}));act.appendChild(b);}
  if(can&&P.stato==='Alla Sicurezza'){const b=h('<button type="button" class="bb soft">Riprendi per modificarlo</button>');b.addEventListener('click',async()=>{P.stato='Bozza';versione(P,'Ritirato dalla Sicurezza');await salvaP(r);await loadVD();rerender();});act.appendChild(b);}
  if(can){const b=h('<button type="button" class="bb soft ko">Elimina il percorso</button>');b.addEventListener('click',()=>ask('Eliminare «'+P.nome+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);PSEL['v-perc']=null;await loadVD();rerender();}));act.appendChild(b);}
  el.appendChild(act);
  if(P.sic&&P.sic.quando)el.appendChild(h('<section class="card"><h3>Verifica della Sicurezza</h3><div class="fact2"><span>Convalidato da</span><b>'+esc(P.sic.responsabile||nome(P.sic.da))+'</b></div><div class="fact2"><span>Quando</span><b>'+new Date(P.sic.quando).toLocaleDateString('it-IT')+'</b></div>'+(P.sic.nota?'<p style="white-space:pre-line">'+esc(P.sic.nota)+'</p>':'')+'</section>'));
  ricaduteBox(el,r,P,can);
  const fp=prevPerc(P);if(fp.length)el.appendChild(h('<section class="card"><h3>Fornitori del percorso</h3>'+fp.map(x=>'<div class="rq"><div><b>'+esc(x.dati.voce.replace(/^Percorso .*? – /,''))+'</b><span>'+esc(x.dati.fornitore||'fornitore da trovare')+' · '+esc(x.dati.stato||'')+'</span></div><b>'+(+x.dati.importo?eur(+x.dati.importo):'')+'</b></div>').join('')+'</section>'));
  const st=storicoHtml(P);if(st)el.appendChild(h(st));}

/* --- Sicurezza: percorsi da verificare --- */
async function renderPsic(){const id='v-psic',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);
  const r=PSEL[id]&&findP(PSEL[id]);if(r)return editorSic(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>Percorsi da convalidare</h2><p>Quando qualcuno manda un percorso lo trovi qui. Lo apri, aggiungi sulla mappa uscite, bagni, soccorsi, acqua, transenne e varchi, scrivi le criticità, poi lo convalidi o lo rimandi indietro.</p></div>'));
  const da=vperc().filter(r=>r.dati.stato==='Alla Sicurezza'),ok=vperc().filter(r=>['Convalidato','Pubblicato'].includes(r.dati.stato)),rip=vperc().filter(r=>r.dati.riaperto&&r.dati.stato==='Bozza');
  el.appendChild(h('<h3 class="gh">Da convalidare · '+da.length+'</h3>'));const g=h('<div class="cgrid"></div>');da.forEach(r=>g.appendChild(percCard(r,null,id)));el.appendChild(g);
  if(!da.length)el.appendChild(h('<div class="card soon"><p>Nessun percorso in attesa.</p></div>'));
  if(rip.length){el.appendChild(h('<h3 class="gh">Riaperti dopo la verifica · '+rip.length+'</h3>'));const g3=h('<div class="cgrid"></div>');rip.forEach(r=>g3.appendChild(percCard(r,null,id)));el.appendChild(g3);}
  if(ok.length){el.appendChild(h('<h3 class="gh">Già convalidati · '+ok.length+'</h3>'));const g2=h('<div class="cgrid"></div>');ok.forEach(r=>g2.appendChild(percCard(r,null,id)));el.appendChild(g2);}}
async function editorSic(el,r,can){const P=r.dati;if(migra(P)&&can)autoSave(r);P.sic=P.sic||{nota:''};const edit=can&&P.stato==='Alla Sicurezza';const edPts=can&&['Alla Sicurezza','Convalidato','Pubblicato'].includes(P.stato);MAPEDIT=true;
  el.appendChild(backTo('v-psic','Tutti i percorsi'));
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>'+esc(P.nome)+'</h2>'+steps(P.stato)+'<p>'+(P.data?fmtD(P.data):'')+(P.ora?' · ore '+esc(P.ora)+(fine(P)?' → '+fine(P):''):'')+' · '+fmtM(lungP(P))+' · '+fmtMin(durata(P))+(P.fragili?' · <b>con anziani e disabili</b>':'')+'</p>'+(P.vincoli?'<p><b>Vincoli:</b> '+esc(P.vincoli)+'</p>':'')+'<div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(cambiataDopoVerifica(P))el.appendChild(h('<section class="card hot"><b>La mappa è cambiata dopo la verifica</b><p style="margin:0">Controlla di nuovo tappe ed elementi.</p></section>'));
  const mapC=h('<section class="card mapcard"></section>');el.appendChild(mapC);
  const el2=h('<section class="card"><h3>Elementi sulla mappa</h3><div class="elist"></div></section>');el.appendChild(el2);
  const avv=h('<div></div>');el.appendChild(avv);
  const nt=h('<section class="card"><h3>Criticità e indicazioni della Sicurezza</h3><textarea id="snota" placeholder="Per esempio: servono steward all’incrocio con via Ridola"'+(edPts?'':' disabled')+'>'+esc(P.sic.nota||'')+'</textarea></section>');el.appendChild(nt);
  if((P.corteo||[]).length)el.appendChild(h('<section class="card"><h3>Ordine del corteo</h3>'+P.corteo.map((c,i)=>'<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2"><b>'+esc(c.n)+'</b>'+(c.funzione||c.note?'<span class="muted small">'+esc([c.funzione,c.note].filter(Boolean).join(' · '))+'</span>':'')+'</div></div>').join('')+'</section>'));
  await leaflet();if(cur!=='v-psic')return;
  const changed2=()=>{autoSave(r);refresh();};
  const ed=editorMappa(mapC,r,{key:'sic',route:false,elem:edPts,chi:'sicurezza',onRoute:()=>{},onChange:changed2});
  function refresh(){el2.querySelector('.elist').innerHTML=listaElementi(P);avv.innerHTML='';const ah=h(avvisiHtml(P));aiPercBtn(ah,P);avv.appendChild(ah);}
  if(edPts)nt.querySelector('#snota').addEventListener('change',e=>{P.sic.nota=e.target.value;autoSave(r);});
  refresh();
  if(edPts&&!edit){const b=h('<p class="muted small">Le modifiche della Sicurezza a un percorso già convalidato vengono registrate nello storico.</p>');el.appendChild(b);}
  if(edit){const act=h('<div class="big-btns"><button type="button" class="bb dark">Convalida il percorso</button><button type="button" class="bb soft">Rimanda indietro</button></div>');
    act.children[0].addEventListener('click',()=>{const nForn=P.forn&&P.forn.serve?(P.forn.cosa||[]).length:0;
      const d=sheet('Convalidare «'+P.nome+'»?','<div class="ctl"><label for="cv_r">Responsabile che convalida (nome e ruolo)</label><input type="text" id="cv_r" placeholder="Per esempio: ing. Rossi, responsabile sicurezza"></div><div class="ctl"><label for="cv_f">Documento della verifica (facoltativo)</label><input type="file" id="cv_f" accept=".pdf,image/*"></div><p class="muted">Chi ha creato il percorso riceve una notifica e potrà pubblicarlo.'+(nForn?' Parte anche la richiesta di '+nForn+' preventivi ('+esc(P.forn.cosa.join(', '))+').':'')+'</p>','Convalida',async(dl)=>{
        const resp=dl.querySelector('#cv_r').value.trim();if(!resp){dl.querySelector('.smsg').textContent='Scrivi chi convalida.';return false;}clearTimeout(saveT);
        const f=dl.querySelector('#cv_f').files[0];if(f)P.sic.doc=await carica(f,'v-psic');
        P.sic.nota=nt.querySelector('#snota').value;P.sic.responsabile=resp;P.firma_verifica=firma(P);versione(P,'Convalidato da '+resp);if(!await salvaP(r))return false;
        const {error}=await CTX.sb.rpc('convalida_percorso',{pid:r.id});if(error)throw new Error(error.message);
        await Promise.all([loadVD(),loadSocial()]);rerender();stEl.textContent='Percorso convalidato.';});});
    act.children[1].addEventListener('click',()=>sheet('Rimandare indietro','<div class="ctl"><label for="rn">Cosa va cambiato</label><textarea id="rn"></textarea></div>','Rimanda',async(dl)=>{const n=dl.querySelector('#rn').value.trim();if(!n){dl.querySelector('.smsg').textContent='Scrivi cosa va cambiato.';return false;}
      clearTimeout(saveT);P.sic.nota=nt.querySelector('#snota').value;versione(P,'Rimandato indietro dalla Sicurezza');await salvaP(r);const {error}=await CTX.sb.rpc('rimanda_percorso',{pid:r.id,nota:n});if(error)throw new Error(error.message);await loadVD();rerender();}));
    el.appendChild(act);}
  if(P.sic.doc)el.appendChild(fileBtn(P.sic.doc,'Documento della verifica'));
  const st=storicoHtml(P);if(st)el.appendChild(h(st));}

/* --- Mappe degli ingegneri --- */
async function pdfImmagine(file){if(!window.pdfjsLib){await loadJs('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';}
  const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const pg=await pdf.getPage(1);const v0=pg.getViewport({scale:1});const sc=Math.min(3,2400/Math.max(v0.width,v0.height));const vp=pg.getViewport({scale:sc});
  const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:ctx,viewport:vp}).promise;
  return await new Promise(ok=>cv.toBlob(b=>ok({blob:b,w:cv.width,h:cv.height}),'image/png'));}
const urlCache={};async function firmata(f){if(urlCache[f.path]&&urlCache[f.path].t>Date.now()-600000)return urlCache[f.path].u;const {data}=await CTX.sb.storage.from('documenti').createSignedUrl(f.path,3600);if(!data)return null;urlCache[f.path]={u:data.signedUrl,t:Date.now()};return data.signedUrl;}
async function renderMsic(){const id='v-msic',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);const L1=VD[id]||[];
  const r=PSEL[id]&&L1.find(x=>x.id===PSEL[id]);if(r)return editorMsic(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>Mappe degli ingegneri</h2><p>Carica il PDF (o la foto) della planimetria: la appoggi sulla mappa vera di Matera e ci segni sopra uscite, bagni, soccorsi. La versione digitale è una bozza da controllare: il documento ufficiale resta il PDF originale.</p></div>'));
  if(can){const b=addBtn('+ Carica una mappa (PDF o immagine)',()=>{const d=sheet('Carica una mappa','<div class="ctl"><label for="mn">Nome</label><input type="text" id="mn" placeholder="Piano di sicurezza Piazza Vittorio Veneto"></div><label class="drop"><input type="file" id="mf" accept=".pdf,application/pdf,image/*">'+svg(IC2.map,30)+'<b>Tocca per scegliere</b><span>PDF o immagine della planimetria</span></label>','Carica',async(dl)=>{
      const f=dl.querySelector('#mf').files[0],n=dl.querySelector('#mn').value.trim()||(f&&f.name)||'';if(!f){dl.querySelector('.smsg').textContent='Scegli il file.';return false;}
      dl.querySelector('.smsg').textContent='Preparo l’immagine…';let img=f,w=0,hh=0;
      if(/pdf$/i.test(f.name)||f.type==='application/pdf'){const o=await pdfImmagine(f);img=new File([o.blob],'mappa.png',{type:'image/png'});w=o.w;hh=o.h;}
      else{const bm=await createImageBitmap(f);w=bm.width;hh=bm.height;}
      dl.querySelector('.smsg').textContent='Carico…';const orig=await carica(f,id);const im=img===f?orig:await carica(img,id);
      const asp=hh&&w?hh/w:0.7;const dLng=0.004,dLat=dLng*asp*Math.cos(MATERA[0]*Math.PI/180);
      const {data,error}=await CTX.sb.from('voci_dati').insert({voce:id,dati:{nome:n,file:orig,img:im,bounds:[[MATERA[0]+dLat/2,MATERA[1]-dLng/2],[MATERA[0]-dLat/2,MATERA[1]+dLng/2]],opac:0.7,punti:[],verificata:false}}).select().single();if(error)throw new Error(error.message);
      await loadVD();PSEL[id]=data.id;rerender();});d.querySelector('#mf').addEventListener('change',e=>{const f=e.target.files[0];if(f)d.querySelector('.drop b').textContent=f.name;});});el.appendChild(b);}
  const box=h('<section class="card mapcard"><h3>Tutto quello che è segnato sulle mappe</h3><div class="lmap" id="allmap"></div>'+legenda()+'</section>');el.appendChild(box);
  const g=h('<div class="cgrid"></div>');L1.slice().reverse().forEach(x=>{const c=h('<article class="card rc"><div class="chips"><span class="chip2 '+(x.dati.verificata?'ok':'')+'">'+(x.dati.verificata?'Controllata da un tecnico':'Bozza da controllare')+'</span></div><b class="vn">'+esc(x.dati.nome||'Mappa')+'</b><div class="fact2"><span>Punti segnati</span><b>'+(x.dati.punti||[]).length+'</b></div><button type="button" class="bb dark">Apri</button></article>');c.querySelector('.bb').addEventListener('click',()=>{PSEL[id]=x.id;rerender();window.scrollTo({top:0});});if(x.dati.file)c.insertBefore(fileBtn(x.dati.file,'Apri il file originale'),c.querySelector('.bb'));g.appendChild(c);});el.appendChild(g);
  if(!L1.length)el.appendChild(h('<div class="card soon"><p>Ancora nessuna mappa caricata.</p></div>'));
  await leaflet();if(cur!==id)return;const m=mkMap(box.querySelector('#allmap'),'all',MATERA,15);const all=[];
  vperc().filter(r=>['Convalidato','Pubblicato','Alla Sicurezza'].includes(r.dati.stato)).forEach(r=>{migra(r.dati);drawRoute(m,r.dati,{fit:false});linea(r.dati).forEach(t=>all.push([t.lat,t.lng]));});
  L1.forEach(x=>(x.dati.punti||[]).forEach(p=>{const d=PT[p.t]||PT.altro;L.marker([p.lat,p.lng],{icon:pinIcon(d[1],d[2],'sq')}).addTo(m).bindTooltip(d[0]+' · '+(x.dati.nome||''));all.push([p.lat,p.lng]);}));
  if(all.length)m.fitBounds(L.latLngBounds(all).pad(0.2),{maxZoom:17});}
async function editorMsic(el,r,can){const D2=r.dati;D2.punti=D2.punti||[];MAPEDIT=true;let tipo='uscita',mode='punti';
  el.appendChild(backTo('v-msic','Tutte le mappe'));
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>'+esc(D2.nome||'Mappa')+'</h2><p>'+(can?'Prima appoggia la planimetria: trascina i due angoli finché strade e piazze coincidono. Poi segna i punti.':'Planimetria appoggiata sulla mappa di Matera.')+' La versione digitale è una bozza: fa fede il PDF originale.</p></div>'));
  const tools=h('<section class="card mapcard">'+(can?'<div class="seg"><button type="button" data-m="allinea" aria-pressed="false">1 · Appoggia la planimetria</button><button type="button" data-m="punti" aria-pressed="true">2 · Segna i punti</button></div><div class="seg wrap ptools">'+Object.entries(PT).filter(([k])=>!PT[k][3]).map(([k,d])=>'<button type="button" data-t="'+k+'" aria-pressed="'+(k===tipo)+'"><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> '+d[0]+'</button>').join('')+'</div>':'')+'<label class="opac">Trasparenza della planimetria <input type="range" min="0" max="1" step="0.05" value="'+(D2.opac!=null?D2.opac:0.7)+'"></label><div class="lmap tall" id="mmap"></div>'+legenda()+'</section>');el.appendChild(tools);
  if(D2.file)el.appendChild(fileBtn(D2.file,'Apri il file originale'));
  if(can){const v=h('<label class="ck"><input type="checkbox"'+(D2.verificata?' checked':'')+'> Un tecnico ha controllato che la versione digitale corrisponda all’originale</label>');v.querySelector('input').addEventListener('change',e=>{D2.verificata=e.target.checked;D2.verificata_da=CTX.user.id;D2.verificata_il=new Date().toISOString();autoSave(r);});el.appendChild(v);
    const b=h('<button type="button" class="bb soft ko">Elimina la mappa</button>');b.addEventListener('click',()=>ask('Eliminare la mappa «'+(D2.nome||'')+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);PSEL['v-msic']=null;await loadVD();rerender();}));el.appendChild(b);}
  await leaflet();if(cur!=='v-msic')return;const m=mkMap(tools.querySelector('#mmap'),'msic');
  const url=D2.img?await firmata(D2.img):null;const ov=url?L.imageOverlay(url,D2.bounds,{opacity:D2.opac!=null?D2.opac:0.7,interactive:false}).addTo(m):null;m.fitBounds(L.latLngBounds(D2.bounds).pad(0.1));
  const k1=L.marker(D2.bounds[0],{draggable:true,icon:pinIcon('↖','#24478F')}),k2=L.marker(D2.bounds[1],{draggable:true,icon:pinIcon('↘','#24478F')});
  const upd=()=>{D2.bounds=[[k1.getLatLng().lat,k1.getLatLng().lng],[k2.getLatLng().lat,k2.getLatLng().lng]];if(ov)ov.setBounds(L.latLngBounds(D2.bounds));autoSave(r);};k1.on('drag',()=>{if(ov)ov.setBounds(L.latLngBounds([k1.getLatLng(),k2.getLatLng()]));}).on('dragend',upd);k2.on('drag',()=>{if(ov)ov.setBounds(L.latLngBounds([k1.getLatLng(),k2.getLatLng()]));}).on('dragend',upd);
  let lay=L.layerGroup().addTo(m);const drawPts=()=>{lay.clearLayers();D2.punti.forEach((p,i)=>{const d=PT[p.t]||PT.altro;const mk=L.marker([p.lat,p.lng],{icon:pinIcon(d[1],d[2],'sq'),draggable:can}).addTo(lay).bindTooltip(d[0]);if(can){mk.on('dragend',()=>{const q=mk.getLatLng();p.lat=q.lat;p.lng=q.lng;autoSave(r);});mk.on('click',()=>{if(mode!=='punti')return;ask('Togliere questo punto?','Togli',async()=>{D2.punti.splice(i,1);drawPts();autoSave(r);});});}});};drawPts();
  tools.querySelector('.opac input').addEventListener('input',e=>{D2.opac=+e.target.value;if(ov)ov.setOpacity(D2.opac);});tools.querySelector('.opac input').addEventListener('change',()=>{if(can)autoSave(r);});
  if(can){const setMode=md=>{mode=md;tools.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.m===md)));tools.querySelector('.ptools').hidden=md!=='punti';if(md==='allinea'){k1.addTo(m);k2.addTo(m);}else{k1.remove();k2.remove();}};
    tools.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
    tools.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tipo=b.dataset.t;tools.querySelectorAll('[data-t]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
    m.on('click',e=>{if(mode!=='punti')return;D2.punti.push({lat:e.latlng.lat,lng:e.latlng.lng,t:tipo,n:''});drawPts();autoSave(r);});
    setMode(D2.punti.length?'punti':'allinea');}}

/* --- Percorsi pubblicati: per tutti --- */
async function renderPub(){const el=document.getElementById('p-pub');el.innerHTML='';const L1=vperc().filter(r=>r.dati.stato==='Pubblicato').sort((a,b)=>String(a.dati.data).localeCompare(String(b.dati.data)));MAPEDIT=false;
  el.appendChild(h('<div class="sh"><span class="eyb">Per tutti</span><h2>Percorsi pubblicati</h2><p>I percorsi convalidati dalla Sicurezza: orari, lunghezza, soste, corteo e servizi lungo il cammino.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(!L1.length){el.appendChild(h('<div class="card soon"><p>Nessun percorso pubblicato per ora.</p></div>'));return;}
  const seg=h('<div class="seg wrap">'+L1.map((r,i)=>'<button type="button" data-i="'+i+'" aria-pressed="'+(i===(PSEL.pub||0))+'">'+esc(r.dati.nome)+'</button>').join('')+'</div>');seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{PSEL.pub=+b.dataset.i;renderPub();}));if(L1.length>1)el.appendChild(seg);
  const r=L1[Math.min(PSEL.pub||0,L1.length-1)];const P=r.dati;migra(P);const fp=prevPerc(P);const costi=fp.filter(x=>x.dati.stato==='Accettato').reduce((a,x)=>a+(+x.dati.importo||0),0);
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Quando</span><b>'+(P.data?fmtD(P.data):'—')+'</b></div><div class="kpi"><span>Orario</span><b>'+(P.ora?esc(P.ora)+(fine(P)?' → '+fine(P):''):'—')+'</b></div><div class="kpi dark"><span>Lunghezza</span><b>'+fmtM(lungP(P))+' · '+fmtMin(durata(P))+'</b></div></div>'));
  el.appendChild(h('<section class="card"><div class="fact2"><span>Verifica della Sicurezza</span><b>'+(P.sic&&P.sic.quando?'Convalidato'+(P.sic.responsabile?' da '+esc(P.sic.responsabile):'')+' il '+new Date(P.sic.quando).toLocaleDateString('it-IT'):'—')+'</b></div>'+((P.vie||[]).length?'<div class="fact2"><span>Vie</span><b>'+esc(P.vie.join(' → '))+'</b></div>':'')+'</section>'));
  const mc=h('<section class="card mapcard"><div class="lmap" id="pubmap"></div>'+legenda()+'</section>');el.appendChild(mc);
  el.appendChild(h('<section class="card"><h3>Soste, servizi e sicurezza</h3>'+listaElementi(P)+'</section>'));
  if((P.corteo||[]).length)el.appendChild(h('<section class="card"><h3>Ordine del corteo</h3>'+P.corteo.map((c,i)=>'<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2"><b>'+esc(c.n)+'</b>'+(c.funzione||c.note?'<span class="muted small">'+esc([c.funzione,c.note].filter(Boolean).join(' · '))+'</span>':'')+'</div></div>').join('')+'</section>'));
  el.appendChild(h('<section class="card"><h3>Fornitori e costi</h3>'+(fp.length?fp.map(x=>'<div class="rq"><div><b>'+esc(x.dati.voce.replace(/^Percorso .*? – /,''))+'</b><span>'+esc(x.dati.fornitore||'da scegliere')+' · '+esc(x.dati.stato||'')+'</span></div><b>'+(+x.dati.importo?eur(+x.dati.importo):'')+'</b></div>').join('')+'<div class="fact2"><span>Costi già decisi</span><b>'+eur(costi)+'</b></div>':'<p class="muted">Nessun fornitore richiesto per questo percorso.</p>')+'</section>'));
  ricaduteBox(el,r,P,false);
  if(P.sic&&P.sic.nota)el.appendChild(h('<section class="card"><h3>Indicazioni della Sicurezza</h3><p style="margin:0;white-space:pre-line">'+esc(P.sic.nota)+'</p></section>'));
  await leaflet();if(cur!=='p-pub')return;const m=mkMap(mc.querySelector('#pubmap'),'pub');drawRoute(m,P,{onElem:e=>schedaElemento(P,e,false)});}
function pubWidget(){const L1=vperc().filter(r=>r.dati.stato==='Pubblicato');const mine=CTX.canEdit('v-psic')?vperc().filter(r=>r.dati.stato==='Alla Sicurezza'):[];if(!L1.length&&!mine.length)return null;
  return h('<section class="w"><div class="wh"><b>Percorsi</b><button type="button" class="lnk2" data-go="p-pub">Tutti</button></div>'+(mine.length?'<div class="rq"><div><b>'+mine.length+' da convalidare</b><span class="neg">aspettano la Sicurezza</span></div><button type="button" class="bb dark sm" data-go="v-psic">Apri</button></div>':'')+L1.slice(0,3).map(r=>'<div class="rq"><div><b>'+esc(r.dati.nome)+'</b><span>'+(r.dati.data?fmtD(r.dati.data):'')+(r.dati.ora?' · ore '+esc(r.dati.ora):'')+' · '+fmtM(lungP(r.dati))+'</span></div></div>').join('')+'</section>');}
