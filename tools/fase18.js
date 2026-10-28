/* ================= Bruna27 · Fatture: 5 gruppi, caricamento di tanti PDF, lettura automatica, collegamenti a sponsor, donatori, fornitori e bilancio ================= */
const DOC18={FVL:['Fatture con IVA','#2F63F0'],FVD:['Fatture liberalità','#2A9D8F'],NCV:['Note di credito','#C0392B'],NVD:['Note di credito liberalità','#B5495B'],RIC:['Ricevute','#8A6CF0'],PAS:['Fatture dei fornitori','#D9822B']};
const DOC1={FVL:'Fattura con IVA',FVD:'Fattura liberalità',NCV:'Nota di credito',NVD:'Nota di credito liberalità',RIC:'Ricevuta',PAS:'Fattura del fornitore'};
const DOCK=['FVL','FVD','NCV','NVD','RIC','PAS'];
const ASSOC_PIVA='01241230778',ASSOC_CF='93027470777';
const CAT18=['Sponsor','Donazione','Fornitore','Altro ricavo'];
const nrm18=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\b(s\.?p\.?a|s\.?r\.?l\.?s?|s\.?a\.?s|s\.?n\.?c|di|&|c\.|e c)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const docDi=d=>d.doc||(d.tipo==='Ricavo'?'FVL':'PAS');
const isNota=k=>k==='NCV'||k==='NVD';
const isBruna=d=>!d.festa||/bruna/i.test(d.festa);
const docsV=()=>(VD['v-fatt']||[]).filter(r=>!r.dati.kind);
// --- lettura dei documenti emessi dall'Associazione (FVL, FVD, NCV, NVD, Ricevuta) ---
function stacca(l){l=String(l).replace(/\s+/g,' ').trim();const t=l.split(' ');const sg=x=>/^[A-Za-z0-9€]$/.test(x);const o=[];let i=0;
  while(i<t.length){if(sg(t[i])){let j=i;while(j<t.length&&sg(t[j]))j++;if(j-i>=3){let w=t.slice(i,j).join('');if(j<t.length&&/^\d+,\d{2}$/.test(t[j])&&/\d$/.test(w)){w+=t[j];j++;}o.push(w);i=j;continue;}}o.push(t[i]);i++;}return o.join(' ');}
const AM1=/-?\d{1,3}(?:\.\d{3})*,\d{2}/;
const AM18=/-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
function annoDa(desc,data){const a=String(desc).match(/\banno\s+(20\d\d)\b/i);if(a)return {v:+a[1],certo:true};if(!data)return {v:null,certo:false};const y=+data.slice(0,4),m=+data.slice(5,7);return {v:m<=7?y:y+1,certo:false};}
function festaDa(desc){if(/bruna/i.test(desc))return 'Festa della Bruna';const m=desc.match(/in onore\s+(?:di|del|della)\s+([^\-(,]+?)(?:\s*[-(]|$)/i);if(m)return m[1].replace(/\s+/g,' ').trim();return '';}
function leggiBruna(lines0){const lines=lines0.map(stacca).filter(Boolean);const T=lines.join('\n');const o={__come:'pdf',tipo:'Ricavo',dubbi:[]};
  const ric=/^RICEVUTA(\s+FISCALE)?\b/im.test(lines.slice(0,4).join('\n'));const nm=T.match(/\b(FVL|FVD|NCV|NVD)\s*(\d+)\b/);
  if(!ric&&!nm)return null;
  if(ric){o.doc='RIC';const r=T.match(/N\.?\s*(\d+)\s+del\s+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/i);if(r){o.numero='Ricevuta '+r[1];o.data=isoD(r[2],r[3],r[4]);}}
  else{o.doc=nm[1];o.numero=nm[1]+nm[2];const dm=T.slice(T.indexOf(nm[0])).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)||T.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);if(dm)o.data=isoD(dm[1],dm[2],dm[3]);}
  // cliente
  const addr=l=>/^(via|v\.le|viale|piazza|p\.zza|corso|c\.so|contrada|c\.da|vico|largo|loc\.?|localit|strada|zona)\b/i.test(l)||/^\d/.test(l)||/\b\d{5}\b/.test(l);
  let i0=-1;if(ric){i0=lines.findIndex(l=>/^s\s?pett/i.test(l));}else{const em=lines.findIndex(l=>/^e-?mail/i.test(l));i0=em>=0?em:lines.findIndex(l=>/C\.\s*F\.\s*93027470777|P\.\s*IVA\s*01241230778/.test(l));}
  if(i0>=0){const nmL=[],ad=[];let k=i0+1;if(!ric)while(k<lines.length&&/^tel|^e-?mail|^p\.\s*iva|^cliente$/i.test(lines[k]))k++;
    while(k<lines.length&&!addr(lines[k])&&!/^(p\.?\s*iva|it|italia|destinatario|fattura|nota di credito|descrizione|cod\.)/i.test(lines[k])&&nmL.length<3){nmL.push(lines[k]);k++;}
    while(k<lines.length&&ad.length<4&&!/^(p\.?\s*iva|it|italia|destinatario|fattura|nota di credito|descrizione|cod\.|numero)/i.test(lines[k])){ad.push(lines[k]);k++;}
    o.soggetto=nmL.join(' ').replace(/\s+/g,' ').replace(/^s\s?pett\.?le\s*/i,'').trim();o.indirizzo=ad.join(', ');}
  // partita IVA / codice fiscale del cliente (non quelli dell'Associazione)
  const ids=(T.match(/\b(\d{11}|[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])\b/g)||[]).filter(x=>x!==ASSOC_PIVA&&x!==ASSOC_CF);if(ids.length)o.piva=ids[0];
  const cc=T.match(/Cod\.\s*Cliente[^\n]*\n\s*(\d{1,6})\b/i);if(cc)o.codcli=cc[1];
  // descrizione
  let dsc=[];if(ric){const a=lines.findIndex(l=>/^imponibile$/i.test(l)),b=lines.findIndex(l=>/^iban/i.test(l));if(a>=0)dsc=lines.slice(a+1,b>a?b:a+4);}
  else{const a=lines.findIndex(l=>/^\d{1,4}\s+[A-Za-zÀ-ú]/.test(l)&&AM1.test(l));if(a>=0){dsc=lines.slice(a,a+6).filter(l=>!/^(descrizione|totali|data scadenza|vendite|imponibile|imposta|eur)/i.test(l));dsc[0]=dsc[0].replace(/^\d{1,4}\s+/,'').replace(/\s+\d+\s+-?[\d.]+,\d{2}\s+-?[\d.]+,\d{2}\s+\d+\s*$/,'');}}
  o.descrizione=dsc.join(' ').replace(/(\s-){2,}/g,' ').replace(/\s+/g,' ').trim();o.nota=o.descrizione;
  // importi
  if(ric){const t=T.match(/TOTALE\s*€?\s*(-?[\d.]+,\d{2})/i);if(t)o.importo=numIt(t[1]);o.imponibile=o.importo;o.iva=0;}
  else{const e=T.match(/EUR\s*(-?[\d.]+,\d{2})/);if(e)o.importo=numIt(e[1]);
    const di=lines.findIndex(l=>/^descrizione iva/i.test(l));if(di>=0){for(let k=di+1;k<Math.min(lines.length,di+5);k++){const m=lines[k].match(AM18);if(m&&m.length>=2){o.imponibile=numIt(m[m.length-2]);o.iva=numIt(m[m.length-1]);const al=lines[k].match(/(\d{1,2})\s*%/);if(al)o.aliquota=+al[1];break;}}}
    if(o.imponibile==null&&o.importo!=null){o.imponibile=o.importo;o.iva=0;}}
  if(/fuori campo|art\.\s*2/i.test(T)&&!o.aliquota)o.natura='Fuori campo IVA (art. 2 DPR 633/72)';
  const sc=T.match(/Data scadenza[^\n]*\n\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);if(sc)o.scadenza=isoD(sc[1],sc[2],sc[3]);
  const pg=lines.findIndex(l=>/^pagamento$/i.test(l));if(pg>=0&&lines[pg+1])o.pagamento=lines[pg+1];const bk=T.match(/Banca\s*:\s*([^\n]+)/i);if(bk)o.banca=bk[1].trim();
  const st=(o.descrizione+' '+T).match(/storno\s+(?:ns\.?\s*)?(?:fattura\s+)?(FVL|FVD|NCV|NVD)\s*(\d+)/i);if(st)o.storno=st[1].toUpperCase()+st[2];
  // edizione, festa, categoria: proposte da controllare
  const an=annoDa(o.descrizione,o.data);o.edizione=an.v;if(!an.certo)o.dubbi.push('edizione');
  o.festa=festaDa(o.descrizione);if(!o.festa)o.dubbi.push('festa');
  if(o.doc==='FVL')o.categoria=/sponsor/i.test(o.descrizione)?'Sponsor':'Altro ricavo';
  else if(o.doc==='FVD'||o.doc==='NVD'||o.doc==='RIC')o.categoria='Donazione';
  else o.categoria=/liberal|contributo|fuori campo/i.test(T)?'Donazione':'Sponsor';
  if(o.doc==='NCV')o.dubbi.push('categoria');
  if(isNota(o.doc)&&o.importo>0){o.importo=-o.importo;o.imponibile=-Math.abs(o.imponibile||0);}
  return o;}
