/* ================= Bruna27 · Fase 3: percorsi sulla mappa, Sicurezza, mappe degli ingegneri, pubblicazione ================= */
let MAPEDIT=false;const MAPS={};const PSEL={};
const MATERA=[40.6664,16.6090];
const SOSTE=['Preghiera','Fuochi','Riposo','Musica','Benedizione','Altro'];
const PT={uscita:['Uscita di emergenza','U','#1F6B4F'],bagno:['Bagni','B','#2F6FD6'],soccorso:['Soccorso','S','#C0392B'],acqua:['Acqua','A','#1A9BB0'],transenne:['Transenne','T','#6B6E7A'],varco:['Varco di accesso','V','#D9822B']};
const FORN_COSA=['Transenne','Bagni chimici','Illuminazione','Impianto audio','Palco','Pulizia','Ambulanza'];
const STATI=['Bozza','Alla Sicurezza','Convalidato','Pubblicato'];
const SASSI=[[40.6713,16.6079],[40.6707,16.6127],[40.6668,16.6152],[40.6624,16.6143],[40.6629,16.6104],[40.6659,16.6093],[40.6689,16.6066]];
EL['v-perc']={f:[['nome','Nome del percorso','t']],intro:'',add:'Nuovo percorso',group:''};
EL['v-msic']={f:[['nome','Nome della mappa','t']],intro:'',add:'Carica una mappa',group:''};
delete COMING['v-perc'];delete COMING['v-psic'];delete COMING['v-msic'];
function extraVD(){return ['v-perc'];}
PAGEX['p-pub']='Percorsi pubblicati';ensureSec('p-pub');
R['v-perc']=renderPerc;R['v-psic']=renderPsic;R['v-msic']=renderMsic;R['p-pub']=renderPub;

/* --- mappa --- */
async function leaflet(){if(window.L)return;const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l);
  await loadJs('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js');}
function mkMap(el,key,center,zoom){if(MAPS[key]){try{MAPS[key].remove();}catch(e){}}
  const m=L.map(el,{zoomControl:true,attributionControl:true}).setView(center||MATERA,zoom||16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);MAPS[key]=m;setTimeout(()=>m.invalidateSize(),60);return m;}
