/* ================= Bruna27 · Fase C: attività organizzative, percentuale pesata, Evento pronto, Home ================= */
const AREAN={eco:'Economia',sic:'Sicurezza',adm:'Amministrazione',org:'Organizzazione'};
const lavEv=e=>COMP.filter(c=>c.evento_id===String(e.id)&&c.fase==='lavoro');
const lavOk=c=>c.fatto&&(!c.verifica||c.verificato);
const lavLate=c=>!c.fatto&&c.stato!=='attesa'&&c.entro&&c.entro<todayISO();
function statoLav(c){if(c.stato==='da_assegnare')return ['Da assegnare','warn'];if(c.fatto)return c.verifica&&!c.verificato?['Da verificare','warn']:['Completata','ok'];
  if(c.stato==='attesa')return ['In attesa','warn'];if(c.stato==='assegnato')return ['Da prendere in carico','nw'];if(lavLate(c))return ['In ritardo','ko'];return ['In lavorazione',''];}
const pesoL=c=>c.critica?3:1;
// percentuale: solo le attività prima dell'evento (non i pagamenti), essenziali pesano 3
function percEv(e){const L=lavEv(e).filter(c=>c.conta!==false);if(!L.length)return null;const tw=L.reduce((a,c)=>a+pesoL(c),0),dw=L.filter(lavOk).reduce((a,c)=>a+pesoL(c),0);
  const tutte=L.every(lavOk);let pc=Math.round(dw/tw*100);if(!tutte&&pc>99)pc=99;const ess=L.filter(c=>c.critica&&!lavOk(c));return {pc,f:L.filter(lavOk).length,t:L.length,ess,manca:L.filter(c=>!lavOk(c)),pronto:tutte};}
const _evAvanz16=evAvanz;evAvanz=function(e){const p=percEv(e);if(!p)return _evAvanz16(e);return {f:p.f,t:p.t,pc:p.pc,l:'attività organizzative'};};
const _evCrit16=evCrit;evCrit=function(e){const out=_evCrit16(e);const p=percEv(e);if(p){if(p.ess.length)out.unshift(p.ess.length+(p.ess.length===1?' attività essenziale mancante':' attività essenziali mancanti'));const l=lavEv(e).filter(lavLate).length;if(l)out.push(l+(l===1?' compito in ritardo':' compiti in ritardo'));const da=lavEv(e).filter(c=>c.stato==='da_assegnare').length;if(da)out.push(da+' da assegnare');}return out;};
const gestore=e=>CTX.admin||evRaw(e).resp===CTX.user.id||evRaw(e).creatore===CTX.user.id;
function updLav(c,campi,cosa){return aggiornaCompito(c,campi,cosa);}
function prendoLav(c){sheet('Entro quando lo completi?','<p>«'+esc(c.titolo.split(': ').slice(1).join(': ')||c.titolo)+'»</p>'+(c.criteri?'<p class="muted small">Quando è completata: '+esc(c.criteri)+'</p>':'')+'<div class="ctl"><label for="pc_d">Data</label><input type="date" id="pc_d" min="'+todayISO()+'"></div>','Prendo in carico',async(x)=>{const d=x.querySelector('#pc_d').value;if(!d){x.querySelector('.smsg').textContent='Senza data non si può confermare.';return false;}
  await updLav(c,{stato:'preso',entro:d},'Preso in carico entro il '+fmtD(d));});}
function completaLav(c){sheet('Attività completata','<p>«'+esc(c.titolo.split(': ').slice(1).join(': ')||c.titolo)+'»</p>'+(c.criteri?'<p class="muted small">Quando è completata: '+esc(c.criteri)+'</p>':'')+'<div class="ctl"><label for="cf_n">Nota (che cosa hai fatto)</label><textarea id="cf_n"></textarea></div><div class="ctl"><label for="cf_f">Documento che lo dimostra (se serve)</label><input type="file" id="cf_f"></div>'+(c.verifica?'<p class="muted small">Questa attività va verificata: '+esc(nome(c.da))+' riceve la notifica per confermarla.</p>':''),'Segna come completata',async(x)=>{
  const f=x.querySelector('#cf_f').files[0];const al=(c.allegati||[]).slice();if(f)al.push(await carica(f,'compiti/'+CTX.user.id));
  await updLav(c,{fatto:true,stato:'fatto',nota_fine:x.querySelector('#cf_n').value.trim()||null,allegati:al,verificato:false},'Completata');});}
