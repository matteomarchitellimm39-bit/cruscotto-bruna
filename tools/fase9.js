/* ================= Bruna27 · 29-37: foto profilo e colori, pannello notifiche, chat flottante, bacheca nella Home e aperta a tutti ================= */

/* --- foto profilo e colore di ogni persona --- */
const PALETTA=['#4C7BD9','#D9822B','#2A9D8F','#B5527E','#7A5CC7','#C9A227','#3F8F4F','#D9534F','#2B7A99','#A0663A','#6C7A89','#9C4FB5'];
function coloreDi(uid){const p=PEOPLE[uid];if(p&&p.colore)return p.colore;let x=0;String(uid||'').split('').forEach(c=>x=(x*31+c.charCodeAt(0))>>>0);return PALETTA[x%PALETTA.length];}
function avatar(uid,cls){const p=PEOPLE[uid]||{};const n=(p.nome||p.email||'?').trim();const ini=n.split(/\s+/).slice(0,2).map(w=>w.charAt(0)).join('').toUpperCase()||'?';
  return '<span class="av9'+(cls?' '+cls:'')+'" style="--c:'+coloreDi(uid)+'" aria-hidden="true">'+(p.foto?'<img src="'+esc(p.foto)+'" alt="" loading="lazy">':esc(ini))+'</span>';}
function avatarBruna(cls){return '<span class="av9 b27'+(cls?' '+cls:'')+'" aria-hidden="true"><img src="icona-192.png" alt=""></span>';}
function aggiornaAvt(){const a=document.getElementById('avt');if(!a)return;const p=PEOPLE[CTX.user.id]||{};if(p.foto){a.innerHTML='<img src="'+esc(p.foto)+'" alt="">';a.classList.add('hasfoto');}else{a.textContent=iniz(CTX.user.id);a.classList.remove('hasfoto');}}
async function quadrata(file,lato){const url=URL.createObjectURL(file);try{const im=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url;});
  const s=Math.min(im.naturalWidth,im.naturalHeight);const c=document.createElement('canvas');c.width=c.height=lato;const g=c.getContext('2d');g.drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,lato,lato);
  return await new Promise(ok=>c.toBlob(ok,'image/jpeg',0.86));}finally{URL.revokeObjectURL(url);}}
function cardFoto(){const me=CTX.user.id;const p=PEOPLE[me]||{};
  const c=h('<section class="card fotocard"><h3>La tua foto</h3><div class="fotorow">'+avatar(me,'xl')+'<div class="big-btns"><label class="bb soft sm upl">'+(p.foto?'Cambia la foto':'Carica una foto')+'<input type="file" accept="image/*" hidden></label>'+(p.foto?'<button type="button" class="bb soft sm ko" id="ft_rm">Togli la foto</button>':'')+'</div></div><p class="muted small">La vedono le persone di Bruna27: in chat, in bacheca, nei compiti e nelle notifiche. Senza foto compaiono le tue iniziali.</p></section>');
  c.querySelector('input').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;let blob;try{blob=await quadrata(f,400);}catch(x){stEl.textContent='Non riesco a leggere questa immagine.';return;}
    const prev=URL.createObjectURL(blob);
    sheet('La tua nuova foto','<div class="fotoprev"><img src="'+prev+'" alt="Anteprima della foto"></div><p class="muted small">Così la vedranno gli altri. Se va bene, premi Salva.</p>','Salva',async()=>{
      const path=me+'/'+Date.now()+'.jpg';const up=await CTX.sb.storage.from('foto').upload(path,blob,{contentType:'image/jpeg',upsert:true});if(up.error)throw new Error(up.error.message);
      const url=CTX.sb.storage.from('foto').getPublicUrl(path).data.publicUrl;const {error}=await CTX.sb.rpc('imposta_foto',{url});if(error)throw new Error(error.message);
      const vecchia=p.foto;PEOPLE[me]=Object.assign(PEOPLE[me]||{},{foto:url});aggiornaAvt();renderMe();stEl.textContent='Foto salvata.';
      if(vecchia){const k=vecchia.split('/object/public/foto/')[1];if(k)CTX.sb.storage.from('foto').remove([decodeURIComponent(k)]).catch(()=>{});}});});
  const rm=c.querySelector('#ft_rm');if(rm)rm.addEventListener('click',()=>ask('Togliere la tua foto?','Togli',async()=>{const {error}=await CTX.sb.rpc('imposta_foto',{url:null});if(error)throw new Error(error.message);
    const k=(p.foto||'').split('/object/public/foto/')[1];if(k)CTX.sb.storage.from('foto').remove([decodeURIComponent(k)]).catch(()=>{});PEOPLE[me].foto=null;aggiornaAvt();renderMe();}));
  return c;}
const _renderMe9=renderMe;renderMe=async function(){await _renderMe9();const el=document.getElementById('p-me');if(cur!=='p-me'||!el)return;const hd=el.querySelector('.mehead');const c=cardFoto();if(hd&&hd.nextSibling)el.insertBefore(c,hd.nextSibling);else el.appendChild(c);};
R['p-me']=renderMe;
// colore: lo cambia l'amministratore
const _accountBox9=accountBox;accountBox=function(u,b){const r=_accountBox9(u,b);if(!CTX.admin)return r;
  const w=h('<div class="ctl colsel"><label>Colore in bacheca</label><div class="pal">'+PALETTA.map(c=>'<button type="button" style="--c:'+c+'" aria-label="Colore '+c+'" aria-pressed="'+(coloreDi(u.id)===c)+'" data-c="'+c+'"></button>').join('')+'</div></div>');
  w.querySelectorAll('[data-c]').forEach(x=>x.addEventListener('click',async()=>{const {error}=await CTX.sb.rpc('imposta_colore',{uid:u.id,c:x.dataset.c});if(error){stEl.textContent='Errore: '+error.message;return;}
    if(PEOPLE[u.id])PEOPLE[u.id].colore=x.dataset.c;u.colore=x.dataset.c;w.querySelectorAll('[data-c]').forEach(y=>y.setAttribute('aria-pressed',String(y===x)));stEl.textContent='Colore cambiato.';}));
  b.appendChild(w);return r;};
