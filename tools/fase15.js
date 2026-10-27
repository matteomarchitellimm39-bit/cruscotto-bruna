/* ================= Bruna27 · Fase B: Crea evento guidato, attività per area, 24 ore, revisione dell'amministratore ================= */
const ESIG=[
  ['eco','Economia','#2F63F0',['Previsione dei costi','Ricerca dei fornitori','Richiesta di preventivi','Valutazione dei ricavi','Sponsorizzazioni','Contratti e impegni economici','Fatture da emettere','Pagamenti da programmare']],
  ['sic','Sicurezza','#2A9D8F',['Verifica delle necessità di sicurezza','Autorizzazioni o documenti tecnici','Valutazioni logistiche','Presidi (soccorso, vigilanza)','Percorso','Mappe e sopralluoghi']],
  ['adm','Amministrazione','#182C6B',['Autorizzazioni pubbliche','Pratica SUAP','Adempimenti SIAE','Richieste a enti e istituzioni','Documenti amministrativi','Protocolli e scadenze']],
  ['org','Organizzazione','#C9952A',['Inviti','Contatti con partecipanti e ospiti','Comunicazione','Materiali','Allestimenti','Programma operativo']]];
const FORN=['Palco','Audio','Luci','Transenne','Servizi tecnici','Allestimenti','Altre prestazioni'];
const ORE24=24*3600*1000;
const durata15=ms=>{const m=Math.max(1,Math.round(Math.abs(ms)/60000));const o=Math.floor(m/60),mm=m%60;return (o?o+(o===1?' ora':' ore'):'')+(o&&mm?' e ':'')+(mm&&o<10?mm+(mm===1?' minuto':' minuti'):'')||(o+' ore');};
const selP=(id,v,vuoto)=>'<select id="'+id+'">'+(vuoto?'<option value="">'+esc(vuoto)+'</option>':'')+Object.values(PEOPLE).filter(p=>p.attivo!==false).map(p=>'<option value="'+p.id+'"'+(p.id===v?' selected':'')+'>'+esc(p.nome||p.email)+'</option>').join('')+'</select>';
const dataOra=t=>new Date(t).toLocaleString('it-IT',{weekday:'short',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});

// --- attività dell'evento (sono compiti collegati alla scheda) ---
const attEv=e=>COMP.filter(c=>c.evento_id===String(e.id));
const attOk=c=>c.fatto||c.stato==='non_necessario';
const attLate=c=>!attOk(c)&&c.stato!=='attesa'&&c.scade_il&&new Date(c.scade_il)<new Date();
function prepCompleta(e){const s=evRaw(e);if(!s.esig)return false;const A=attEv(e);return A.length>0&&A.every(c=>attOk(c)||c.stato==='attesa');}
const _evAppr15=evAppr;evAppr=function(e){const a=_evAppr15(e);return a==='proposta'&&prepCompleta(e)?'da_confermare':a;};
const _evAvanz15=evAvanz;evAvanz=function(e){const A=attEv(e);if(!A.length)return _evAvanz15(e);const f=A.filter(attOk).length;return {f,t:A.length,pc:Math.round(f/A.length*100),l:'attività completate'};};
const _evCrit15=evCrit;evCrit=function(e){const out=_evCrit15(e).filter(x=>!/permessi/.test(x)||!attEv(e).length);const A=attEv(e);const l=A.filter(attLate).length;if(l)out.unshift(l+(l===1?' attività in ritardo':' attività in ritardo'));
  const s=evRaw(e);if(s.appr==='proposta'&&s.motivo_mod)out.push('L’amministratore ha chiesto modifiche');return out;};
function statoAtt(c){if(c.stato==='non_necessario')return ['Non necessario',''];if(c.fatto)return ['Fatto','ok'];if(c.stato==='attesa')return ['In attesa','warn'];if(c.stato==='modifiche')return ['Da rivedere','ko'];if(attLate(c))return ['In ritardo','ko'];return ['Da fare','nw'];}
async function avvisaAdmin(testo,link){for(const p of Object.values(PEOPLE))if(p.admin&&p.id!==CTX.user.id)await avvisaUtente(p.id,testo,link);}
async function cambiaAtt(e,c,campi,cosa){const prima=prepCompleta(e);await aggiornaCompito(c,campi,cosa);
  if(!prima&&prepCompleta(e)){await avvisaAdmin('La scheda dell’evento «'+e.n+'» è completa: serve la tua revisione per approvarlo.','sec-evt#'+e.id);stEl.textContent='Scheda completa: l’amministratore riceve la notifica per la revisione.';}}
