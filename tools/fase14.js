/* ================= Bruna27 · Fase A: scheda unica dell'evento, stati, calendario eventi ufficiali, Panoramica ================= */
// --- menu della sezione Eventi ---
EVT_G.length=0;[['sec-evt','Panoramica','list'],['p-cal','Calendario organizzativo','cal'],['s-ev','Calendario eventi ufficiali','star'],['p-crea','Crea evento','plus'],['v-perc','Percorsi','route']].forEach(x=>EVT_G.push(x));
PAGEX['p-cal']='Calendario organizzativo';PAGEX['s-ev']='Calendario eventi ufficiali';

// --- stati separati: approvazione, programmazione, bilancio ---
const APPR=[['proposta','Proposta'],['da_confermare','Da confermare'],['approvato','Approvato'],['pubblicato','Pubblicato'],['rifiutato','Rifiutato']];
const PROG=[['attivo','Attivo'],['escluso','Escluso'],['annullato','Annullato'],['archiviato','Archiviato']];
const labS=(L,k)=>(L.find(x=>x[0]===k)||[k,k])[1];
const TCOL={I:'#2F63F0',II:'#E2A23A'},GRIGIO='#94A3C0';
const TIPO=e=>e.p==='I'?'Festa della Bruna':'Bruna Passion Week';
function evRaw(e){return e.custom?((S.evc||[]).find(c=>c.id===e.id)||e):evS(e.id);}
// se nessuno ha ancora scelto: confermato → Approvato, altrimenti Da confermare; fuori dalla previsione → Escluso
function evAppr(e){const s=evRaw(e);return s.appr||(s.st==='ok'?'approvato':'da_confermare');}
function evProg(e){const s=evRaw(e);return s.prog||(evOn(e)?'attivo':'escluso');}
function evGrigio(e){const a=evAppr(e);return evProg(e)!=='attivo'||a==='proposta'||a==='da_confermare'||a==='rifiutato';}
const evCol=e=>evGrigio(e)?GRIGIO:(TCOL[e.p]||TCOL.I);
function setStato(e,o){if(e.custom)S.evc=S.evc.map(c=>c.id===e.id?Object.assign({},c,o):c);else setEvS(e.id,o);}
function evRec(e){return (VD['s-ev']||[]).find(x=>x.dati.evid===String(e.id));}
function evResp(e){const r=evRec(e);if(r&&r.dati.resp)return {id:r.dati.resp,n:nome(r.dati.resp)};const s=evRaw(e);return s.ref?{id:'',n:s.ref}:null;}
const PERM14=['siae','suap','piano','cpv','ass','que'];
function evAvanz(e){const p=evRaw(e).perm||{};const f=PERM14.filter(k=>p[k]).length;return {f,t:PERM14.length,pc:Math.round(f/PERM14.length*100)};}
function evCrit(e){const out=[];const g=giorniA((evDays(e)||[])[0]);const a=evAppr(e),pr=evProg(e);if(pr!=='attivo')return out;
  if(!evResp(e))out.push('Manca il responsabile');
  if((a==='proposta'||a==='da_confermare')&&g!=null&&g>=0&&g<=60)out.push('Ancora da approvare');
  const av=evAvanz(e);if(av.f<av.t&&g!=null&&g>=0&&g<=30)out.push('Mancano '+(av.t-av.f)+' permessi');
  return out;}
function evScad(e){const g=giorniA((evDays(e)||[])[0]);if(g==null)return '';if(g<0){const fine=giorniA((evDays(e)||[]).slice(-1)[0]);return fine<0?'Concluso':'In corso';}return g===0?'È oggi':g===1?'È domani':'Tra '+g+' giorni';}
const oraLab=e=>e.ora?' · ore '+e.ora:'';

