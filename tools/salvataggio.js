/* ---------- salvataggio su Supabase, permessi e tempo reale ---------- */
const stEl=document.getElementById('status');let timer=null,saving=false,pending=false;
const KEYAREA={vo:'s-pre',so:'s-pre',progetto:'s-pre',risp:'s-pre',rp:'s-pre',fondo:'s-fon',ro:'s-ric',crescita:'s-ric',leve:'s-ric',target:'s-ric',leveInPrev:'s-ric',rc:'s-ter',carPct:'s-car',al:'s-car',ev:'s-ev',evc:'s-ev',cs:'s-cs'};
const NUM2AREA=['','s-bil','s-for','s-fon','s-pre','s-car','s-ric','s-ter','s-ev','s-map','s-cs','s-adm'];
const EDK2A={forn:'s-for',bilA:'s-bil',bilV:'s-bil',prevA:'s-pre',voce:'s-pre',sub:'s-pre',ric:'s-ric',leva:'s-ric',alloc:'s-car',bene:'s-car',ev:'s-ev',place:'s-map'};
function edArea(k){const kind=k.slice(0,k.indexOf(':')),id=k.slice(k.indexOf(':')+1);return kind==='tx'?(NUM2AREA[+id]||'s-bil'):(EDK2A[kind]||'s-bil');}
function chunks(){const C={};for(const k in KEYAREA){const a=KEYAREA[k];(C[a]=C[a]||{})[k]=S[k];}for(const k in (S.ed||{})){const a=edArea(k);C[a]=C[a]||{};(C[a].ed=C[a].ed||{})[k]=S.ed[k];}return JSON.parse(JSON.stringify(C));}
const DEF=JSON.parse(JSON.stringify(S));let SAVED={};
function mergeRow(r){const a=r.area,c=r.contenuto||{};for(const k in KEYAREA){if(KEYAREA[k]!==a)continue;S[k]=JSON.parse(JSON.stringify(c[k]!==undefined?c[k]:DEF[k]));}
  S.ed=S.ed||{};for(const k in S.ed)if(edArea(k)===a)delete S.ed[k];Object.assign(S.ed,JSON.parse(JSON.stringify(c.ed||{})));SAVED[a]=JSON.parse(JSON.stringify(chunks()[a]||{}));}
function changed(){rerender();clearTimeout(timer);timer=setTimeout(save,700);}
async function save(){if(saving){pending=true;return;}saving=true;
  const C=chunks();const areas=new Set([...Object.keys(C),...Object.keys(SAVED)]);const todo=[];let blocked=false;
  areas.forEach(a=>{if(JSON.stringify(C[a]||{})===JSON.stringify(SAVED[a]||{}))return;if(CTX.canEdit(a))todo.push(a);else{blocked=true;mergeRow({area:a,contenuto:SAVED[a]||{}});}});
  if(blocked){stEl.textContent='Questa parte la puoi guardare, ma non modificare.';rerender();}
  if(todo.length){stEl.textContent='Salvo le modifiche…';
    const rows=todo.map(a=>({area:a,contenuto:C[a]||{},aggiornato:new Date().toISOString(),aggiornato_da:CTX.user.id}));
    const {error}=await CTX.sb.from('stato').upsert(rows);
    if(error)stEl.textContent='Non sono riuscito a salvare: '+error.message;else{todo.forEach(a=>SAVED[a]=JSON.parse(JSON.stringify(C[a]||{})));stEl.textContent='Modifiche salvate. Le vedono tutti.';}}
  saving=false;if(pending){pending=false;save();}}