async function leggiDoc(file){const n=(file.name||'').toLowerCase();let o=null;
  try{if(n.endsWith('.pdf')||file.type==='application/pdf'){const L=await pdfTesto(file);if(L.join('').trim())o=leggiBruna(L)||Object.assign(leggiTesto(L),{doc:'PAS'});else o={__come:'vuoto',doc:'PAS'};}
    else if(n.endsWith('.xml'))o=xmlFattura(await file.text());else if(n.endsWith('.p7m'))o=xmlFattura(p7mInXml(await file.arrayBuffer()));else o={__come:'altro',doc:'PAS'};}catch(e){o={__come:'errore',doc:'PAS'};}
  if(!o.doc)o.doc=o.tipo==='Ricavo'?'FVL':'PAS';if(o.doc==='PAS'){o.tipo='Costo';o.categoria='Fornitore';if(!o.edizione){const an=annoDa(o.nota||'',o.data);o.edizione=an.v;}o.dubbi=(o.dubbi||[]).concat(o.__come==='pdf'?['controlla']:[]);}
  o.dubbi=o.dubbi||[];o.imputa=true;o.festa=o.festa||(o.doc==='PAS'?'Festa della Bruna':'');o.__file=file;o.__nome=file.name;return o;}

// --- controlli: doppioni, importi, note di credito, altre feste, fornitori 2027 ---
function trovaOrig(numero,rows){if(!numero)return null;const r=docsV().find(x=>x.dati.numero===numero);if(r)return {id:r.id,d:r.dati};const b=(rows||[]).find(x=>x.numero===numero);return b?{batch:b,d:b}:null;}
function avvisi18(o,rows){const out=[];
  const dup=docsV().find(r=>r.dati.numero&&r.dati.numero===o.numero&&r.dati.data===o.data&&(!o.piva||!r.dati.piva||r.dati.piva===o.piva));if(dup)out.push(['ko','Già caricato: questo documento c’è già, non lo salvo due volte.']);
  if(rows&&rows.filter(x=>x!==o&&x.numero&&x.numero===o.numero&&x.data===o.data).length)out.push(['ko','Doppione: lo stesso documento è stato scelto due volte.']);
  if(o.imponibile!=null&&o.iva!=null&&o.importo!=null&&Math.abs((+o.imponibile)+(+o.iva)-(+o.importo))>0.02)out.push(['ko','Gli importi non tornano: imponibile + IVA è diverso dal totale.']);
  if(!o.importo&&o.importo!==0)out.push(['ko','Non ho trovato il totale: scrivilo tu.']);
  if(isNota(o.doc)){const g=trovaOrig(o.storno,rows);if(!o.storno)out.push(['wa','Nota di credito senza il numero della fattura stornata.']);else if(!g)out.push(['wa','Non trovo la fattura '+o.storno+': la collego quando la carichi.']);else out.push(['ok','Collegata alla fattura '+o.storno+'.']);}
  if(o.festa&&!/bruna/i.test(o.festa))out.push(['wa','Riguarda «'+o.festa+'», non la Bruna: resta visibile ma non va nel bilancio.']);
  if(o.doc==='PAS'&&+o.edizione===2027){const f=for27Di(o.soggetto,o.piva);if(!f)out.push(['wa','Fornitore non presente in Fornitori 2027: prima servono preventivo scelto, contratto e rate.']);else{const d=f.dati;if(!prevScelto(d.fornitore))out.push(['wa','Manca il preventivo scelto.']);if(!d.contratto)out.push(['wa','Manca il contratto firmato.']);if(!(d.pagamenti||[]).length)out.push(['wa','Manca il piano dei pagamenti.']);}}
  if(o.dubbi&&o.dubbi.length)out.push(['ai','Da controllare: '+o.dubbi.map(x=>({edizione:'edizione',festa:'festa',categoria:'sponsor o donazione',controlla:'dati letti dal PDF'})[x]||x).join(', ')+'.']);
  return out;}
const for27Di=(n,piva)=>(VD['v-for27']||[]).find(r=>(piva&&r.dati.piva===piva)||(nrm18(r.dati.fornitore)&&nrm18(n).indexOf(nrm18(r.dati.fornitore).split(' ')[0])===0));
const prevScelto=n=>(VD['v-prev']||[]).find(r=>r.dati.stato==='Accettato'&&nrm18(r.dati.fornitore)&&nrm18(r.dati.fornitore)===nrm18(n));
const forn26Di=n=>(D.forn||[]).find(f=>nrm18(f.n)&&(nrm18(n).indexOf(nrm18(f.n).split(' ')[0])===0||nrm18(f.n)===nrm18(n)));
const spDi=(voce,n,piva)=>(VD[voce]||[]).find(r=>(piva&&r.dati.piva===piva)||(nrm18(r.dati.nome)&&nrm18(r.dati.nome)===nrm18(n)));

// --- caricamento di tanti documenti insieme (20 alla volta) e tabella di controllo ---
let IMP18=null;
function apriImport(){const id='v-fatt';if(!CTX.canEdit(id)){stEl.textContent='Serve il permesso di modifica sulle Fatture.';return;}
  const ov=h('<div class="imp18" role="dialog" aria-modal="true" aria-label="Carica fatture"><div class="imp18in"><div class="imp18h"><div><span class="eyb">Fatture</span><h2>Carica i documenti</h2></div><button type="button" class="imp18x" aria-label="Chiudi">×</button></div><div class="imp18b"></div><div class="imp18f"></div></div></div>');
  document.body.appendChild(ov);document.body.style.overflow='hidden';const chiudi=()=>{ov.remove();document.body.style.overflow='';IMP18=null;};ov.querySelector('.imp18x').addEventListener('click',()=>{if(IMP18&&IMP18.rows.length&&!IMP18.salvato)ask('Chiudere senza salvare i documenti letti?','Chiudi',async()=>chiudi());else chiudi();});
  IMP18={ov,rows:[],chiudi};passoScelta();}