// --- azioni: Modifica, Stato, Approva, Escludi; Elimina definitivamente solo per l'amministratore ---
function approva(e){setStato(e,{appr:'approvato',st:'ok'});changed();stEl.textContent='«'+e.n+'» è approvato.';}
function escludi(e,on){ask(on?'Escludere «'+e.n+'»? Resta visibile in grigio e il suo costo esce dal Bilancio di previsione 2027. Si può riattivare quando vuoi.':'Riattivare «'+e.n+'»?',on?'Escludi':'Riattiva',async()=>{
  setStato(e,{prog:on?'escluso':'attivo'});const canB=e.custom?CTX.canEdit('s-ev'):CTX.canEdit('s-pre');if(on&&canB&&evOn(e)){if(e.custom)S.evc=S.evc.map(c=>c.id===e.id?Object.assign({},c,{inPrev:false}):c);else{const v=vocEv(e);if(v)setVo(v.id,'on',false);}}
  changed();stEl.textContent=on?'Evento escluso: resta visibile in grigio.':'Evento riattivato.';});}
function statoEvento(e){const adm=CTX.admin;const a0=evAppr(e),p0=evProg(e);
  const grp=(id,L,cur,lock)=>'<div class="seg wrap ev14seg" id="'+id+'">'+L.map(([k,l])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(k===cur)+'"'+(lock(k)?' disabled':'')+'>'+l+'</button>').join('')+'</div>';
  const dl=sheet('Stato di «'+e.n+'»','<p class="lab">Approvazione</p>'+grp('st_a',APPR,a0,k=>!adm&&['approvato','pubblicato','rifiutato'].includes(k)&&k!==a0)+(adm?'':'<p class="muted small">Approvare, pubblicare o rifiutare spetta all’amministratore.</p>')+
    '<p class="lab">Programmazione</p>'+grp('st_p',PROG,p0,()=>false)+'<p class="muted small">Un evento escluso, annullato o archiviato resta visibile in grigio: non si cancella mai da solo.</p>','Salva',async(x)=>{
    const a=(x.querySelector('#st_a [aria-pressed="true"]')||{}).dataset,p=(x.querySelector('#st_p [aria-pressed="true"]')||{}).dataset;const o={};
    if(a&&a.v!==a0){o.appr=a.v;if(a.v==='approvato'||a.v==='pubblicato')o.st='ok';}if(p&&p.v!==p0)o.prog=p.v;
    if(Object.keys(o).length){setStato(e,o);changed();}stEl.textContent='Stato aggiornato.';});
  dl.querySelectorAll('.ev14seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>g.querySelectorAll('button').forEach(z=>z.setAttribute('aria-pressed',String(z===b))))));}
azioniEvento=function(e,box){const can=CTX.canEdit('s-ev');const canB=e.custom?can:CTX.canEdit('s-pre');
  const t=h('<label class="ck ev13flag"><input type="checkbox"'+(evOn(e)?' checked':'')+(canB?'':' disabled')+'> Incide sul Bilancio di previsione 2027</label>');t.querySelector('input').addEventListener('change',ev=>inBilancio(e,ev.target.checked));box.appendChild(t);
  const esc1=evProg(e)==='escluso';const a=evAppr(e);
  bottoni(box,[can?['Modifica',()=>modificaEvento(e)]:null,can?['Cambia lo stato',()=>statoEvento(e)]:null,CTX.admin&&a!=='approvato'&&a!=='pubblicato'?['Approva',()=>approva(e),true]:null,can?[esc1?'Riattiva':'Escludi',()=>escludi(e,!esc1)]:null,CTX.admin?['Elimina definitivamente',()=>eliminaEvento(e)]:null]);
  const last=box.lastElementChild;if(CTX.admin&&last&&last.lastElementChild)last.lastElementChild.classList.add('ko');};
eliminaEvento=function(e){ask('Eliminare definitivamente «'+e.n+'»? Sparisce dal calendario e dalla Panoramica'+(evOn(e)?' e il suo costo esce dal Bilancio di previsione 2027':'')+'. Se vuoi solo toglierlo dal programma usa «Escludi».','Elimina definitivamente',async()=>{
  if(!CTX.admin)return;if(e.custom)S.evc=S.evc.filter(c=>c.id!==e.id);else{setEvS(e.id,{del:true});const v=vocEv(e);if(v&&CTX.canEdit('s-pre'))setVo(v.id,'on',false);}
  changed();stEl.textContent='Evento eliminato.';});};
// scheda tecnica: tolgo «A che punto siamo» (ora c'è lo stato) e l'eliminazione per chi non è amministratore
const _fiche14=fiche;fiche=function(e){const d=_fiche14(e);
  d.querySelectorAll('.ctl').forEach(c=>{const l=c.querySelector('.lab');if(l&&/A che punto siamo/.test(l.textContent))c.remove();});
  d.querySelectorAll('button').forEach(b=>{if(/Elimina questo evento|Tocca ancora/.test(b.textContent))b.remove();});
  const sm=d.querySelector('summary');if(sm&&!sm.querySelector('.ev14st')){const x=sm.querySelector('.oh');if(x)x.before(h('<span class="badge ev14st">'+esc(labS(APPR,evAppr(e)))+' · '+esc(labS(PROG,evProg(e)))+'</span>'));sm.querySelectorAll('.badge.ok').forEach(b=>{if(b.textContent==='Confermato')b.remove();});}
  return d;};

// --- Calendario eventi ufficiali: giorno, settimana, mese, da novembre 2026 in poi ---
const OC_MIN='2026-11-01';let OCV='mese',OCD=null,OCSEL=null,OCF='tutti';
const OCFL=[['tutti','Tutti'],['I','Festa della Bruna'],['II','Passion Week'],['prop','Proposti o da confermare'],['appr','Approvati'],['pubb','Pubblicati'],['arch','Completati o archiviati']];
const isoL=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function ocPassa(e){const a=evAppr(e),pr=evProg(e);switch(OCF){case 'I':case 'II':return e.p===OCF;case 'prop':return a==='proposta'||a==='da_confermare';case 'appr':return a==='approvato';case 'pubb':return a==='pubblicato';
  case 'arch':return pr==='archiviato'||((evDays(e)||[]).slice(-1)[0]||'9')<todayISO();default:return true;}}
function ocEventi(){const by={};allEv().filter(ocPassa).forEach(e=>{(evDays(e)||[]).forEach(d=>{if(d>=OC_MIN)(by[d]=by[d]||[]).push(e);});});Object.values(by).forEach(L=>L.sort((a,b)=>(a.ora||'').localeCompare(b.ora||'')));return by;}
function ocBase(){let k=OCD||todayISO();if(k<OC_MIN)k=OC_MIN;return new Date(k+'T12:00:00');}
function apriInPanoramica(e){EVQ='';EVFS='tutti';EVFC='tutti';EVFD='tutti';EVFR='tutti';CSELK['sec-evt']=String(e.id);go('sec-evt');window.scrollTo(0,0);}
function cartaEvento(e,giorno){const c=evCol(e);const days=evDays(e)||[];const r=evResp(e);
  const x=h('<article class="ev14card" style="--c:'+c+'"><div class="ev14top"><span class="ev14tipo">'+esc(TIPO(e))+'</span><b>'+esc(e.n)+'</b><span>'+esc(dLab(days))+esc(oraLab(e))+'</span></div>'+
    '<div class="ev14body">'+chips([[labS(APPR,evAppr(e)),evGrigio(e)?'':'ok'],[labS(PROG,evProg(e))],[evOn(e)?'Nel bilancio 2027':'Fuori dal bilancio']])+righe([['Luogo',esc(e.luogo||'—')],['Responsabile',r?esc(r.n):'<span class="neg">da scegliere</span>'],['Quando',esc(evScad(e)||'—')]])+'</div></article>');
  const B=x.querySelector('.ev14body');const can=CTX.canEdit('s-ev');const a=evAppr(e);
  bottoni(B,[['Apri',()=>apriInPanoramica(e),true],can?['Modifica',()=>modificaEvento(e)]:null,CTX.admin&&a!=='approvato'&&a!=='pubblicato'?['Approva',()=>approva(e)]:null]);return x;}
function renderUfficiale(){const el=document.getElementById('s-ev');el.innerHTML='';const base=ocBase();const by=ocEventi();const oggi=todayISO();
  el.appendChild(h('<div class="sh"><span class="eyb">Eventi</span><h2>Calendario eventi ufficiali</h2><p>Festa della Bruna e Bruna Passion Week, da novembre 2026 in poi. Tocca un giorno per vedere i suoi eventi.</p></div>'));
  const anni=[];const yMax=Math.max(new Date().getFullYear()+3,...Object.keys(by).map(d=>+d.slice(0,4)),2028);for(let y=2026;y<=yMax;y++)anni.push(y);
  const MS=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const bar=h('<div class="calbar ev14bar"><div class="seg">'+[['giorno','Giorno'],['settimana','Settimana'],['mese','Mese']].map(([k,l])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(k===OCV)+'">'+l+'</button>').join('')+'</div>'+
    '<div class="calnav"><button type="button" data-n="-1" aria-label="Indietro">‹</button><button type="button" data-n="0">Oggi</button><button type="button" data-n="1" aria-label="Avanti">›</button></div>'+
    '<div class="ev14jump"><select id="oc_m" aria-label="Mese">'+MS.map((m,i)=>'<option value="'+i+'"'+(i===base.getMonth()?' selected':'')+'>'+m+'</option>').join('')+'</select><select id="oc_y" aria-label="Anno">'+anni.map(y=>'<option'+(y===base.getFullYear()?' selected':'')+'>'+y+'</option>').join('')+'</select></div>'+
    '<button type="button" class="bb dark sm ev14next">Vai al prossimo evento ›</button></div>');
  bar.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>{OCV=b.dataset.v;if(OCV!=='mese'&&OCSEL)OCD=OCSEL;R['s-ev']();addBack('s-ev');}));
  bar.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',()=>{const n=+b.dataset.n;if(!n){OCD=null;OCSEL=todayISO()>=OC_MIN?todayISO():null;}else{const d=new Date(base);if(OCV==='mese')d.setMonth(d.getMonth()+n,1);else d.setDate(d.getDate()+n*(OCV==='settimana'?7:1));const k=isoL(d);OCD=k<OC_MIN?OC_MIN:k;if(OCV==='giorno')OCSEL=OCD;}R['s-ev']();addBack('s-ev');}));
  const jump=()=>{const y=+bar.querySelector('#oc_y').value,m=+bar.querySelector('#oc_m').value;let k=y+'-'+String(m+1).padStart(2,'0')+'-01';if(k<OC_MIN)k=OC_MIN;OCD=k;OCV='mese';OCSEL=null;R['s-ev']();addBack('s-ev');};
  bar.querySelector('#oc_m').addEventListener('change',jump);bar.querySelector('#oc_y').addEventListener('change',jump);
  const nx=Object.keys(by).sort().find(d=>d>=oggi);const nb=bar.querySelector('.ev14next');if(!nx)nb.hidden=true;else nb.addEventListener('click',()=>{OCD=nx;OCSEL=nx;OCV='mese';R['s-ev']();addBack('s-ev');});
  if(OCV==='mese'?isoL(base).slice(0,7)<=OC_MIN.slice(0,7):isoL(base)<=OC_MIN)bar.querySelector('[data-n="-1"]').disabled=true;
  el.appendChild(bar);
  el.appendChild(h('<div class="ev14leg"><span><i style="background:'+TCOL.I+'"></i>Festa della Bruna</span><span><i style="background:'+TCOL.II+'"></i>Bruna Passion Week</span><span><i style="background:'+GRIGIO+'"></i>Proposto, da confermare o escluso</span></div>'));
  const fc=h('<div class="chips ev14f">'+OCFL.map(([k,l])=>'<button type="button" class="chip" data-f="'+k+'" aria-pressed="'+(k===OCF)+'">'+l+'</button>').join('')+'</div>');
  fc.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{OCF=b.dataset.f;R['s-ev']();addBack('s-ev');}));el.appendChild(fc);
  const chip=e=>'<span class="ev14chip" style="--c:'+evCol(e)+';--t:'+(TCOL[e.p]||TCOL.I)+'">'+esc(e.n)+'</span>';
  const tit=h('<h3 class="gh ev14tit"></h3>');el.appendChild(tit);
  const giorno=k=>{const L=by[k]||[];const d=new Date(k+'T12:00:00');const s=h('<section class="ev14day"><p class="b26lab">'+esc(d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+(L.length?' · '+L.length+(L.length===1?' evento':' eventi'):'')+'</p><div class="ev14cards"></div></section>');
    const C=s.querySelector('.ev14cards');L.forEach(e=>C.appendChild(cartaEvento(e,k)));if(!L.length)C.appendChild(h('<p class="muted">Nessun evento ufficiale in questo giorno.</p>'));return s;};
  if(OCV==='mese'){tit.textContent=base.toLocaleDateString('it-IT',{month:'long',year:'numeric'});const f=new Date(base.getFullYear(),base.getMonth(),1);const start=new Date(f);start.setDate(1-((f.getDay()+6)%7));
    const g=h('<div class="calm ev14m">'+['lun','mar','mer','gio','ven','sab','dom'].map(d=>'<span class="calh">'+d+'</span>').join('')+'</div>');
    const nd=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();const celle=Math.ceil((((f.getDay()+6)%7)+nd)/7)*7;
    for(let i=0;i<celle;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=isoL(d);const L=by[k]||[];const fuori=d.getMonth()!==base.getMonth();
      const c=h('<button type="button" class="calc ev14c'+(fuori?' fuori':'')+(k===oggi?' oggi':'')+(k===OCSEL?' sel':'')+(k<OC_MIN?' prima':'')+'" aria-label="'+esc(d.toLocaleDateString('it-IT',{day:'numeric',month:'long'}))+(L.length?', '+L.length+' eventi':'')+'"'+(k<OC_MIN?' disabled':'')+'><b>'+d.getDate()+'</b><span class="ev14chips">'+L.slice(0,3).map(chip).join('')+(L.length>3?'<span class="ev14more">+'+(L.length-3)+'</span>':'')+'</span></button>');
      c.addEventListener('click',()=>{OCSEL=OCSEL===k?null:k;if(fuori)OCD=k;R['s-ev']();addBack('s-ev');setTimeout(()=>{const s=document.querySelector('#s-ev .ev14day');if(s&&OCSEL)s.scrollIntoView({behavior:'smooth',block:'start'});},60);});g.appendChild(c);}
    el.appendChild(g);
    if(OCSEL&&OCSEL.slice(0,7)===isoL(base).slice(0,7))el.appendChild(giorno(OCSEL));
    else{const mk=isoL(base).slice(0,7);const ks=Object.keys(by).filter(k=>k.slice(0,7)===mk).sort();const s=h('<section class="ev14day"><p class="b26lab">Gli eventi di '+esc(tit.textContent)+'</p><div class="ev14list"></div></section>');const Lb=s.querySelector('.ev14list');
      const seen=new Set();ks.forEach(k=>by[k].forEach(e=>{if(seen.has(e.id))return;seen.add(e.id);const r=h('<button type="button" class="ev14row" style="--c:'+evCol(e)+'"><i></i><span><b>'+esc(e.n)+'</b><em>'+esc(dLab(evDays(e)))+esc(oraLab(e))+' · '+esc(TIPO(e))+'</em></span><span class="ev14rs">'+esc(labS(APPR,evAppr(e)))+'</span></button>');r.addEventListener('click',()=>{OCSEL=k;R['s-ev']();addBack('s-ev');});Lb.appendChild(r);}));
      if(!ks.length)Lb.appendChild(h('<p class="muted">Nessun evento ufficiale in questo mese.'+(nx?' Tocca «Vai al prossimo evento».':'')+'</p>'));el.appendChild(s);}}
  else if(OCV==='settimana'){const s0=new Date(base);s0.setDate(s0.getDate()-((s0.getDay()+6)%7));const s6=new Date(s0);s6.setDate(s0.getDate()+6);
    tit.textContent='Settimana dal '+s0.toLocaleDateString('it-IT',{day:'numeric',month:'long'})+' al '+s6.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
    const g=h('<div class="ev14w"></div>');for(let i=0;i<7;i++){const d=new Date(s0);d.setDate(s0.getDate()+i);const k=isoL(d);const L=by[k]||[];
      const c=h('<button type="button" class="ev14wd'+(k===oggi?' oggi':'')+(k===OCSEL?' sel':'')+'"'+(k<OC_MIN?' disabled':'')+'><b>'+esc(d.toLocaleDateString('it-IT',{weekday:'short',day:'numeric'}))+'</b><span class="ev14chips">'+L.map(chip).join('')+(L.length?'':'<span class="muted small">—</span>')+'</span></button>');
      c.addEventListener('click',()=>{OCSEL=k;R['s-ev']();addBack('s-ev');});g.appendChild(c);}
    el.appendChild(g);if(OCSEL&&OCSEL>=isoL(s0)&&OCSEL<=isoL(s6))el.appendChild(giorno(OCSEL));}
  else{const k=isoL(base);OCSEL=k;tit.textContent=base.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});el.appendChild(giorno(k));}
  if(canOpen('p-crea')){const b=h('<button type="button" class="bb soft sm ev14crea">+ Crea evento</button>');b.addEventListener('click',()=>go('p-crea'));el.appendChild(b);}}
