/* ================= Bruna27 · Fase D: edizione e bilancio collegato, compilazione assistita, suggerimenti ================= */
// --- bilanci per anno: 2026 e 2027 ci sono; gli anni dopo compaiono quando l'amministratore li crea ---
function anniBilancio(){const fut=(IMP.anni_bilancio||[]).map(Number).filter(y=>y>2027).sort();return [[2026,'2026 · Bilancio 2026'],[2027,'2027 · Bilancio di previsione 2027']].concat(fut.map(y=>[y,y+' · Bilancio '+y]));}
function nomeBilancio(y){y=+y;return y===2026?'Bilancio 2026':y===2027?'Bilancio di previsione 2027':y?'Bilancio '+y:'bilancio';}
// gli eventi della base sono tutti dell'edizione 2027; quelli creati prima senza anno pure
const annoEv=e=>{const s=evRaw(e);return +(s.anno||e.anno||2027);};
// nel Bilancio di previsione 2027 entrano solo gli eventi dell'edizione 2027 (niente doppioni)
customCost=function(p){return (S.evc||[]).filter(e=>e.p===p&&e.inPrev&&+(e.anno||2027)===2027).reduce((a,e)=>a+(Number(e.costo)||0),0);};
const ricEv=e=>{if(e.custom)return Number(evRaw(e).ricavi)||0;const v=VOCI[e.vo];return v&&v.ric?Number(v.ric)||0:0;};
inBilancio=function(e,on){if(e.custom){S.evc=S.evc.map(c=>c.id===e.id?Object.assign({},c,{inPrev:on}):c);}else{const v=vocEv(e);if(v)setVo(v.id,'on',on);}changed();
  stEl.textContent=on?'«'+e.n+'» ora conta nel '+nomeBilancio(annoEv(e))+'.':'«'+e.n+'» non conta più nel '+nomeBilancio(annoEv(e))+'.';};