// anteprima sulla schermata di blocco
const _mpn9=mePrefNoti;mePrefNoti=function(el){_mpn9(el);const v=PREF.anteprima==='nascosta'?'nascosta':'completa';
  const c=h('<section class="card"><h3>Sulla schermata di blocco</h3><div class="seg wrap" role="radiogroup"><button type="button" data-v="completa" aria-pressed="'+(v==='completa')+'">Mostra il testo</button><button type="button" data-v="nascosta" aria-pressed="'+(v==='nascosta')+'">Solo chi scrive</button></div><p class="muted small">Con «Solo chi scrive» il telefono mostra per esempio «Francesco — Nuovo messaggio», senza il testo.</p></section>');
  c.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',async()=>{PREF.anteprima=b.dataset.v;c.querySelectorAll('[data-v]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));await savePref();stEl.textContent='Preferenza salvata.';}));
  el.insertBefore(c,[...el.children].pop());};

/* --- quando: «ora», «10 min fa», «ieri 18:30» --- */
function quando9(t){const d=new Date(t),n=new Date();const m=Math.round((n-d)/60000);if(m<1)return 'ora';if(m<60)return m+' min fa';
  const hh=d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});if(d.toDateString()===n.toDateString())return hh;const ie=new Date(n);ie.setDate(n.getDate()-1);if(d.toDateString()===ie.toDateString())return 'ieri '+hh;
  return d.toLocaleDateString('it-IT',{day:'numeric',month:'short'})+' '+hh;}

/* --- 32. pannello delle notifiche --- */
let NPAN=null,NFILT='tutte',NTUTTE=null;
const notiVisibili=()=>(NTUTTE||NOTI).filter(n=>!mutata(n));
refreshBell=function(){const n=NOTI.filter(x=>!x.letto&&!x.archiviata&&!mutata(x)).length;const b=document.getElementById('bellN');if(b){b.textContent=n?String(n>99?'99+':n):'';b.hidden=!n;}if(NPAN&&!NPAN.hidden)disegnaNoti();};
async function caricaNoti(){const {data}=await CTX.sb.from('notifiche').select('*').eq('per',CTX.user.id).order('quando',{ascending:false}).limit(150);if(data){NTUTTE=data;NOTI=data.slice(0,40);}}
function chiudiPannelli(tranne){if(NPAN&&tranne!=='n')NPAN.hidden=true;if(CPAN&&tranne!=='c'){CPAN.hidden=true;CPANCONV=null;}document.body.classList.toggle('panopen',!!((NPAN&&!NPAN.hidden)||(CPAN&&!CPAN.hidden)));}
async function apriNoti(){if(!NPAN){NPAN=h('<aside id="npan" class="pan9" role="dialog" aria-label="Notifiche" hidden></aside>');document.body.appendChild(NPAN);}
  if(!NPAN.hidden){chiudiPannelli();return;}chiudiPannelli('n');NPAN.hidden=false;document.body.classList.add('panopen');disegnaNoti();await caricaNoti();disegnaNoti();}
function disegnaNoti(){const L=notiVisibili();const non=L.filter(n=>!n.letto&&!n.archiviata);
  const F=NFILT==='nonlette'?non:NFILT==='archivio'?L.filter(n=>n.archiviata):L.filter(n=>!n.archiviata);
  NPAN.innerHTML='<div class="panh"><b>Notifiche</b><button type="button" class="x9" aria-label="Chiudi">×</button></div><div class="seg wrap nfilt">'+[['tutte','Tutte'],['nonlette','Non lette'+(non.length?' · '+non.length:'')],['archivio','Archiviate']].map(([k,l])=>'<button type="button" data-f="'+k+'" aria-pressed="'+(NFILT===k)+'">'+l+'</button>').join('')+'</div>'+(non.length&&NFILT!=='archivio'?'<button type="button" class="lnk2 allr">Segna tutte come lette</button>':'')+'<div class="nlist"></div>';
  NPAN.querySelector('.x9').addEventListener('click',()=>chiudiPannelli());
  NPAN.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{NFILT=b.dataset.f;disegnaNoti();}));
  const ar=NPAN.querySelector('.allr');if(ar)ar.addEventListener('click',async()=>{await CTX.sb.from('notifiche').update({letto:true}).eq('per',CTX.user.id).eq('letto',false);(NTUTTE||[]).concat(NOTI).forEach(n=>n.letto=true);refreshBell();});
  const box=NPAN.querySelector('.nlist');
  F.slice(0,100).forEach(n=>{const it=h('<div class="nit'+(n.letto?'':' new')+(n.priorita==='urgente'?' urg':'')+'"><button type="button" class="nmain">'+(n.da&&PEOPLE[n.da]?avatar(n.da):String(n.link||'').startsWith('p-chat#')?'<span class="av9 grp" style="--c:'+coloreDi(n.link.slice(7))+'">'+esc(String(n.titolo||'C').replace(/^Gruppo\s+/,'').charAt(0).toUpperCase())+'</span>':avatarBruna())+'<span class="ntx"><b>'+esc(n.titolo||'Bruna27')+'</b><span>'+esc(n.testo||'')+'</span><em>'+quando9(n.quando)+(n.letto?'':' · non letta')+'</em></span></button><div class="nact">'+(n.letto?'':'<button type="button" data-a="letta">Segna come letta</button>')+'<button type="button" data-a="arch">'+(n.archiviata?'Rimetti tra le notifiche':'Archivia')+'</button></div></div>');
    const segna=async(campi)=>{Object.assign(n,campi);const o=NOTI.find(x=>x.id===n.id);if(o)Object.assign(o,campi);await CTX.sb.from('notifiche').update(campi).eq('id',n.id);refreshBell();};
    it.querySelector('.nmain').addEventListener('click',async()=>{if(!n.letto)segna({letto:true});chiudiPannelli();if(n.link&&canOpen(n.link))go(n.link);});
    it.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.a==='letta')segna({letto:true});else segna({archiviata:!n.archiviata,letto:true});}));
    box.appendChild(it);});
  if(!F.length)box.appendChild(h('<p class="muted nvuoto">'+(NFILT==='nonlette'?'Hai letto tutto.':NFILT==='archivio'?'Nessuna notifica archiviata.':'Nessuna notifica.')+'</p>'));}