function inAttesa(e,c){const dl=sheet('In attesa','<p>«'+esc(c.titolo)+'»</p><div class="ctl"><label for="ia_m">Perché è in attesa?</label><textarea id="ia_m" placeholder="Per esempio: aspettiamo la risposta del Comune"></textarea></div><div class="ctl"><label for="ia_c">Chi segue la risposta</label>'+selP('ia_c',CTX.user.id)+'</div>','Salva',async(x)=>{
  const m=x.querySelector('#ia_m').value.trim();if(!m){x.querySelector('.smsg').textContent='Scrivi il motivo.';return false;}const chi=x.querySelector('#ia_c').value;
  await cambiaAtt(e,c,{stato:'attesa',nota:m+' — segue '+nome(chi)},'In attesa: '+m);});}
function nonNecessario(e,c){sheet('Non necessario','<p>«'+esc(c.titolo)+'» non serve per questo evento?</p><div class="ctl"><label for="nn_m">Perché (facoltativo)</label><textarea id="nn_m" placeholder="Per esempio: l’evento è in un luogo chiuso, non serve il percorso"></textarea></div>','Conferma',async(x)=>{
  await cambiaAtt(e,c,{fatto:true,stato:'non_necessario',nota:x.querySelector('#nn_m').value.trim()||null},'Non necessario');});}