// in modalità Modifica resta la pagina di prima (con le schede tecniche)
const _ev14=R['s-ev'];R['s-ev']=function(){if(typeof editMode!=='undefined'&&editMode)return _ev14();renderUfficiale();};

// --- Panoramica: carte riassuntive, ricerca e filtri, scheda tecnica completa ---
let EVQ='',EVFS='tutti',EVFC='tutti',EVFD='prossimi',EVFR='tutti',FICHE14=null;
renderEventi13=function(){const el=document.getElementById('sec-evt');const E=allEv();const oggi=todayISO();
  const on=E.filter(evOn);const cI=on.filter(e=>e.p==='I'),cII=on.filter(e=>e.p==='II');const costo=A=>A.reduce((a,e)=>a+evCost(e),0);
  const appr=E.filter(e=>['approvato','pubblicato'].includes(evAppr(e))).length;const d0=e=>(evDays(e)||[])[0]||'9999';const dZ=e=>(evDays(e)||[]).slice(-1)[0]||'0';
  const q=EVQ.trim().toLowerCase();
  let L=E.filter(e=>{if(q&&!(e.n+' '+(e.luogo||'')+' '+(e.desc||'')).toLowerCase().includes(q))return false;
    if(EVFC!=='tutti'&&e.p!==EVFC)return false;
    if(EVFS!=='tutti'&&evAppr(e)!==EVFS&&evProg(e)!==EVFS)return false;
    if(EVFD==='prossimi'&&dZ(e)<oggi)return false;if(EVFD==='passati'&&dZ(e)>=oggi)return false;if(/^\d{4}-\d{2}$/.test(EVFD)&&!(evDays(e)||[]).some(d=>d.slice(0,7)===EVFD))return false;
    if(EVFR!=='tutti'){const r=evResp(e);if(EVFR==='nessuno'?!!r:!(r&&r.id===EVFR))return false;}
    return true;});
  L.sort((a,b)=>(evGrigio(a)&&evProg(a)!=='attivo'?1:0)-(evGrigio(b)&&evProg(b)!=='attivo'?1:0)||d0(a).localeCompare(d0(b)));
  const can=CTX.canEdit('s-ev');
  const cards=L.slice(0,80).map(e=>{const days=evDays(e)||[];const dd=new Date(days[0]+'T12:00:00');const r=evResp(e);const av=evAvanz(e);const cr=evCrit(e);const sc=evScad(e);
    return {key:String(e.id),n:e.n,t:dd.toLocaleDateString('it-IT',{day:'numeric',month:'long'}),c:evCol(e),ic:e.p==='I'?'B':'PW',k:TIPO(e)+(days.length>1?' · '+days.length+' giorni':''),tg:labS(APPR,evAppr(e)),
      s:[labS(PROG,evProg(e)),sc,cr.length?'⚠ '+cr.length+' da sistemare':''].filter(Boolean).join(' · '),lab:e.n,
      det:box=>{box.innerHTML=(e.desc?'<p style="margin:0 0 8px">'+esc(e.desc)+'</p>':'')+
        righe([['Data e ora',esc(dLab(days))+esc(oraLab(e))],['Tipo',esc(TIPO(e))],['Approvazione',esc(labS(APPR,evAppr(e)))],['Programmazione',esc(labS(PROG,evProg(e)))],['Bilancio',evOn(e)?'incluso · anno 2027':'non incluso'],['Responsabile',r?esc(r.n):'<span class="neg">da scegliere</span>'],['Luogo',esc(e.luogo||'—')],['Costo',evOn(e)?eur(evCost(e)):'escluso dalla previsione'],sc?['Quando',esc(sc)]:null])+
        '<div class="b26v ev14av" style="--c:'+evCol(e)+'"><span>Avanzamento<em>permessi e adempimenti: '+av.f+' su '+av.t+'</em></span><b>'+av.pc+'%</b><i style="--w:'+av.pc+'%"></i></div>'+
        (cr.length?'<div class="ev14crit"><b>Da sistemare</b>'+cr.map(x=>'<span>⚠ '+esc(x)+'</span>').join('')+'</div>':'');
        azioniEvento(e,box);
        bottoni(box,[[FICHE14===String(e.id)?'Chiudi la scheda tecnica':'Scheda tecnica completa',()=>{FICHE14=FICHE14===String(e.id)?null:String(e.id);R['sec-evt']();addBack('sec-evt');if(FICHE14)setTimeout(()=>{const x=document.getElementById('fiche'+e.id);if(x)x.scrollIntoView({behavior:'smooth',block:'start'});},80);},true],['Persone, percorso e fornitori',()=>schedaEvento(e)],can?['Cosa serve?',()=>cosaServe(e)]:null,['Vedi nel calendario',()=>{OCD=days[0];OCSEL=days[0];OCV='mese';OCF='tutti';go('s-ev');}]]);
        if(FICHE14===String(e.id)){openState['ev'+e.id]=true;const f=fiche(e);f.open=true;const a2=f.querySelector('.ev13act');if(a2)a2.remove();f.classList.add('ev14fiche');box.appendChild(f);}},
      sideLab:'Percorso, persone e fornitori',side:box=>{const P=typeof vperc==='function'?vperc():[];const rec=evRec(e);const d=rec?rec.dati:{};const pc=d.percorso&&P.find(x=>x.id===d.percorso);
        box.innerHTML=righe([['Percorso',pc?esc(pc.dati.nome):'nessuno'],['Responsabile',r?esc(r.n):'—']])+((d.fornitori||[]).length?'<p class="b26lab" style="margin:10px 0 4px">Fornitori</p>'+d.fornitori.map(f=>'<div class="c12li"><span class="chip2">'+esc(f.stato||'')+'</span><span>'+esc(f.servizio)+'<small>'+esc(f.fornitore||'da trovare')+'</small></span><b>'+(f.importo?eur(+f.importo):'')+'</b></div>').join(''):'');
        if(pc&&canOpen('v-perc')){const b=h('<button type="button" class="lnk2">Apri il percorso ›</button>');b.addEventListener('click',()=>go('v-perc'));box.appendChild(b);}}};});
  const w=cartePagina(el,{id:'sec-evt',ey:'Eventi',title:'Panoramica',sub:'Tutti gli eventi della Festa della Bruna e della Passion Week. Tocca una carta per i dettagli.',
    sum:[['gold','★','Festa della Bruna · '+cI.length+' eventi',km(costo(cI))+' €'],['eq','◆','Passion Week · '+cII.length+' eventi',km(costo(cII))+' €'],['in','✓','Approvati',appr+' su '+E.length],['out','€','Costo totale',eur(costo(on))]],
    note:'Corpus Sacro: <b>29 giugno – 3 luglio</b>. Alla Bruna mancano <b>'+countdown()+' giorni</b>.',sumBtn:canOpen('s-ev')?[['Calendario eventi ufficiali',()=>go('s-ev')]]:null,
    mini:[['Eventi',String(E.length)],['Approvati',appr+'/'+E.length],['Costo',km(costo(on))+' €']],
    actions:[canOpen('p-crea')?['+ Crea evento',()=>go('p-crea'),true]:null,canOpen('s-ev')?['Calendario eventi ufficiali',()=>go('s-ev')]:null].filter(Boolean),
    vuoto:'Nessun evento con questi filtri.',cards});
  // ricerca e filtri
  const mesi=[...new Set(E.flatMap(e=>(evDays(e)||[]).map(d=>d.slice(0,7))))].sort();const RS=[...new Map(E.map(evResp).filter(r=>r&&r.id).map(r=>[r.id,r.n])).entries()];
  const opt=(v,l,cur)=>'<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(l)+'</option>';
  const f=h('<div class="ev14flt"><div class="ev14q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" id="ev14q" placeholder="Cerca un evento per nome o luogo" aria-label="Cerca un evento" value="'+esc(EVQ)+'"></div>'+
    '<div class="ev14sel"><label>Stato<select data-f="s">'+opt('tutti','Tutti',EVFS)+APPR.concat(PROG).map(([k,l])=>opt(k,l,EVFS)).join('')+'</select></label>'+
    '<label>Categoria<select data-f="c">'+opt('tutti','Tutte',EVFC)+opt('I','Festa della Bruna',EVFC)+opt('II','Passion Week',EVFC)+'</select></label>'+
    '<label>Data<select data-f="d">'+opt('prossimi','Prossimi',EVFD)+opt('tutti','Tutte',EVFD)+opt('passati','Già passati',EVFD)+mesi.map(m=>opt(m,new Date(m+'-15T12:00:00').toLocaleDateString('it-IT',{month:'long',year:'numeric'}),EVFD)).join('')+'</select></label>'+
    '<label>Responsabile<select data-f="r">'+opt('tutti','Tutti',EVFR)+opt('nessuno','Senza responsabile',EVFR)+RS.map(([id,n])=>opt(id,n,EVFR)).join('')+'</select></label></div>'+
    '<p class="ev14n">'+L.length+(L.length===1?' evento':' eventi')+(L.length>80?' (si vedono i primi 80)':'')+((EVQ||EVFS!=='tutti'||EVFC!=='tutti'||EVFD!=='prossimi'||EVFR!=='tutti')?' · <button type="button" class="lnk2 ev14rst">Togli i filtri</button>':'')+'</p></div>');
  const ri=()=>{CSEL['sec-evt']=0;CSELK['sec-evt']=null;R['sec-evt']();addBack('sec-evt');};
  f.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{const v=s.value;({s:()=>EVFS=v,c:()=>EVFC=v,d:()=>EVFD=v,r:()=>EVFR=v})[s.dataset.f]();ri();}));
  let tm;f.querySelector('#ev14q').addEventListener('input',ev=>{clearTimeout(tm);tm=setTimeout(()=>{EVQ=ev.target.value;ri();const i=document.getElementById('ev14q');if(i){i.focus();const n=i.value.length;try{i.setSelectionRange(n,n);}catch(x){}}},350);});
  const rs=f.querySelector('.ev14rst');if(rs)rs.addEventListener('click',()=>{EVQ='';EVFS='tutti';EVFC='tutti';EVFD='prossimi';EVFR='tutti';ri();});
  const act=w.querySelector('.c12act');act.after(f);
  const old=el.querySelector(':scope > .ecobar');if(old)old.remove();el.insertBefore(evtBar('sec-evt'),el.firstChild);};
// i vecchi collegamenti alle schede tecniche ora aprono la Panoramica
apriFiche=function(e){FICHE14=String(e.id);apriInPanoramica(e);};
// --- calendario organizzativo: anche incontri con i fornitori e scadenze interne ---
TIPOR.push('Incontro con un fornitore','Scadenza interna');COLC['incontro con un fornitore']='#B5495B';COLC['scadenza interna']='#C0392B';