function riapriLav(c){sheet('Riapri il compito','<div class="ctl"><label for="rl_m">Perché va rifatto?</label><textarea id="rl_m"></textarea></div>','Riapri',async(x)=>{const m=x.querySelector('#rl_m').value.trim();if(!m){x.querySelector('.smsg').textContent='Scrivi il motivo.';return false;}
  await updLav(c,{fatto:false,verificato:false,stato:'preso',nota:'Riaperto: '+m},'Riaperto: '+m);if(c.per!==CTX.user.id)await avvisaUtente(c.per,'Da rifare: «'+c.titolo+'» — '+m,'sec-evt#'+c.evento_id);});}
function schedaLav(e,c){const nuovo=!c;c=c||{};const areaK=c.titolo?(Object.keys(AREAN).find(k=>c.titolo.indexOf(' · '+AREAN[k]+': ')>0)||'org'):'org';const desc=c.titolo?c.titolo.split(': ').slice(1).join(': '):'';
  sheet(nuovo?'Nuova attività per «'+e.n+'»':'Modifica attività','<div class="ctl"><label for="lv_t">Che cosa va fatto</label><input type="text" id="lv_t" value="'+esc(desc)+'" placeholder="Per esempio: Inviare gli inviti alle autorità"></div>'+
    '<div class="ctl"><label for="lv_a">Area</label><select id="lv_a">'+Object.entries(AREAN).map(([k,n])=>'<option value="'+k+'"'+(k===areaK?' selected':'')+'>'+n+'</option>').join('')+'</select></div>'+
    '<div class="ctl"><label for="lv_p">Chi se ne occupa</label>'+selP('lv_p',c.stato==='da_assegnare'?'':(c.per||''),'Da assegnare')+'</div>'+
    '<div class="ctl"><label for="lv_c">Quando si considera completata (risultato richiesto)</label><textarea id="lv_c" placeholder="Per esempio: inviti spediti a tutte le autorità dell’elenco">'+esc(c.criteri||'')+'</textarea></div>'+
    '<label class="ck"><input type="checkbox" id="lv_e"'+(c.critica?' checked':'')+'> Essenziale (per esempio un’autorizzazione o una verifica di sicurezza): pesa di più e senza di essa l’evento non è pronto</label>'+
    '<label class="ck"><input type="checkbox" id="lv_v"'+(c.verifica?' checked':'')+'> Quando è completata la deve confermare chi l’ha assegnata</label>'+
    '<label class="ck"><input type="checkbox" id="lv_k"'+(c.conta===false?'':' checked')+'> Conta per la preparazione (togli la spunta per pagamenti e cose da fare dopo l’evento)</label>','Salva',async(x)=>{
    const t=x.querySelector('#lv_t').value.trim();if(!t){x.querySelector('.smsg').textContent='Scrivi che cosa va fatto.';return false;}
    const a=x.querySelector('#lv_a').value,p=x.querySelector('#lv_p').value;const crit=x.querySelector('#lv_e').checked;
    const o={titolo:e.n+' · '+AREAN[a]+': '+t,criteri:x.querySelector('#lv_c').value.trim()||null,critica:crit,priorita:crit?'Alta':'Normale',verifica:x.querySelector('#lv_v').checked,conta:x.querySelector('#lv_k').checked};
    if(nuovo){const {error}=await CTX.sb.from('compiti').insert(Object.assign(o,{per:p||CTX.user.id,stato:p?'assegnato':'da_assegnare',chiede_data:true,area:'evento',fase:'lavoro',evento_id:String(e.id),storico:[{quando:new Date().toISOString(),chi:CTX.user.id,cosa:'Creata'+(p?' e assegnata a '+nome(p):'')}]}));if(error)throw new Error(error.message);await loadSocial();rerender();stEl.textContent='Attività aggiunta'+(p?': '+nome(p)+' riceve la notifica.':'.');}
    else{if(p&&(p!==c.per||c.stato==='da_assegnare')){o.per=p;o.stato='assegnato';o.entro=null;}if(!p&&c.stato!=='da_assegnare'){o.stato='da_assegnare';}await updLav(c,o,'Modificata'+(o.per?' · assegnata a '+nome(p):''));}});}