function bloccoPrep(e){const s=evRaw(e);const box=h('<section class="ev15prep"></section>');if(!s.esig)return box;const A=attEv(e);const me=CTX.user.id;
  const tot=A.length,ok=A.filter(attOk).length,att=A.filter(c=>c.stato==='attesa'&&!c.fatto).length,late=A.filter(attLate).length;const fine=new Date(s.scade||0).getTime();const ora=Date.now();const compl=prepCompleta(e);
  const cd=compl?'<div class="ev15cd ok"><b>Scheda completa</b><span>Tutte le aree hanno risposto'+(att?' ('+att+' in attesa di una risposta esterna)':'')+'.</span></div>':
    fine>ora?'<div class="ev15cd"><b>Restano '+durata15(fine-ora)+'</b><span>per completare la scheda · entro '+esc(dataOra(fine))+'</span><i style="--w:'+Math.max(2,Math.min(100,(fine-ora)/ORE24*100))+'%"></i></div>':
    '<div class="ev15cd ko"><b>Tempo scaduto da '+durata15(ora-fine)+'</b><span>Le 24 ore servono a raccogliere le informazioni: non è un’approvazione.</span></div>';
  box.innerHTML='<p class="b26lab">Preparazione della scheda</p>'+cd+'<p class="ev15cnt"><b>'+ok+' su '+tot+'</b> attività completate'+(att?' · '+att+' in attesa':'')+(late?' · <span class="neg">'+late+' in ritardo</span>':'')+'</p>';
  ESIG.forEach(([k,n,col])=>{const g=s.esig[k];if(!g)return;const L=A.filter(c=>c.titolo.indexOf(' · '+n+': ')>0);
    const sec=h('<div class="ev15area" style="--c:'+col+'"><div class="ev15ah"><span class="av9 sm" style="--c:'+col+'">'+n.slice(0,2).toUpperCase()+'</span><b>'+n+'</b><em>'+(g.serve?esc(nome(g.resp)):'Non necessario')+'</em></div></div>');
    if(!g.serve)sec.appendChild(h('<p class="muted small" style="margin:0">Chi ha creato l’evento ha indicato che quest’area non serve.</p>'));
    L.forEach(c=>{const [t,cl]=statoAtt(c);const r=h('<div class="ev15att"><span class="ev15an">'+esc(c.titolo.split(': ').slice(1).join(': '))+(c.nota?'<small>'+esc(c.nota)+'</small>':'')+'</span><span class="chip2 '+cl+'">'+t+'</span></div>');
      const mio=c.per===me,adm=CTX.admin||c.da===me;const bt=[];
      if(mio&&!attOk(c))bt.push(['Fatto',()=>cambiaAtt(e,c,{fatto:true,stato:'fatto'},'Fatto'),true],c.stato!=='attesa'?['In attesa',()=>inAttesa(e,c)]:null,['Non necessario',()=>nonNecessario(e,c)]);
      if(attOk(c)&&(mio||adm)){const ra=h('<button type="button" class="lnk2 ev15ra">Riapri</button>');ra.addEventListener('click',()=>cambiaAtt(e,c,{fatto:false,stato:'assegnato'},'Riaperto'));r.insertBefore(ra,r.lastElementChild);}
      if(bt.filter(Boolean).length){const w=h('<div class="ev15ab"></div>');bottoni(w,bt);r.appendChild(w);}sec.appendChild(r);});
    if(g.serve&&k==='eco'&&(g.forn||[]).length)sec.appendChild(h('<p class="muted small" style="margin:4px 0 0">Forniture: '+esc(g.forn.join(', '))+'</p>'));
    box.appendChild(sec);});
  // revisione dell'amministratore
  const a=evAppr(e);
  if(s.motivo_rif&&a==='rifiutato')box.appendChild(h('<div class="ev14crit"><b>Rifiutato dall’amministratore</b><span>'+esc(s.motivo_rif)+'</span></div>'));
  if(s.motivo_mod&&s.appr==='proposta')box.appendChild(h('<div class="ev14crit"><b>Modifiche richieste</b><span>'+esc(s.motivo_mod)+'</span></div>'));
  if(CTX.admin){const rv=h('<div class="ev15rev"><p class="b26lab">Revisione dell’amministratore</p></div>');
    if(a==='proposta'||a==='da_confermare'){if(!compl)rv.appendChild(h('<p class="muted small" style="margin:0 0 6px">La scheda non è ancora completa: puoi comunque decidere.</p>'));bottoni(rv,[['Approva',()=>approva15(e),true],['Richiedi modifiche',()=>richiediModifiche(e)],['Rifiuta',()=>rifiuta(e)]]);}
    else if(a==='approvato')bottoni(rv,[['Pubblica',()=>pubblica(e),true],['Richiedi modifiche',()=>richiediModifiche(e)]]);
    else if(a==='pubblicato')rv.appendChild(h('<p class="muted small" style="margin:0">Pubblicato: è nel Calendario eventi ufficiali, nella Panoramica e nella Home.</p>'));
    if(rv.children.length>1)box.appendChild(rv);}
  return box;}
function personeEv(e){const s=evRaw(e);return [...new Set([s.resp,s.creatore].concat(attEv(e).map(c=>c.per)).filter(x=>x&&x!==CTX.user.id))];}
async function approva15(e){setStato(e,{appr:'approvato',st:'ok',motivo_mod:null,motivo_rif:null});changed();for(const u of personeEv(e))await avvisaUtente(u,'L’evento «'+e.n+'» è stato approvato.','sec-evt#'+e.id);stEl.textContent='«'+e.n+'» è approvato. Ora puoi pubblicarlo.';rerender();}
async function pubblica(e){if(evAppr(e)!=='approvato'){stEl.textContent='Si pubblica solo dopo l’approvazione.';return;}setStato(e,{appr:'pubblicato'});changed();for(const u of personeEv(e))await avvisaUtente(u,'L’evento «'+e.n+'» è pubblicato: è nel calendario ufficiale.','sec-evt#'+e.id);stEl.textContent='Evento pubblicato.';rerender();}
function rifiuta(e){sheet('Rifiuta «'+e.n+'»','<div class="ctl"><label for="rf_m">Motivo (lo leggono il responsabile e chi ha creato l’evento)</label><textarea id="rf_m"></textarea></div>','Rifiuta',async(x)=>{const m=x.querySelector('#rf_m').value.trim();if(!m){x.querySelector('.smsg').textContent='Scrivi il motivo.';return false;}
  setStato(e,{appr:'rifiutato',motivo_rif:m});changed();for(const u of personeEv(e))await avvisaUtente(u,'L’evento «'+e.n+'» non è stato approvato: '+m,'sec-evt#'+e.id);stEl.textContent='Evento rifiutato.';});}