/* --- 30. chat sempre a portata di mano --- */
let CPAN=null,CPANCONV=null,CTAB='persone',CQ='';
function fabBadge(){const n=CONV.reduce((a,c)=>a+nonLetti(c.id),0);const f=document.getElementById('chatfab');if(f){const s=f.querySelector('.nb');s.textContent=n?String(n>99?'99+':n):'';s.hidden=!n;f.setAttribute('aria-label','Chat'+(n?', '+n+' messaggi non letti':''));}}
const _chatBadge9=chatBadge;chatBadge=function(){const n=_chatBadge9();fabBadge();return n;};
function creaFab(){if(document.getElementById('chatfab'))return;const f=h('<button type="button" id="chatfab" aria-label="Chat"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg><span class="nb" hidden></span></button>');
  f.addEventListener('click',()=>{if(CPAN&&!CPAN.hidden)chiudiPannelli();else apriChat();});document.body.appendChild(f);fabBadge();}
function convPrivataCon(uid){return CONV.find(c=>c.tipo==='privata'&&PART.some(p=>p.conv_id===c.id&&p.user_id===uid)&&PART.some(p=>p.conv_id===c.id&&p.user_id===CTX.user.id));}
function apriChat(cid){if(!CPAN){CPAN=h('<aside id="cpan" class="pan9" role="dialog" aria-label="Chat" hidden></aside>');document.body.appendChild(CPAN);}
  chiudiPannelli('c');CPAN.hidden=false;document.body.classList.add('panopen');const c=cid&&CONV.find(x=>x.id===cid);if(c)apriConvPan(c);else{if(cid)loadChat().then(()=>{const c2=CONV.find(x=>x.id===cid);if(c2)apriConvPan(c2);else elencoChat();});elencoChat();}}
function elencoChat(){CPANCONV=null;const me=CTX.user.id;CPAN.innerHTML='<div class="panh"><b>Chat</b><button type="button" class="x9" aria-label="Chiudi">×</button></div><div class="seg wrap ctabs"><button type="button" data-t="persone" aria-pressed="'+(CTAB==='persone')+'">Persone</button><button type="button" data-t="gruppi" aria-pressed="'+(CTAB==='gruppi')+'">Gruppi</button></div><input type="search" class="csrch" placeholder="Cerca '+(CTAB==='persone'?'una persona':'un gruppo')+'…" aria-label="Cerca" value="'+esc(CQ)+'"><div class="clist"></div>';
  CPAN.querySelector('.x9').addEventListener('click',()=>chiudiPannelli());
  CPAN.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{CTAB=b.dataset.t;CQ='';elencoChat();}));
  const L=CPAN.querySelector('.clist');const q=CPAN.querySelector('.csrch');
  const riga=(av,tit,c,onClick)=>{const ms=c?(MSG[c.id]||[]):[];const u=ms[ms.length-1];const n=c?nonLetti(c.id):0;
    const b=h('<button type="button" class="crow9">'+av+'<span class="cvt"><b>'+esc(tit)+'</b><em>'+(u?(u.da===me?'Tu: ':(c.tipo!=='privata'?esc(nome(u.da).split(' ')[0])+': ':''))+esc((u.testo||'Allegato').slice(0,70)):(c?'Nessun messaggio':'Scrivi un messaggio'))+'</em></span><span class="cmeta">'+(u?'<em>'+quando9(u.quando)+'</em>':'')+(n?'<span class="nb">'+n+'</span>':'')+'</span></button>');
    b.addEventListener('click',onClick);return b;};
  const draw=()=>{L.innerHTML='';const qq=CQ.toLowerCase();
    if(CTAB==='persone'){const P=Object.values(PEOPLE).filter(p=>p.id!==me&&p.attivo!==false&&(!qq||(p.nome||p.email||'').toLowerCase().includes(qq)));
      P.sort((a,b)=>{const ca=convPrivataCon(a.id),cb=convPrivataCon(b.id);const ua=ca?String(ca.ultimo||''):'',ub=cb?String(cb.ultimo||''):'';return ub.localeCompare(ua)||String(a.nome||'').localeCompare(String(b.nome||''));});
      P.forEach(p=>{const c=convPrivataCon(p.id);L.appendChild(riga(avatar(p.id),p.nome||p.email,c,async()=>{let cc=convPrivataCon(p.id);if(!cc){try{cc=await nuovaPrivata(p.id);}catch(e){stEl.textContent=e.message;return;}}apriConvPan(cc);}));});
      if(!P.length)L.appendChild(h('<p class="muted nvuoto">Nessuna persona trovata.</p>'));}
    else{const G=CONV.filter(c=>c.tipo!=='privata'&&(!qq||titoloConv(c).toLowerCase().includes(qq)));
      G.forEach(c=>L.appendChild(riga('<span class="av9 grp" style="--c:'+coloreDi(c.id)+'">'+esc(titoloConv(c).replace(/^Gruppo\s+/,'').charAt(0).toUpperCase())+'</span>',titoloConv(c),c,()=>apriConvPan(c))));
      if(!G.length)L.appendChild(h('<p class="muted nvuoto">Nessun gruppo.</p>'));
      const ng=h('<button type="button" class="lnk2 newg">+ Nuovo gruppo</button>');ng.addEventListener('click',nuovoGruppoPan);L.appendChild(ng);}};
  q.addEventListener('input',()=>{CQ=q.value.trim();draw();});draw();fabBadge();}
