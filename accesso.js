/* Accesso alla piattaforma: login, primo accesso su invito, recupero password, caricamento dei dati permessi. */
(async function(){
  const C=window.CFG||{};const $=id=>document.getElementById(id);
  const ECO=['s-bil','s-for','s-fon','s-pre','s-car','s-ric','s-ter','s-ev','s-cs'];
  const msg=t=>{$('lmsg').textContent=t||'';};
  const view=v=>{document.querySelectorAll('.lg-v').forEach(x=>x.hidden=x.dataset.v!==v);msg('');};
  $('login').hidden=false;
  if(!C.url||!C.anon){view('entra');msg('Il sito non è ancora collegato al database: manca la configurazione.');return;}
  const sb=window.supabase.createClient(C.url,C.anon);
  document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();view(a.dataset.go);}));
  const back=location.origin+location.pathname;
  function it(m){m=m||'';
    if(/at least one character of each/i.test(m))return 'La password deve contenere almeno una lettera minuscola, una maiuscola, un numero e un simbolo (per esempio Bruna2027!).';
    const n=m.match(/at least (\d+) characters/i);if(n)return 'La password deve avere almeno '+n[1]+' caratteri.';
    if(/weak|pwned|leaked/i.test(m))return 'Questa password è troppo comune o è comparsa in furti di dati: scegline una diversa.';
    if(/already registered|already exists/i.test(m))return 'Hai già creato l’accesso con questa email: torna a «Entra» e usa la tua password.';
    if(/Invalid login credentials/i.test(m))return 'Email o password non corrette. Se non hai ancora creato la password, scegli «Primo accesso».';
    if(/not confirmed/i.test(m))return 'L’email non è confermata: in Supabase va spenta l’opzione «Confirm email».';
    if(/invit|Database error/i.test(m))return 'Questa email non è stata invitata. Controlla di averla scritta uguale all’invito.';
    if(/rate limit|too many/i.test(m))return 'Troppi tentativi ravvicinati: aspetta qualche minuto e riprova.';
    return 'Errore: '+m;}
  async function start(session){
    msg('Carico i dati…');
    const uid=session.user.id;
    const {data:prof,error:e1}=await sb.from('profili').select('*').eq('id',uid).maybeSingle();
    if(e1||!prof){msg('Il tuo accesso non è ancora attivo. Chiedi all’amministratore.');return;}
    const {data:pm}=await sb.from('permessi').select('area,livello').eq('user_id',uid);
    const perms={};(pm||[]).forEach(p=>perms[p.area]=p.livello);
    const admin=!!prof.admin;
    if(admin){const {count,error:ec}=await sb.from('dati').select('pacchetto',{count:'exact',head:true});if(!ec&&!count){$('login').hidden=false;view('importa');pending=session;return;}}
    const canSee=a=>admin||!!perms[a];const canEdit=a=>admin||perms[a]==='modifica';
    const eco=admin||ECO.some(a=>perms[a]);
    if(!admin&&!Object.keys(perms).length){msg('Non hai ancora accesso a nessuna scheda. Chiedi all’amministratore.');return;}
    const D={bil:[],forn:[],prev:[],ric:[],leve:[],ev:[],fix:{n:'Corpus Sacro',d:[],desc:''},beni:[],alloc:[],cen2:[],tot26:0,ric26:0,
      ricad:{festa_giornalieri:0,festa_pern:0,festa_notti:0,spesa_giorno:0,spesa_pern:0,molt:1.5,va:0.45,va_ula:40000,pil_matera:1730000000,quota_bas:0,quota_pug:0}};
    if(eco||canSee('s-cs')){const {data,error}=await sb.from('dati').select('pacchetto,contenuto');if(error){msg('Errore nel caricare i dati: '+error.message);return;}(data||[]).forEach(r=>Object.assign(D,r.contenuto));}
    const {data:rows}=await sb.from('stato').select('*');
    const pres=canSee('s-map')?((await sb.from('presenze').select('*')).data||[]):[];
    const CTX={sb,user:session.user,prof,perms,admin,eco,canSee,canEdit,anyEdit:admin||Object.values(perms).includes('modifica'),rows:rows||[],pres,
      logout:async()=>{await sb.auth.signOut();location.reload();}};
    $('login').hidden=true;$('app').hidden=false;msg('');
    window.APP(D,CTX);
  }
  $('lgo').addEventListener('click',async()=>{msg('Entro…');const {data,error}=await sb.auth.signInWithPassword({email:$('le').value.trim().toLowerCase(),password:$('lp').value});
    if(error){msg(it(error.message));return;}start(data.session);});
  $('lp').addEventListener('keydown',e=>{if(e.key==='Enter')$('lgo').click();});
  $('pgo').addEventListener('click',async()=>{const email=$('pe').value.trim().toLowerCase(),password=$('pp').value;
    if(password.length<8){msg('La password deve avere almeno 8 caratteri.');return;}
    msg('Creo l’accesso…');const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:back}});
    if(error){msg(it(error.message));return;}
    if(data.session)start(data.session);else{view('entra');msg('Ti è arrivata un’email: aprila per confermare, poi torna qui ed entra.');}});
  $('rgo').addEventListener('click',async()=>{const {error}=await sb.auth.resetPasswordForEmail($('re').value.trim().toLowerCase(),{redirectTo:back});msg(error?'Errore: '+error.message:'Se l’email è registrata, ti è arrivato un link per cambiare la password.');});
  $('ngo').addEventListener('click',async()=>{const p=$('np').value;if(p.length<8){msg('Almeno 8 caratteri.');return;}const {error}=await sb.auth.updateUser({password:p});if(error){msg(it(error.message));return;}const {data}=await sb.auth.getSession();if(data.session)start(data.session);});
  let pending=null;
  const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  $('igo').addEventListener('click',async()=>{msg('Importo…');try{
      const f=await (await fetch('dati/iniziali.enc',{cache:'no-store'})).json();
      const km=await crypto.subtle.importKey('raw',new TextEncoder().encode($('ik').value.trim()),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(f.salt),iterations:f.iter,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
      let txt;try{txt=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(f.iv)},key,b64(f.ct)));}catch(e){msg('Chiave non corretta.');return;}
      const P=JSON.parse(txt);
      for(const [t,rows] of [['dati',P.dati],['stato',P.stato],['presenze',P.presenze]]){if(!rows.length)continue;const {error}=await sb.from(t).upsert(rows);if(error){msg('Errore nel salvare '+t+': '+error.message);return;}}
      msg('Dati importati.');start(pending);
    }catch(e){msg('Non riesco a importare: '+e.message);}});
  let recovery=false;
  sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){recovery=true;$('app').hidden=true;$('login').hidden=false;view('nuova');}});
  const {data:{session}}=await sb.auth.getSession();
  setTimeout(()=>{if(recovery)return;if(session)start(session);else view('entra');},50);
})();