function richiediModifiche(e){const s=evRaw(e);const A=attEv(e);const aree=ESIG.filter(([k])=>s.esig&&s.esig[k]&&s.esig[k].serve);
  sheet('Richiedi modifiche','<div class="ctl"><label for="rm_m">Che cosa va cambiato?</label><textarea id="rm_m"></textarea></div><p class="lab">Quali aree devono rivedere la loro parte</p><div class="checks">'+aree.map(([k,n])=>'<label><input type="checkbox" value="'+k+'"> '+n+' · '+esc(nome(s.esig[k].resp))+'</label>').join('')+'</div><p class="muted small">Le attività di queste aree si riaprono con 24 ore per rispondere. Il responsabile principale riceve comunque la notifica.</p>','Invia',async(x)=>{
    const m=x.querySelector('#rm_m').value.trim();if(!m){x.querySelector('.smsg').textContent='Scrivi che cosa va cambiato.';return false;}
    const ks=[...x.querySelectorAll('.checks input:checked')].map(i=>i.value);const sc=new Date(Date.now()+ORE24).toISOString();
    for(const [k,n] of ESIG.filter(z=>ks.includes(z[0])))for(const c of A.filter(c=>c.titolo.indexOf(' · '+n+': ')>0))
      await CTX.sb.from('compiti').update({fatto:false,stato:'modifiche',nota:'Modifiche richieste: '+m,scade_il:sc,entro:sc.slice(0,10),avvisato_prima:false,avvisato_ritardo:false,storico:(c.storico||[]).concat([{quando:new Date().toISOString(),chi:CTX.user.id,cosa:'Modifiche richieste'}]).slice(-30)}).eq('id',c.id);
    setStato(e,{appr:'proposta',motivo_mod:m,scade:sc});changed();
    const dest=new Set(ks.map(k=>s.esig[k].resp).concat([s.resp]).filter(x=>x&&x!==CTX.user.id));for(const u of dest)await avvisaUtente(u,'Modifiche richieste per «'+e.n+'»: '+m,'sec-evt#'+e.id);
    await loadSocial();rerender();stEl.textContent='Richiesta di modifiche inviata.';});}
// il riquadro della preparazione compare nel dettaglio della Panoramica
const _az15=azioniEvento;azioniEvento=function(e,box){if(box&&box.classList&&box.classList.contains('c12det'))box.appendChild(bloccoPrep(e));_az15(e,box);};
// le notifiche «sec-evt#id» aprono la carta dell'evento
const _go15=go;go=function(id){const s=String(id||'');if(s.indexOf('sec-evt#')===0){EVQ='';EVFS='tutti';EVFC='tutti';EVFD='tutti';EVFR='tutti';CSELK['sec-evt']=s.split('#')[1];return _go15('sec-evt');}return _go15(id);};

// --- Impostazioni: responsabili predefiniti per area (si possono cambiare evento per evento) ---
const _imp15=impostazioniCard;impostazioniCard=function(){const c=_imp15();
  const b=h('<section class="card"><h3>Eventi: responsabili predefiniti per area</h3><p class="muted small">Quando qualcuno crea un evento, queste persone sono proposte per ogni area. Si possono cambiare evento per evento.</p>'+ESIG.map(([k,n])=>'<div class="ctl"><label for="ie_'+k+'">'+n+'</label>'+selP('ie_'+k,IMP['resp_ev_'+k],'Nessuno')+'</div>').join('')+'<div class="big-btns"><button type="button" class="bb dark" id="ie_s">Salva</button></div><p class="smsg muted small"></p></section>');
  b.querySelector('#ie_s').addEventListener('click',async()=>{const v=Object.assign({},IMP);ESIG.forEach(([k])=>v['resp_ev_'+k]=b.querySelector('#ie_'+k).value||null);
    const {error}=await CTX.sb.from('impostazioni').upsert({chiave:'generali',valore:v,aggiornato:new Date().toISOString()});b.querySelector('.smsg').textContent=error?'Errore: '+error.message:'Salvate.';if(!error)IMP=v;});
  const w=h('<div></div>');w.appendChild(c);w.appendChild(b);return w;};