function rigaLav(e,c){const me=CTX.user.id;const [t,cl]=statoLav(c);const mio=c.per===me&&c.stato!=='da_assegnare';const ges=gestore(e)||c.da===me;
  const r=h('<div class="ev16t'+(lavOk(c)?' ok':'')+'"><div class="ev16th"><span class="ev15an"><b>'+esc(c.titolo.split(': ').slice(1).join(': ')||c.titolo)+'</b><small>'+esc((Object.values(AREAN).find(n=>c.titolo.indexOf(' · '+n+': ')>0)||''))+' · '+(c.stato==='da_assegnare'?'nessuno':esc(nome(c.per)))+(c.entro?' · entro il '+fmtD(c.entro):'')+' · assegnata il '+new Date(c.creato||Date.now()).toLocaleDateString('it-IT')+'</small></span><span class="chips">'+(c.critica?'<span class="chip2 ko">Essenziale</span>':'')+(c.conta===false?'<span class="chip2">Non conta</span>':'')+'<span class="chip2 '+cl+'">'+t+'</span></span></div></div>');
  if(c.criteri)r.appendChild(h('<p class="ev16c">Completata quando: '+esc(c.criteri)+'</p>'));
  if(c.nota&&!c.fatto)r.appendChild(h('<p class="ev16c">'+esc(c.nota)+'</p>'));
  if(c.nota_fine&&c.fatto)r.appendChild(h('<p class="ev16c">Nota: '+esc(c.nota_fine)+'</p>'));
  (c.allegati||[]).forEach(a=>{if(a&&a.path)r.appendChild(fileBtn(a,a.nome||'Documento'));});
  const bt=[];
  if(mio&&!c.fatto&&c.stato==='assegnato')bt.push(['Prendo in carico',()=>prendoLav(c),true]);
  else if(mio&&!c.fatto){bt.push(['Completata',()=>completaLav(c),true]);if(c.stato!=='attesa')bt.push(['In attesa',()=>inAttesa(e,c)]);else bt.push(['Riprendo',()=>updLav(c,{stato:'preso'},'Ripreso')]);}
  if(c.fatto&&c.verifica&&!c.verificato&&(c.da===me||CTX.admin)&&c.per!==me)bt.push(['Confermo',()=>updLav(c,{verificato:true},'Verificata'),true],['Riapri',()=>riapriLav(c)]);
  else if(c.fatto&&ges)bt.push(['Riapri',()=>riapriLav(c)]);
  if(ges)bt.push([c.stato==='da_assegnare'?'Assegna':'Modifica',()=>schedaLav(e,c)]);
  if(c.da===me&&!c.fatto)bt.push(['Elimina',()=>ask('Eliminare questa attività?','Elimina',async()=>{await CTX.sb.from('compiti').delete().eq('id',c.id);await loadSocial();rerender();})]);
  if(bt.length){const w=h('<div class="ev15ab"></div>');bottoni(w,bt);r.appendChild(w);const k=w.querySelector('.c12b');if(k&&k.lastElementChild&&k.lastElementChild.textContent==='Elimina')k.lastElementChild.classList.add('ko');}
  if((c.storico||[]).length)r.appendChild(h('<details class="storico2"><summary>Storico · '+c.storico.length+'</summary>'+c.storico.slice().reverse().map(s=>'<div class="sti">'+esc(s.cosa)+' · <span class="muted">'+esc(nome(s.chi))+', '+new Date(s.quando).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</span></div>').join('')+'</details>'));
  return r;}
function bloccoLavoro(e){const box=h('<section class="ev16"></section>');const a=evAppr(e);const L=lavEv(e);const p=percEv(e);
  if(!L.length&&a!=='pubblicato'&&a!=='approvato')return box;
  box.appendChild(h('<p class="b26lab">Attività organizzative</p>'));
  if(p){box.appendChild(h('<div class="ev16pc'+(p.pronto?' ok':'')+'"><div><b>'+p.pc+'%</b><span>'+(p.pronto?'Evento pronto: tutte le attività previste sono completate e verificate.':p.f+' su '+p.t+' attività completate'+(p.ess.length?' · <b class="neg">'+p.ess.length+' essenziali mancanti</b>':''))+'</span></div><i style="--w:'+p.pc+'%"></i></div>'));
    const det=h('<details class="ev16how"><summary>Come si calcola e che cosa manca per il 100%</summary><p class="muted small">Contano solo le attività da fare prima dell’evento. Le essenziali pesano 3, le altre 1. I pagamenti e le cose da fare dopo l’evento non contano. Un’attività da verificare conta solo dopo la conferma. Finché manca un’attività essenziale l’evento non può essere pronto. Il 100% riguarda l’organizzazione: non vuol dire che l’evento sia già avvenuto, che i pagamenti siano chiusi o che un’autorizzazione mancante ci sia.</p>'+(p.manca.length?p.manca.map(c=>'<div class="c12li"><span>'+esc(c.titolo.split(': ').slice(1).join(': '))+'<small>'+esc(statoLav(c)[0])+' · '+(c.stato==='da_assegnare'?'da assegnare':esc(nome(c.per)))+'</small></span><b>'+(c.critica?'peso 3':'peso 1')+'</b></div>').join(''):'<p class="muted small">Non manca niente.</p>')+'</details>');box.appendChild(det);}
  else box.appendChild(h('<p class="muted small" style="margin:0">Ancora nessuna attività organizzativa.'+(a==='pubblicato'?'':' Si creano da sole quando l’evento viene pubblicato, oppure aggiungile qui.')+'</p>'));
  const ord=c=>lavOk(c)?3:c.stato==='da_assegnare'?0:lavLate(c)?0:c.critica?1:2;
  L.slice().sort((x,y)=>ord(x)-ord(y)).forEach(c=>box.appendChild(rigaLav(e,c)));
  if(gestore(e)||CTX.canEdit('s-ev')){const b=h('<button type="button" class="bb soft sm">+ Aggiungi un’attività</button>');b.addEventListener('click',()=>schedaLav(e,null));box.appendChild(b);}
  return box;}
// dopo la pubblicazione si creano le attività organizzative dalle esigenze scelte nella scheda
const ESS16=/Autorizzazion|SUAP|SIAE|Verifica|Percorso|Presidi/;
async function creaLavoro(e){const s=evRaw(e);if(!s.esig||lavEv(e).length)return 0;const rows=[];const now=new Date().toISOString();
  ESIG.forEach(([k,n])=>{const g=s.esig[k];if(!g||!g.serve)return;g.att.forEach(t=>{const ess=ESS16.test(t);rows.push({per:g.resp||CTX.user.id,stato:g.resp?'assegnato':'da_assegnare',chiede_data:true,titolo:e.n+' · '+n+': '+t,area:'evento',fase:'lavoro',evento_id:String(e.id),critica:ess,verifica:ess,priorita:ess?'Alta':'Normale',conta:!/Pagamenti/.test(t),storico:[{quando:now,chi:CTX.user.id,cosa:'Creata alla pubblicazione'}]});});});
  if(!rows.length)return 0;const {error}=await CTX.sb.from('compiti').insert(rows);if(error){stEl.textContent='Errore: '+error.message;return 0;}await loadSocial();return rows.length;}
const _pubb16=pubblica;pubblica=async function(e){await _pubb16(e);if(evAppr(e)!=='pubblicato')return;const n=await creaLavoro(e);if(n){rerender();stEl.textContent='Evento pubblicato: '+n+' attività organizzative assegnate. Ognuno indica entro quando le completa.';}};
// nel dettaglio della Panoramica, dopo la preparazione della scheda
const _az16=azioniEvento;azioniEvento=function(e,box){if(box&&box.classList&&box.classList.contains('c12det'))box.appendChild(bloccoLavoro(e));_az16(e,box);
  if(box&&box.classList&&box.classList.contains('c12det')){const L=box.querySelector('.ev16'),P=box.querySelector('.ev15prep');if(L&&P&&evAppr(e)==='pubblicato')P.before(L);}};
// carta del calendario: percentuale
const _carta16=cartaEvento;cartaEvento=function(e){const x=_carta16(e);const p=percEv(e);if(p){const b=h('<div class="b26v ev16mini" style="--c:'+evCol(e)+'"><span>Avanzamento</span><b>'+p.pc+'%</b><i style="--w:'+p.pc+'%"></i></div>');const bl=x.querySelector('.ev14bil');if(bl)bl.after(b);}return x;};
// Il mio spazio: dal compito si apre la scheda dell'evento
const _riga16=rigaCompito;rigaCompito=function(c,mio){const r=_riga16(c,mio);if(c.evento_id){const b=h('<button type="button" class="lnk2">Apri la scheda dell’evento ›</button>');b.addEventListener('click',()=>go('sec-evt#'+c.evento_id));r.insertBefore(b,r.querySelector('.rowb')||null);}return r;};
// Home: eventi pubblicati in preparazione, con la percentuale e i propri compiti
function eventiHome(){const me=CTX.user.id;const oggi=todayISO();const E=allEv().filter(e=>evAppr(e)==='pubblicato'&&((evDays(e)||[]).slice(-1)[0]||'0')>=oggi).sort((a,b)=>((evDays(a)||[])[0]||'').localeCompare((evDays(b)||[])[0]||''));
  const mie=COMP.filter(c=>c.fase==='lavoro'&&c.per===me&&!c.fatto&&c.stato!=='da_assegnare');
  if(!E.length&&!mie.length)return null;
  const w=h('<section class="w h13w ev16home"><div class="wh"><b>Eventi in preparazione</b>'+(canOpen('sec-evt')?'<button type="button" class="lnk2" data-go="sec-evt">Panoramica</button>':'')+'</div></section>');
  E.slice(0,4).forEach(e=>{const p=percEv(e);const n=mie.filter(c=>c.evento_id===String(e.id)).length;const r=h('<button type="button" class="ev16hr" style="--c:'+evCol(e)+'"><span class="ev16hn"><b>'+esc(e.n)+'</b><em>'+esc(dLab(evDays(e)))+(n?' · <span class="neg">'+n+(n===1?' tuo compito':' tuoi compiti')+'</span>':'')+'</em></span><span class="ev16hp">'+(p?p.pc+'%':'—')+'</span><i style="--w:'+(p?p.pc:0)+'%"></i></button>');r.addEventListener('click',()=>go('sec-evt#'+e.id));w.appendChild(r);});
  const altri=mie.filter(c=>!E.some(e=>String(e.id)===c.evento_id));if(altri.length)w.appendChild(h('<p class="muted small" style="margin:0">Hai anche '+altri.length+(altri.length===1?' compito':' compiti')+' per eventi non ancora pubblicati: li trovi in Il mio spazio.</p>'));
  return w;}
const _home16=renderHome;renderHome=function(){_home16();const el=document.getElementById('p-home');const Rr=el&&el.querySelector('.h13r');const w=eventiHome();if(Rr&&w){Rr.insertBefore(w,Rr.children[1]||null);}};R['p-home']=renderHome;
// all'approvazione le attività della scheda (24 ore) ancora aperte si chiudono: da lì in poi contano le attività organizzative
const schedaAperte=e=>COMP.filter(c=>c.evento_id===String(e.id)&&c.fase!=='lavoro'&&!c.fatto);
const _appr16=approva15;approva15=async function(e){const A=schedaAperte(e);for(const c of A)await CTX.sb.from('compiti').update({fatto:true,stato:'chiusa',nota:'Chiusa all’approvazione dell’evento'}).eq('id',c.id);if(A.length)await loadSocial();return _appr16(e);};
const _todo16=myTodo;myTodo=function(){return _todo16().filter(c=>!(c.evento_id&&c.fase!=='lavoro'&&['approvato','pubblicato'].includes((allEv().find(e=>String(e.id)===c.evento_id)&&evAppr(allEv().find(e=>String(e.id)===c.evento_id)))||'')));};