async function nuovaPrivata(uid){const {data,error}=await CTX.sb.from('conversazioni').insert({tipo:'privata'}).select().single();if(error)throw new Error(error.message);
  const r2=await CTX.sb.from('partecipanti').insert([CTX.user.id,uid].map(u=>({conv_id:data.id,user_id:u})));if(r2.error)throw new Error(r2.error.message);await loadChat();return CONV.find(c=>c.id===data.id)||data;}
function nuovoGruppoPan(){const ppl=Object.values(PEOPLE).filter(p=>p.id!==CTX.user.id&&p.attivo!==false);
  sheet('Nuovo gruppo','<div class="ctl"><label for="ng_t">Nome del gruppo</label><input type="text" id="ng_t"></div><div class="lab">Partecipanti</div><div class="checks">'+ppl.map(p=>'<label class="pck">'+'<input type="checkbox" value="'+p.id+'"> '+avatar(p.id,'xs')+esc(p.nome||p.email)+'</label>').join('')+'</div>','Crea',async(dl)=>{
    const sel=[...dl.querySelectorAll('.checks input:checked')].map(x=>x.value);if(!sel.length){dl.querySelector('.smsg').textContent='Scegli almeno una persona.';return false;}
    const {data,error}=await CTX.sb.from('conversazioni').insert({titolo:dl.querySelector('#ng_t').value.trim()||'Gruppo',tipo:'gruppo'}).select().single();if(error)throw new Error(error.message);
    const r2=await CTX.sb.from('partecipanti').insert([CTX.user.id].concat(sel).map(u=>({conv_id:data.id,user_id:u})));if(r2.error)throw new Error(r2.error.message);
    await loadChat();CTAB='gruppi';const c=CONV.find(x=>x.id===data.id);if(c)apriConvPan(c);});}