// --- Crea evento: 4 passaggi ---
let CW=null;
function cwNuovo(){CW={step:1,n:'',p:'I',desc:'',d1:'',d2:'',oi:'',of:'',luogo:'',resp:CTX.user.id,obi:'',note:'',files:[],esig:{},costo:0,ricavi:0,inPrev:true,anno:''};
  ESIG.forEach(([k])=>CW.esig[k]={serve:null,att:[],forn:[],resp:IMP['resp_ev_'+k]||''});}
const PASSI=['Informazioni','Che cosa serve','Chi se ne occupa','Controlla e invia'];
function cwLeggi(el){const v=s=>{const x=el.querySelector(s);return x?x.value:undefined;};
  if(CW.step===1){['n','desc','d1','d2','oi','of','luogo','resp','obi','note','anno'].forEach(k=>{const x=v('#cw_'+k);if(x!==undefined)CW[k]=k==='n'||k==='luogo'?x.trim():x;});const f=el.querySelector('#cw_f');if(f&&f.files.length)CW.files=[...f.files];}
  if(CW.step===3)ESIG.forEach(([k])=>{const x=v('#cw_r_'+k);if(x!==undefined)CW.esig[k].resp=x;});
  if(CW.step===4){const c=v('#cw_c');if(c!==undefined)CW.costo=Math.max(0,Number(c)||0);const ri=v('#cw_ri');if(ri!==undefined)CW.ricavi=Math.max(0,Number(ri)||0);const b=el.querySelector('#cw_b');if(b)CW.inPrev=b.checked;}}
function cwErrore(){if(CW.step===1){if(!CW.n)return 'Scrivi il nome dell’evento.';if(!CW.d1)return 'Scegli la data.';if(!CW.luogo)return 'Scrivi il luogo.';if(!CW.anno)return 'Scegli a quale edizione appartiene l’evento: serve a collegarlo al bilancio giusto.';if(!CW.resp)return 'Scegli il responsabile principale.';if(CW.d2&&CW.d2<CW.d1)return 'La data di fine viene prima di quella di inizio.';}
  if(CW.step===2){for(const [k,n] of ESIG){const g=CW.esig[k];if(g.serve===null)return 'Per «'+n+'» scegli «Serve» oppure «Non necessario».';if(g.serve&&!g.att.length)return 'Per «'+n+'» spunta almeno un’attività, oppure scegli «Non necessario».';}}
  if(CW.step===3){for(const [k,n] of ESIG)if(CW.esig[k].serve&&!CW.esig[k].resp)return 'Scegli chi se ne occupa per «'+n+'».';}return '';}
