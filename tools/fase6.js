/* ================= Bruna27 · account creati dall'amministratore (si entra con nome e cognome) ================= */
const DOMINIO_UTENTI='example.com';
function nomeUtente(n){return String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');}
const emailFinta=e=>/@example\.com$/i.test(e||'');
let UTENTI={};
async function loadUtenti(){try{const {data,error}=await CTX.sb.functions.invoke('utenti',{body:{azione:'elenco'}});if(!error&&data&&data.utenti){UTENTI={};data.utenti.forEach(x=>UTENTI[x.id]=x);}}catch(e){}}
async function fnUtenti(body){let r;try{r=await CTX.sb.functions.invoke('utenti',{body});}catch(e){throw new Error('La funzione «utenti» non risponde: va installata in Supabase.');}
  if(r.error)throw new Error('La funzione «utenti» non risponde: va installata in Supabase.');if(r.data&&r.data.error)throw new Error(r.data.error);return r.data||{};}
function mostraPassword(nm,email,pw,dopo){const url=location.origin+location.pathname;
  const d=sheet('Accesso di '+nm,'<p style="font-size:17px">Comunica questi dati a <b>'+esc(nm)+'</b>, meglio a voce o di persona. La password si vede solo adesso: non viene salvata da nessuna parte.</p><div class="pwbox"><div><span>Sito</span><b>'+esc(url)+'</b></div><div><span>Nome utente</span><b>'+esc(email)+'</b></div><div><span>Password temporanea</span><b class="pw">'+esc(pw)+'</b></div></div><p class="muted small">Vale 7 giorni. Al primo accesso la piattaforma chiede di sceglierne una personale.</p><button type="button" class="bb soft sm" id="pwc">Copia il messaggio da mandare</button>','Fatto',async()=>{if(dopo)dopo();});
  d.querySelector('#pwc').addEventListener('click',async()=>{const t='Ciao '+nm+', ecco il tuo accesso a Bruna27.\nSito: '+url+'\nNome utente: '+email+'\nPassword temporanea: '+pw+'\nAl primo accesso ti chiederà di sceglierne una tua.';
    try{await navigator.clipboard.writeText(t);d.querySelector('#pwc').textContent='Copiato ✓';}catch(e){d.querySelector('#pwc').textContent='Non riesco a copiare: scrivilo a mano';}});}
function accountBox(u,b){const x=UTENTI[u.id]||{};const me=u.id===CTX.user.id;
  const stato=u.attivo===false?'<span class="chip2 ko">Disattivato</span>':u.deve_cambiare?'<span class="chip2">Deve scegliere la sua password</span>':'<span class="chip2 ok">Attivo</span>';
  const ult=x.ultimo_accesso?new Date(x.ultimo_accesso).toLocaleString('it-IT',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'mai';
  const box=h('<div class="acc"><div class="chips">'+stato+(u.informativa_il?'<span class="chip2">Informativa letta il '+new Date(u.informativa_il).toLocaleDateString('it-IT')+'</span>':'')+'</div><span class="muted small">'+esc(u.email||'')+' · ultimo accesso: '+ult+'</span><div class="big-btns"><button type="button" class="bb soft sm" data-a="reimposta">Nuova password temporanea</button>'+(me?'':'<button type="button" class="bb soft sm '+(u.attivo===false?'':'ko')+'" data-a="'+(u.attivo===false?'riattiva':'disattiva')+'">'+(u.attivo===false?'Riattiva l’account':'Disattiva l’account')+'</button>')+'</div></div>');
  box.querySelectorAll('[data-a]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.dataset.a;const n=u.nome||u.email;
    const testi={reimposta:['Nuova password temporanea per '+n+'?','La password attuale smette di funzionare. La persona dovrà sceglierne una nuova al primo accesso.','Genera'],disattiva:['Disattivare l’account di '+n+'?','Non potrà più entrare finché non lo riattivi. I suoi dati restano.','Disattiva'],riattiva:['Riattivare l’account di '+n+'?','Potrà di nuovo entrare con la sua password.','Riattiva']}[a];
    sheet(testi[0],'<p style="font-size:17px">'+testi[1]+'</p>',testi[2],async()=>{const r=await fnUtenti({azione:a,id:u.id});if(a==='reimposta')setTimeout(()=>mostraPassword(n,emailFinta(u.email)?(u.nome||n):u.email,r.password,()=>renderAdm2()),50);else renderAdm2();});}));
  b.appendChild(box);}

/* --- dal telefono: le pagine che sul computer stanno nel menu a sinistra --- */
function meLinks(el){const L1=[['p-cal','Calendario',IC2.cal],['p-req','Richieste del Presidente',IC2.inbox],['p-pub','Percorsi pubblicati',IC2.route]];if(CTX.admin)L1.unshift(['s-adm','Utenti e accessi',IC2.key]);
  const c=h('<section class="card melinks"><h3>Altre pagine</h3><div class="tilegrid">'+L1.map(([k,t,ic],i)=>'<button type="button" class="vtile'+(k==='s-adm'?' first':'')+'" data-go="'+k+'"><span class="vic">'+svg(ic)+'</span><span class="vt">'+esc(t)+'</span>'+(k==='s-adm'?'<span class="vs">Crea gli accessi e decidi chi vede cosa</span>':'')+'</button>').join('')+'</div></section>');
  el.insertBefore(c,el.children[1]||null);}