function cambiaEdizione(e){const y0=annoEv(e);sheet('Edizione di «'+e.n+'»','<div class="ctl"><label for="ce_y">A quale edizione appartiene</label><select id="ce_y">'+anniBilancio().map(([y,l])=>'<option value="'+y+'"'+(y===y0?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select></div>'+
  '<div class="ev14crit"><b>Attenzione</b><span>Cambiare edizione cambia il bilancio collegato: i costi e i ricavi previsti di questo evento passano al bilancio del nuovo anno. Fatture già emesse, pagamenti fatti e contratti firmati non si spostano da soli: vanno controllati in Economia.</span></div>','Sposta',async(x)=>{
  const y=+x.querySelector('#ce_y').value;if(y===y0)return;if(!CTX.canEdit('s-ev')||(evOn(e)&&!CTX.canEdit('s-pre')&&!e.custom)){x.querySelector('.smsg').textContent='Non hai il permesso per spostare l’evento di bilancio.';return false;}
  const st=(evRaw(e).anno_storico||[]).concat([{da:y0,a:y,chi:CTX.user.id,quando:new Date().toISOString()}]);setStato(e,{anno:y,anno_storico:st});changed();stEl.textContent='«'+e.n+'» ora è collegato al '+nomeBilancio(y)+'.';});}
function boxBilancio(e){const y=annoEv(e);const on=evOn(e);const c=on?evCost(e):0,r=on?ricEv(e):0;const ris=r-c;
  const b=h('<section class="ev17bil"><div class="ev17bh"><span class="eyb">Edizione '+y+'</span><b>Bilancio collegato: '+esc(nomeBilancio(y))+'</b></div>'+
    (on?righe([['Costi previsti',eur(c)],['Ricavi previsti',r?eur(r):'nessuno registrato'],['Risultato previsto','<b class="'+(ris<0?'neg':'pos')+'">'+(ris<0?'− ':'+ ')+eur(Math.abs(ris))+'</b>']]):'<p class="muted small" style="margin:0">Questo evento non conta nel bilancio: i suoi importi non entrano nei totali.</p>')+
    (y!==2027&&on?'<p class="muted small" style="margin:4px 0 0">'+(y===2026?'Il Bilancio 2026 è quello consuntivo: gli importi di questo evento restano registrati qui sulla scheda.':'Il '+esc(nomeBilancio(y))+' è appena stato aperto: gli importi restano registrati qui sulla scheda.')+'</p>':'')+
    '<p class="muted small" style="margin:4px 0 0">Preventivi, fatture e pagamenti si gestiscono in Economia: qui c’è solo il riassunto, senza doppioni.</p></section>');
  if(e.custom&&CTX.canEdit('s-ev')){const k=h('<button type="button" class="lnk2">Cambia edizione ›</button>');k.addEventListener('click',()=>cambiaEdizione(e));b.appendChild(k);}
  if((evRaw(e).anno_storico||[]).length)b.appendChild(h('<details class="storico2"><summary>Spostamenti di edizione · '+evRaw(e).anno_storico.length+'</summary>'+evRaw(e).anno_storico.map(s=>'<div class="sti">Da '+s.da+' a '+s.a+' · <span class="muted">'+esc(nome(s.chi))+', '+new Date(s.quando).toLocaleDateString('it-IT')+'</span></div>').join('')+'</details>'));
  return b;}
// --- suggerimenti semplici al momento giusto (regole, non stime dell'AI) ---
function suggerimenti(e){const out=[];const s=evRaw(e);const a=evAppr(e),pr=evProg(e);const can=CTX.canEdit('s-ev');const ultimo=(evDays(e)||[]).slice(-1)[0]||'9';
  if(CTX.admin&&a==='da_confermare'&&s.esig)out.push(['La scheda è completa: serve la tua approvazione.','Approva evento',()=>approva15(e)]);
  if(CTX.admin&&a==='approvato')out.push(['L’evento è approvato ma non è ancora pubblicato.','Pubblica',()=>pubblica(e)]);
  const forn=s.esig&&s.esig.eco&&s.esig.eco.serve?(s.esig.eco.forn||[]):[];
  if(forn.length&&pr==='attivo'&&!COMP.some(c=>c.evento_id===String(e.id)&&/Richiesta di preventivi/.test(c.titolo)&&c.fatto))out.push(['Mancano i preventivi per: '+forn.join(', ')+'. Vuoi chiederli?','Richiedi preventivo',()=>cosaServe(e)]);
  if(!evResp(e)&&pr==='attivo'&&can)out.push(['Manca il responsabile dell’evento. Vuoi sceglierlo?','Scegli il responsabile',()=>schedaEvento(e)]);
  const da=typeof lavEv==='function'?lavEv(e).filter(c=>c.stato==='da_assegnare').length:0;if(da&&gestore(e))out.push([da+(da===1?' attività non ha':' attività non hanno')+' ancora una persona.','Assegna',()=>{const x=document.querySelector('#sec-evt .ev16');if(x)x.scrollIntoView({behavior:'smooth',block:'start'});}]);
  if(ultimo<todayISO()&&pr==='attivo'&&can)out.push(['L’evento è già passato. Vuoi archiviarlo? Resta visibile in grigio.','Archivia',()=>{setStato(e,{prog:'archiviato'});changed();stEl.textContent='Evento archiviato.';}]);
  const av=evAvanz(e);const aperte=av.t-av.f;out.push(['L’evento è collegato al '+nomeBilancio(annoEv(e))+'.'+(av.l&&aperte>0?' Ci sono '+aperte+(aperte===1?' attività ancora da completare.':' attività ancora da completare.'):''),null,null]);
  return out.slice(0,3);}
function boxSuggerimenti(e){const L=suggerimenti(e);const b=h('<section class="ev17sug"><div class="ev17sh"><span class="orb"></span><b>L’assistente suggerisce</b></div></section>');
  L.forEach(([t,l,fn])=>{const r=h('<div class="ev17s"><span>'+esc(t)+'</span></div>');if(l){const k=h('<button type="button" class="bb dark sm">'+esc(l)+'</button>');k.addEventListener('click',fn);r.appendChild(k);}b.appendChild(r);});return b;}
const _az17=azioniEvento;azioniEvento=function(e,box){const det=box&&box.classList&&box.classList.contains('c12det');if(det){box.insertBefore(boxSuggerimenti(e),box.firstChild);}_az17(e,box);if(det){const lav=box.querySelector('.ev16')||box.querySelector('.ev15prep');const bb=boxBilancio(e);const av=box.querySelector('.ev14av');if(av)av.after(bb);else box.appendChild(bb);}
  const fl=box&&box.querySelector&&box.querySelector('.ev13flag');if(fl){const t=fl.lastChild;if(t&&t.nodeType===3)t.textContent=' Incide sul '+nomeBilancio(annoEv(e));}};
// --- Impostazioni: aprire il bilancio di un anno successivo ---
const _imp17=impostazioniCard;impostazioniCard=function(){const c=_imp17();const fut=(IMP.anni_bilancio||[]).map(Number).filter(y=>y>2027).sort();const prossimo=Math.max(2027,...fut)+1;
  const b=h('<section class="card"><h3>Bilanci degli anni successivi</h3><p class="muted small">Ci sono il Bilancio 2026 e il Bilancio di previsione 2027. Quando apri un nuovo anno, compare tra le edizioni da scegliere quando si crea un evento.</p><p>'+(fut.length?'Già aperti: <b>'+fut.join(', ')+'</b>':'Nessun anno successivo aperto.')+'</p><div class="big-btns"><button type="button" class="bb dark" id="ab_s">Apri il Bilancio '+prossimo+'</button></div><p class="smsg muted small"></p></section>');
  b.querySelector('#ab_s').addEventListener('click',()=>ask('Aprire il Bilancio '+prossimo+'? Da quel momento si possono creare eventi dell’edizione '+prossimo+'.','Apri',async()=>{const v=Object.assign({},IMP,{anni_bilancio:fut.concat([prossimo])});
    const {error}=await CTX.sb.from('impostazioni').upsert({chiave:'generali',valore:v,aggiornato:new Date().toISOString()});if(error){b.querySelector('.smsg').textContent='Errore: '+error.message;return;}IMP=v;rerender();stEl.textContent='Bilancio '+prossimo+' aperto.';}));
  c.appendChild(b);return c;};

// --- Compilazione assistita: scrivi con parole tue, l'assistente propone i campi ---
const MESI17=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const REG17=[[/palco/i,'eco',null,'Palco'],[/audio|amplific|microfon|impianto/i,'eco',null,'Audio'],[/luci|illumin/i,'eco',null,'Luci'],[/transenn/i,'eco',null,'Transenne'],[/allestiment|gazebo|sedie|tavol/i,'eco',null,'Allestimenti'],[/servizi tecnici|tecnic/i,'eco',null,'Servizi tecnici'],
  [/sponsor/i,'eco','Sponsorizzazioni'],[/biglietti|ingresso a pagamento|incass|ricav/i,'eco','Valutazione dei ricavi'],[/fattur/i,'eco','Fatture da emettere'],
  [/invit/i,'org','Inviti'],[/ospit|relator|artist|cantant|banda|coro/i,'org','Contatti con partecipanti e ospiti'],[/comunicazion|manifest|locandin|social|stampa|volantin/i,'org','Comunicazione'],[/material|gadget|stampat/i,'org','Materiali'],[/programma|scaletta/i,'org','Programma operativo'],
  [/sicurezza|vigilanz|ambulanz|soccors|presidi|steward/i,'sic','Verifica delle necessità di sicurezza'],[/percors|processione|corteo|sfilat/i,'sic','Percorso'],[/sopralluog|mappa|planimetr/i,'sic','Mappe e sopralluoghi'],
  [/siae|musica|concert|dj|spettacol/i,'adm','Adempimenti SIAE'],[/suolo pubblico|piazza|strada|via /i,'adm','Pratica SUAP'],[/autorizzazion|permess|comune|questura|prefettura/i,'adm','Autorizzazioni pubbliche']];
function capisci(t){const o={esig:{},forn:[]};const T=' '+t+' ';
  if(/passion/i.test(T))o.p='II';else if(/bruna|processione|religios|messa|madonna/i.test(T))o.p='I';
  const y=T.match(/\b(20(?:2[6-9]|3\d))\b/);if(y)o.anno=+y[1];
  const dm=T.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(20\d\d))?/i);
  const mm=T.match(/\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b(?:\s+(20\d\d))?/i);
  if(dm){const yy=+(dm[3]||o.anno||2027);o.d1=yy+'-'+String(MESI17.indexOf(dm[2].toLowerCase())+1).padStart(2,'0')+'-'+String(dm[1]).padStart(2,'0');}
  else if(mm){o.mese=mm[1].toLowerCase()+' '+(mm[2]||o.anno||'');}
  if(!o.anno&&(o.d1||mm)){const m=o.d1?+o.d1.slice(5,7):MESI17.indexOf(mm[1].toLowerCase())+1;const yy=o.d1?+o.d1.slice(0,4):(mm[2]?+mm[2]:null);if(yy)o.anno=(m>=11?yy+1:yy);}
  else if(o.anno&&o.d1){const m=+o.d1.slice(5,7);if(m>=11)o.anno=+o.d1.slice(0,4)+1;}
  const ora=T.match(/\b(?:alle|ore|dalle)\s+(\d{1,2})(?:[:.](\d{2}))?/i);if(ora)o.oi=String(ora[1]).padStart(2,'0')+':'+(ora[2]||'00');
  const lu=T.match(/\b(?:in|presso|al|alla|nel|nella|nei|davanti al|davanti alla)\s+((?:piazza|via|largo|chiesa|cattedrale|duomo|auditorium|teatro|sasso|sassi|parco|chiostro|palazzo|museo|villa|cava|casa)[^,.;]*?)(?=\s+(?:a|il|lo|la|per|entro|servono|serve|con|e|alle|dalle|ore|nel|nella|di)\b|[,.;]|$)/i);
  if(lu)o.luogo=lu[1].trim().replace(/^\w/,c=>c.toUpperCase());
  const nm=T.match(/(?:organizziamo|organizzare|facciamo|fare|prevediamo|vorremmo|vogliamo|creiamo|creare)\s+(?:fare\s+)?(?:un|una|uno|il|la|lo|l’|l')?\s*([^.,;]+?)(?=\s+(?:a|in|presso|al|alla|davanti|il|nel|nella|per|entro|servono|serve|con|alle|dalle|ore|il giorno|a giugno|a luglio)\b|[.,;]|$)/i);
  if(nm)o.n=nm[1].trim().replace(/^\w/,c=>c.toUpperCase());
  REG17.forEach(([re,k,att,fo])=>{if(!re.test(T))return;const g=o.esig[k]=o.esig[k]||[];if(att&&!g.includes(att))g.push(att);if(fo&&!o.forn.includes(fo))o.forn.push(fo);});
  if(o.forn.length){const g=o.esig.eco=o.esig.eco||[];['Previsione dei costi','Ricerca dei fornitori','Richiesta di preventivi'].forEach(a=>{if(!g.includes(a))g.push(a);});}
  return o;}
async function capisciAI(t,o){if(!AION)return o;const cat=[].concat(...ESIG.map(([k,n,c,L])=>L.map(a=>n+': '+a)),FORN.map(f=>'Fornitura: '+f));
  const r=await ai('esigenze',{testo:t,categorie:cat});if(r.err||!r.testo)return o;let L=[];try{L=JSON.parse(r.testo.replace(/^```json|```$/g,''));}catch(x){return o;}
  (Array.isArray(L)?L:[]).forEach(x=>{const c=String(x&&x.categoria||'');if(c.indexOf('Fornitura: ')===0){const f=c.slice(11);if(FORN.includes(f)&&!o.forn.includes(f))o.forn.push(f);return;}
    const z=ESIG.find(([k,n])=>c.indexOf(n+': ')===0);if(!z)return;const a=c.slice(z[1].length+2);if(!z[3].includes(a))return;const g=o.esig[z[0]]=o.esig[z[0]]||[];if(!g.includes(a))g.push(a);});
  o.ai=true;return o;}
function proposta17(o){const R1=[];if(o.n)R1.push(['Nome',esc(o.n)]);if(o.p)R1.push(['Tipologia',o.p==='I'?'Festa della Bruna':'Bruna Passion Week']);if(o.anno)R1.push(['Edizione',o.anno+' · '+esc(nomeBilancio(o.anno))]);
  if(o.d1)R1.push(['Giorno',esc(dLab([o.d1]))]);else if(o.mese)R1.push(['Mese',esc(o.mese)+' <small class="muted">(il giorno lo scegli tu)</small>']);if(o.oi)R1.push(['Ora di inizio',esc(o.oi)]);if(o.luogo)R1.push(['Luogo',esc(o.luogo)]);
  ESIG.forEach(([k,n])=>{if(o.esig[k]&&o.esig[k].length)R1.push([n,esc(o.esig[k].join(', '))]);});if(o.forn.length)R1.push(['Forniture',esc(o.forn.join(', '))]);
  const manca=[!o.n&&'il nome',!o.d1&&'il giorno',!o.luogo&&'il luogo',!o.anno&&'l’edizione'].filter(Boolean);
  return (R1.length?righe(R1):'<p class="muted">Non ho trovato dati da proporre: prova a scrivere che cosa, dove, quando e che cosa serve.</p>')+(manca.length?'<p class="muted small">Mancano ancora: '+manca.join(', ')+'.</p>':'');}
function usaProposta(o){if(o.n&&!CW.n)CW.n=o.n;if(o.p)CW.p=o.p;if(o.anno&&!CW.anno&&anniBilancio().some(([y])=>y===o.anno))CW.anno=String(o.anno);if(o.d1&&!CW.d1)CW.d1=o.d1;if(o.oi&&!CW.oi)CW.oi=o.oi;if(o.luogo&&!CW.luogo)CW.luogo=o.luogo;
  ESIG.forEach(([k])=>{const L=o.esig[k]||[];if(L.length){const g=CW.esig[k];g.serve=true;L.forEach(a=>{if(!g.att.includes(a))g.att.push(a);});if(k==='eco')o.forn.forEach(f=>{if(!g.forn.includes(f))g.forn.push(f);});}});}
let ASS17='';
const _wiz17=wizard;wizard=function(){const box=_wiz17();if(!CW||CW.step!==1)return box;
  const a=h('<div class="ev17ai"><div class="ev17sh"><span class="orb"></span><b>Scrivi con parole tue e compilo io</b></div><textarea id="cw_ai" placeholder="Per esempio: Organizziamo un concerto in piazza Vittorio Veneto il 12 giugno 2027 alle 21. Servono palco, audio, luci, transenne e inviti.">'+esc(ASS17)+'</textarea><div class="ev17ab"></div><div class="ev17res"></div></div>');
  const btn=h('<button type="button" class="bb dark sm">Compila per me</button>');a.querySelector('.ev17ab').appendChild(btn);
  btn.addEventListener('click',async()=>{const t=a.querySelector('#cw_ai').value.trim();ASS17=t;const res=a.querySelector('.ev17res');if(!t){res.innerHTML='<p class="neg small">Scrivi prima com’è l’evento.</p>';return;}
    btn.disabled=true;btn.textContent='Leggo…';let o=capisci(t);o=await capisciAI(t,o);btn.disabled=false;btn.textContent='Compila per me';
    res.innerHTML='<p class="b26lab" style="margin:8px 0 4px">Ho capito questo'+(o.ai?' (con l’assistente)':'')+'. Controlla prima di usarlo:</p>'+proposta17(o);
    const ok=h('<div class="big-btns"></div>');const u=h('<button type="button" class="bb dark sm">Usa questi dati</button>');u.addEventListener('click',()=>{cwLeggi(box);usaProposta(o);ASS17='';const nb=wizard();box.replaceWith(nb);stEl.textContent='Dati inseriti: controllali passo per passo prima di inviare.';});ok.appendChild(u);res.appendChild(ok);});
  const B=box.querySelector('.ev15body');B.insertBefore(a,B.firstChild);return box;};