const assist18=(t,btn)=>{const a=h('<div class="imp18as"><span class="orb"></span><div><b>L’assistente</b><span>'+t+'</span></div></div>');if(btn){const k=h('<button type="button" class="bb dark sm">'+esc(btn[0])+'</button>');k.addEventListener('click',btn[1]);a.appendChild(k);}return a;};
function passoScelta(){const B=IMP18.ov.querySelector('.imp18b'),F=IMP18.ov.querySelector('.imp18f');B.innerHTML='';F.innerHTML='';
  B.appendChild(assist18('Scegli i documenti: li leggo io e ti preparo tutto. Tu controlli e salvi.'));
  const dr=h('<label class="imp18drop2"><input type="file" id="i18f" multiple accept=".pdf,.xml,.p7m,application/pdf" hidden>'+svg(IC2.doc,30)+'<b>Scegli i documenti</b><span>Anche tanti insieme: fatture, liberalità, note di credito, ricevute</span><em class="imp18sel"></em></label>');B.appendChild(dr);
  const inp=dr.querySelector('#i18f');const btn=h('<button type="button" class="bb dark" disabled>Leggi i documenti</button>');btn.addEventListener('click',()=>leggiTutti([...inp.files]));
  inp.addEventListener('change',()=>{const n=inp.files.length;dr.querySelector('.imp18sel').textContent=n?n+(n===1?' documento scelto':' documenti scelti'):'';dr.classList.toggle('ok',!!n);btn.disabled=!n;if(n)leggiTutti([...inp.files]);});F.appendChild(btn);}
async function leggiTutti(files){const B=IMP18.ov.querySelector('.imp18b'),F=IMP18.ov.querySelector('.imp18f');F.innerHTML='';
  B.innerHTML='';B.appendChild(assist18('Sto leggendo i documenti, un momento…'));B.appendChild(h('<div class="imp18prog"><b>Leggo i documenti</b><span>0 di '+files.length+'</span><i style="--w:0%"></i></div>'));const P=B.querySelector('.imp18prog');const rows=[];
  for(let i=0;i<files.length;i+=20){const ch=files.slice(i,i+20);const L=await Promise.all(ch.map(f=>leggiDoc(f)));rows.push(...L);const n=Math.min(files.length,i+20);P.querySelector('span').textContent=n+' di '+files.length+(files.length>20?' · a gruppi di 20':'');P.querySelector('i').style.setProperty('--w',(n/files.length*100)+'%');}
  // note di credito: prendono categoria, edizione e festa dalla fattura stornata
  rows.forEach(o=>{if(isNota(o.doc)){const g=trovaOrig(o.storno,rows);if(g){const d=g.d;if(d.categoria){o.categoria=d.categoria;o.dubbi=o.dubbi.filter(x=>x!=='categoria');}if(d.edizione&&!o.dubbi.includes('edizione')===false){o.edizione=d.edizione;o.dubbi=o.dubbi.filter(x=>x!=='edizione');}if(d.festa&&!o.festa){o.festa=d.festa;o.dubbi=o.dubbi.filter(x=>x!=='festa');}}}
    if(!o.prodotti){o.prodotti=proponiProd(o,rows);if((o.doc==='RIC'||o.doc==='FVL')&&o.prodotti.length&&o.categoria!=='Sponsor'){o.categoria='Sponsor';if(o.doc==='RIC')o.dubbi.push('categoria');}}o.salva=!avvisi18(o,rows).some(([k,t])=>/^Già caricato|^Doppione/.test(t));if(o.festa&&!/bruna/i.test(o.festa))o.imputa=false;o.collega=true;});
  IMP18.rows=rows;tabellaImport();}
function campiImport(o){const n=isNota(o.doc);return '<div class="imp18g">'+
  '<label>Tipo<select data-k="doc">'+DOCK.map(k=>'<option value="'+k+'"'+(k===o.doc?' selected':'')+'>'+DOC1[k]+'</option>').join('')+'</select></label>'+
  '<label>Numero<input type="text" data-k="numero" value="'+esc(o.numero||'')+'"></label>'+
  '<label>Data<input type="date" data-k="data" value="'+esc(o.data||'')+'"></label>'+
  '<label>'+(o.doc==='PAS'?'Fornitore':'Cliente')+'<input type="text" data-k="soggetto" value="'+esc(o.soggetto||'')+'"></label>'+
  '<label>Partita IVA / Cod. fiscale<input type="text" data-k="piva" value="'+esc(o.piva||'')+'"></label>'+
  '<label>Imponibile (€)<input type="number" step="0.01" data-k="imponibile" value="'+(o.imponibile!=null?o.imponibile:'')+'"></label>'+
  '<label>IVA (€)<input type="number" step="0.01" data-k="iva" value="'+(o.iva!=null?o.iva:'')+'"></label>'+
  '<label>Totale (€)<input type="number" step="0.01" data-k="importo" value="'+(o.importo!=null?o.importo:'')+'"></label>'+
  (n?'<label>Storna la fattura<input type="text" data-k="storno" value="'+esc(o.storno||'')+'"></label>':'')+
  '<label>È<select data-k="categoria">'+CAT18.map(c=>'<option'+(c===o.categoria?' selected':'')+'>'+c+'</option>').join('')+'</select></label>'+
  '<label>Festa<input type="text" data-k="festa" value="'+esc(o.festa||'')+'"></label>'+
  '<label class="w2">Descrizione<input type="text" data-k="descrizione" value="'+esc(o.descrizione||o.nota||'')+'"></label>'+
  '<label class="ck w2"><input type="checkbox" data-k="collega"'+(o.collega?' checked':'')+'> Collega alla lista '+(o.categoria==='Sponsor'?'Sponsor':o.categoria==='Donazione'?'Donatori':o.categoria==='Fornitore'?'Fornitori':'')+'</label></div>';}