function wizard(){const box=h('<section class="w h13w ev15wiz"></section>');const ridisegna=()=>{const nb=wizard();box.replaceWith(nb);window.scrollTo({top:Math.max(0,nb.getBoundingClientRect().top+window.scrollY-90)});};
  if(!CW)cwNuovo();
  box.innerHTML='<div class="wh"><b>Crea evento</b><span class="muted small">Passaggio '+CW.step+' di 4</span></div><ol class="ev15steps">'+PASSI.map((t,i)=>'<li class="'+(i+1<CW.step?'fatto':i+1===CW.step?'ora':'')+'"><span>'+(i+1<CW.step?'✓':i+1)+'</span>'+t+'</li>').join('')+'</ol><div class="ev15body"></div><p class="smsg neg"></p><div class="big-btns ev15nav"></div>';
  const B=box.querySelector('.ev15body');
  if(CW.step===1){B.innerHTML='<div class="ctl"><label for="cw_n">Nome dell’evento</label><input type="text" id="cw_n" value="'+esc(CW.n)+'" placeholder="Per esempio: Concerto della banda in Piazza Duomo"></div>'+
      '<div class="ctl"><span class="lab">Tipologia</span><div class="seg wrap" id="cw_p"><button type="button" data-v="I" aria-pressed="'+(CW.p==='I')+'">Festa della Bruna</button><button type="button" data-v="II" aria-pressed="'+(CW.p==='II')+'">Bruna Passion Week</button></div></div>'+
      '<div class="ctl"><label for="cw_desc">Descrizione</label><textarea id="cw_desc" placeholder="Che cos’è, a chi si rivolge">'+esc(CW.desc)+'</textarea></div>'+
      '<div class="when"><div class="ctl"><label for="cw_d1">Giorno</label><input type="date" id="cw_d1" value="'+esc(CW.d1)+'" min="2026-11-01"></div><div class="ctl"><label for="cw_d2">Fino al (se dura più giorni)</label><input type="date" id="cw_d2" value="'+esc(CW.d2)+'" min="2026-11-01"></div></div>'+
      '<div class="when"><div class="ctl"><label for="cw_oi">Ora di inizio</label><input type="time" id="cw_oi" value="'+esc(CW.oi)+'"></div><div class="ctl"><label for="cw_of">Ora di fine</label><input type="time" id="cw_of" value="'+esc(CW.of)+'"></div></div>'+
      '<div class="ctl"><label for="cw_anno">Edizione (bilancio collegato)</label><select id="cw_anno"><option value="">Scegli l’edizione</option>'+anniBilancio().map(([y,l])=>'<option value="'+y+'"'+(String(y)===String(CW.anno)?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select><span class="muted small">Gli eventi da novembre 2026 all’estate 2027 di solito sono dell’edizione 2027.</span></div>'+
      '<div class="ctl"><label for="cw_luogo">Luogo</label><input type="text" id="cw_luogo" value="'+esc(CW.luogo)+'"></div>'+
      '<div class="ctl"><label for="cw_resp">Responsabile principale</label>'+selP('cw_resp',CW.resp)+'</div>'+
      '<div class="ctl"><label for="cw_obi">Obiettivi e programma</label><textarea id="cw_obi">'+esc(CW.obi)+'</textarea></div>'+
      '<div class="ctl"><label for="cw_note">Note organizzative</label><textarea id="cw_note">'+esc(CW.note)+'</textarea></div>'+
      '<div class="ctl"><label for="cw_f">Documenti già disponibili (facoltativo)</label><input type="file" id="cw_f" multiple>'+(CW.files.length?'<span class="muted small">Scelti: '+esc(CW.files.map(f=>f.name).join(', '))+'</span>':'')+'</div>'+
      '<p class="muted small">Chi crea la scheda: <b>'+esc(nome(CTX.user.id))+'</b> · Stato iniziale: <b>Proposta</b></p>';
    B.querySelectorAll('#cw_p button').forEach(b=>b.addEventListener('click',()=>{CW.p=b.dataset.v;B.querySelectorAll('#cw_p button').forEach(z=>z.setAttribute('aria-pressed',String(z===b)));}));}
  if(CW.step===2){B.innerHTML='<p class="muted" style="margin:0 0 6px">Per ogni area scegli se serve. Se non serve, tocca «Non necessario»: così nessuno pensa che sia una dimenticanza.</p>';
    ESIG.forEach(([k,n,col,L])=>{const g=CW.esig[k];const a=h('<div class="ev15area ev15sc" style="--c:'+col+'"><div class="ev15ah"><span class="av9 sm" style="--c:'+col+'">'+n.slice(0,2).toUpperCase()+'</span><b>'+n+'</b></div><div class="seg wrap ev15yn"><button type="button" data-v="1" aria-pressed="'+(g.serve===true)+'">Serve</button><button type="button" data-v="0" aria-pressed="'+(g.serve===false)+'">Non necessario</button></div></div>');
      if(g.serve){const c=h('<div class="checks ev15ck">'+L.map(t=>'<label><input type="checkbox" value="'+esc(t)+'"'+(g.att.includes(t)?' checked':'')+'> '+esc(t)+'</label>').join('')+'</div>');c.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{g.att=[...c.querySelectorAll('input:checked')].map(x=>x.value);}));a.appendChild(c);
        if(k==='eco'){const f=h('<div><p class="lab" style="margin:8px 0 4px">Forniture necessarie</p><div class="checks ev15ck">'+FORN.map(t=>'<label><input type="checkbox" value="'+esc(t)+'"'+(g.forn.includes(t)?' checked':'')+'> '+esc(t)+'</label>').join('')+'</div></div>');f.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{g.forn=[...f.querySelectorAll('input:checked')].map(x=>x.value);}));a.appendChild(f);}
        if(k==='sic')a.appendChild(h('<p class="muted small" style="margin:6px 0 0">Il percorso si può anche disegnare più avanti, nella sezione Percorsi.</p>'));}
      a.querySelectorAll('.ev15yn button').forEach(b=>b.addEventListener('click',()=>{g.serve=b.dataset.v==='1';if(!g.serve){g.att=[];g.forn=[];}ridisegna();}));B.appendChild(a);});}
  if(CW.step===3){const sc=Date.now()+ORE24;B.innerHTML='<p class="muted" style="margin:0 0 6px">Ogni area ha una persona precisa. Riceve subito una notifica e ha <b>24 ore</b>, fino a '+esc(dataOra(sc))+', per completare la sua parte.</p>';
    const serve=ESIG.filter(([k])=>CW.esig[k].serve);if(!serve.length)B.appendChild(h('<p class="muted">Nessuna area serve per questo evento: non parte nessuna attività.</p>'));
    serve.forEach(([k,n,col])=>{const g=CW.esig[k];B.appendChild(h('<div class="ev15area" style="--c:'+col+'"><div class="ev15ah"><span class="av9 sm" style="--c:'+col+'">'+n.slice(0,2).toUpperCase()+'</span><b>'+n+'</b><em>'+g.att.length+(g.att.length===1?' attività':' attività')+'</em></div><div class="ctl"><label for="cw_r_'+k+'">Chi se ne occupa</label>'+selP('cw_r_'+k,g.resp,'Scegli una persona')+'</div><p class="muted small" style="margin:0">'+esc(g.att.join(' · '))+'</p></div>'));});}
  if(CW.step===4){const serve=ESIG.filter(([k])=>CW.esig[k].serve),nn=ESIG.filter(([k])=>CW.esig[k].serve===false);const ore=CW.oi?(CW.oi+(CW.of?'–'+CW.of:'')):'';
    B.innerHTML=righe([['Nome',esc(CW.n)],['Tipologia',CW.p==='I'?'Festa della Bruna':'Bruna Passion Week'],['Quando',esc(dLab(rng(CW.d1,CW.d2||CW.d1)))+(ore?' · ore '+esc(ore):'')],['Luogo',esc(CW.luogo)],['Responsabile principale',esc(nome(CW.resp))],['Edizione',esc(CW.anno)+' · '+esc(nomeBilancio(+CW.anno))],['Documenti',CW.files.length?CW.files.length+' file':'nessuno']])+
      '<p class="lab" style="margin:12px 0 4px">Attività che partono</p>'+(serve.length?serve.map(([k,n])=>'<div class="c12li"><span>'+n+'<small>'+esc(CW.esig[k].att.join(', '))+'</small></span><b>'+esc(nome(CW.esig[k].resp))+'</b></div>').join(''):'<p class="muted">Nessuna.</p>')+
      (nn.length?'<p class="muted small">Non necessario: '+nn.map(z=>z[1]).join(', ')+'</p>':'')+
      '<div class="ctl" style="margin-top:10px"><label for="cw_c">Costo stimato (€)</label><input type="number" id="cw_c" min="0" step="100" value="'+CW.costo+'"></div><div class="ctl"><label for="cw_ri">Ricavi previsti (€), se ce ne sono</label><input type="number" id="cw_ri" min="0" step="100" value="'+CW.ricavi+'"></div><label class="ck"><input type="checkbox" id="cw_b"'+(CW.inPrev?' checked':'')+'> Incide sul '+esc(nomeBilancio(+CW.anno))+'</label>'+
      '<p class="muted small">Dopo l’invio l’evento è una <b>Proposta</b>: compare in grigio nel calendario finché l’amministratore non lo approva.</p>';}
  const N=box.querySelector('.ev15nav');const msg=box.querySelector('.smsg');
  bottoni(N,[CW.step>1?['‹ Indietro',()=>{cwLeggi(box);CW.step--;ridisegna();}]:null,CW.step<4?['Avanti ›',()=>{cwLeggi(box);const er=cwErrore();if(er){msg.textContent=er;return;}CW.step++;ridisegna();},true]:['Crea l’evento e avvisa i responsabili',async()=>{cwLeggi(box);msg.textContent='Un momento…';try{await creaEvento();}catch(x){msg.textContent='Errore: '+x.message;}},true],CW.step===1&&CW.n?['Ricomincia',()=>{cwNuovo();ridisegna();}]:null]);
  return box;}