function apriConvPan(c){CPANCONV=c.id;CPAN.innerHTML='';vistaConv(CPAN,c,()=>{elencoChat();},true);}
// vista di una conversazione, usata dal pannello e dalla pagina Chat
function vistaConv(el,c,indietro,pan){const me=CTX.user.id;const memb=PART.filter(p=>p.conv_id===c.id).map(p=>p.user_id);const altro=c.tipo==='privata'?memb.find(u=>u!==me):null;
  const top=h('<div class="panh cvh"><button type="button" class="bk9" aria-label="Indietro">‹</button>'+(altro?avatar(altro):'<span class="av9 grp" style="--c:'+coloreDi(c.id)+'">'+esc(titoloConv(c).replace(/^Gruppo\s+/,'').charAt(0).toUpperCase())+'</span>')+'<span class="cvt"><b>'+esc(titoloConv(c))+'</b><em>'+esc(c.tipo==='privata'?'Conversazione privata':memb.length+' persone')+'</em></span>'+(pan?'<button type="button" class="x9" aria-label="Chiudi">×</button>':'')+'</div>');
  top.querySelector('.bk9').addEventListener('click',indietro);if(pan)top.querySelector('.x9').addEventListener('click',()=>chiudiPannelli());el.appendChild(top);
  const box=h('<div class="chatbox9"></div>');el.appendChild(box);
  const draw=()=>{box.innerHTML='';let prima=null;(MSG[c.id]||[]).forEach(m=>{const mio=m.da===me;const t=esc(m.testo||'').replace(/@([A-Za-zÀ-ÿ'’]+(?: [A-Za-zÀ-ÿ'’]+)?)/g,'<b class="men">@$1</b>');const cont=prima===m.da;prima=m.da;
      const w=h('<div class="m9'+(mio?' mio':'')+(cont?' cont':'')+'">'+(mio?'':(cont?'<span class="avsp"></span>':avatar(m.da,'sm')))+'<div class="bub">'+(mio||cont||c.tipo==='privata'?'':'<span class="mda" style="color:'+coloreDi(m.da)+'">'+esc(nome(m.da))+'</span>')+(t?'<span class="mtx">'+t.replace(/\n/g,'<br>')+'</span>':'')+'<em>'+new Date(m.quando).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+'</em></div></div>');
      const bub=w.querySelector('.bub');const em=bub.querySelector('em');
      if(m.allegato&&m.allegato.path){if(/\.(png|jpe?g|gif|webp|heic)$/i.test(m.allegato.nome||'')){const im=h('<img class="mimg" alt="'+esc(m.allegato.nome)+'">');firmata(m.allegato).then(u=>{if(u)im.src=u;});im.addEventListener('click',()=>apriFile(m.allegato));bub.insertBefore(im,em);}else bub.insertBefore(fileBtn(m.allegato),em);}
      if(m.collegamento&&m.collegamento.go){const l=h('<button type="button" class="lnk2">'+esc(m.collegamento.titolo||'Apri')+'</button>');l.addEventListener('click',()=>{chiudiPannelli();go(m.collegamento.go);});bub.insertBefore(l,em);}
      if(mio){const x=h('<button type="button" class="mdel" aria-label="Elimina il messaggio">×</button>');x.addEventListener('click',()=>ask('Eliminare il messaggio?','Elimina',async()=>{await CTX.sb.from('messaggi').delete().eq('id',m.id);MSG[c.id]=MSG[c.id].filter(z=>z.id!==m.id);draw();}));bub.appendChild(x);}
      box.appendChild(w);});if(!(MSG[c.id]||[]).length)box.appendChild(h('<p class="muted nvuoto">Scrivi il primo messaggio.</p>'));box.scrollTop=box.scrollHeight;};
  draw();if(pan)CPANDRAW=draw;else{CHATDRAW=draw;CHATOPEN=c.id;}
  const comp=h('<div class="comp9"><div class="mentions" hidden></div><div class="collega" hidden></div><span class="muted small cinfo"></span><div class="crow"><label class="ib9" aria-label="Allega un file" title="Allega"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/></svg><input type="file" hidden></label>'+(memb.length>2?'<button type="button" class="ib9 at" aria-label="Menziona qualcuno">@</button>':'')+'<button type="button" class="ib9 lk" aria-label="Collega un compito, una richiesta, un evento" title="Collega"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg></button><textarea rows="1" placeholder="Scrivi un messaggio…" aria-label="Messaggio"></textarea><button type="button" class="snd9" aria-label="Invia"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></div></div>');el.appendChild(comp);
  const ta=comp.querySelector('textarea');ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=Math.min(120,ta.scrollHeight)+'px';});
  let file=null,coll=null;const menz=new Set();const info=comp.querySelector('.cinfo');const upd=()=>{info.textContent=[file?'Allegato: '+file.name:'',coll?'Collegato a: '+coll.titolo:''].filter(Boolean).join(' · ');};
  comp.querySelector('input[type=file]').addEventListener('change',e=>{file=e.target.files[0]||null;upd();});
  const mn=comp.querySelector('.mentions');const at=comp.querySelector('.at');if(at)at.addEventListener('click',()=>{mn.hidden=!mn.hidden;mn.innerHTML='';memb.filter(u=>u!==me).forEach(u=>{const bb=h('<button type="button" class="chip2 chipav">'+avatar(u,'xs')+esc(nome(u))+'</button>');bb.addEventListener('click',()=>{ta.value+=(ta.value&&!ta.value.endsWith(' ')?' ':'')+'@'+nome(u)+' ';menz.add(u);mn.hidden=true;ta.focus();});mn.appendChild(bb);});});
  const cl=comp.querySelector('.collega');comp.querySelector('.lk').addEventListener('click',()=>{cl.hidden=!cl.hidden;cl.innerHTML='';const op=[].concat(COMP.filter(x=>!x.fatto&&(x.per===me||x.da===me)).map(x=>({titolo:'Compito: '+x.titolo,go:'p-me'})),RICH.filter(x=>x.stato!=='fatta').map(x=>({titolo:'Richiesta: '+x.titolo,go:'p-req'})),(canV('s-ev')&&typeof allEv==='function'?allEv():[]).slice(0,30).map(x=>({titolo:'Evento: '+x.n,go:'p-cal'})),vperc().map(x=>({titolo:'Percorso: '+x.dati.nome,go:x.dati.stato==='Pubblicato'?'p-pub':'v-perc'})));
    op.slice(0,60).forEach(o=>{const bb=h('<button type="button" class="chip2">'+esc(o.titolo)+'</button>');bb.addEventListener('click',()=>{coll=o;cl.hidden=true;upd();});cl.appendChild(bb);});if(!op.length)cl.appendChild(h('<span class="muted small">Niente da collegare.</span>'));});
  const invia=async()=>{const t=ta.value.trim();if(!t&&!file)return;const sb=comp.querySelector('.snd9');sb.disabled=true;
    try{const al=file?await carica(file,'chat/'+me):null;memb.forEach(u=>{if(u!==me&&t.includes('@'+nome(u)))menz.add(u);});
      const {data,error}=await CTX.sb.from('messaggi').insert({conv_id:c.id,testo:t||null,allegato:al,collegamento:coll,menzioni:[...menz]}).select().single();if(error)throw new Error(error.message);
      (MSG[c.id]=MSG[c.id]||[]).push(data);c.ultimo=data.quando;ta.value='';ta.style.height='auto';file=null;coll=null;menz.clear();upd();draw();}catch(e){stEl.textContent=e.message;}sb.disabled=false;ta.focus();};
  comp.querySelector('.snd9').addEventListener('click',invia);
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&window.matchMedia('(min-width:1024px)').matches){e.preventDefault();invia();}});
  segnaLetta(c.id);}
let CPANDRAW=null;
apriConv=async function(el,c){vistaConv(el,c,()=>{CHATSEL=null;renderChat();},false);};
function chatLive(m,nuova){if(CPAN&&!CPAN.hidden){if(CPANCONV===m.conv_id&&CPANDRAW){CPANDRAW();segnaLetta(m.conv_id);}else if(!CPANCONV)elencoChat();}fabBadge();}