function tabellaImport(){const B=IMP18.ov.querySelector('.imp18b'),F=IMP18.ov.querySelector('.imp18f');const rows=IMP18.rows;
  const dub=rows.filter(o=>o.salva&&(o.dubbi.length||avvisi18(o,rows).some(([k])=>k==='ko'||k==='wa')));
  B.innerHTML='';const tot=rows.filter(o=>o.salva).length;
  B.appendChild(assist18('Ho letto <b>'+rows.length+(rows.length===1?' documento':' documenti')+'</b>.'+(dub.length?' <b>'+dub.length+'</b> '+(dub.length===1?'ha':'hanno')+' qualcosa da controllare: li trovi in cima, segnati in giallo.':' È tutto a posto: controlla edizione e tipo e tocca «Salva».'),AION&&rows.some(o=>o.salva&&o.dubbi.length)?['Controlla tu per me',async()=>{await aiutoAI();}]:null));
  const LI=h('<div class="imp18list"></div>');B.appendChild(LI);
  const ord=rows.map((o,i)=>[o,i]).sort((x,y)=>(dub.includes(y[0])-dub.includes(x[0]))||x[1]-y[1]).map(x=>x[0]);
  ord.forEach(o=>{const av=avvisi18(o,rows).filter(([k])=>k!=='ok');const da=dub.includes(o);const k=o.doc;
    const r=h('<article class="post9 imp18c'+(o.salva?'':' off')+(da?' da':'')+'" style="--c:'+DOC18[k][1]+'"><div class="ph"><span class="av9" style="--c:'+DOC18[k][1]+'">'+(k==='RIC'?'R':k)+'</span><span class="pa"><b>'+esc(o.soggetto||'Senza nome')+'</b><em>'+esc(DOC1[k])+' '+esc(String(o.numero||'').replace(/^Ricevuta\s*/,''))+(o.data?' · '+fmtD(o.data)+' '+o.data.slice(0,4):'')+'</em></span><b class="imp18t">'+(o.importo!=null?eur(+o.importo):'—')+'</b></div>'+
      '<div class="imp18q"><div class="seg wrap">'+anniBilancio().slice(0,2).map(([y])=>'<button type="button" data-ed="'+y+'" aria-pressed="'+(+o.edizione===y)+'">Bruna '+y+'</button>').join('')+'</div>'+
      '<div class="seg wrap">'+['Sponsor','Donazione','Fornitore'].map(c=>'<button type="button" data-cat="'+c+'" aria-pressed="'+(o.categoria===c)+'">'+c+'</button>').join('')+'</div>'+
      '<label class="ck"><input type="checkbox" data-k="imputa"'+(o.imputa?' checked':'')+'> Nel bilancio</label></div>'+rigaProdSocio(o)+
      (av.length?'<div class="imp18w">'+av.slice(0,2).map(([kk,t])=>'<span class="'+kk+'">'+esc(t)+'</span>').join('')+'</div>':'')+
      '<div class="imp18a"><label class="ck"><input type="checkbox" data-k="salva"'+(o.salva?' checked':'')+'> Da salvare</label><button type="button" class="lnk2 imp18m">'+(o.__apri?'Chiudi i dati':'Modifica i dati')+'</button></div>'+
      (o.__apri?campiImport(o):'')+'</article>');
    r.querySelectorAll('[data-k]').forEach(x=>x.addEventListener('change',()=>{const kk=x.dataset.k;let v=x.type==='checkbox'?x.checked:x.value;if(['imponibile','iva','importo'].includes(kk))v=v===''?null:+v;o[kk]=v;
      if(kk==='festa'){o.dubbi=o.dubbi.filter(z=>z!=='festa');if(v&&!/bruna/i.test(v))o.imputa=false;}if(kk==='categoria')o.dubbi=o.dubbi.filter(z=>z!=='categoria');if(['numero','importo','imponibile','iva','doc','soggetto','data'].includes(kk))o.dubbi=o.dubbi.filter(z=>z!=='controlla');
      if(kk==='salva')r.classList.toggle('off',!v);else if(kk!=='imputa'&&kk!=='collega'&&kk!=='descrizione'&&kk!=='piva')tabellaImport();}));
    bindProdSocio(r,o);r.querySelector('.imp18m').addEventListener('click',()=>{o.__apri=!o.__apri;tabellaImport();});
    r.querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click',()=>{o.edizione=+b.dataset.ed;o.dubbi=o.dubbi.filter(z=>z!=='edizione');tabellaImport();}));
    r.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{o.categoria=b.dataset.cat;o.dubbi=o.dubbi.filter(z=>z!=='categoria');tabellaImport();}));
    LI.appendChild(r);});
  F.innerHTML='';bottoni(F,[['‹ Altri documenti',()=>passoScelta()],['Salva '+tot+(tot===1?' documento':' documenti'),()=>salvaImport(),true]]);}
async function aiutoAI(){const rows=IMP18.rows.filter(o=>o.salva&&o.dubbi.length);let fatti=0;stEl.textContent='L’assistente controlla '+rows.length+' documenti…';
  for(const o of rows){const r=await ai('documento',{testo:JSON.stringify({tipo:DOC18[o.doc][0],numero:o.numero,data:o.data,cliente:o.soggetto,descrizione:o.descrizione,totale:o.importo,storno:o.storno})});if(r.err){stEl.textContent=r.err;break;}
    let x={};try{x=JSON.parse(String(r.testo).replace(/^```json|```$/g,''));}catch(e){continue;}
    if(o.dubbi.includes('edizione')&&[2026,2027,2028].includes(+x.edizione)){o.edizione=+x.edizione;}if(o.dubbi.includes('categoria')&&CAT18.includes(x.categoria))o.categoria=x.categoria;if(o.dubbi.includes('festa')&&x.festa)o.festa=String(x.festa).slice(0,60);
    o.ai=true;fatti++;}
  stEl.textContent=fatti?'L’assistente ha controllato '+fatti+(fatti===1?' documento':' documenti')+': le caselle ✦ restano da confermare.':stEl.textContent;tabellaImport();}