async function creaEvento(){const me=CTX.user.id;const id='C'+Date.now().toString(36);const ora=new Date();const sc=new Date(ora.getTime()+ORE24).toISOString();
  const docs=[];for(const f of CW.files)docs.push(await carica(f,'compiti/'+me));
  const esig={};ESIG.forEach(([k])=>{const g=CW.esig[k];esig[k]={serve:!!g.serve,att:g.att.slice(),forn:g.forn.slice(),resp:g.serve?g.resp:null};});
  const ore=CW.oi?(CW.oi+(CW.of?'–'+CW.of:'')):'';
  S.evc=(S.evc||[]).concat([{id,n:CW.n,p:CW.p,d1:CW.d1,d2:CW.d2&&CW.d2>=CW.d1?CW.d2:CW.d1,ora:ore,luogo:CW.luogo,costo:CW.costo,inPrev:CW.inPrev,st:'idea',appr:'proposta',prog:'attivo',desc:CW.desc,obiettivi:CW.obi,note:CW.note,resp:CW.resp,creatore:me,creato:ora.toISOString(),scade:sc,docs,esig,anno:+CW.anno,ricavi:CW.ricavi,ref:'',perm:{}}]);
  changed();
  const rows=[];ESIG.forEach(([k,n])=>{const g=esig[k];if(g.serve)g.att.forEach(t=>rows.push({per:g.resp,titolo:CW.n+' · '+n+': '+t,area:'evento',fase:'scheda',priorita:'Alta',evento_id:id,scade_il:sc,entro:sc.slice(0,10)}));});
  if(rows.length){const {error}=await CTX.sb.from('compiti').insert(rows);if(error)throw new Error(error.message);}
  if(CW.resp!==me)await avvisaUtente(CW.resp,'Sei il responsabile principale dell’evento «'+CW.n+'».','sec-evt#'+id);
  await loadSocial();const n=CW.n;CW=null;CSELK['sec-evt']=id;EVQ='';EVFS='tutti';EVFC='tutti';EVFD='tutti';EVFR='tutti';go('sec-evt');window.scrollTo(0,0);
  stEl.textContent='«'+n+'» creato: '+rows.length+(rows.length===1?' attività assegnata.':' attività assegnate.')+' I responsabili hanno 24 ore.';}