/* sola lettura: nelle schede senza permesso di modifica i campi sono bloccati */
function lockRO(){const el=document.getElementById(cur);if(!el||!/^s-/.test(cur)||cur==='s-adm'||CTX.canEdit(cur))return;el.querySelectorAll('input[type=number],input[type=checkbox],input[type=text],textarea').forEach(x=>{x.disabled=true;});}
new MutationObserver(()=>requestAnimationFrame(lockRO)).observe(document.querySelector('.panel'),{childList:true,subtree:true});
/* ---------- 11. Utenti e permessi (solo amministratore) ---------- */
const AREEP=TABS.length?[['s-bil','1. Bilancio 2026'],['s-for','2. Fornitori'],['s-fon','3. Fondo sociale'],['s-pre','4. Previsione 2027'],['s-car','5. Carità'],['s-ric','6. Ricavi'],['s-ter','7. Territorio'],['s-ev','8. Calendario eventi'],['s-map','9. Mappa di Matera'],['s-cs','10. Centro Studi']]:[];
const LIV=[['','Non vede'],['vedi','Guarda'],['modifica','Modifica']];
function selLiv(v,attr){return '<select '+attr+'>'+LIV.map(([k,l])=>'<option value="'+k+'"'+((v||'')===k?' selected':'')+'>'+l+'</option>').join('')+'</select>';}
async function renderAdm(){
  const el=document.getElementById('s-adm');if(cur!=='s-adm')return;el.innerHTML='';
  el.appendChild(head(11,'Utenti e permessi','Inviti le persone e decidi, scheda per scheda, chi non la vede, chi la guarda e chi la modifica. I permessi li controlla il database: chi non ha il permesso non riceve nemmeno i dati.'));
  const [pf,pm,iv,rg]=await Promise.all([CTX.sb.from('profili').select('*').order('creato'),CTX.sb.from('permessi').select('*'),CTX.sb.from('inviti').select('*').eq('usato',false).order('creato'),CTX.sb.from('registro').select('*').order('quando',{ascending:false}).limit(60)]);
  if(cur!=='s-adm')return;
  /* invito */
  const inv=h('<div class="card"><h3>Invita una persona</h3><div class="when"><div class="ctl"><label for="ie">Email</label><input type="text" id="ie" placeholder="nome@esempio.it"></div><div class="ctl"><label for="in">Nome</label><input type="text" id="in"></div></div>'+
    '<div class="tw"><table><thead><tr><th>Scheda</th><th>Permesso</th></tr></thead><tbody>'+AREEP.map(([a,n])=>'<tr><td>'+n+'</td><td>'+selLiv('','data-a="'+a+'"')+'</td></tr>').join('')+'</tbody></table></div>'+
    '<div class="big-btns"><button type="button" class="bb soft" id="tuttiG">Tutte: guarda</button><button type="button" class="bb soft" id="tuttiM">Tutte: modifica</button></div>'+
    '<label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="iadm"> È anche amministratore (vede e modifica tutto, gestisce gli utenti)</label>'+
    '<div class="big-btns"><button type="button" class="bb" aria-pressed="true" id="invia">Invita</button></div><p class="muted small" id="imsg">Dopo l’invito, la persona apre il sito, sceglie «Primo accesso» e crea la sua password con questa email.</p></div>');
  inv.querySelector('#tuttiG').addEventListener('click',()=>inv.querySelectorAll('select[data-a]').forEach(s=>s.value='vedi'));
  inv.querySelector('#tuttiM').addEventListener('click',()=>inv.querySelectorAll('select[data-a]').forEach(s=>s.value='modifica'));
  inv.querySelector('#invia').addEventListener('click',async()=>{const email=inv.querySelector('#ie').value.trim().toLowerCase();const msg=inv.querySelector('#imsg');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){msg.textContent='Scrivi un’email valida.';return;}
    const permessi={};inv.querySelectorAll('select[data-a]').forEach(s=>{if(s.value)permessi[s.dataset.a]=s.value;});
    const {error}=await CTX.sb.from('inviti').upsert({email,nome:inv.querySelector('#in').value.trim()||null,admin:inv.querySelector('#iadm').checked,permessi,usato:false});
    msg.textContent=error?'Non sono riuscito a salvare l’invito: '+error.message:'Invito salvato. Manda a '+email+' il link del sito: sceglie «Primo accesso» e crea la password.';if(!error)setTimeout(renderAdm,1200);});
  el.appendChild(inv);
  /* persone */
  const P=pf.data||[],M=pm.data||[];
  const pc=h('<div class="card"><h3>Persone con accesso ('+P.length+')</h3><div class="tw"><table><thead><tr><th>Persona</th>'+AREEP.map(([a,n])=>'<th>'+esc(n.replace(/^\d+\.\s*/,''))+'</th>').join('')+'</tr></thead><tbody></tbody></table></div><p class="muted small">Le modifiche ai permessi valgono dal prossimo accesso della persona.</p></div>');
  P.forEach(u=>{const tr=h('<table><tr><td><b>'+esc(u.nome||u.email)+'</b><br><span class="muted small">'+esc(u.email)+'</span>'+(u.admin?' <span class="badge ok">amministratore</span>':'')+'</td>'+AREEP.map(([a])=>{const m=M.find(x=>x.user_id===u.id&&x.area===a);return '<td>'+(u.admin?'<span class="muted small">tutto</span>':selLiv(m&&m.livello,'data-u="'+u.id+'" data-a="'+a+'" style="min-height:40px;font-size:15px"'))+'</td>';}).join('')+'</tr></table>').querySelector('tr');
    tr.querySelectorAll('select').forEach(s=>s.addEventListener('change',async()=>{const q=s.value?CTX.sb.from('permessi').upsert({user_id:s.dataset.u,area:s.dataset.a,livello:s.value}):CTX.sb.from('permessi').delete().eq('user_id',s.dataset.u).eq('area',s.dataset.a);const {error}=await q;stEl.textContent=error?'Errore: '+error.message:'Permesso aggiornato.';}));
    pc.querySelector('tbody').appendChild(tr);});
  el.appendChild(pc);
  /* inviti in attesa */
  const I=iv.data||[];
  if(I.length){const ic=h('<div class="card"><h3>Inviti in attesa ('+I.length+')</h3><div class="rows"></div></div>');
    I.forEach(x=>{const r=h('<div class="row"><span class="n">'+esc(x.nome||x.email)+' <span class="muted small">'+esc(x.email)+'</span>'+(x.admin?' <span class="badge ok">amministratore</span>':'')+'</span><span><button type="button" class="bb soft">Annulla invito</button></span><div class="d">'+(Object.entries(x.permessi||{}).map(([a,l])=>(AREEP.find(y=>y[0]===a)||[a,a])[1]+': '+(l==='modifica'?'modifica':'guarda')).join(' · ')||'nessuna scheda')+'</div></div>');
      r.querySelector('button').addEventListener('click',async()=>{await CTX.sb.from('inviti').delete().eq('email',x.email);renderAdm();});ic.querySelector('.rows').appendChild(r);});
    el.appendChild(ic);}
  /* registro */
  const G=rg.data||[];
  el.appendChild(h('<div class="card"><h3>Registro delle modifiche</h3><div class="tw"><table><thead><tr><th>Quando</th><th>Chi</th><th>Cosa</th><th>Scheda</th></tr></thead><tbody>'+(G.map(x=>'<tr><td class="small">'+new Date(x.quando).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</td><td>'+esc(x.email||'—')+'</td><td>'+esc(x.cosa||'')+'</td><td class="small">'+esc((AREEP.find(y=>y[0]===x.area)||['',x.area||''])[1])+'</td></tr>').join('')||'<tr><td colspan="4" class="muted">Ancora nessuna modifica.</td></tr>')+'</tbody></table></div></div>'));
}
/* ---------- avvio ---------- */
autoLeve();
(CTX.rows||[]).forEach(mergeRow);
(CTX.pres||[]).forEach(r=>{PRES[r.id]=r.dati||{};});
if(!CTX.anyEdit)document.getElementById('edt').hidden=true;
document.getElementById('esci').addEventListener('click',()=>CTX.logout());
show(cur);
stEl.textContent='Ciao '+(CTX.prof.nome||CTX.prof.email)+(CTX.anyEdit?'. Ogni modifica si salva da sola.':'. Puoi consultare le schede.');
CTX.sb.channel('cruscotto').on('postgres_changes',{event:'*',schema:'public',table:'stato'},p=>{const r=p.new;if(!r||!r.area||r.aggiornato_da===CTX.user.id)return;
    const mine=JSON.stringify(chunks()[r.area]||{})!==JSON.stringify(SAVED[r.area]||{});if(mine)return;mergeRow(r);if(cur!=='s-adm')rerender();stEl.textContent='Aggiornato da un collega.';})
  .on('postgres_changes',{event:'*',schema:'public',table:'presenze'},p=>{const r=p.new;if(!r||!r.id)return;PRES[r.id]=r.dati||{};if(cur==='s-map'&&!(document.activeElement&&document.activeElement.matches('input')))renderMap();})
  .subscribe();
setInterval(()=>{if(cur==='s-map'&&!document.activeElement.matches('input'))renderMap();},60000);