/* --- apertura dai collegamenti e dalle notifiche: chat e bacheca senza cambiare pagina --- */
let BACHSEL=null;
const _go9=go;go=function(id){if(id==='p-chat'||(id&&id.startsWith('p-chat#'))){apriChat(id.startsWith('p-chat#')?id.slice(7):null);return;}
  if(id&&id.startsWith('p-bach#')){BACHSEL=id.slice(7);chiudiPannelli();_go9('p-bach');return;}chiudiPannelli();_go9(id);};
const _canOpen9=canOpen;canOpen=function(id){return _canOpen9(String(id||'').split('#')[0]);};
async function segnaDaNotifica(nid){if(!nid)return;const n=NOTI.find(x=>String(x.id)===String(nid));if(n)n.letto=true;await CTX.sb.from('notifiche').update({letto:true}).eq('id',+nid).eq('per',CTX.user.id);refreshBell();}

/* --- 29 e 37. bacheca nella Home e aperta a tutti --- */
const testoBreve=a=>{const t=(a.testo||'').replace(/\s+/g,' ').trim();return t.length>180?t.slice(0,180)+'…':t;};
const ordBach=()=>AVV.slice().sort((a,b)=>(b.fissato-a.fissato)||String(b.quando).localeCompare(String(a.quando)));
function postHtml(a,breve){const nuovo=!letto(a);
  return '<article class="post9'+(a.fissato?' fis':'')+(a.importante?' imp':'')+'" style="--c:'+coloreDi(a.autore)+'" data-id="'+a.id+'"><div class="ph">'+avatar(a.autore)+'<span class="pa"><b>'+esc(nome(a.autore))+'</b><em>'+quando9(a.quando)+(a.modificato?' · modificato':'')+'</em></span><span class="chips">'+(a.fissato?'<span class="chip2">In evidenza</span>':'')+(a.ufficiale?'<span class="chip2 uff">'+esc(a.tipo&&a.tipo!=='Avviso'?a.tipo:'Ufficiale')+'</span>':'')+(a.importante?'<span class="chip2 ko">Importante</span>':'')+(nuovo?'<span class="chip2 nw">Nuovo</span>':'')+'</span></div>'+
    (a.titolo?'<b class="pt">'+esc(a.titolo)+'</b>':'')+(a.testo?'<p class="px9'+(breve?' clamp':'')+'">'+(breve?esc(testoBreve(a)):esc(a.testo).replace(/\n/g,'<br>'))+'</p>':'')+
    ((a.allegati||[]).length&&breve?'<span class="muted small">📎 '+a.allegati.length+(a.allegati.length===1?' allegato':' allegati')+'</span>':'')+(a.collegamento&&a.collegamento.titolo?'<span class="plink">'+esc(a.collegamento.titolo)+'</span>':'')+'</article>';}
async function segnaLettoAuto(L){const me=CTX.user.id;const auto=L.filter(a=>!a.conferma&&!letto(a));if(!auto.length)return;auto.forEach(a=>LET.push({avviso_id:a.id,user_id:me}));try{await CTX.sb.from('letture').upsert(auto.map(a=>({avviso_id:a.id,user_id:me})),{onConflict:'avviso_id,user_id',ignoreDuplicates:true});}catch(e){}}
function apriPost(a){const me=CTX.user.id;const mio=a.autore===me;
  const dl=sheet(a.titolo||('Messaggio di '+nome(a.autore)),postHtml(a,false)+'<div class="pfiles"></div><div class="pbtn"></div>','Chiudi',async()=>{});
  const fz=dl.querySelector('.pfiles');(a.allegati||[]).forEach(f=>fz.appendChild(fileBtn(f)));
  if(a.collegamento&&a.collegamento.go){const l=h('<button type="button" class="lnk2">Apri: '+esc(a.collegamento.titolo||'')+'</button>');l.addEventListener('click',()=>{dl.remove();go(a.collegamento.go);});fz.appendChild(l);}
  const bx=dl.querySelector('.pbtn');
  if(a.conferma&&!letto(a)){const b=h('<button type="button" class="bb dark">Ho letto</button>');b.addEventListener('click',async()=>{await CTX.sb.from('letture').insert({avviso_id:a.id});LET.push({avviso_id:a.id,user_id:me});dl.remove();rerender();});bx.appendChild(b);}
  else if(!letto(a)){segnaLettoAuto([a]).then(()=>{if(cur==='p-home'||cur==='p-bach')rerender();});}
  const row=h('<div class="rowb"></div>');
  if(mio){const b=h('<button type="button">Modifica</button>');b.addEventListener('click',()=>{dl.remove();scriviPost(a);});row.appendChild(b);}
  if(mio||CTX.admin){const b=h('<button type="button">Chi ha letto</button>');b.addEventListener('click',async()=>{const {data,error}=await CTX.sb.rpc('destinatari_avviso',{aid:a.id});const L1=data||[];const si=L1.filter(x=>x.letto),no=L1.filter(x=>!x.letto);
      sheet('Chi ha letto',error?'<p>'+esc(error.message)+'</p>':'<div class="lab">Hanno letto · '+si.length+'</div>'+(si.map(x=>'<div class="lrow">'+avatar(x.user_id,'sm')+esc(x.nome)+' <span class="muted small">'+new Date(x.letto).toLocaleDateString('it-IT')+'</span></div>').join('')||'<p class="muted">Nessuno</p>')+'<div class="lab">Non ancora · '+no.length+'</div>'+(no.map(x=>'<div class="lrow">'+avatar(x.user_id,'sm')+esc(x.nome)+'</div>').join('')||'<p class="muted">Nessuno</p>'),'Chiudi',async()=>{});});row.appendChild(b);}
  if(isPres()){const b=h('<button type="button">'+(a.fissato?'Togli dall’evidenza':'Metti in evidenza')+'</button>');b.addEventListener('click',async()=>{await CTX.sb.from('avvisi').update({fissato:!a.fissato}).eq('id',a.id);await loadBach();dl.remove();rerender();});row.appendChild(b);}
  if(mio||CTX.admin){const b=h('<button type="button" class="ko">Elimina</button>');b.addEventListener('click',()=>ask('Eliminare questo messaggio dalla bacheca?','Elimina',async()=>{await CTX.sb.from('avvisi').delete().eq('id',a.id);await loadBach();dl.remove();rerender();}));row.appendChild(b);}
  if(row.children.length)bx.appendChild(row);}