const pinIcon=(n,c,cls)=>L.divIcon({className:'pin '+(cls||''),html:'<b style="background:'+(c||'#16161D')+'">'+n+'</b>',iconSize:[30,30],iconAnchor:[15,15]});
function distM(a,b){const R2=6371000,r=x=>x*Math.PI/180;const dl=r(b.lat-a.lat),dg=r(b.lng-a.lng);const s=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R2*Math.asin(Math.sqrt(s));}
function lung(T){let s=0;for(let i=1;i<T.length;i++)s+=distM(T[i-1],T[i]);return s;}
function inSassi(p){let c=false;for(let i=0,j=SASSI.length-1;i<SASSI.length;j=i++){const [yi,xi]=SASSI[i],[yj,xj]=SASSI[j];if(((yi>p.lat)!==(yj>p.lat))&&(p.lng<(xj-xi)*(p.lat-yi)/(yj-yi)+xi))c=!c;}return c;}
const fmtM=m=>m>=1000?(Math.round(m/100)/10).toString().replace('.',',')+' km':Math.round(m/10)*10+' m';
function durata(P){const T=P.tappe||[];const cam=lung(T)/1000*30;const so=T.reduce((a,t)=>a+(t.sosta?(+t.min||0):0),0);return Math.round(cam+so);}
const fmtMin=m=>m>=60?Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m+' min';
function fine(P){if(!P.ora)return '';const [h,mi]=P.ora.split(':').map(Number);const t=h*60+mi+durata(P);return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function avvisi(P){const T=P.tappe||[],out=[];const L1=lung(T),du=durata(P);const pts=(P.sic&&P.sic.punti)||[];
  if(T.length<2){out.push(['info','Tocca la mappa per mettere almeno la partenza e l’arrivo.']);return out;}
  if(L1>2500)out.push(['warn','Il percorso è lungo '+fmtM(L1)+': controlla che il corteo riesca a farlo nei tempi.']);
  const h=P.ora?+P.ora.split(':')[0]:null;const mese=P.data?+P.data.slice(5,7):7;
  if(h!=null&&h>=11&&h<18&&mese>=6&&mese<=8)out.push(['warn','Si cammina nelle ore calde: prevedi acqua e tratti all’ombra.']);
  if(h!=null&&(h>=21||h<6))out.push(['info','Si cammina col buio: verifica l’illuminazione lungo tutto il percorso.']);
  if(P.fragili){
    if(L1>1200)out.push(['warn','Per anziani e persone con disabilità '+fmtM(L1)+' sono tanti: accorcia il percorso o aggiungi soste di riposo.']);
    let acc=0,from=0;for(let i=1;i<T.length;i++){acc+=distM(T[i-1],T[i]);if(T[i].sosta||i===T.length-1){if(acc>500)out.push(['warn','Dalla tappa '+(from+1)+' alla '+(i+1)+' ci sono '+fmtM(acc)+' senza soste: aggiungi una sosta di riposo.']);acc=0;from=i;}}
    if(T.some(inSassi))out.push(['warn','Il percorso entra nella zona dei Sassi: scalinate e salite, difficile per carrozzine e per chi cammina male. Prevedi un percorso alternativo o un mezzo.']);
    if(!T.some(t=>t.sosta==='Riposo'))out.push(['info','Non c’è nessuna sosta di riposo: per gli anziani ne serve almeno una, con sedute.']);
    if(du>75)out.push(['warn','Durata stimata '+fmtMin(du)+': per anziani e disabili è lunga.']);}
  if(P.stato&&P.stato!=='Bozza'&&P.stato!=='Rimandato'){
    if(!pts.some(p=>p.t==='soccorso'))out.push(['warn','La Sicurezza non ha ancora segnato un punto di soccorso.']);
    const bagni=pts.filter(p=>p.t==='bagno');T.forEach((t,i)=>{if(t.sosta&&(!bagni.length||Math.min(...bagni.map(b=>distM(b,t)))>400))out.push(['info','Nessun bagno entro 400 m dalla sosta '+(i+1)+(t.n?' ('+t.n+')':'')+'.']);});}
  if(!out.length)out.push(['ok','Nessun problema trovato.']);return out;}
function avvisiHtml(P){return '<section class="card"><div class="wh"><span class="orb"></span><b>Avvisi sul percorso</b></div>'+avvisi(P).map(([k,t])=>'<p class="avv '+k+'">'+esc(t)+'</p>').join('')+'<p class="muted small">Sono controlli automatici: la zona dei Sassi è indicativa e la lunghezza è misurata in linea retta tra le tappe (mettine una a ogni curva).</p></section>';}
function statoChip(s){const c=s==='Pubblicato'||s==='Convalidato'?'ok':s==='Rimandato'?'ko':'';return '<span class="chip2 '+c+'">'+esc(s||'Bozza')+'</span>';}
function steps(s){const i=s==='Rimandato'?0:Math.max(0,STATI.indexOf(s||'Bozza'));return '<div class="flow">'+['Bozza','Sicurezza','Convalidato','Pubblicato'].map((n,k)=>'<span class="'+(k<i?'done':k===i?'now':'')+'">'+n+'</span>').join('')+'</div>';}
function drawRoute(m,P,opt){opt=opt||{};const T=P.tappe||[];const lay=L.layerGroup().addTo(m);
  if(T.length>1)L.polyline(T.map(t=>[t.lat,t.lng]),{color:'#4A45B5',weight:6,opacity:.85}).addTo(lay);
  T.forEach((t,i)=>{const mk=L.marker([t.lat,t.lng],{icon:pinIcon(i+1,t.sosta?'#D9822B':'#16161D'),draggable:!!opt.drag}).addTo(lay);mk.bindTooltip((t.n||('Tappa '+(i+1)))+(t.sosta?' · sosta '+t.sosta.toLowerCase()+(t.min?' '+t.min+' min':''):''));
    if(opt.drag)mk.on('dragend',()=>{const p=mk.getLatLng();t.lat=p.lat;t.lng=p.lng;opt.onChange&&opt.onChange();});});
  ((P.sic&&P.sic.punti)||[]).forEach((p,i)=>{const d=PT[p.t]||PT.varco;const mk=L.marker([p.lat,p.lng],{icon:pinIcon(d[1],d[2],'sq')}).addTo(lay);mk.bindTooltip(d[0]+(p.n?' · '+p.n:''));if(opt.onPoint)mk.on('click',()=>opt.onPoint(i));});
  if(T.length&&opt.fit!==false)m.fitBounds(L.latLngBounds(T.map(t=>[t.lat,t.lng])).pad(0.3),{maxZoom:18});return lay;}
const legenda=()=>'<div class="legend">'+Object.values(PT).map(d=>'<span><i style="background:'+d[2]+'">'+d[1]+'</i>'+d[0]+'</span>').join('')+'</div>';
async function salvaP(r){r.dati.aggiornato_il=new Date().toISOString();const {error}=await CTX.sb.from('voci_dati').update({dati:r.dati,aggiornato:new Date().toISOString()}).eq('id',r.id);stEl.textContent=error?'Non salvato: '+error.message:'Salvato.';return !error;}
let saveT=null;function autoSave(r){clearTimeout(saveT);stEl.textContent='Salvo…';saveT=setTimeout(()=>salvaP(r),700);}
async function avvisa(area,testo,link){try{await CTX.sb.rpc('notifica_area',{a_area:area,a_testo:testo,a_link:link});}catch(e){}}
async function avvisaUtente(uid,testo,link){try{await CTX.sb.rpc('notifica_utente',{a_uid:uid,a_testo:testo,a_link:link});}catch(e){}}
const vperc=()=>VD['v-perc']||[];
const findP=id=>vperc().find(r=>r.id===id);
function percCard(r,sel,key){const P=r.dati;const c=h('<article class="card rc"><div class="chips">'+statoChip(P.stato)+(P.fragili?'<span class="chip2">Anziani e disabili</span>':'')+'</div><b class="vn">'+esc(P.nome||'Senza nome')+'</b><div class="fact2"><span>Quando</span><b>'+(P.data?fmtD(P.data):'data da decidere')+(P.ora?' · ore '+esc(P.ora):'')+'</b></div><div class="fact2"><span>Lunghezza</span><b>'+fmtM(lung(P.tappe||[]))+' · '+fmtMin(durata(P))+'</b></div><div class="fact2"><span>Tappe</span><b>'+(P.tappe||[]).length+' · soste '+(P.tappe||[]).filter(t=>t.sosta).length+'</b></div><button type="button" class="bb dark">Apri</button></article>');
  c.querySelector('.bb').addEventListener('click',()=>{PSEL[key]=r.id;rerender();window.scrollTo({top:0});});return c;}
function backTo(key,label){const b=h('<button type="button" class="back">‹ '+esc(label)+'</button>');b.addEventListener('click',()=>{PSEL[key]=null;MAPEDIT=false;rerender();});return b;}

/* --- Percorsi (Eventi) --- */
async function renderPerc(){const id='v-perc',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);
  const r=PSEL[id]&&findP(PSEL[id]);if(r)return editorPerc(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Eventi</span><h2>Percorsi</h2><p>Disegna sulla mappa di Matera il percorso delle processioni: tappe, soste, ordine del corteo. Poi lo mandi alla Sicurezza, che lo convalida; alla fine lo pubblichi a tutti.</p></div>'));
  if(can)el.appendChild(addBtn('+ Nuovo percorso',()=>sheet('Nuovo percorso','<div class="ctl"><label for="np_n">Nome</label><input type="text" id="np_n" placeholder="Processione dei pastori"></div><div class="when"><div class="ctl"><label for="np_d">Giorno</label><input type="date" id="np_d"></div><div class="ctl"><label for="np_o">Ora di partenza</label><input type="time" id="np_o"></div></div><label class="ck"><input type="checkbox" id="np_f"> Partecipano anziani o persone con disabilità</label>','Crea e disegna',async(dl)=>{
    const n=dl.querySelector('#np_n').value.trim();if(!n){dl.querySelector('.smsg').textContent='Scrivi il nome.';return false;}
    const {data,error}=await CTX.sb.from('voci_dati').insert({voce:id,dati:{nome:n,data:dl.querySelector('#np_d').value,ora:dl.querySelector('#np_o').value,fragili:dl.querySelector('#np_f').checked,tappe:[],corteo:[],forn:{serve:false,cosa:[]},stato:'Bozza',autore:CTX.user.id}}).select().single();if(error)throw new Error(error.message);
    await loadVD();PSEL[id]=data.id;rerender();})));
  const L1=vperc();const g=h('<div class="cgrid"></div>');L1.slice().reverse().forEach(r=>g.appendChild(percCard(r,null,id)));el.appendChild(g);
  if(!L1.length)el.appendChild(h('<div class="card soon"><p>Ancora nessun percorso.</p></div>'));}
async function editorPerc(el,r,can){const P=r.dati;const edit=can&&(P.stato==='Bozza'||P.stato==='Rimandato'||!P.stato);MAPEDIT=true;
  el.appendChild(backTo('v-perc','Tutti i percorsi'));
  el.appendChild(h('<div class="sh"><span class="eyb">Percorso</span><h2>'+esc(P.nome)+'</h2>'+steps(P.stato)+'<div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(P.stato==='Rimandato'&&P.nota_sic)el.appendChild(h('<section class="card hot"><b>La Sicurezza lo ha rimandato indietro</b><p style="margin:0">'+esc(P.nota_sic)+'</p></section>'));
  const mapC=h('<section class="card mapcard">'+(edit?'<p class="hint">Tocca la mappa per aggiungere una tappa. Trascina un numero per spostarlo.</p>':'')+'<div class="lmap" id="pmap"></div>'+legenda()+'</section>');el.appendChild(mapC);
  const info=h('<div class="big3 mini"><div class="kpi"><span>Lunghezza</span><b id="pl">'+fmtM(lung(P.tappe||[]))+'</b></div><div class="kpi"><span>Durata stimata</span><b id="pdu">'+fmtMin(durata(P))+'</b></div><div class="kpi dark"><span>Orario</span><b id="por">'+(P.ora?esc(P.ora)+(fine(P)?' → '+fine(P):''):'da decidere')+'</b></div></div>');el.appendChild(info);
  
  const tl=h('<section class="card"><h3>Tappe e soste</h3><div class="tlist"></div></section>');el.appendChild(tl);
  const avv=h('<div></div>');el.appendChild(avv);
  const cor=h('<section class="card"><h3>Ordine del corteo</h3><p class="muted small">Dall’alto in basso: chi apre e chi chiude il corteo.</p><div class="clist"></div>'+(edit?'<div class="when"><div class="ctl" style="flex:3 1 200px"><label for="ca">Aggiungi un gruppo o un’associazione</label><input type="text" id="ca" placeholder="Per esempio: Banda di Matera"></div></div><button type="button" class="bb sm" id="cadd">Aggiungi al corteo</button>':'')+'</section>');el.appendChild(cor);
  const dati=h('<section class="card"><h3>Dati del percorso</h3><div class="when"><div class="ctl"><label for="pd_d">Giorno</label><input type="date" id="pd_d" value="'+esc(P.data||'')+'"></div><div class="ctl"><label for="pd_o">Ora di partenza</label><input type="time" id="pd_o" value="'+esc(P.ora||'')+'"></div></div><label class="ck"><input type="checkbox" id="pd_f"'+(P.fragili?' checked':'')+'> Partecipano anziani o persone con disabilità</label><div class="lab">Servono fornitori?</div><label class="ck"><input type="checkbox" id="pd_fs"'+(P.forn&&P.forn.serve?' checked':'')+'> Sì, dopo la Sicurezza chiedo i preventivi per:</label><div class="checks fc">'+FORN_COSA.map(x=>'<label><input type="checkbox" value="'+esc(x)+'"'+(P.forn&&(P.forn.cosa||[]).includes(x)?' checked':'')+'> '+esc(x)+'</label>').join('')+'</div></section>');
  if(!edit)dati.querySelectorAll('input').forEach(x=>x.disabled=true);el.appendChild(dati);
  await leaflet();if(cur!=='v-perc')return;
  const m=mkMap(mapC.querySelector('#pmap'),'perc');let lay=null;
  const refresh=(fit)=>{if(lay)lay.remove();lay=drawRoute(m,P,{drag:edit,onChange:()=>{refresh(false);changedP();},fit});
    info.querySelector('#pl').textContent=fmtM(lung(P.tappe||[]));info.querySelector('#pdu').textContent=fmtMin(durata(P));info.querySelector('#por').textContent=P.ora?P.ora+(fine(P)?' → '+fine(P):''):'da decidere';
    avv.innerHTML='';avv.appendChild(h(avvisiHtml(P)));drawList();};
  const changedP=()=>{if(edit)autoSave(r);};
  const drawList=()=>{const box=tl.querySelector('.tlist');box.innerHTML='';const T=P.tappe||[];
    if(!T.length)box.appendChild(h('<p class="muted">Nessuna tappa: '+(edit?'tocca la mappa per iniziare dalla partenza.':'il percorso è vuoto.')+'</p>'));
    T.forEach((t,i)=>{const row=h('<div class="tappa"><span class="tn'+(t.sosta?' s':'')+'">'+(i+1)+'</span><div class="tb2">'+(edit?'<input type="text" class="tnm" value="'+esc(t.n||'')+'" placeholder="'+(i===0?'Partenza':i===T.length-1?'Arrivo':'Nome del luogo')+'" aria-label="Nome della tappa '+(i+1)+'"><div class="trow"><select class="tso" aria-label="Sosta"><option value="">Solo passaggio</option>'+SOSTE.map(s=>'<option'+(t.sosta===s?' selected':'')+'>Sosta: '+s+'</option>').join('')+'</select><input type="number" class="tmi" min="0" step="1" inputmode="numeric" value="'+esc(t.min||'')+'" placeholder="minuti" aria-label="Minuti di sosta"'+(t.sosta?'':' hidden')+'></div>':'<b>'+esc(t.n||('Tappa '+(i+1)))+'</b><span class="muted small">'+(t.sosta?'Sosta: '+esc(t.sosta)+(t.min?' · '+t.min+' min':''):'Passaggio')+'</span>')+'</div>'+(edit?'<div class="tbtn"><button type="button" aria-label="Su">↑</button><button type="button" aria-label="Giù">↓</button><button type="button" class="ko" aria-label="Togli">×</button></div>':'')+'</div>');
      if(edit){row.querySelector('.tnm').addEventListener('change',e=>{t.n=e.target.value.trim();changedP();lay&&refresh(false);});
        row.querySelector('.tso').addEventListener('change',e=>{t.sosta=e.target.value.replace('Sosta: ','');if(!t.sosta)t.min=0;else if(!t.min)t.min=t.sosta==='Riposo'?10:15;refresh(false);changedP();});
        row.querySelector('.tmi').addEventListener('change',e=>{t.min=Math.max(0,+e.target.value||0);refresh(false);changedP();});
        const [up,dn,x]=row.querySelectorAll('.tbtn button');
        up.addEventListener('click',()=>{if(i>0){[T[i-1],T[i]]=[T[i],T[i-1]];refresh(false);changedP();}});
        dn.addEventListener('click',()=>{if(i<T.length-1){[T[i+1],T[i]]=[T[i],T[i+1]];refresh(false);changedP();}});
        x.addEventListener('click',()=>{T.splice(i,1);refresh(false);changedP();});}
      box.appendChild(row);});};
  const drawCor=()=>{const box=cor.querySelector('.clist');box.innerHTML='';const C=P.corteo=P.corteo||[];
    if(!C.length)box.appendChild(h('<p class="muted">Nessun gruppo inserito.</p>'));
    C.forEach((c,i)=>{const row=h('<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2"><b>'+esc(c)+'</b></div>'+(edit?'<div class="tbtn"><button type="button" aria-label="Su">↑</button><button type="button" aria-label="Giù">↓</button><button type="button" class="ko" aria-label="Togli">×</button></div>':'')+'</div>');
      if(edit){const [up,dn,x]=row.querySelectorAll('.tbtn button');up.addEventListener('click',()=>{if(i>0){[C[i-1],C[i]]=[C[i],C[i-1]];drawCor();changedP();}});dn.addEventListener('click',()=>{if(i<C.length-1){[C[i+1],C[i]]=[C[i],C[i+1]];drawCor();changedP();}});x.addEventListener('click',()=>{C.splice(i,1);drawCor();changedP();});}
      box.appendChild(row);});};
  if(edit){m.on('click',e=>{P.tappe=P.tappe||[];P.tappe.push({lat:e.latlng.lat,lng:e.latlng.lng,n:'',sosta:'',min:0});refresh(false);changedP();});
    cor.querySelector('#cadd').addEventListener('click',()=>{const v=cor.querySelector('#ca').value.trim();if(!v)return;P.corteo=P.corteo||[];P.corteo.push(v);cor.querySelector('#ca').value='';drawCor();changedP();});
    dati.querySelector('#pd_d').addEventListener('change',e=>{P.data=e.target.value;refresh(false);changedP();});
    dati.querySelector('#pd_o').addEventListener('change',e=>{P.ora=e.target.value;refresh(false);changedP();});
    dati.querySelector('#pd_f').addEventListener('change',e=>{P.fragili=e.target.checked;refresh(false);changedP();});
    const fsync=()=>{P.forn={serve:dati.querySelector('#pd_fs').checked,cosa:[...dati.querySelectorAll('.fc input:checked')].map(x=>x.value)};changedP();};
    dati.querySelectorAll('#pd_fs,.fc input').forEach(x=>x.addEventListener('change',fsync));}
  refresh(true);drawCor();
  const act=h('<div class="big-btns"></div>');
  if(edit){const b=h('<button type="button" class="bb dark">Manda alla Sicurezza</button>');b.addEventListener('click',()=>{if((P.tappe||[]).length<2){stEl.textContent='Servono almeno partenza e arrivo.';return;}
      sheet('Mandare alla Sicurezza?','<p style="font-size:17px">La Sicurezza riceve una notifica, controlla il percorso, aggiunge uscite, bagni e soccorsi e lo convalida. Nel frattempo non puoi modificarlo.</p>','Manda',async()=>{clearTimeout(saveT);P.stato='Alla Sicurezza';P.inviato_il=new Date().toISOString();if(!await salvaP(r))return false;
        await avvisa('v-psic','Percorso da convalidare: «'+P.nome+'»','v-psic');await loadVD();rerender();});});act.appendChild(b);}
  if(can&&P.stato==='Convalidato'){const b=h('<button type="button" class="bb dark">Pubblica a tutti</button>');b.addEventListener('click',()=>sheet('Pubblicare il percorso?','<p style="font-size:17px">Tutti gli utenti vedranno orario, lunghezza, percorso, soste, corteo e punti della Sicurezza.</p>','Pubblica',async()=>{P.stato='Pubblicato';P.pubblicato_il=new Date().toISOString();if(!await salvaP(r))return false;await avvisa('*','Pubblicato il percorso «'+P.nome+'»','p-pub');await loadVD();rerender();}));act.appendChild(b);}
  if(can&&P.stato==='Alla Sicurezza'){const b=h('<button type="button" class="bb soft">Riprendi per modificarlo</button>');b.addEventListener('click',async()=>{P.stato='Bozza';await salvaP(r);await loadVD();rerender();});act.appendChild(b);}
  if(can){const b=h('<button type="button" class="bb soft ko">Elimina il percorso</button>');b.addEventListener('click',()=>ask('Eliminare «'+P.nome+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);PSEL['v-perc']=null;await loadVD();rerender();}));act.appendChild(b);}
  el.appendChild(act);
  ricaduteBox(el,r,P,can);
  const fp=prevPerc(P);if(fp.length)el.appendChild(h('<section class="card"><h3>Fornitori del percorso</h3>'+fp.map(x=>'<div class="rq"><div><b>'+esc(x.dati.voce.replace(/^Percorso .*? – /,''))+'</b><span>'+esc(x.dati.fornitore||'fornitore da trovare')+' · '+esc(x.dati.stato||'')+'</span></div><b>'+(+x.dati.importo?eur(+x.dati.importo):'')+'</b></div>').join('')+'</section>'));}
function prevPerc(P){return (VD['v-prev']||[]).filter(x=>(x.dati.voce||'').startsWith('Percorso '+P.nome+' – '));}

/* --- Sicurezza: percorsi da convalidare --- */
async function renderPsic(){const id='v-psic',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);
  const r=PSEL[id]&&findP(PSEL[id]);if(r)return editorSic(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>Percorsi da convalidare</h2><p>Quando qualcuno manda un percorso, lo trovi qui. Lo apri, aggiungi uscite, bagni, soccorsi, acqua e transenne sulla mappa, poi lo convalidi o lo rimandi indietro con una nota.</p></div>'));
  const da=vperc().filter(r=>r.dati.stato==='Alla Sicurezza'),ok=vperc().filter(r=>['Convalidato','Pubblicato'].includes(r.dati.stato));
  el.appendChild(h('<h3 class="gh">Da convalidare · '+da.length+'</h3>'));const g=h('<div class="cgrid"></div>');da.forEach(r=>g.appendChild(percCard(r,null,id)));el.appendChild(g);
  if(!da.length)el.appendChild(h('<div class="card soon"><p>Nessun percorso in attesa.</p></div>'));
  if(ok.length){el.appendChild(h('<h3 class="gh">Già convalidati · '+ok.length+'</h3>'));const g2=h('<div class="cgrid"></div>');ok.forEach(r=>g2.appendChild(percCard(r,null,id)));el.appendChild(g2);}}
async function editorSic(el,r,can){const P=r.dati;P.sic=P.sic||{punti:[],nota:''};const edit=can&&P.stato==='Alla Sicurezza';const edPts=can&&P.stato!=='Bozza'&&P.stato!=='Rimandato';MAPEDIT=true;let tipo='uscita';
  el.appendChild(backTo('v-psic','Tutti i percorsi'));
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>'+esc(P.nome)+'</h2>'+steps(P.stato)+'<p>'+(P.data?fmtD(P.data):'')+(P.ora?' · ore '+esc(P.ora)+(fine(P)?' → '+fine(P):''):'')+' · '+fmtM(lung(P.tappe||[]))+' · '+fmtMin(durata(P))+(P.fragili?' · <b>con anziani e disabili</b>':'')+'</p></div>'));
  const tools=h('<section class="card mapcard">'+(edPts?'<p class="hint">Scegli cosa mettere, poi tocca la mappa. Tocca un punto già messo per toglierlo.</p><div class="seg wrap ptools">'+Object.entries(PT).map(([k,d])=>'<button type="button" data-t="'+k+'" aria-pressed="'+(k===tipo)+'"><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> '+d[0]+'</button>').join('')+'</div>':'')+'<div class="lmap" id="smap"></div>'+legenda()+'</section>');el.appendChild(tools);
  const cnt=h('<section class="card"><h3>Cosa hai segnato</h3><div class="pcount"></div></section>');el.appendChild(cnt);
  const avv=h('<div></div>');el.appendChild(avv);
  const nt=h('<section class="card"><h3>Nota della Sicurezza</h3><textarea id="snota" placeholder="Per esempio: servono steward all’incrocio con via Ridola"'+(edPts?'':' disabled')+'>'+esc(P.sic.nota||'')+'</textarea></section>');el.appendChild(nt);
  if((P.corteo||[]).length)el.appendChild(h('<section class="card"><h3>Ordine del corteo</h3>'+P.corteo.map((c,i)=>'<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2"><b>'+esc(c)+'</b></div></div>').join('')+'</section>'));
  await leaflet();if(cur!=='v-psic')return;
  const m=mkMap(tools.querySelector('#smap'),'sic');let lay=null;
  const refresh=fit=>{if(lay)lay.remove();lay=drawRoute(m,P,{fit,onPoint:edPts?(i=>{P.sic.punti.splice(i,1);refresh(false);autoSave(r);}):null});
    const c={};P.sic.punti.forEach(p=>c[p.t]=(c[p.t]||0)+1);cnt.querySelector('.pcount').innerHTML=Object.entries(PT).map(([k,d])=>'<div class="fact2"><span><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> '+d[0]+'</span><b>'+(c[k]||0)+'</b></div>').join('');
    avv.innerHTML='';avv.appendChild(h(avvisiHtml(P)));};
  if(edPts){tools.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tipo=b.dataset.t;tools.querySelectorAll('[data-t]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
    m.on('click',e=>{P.sic.punti.push({lat:e.latlng.lat,lng:e.latlng.lng,t:tipo,n:''});refresh(false);autoSave(r);});
    nt.querySelector('#snota').addEventListener('change',e=>{P.sic.nota=e.target.value;autoSave(r);});}
  refresh(true);
  if(edit){const act=h('<div class="big-btns"><button type="button" class="bb dark">Convalida il percorso</button><button type="button" class="bb soft">Rimanda indietro</button></div>');
    act.children[0].addEventListener('click',()=>{const nForn=P.forn&&P.forn.serve?(P.forn.cosa||[]).length:0;
      sheet('Convalidare «'+P.nome+'»?','<p style="font-size:17px">Chi ha creato il percorso riceve una notifica e potrà pubblicarlo.'+(nForn?' Poi parte la richiesta di '+nForn+' preventivi ai fornitori ('+esc(P.forn.cosa.join(', '))+').':'')+'</p>','Convalida',async()=>{clearTimeout(saveT);
        P.sic.nota=nt.querySelector('#snota').value;if(!await salvaP(r))return false;
        const {error}=await CTX.sb.rpc('convalida_percorso',{pid:r.id});if(error)throw new Error(error.message);
        await Promise.all([loadVD(),loadSocial()]);rerender();stEl.textContent='Percorso convalidato.';});});
    act.children[1].addEventListener('click',()=>sheet('Rimandare indietro','<div class="ctl"><label for="rn">Cosa va cambiato</label><textarea id="rn"></textarea></div>','Rimanda',async(dl)=>{const n=dl.querySelector('#rn').value.trim();if(!n){dl.querySelector('.smsg').textContent='Scrivi cosa va cambiato.';return false;}
      clearTimeout(saveT);P.sic.nota=nt.querySelector('#snota').value;await salvaP(r);const {error}=await CTX.sb.rpc('rimanda_percorso',{pid:r.id,nota:n});if(error)throw new Error(error.message);await loadVD();rerender();}));
    el.appendChild(act);}}

/* --- Mappe degli ingegneri --- */
async function pdfImmagine(file){if(!window.pdfjsLib){await loadJs('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';}
  const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const pg=await pdf.getPage(1);const v0=pg.getViewport({scale:1});const sc=Math.min(3,2400/Math.max(v0.width,v0.height));const vp=pg.getViewport({scale:sc});
  const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:ctx,viewport:vp}).promise;
  return await new Promise(ok=>cv.toBlob(b=>ok({blob:b,w:cv.width,h:cv.height}),'image/png'));}
const urlCache={};async function firmata(f){if(urlCache[f.path]&&urlCache[f.path].t>Date.now()-600000)return urlCache[f.path].u;const {data}=await CTX.sb.storage.from('documenti').createSignedUrl(f.path,3600);if(!data)return null;urlCache[f.path]={u:data.signedUrl,t:Date.now()};return data.signedUrl;}
async function renderMsic(){const id='v-msic',el=document.getElementById(id);el.innerHTML='';const can=CTX.canEdit(id);const L1=VD[id]||[];
  const r=PSEL[id]&&L1.find(x=>x.id===PSEL[id]);if(r)return editorMsic(el,r,can);MAPEDIT=false;addBack(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>Mappe degli ingegneri</h2><p>Carica il PDF (o la foto) della planimetria: la appoggi sulla mappa vera di Matera e ci segni sopra uscite, bagni, soccorsi. Così diventa digitale e la vedono tutti.</p></div>'));
  if(can){const b=addBtn('+ Carica una mappa (PDF o immagine)',()=>{const d=sheet('Carica una mappa','<div class="ctl"><label for="mn">Nome</label><input type="text" id="mn" placeholder="Piano di sicurezza Piazza Vittorio Veneto"></div><label class="drop"><input type="file" id="mf" accept=".pdf,application/pdf,image/*">'+svg(IC2.map,30)+'<b>Tocca per scegliere</b><span>PDF o immagine della planimetria</span></label>','Carica',async(dl)=>{
      const f=dl.querySelector('#mf').files[0],n=dl.querySelector('#mn').value.trim()||(f&&f.name)||'';if(!f){dl.querySelector('.smsg').textContent='Scegli il file.';return false;}
      dl.querySelector('.smsg').textContent='Preparo l’immagine…';let img=f,w=0,hh=0;
      if(/pdf$/i.test(f.name)||f.type==='application/pdf'){const o=await pdfImmagine(f);img=new File([o.blob],'mappa.png',{type:'image/png'});w=o.w;hh=o.h;}
      else{const bm=await createImageBitmap(f);w=bm.width;hh=bm.height;}
      dl.querySelector('.smsg').textContent='Carico…';const orig=await carica(f,id);const im=img===f?orig:await carica(img,id);
      const asp=hh&&w?hh/w:0.7;const dLng=0.004,dLat=dLng*asp*Math.cos(MATERA[0]*Math.PI/180);
      const {data,error}=await CTX.sb.from('voci_dati').insert({voce:id,dati:{nome:n,file:orig,img:im,bounds:[[MATERA[0]+dLat/2,MATERA[1]-dLng/2],[MATERA[0]-dLat/2,MATERA[1]+dLng/2]],opac:0.7,punti:[]}}).select().single();if(error)throw new Error(error.message);
      await loadVD();PSEL[id]=data.id;rerender();});d.querySelector('#mf').addEventListener('change',e=>{const f=e.target.files[0];if(f)d.querySelector('.drop b').textContent=f.name;});});el.appendChild(b);}
  const box=h('<section class="card mapcard"><h3>Tutto quello che ha segnato la Sicurezza</h3><div class="lmap" id="allmap"></div>'+legenda()+'</section>');el.appendChild(box);
  const g=h('<div class="cgrid"></div>');L1.slice().reverse().forEach(x=>{const c=h('<article class="card rc"><b class="vn">'+esc(x.dati.nome||'Mappa')+'</b><div class="fact2"><span>Punti segnati</span><b>'+(x.dati.punti||[]).length+'</b></div><button type="button" class="bb dark">Apri</button></article>');c.querySelector('.bb').addEventListener('click',()=>{PSEL[id]=x.id;rerender();window.scrollTo({top:0});});if(x.dati.file)c.insertBefore(fileBtn(x.dati.file,'Apri il file originale'),c.querySelector('.bb'));g.appendChild(c);});el.appendChild(g);
  if(!L1.length)el.appendChild(h('<div class="card soon"><p>Ancora nessuna mappa caricata.</p></div>'));
  await leaflet();if(cur!==id)return;const m=mkMap(box.querySelector('#allmap'),'all',MATERA,15);const all=[];
  vperc().filter(r=>['Convalidato','Pubblicato','Alla Sicurezza'].includes(r.dati.stato)).forEach(r=>{drawRoute(m,r.dati,{fit:false});(r.dati.tappe||[]).forEach(t=>all.push([t.lat,t.lng]));});
  L1.forEach(x=>(x.dati.punti||[]).forEach(p=>{const d=PT[p.t]||PT.varco;L.marker([p.lat,p.lng],{icon:pinIcon(d[1],d[2],'sq')}).addTo(m).bindTooltip(d[0]+' · '+(x.dati.nome||''));all.push([p.lat,p.lng]);}));
  if(all.length)m.fitBounds(L.latLngBounds(all).pad(0.2),{maxZoom:17});}
async function editorMsic(el,r,can){const D2=r.dati;D2.punti=D2.punti||[];MAPEDIT=true;let tipo='uscita',mode='punti';
  el.appendChild(backTo('v-msic','Tutte le mappe'));
  el.appendChild(h('<div class="sh"><span class="eyb">Sicurezza</span><h2>'+esc(D2.nome||'Mappa')+'</h2><p>'+(can?'Prima appoggia la planimetria: trascina i due angoli finché strade e piazze coincidono. Poi segna i punti.':'Planimetria appoggiata sulla mappa di Matera.')+'</p></div>'));
  const tools=h('<section class="card mapcard">'+(can?'<div class="seg"><button type="button" data-m="allinea" aria-pressed="false">1 · Appoggia la planimetria</button><button type="button" data-m="punti" aria-pressed="true">2 · Segna i punti</button></div><div class="seg wrap ptools">'+Object.entries(PT).map(([k,d])=>'<button type="button" data-t="'+k+'" aria-pressed="'+(k===tipo)+'"><i class="dotp" style="background:'+d[2]+'">'+d[1]+'</i> '+d[0]+'</button>').join('')+'</div>':'')+'<label class="opac">Trasparenza della planimetria <input type="range" min="0" max="1" step="0.05" value="'+(D2.opac!=null?D2.opac:0.7)+'"></label><div class="lmap tall" id="mmap"></div>'+legenda()+'</section>');el.appendChild(tools);
  if(D2.file)el.appendChild(fileBtn(D2.file,'Apri il file originale'));
  if(can){const b=h('<button type="button" class="bb soft ko">Elimina la mappa</button>');b.addEventListener('click',()=>ask('Eliminare la mappa «'+(D2.nome||'')+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);PSEL['v-msic']=null;await loadVD();rerender();}));el.appendChild(b);}
  await leaflet();if(cur!=='v-msic')return;const m=mkMap(tools.querySelector('#mmap'),'msic');
  const url=D2.img?await firmata(D2.img):null;const ov=url?L.imageOverlay(url,D2.bounds,{opacity:D2.opac!=null?D2.opac:0.7,interactive:false}).addTo(m):null;m.fitBounds(L.latLngBounds(D2.bounds).pad(0.1));
  const k1=L.marker(D2.bounds[0],{draggable:true,icon:pinIcon('↖','#4A45B5')}),k2=L.marker(D2.bounds[1],{draggable:true,icon:pinIcon('↘','#4A45B5')});
  const upd=()=>{D2.bounds=[[k1.getLatLng().lat,k1.getLatLng().lng],[k2.getLatLng().lat,k2.getLatLng().lng]];if(ov)ov.setBounds(L.latLngBounds(D2.bounds));autoSave(r);};k1.on('drag',()=>{if(ov)ov.setBounds(L.latLngBounds([k1.getLatLng(),k2.getLatLng()]));}).on('dragend',upd);k2.on('drag',()=>{if(ov)ov.setBounds(L.latLngBounds([k1.getLatLng(),k2.getLatLng()]));}).on('dragend',upd);
  let lay=L.layerGroup().addTo(m);const drawPts=()=>{lay.clearLayers();D2.punti.forEach((p,i)=>{const d=PT[p.t]||PT.varco;const mk=L.marker([p.lat,p.lng],{icon:pinIcon(d[1],d[2],'sq')}).addTo(lay).bindTooltip(d[0]);if(can)mk.on('click',()=>{if(mode!=='punti')return;D2.punti.splice(i,1);drawPts();autoSave(r);});});};drawPts();
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
  const r=L1[Math.min(PSEL.pub||0,L1.length-1)];const P=r.dati;const fp=prevPerc(P);const costi=fp.filter(x=>x.dati.stato==='Accettato').reduce((a,x)=>a+(+x.dati.importo||0),0);
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Quando</span><b>'+(P.data?fmtD(P.data):'—')+'</b></div><div class="kpi"><span>Orario</span><b>'+(P.ora?esc(P.ora)+(fine(P)?' → '+fine(P):''):'—')+'</b></div><div class="kpi dark"><span>Lunghezza</span><b>'+fmtM(lung(P.tappe||[]))+' · '+fmtMin(durata(P))+'</b></div></div>'));
  const mc=h('<section class="card mapcard"><div class="lmap" id="pubmap"></div>'+legenda()+'</section>');el.appendChild(mc);
  el.appendChild(h('<section class="card"><h3>Tappe e soste</h3>'+(P.tappe||[]).map((t,i)=>'<div class="tappa"><span class="tn'+(t.sosta?' s':'')+'">'+(i+1)+'</span><div class="tb2"><b>'+esc(t.n||('Tappa '+(i+1)))+'</b><span class="muted small">'+(t.sosta?'Sosta: '+esc(t.sosta)+(t.min?' · '+t.min+' min':''):'Passaggio')+'</span></div></div>').join('')+'</section>'));
  if((P.corteo||[]).length)el.appendChild(h('<section class="card"><h3>Ordine del corteo</h3>'+P.corteo.map((c,i)=>'<div class="tappa"><span class="tn c">'+(i+1)+'</span><div class="tb2"><b>'+esc(c)+'</b></div></div>').join('')+'</section>'));
  el.appendChild(h('<section class="card"><h3>Fornitori e costi</h3>'+(fp.length?fp.map(x=>'<div class="rq"><div><b>'+esc(x.dati.voce.replace(/^Percorso .*? – /,''))+'</b><span>'+esc(x.dati.fornitore||'da scegliere')+' · '+esc(x.dati.stato||'')+'</span></div><b>'+(+x.dati.importo?eur(+x.dati.importo):'')+'</b></div>').join('')+'<div class="fact2"><span>Costi già decisi</span><b>'+eur(costi)+'</b></div>':'<p class="muted">Nessun fornitore richiesto per questo percorso.</p>')+(canV('s-cs')?'<button type="button" class="lnk2" data-go="s-cs">Calcola le ricadute economiche nella Simulazione impatto</button>':'')+'</section>'));
  ricaduteBox(el,r,P,false);
  if(P.sic&&P.sic.nota)el.appendChild(h('<section class="card"><h3>Indicazioni della Sicurezza</h3><p style="margin:0;white-space:pre-line">'+esc(P.sic.nota)+'</p></section>'));
  await leaflet();if(cur!=='p-pub')return;const m=mkMap(mc.querySelector('#pubmap'),'pub');drawRoute(m,P,{});}
function pubWidget(){const L1=vperc().filter(r=>r.dati.stato==='Pubblicato');const mine=CTX.canEdit('v-psic')?vperc().filter(r=>r.dati.stato==='Alla Sicurezza'):[];if(!L1.length&&!mine.length)return null;
  return h('<section class="w"><div class="wh"><b>Percorsi</b><button type="button" class="lnk2" data-go="p-pub">Tutti</button></div>'+(mine.length?'<div class="rq"><div><b>'+mine.length+' da convalidare</b><span class="neg">aspettano la Sicurezza</span></div><button type="button" class="bb dark sm" data-go="v-psic">Apri</button></div>':'')+L1.slice(0,3).map(r=>'<div class="rq"><div><b>'+esc(r.dati.nome)+'</b><span>'+(r.dati.data?fmtD(r.dati.data):'')+(r.dati.ora?' · ore '+esc(r.dati.ora):'')+' · '+fmtM(lung(r.dati.tappe||[]))+'</span></div></div>').join('')+'</section>');}
