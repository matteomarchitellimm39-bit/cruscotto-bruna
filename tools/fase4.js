/* ================= Bruna27 · Fase 4-5: assistente, notifiche sul telefono, richieste di documenti ================= */
let AION=false,MYREQ=[];
async function aiStato(){if(!CTX.sb||!CTX.sb.functions)return;try{const {data,error}=await CTX.sb.functions.invoke('assistente',{body:{tipo:'stato'}});AION=!error&&!!(data&&data.attivo);}catch(e){AION=false;}}
async function ai(tipo,payload){try{const {data,error}=await CTX.sb.functions.invoke('assistente',{body:Object.assign({tipo},payload||{})});
    if(error)return {err:'L’assistente non risponde. Riprova tra poco.'};if(data&&data.error)return {err:data.error==='limite'?'Hai usato l’assistente molte volte oggi: riprova domani.':data.error==='chiave'?'L’assistente non è ancora attivo.':'L’assistente ha avuto un problema: '+(data.dettaglio||data.error)};
    return {testo:(data&&data.testo)||''};}catch(e){return {err:'L’assistente non risponde.'};}}
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}},lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
function hashS(s){let x=0;for(let i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return String(x>>>0);}
function testoAI(t){return esc(t).replace(/^(Cosa fare|Cosa evitare|Chi coinvolgere|Primo passo)\s*:?/gm,'<b>$1</b><br>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>');}

/* --- riassunto della giornata scritto dall'assistente --- */
function fattiGiorno(){const me=CTX.user.id,today=todayISO();
  return {oggi:today,giorni_alla_bruna:countdown(),richieste_presidente_da_prendere:RICH.filter(r=>r.stato==='aperta').map(r=>r.titolo),
    mie_richieste_in_corso:RICH.filter(r=>r.preso_da===me&&r.stato==='presa').map(r=>({titolo:r.titolo,entro:r.entro,in_ritardo:!!(r.entro&&r.entro<today)})),
    cose_da_fare:myTodo().map(c=>({titolo:c.titolo,entro:c.entro})).slice(0,10),inviti_a_riunioni_senza_risposta:INVM.filter(i=>i.user_id===me&&i.stato==='invitato').length,
    prossime_riunioni:RIUN.filter(r=>new Date(r.quando)>new Date()).slice(0,3).map(r=>({titolo:r.titolo,quando:r.quando})),
    documenti_che_ti_chiedono:MYREQ.filter(r=>r.dati.stato!=='Arrivato').map(r=>({documento:r.dati.documento,entro:r.dati.entro})),
    pagamenti_fornitori_7_giorni:canV('v-for27')?prossimi(VD['v-for27']||[],7).map(x=>({fornitore:x.r.dati.fornitore,importo:x.p.importo,data:x.p.data})):undefined,
    percorsi_da_convalidare:CTX.canEdit('v-psic')?vperc().filter(r=>r.dati.stato==='Alla Sicurezza').map(r=>r.dati.nome):undefined};}
async function aiBriefing(){if(!AION)return;const box=document.querySelector('#p-home .brief');if(!box)return;const f=fattiGiorno();const k='b27brief:'+CTX.user.id+':'+hashS(JSON.stringify(f));
  const put=t=>{const b=document.querySelector('#p-home .brief');if(b){b.innerHTML=testoAI(t);if(!b.nextElementSibling||!b.nextElementSibling.classList.contains('aisig'))b.insertAdjacentHTML('afterend','<span class="aisig">Scritto dall’assistente con i dati della piattaforma</span>');}};
  const c=lsGet(k);if(c){put(c);return;}const r=await ai('briefing',{fatti:f});if(r.testo){lsSet(k,r.testo);put(r.testo);}}

/* --- consigli per le richieste del Presidente --- */
function consigliBox(r,c){if(r.consigli){c.appendChild(h('<div class="aibox"><div class="wh"><span class="orb sm"></span><b>L’assistente consiglia</b></div><p>'+testoAI(r.consigli)+'</p></div>'));}
  if(AION&&r.stato!=='fatta'){const b=h('<button type="button" class="lnk2">'+(r.consigli?'Aggiorna i consigli':'Chiedi consiglio all’assistente')+'</button>');b.addEventListener('click',async()=>{b.disabled=true;b.textContent='L’assistente sta pensando…';const x=await ai('richiesta',{id:r.id});if(x.err){b.textContent=x.err;return;}await loadSocial();rerender();});c.appendChild(b);}}
function aiConsigli(id){if(AION)ai('richiesta',{id}).then(async x=>{if(!x.err){await loadSocial();if(cur==='p-req')rerender();}});}

/* --- riassunto dei documenti --- */
function riassBtn(f){const b=h('<button type="button" class="filebtn soft">'+'<span class="orb sm"></span><span>Riassumi con l’assistente</span></button>');
  b.addEventListener('click',async()=>{const d=sheet('Riassunto di «'+(f.nome||'documento')+'»','<p class="riass">Leggo il documento…</p><p class="muted small">Il testo del documento viene mandato al servizio di intelligenza artificiale solo per fare il riassunto.</p>','Chiudi',async()=>{});const out=d.querySelector('.riass');
    try{const {data}=await CTX.sb.storage.from('documenti').createSignedUrl(f.path,600);if(!data)throw new Error('');const bl=await (await fetch(data.signedUrl)).blob();const L1=await pdfTesto(new File([bl],f.nome||'doc.pdf',{type:'application/pdf'}));const t=L1.join('\n').trim();
      if(t.length<40){out.textContent='Questo PDF è una scansione senza testo: non riesco a leggerlo.';return;}out.textContent='L’assistente sta scrivendo il riassunto…';
      const k='b27riass:'+f.path;const c=lsGet(k);if(c){out.innerHTML=testoAI(c);return;}const r=await ai('riassunto',{nome:f.nome,testo:t});if(r.err){out.textContent=r.err;return;}lsSet(k,r.testo);out.innerHTML=testoAI(r.testo);}
    catch(e){out.textContent='Non riesco a leggere il documento.';}});return b;}

/* --- richieste di documenti a una persona --- */
async function loadMyReq(){if(!CTX.sb)return;const {data}=await CTX.sb.from('voci_dati').select('*').eq('voce','v-req');MYREQ=(data||[]).filter(r=>r.dati&&r.dati.a_uid===CTX.user.id);}
R['v-req']=renderDocReq;
function renderDocReq(){const id='v-req',el=document.getElementById(id);el.innerHTML='';addBack(id);const can=CTX.canEdit(id);const L1=VD[id]||[];const today=todayISO();
  el.appendChild(h('<div class="sh"><span class="eyb">Amministrazione</span><h2>Richieste di documenti</h2><p>Chiedi un documento a una persona: se usa la piattaforma riceve una notifica e risponde allegando il file. Poi puoi aprirlo'+(AION?' e fartelo riassumere dall’assistente':'')+'.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(can){const b=h('<div class="big-btns"><button type="button" class="bb dark">Chiedi un documento</button></div>');b.firstChild.addEventListener('click',chiediDoc);el.appendChild(b);}
  const att=L1.filter(r=>r.dati.stato!=='Arrivato'),arr=L1.filter(r=>r.dati.stato==='Arrivato');
  [['In attesa',att],['Arrivati',arr]].forEach(([lab,LL])=>{if(!LL.length)return;el.appendChild(h('<h3 class="gh">'+lab+' · '+LL.length+'</h3>'));const g=h('<div class="cgrid"></div>');
    LL.slice().reverse().forEach(r=>{const d=r.dati;const late=d.stato!=='Arrivato'&&d.entro&&d.entro<today;
      const c=h('<article class="card rc"><div class="chips"><span class="chip2 '+(d.stato==='Arrivato'?'ok':late?'ko':'')+'">'+(d.stato==='Arrivato'?'Arrivato':late?'In ritardo':'Richiesto')+'</span>'+(d.a_uid?'<span class="chip2">Sulla piattaforma</span>':'')+'</div><b class="vn">'+esc(d.documento||'')+'</b><div class="fact2"><span>A chi</span><b>'+esc(d.a_uid?nome(d.a_uid):(d.a||'—'))+'</b></div>'+(d.entro?'<div class="fact2"><span>Entro il</span><b>'+fmtD(d.entro)+'</b></div>':'')+(d.da?'<div class="fact2"><span>Chiesto da</span><b>'+esc(nome(d.da))+'</b></div>':'')+(d.nota?'<p class="muted small">'+esc(d.nota)+'</p>':'')+'</article>');
      if(d.file&&d.file.path)c.appendChild(fileBtn(d.file,'Apri il documento'));
      if(can&&d.stato!=='Arrivato'){const u=h('<label class="bb sm upl">È arrivato: allega il file<input type="file" hidden></label>');u.querySelector('input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;stEl.textContent='Carico…';try{const k=await carica(f,id);await CTX.sb.from('voci_dati').update({dati:Object.assign({},d,{file:k,stato:'Arrivato'}),aggiornato:new Date().toISOString()}).eq('id',r.id);await loadVD();renderDocReq();stEl.textContent='Documento allegato.';}catch(err){stEl.textContent=err.message;}});c.appendChild(u);}
      if(can)c.appendChild(rowBtns(id,r));g.appendChild(c);});el.appendChild(g);});
  if(!L1.length)el.appendChild(h('<div class="card soon"><p>Nessuna richiesta di documenti.</p></div>'));}
function chiediDoc(){const ppl=Object.values(PEOPLE).filter(p=>p.id!==CTX.user.id);
  const d=sheet('Chiedi un documento','<div class="ctl"><label for="dq_d">Quale documento</label><input type="text" id="dq_d" placeholder="Per esempio: preventivo firmato delle luminarie"></div><div class="ctl"><label for="dq_p">A chi</label><select id="dq_p">'+ppl.map(p=>'<option value="'+p.id+'">'+esc(p.nome||p.email)+'</option>').join('')+'<option value="">Una persona esterna (scrivo il nome)</option></select></div><div class="ctl" id="dq_xw" hidden><label for="dq_x">Nome della persona esterna</label><input type="text" id="dq_x"></div><div class="ctl"><label for="dq_e">Entro quando</label><input type="date" id="dq_e" min="'+todayISO()+'"></div><div class="ctl"><label for="dq_n">Nota</label><textarea id="dq_n"></textarea></div>','Chiedi',async(dl)=>{
    const doc=dl.querySelector('#dq_d').value.trim();if(!doc){dl.querySelector('.smsg').textContent='Scrivi quale documento.';return false;}
    const uid=dl.querySelector('#dq_p').value,ext=dl.querySelector('#dq_x').value.trim();if(!uid&&!ext){dl.querySelector('.smsg').textContent='Scrivi il nome della persona.';return false;}
    const o={documento:doc,a_uid:uid||'',a:uid?nome(uid):ext,entro:dl.querySelector('#dq_e').value,stato:'Richiesto',nota:dl.querySelector('#dq_n').value.trim(),da:CTX.user.id};
    const {error}=await CTX.sb.from('voci_dati').insert({voce:'v-req',dati:o});if(error)throw new Error(error.message);
    if(uid)await avvisaUtente(uid,nome(CTX.user.id)+' ti chiede un documento: «'+doc+'»'+(o.entro?' entro il '+fmtD(o.entro):''),'p-me');
    await loadVD();renderDocReq();stEl.textContent=uid?'Richiesta inviata: riceve una notifica.':'Richiesta salvata.';});
  const sel=d.querySelector('#dq_p');const tg=()=>{d.querySelector('#dq_xw').hidden=!!sel.value;};sel.addEventListener('change',tg);tg();}
async function meDocs(el){await loadMyReq();if(!MYREQ.length)return;const me=CTX.user.id;
  const c=h('<section class="card"><h3>Documenti che ti chiedono</h3></section>');
  MYREQ.slice().reverse().forEach(r=>{const d=r.dati;const row=h('<div class="rq"><div><b>'+esc(d.documento)+'</b><span>Te lo chiede '+esc(nome(d.da))+(d.entro?' · entro il '+fmtD(d.entro):'')+(d.nota?' · '+esc(d.nota):'')+'</span></div>'+(d.stato==='Arrivato'?'<span class="chip2 ok">Inviato</span>':'<label class="bb dark sm upl">Rispondi con il file<input type="file" hidden></label>')+'</div>');
    const inp=row.querySelector('input');if(inp)inp.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;stEl.textContent='Carico il file…';try{const k=await carica(f,'risposte/'+me);const {error}=await CTX.sb.rpc('rispondi_documento',{rid:r.id,f:k});if(error)throw new Error(error.message);await loadMyReq();renderMe();stEl.textContent='Documento inviato. '+nome(d.da)+' riceve una notifica.';}catch(err){stEl.textContent=err.message;}});
    c.appendChild(row);});el.appendChild(c);}

/* --- notifiche sul telefono (anche a sito chiuso) --- */
const SW_OK=('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function b64u(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0));}
async function swReg(){if(!SW_OK)return null;try{return await navigator.serviceWorker.register('sw.js');}catch(e){return null;}}
async function pushAttiva(){if(!SW_OK||Notification.permission!=='granted')return false;const r=await navigator.serviceWorker.getRegistration();if(!r)return false;return !!(await r.pushManager.getSubscription());}
async function attivaPush(){if(!window.CFG||!CFG.vapid)throw new Error('Le notifiche non sono ancora configurate dall’amministratore.');
  if(!SW_OK)throw new Error(isIOS?'Su iPhone prima aggiungi Bruna27 alla schermata Home (vedi sotto), poi aprilo dall’icona.':'Questo browser non supporta le notifiche.');
  const reg=await swReg();if(!reg)throw new Error('Non riesco a preparare le notifiche su questo dispositivo.');
  const perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('Hai rifiutato le notifiche: si possono riattivare dalle impostazioni del telefono.');
  await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(CFG.vapid)});
  const {error}=await CTX.sb.from('push_iscrizioni').upsert({endpoint:sub.endpoint,dati:sub.toJSON(),user_id:CTX.user.id,dispositivo:navigator.userAgent.slice(0,120)},{onConflict:'endpoint'});if(error)throw new Error('Non salvato: '+error.message);}
async function mePush(el){const on=await pushAttiva();
  const c=h('<section class="card"><h3>Notifiche sul telefono e sul computer</h3><p class="pstate">'+(on?'<span class="chip2 ok">Attive su questo dispositivo</span>':'Ricevi le notifiche come su WhatsApp, anche con il sito chiuso.')+'</p>'+
    (isIOS&&!standalone()?'<div class="aibox"><b>Su iPhone, una volta sola:</b><p>In Safari tocca il pulsante Condividi (il quadrato con la freccia), poi «Aggiungi alla schermata Home». Apri Bruna27 dall’icona e torna qui per attivarle.</p></div>':'')+
    '<div class="big-btns">'+(on?'<button type="button" class="bb" id="ptest">Mandami una notifica di prova</button>':'<button type="button" class="bb dark" id="pon">Attiva le notifiche</button>')+'</div><p class="smsg" id="pmsg"></p></section>');
  const m=c.querySelector('#pmsg');
  const pon=c.querySelector('#pon');if(pon)pon.addEventListener('click',async()=>{m.textContent='Attivo…';try{await attivaPush();c.querySelector('.pstate').innerHTML='<span class="chip2 ok">Attive su questo dispositivo</span>';m.textContent='Fatto. Ora ricevi le notifiche.';pon.remove();}catch(e){m.textContent=e.message;}});
  const pt=c.querySelector('#ptest');if(pt)pt.addEventListener('click',async()=>{await avvisaUtente(CTX.user.id,'Prova: le notifiche di Bruna27 funzionano.','p-me');m.textContent='Inviata: arriva tra qualche secondo.';});
  el.insertBefore(c,[...el.children].pop());}
async function extraLoad(){await Promise.all([loadMyReq(),aiStato()]);}
function dopoAvvio(){swReg();try{const g0=new URLSearchParams(location.search).get('go');if(g0&&canOpen(g0)){history.replaceState(null,'',location.pathname);go(g0);}}catch(e){}
  if(SW_OK)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.go&&canOpen(e.data.go))go(e.data.go);});}