function scriviPost(a){const me=CTX.user.id;const pres=isPres();const ppl=Object.values(PEOPLE).filter(p=>p.id!==me&&p.attivo!==false);const ed=!!a;const d0=a||{tutti:true};
  const v0=d0.tutti?'tutti':(d0.aree||[]).length?'aree':'persone';
  const ops=[].concat((canV('s-ev')&&typeof allEv==='function'?allEv():[]).slice(0,40).map(x=>({titolo:'Evento: '+x.n,go:'p-cal'})),COMP.filter(x=>!x.fatto&&(x.per===me||x.da===me)).map(x=>({titolo:'Compito: '+x.titolo,go:'p-me'})),RICH.filter(x=>x.stato!=='fatta').map(x=>({titolo:'Richiesta: '+x.titolo,go:'p-req'})));
  const dl=sheet(ed?'Modifica il messaggio':'Scrivi un aggiornamento',(pres?'<div class="ctl"><label for="av_k">Tipo</label><select id="av_k">'+['Aggiornamento'].concat(TIPI_AVV).map(t=>'<option'+(t===(d0.tipo||'Aggiornamento')?' selected':'')+'>'+t+'</option>').join('')+'</select></div>':'')+
    '<div class="ctl"><label for="av_t">Titolo (se serve)</label><input type="text" id="av_t" value="'+esc(d0.titolo||'')+'"></div><div class="ctl"><label for="av_x">Messaggio</label><textarea id="av_x" style="min-height:130px">'+esc(d0.testo||'')+'</textarea></div>'+
    (ed?'':'<div class="ctl"><label for="av_f">Allegato</label><input type="file" id="av_f"></div><div class="ctl"><label for="av_l">Collega a</label><select id="av_l"><option value="">Niente</option>'+ops.map((o,i)=>'<option value="'+i+'">'+esc(o.titolo)+'</option>').join('')+'</select></div>'+
    '<div class="lab">Chi lo vede</div><div class="seg wrap" id="av_d"><button type="button" data-v="tutti" aria-pressed="'+(v0==='tutti')+'">Tutti</button><button type="button" data-v="aree" aria-pressed="'+(v0==='aree')+'">Alcune aree</button><button type="button" data-v="persone" aria-pressed="'+(v0==='persone')+'">Alcune persone</button></div><div class="checks" id="av_a" hidden>'+SEZ.map(s=>'<label><input type="checkbox" value="'+s.k+'"> '+esc(s.n)+'</label>').join('')+'</div><div class="checks" id="av_p" hidden>'+ppl.map(p=>'<label class="pck"><input type="checkbox" value="'+p.id+'"> '+avatar(p.id,'xs')+esc(p.nome||p.email)+'</label>').join('')+'</div>'+
    '<details class="mz"><summary>Avvisa qualcuno in particolare</summary><div class="checks" id="av_m">'+ppl.map(p=>'<label class="pck"><input type="checkbox" value="'+p.id+'"> '+avatar(p.id,'xs')+esc(p.nome||p.email)+'</label>').join('')+'</div><p class="muted small">Le persone scelte ricevono una notifica.</p></details>')+
    '<label class="ck"><input type="checkbox" id="av_im"'+(d0.importante?' checked':'')+'> Importante (avvisa tutti subito)</label>'+(pres?'<label class="ck"><input type="checkbox" id="av_fi"'+(d0.fissato?' checked':'')+'> Metti in evidenza (in alto)</label>'+(ed?'':'<label class="ck"><input type="checkbox" id="av_cf"> Chiedi la conferma di lettura</label>'):''),ed?'Salva':'Pubblica',async(x)=>{
    const t=x.querySelector('#av_t').value.trim(),tx=x.querySelector('#av_x').value.trim();if(!t&&!tx){x.querySelector('.smsg').textContent='Scrivi il messaggio.';return false;}
    const o={titolo:t||null,testo:tx||null,importante:x.querySelector('#av_im').checked};if(pres){o.tipo=x.querySelector('#av_k').value;o.fissato=x.querySelector('#av_fi').checked;}else if(!ed)o.tipo='Aggiornamento';
    if(ed){const {error}=await CTX.sb.from('avvisi').update(o).eq('id',a.id);if(error)throw new Error(error.message);}
    else{const v=x.querySelector('#av_d [aria-pressed="true"]').dataset.v;o.tutti=v==='tutti';o.aree=v==='aree'?[...x.querySelectorAll('#av_a input:checked')].map(i=>i.value):[];o.utenti=v==='persone'?[...x.querySelectorAll('#av_p input:checked')].map(i=>i.value):[];
      if(!o.tutti&&!o.aree.length&&!o.utenti.length){x.querySelector('.smsg').textContent='Scegli chi lo vede.';return false;}
      o.menzioni=[...x.querySelectorAll('#av_m input:checked')].map(i=>i.value);const li=x.querySelector('#av_l').value;o.collegamento=li!==''?ops[+li]:null;o.conferma=!!(pres&&x.querySelector('#av_cf').checked);
      const f=x.querySelector('#av_f').files[0];o.allegati=f?[await carica(f,'bacheca/'+me)]:[];
      const {error}=await CTX.sb.from('avvisi').insert(o);if(error)throw new Error(error.message);}
    await loadBach();rerender();stEl.textContent=ed?'Messaggio aggiornato.':'Pubblicato in bacheca.';});
  if(!ed)dl.querySelectorAll('#av_d button').forEach(b=>b.addEventListener('click',()=>{dl.querySelectorAll('#av_d button').forEach(z=>z.setAttribute('aria-pressed',String(z===b)));dl.querySelector('#av_a').hidden=b.dataset.v!=='aree';dl.querySelector('#av_p').hidden=b.dataset.v!=='persone';}));}