async function salvaImport(){const rows=IMP18.rows.filter(o=>o.salva);if(!rows.length){stEl.textContent='Nessun documento da salvare.';return;}
  const F=IMP18.ov.querySelector('.imp18f');F.innerHTML='<p class="muted">Salvo '+rows.length+' documenti…</p>';const ins={};let link=0,ok=0;const avv=[];
  for(const o of rows){try{const file=o.__file?await carica(o.__file,'v-fatt'):null;const g=isNota(o.doc)?trovaOrig(o.storno,rows):null;
    const d={doc:o.doc,tipo:o.doc==='PAS'?'Costo':'Ricavo',numero:o.numero||'',data:o.data||'',soggetto:o.soggetto||'',piva:o.piva||'',codcli:o.codcli||'',indirizzo:o.indirizzo||'',descrizione:o.descrizione||'',nota:o.descrizione||'',
      imponibile:o.imponibile,iva:o.iva,aliquota:o.aliquota||null,natura:o.natura||'',importo:o.importo,scadenza:o.scadenza||'',pagamento:o.pagamento||'',banca:o.banca||'',storno:o.storno||'',
      edizione:+o.edizione||null,festa:o.festa||'',socio:o.socio||'',prodotti:(o.prodotti||[]).length===1?[{p:o.prodotti[0].p,imp:valDoc(o)}]:(o.prodotti||[]),categoria:o.categoria,imputa:!!o.imputa&&isBruna(o),pagata:'No',voce:o.categoria==='Donazione'?'Donazioni':o.categoria==='Sponsor'?'Sponsor':'',letto:o.ai?'assistente':(o.__come||'pdf'),file,
      storico:[{quando:new Date().toISOString(),chi:CTX.user.id,cambi:[['Documento','','Caricato da '+(o.__nome||'file')]]}]};
    if(g&&g.id)d.orig_id=g.id;
    if(o.collega)d.rif=await collegaLista(o,d,avv);if(d.rif)link++;
    const {data,error}=await CTX.sb.from('voci_dati').insert({voce:'v-fatt',dati:d}).select().single();if(error)throw new Error(error.message);ins[o.numero]=data;ok++;}catch(e){avv.push((o.numero||o.__nome)+': '+e.message);}}
  // note di credito caricate insieme alla loro fattura
  for(const o of rows)if(isNota(o.doc)&&o.storno&&ins[o.numero]&&!ins[o.numero].dati.orig_id&&ins[o.storno]){await CTX.sb.from('voci_dati').update({dati:Object.assign({},ins[o.numero].dati,{orig_id:ins[o.storno].id})}).eq('id',ins[o.numero].id);}
  await loadVD();IMP18.salvato=true;rerender();
  F.innerHTML='';const B=IMP18.ov.querySelector('.imp18b');B.innerHTML='';B.appendChild(assist18('Fatto: ho salvato <b>'+ok+(ok===1?' documento':' documenti')+'</b> e '+(link===1?'ne ho collegato 1':'ne ho collegati '+link)+' a sponsor, donatori o fornitori. Li trovi nella sezione Fatture, divisi per tipo.'));B.insertAdjacentHTML('beforeend',''+(avv.length?'<div class="ev14crit"><b>Da sistemare</b>'+avv.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':''));
  bottoni(F,[['Carica altri documenti',()=>passoScelta()],['Chiudi',()=>IMP18.chiudi(),true]]);}
async function collegaLista(o,d,avv){const y=+o.edizione;
  if(o.categoria==='Sponsor'&&(y===2026||y===2027)){const voce=y===2026?'v-sp26':'v-sp27';const r=spDi(voce,o.soggetto,o.piva);if(r){if(o.socio&&!r.dati.socio&&CTX.canEdit(voce))await CTX.sb.from('voci_dati').update({dati:Object.assign({},r.dati,{socio:o.socio})}).eq('id',r.id);return {voce,id:r.id};}
    if(!CTX.canEdit(voce)){avv.push(o.soggetto+': non ho il permesso per creare lo sponsor '+y+'.');return null;}
    const dd=y===2026?{nome:o.soggetto,piva:o.piva,importo:+o.imponibile||+o.importo||0,conferma:'Non ancora contattato',socio:o.socio||'',indirizzo:o.indirizzo||'',pagamento:o.pagamento||'',banca:o.banca||'',pacchetto:o.descrizione?String(o.descrizione).slice(0,80):'',nota:'Creato dalla fattura '+o.numero}:{nome:o.soggetto,piva:o.piva,ragione:o.soggetto,indirizzo:o.indirizzo,socio:o.socio||'',pagamento:o.pagamento||'',banca:o.banca||'',importo:+o.imponibile||0,stato:'Confermato',nota:'Creato dalla fattura '+o.numero};
    const {data,error}=await CTX.sb.from('voci_dati').insert({voce,dati:dd}).select().single();if(error){avv.push(o.soggetto+': '+error.message);return null;}return {voce,id:data.id,nuovo:true};}
  if(o.categoria==='Donazione')return {voce:'v-don',chiave:o.piva||nrm18(o.soggetto)};
  if(o.categoria==='Fornitore'){if(y===2027){const f=for27Di(o.soggetto,o.piva);return f?{voce:'v-for27',id:f.id}:null;}const f=forn26Di(o.soggetto);return f?{voce:'s-for',nome:f.n}:null;}
  return null;}

// --- pagina Fatture: 5 gruppi (più i fornitori), edizione, PDF e stampa ---
let FAT18='FVL',FED18='tutte';
let FQ18='',FP18='';
const filtraDocs=k=>docsV().filter(r=>{const d=r.dati;if(docDi(d)!==k)return false;if(FED18!=='tutte'&&String(d.edizione||'')!==FED18)return false;if(FP18&&!(d.prodotti||[]).some(x=>x.p===FP18))return false;if(FQ18){const q=FQ18.toLowerCase();if(!((d.soggetto||'')+' '+(d.numero||'')+' '+(d.socio||'')+' '+(d.piva||'')+' '+(d.descrizione||'')).toLowerCase().includes(q))return false;}return true;});
const noteDi=r=>docsV().filter(x=>isNota(docDi(x.dati))&&(x.dati.orig_id===r.id||(x.dati.storno&&x.dati.storno===r.dati.numero)));
const origDi=r=>{const d=r.dati;return docsV().find(x=>x.id===d.orig_id||(d.storno&&x.dati.numero===d.storno));};
async function urlFile(f,scarica){const {data,error}=await CTX.sb.storage.from('documenti').createSignedUrl(f.path,900,scarica?{download:f.nome||true}:undefined);if(error||!data){stEl.textContent='Non riesco ad aprire il file'+(error?': '+error.message:'');return null;}return data.signedUrl;}
async function scaricaFile(f){const u=await urlFile(f,true);if(u){const a=document.createElement('a');a.href=u;a.download=f.nome||'documento.pdf';document.body.appendChild(a);a.click();a.remove();}}
async function stampaFile(f){const w=window.open('','_blank');const u=await urlFile(f,false);if(!u){if(w)w.close();return;}if(w){w.location.href=u;setTimeout(()=>{try{w.focus();w.print();}catch(e){}},1500);}else location.href=u;}
function righeDoc(d){return [['Tipo',DOC1[docDi(d)]],['Numero',esc(d.numero||'—')],d.data?['Data',fmtD(d.data)+' '+String(d.data).slice(0,4)]:null,[docDi(d)==='PAS'?'Fornitore':'Cliente',esc(d.soggetto||'—')],d.piva?['Partita IVA / Cod. fiscale',esc(d.piva)]:null,d.indirizzo?['Indirizzo',esc(d.indirizzo)]:null,
  d.imponibile!=null&&d.imponibile!==''?['Imponibile',eur(+d.imponibile)]:null,d.iva!=null&&d.iva!==''?['IVA'+(d.aliquota?' '+d.aliquota+'%':''),eur(+d.iva)]:null,['Totale','<b>'+eur(+d.importo||0)+'</b>'],d.natura?['Regime',esc(d.natura)]:null,d.scadenza?['Scadenza',fmtD(d.scadenza)]:null,d.pagamento?['Pagamento',esc(d.pagamento)+(d.banca?' · '+esc(d.banca):'')]:null,
  ['Edizione',d.edizione?'Bruna '+d.edizione:'da indicare'],d.festa&&!/bruna/i.test(d.festa)?['Festa','<span class="neg">'+esc(d.festa)+' · non Bruna</span>']:null,['È',esc(d.categoria||(d.tipo==='Costo'?'Fornitore':'—'))],(d.prodotti||[]).length?[d.tipo==='Costo'?'Costo di':'Prodotto',esc(d.prodotti.map(x=>x.p+(d.prodotti.length>1?' ('+eur(+x.imp||0)+')':'')).join(', '))]:null,d.socio?['Socio che ha fatto lo sponsor',esc(d.socio)]:null,['Bilancio',d.imputa?'imputata al '+esc(nomeBilancio(d.edizione)):'non imputata'],d.descrizione||d.nota?['Descrizione',esc(d.descrizione||d.nota)]:null];}
function cardDoc(r){const d=r.dati;const k=docDi(d);const N=noteDi(r);const O=isNota(k)?origDi(r):null;const can=CTX.canEdit('v-fatt');const netto=(+d.importo||0)+N.reduce((a,x)=>a+(+x.dati.importo||0),0);
  return {key:r.id,n:d.soggetto||'Senza nome',t:eur(+d.importo||0),c:d.festa&&!/bruna/i.test(d.festa)?'#94A3C0':DOC18[k][1],ic:k==='RIC'?'R':k,k:(d.numero||'')+(d.data?' · '+fmtD(d.data):''),tg:d.festa&&!/bruna/i.test(d.festa)?'Non Bruna':N.length?'Stornata':d.edizione?'Bruna '+d.edizione:'',
    s:[d.categoria,d.imputa?'nel bilancio':'',isNota(k)&&d.storno?'storna '+d.storno:''].filter(Boolean).join(' · '),lab:DOC1[k]+' '+(d.numero||'').replace(/^Ricevuta\s*/,''),
    det:box=>{box.innerHTML=righe(righeDoc(d));
      if(N.length)box.appendChild(h('<div class="ev14crit"><b>Note di credito collegate</b>'+N.map(x=>'<span>'+esc(x.dati.numero)+' del '+fmtD(x.dati.data)+': '+eur(+x.dati.importo||0)+'</span>').join('')+'<span>Resta: <b>'+eur(netto)+'</b></span></div>'));
      if(O)box.appendChild(h('<div class="ev17bil"><b>Storna la fattura '+esc(O.dati.numero)+'</b><span class="muted small">'+esc(O.dati.soggetto||'')+' · '+eur(+O.dati.importo||0)+' del '+fmtD(O.dati.data)+'</span></div>'));
      else if(isNota(k)&&d.storno)box.appendChild(h('<p class="neg small">La fattura '+esc(d.storno)+' non è ancora stata caricata.</p>'));
      const f=d.file&&d.file.path?d.file:null;
      bottoni(box,[f?['Apri il PDF',()=>apriFile(f),true]:null,f?['Scarica',()=>scaricaFile(f)]:null,f?['Stampa',()=>stampaFile(f)]:null,can?['Modifica',()=>modDoc(r)]:null,can?[d.imputa?'Togli dal bilancio':'Imputa al bilancio',()=>salvaDoc(r,{imputa:!d.imputa},d.imputa?'Tolta dal bilancio':'Imputata al bilancio')]:null,can&&d.tipo!=='Ricavo'&&d.pagata!=='Sì'?['Segna come pagata',()=>salvaDoc(r,{pagata:'Sì'},'Pagata')]:null,can&&d.tipo==='Ricavo'&&d.pagata!=='Sì'&&!isNota(k)?['Segna come incassata',()=>salvaDoc(r,{pagata:'Sì'},'Incassata')]:null,can?['Elimina',()=>ask('Eliminare il documento '+(d.numero||'')+'? Esce anche dal bilancio.','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);await loadVD();rerender();})]:null]);
      const bb=box.querySelector('.c12b');if(bb&&bb.lastElementChild&&bb.lastElementChild.textContent==='Elimina')bb.lastElementChild.classList.add('ko');const sto=storicoRec(d);if(sto)box.appendChild(sto);},
    sideLab:'Dove si trova',side:box=>{box.innerHTML=righe([['Lista',d.rif?(d.rif.voce==='v-don'?'Donatori':d.rif.voce==='v-sp26'?'Sponsor 2026':d.rif.voce==='v-sp27'?'Sponsor 2027':d.rif.voce==='v-for27'?'Fornitori 2027':'Fornitori 2026'):'non collegata'],['Stato',d.pagata==='Sì'?(d.tipo==='Ricavo'?'incassata':'pagata'):(d.tipo==='Ricavo'?'da incassare':'da pagare')]]);
      const go1=d.rif&&{'v-don':'v-don','v-sp26':'v-sp26','v-sp27':'v-sp27','v-for27':'v-for27','s-for':'s-for'}[d.rif.voce];if(go1&&canOpen(go1)){const b=h('<button type="button" class="lnk2">Apri la scheda ›</button>');b.addEventListener('click',()=>go(go1));box.appendChild(b);}}};}
async function salvaDoc(r,o,cosa){const d=Object.assign({},r.dati,o);d.storico=(r.dati.storico||[]).concat([{quando:new Date().toISOString(),chi:CTX.user.id,cambi:[[cosa,'','']]}]).slice(-30);const {error}=await CTX.sb.from('voci_dati').update({dati:d,aggiornato:new Date().toISOString()}).eq('id',r.id);if(error){stEl.textContent='Errore: '+error.message;return;}await loadVD();rerender();stEl.textContent=cosa+'.';}
function modDoc(r){const d=r.dati;const f=[['numero','Numero','text'],['data','Data','date'],['soggetto','Cliente o fornitore','text'],['piva','Partita IVA / Cod. fiscale','text'],['imponibile','Imponibile (€)','number'],['iva','IVA (€)','number'],['importo','Totale (€)','number'],['storno','Storna la fattura (solo note di credito)','text'],['festa','Festa','text'],['socio','Socio che ha fatto lo sponsor','text'],['descrizione','Descrizione','text']];
  sheet('Modifica '+(d.numero||'documento'),'<div class="ctl"><label for="md_doc">Tipo</label><select id="md_doc">'+DOCK.map(k=>'<option value="'+k+'"'+(k===docDi(d)?' selected':'')+'>'+DOC18[k][0]+'</option>').join('')+'</select></div>'+
    '<div class="ctl"><label for="md_ed">Edizione</label><select id="md_ed">'+anniBilancio().map(([y,l])=>'<option value="'+y+'"'+(+d.edizione===y?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select></div>'+
    '<div class="ctl"><label for="md_cat">È</label><select id="md_cat">'+CAT18.map(c=>'<option'+(d.categoria===c?' selected':'')+'>'+c+'</option>').join('')+'</select></div>'+
    '<div class="ctl"><label for="md_pp">'+(d.tipo==='Costo'?'È un costo di':'Prodotto venduto')+'</label><select id="md_pp"><option value="">Nessuno</option>'+prodottiEd(d.edizione||2027).filter(p=>d.tipo==='Costo'||p.vende).map(p=>'<option'+(((d.prodotti||[])[0]||{}).p===p.nome?' selected':'')+'>'+esc(p.nome)+'</option>').join('')+'</select></div>'+
    f.map(([k,l,t])=>'<div class="ctl"><label for="md_'+k+'">'+l+'</label><input type="'+t+'" step="0.01" id="md_'+k+'" value="'+esc(d[k]!=null?d[k]:'')+'"></div>').join(''),'Salva',async(x)=>{
    const o={doc:x.querySelector('#md_doc').value,edizione:+x.querySelector('#md_ed').value,categoria:x.querySelector('#md_cat').value};f.forEach(([k,,t])=>{const v=x.querySelector('#md_'+k).value;o[k]=t==='number'?(v===''?null:+v):v;});o.tipo=o.doc==='PAS'?'Costo':'Ricavo';o.nota=o.descrizione;const pp=x.querySelector('#md_pp').value;o.prodotti=pp?[{p:pp,imp:valDoc(Object.assign({},d,o))}]:[];if(o.festa&&!/bruna/i.test(o.festa))o.imputa=false;
    await salvaDoc(r,o,'Modificata');});}
// elenco stampabile e PDF del gruppo
function tabellaGruppo(k){const L=filtraDocs(k).slice().sort((a,b)=>String(a.dati.data).localeCompare(String(b.dati.data)));const tot=L.reduce((a,r)=>a+(+r.dati.importo||0),0);
  return {titolo:DOC18[k][0]+(FED18!=='tutte'?' · Bruna '+FED18:''),cols:['Numero','Data','Cliente / fornitore','P. IVA / C.F.','Edizione','Imponibile','IVA','Totale'],rows:L.map(r=>{const d=r.dati;return [d.numero||'',d.data?d.data.split('-').reverse().join('/'):'',d.soggetto||'',d.piva||'',d.edizione?String(d.edizione):'',d.imponibile!=null?eur(+d.imponibile):'',d.iva!=null?eur(+d.iva):'',eur(+d.importo||0)];}),tot:eur(tot),n:L.length};}
function stampaGruppo(k){const T=tabellaGruppo(k);const fr=document.createElement('iframe');fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(fr);
  const doc=fr.contentDocument;doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(T.titolo)+'</title><style>body{font:12px/1.4 Helvetica,Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 12px;color:#555}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left}th{background:#f1f3f8}td:nth-last-child(-n+3),th:nth-last-child(-n+3){text-align:right}tfoot td{font-weight:700;border-top:2px solid #111}</style></head><body><h1>Associazione Maria SS. della Bruna · '+esc(T.titolo)+'</h1><p>'+T.n+' documenti · stampato il '+new Date().toLocaleDateString('it-IT')+'</p><table><thead><tr>'+T.cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+T.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody><tfoot><tr><td colspan="7">Totale</td><td>'+esc(T.tot)+'</td></tr></tfoot></table></body></html>');doc.close();
  setTimeout(()=>{try{fr.contentWindow.focus();fr.contentWindow.print();}catch(e){}setTimeout(()=>fr.remove(),60000);},300);}
async function pdfGruppo(k){const T=tabellaGruppo(k);try{if(!window.jspdf)await loadJs('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');}catch(e){stEl.textContent='Non riesco a preparare il PDF: riprova.';return;}
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const W=[24,22,70,32,18,34,28,34];const X=[12];W.forEach((w,i)=>X.push(X[i]+w));
  const t=s=>String(s).replace(/[^\x20-\x7E -ÿ€’]/g,'').replace(/’/g,"'");let y=16;
  const testa=()=>{pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.text(t('Associazione Maria SS. della Bruna - '+T.titolo),12,y);y+=6;pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.text(t(T.n+' documenti - '+new Date().toLocaleDateString('it-IT')),12,y);y+=7;pdf.setFillColor(241,243,248);pdf.rect(12,y-4.5,X[8]-12,6.5,'F');pdf.setFont('helvetica','bold');T.cols.forEach((c,i)=>i>=5?pdf.text(t(c),X[i+1]-2,y,{align:'right'}):pdf.text(t(c),X[i]+1,y));pdf.setFont('helvetica','normal');y+=6;};
  testa();T.rows.forEach(r=>{if(y>192){pdf.addPage();y=16;testa();}r.forEach((c,i)=>{const s=t(c);const fit=pdf.splitTextToSize(s,W[i]-2)[0]||'';i>=5?pdf.text(fit,X[i+1]-2,y,{align:'right'}):pdf.text(fit,X[i]+1,y);});pdf.setDrawColor(220);pdf.line(12,y+2,X[8],y+2);y+=6.5;});
  pdf.setFont('helvetica','bold');pdf.text('Totale',X[0]+1,y+2);pdf.text(t(T.tot),X[8]-2,y+2,{align:'right'});pdf.save(T.titolo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/-+$/,'')+'.pdf');}
conVista('v-fatt',function(){const id='v-fatt',el=document.getElementById(id);const can=CTX.canEdit(id);const L=docsV();const sum=A=>A.reduce((a,r)=>a+(+r.dati.importo||0),0);
  const val=r=>{const d=r.dati;return d.tipo==='Ricavo'&&d.imponibile!=null&&d.imponibile!==''?(+d.imponibile||0):(+d.importo||0);};const sv=A=>A.reduce((a,r)=>a+val(r),0);const br=L.filter(r=>isBruna(r.dati));const ric=br.filter(r=>r.dati.tipo==='Ricavo'),co=br.filter(r=>r.dati.tipo!=='Ricavo');const lib=ric.filter(r=>r.dati.categoria==='Donazione'),spo=ric.filter(r=>r.dati.categoria==='Sponsor');
  const dap=co.filter(r=>r.dati.pagata!=='Sì');const A=filtraDocs(FAT18).slice().sort((a,b)=>String(b.dati.data||'').localeCompare(String(a.dati.data||'')));
  cartePagina(el,{id,ey:'Economia',title:'Fatture',sub:'Tutti i documenti divisi per tipo. Tocca un documento per i dettagli, il PDF e la stampa.',
    sum:[['in','↑','Sponsorizzazioni (senza IVA)',eur(sv(spo))],['gold','♥','Liberalità e ricevute',eur(sv(lib))],['out','↓','Fornitori da pagare',eur(sum(dap))]],
    note:'Le note di credito sono già tolte dai totali. I documenti di altre feste non sono contati.',
    mini:[['Sponsor',eur(sv(spo))],['Liberalità',eur(sv(lib))],['Da pagare',eur(sum(dap))]],
    seg:{on:FAT18,list:DOCK.map(k=>[k,DOC18[k][0]+' · '+L.filter(r=>docDi(r.dati)===k&&(FED18==='tutte'||String(r.dati.edizione||'')===FED18)).length]),set:v=>FAT18=v},
    actions:[can?['Carica i documenti (anche tanti insieme)',()=>apriImport(),true]:null,['Scarica PDF dell’elenco',()=>pdfGruppo(FAT18)],['Stampa l’elenco',()=>stampaGruppo(FAT18)],canOpen('v-don')?['Donatori',()=>go('v-don')]:null].filter(Boolean),
    vuoto:'Nessun documento in «'+DOC18[FAT18][0]+'»'+(FED18!=='tutte'?' per la Bruna '+FED18:'')+'.',cards:A.map(cardDoc)});
  const seg=el.querySelector('.c12seg');const ed=h('<div class="seg wrap b26seg fat18ed">'+[['tutte','Tutte le edizioni'],['2026','Bruna 2026'],['2027','Bruna 2027']].map(([k,l])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(k===FED18)+'">'+l+'</button>').join('')+'</div>');
  ed.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{FED18=b.dataset.v;CSEL[id]=0;CSELK[id]=null;R[id]();addBack(id);}));if(seg)seg.before(ed);
  const prs=[...new Set(docsV().flatMap(r=>(r.dati.prodotti||[]).map(x=>x.p)))].sort();
  const fq=h('<div class="ev14flt fat18q"><div class="ev14q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" id="fat18q" placeholder="Cerca per sponsor, cliente, numero o socio" aria-label="Cerca un documento" value="'+esc(FQ18)+'"></div>'+(prs.length?'<div class="ev14sel"><label>Prodotto<select id="fat18p"><option value="">Tutti</option>'+prs.map(x=>'<option'+(x===FP18?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label></div>':'')+'</div>');
  const ri=()=>{CSEL[id]=0;CSELK[id]=null;R[id]();addBack(id);};let tm;fq.querySelector('#fat18q').addEventListener('input',ev=>{clearTimeout(tm);tm=setTimeout(()=>{FQ18=ev.target.value;ri();const i=document.getElementById('fat18q');if(i){i.focus();const n=i.value.length;try{i.setSelectionRange(n,n);}catch(x){}}},350);});const sp=fq.querySelector('#fat18p');if(sp)sp.addEventListener('change',()=>{FP18=sp.value;ri();});ed.after(fq);},_fatt12);

// --- Donatori: lista a parte, con i documenti di ognuno ---
PAGEX['v-don']='Donazioni e liberalità';ensureSec('v-don');ECO_G.find(g=>g.k==='fatt').p.push(['v-don','Donatori']);ECO_ID['v-don']=ECO_G.find(g=>g.k==='fatt');
const _canOpen18=canOpen;canOpen=function(id){if(id==='v-don')return canV('v-fatt');return _canOpen18(id);};
let DON18='tutte';
function donatori(){const by={};docsV().filter(r=>r.dati.categoria==='Donazione'&&isBruna(r.dati)).forEach(r=>{const d=r.dati;const k=d.piva||nrm18(d.soggetto);const x=by[k]=by[k]||{k,n:d.soggetto,piva:d.piva,docs:[]};x.docs.push(r);if((d.soggetto||'').length>(x.n||'').length)x.n=d.soggetto;});return Object.values(by);}
R['v-don']=function(){const el=document.getElementById('v-don');const L=donatori();const filt=D0=>DON18==='tutte'?D0:D0.filter(r=>String(r.dati.edizione)===DON18);const tot=x=>filt(x.docs).reduce((a,r)=>a+(+r.dati.importo||0),0);
  const V=L.filter(x=>filt(x.docs).length).sort((a,b)=>tot(b)-tot(a));const T=V.reduce((a,x)=>a+tot(x),0);
  cartePagina(el,{id:'v-don',ey:'Economia',title:'Donazioni e liberalità',sub:'Chi ha fatto un’erogazione liberale, con fatture liberalità, ricevute e note di credito. Nel bilancio stanno nella voce Donazioni.',
    sum:[['gold','♥','Liberalità'+(DON18!=='tutte'?' '+DON18:''),eur(T)],['eq','●','Donatori',String(V.length)]],note:'Le note di credito liberalità sono già tolte.',
    mini:[['Totale',eur(T)],['Donatori',String(V.length)]],seg:{on:DON18,list:[['tutte','Tutte'],['2026','Bruna 2026'],['2027','Bruna 2027']],set:v=>DON18=v},
    actions:[['Torna alle Fatture',()=>go('v-fatt')]],vuoto:'Ancora nessuna liberalità caricata.',
    cards:V.map(x=>({key:x.k,n:x.n,t:eur(tot(x)),c:'#2A9D8F',k:filt(x.docs).length+(filt(x.docs).length===1?' documento':' documenti'),s:x.piva||'',lab:x.n,
      det:box=>{box.innerHTML=righe([x.piva?['Partita IVA / Cod. fiscale',esc(x.piva)]:null,['Totale',eur(tot(x))]]);box.appendChild(elencoDocs(filt(x.docs)));}}))});};
addBack=(function(f){return function(id){f(id);if(id==='v-don'){const el=document.getElementById(id);if(!el)return;const old=el.querySelector(':scope > .ecobar');if(old)old.remove();if(typeof ecoBar==='function'){const b=ecoBar(id);const back=el.querySelector(':scope > .back');if(back)back.after(b);else el.insertBefore(b,el.firstChild);}}};})(addBack);

// --- nelle card di sponsor e fornitori: fattura, preventivo e contratto ---
function elencoDocs(L){const w=h('<div class="fat18docs"></div>');L.slice().sort((a,b)=>String(a.dati.data).localeCompare(String(b.dati.data))).forEach(r=>{const d=r.dati;const k=docDi(d);
  const x=h('<div class="fat18d" style="--c:'+DOC18[k][1]+'"><span><b>'+esc(DOC1[k])+' '+esc((d.numero||'').replace(/^Ricevuta\s*/,''))+'</b><small>'+(d.data?fmtD(d.data)+' '+String(d.data).slice(0,4):'')+(d.edizione?' · Bruna '+d.edizione:'')+'</small></span><b>'+eur(+d.importo||0)+'</b></div>');
  if(d.file&&d.file.path){const b=h('<button type="button" class="lnk2">PDF</button>');b.addEventListener('click',()=>apriFile(d.file));x.appendChild(b);}w.appendChild(x);});return w;}
function docsDi(nome,piva,rif){return docsV().filter(r=>{const d=r.dati;if(rif&&d.rif&&d.rif.id===rif)return true;if(piva&&d.piva&&d.piva===piva)return true;const a=nrm18(d.soggetto),b=nrm18(nome);return a&&b&&(a===b||a.indexOf(b)===0||b.indexOf(a)===0);});}
function boxDocumenti(nome,piva,rif,conPrev){const F=docsDi(nome,piva,rif);const P=conPrev?(VD['v-prev']||[]).filter(r=>nrm18(r.dati.fornitore)&&nrm18(r.dati.fornitore)===nrm18(nome)):[];
  const b=h('<div class="fat18box"><p class="lab">Documenti</p></div>');
  if(F.length)b.appendChild(elencoDocs(F));else b.appendChild(h('<p class="muted small" style="margin:0">Nessuna fattura caricata.</p>'));
  if(conPrev){const s=P.find(r=>r.dati.stato==='Accettato')||P[0];if(s){const x=h('<div class="fat18d" style="--c:#D9822B"><span><b>Preventivo'+(s.dati.stato==='Accettato'?' scelto':'')+'</b><small>'+esc(s.dati.voce||'')+'</small></span><b>'+eur(+s.dati.importo||0)+'</b></div>');if(s.dati.file&&s.dati.file.path){const k=h('<button type="button" class="lnk2">PDF</button>');k.addEventListener('click',()=>apriFile(s.dati.file));x.appendChild(k);}b.appendChild(x);}else b.appendChild(h('<p class="muted small" style="margin:0">Nessun preventivo.</p>'));}
  return b;}
function aggiungiDocsCard(id,campoNome,conPrev){const el=document.getElementById(id);if(!el)return;const L=VD[id]||[];el.querySelectorAll('article.card.rc').forEach(c=>{const n=(c.querySelector('.vn')||{}).textContent||'';if(!n||c.querySelector('.fat18box'))return;const r=L.find(x=>(x.dati[campoNome]||'')===n);
  const box=boxDocumenti(n,r&&r.dati.piva,r&&r.id,conPrev);if(r&&id==='v-for27'&&!(r.dati.contratto&&r.dati.contratto.path))box.appendChild(h('<p class="neg small" style="margin:4px 0 0">Contratto non allegato.</p>'));c.appendChild(box);});}
['v-sp26','v-sp27','v-for27'].forEach(id=>{const f=R[id]||(()=>renderVoce(id));R[id]=function(){const x=f.apply(this,arguments);aggiungiDocsCard(id,id==='v-for27'?'fornitore':'nome',id==='v-for27');return x;};});
const _sfor18=R['s-for'];R['s-for']=function(){_sfor18();const el=document.getElementById('s-for');if(!el)return;const agg=()=>{const n=(el.querySelector('.b26cd.on .nm')||{}).textContent;const det=el.querySelector('.c12det');if(!n||!det||det.querySelector('.fat18box'))return;det.appendChild(boxDocumenti(n,null,null,true));};
  agg();el.querySelectorAll('.b26cd').forEach(b=>b.addEventListener('click',()=>setTimeout(agg,0)));};

// --- bilancio: i documenti imputati si vedono nelle voci complessive ---
function totFatture(anno){const L=docsV().filter(r=>r.dati.imputa&&isBruna(r.dati)&&+r.dati.edizione===anno);const val=r=>{const d=r.dati;return d.tipo==='Ricavo'&&d.imponibile!=null&&d.imponibile!==''?(+d.imponibile||0):(+d.importo||0);};const s=f=>L.filter(f).reduce((a,r)=>a+val(r),0);const inc=f=>L.filter(r=>f(r)&&r.dati.pagata==='Sì').reduce((a,r)=>a+(+r.dati.importo||0),0);
  const sp=r=>r.dati.categoria==='Sponsor',lb=r=>r.dati.categoria==='Donazione',al=r=>r.dati.categoria==='Altro ricavo',fo=r=>r.dati.tipo==='Costo';
  return {n:L.length,sp:s(sp),lb:s(lb),al:s(al),fo:L.filter(fo).reduce((a,r)=>a+(+r.dati.importo||0),0),incSp:inc(sp),incLb:inc(lb),nLb:L.filter(lb).length,nSp:L.filter(sp).length};}
function boxBilFatture(anno,previsti){const T=totFatture(anno);const b=h('<section class="w h13w fat18bil"><div class="wh"><b>Dalle fatture caricate · Bruna '+anno+'</b><button type="button" class="lnk2" data-go="v-fatt">Fatture</button></div></section>');
  if(!T.n){b.appendChild(h('<p class="muted small" style="margin:0">Nessun documento imputato al '+esc(nomeBilancio(anno))+'.</p>'));return b;}
  b.appendChild(h('<div>'+righe([['Sponsorizzazioni fatturate','<b>'+eur(T.sp)+'</b>',T.nSp+' documenti'+(previsti&&previsti.sp?' · previsto '+eur(previsti.sp):'')],['Liberalità (donazioni)','<b>'+eur(T.lb)+'</b>',T.nLb+' documenti'+(previsti&&previsti.lb?' · previsto '+eur(previsti.lb):'')],T.al?['Altri ricavi','<b>'+eur(T.al)+'</b>']:null,['Incassato',eur(T.incSp+T.incLb)],T.fo?['Fatture dei fornitori',eur(T.fo)]:null])+'</div>'));
  b.appendChild(h('<p class="muted small" style="margin:0">Importi senza IVA, già al netto delle note di credito. Sono quelli registrati: il '+esc(nomeBilancio(anno))+' resta quello approvato, qui vedi a che punto sono fatture e incassi.</p>'));
  if(canOpen('v-don')){const k=h('<button type="button" class="lnk2">Elenco dei donatori ›</button>');k.addEventListener('click',()=>go('v-don'));b.appendChild(k);}return b;}
const _bil18=R['s-bil'];R['s-bil']=function(){_bil18();if(typeof editMode!=='undefined'&&editMode)return;const el=document.getElementById('s-bil');const m=el&&el.querySelector('.b26main');if(!m)return;
  const g=n=>{const G=B26G.find(x=>x[0]===n);return G?D.ric.filter(r=>G[1].includes(r.id)).reduce((a,r)=>a+(r.v26||0),0):0;};m.appendChild(boxBilFatture(2026,{sp:g('Sponsor'),lb:g('Donazioni')}));};
const _p2718=R['v-p27'];R['v-p27']=function(){_p2718();const el=document.getElementById('v-p27');const m=el&&(el.querySelector('.b26main')||el);if(m&&!m.querySelector('.fat18bil'))m.appendChild(boxBilFatture(2027,{sp:sponsorTot()}));};