const _crea15=R['p-crea'];R['p-crea']=function(){_crea15();const el=document.getElementById('p-crea');const f=el.querySelector('.crea13');
  if(CTX.canEdit('s-ev')){const w=wizard();if(f)f.replaceWith(w);else{const sh=el.querySelector('.sh');if(sh)sh.after(w);else el.prepend(w);}}
  else if(f)f.replaceWith(h('<div class="card soon"><p>Per creare un evento serve il permesso di modifica sugli Eventi.</p></div>'));
  const sh=el.querySelector('.sh p');if(sh)sh.textContent='In quattro passaggi: le informazioni, che cosa serve, chi se ne occupa, il controllo finale. Le persone scelte ricevono subito una notifica.';};
// con la creazione guidata le forniture sono già nella scheda: niente finestra automatica «Cosa serve?»
chiediFornEvento=function(e){if(e&&e.esig)return;return cosaServe(e);};
// il responsabile principale scelto nella creazione
const _evResp15=evResp;evResp=function(e){const s=evRaw(e);if(s.resp&&PEOPLE[s.resp]){const r=_evResp15(e);return r&&r.id?r:{id:s.resp,n:nome(s.resp)};}return _evResp15(e);};
// per gli eventi creati con i passaggi l'approvazione sta nel riquadro «Revisione dell'amministratore»
const _az15b=azioniEvento;azioniEvento=function(e,box){_az15b(e,box);if(!evRaw(e).esig)return;box.querySelectorAll(':scope > .c12b button').forEach(b=>{if(b.textContent.trim()==='Approva')b.remove();});};