nuovoAvviso=()=>scriviPost(null);
renderBach=async function(){const el=document.getElementById('p-bach');el.innerHTML='';
  el.appendChild(h('<div class="sh"><span class="eyb">Comunicazione</span><h2>Bacheca</h2><p>Gli aggiornamenti di tutti, le comunicazioni del Presidente, le convocazioni e le scadenze.</p></div>'));
  el.appendChild(addBtn('+ Scrivi un aggiornamento',()=>scriviPost(null)));
  const L=ordBach();const g=h('<div class="bach9"></div>');L.forEach(a=>{const p=h(postHtml(a,true));p.addEventListener('click',()=>apriPost(a));g.appendChild(p);});el.appendChild(g);
  if(!L.length)el.appendChild(h('<div class="card soon"><p>Nessun messaggio in bacheca. Scrivi il primo!</p></div>'));
  if(BACHSEL){const a=AVV.find(x=>x.id===BACHSEL);BACHSEL=null;if(a)setTimeout(()=>{const n=g.querySelector('[data-id="'+a.id+'"]');if(n)n.scrollIntoView({block:'center'});apriPost(a);},50);}};
R['p-bach']=renderBach;
function bachHome(){const L=ordBach();const nuovi=L.filter(a=>!letto(a)).length;
  const w=h('<section class="w wide bachw"><div class="wh"><b>Bacheca</b>'+(nuovi?'<span class="chip2 nw">'+nuovi+(nuovi===1?' nuovo':' nuovi')+'</span>':'')+'<button type="button" class="lnk2" data-go="p-bach">Tutta la bacheca</button></div><button type="button" class="scrivi9">'+avatar(CTX.user.id,'sm')+'<span>Scrivi un aggiornamento…</span></button><div class="bachl"></div></section>');
  w.querySelector('.scrivi9').addEventListener('click',()=>scriviPost(null));
  const box=w.querySelector('.bachl');L.slice(0,4).forEach(a=>{const p=h(postHtml(a,true));p.addEventListener('click',()=>apriPost(a));box.appendChild(p);});
  if(!L.length)box.appendChild(h('<p class="muted">Ancora nessun messaggio.</p>'));
  if(L.length>4)box.appendChild(h('<button type="button" class="lnk2" data-go="p-bach">Altri '+(L.length-4)+' messaggi</button>'));return w;}
extraHome=function(g){const w=bachHome();const ref=g.children[window.matchMedia('(min-width:1024px)').matches?3:2]||null;g.insertBefore(w,ref);
  if(respPag()===CTX.user.id||canV('v-pag')){const X=righeRate();const dc=X.filter(x=>statoRata(x.p)[0]==='In attesa di conferma').length,sc=X.filter(x=>['In scadenza','In ritardo'].includes(statoRata(x.p)[0]));
    if(dc||sc.length)g.appendChild(h('<section class="w"><div class="wh"><b>Pagamenti ai fornitori</b><button type="button" class="lnk2" data-go="v-pag">Apri</button></div>'+(dc?'<p style="margin:0"><b>'+dc+' da confermare</b></p>':'')+(sc.length?'<p style="margin:0">'+sc.length+' in scadenza o in ritardo · '+eur(sc.reduce((a,x)=>a+(+x.p.importo||0),0))+'</p>':'')+'</section>'));}
  chatBadge();};

/* --- avvio: campanella, pulsante della chat, foto in alto, apertura dalle notifiche --- */
const _dopoAvvio9=dopoAvvio;dopoAvvio=function(){let nid=null;try{nid=new URLSearchParams(location.search).get('n');}catch(e){}
  _dopoAvvio9();
  const b=document.getElementById('bell');if(b){const nb=b.cloneNode(true);b.replaceWith(nb);nb.setAttribute('aria-label','Notifiche');nb.addEventListener('click',e=>{e.stopPropagation();apriNoti();});}
  creaFab();aggiornaAvt();refreshBell();if(nid)segnaDaNotifica(nid);
  if(SW_OK)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.nid)segnaDaNotifica(e.data.nid);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')chiudiPannelli();});
  document.addEventListener('click',e=>{if(!NPAN||NPAN.hidden)return;if(!e.target.isConnected||NPAN.contains(e.target)||e.target.closest('#bell')||e.target.closest('.sdlg'))return;chiudiPannelli();});};
