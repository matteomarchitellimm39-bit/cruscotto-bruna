/* ================= Bruna27 · Fase 5: foto delle fatture lette dall'assistente, preventivi dagli eventi, ricadute dei percorsi ================= */
/* --- foto e scansioni lette dall'assistente --- */
async function immagineRidotta(file,isPdf){let blob=file;if(isPdf){const o=await pdfImmagine(file);blob=o.blob;}
  const bm=await createImageBitmap(blob);const k=Math.min(1,1600/Math.max(bm.width,bm.height));const cv=document.createElement('canvas');cv.width=Math.round(bm.width*k);cv.height=Math.round(bm.height*k);
  const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(bm,0,0,cv.width,cv.height);return cv.toDataURL('image/jpeg',0.85).split(',')[1];}
async function leggiConAI(file,isPdf){try{const img=await immagineRidotta(file,isPdf);const r=await ai('fattura',{img});if(r.err||!r.testo)return null;
    const m=r.testo.match(/\{[\s\S]*\}/);if(!m)return null;const j=JSON.parse(m[0]);const o={__come:'ai'};
    ['soggetto','numero','data','scadenza','nota'].forEach(k=>{if(j[k])o[k]=String(j[k]).slice(0,200);});
    if(j.importo!=null&&j.importo!==''){const v=typeof j.importo==='number'?j.importo:numIt(j.importo);if(v)o.importo=Math.round(v*100)/100;}
    o.tipo=j.tipo==='Ricavo'?'Ricavo':'Costo';['data','scadenza'].forEach(k=>{if(o[k]&&!/^\d{4}-\d{2}-\d{2}$/.test(o[k])){const d=o[k].match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);o[k]=d?isoD(d[1],d[2],d[3]):'';}});
    o.voce=bilDaNome(o.soggetto||'');return o;}catch(e){return null;}}

/* --- quando si crea un evento: chiedi se servono fornitori --- */
const EVK=new Set();function evNoti(){(S.evc||[]).forEach(e=>EVK.add(e.id));}
const _changed=changed;
changed=function(){const nuovi=(S.evc||[]).filter(e=>!EVK.has(e.id));_changed();evNoti();if(nuovi.length&&CTX.canEdit('s-ev'))setTimeout(()=>chiediFornEvento(nuovi[nuovi.length-1]),300);};
const _rerender=rerender;rerender=function(){_rerender();if(!document.querySelector('.sdlg'))evNoti();};
function chiediFornEvento(e){const ppl=Object.values(PEOPLE);
  sheet('Servono fornitori per «'+(e.n||'il nuovo evento')+'»?','<p style="font-size:17px">Se servono, creo le richieste di preventivo nei Preventivi e avviso chi deve chiederli.</p><div class="checks fe">'+FORN_COSA.concat(['Allestimento','Service luci e audio','SIAE e permessi']).map(x=>'<label><input type="checkbox" value="'+esc(x)+'"> '+esc(x)+'</label>').join('')+'</div><div class="ctl"><label for="fe_p">Chi chiede i preventivi</label><select id="fe_p">'+ppl.map(p=>'<option value="'+p.id+'"'+(p.id===CTX.user.id?' selected':'')+'>'+esc(p.nome||p.email)+(p.id===CTX.user.id?' (io)':'')+'</option>').join('')+'</select></div>','Crea le richieste',async(dl)=>{
    const cosa=[...dl.querySelectorAll('.fe input:checked')].map(x=>x.value);if(!cosa.length){return;}const chi=dl.querySelector('#fe_p').value;
    const {error}=await CTX.sb.from('voci_dati').insert(cosa.map(c=>({voce:'v-prev',dati:{voce:'Evento '+(e.n||'')+' – '+c,fornitore:'',importo:'',stato:'Da chiedere',chi,entro:''}})));if(error)throw new Error(error.message);
    await CTX.sb.from('compiti').insert({per:chi,titolo:'Chiedi i preventivi per «'+(e.n||'evento')+'»: '+cosa.join(', ')});
    await Promise.all([loadVD(),loadSocial()]);stEl.textContent='Create '+cosa.length+' richieste di preventivo.';});
  const ok=document.querySelectorAll('.sdlg');const last=ok[ok.length-1];if(last)last.querySelector('[data-no]').textContent='No, non servono';}

/* --- ricadute economiche del percorso (Simulazione impatto) --- */
function luogoVicino(P){const T=P.tappe||[];if(!T.length||typeof VEN==='undefined')return 'vv';let best=VEN[0],bd=1e9;T.forEach(t=>VEN.forEach(v=>{const d=distM({lat:v[2],lng:v[3]},t);if(d<bd){bd=d;best=v;}}));return best[0];}
function ricaduteBox(el,r,P,can){if(!canV('s-cs')||typeof evCalc!=='function')return;const e=P.sim_id&&(S.cs&&S.cs.evs||[]).find(x=>x.id===P.sim_id);
  if(e){let x=null;try{x=evCalc(e,1);}catch(err){}if(!x)return;
    const c=h('<section class="card"><h3>Ricadute economiche stimate</h3><div class="fact2"><span>Persone al corteo</span><b>'+nf.format(e.p)+'</b></div><div class="fact2"><span>Spesa diretta sul territorio</span><b>'+eur(x.dir||0)+'</b></div><div class="fact2"><span>Ricchezza prodotta (PIL)</span><b>'+eur(x.pil||0)+'</b></div><div class="fact2"><span>Lavoro generato</span><b>'+(Math.round((x.ula||0)*10)/10).toString().replace('.',',')+' persone a tempo pieno per un anno</b></div><p class="muted small">Calcolo della Simulazione impatto (Centro Studi), stima centrale. Per cambiare le ipotesi aprila.</p><button type="button" class="lnk2" data-go="s-cs">Apri la Simulazione impatto</button></section>');el.appendChild(c);return;}
  if(!can||!CTX.canEdit('s-cs'))return;
  const b=h('<section class="card"><h3>Ricadute economiche</h3><p class="muted">Stima quanto porta il percorso a bar, ristoranti e negozi, e quanta ricchezza e lavoro crea.</p><button type="button" class="bb dark sm">Calcola le ricadute</button></section>');
  b.querySelector('button').addEventListener('click',()=>sheet('Calcola le ricadute','<div class="ctl"><label for="rc_p">Quante persone seguono o guardano il corteo</label><input type="number" id="rc_p" inputmode="numeric" value="3000"></div><div class="ctl"><label for="rc_a">Età prevalente</label><select id="rc_a">'+AGE.map((a,i)=>'<option value="'+i+'"'+(i===(P.fragili?4:2)?' selected':'')+'>'+esc(a[0])+'</option>').join('')+'</select></div>','Calcola',async(dl)=>{
    const ev=Object.assign(newEv(),{id:'e'+Date.now(),n:'Percorso '+P.nome,v:luogoVicino(P),d:P.data||'2027-07-02',du:'ore',dn:Math.max(1,Math.round(durata(P)/60)),t:'religioso',a:+dl.querySelector('#rc_a').value,p:Math.max(1,+dl.querySelector('#rc_p').value||0),c:prevPerc(P).filter(x=>x.dati.stato==='Accettato').reduce((a,x)=>a+(+x.dati.importo||0),0)});
    S.cs.evs=S.cs.evs||[];S.cs.evs.push(ev);P.sim_id=ev.id;await salvaP(r);_changed();}));
  el.appendChild(b);}
