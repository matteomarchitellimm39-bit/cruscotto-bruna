/* ================= Bruna27 · Fase 2: fatture lette dal file, preventivi a confronto, fornitori 2027, bilancio modificabile ================= */
const vociBil=()=>(D.bil||[]).map(a=>a.n);
const vociPrev=()=>(D.prev||[]).flatMap(a=>a.voci.map(v=>v.n));
EL['v-fatt']={f:[['soggetto','Fornitore o cliente','t'],['tipo','È un…','s',['Costo','Ricavo']],['importo','Importo totale (€)','n'],['data','Data','d'],['numero','Numero','t'],['voce','Voce del bilancio','s',()=>vociBil().length?['Da scegliere'].concat(vociBil()):[]],['scadenza','Da pagare entro','d'],['pagata','Pagata?','s',['No','Sì']],['nota','Nota','ta'],['file','File della fattura','f']],intro:'Le fatture ricevute ed emesse. Carica il file: la piattaforma legge da sola i dati e tu controlli.',add:'Aggiungi una fattura a mano',group:'tipo'};
EL['v-prev']={f:[['voce','Voce del bilancio 2027','s',()=>vociPrev().length?vociPrev():[]],['fornitore','Fornitore','t'],['importo','Importo (€)','n'],['giorni','In quanti giorni consegna','n'],['qualita','Qualità e affidabilità','s',['3 · buona','5 · ottima','4 · molto buona','2 · sufficiente','1 · scarsa']],['regione','Da dove lavora','s',['Basilicata','Puglia','Altra regione']],['garanzie','Garanzie e condizioni','t'],['stato','Stato','s',['Arrivato','Da chiedere','Chiesto','Accettato','Scartato']],['nota','Nota','ta'],['file','File del preventivo','f']],intro:'',add:'Aggiungi un preventivo a mano',group:'voce'};
EL['v-for27']={f:[['fornitore','Fornitore','t'],['voce','Voce del bilancio 2027','s',()=>vociPrev().length?vociPrev():[]],['importo','Importo totale 2027 (€)','n'],['nota','Nota','ta'],['contratto','Contratto firmato','f']],intro:'',add:'Aggiungi un fornitore 2027',group:''};
R['v-fatt']=renderFatt;R['v-prev']=renderPrev;R['v-for27']=renderFor27;

/* --- lettura dei file --- */
const numIt=t=>{t=String(t).replace(/[€\s]/g,'');if(/,\d{1,2}$/.test(t))t=t.replace(/\./g,'').replace(',','.');else if(/\.\d{3}$/.test(t)&&!/\.\d{1,2}$/.test(t))t=t.replace(/\./g,'');return Number(t);};
const isoD=(d,m,y)=>{y=+y<100?2000+ +y:+y;d=+d;m=+m;if(!(d>=1&&d<=31&&m>=1&&m<=12&&y>2000&&y<2100))return '';return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');};
function bilDaNome(n){if(!n||!D.forn)return '';const w=n.toLowerCase().replace(/[^a-zà-ù0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>=5&&!/^(della|delle|dello|srls|societa|società|cooperativa|matera|altamura|potenza|roma|napoli|milano|bari|taranto|basilicata|puglia|servizi|group|italia)$/.test(x));
  const f=D.forn.find(f=>{const fn=f.n.toLowerCase();return w.some(x=>fn.includes(x));});if(!f)return '';const a=D.bil.find(b=>b.id===f.a);return a?a.n:'';}
function xmlFattura(txt){const doc=new DOMParser().parseFromString(txt,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('xml');
  const one=(root,n)=>{const e=root&&root.getElementsByTagNameNS('*',n)[0];return e?e.textContent.trim():'';};
  const all=(root,n)=>root?[...root.getElementsByTagNameNS('*',n)]:[];
  const anag=n=>{const r=doc.getElementsByTagNameNS('*',n)[0];if(!r)return '';return one(r,'Denominazione')||[one(r,'Nome'),one(r,'Cognome')].filter(Boolean).join(' ');};
  const ced=anag('CedentePrestatore'),ces=anag('CessionarioCommittente');if(!ced&&!ces)throw new Error('xml');
  const body=doc.getElementsByTagNameNS('*','FatturaElettronicaBody')[0]||doc;const dg=body.getElementsByTagNameNS('*','DatiGeneraliDocumento')[0];
  let imp=one(dg,'ImportoTotaleDocumento');let importo=imp?Number(imp):0;
  if(!importo){importo=all(body,'DatiRiepilogo').reduce((a,r)=>a+Number(one(r,'ImponibileImporto')||0)+Number(one(r,'Imposta')||0),0);}
  if(!importo){importo=all(body,'DettaglioPagamento').reduce((a,r)=>a+Number(one(r,'ImportoPagamento')||0),0);}
  const ricavo=/bruna/i.test(ced)&&!/bruna/i.test(ces);
  const soggetto=ricavo?ces:ced;
  const piva=n=>{const r=doc.getElementsByTagNameNS('*',n)[0];if(!r)return '';const f=r.getElementsByTagNameNS('*','IdFiscaleIVA')[0];return f?(one(f,'IdPaese')+one(f,'IdCodice')):one(r,'CodiceFiscale');};
  const imponibile=all(body,'DatiRiepilogo').reduce((a,r)=>a+Number(one(r,'ImponibileImporto')||0),0),iva=all(body,'DatiRiepilogo').reduce((a,r)=>a+Number(one(r,'Imposta')||0),0);
  return {piva:piva(ricavo?'CessionarioCommittente':'CedentePrestatore'),imponibile:Math.round(imponibile*100)/100||'',iva:Math.round(iva*100)/100||'',soggetto,tipo:ricavo?'Ricavo':'Costo',importo:Math.round(importo*100)/100||'',data:one(dg,'Data'),numero:one(dg,'Numero'),scadenza:one(body,'DataScadenzaPagamento'),nota:one(dg,'Causale').slice(0,300),voce:bilDaNome(soggetto),__come:'xml'};}
function p7mInXml(buf){let b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);
  if(/^[A-Za-z0-9+\/=\r\n]+$/.test(s.slice(0,200).trim())&&!s.includes('<')){try{s=atob(s.replace(/[^A-Za-z0-9+\/=]/g,''));}catch(e){}}
  const m=s.match(/<([\w]+:)?FatturaElettronica[\s>]/);if(!m)throw new Error('p7m');const st=s.indexOf(m[0]);const endTag='</'+(m[1]||'')+'FatturaElettronica>';const en=s.indexOf(endTag,st);if(en<0)throw new Error('p7m');
  let x=s.slice(st,en+endTag.length).replace(/\x04(\x82[\s\S]{2}|\x81[\s\S]|[\x00-\x7f])/g,'');const out=new Uint8Array(x.length);for(let i=0;i<x.length;i++)out[i]=x.charCodeAt(i)&255;
  return new TextDecoder('utf-8').decode(out);}
async function pdfTesto(file){if(!window.pdfjsLib){await loadJs('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';}
  const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const lines=[];
  for(let p=1;p<=Math.min(pdf.numPages,4);p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();let y=null,cur2='';
    tc.items.forEach(it=>{const yy=Math.round(it.transform[5]);if(y!==null&&Math.abs(yy-y)>3){lines.push(cur2.trim());cur2='';}y=yy;cur2+=it.str+' ';});lines.push(cur2.trim());}
  return lines.filter(Boolean);}
function leggiTesto(lines){const T=lines.join('\n');const AM=/(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2})/g;const o={__come:'pdf'};
  let best=null;lines.forEach((l,i)=>{if(/totale|da pagare|netto a pagare|importo dovuto/i.test(l)){const pool=(l.match(AM)||[]).concat(i+1<lines.length&&!(l.match(AM))?(lines[i+1].match(AM)||[]):[]);
    const v=Math.max(0,...pool.map(numIt));if(v){const w=/da pagare|documento|fattura|generale|dovuto/i.test(l)?2:1;if(!best||w>best.w||(w===best.w&&v>=best.v))best={v,w};}}});
  if(best)o.importo=best.v;else{const all=(T.match(AM)||[]).map(numIt);if(all.length)o.importo=Math.max(...all);}
  const dm=T.match(/(?:data\s*(?:documento|fattura|emissione)?\s*[:.]?\s*)?\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/i);if(dm)o.data=isoD(dm[1],dm[2],dm[3]);
  const nm=T.match(/(?:fattura|documento)\s*(?:n(?:r|um|umero)?\.?|n°|nº)\s*[:.]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{0,20})/i)||T.match(/numero\s*(?:documento|fattura)?\s*[:.]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{0,20})/i);if(nm)o.numero=nm[1];
  let sog='';const ci=lines.findIndex(l=>/cedente|prestatore|fornitore|mittente/i.test(l));
  if(ci>=0){const rest=lines[ci].replace(/.*(cedente\s*\/?\s*prestatore|fornitore|mittente)\s*[:.]?/i,'').trim();sog=rest.length>2?rest:(lines[ci+1]||'');}
  const addr=l=>/\b(via|viale|piazza|corso|contrada|c\.da|vico|largo|zona)\b|\b\d{5}\b|\(\w\w\)/i.test(l);
  if(!sog){const iv=lines.findIndex(l=>/p\.?\s*iva|partita\s+iva/i.test(l)&&!/bruna/i.test(l));if(iv>=0){let k=iv;const before=lines[iv].replace(/[-–,]?\s*(p\.?\s*iva|partita\s+iva).*$/i,'').trim();
    if(before.length>2&&!addr(before))sog=before;else{k=iv-1;while(k>=0&&(addr(lines[k])||!/[a-z]{3}/i.test(lines[k])))k--;if(k>=0&&!/fattura|bruna/i.test(lines[k]))sog=lines[k];}}}
  if(!sog)sog=lines.find(l=>/[a-z]{3}/i.test(l)&&!/fattura|bruna|pagina|documento/i.test(l))||'';
  o.soggetto=sog.replace(/\s{2,}/g,' ').replace(/[:;,.\-\s]+$/,'').slice(0,80);
  o.tipo=ci>=0&&/bruna/i.test(lines[ci]+' '+(lines[ci+1]||''))?'Ricavo':'Costo';
  const sc=T.match(/scadenza[^\d]{0,30}(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})/i);if(sc)o.scadenza=isoD(sc[1],sc[2],sc[3]);
  const pv=T.match(/(?:p\.?\s*iva|partita\s+iva)\s*[:.]?\s*(?:IT)?\s*(\d{11})/gi);if(pv){const all2=pv.map(x=>x.match(/(\d{11})/)[1]);o.piva=all2[0];}
  const im=T.match(/imponibile[^\d\n]{0,20}(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/i);if(im)o.imponibile=numIt(im[1]);
  const iv=T.match(/(?:iva|imposta)[^\d\n]{0,25}(?:\d{1,2}\s*%[^\d\n]{0,10})?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/i);if(iv)o.iva=numIt(iv[1]);
  o.voce=bilDaNome(o.soggetto);return o;}
async function leggiFile(file){const o=await leggiFile0(file);if((o.__come==='foto'||o.__come==='vuoto')&&AIFOTO){const x=await leggiConAI(file,o.__come==='vuoto');if(x)return x;}return o;}
async function leggiFile0(file){const n=(file.name||'').toLowerCase();
  try{if(n.endsWith('.xml'))return xmlFattura(await file.text());
    if(n.endsWith('.p7m'))return xmlFattura(p7mInXml(await file.arrayBuffer()));
    if(n.endsWith('.pdf')||file.type==='application/pdf'){const L=await pdfTesto(file);if(!L.join('').trim())return {__come:'vuoto'};return leggiTesto(L);}
  }catch(e){return {__come:'errore'};}
  if((file.type||'').startsWith('image/'))return {__come:'foto'};return {__come:'altro'};}
const COME={xml:'Ho letto la fattura elettronica: i dati sono quelli ufficiali.',pdf:'Ho letto il PDF: controlla soprattutto fornitore e importo prima di salvare.',vuoto:'Il PDF è una scansione senza testo: scrivi tu i dati, il file resta allegato.',foto:'Dalle foto non leggo ancora i dati: scrivili tu, la foto resta allegata.',errore:'Non sono riuscito a leggere il file: scrivi tu i dati, il file resta allegato.',altro:'Questo tipo di file non lo leggo: scrivi tu i dati, il file resta allegato.',ai:'L’assistente ha letto il documento: controlla tutti i dati prima di salvare.'};
function caricaELeggi(voce,titolo){
  const d=sheet(titolo,'<div class="steps"><i class="on"></i><i></i><i></i></div><p class="muted">Passo 1 di 3 · scegli il file</p><label class="drop"><input type="file" id="cf" accept=".xml,.p7m,.pdf,application/pdf,image/*">'+svg(IC2.doc,30)+'<b>Tocca per scegliere</b><span>Fattura elettronica (XML o P7M), PDF oppure foto</span></label>','Leggi il file',async(dl)=>{const f=dl.querySelector('#cf').files[0];if(!f){dl.querySelector('.smsg').textContent='Scegli prima un file.';return false;}
    dl.querySelector('.smsg').textContent='Leggo il file…';const o=await leggiFile(f);o.__file=f;
    setTimeout(()=>{const s2=editRec(voce,null,o,'Controlla quello che ho letto');const box=document.querySelectorAll('.sdlg');const last=box[box.length-1];if(last){const ed=last.querySelector('.edform');ed.insertBefore(h('<div class="readok"><span class="orb"></span><span><b>'+esc(f.name)+'</b><br>'+esc(COME[o.__come]||'')+'</span></div>'),ed.firstChild);ed.insertBefore(h('<div class="steps"><i class="on"></i><i class="on"></i><i></i></div>'),ed.firstChild);const ok=last.querySelector('[data-ok]');ok.textContent='È giusto, salva';}},30);});
  d.querySelector('#cf').addEventListener('change',e=>{const f=e.target.files[0];if(f)d.querySelector('.drop b').textContent=f.name;});}

/* --- Fatture --- */
function renderFatt(){const id='v-fatt',el=document.getElementById(id);el.innerHTML='';addBack(id);const E=EL[id],L=VD[id]||[],can=CTX.canEdit(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Economia</span><h2>Fatture</h2><p>'+esc(E.intro)+'</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(can){const b=h('<div class="big-btns"><button type="button" class="bb dark big">'+svg(IC2.doc,20)+' Carica una fattura</button><button type="button" class="bb soft">+ Scrivi a mano</button></div>');b.children[0].addEventListener('click',()=>caricaELeggi(id,'Carica una fattura'));b.children[1].addEventListener('click',()=>editRec(id,null));el.appendChild(b);}
  const fv=elFilt[id]||'';const co=L.filter(r=>r.dati.tipo!=='Ricavo'),ri=L.filter(r=>r.dati.tipo==='Ricavo');const sum=A=>A.reduce((a,r)=>a+(+r.dati.importo||0),0);
  const dap=co.filter(r=>r.dati.pagata!=='Sì');
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Fatture di costo</span><b>'+eur(sum(co))+'</b></div><div class="kpi"><span>Fatture di ricavo</span><b>'+eur(sum(ri))+'</b></div><div class="kpi dark"><span>Ancora da pagare</span><b>'+eur(sum(dap))+'</b></div></div>'));
  const seg=h('<div class="seg"><button type="button" aria-pressed="'+(!fv)+'">Tutte ('+L.length+')</button><button type="button" data-v="Costo" aria-pressed="'+(fv==='Costo')+'">Costi ('+co.length+')</button><button type="button" data-v="Ricavo" aria-pressed="'+(fv==='Ricavo')+'">Ricavi ('+ri.length+')</button><button type="button" data-v="dap" aria-pressed="'+(fv==='dap')+'">Da pagare ('+dap.length+')</button></div>');
  seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{elFilt[id]=b.dataset.v||'';renderFatt();}));el.appendChild(seg);
  const LL=L.filter(r=>!fv||(fv==='dap'?(r.dati.tipo!=='Ricavo'&&r.dati.pagata!=='Sì'):(r.dati.tipo||'Costo')===fv)).sort((a,b)=>String(b.dati.data||'').localeCompare(String(a.dati.data||'')));
  const g=h('<div class="cgrid"></div>');const today=todayISO();
  LL.forEach(r=>{const d=r.dati;const late=d.tipo!=='Ricavo'&&d.pagata!=='Sì'&&d.scadenza&&d.scadenza<today;
    const c=h('<article class="card rc"><div class="chips"><span class="chip2 '+(d.tipo==='Ricavo'?'ok':'')+'">'+esc(d.tipo||'Costo')+'</span>'+(d.tipo!=='Ricavo'?'<span class="chip2 '+(d.pagata==='Sì'?'ok':late?'ko':'')+'">'+(d.pagata==='Sì'?'Pagata':late?'Scaduta':'Da pagare')+'</span>':'')+'</div><b class="vn">'+esc(d.soggetto||'Senza nome')+'</b><b class="amt">'+(d.importo!==''&&d.importo!=null?eur(+d.importo):'importo da inserire')+'</b>'+
      (d.data?'<div class="fact2"><span>Data</span><b>'+fmtD(d.data)+'</b></div>':'')+(d.numero?'<div class="fact2"><span>Numero</span><b>'+esc(d.numero)+'</b></div>':'')+(d.voce&&d.voce!=='Da scegliere'?'<div class="fact2"><span>Voce</span><b>'+esc(d.voce)+'</b></div>':'')+(d.scadenza&&d.tipo!=='Ricavo'?'<div class="fact2"><span>Da pagare entro</span><b>'+fmtD(d.scadenza)+'</b></div>':'')+'</article>');
    if(d.file&&d.file.path)c.appendChild(fileBtn(d.file,'Apri la fattura'));
    if(can&&d.tipo!=='Ricavo'&&d.pagata!=='Sì'){const p=h('<button type="button" class="bb sm">Segna come pagata</button>');p.addEventListener('click',async()=>{await CTX.sb.from('voci_dati').update({dati:Object.assign({},d,{pagata:'Sì'}),aggiornato:new Date().toISOString()}).eq('id',r.id);await loadVD();renderFatt();});c.appendChild(p);}
    if(can)c.appendChild(rowBtns(id,r));g.appendChild(c);});
  el.appendChild(g);
  if(!LL.length)el.appendChild(h('<div class="card soon"><p>'+(L.length?'Nessuna fattura con questo filtro.':'Ancora nessuna fattura. Tocca «Carica una fattura» e scegli il file: i dati li leggo io.')+'</p></div>'));
  const byV={};co.forEach(r=>{const v=r.dati.voce&&r.dati.voce!=='Da scegliere'?r.dati.voce:'Senza voce';byV[v]=(byV[v]||0)+(+r.dati.importo||0);});
  const ks=Object.keys(byV);if(ks.length){const mx=Math.max(...Object.values(byV));el.appendChild(h('<section class="card"><h3>Costi per voce del bilancio</h3>'+ks.sort((a,b)=>byV[b]-byV[a]).map(k=>'<div class="bar2"><div><span>'+esc(k)+'</span><b>'+eur(byV[k])+'</b></div><i><i style="width:'+(byV[k]/mx*100)+'%;background:var(--acc)"></i></i></div>').join('')+'</section>'));}}

/* --- Preventivi: confronto e scelta --- */
const qv=d=>parseInt(d.qualita||'3',10)||3;
const REGP={'Basilicata':1,'Puglia':0.6,'Altra regione':0.3};
function punteggi(G){const ok=G.filter(r=>r.dati.stato!=='Scartato'&&r.dati.stato!=='Da chiedere'&&r.dati.stato!=='Chiesto'&&+r.dati.importo>0);if(!ok.length)return {};
  const minP=Math.min(...ok.map(r=>+r.dati.importo));const gg=ok.map(r=>+r.dati.giorni).filter(x=>x>0);const minG=gg.length?Math.min(...gg):0;const P={};
  ok.forEach(r=>{const d=r.dati;const sp=minP/(+d.importo),sq=qv(d)/5,st=minG&&+d.giorni>0?minG/(+d.giorni):0.7,sr=REGP[d.regione]!=null?REGP[d.regione]:0.5;
    P[r.id]={tot:Math.round((sp*0.5+sq*0.3+st*0.1+sr*0.1)*100),sp,sq,st,sr};});return P;}
function perche(r,G,P){const d=r.dati;const ok=G.filter(x=>P[x.id]&&x.id!==r.id);const out=[];
  if(ok.length){const maxP=Math.max(...ok.map(x=>+x.dati.importo));const minP=Math.min(...ok.map(x=>+x.dati.importo));
    if(+d.importo<=minP)out.push('è il più economico'+(maxP>+d.importo?' ('+eur(maxP-+d.importo)+' in meno del più caro)':''));else out.push('costa '+eur(+d.importo-minP)+' più del più economico, ma vale di più');}
  out.push('qualità '+qv(d)+' su 5');if(+d.giorni)out.push('consegna in '+d.giorni+' giorni');if(d.regione==='Basilicata')out.push('lavora in Basilicata');
  return out.join(', ');}
function renderPrev(){const id='v-prev',el=document.getElementById(id);el.innerHTML='';addBack(id);const L=VD[id]||[],can=CTX.canEdit(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Economia</span><h2>Preventivi</h2><p>Per ogni voce del bilancio metti i preventivi arrivati: la piattaforma li confronta (prezzo, qualità, tempi, vicinanza) e ti consiglia il migliore. Tu decidi.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  if(can){const b=h('<div class="big-btns"><button type="button" class="bb dark">'+svg(IC2.doc,20)+' Carica un preventivo</button><button type="button" class="bb soft">+ Scrivi a mano</button><button type="button" class="bb soft">Chiedi un preventivo a un collega</button></div>');
    b.children[0].addEventListener('click',()=>caricaELeggi(id,'Carica un preventivo'));b.children[1].addEventListener('click',()=>editRec(id,null));b.children[2].addEventListener('click',chiediPrev);el.appendChild(b);}
  const byV={};L.forEach(r=>{const v=r.dati.voce||'Senza voce';(byV[v]=byV[v]||[]).push(r);});
  const ks=Object.keys(byV).sort((a,b)=>{const ac=byV[a].some(r=>r.dati.stato==='Accettato'),bc=byV[b].some(r=>r.dati.stato==='Accettato');return ac-bc||a.localeCompare(b);});
  const att=L.filter(r=>r.dati.stato==='Da chiedere'||r.dati.stato==='Chiesto').length;
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Voci con preventivi</span><b>'+ks.length+'</b></div><div class="kpi"><span>Da chiedere o in attesa</span><b>'+att+'</b></div><div class="kpi dark"><span>Già scelti</span><b>'+L.filter(r=>r.dati.stato==='Accettato').length+'</b></div></div>'));
  ks.forEach(v=>{const G=byV[v];const P=punteggi(G);const acc=G.find(r=>r.dati.stato==='Accettato');
    const ord=G.slice().sort((a,b)=>((P[b.id]||{}).tot||-1)-((P[a.id]||{}).tot||-1));const best=!acc&&ord.find(r=>P[r.id]);const nOk=Object.keys(P).length;
    const sec=h('<section class="card pv"><div class="wh"><h3>'+esc(v)+'</h3><span class="chip2 '+(acc?'ok':'')+'">'+(acc?'Scelto: '+esc(acc.dati.fornitore):G.length+(G.length===1?' preventivo':' preventivi'))+'</span></div>'+(!acc&&nOk===1?'<p class="muted small">Con un solo preventivo non c’è confronto: chiedine almeno un altro.</p>':'')+'</section>');
    ord.forEach(r=>{const d=r.dati,p=P[r.id];const isBest=best&&best.id===r.id&&nOk>1;
      const c=h('<div class="offer'+(isBest?' best':'')+(d.stato==='Scartato'?' off':'')+'"><div class="oh2"><b>'+esc(d.fornitore||'Fornitore da scegliere')+'</b><span class="amt">'+(+d.importo?eur(+d.importo):'—')+'</span></div><div class="chips">'+(isBest?'<span class="chip2 ok">Consigliato</span>':'')+'<span class="chip2'+(d.stato==='Accettato'?' ok':d.stato==='Scartato'?' ko':'')+'">'+esc(d.stato||'Arrivato')+'</span>'+(p?'<span class="chip2">Punteggio '+p.tot+' su 100</span>':'')+'</div>'+
        (isBest?'<p class="why"><span class="orb sm"></span>Lo consiglio perché '+esc(perche(r,G,P))+'.</p>':(p?'<p class="muted small">'+esc(perche(r,G,P))+'</p>':''))+(d.chi?'<p class="muted small">Lo chiede '+esc(nome(d.chi))+(d.entro?' entro il '+fmtD(d.entro):'')+'</p>':'')+'</div>');
      if(d.file&&d.file.path)c.appendChild(fileBtn(d.file,'Apri il preventivo'));
      if(can){const bx=h('<div class="rowb"></div>');
        if(!acc&&+d.importo>0&&d.stato!=='Scartato'){const a=h('<button type="button" class="okb">Scegli questo</button>');a.addEventListener('click',()=>accetta(r,G));bx.appendChild(a);}
        const m=h('<button type="button">Modifica</button>');m.addEventListener('click',()=>editRec(id,r));bx.appendChild(m);
        const x=h('<button type="button" class="ko">Elimina</button>');x.addEventListener('click',()=>ask('Eliminare il preventivo di «'+(d.fornitore||'')+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);await loadVD();renderPrev();}));bx.appendChild(x);c.appendChild(bx);}
      sec.appendChild(c);});
    if(!acc)aiPrevBtn(sec,G);
    if(can&&!acc){const a=h('<button type="button" class="lnk2">+ Aggiungi un preventivo per questa voce</button>');a.addEventListener('click',()=>editRec(id,null,{voce:v}));sec.appendChild(a);}
    el.appendChild(sec);});
  if(!L.length)el.appendChild(h('<div class="card soon"><p>Ancora nessun preventivo.'+(can?' Caricane uno o chiedilo a un collega.':'')+'</p></div>'));
  el.appendChild(h('<p class="muted small">Come scelgo: prezzo 50%, qualità e affidabilità 30%, tempi di consegna 10%, vicinanza (Basilicata prima) 10%. È un consiglio: la scelta resta vostra.</p>'));}
function chiediPrev(){const ppl=Object.values(PEOPLE);const vv=vociPrev();
  sheet('Chiedi un preventivo','<div class="ctl"><label for="cp_v">Per quale voce</label>'+(vv.length?'<select id="cp_v">'+vv.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select>':'<input type="text" id="cp_v">')+'</div><div class="ctl"><label for="cp_f">A quale fornitore (se lo sai)</label><input type="text" id="cp_f"></div><div class="ctl"><label for="cp_p">Chi lo chiede</label><select id="cp_p">'+ppl.map(p=>'<option value="'+p.id+'"'+(p.id===CTX.user.id?' selected':'')+'>'+esc(p.nome||p.email)+(p.id===CTX.user.id?' (io)':'')+'</option>').join('')+'</select></div><div class="ctl"><label for="cp_d">Entro quando</label><input type="date" id="cp_d" min="'+todayISO()+'"></div>','Invia la richiesta',async(dl)=>{
    const v=dl.querySelector('#cp_v').value.trim();if(!v){dl.querySelector('.smsg').textContent='Scegli la voce.';return false;}const chi=dl.querySelector('#cp_p').value,entro=dl.querySelector('#cp_d').value||null,f=dl.querySelector('#cp_f').value.trim();
    const {error}=await CTX.sb.from('voci_dati').insert({voce:'v-prev',dati:{voce:v,fornitore:f,importo:'',stato:'Da chiedere',chi,entro}});if(error)throw new Error(error.message);
    await CTX.sb.from('compiti').insert({per:chi,titolo:'Chiedi un preventivo per «'+v+'»'+(f?' a '+f:''),entro});
    await Promise.all([loadVD(),loadSocial()]);renderPrev();stEl.textContent=chi===CTX.user.id?'Promemoria aggiunto nei tuoi compiti.':'Richiesta inviata: '+nome(chi)+' riceve una notifica.';});}
function accetta(r,G){const d=r.dati;
  sheet('Scegli «'+(d.fornitore||'')+'»','<p style="font-size:17px">Per <b>'+esc(d.voce)+'</b> scegli <b>'+esc(d.fornitore||'')+'</b> a <b>'+eur(+d.importo)+'</b>. Gli altri preventivi della voce diventano «Scartato».</p><p class="muted">Creo la scheda nei <b>Fornitori 2027</b> con due pagamenti (acconto e saldo) da sistemare, e ti ricordo di allegare il contratto.</p>','Sì, scegli questo',async()=>{
    const now=new Date().toISOString();
    await CTX.sb.from('voci_dati').update({dati:Object.assign({},d,{stato:'Accettato'}),aggiornato:now}).eq('id',r.id);
    for(const x of G)if(x.id!==r.id&&x.dati.stato!=='Scartato')await CTX.sb.from('voci_dati').update({dati:Object.assign({},x.dati,{stato:'Scartato'}),aggiornato:now}).eq('id',x.id);
    const tot=+d.importo,acc=Math.round(tot*0.3);
    const {error}=await CTX.sb.from('voci_dati').insert({voce:'v-for27',dati:{fornitore:d.fornitore,voce:d.voce,importo:tot,nota:d.garanzie||'',pagamenti:[{n:'Acconto alla firma',data:'',importo:acc,pagato:false},{n:'Saldo a lavoro finito',data:'',importo:tot-acc,pagato:false}],da_prev:r.id,contratto:null}});if(error)throw new Error(error.message);
    await CTX.sb.from('compiti').insert({per:CTX.user.id,titolo:'Allega il contratto di '+d.fornitore+' (Fornitori 2027)',privato:false});
    await Promise.all([loadVD(),loadSocial()]);if(canV('v-for27'))go('v-for27');else renderPrev();stEl.textContent='Scelto. Creata la scheda del fornitore 2027.';});}

/* --- Fornitori 2027 --- */
function prossimi(L,giorni){const lim=new Date();lim.setDate(lim.getDate()+giorni);const li=lim.toISOString().slice(0,10);const out=[];
  L.forEach(r=>(r.dati.pagamenti||[]).forEach((p,i)=>{if(!p.pagato&&p.data&&p.data<=li)out.push({r,p,i});}));return out.sort((a,b)=>a.p.data.localeCompare(b.p.data));}
function renderFor27(){const id='v-for27',el=document.getElementById(id);el.innerHTML='';addBack(id);const L=VD[id]||[],can=CTX.canEdit(id);
  el.appendChild(h('<div class="sh"><span class="eyb">Economia</span><h2>Fornitori 2027</h2><p>I fornitori scelti per il 2027: quanto costano, quando si pagano, il contratto. Nascono da soli quando scegli un preventivo.</p><div class="big-btns" style="margin-top:12px"><button type="button" class="bb soft pdfx">⤓ Scarica in PDF</button></div></div>'));
  const tot=L.reduce((a,r)=>a+(+r.dati.importo||0),0);let pag=0;L.forEach(r=>(r.dati.pagamenti||[]).forEach(p=>{if(p.pagato)pag+=+p.importo||0;}));
  el.appendChild(h('<div class="big3"><div class="kpi"><span>Impegnato 2027</span><b>'+eur(tot)+'</b></div><div class="kpi"><span>Già pagato</span><b>'+eur(pag)+'</b></div><div class="kpi dark"><span>Da pagare</span><b>'+eur(tot-pag)+'</b></div></div>'));
  const nx=prossimi(L,30);if(nx.length)el.appendChild(h('<section class="card"><h3>Pagamenti dei prossimi 30 giorni</h3>'+nx.map(x=>'<div class="rq"><div><b>'+esc(x.r.dati.fornitore)+'</b><span class="'+(x.p.data<todayISO()?'neg':'')+'">'+esc(x.p.n||'Pagamento')+' · '+(x.p.data<todayISO()?'scaduto il ':'entro il ')+fmtD(x.p.data)+'</span></div><b>'+eur(+x.p.importo||0)+'</b></div>').join('')+'</section>'));
  if(can)el.appendChild(addBtn('+ '+EL[id].add,()=>editFor27(null)));
  const g=h('<div class="cgrid"></div>');const fatt=VD['v-fatt']||[];
  L.forEach(r=>{const d=r.dati;const P=d.pagamenti||[];const sp=P.reduce((a,p)=>a+(+p.importo||0),0);
    const nrm=x=>String(x||'').toLowerCase().replace(/\b(s\.?r\.?l\.?s?|s\.?n\.?c\.?|s\.?a\.?s\.?|s\.?p\.?a\.?)\b/g,'').replace(/[^a-z0-9à-ù]+/g,' ').trim();const key=nrm(d.fornitore);const ff=key.length<3?[]:fatt.filter(f=>{const k2=nrm(f.dati.soggetto);return k2&&(k2===key||k2.startsWith(key+' ')||key.startsWith(k2+' '));});
    const c=h('<article class="card rc"><div class="chips"><span class="chip2 '+(d.contratto?'ok':'ko')+'">'+(d.contratto?'Contratto allegato':'Contratto da allegare')+'</span></div><b class="vn">'+esc(d.fornitore||'')+'</b><b class="amt">'+eur(+d.importo||0)+'</b><div class="fact2"><span>Voce</span><b>'+esc(d.voce||'—')+'</b></div>'+
      '<div class="lab">Pagamenti</div>'+(P.length?P.map((p,i)=>'<label class="todo pay"><input type="checkbox" data-pi="'+i+'"'+(p.pagato?' checked':'')+(can?'':' disabled')+'><span><b>'+eur(+p.importo||0)+'</b> · '+esc(p.n||'Pagamento')+' <em>'+(p.data?'entro il '+fmtD(p.data):'data da decidere')+'</em></span></label>').join(''):'<p class="muted small">Nessun pagamento inserito.</p>')+
      (Math.round(sp)!==Math.round(+d.importo||0)&&P.length?'<p class="neg small">I pagamenti sommano '+eur(sp)+', il totale è '+eur(+d.importo||0)+'.</p>':'')+
      (ff.length?'<div class="fact2"><span>Fatture arrivate</span><b>'+ff.length+' · '+eur(ff.reduce((a,f)=>a+(+f.dati.importo||0),0))+'</b></div>':'')+'</article>');
    c.querySelectorAll('[data-pi]').forEach(x=>x.addEventListener('change',async()=>{const np=P.map((p,i)=>i===+x.dataset.pi?Object.assign({},p,{pagato:x.checked}):p);await CTX.sb.from('voci_dati').update({dati:Object.assign({},d,{pagamenti:np}),aggiornato:new Date().toISOString()}).eq('id',r.id);await loadVD();renderFor27();}));
    if(d.contratto&&d.contratto.path)c.appendChild(fileBtn(d.contratto,'Apri il contratto'));
    else if(can){const u=h('<label class="bb dark sm upl">Allega il contratto<input type="file" accept=".pdf,image/*,.doc,.docx" hidden></label>');u.querySelector('input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;stEl.textContent='Carico il contratto…';try{const k=await carica(f,id);await CTX.sb.from('voci_dati').update({dati:Object.assign({},d,{contratto:k}),aggiornato:new Date().toISOString()}).eq('id',r.id);
        const t=COMP.find(x=>!x.fatto&&x.titolo==='Allega il contratto di '+d.fornitore+' (Fornitori 2027)');if(t)await CTX.sb.from('compiti').update({fatto:true}).eq('id',t.id);await Promise.all([loadVD(),loadSocial()]);renderFor27();stEl.textContent='Contratto allegato.';}catch(err){stEl.textContent=err.message;}});c.appendChild(u);}
    if(can){const b=h('<div class="rowb"><button type="button">Modifica e pagamenti</button><button type="button" class="ko">Elimina</button></div>');b.children[0].addEventListener('click',()=>editFor27(r));b.children[1].addEventListener('click',()=>ask('Eliminare «'+(d.fornitore||'')+'»?','Elimina',async()=>{await CTX.sb.from('voci_dati').delete().eq('id',r.id);await loadVD();renderFor27();}));c.appendChild(b);}
    g.appendChild(c);});
  el.appendChild(g);if(!L.length)el.appendChild(h('<div class="card soon"><p>Ancora nessun fornitore 2027. Nascono quando scegli un preventivo, oppure aggiungili a mano.</p></div>'));}
function editFor27(r){const d=r?JSON.parse(JSON.stringify(r.dati)):{fornitore:'',voce:'',importo:'',nota:'',pagamenti:[{n:'Acconto alla firma',data:'',importo:'',pagato:false},{n:'Saldo',data:'',importo:'',pagato:false}]};
  const E=EL['v-for27'];const rowP=(p,i)=>'<div class="prow" data-i="'+i+'"><input type="text" class="pn2" value="'+esc(p.n||'')+'" placeholder="Acconto, saldo…" aria-label="Descrizione"><input type="date" class="pd" value="'+esc(p.data||'')+'" aria-label="Data"><input type="number" class="pi" step="any" inputmode="decimal" value="'+esc(p.importo===''?'':p.importo)+'" placeholder="€" aria-label="Importo"><button type="button" class="px" aria-label="Togli">×</button></div>';
  const dl=sheet(r?'Modifica fornitore 2027':'Nuovo fornitore 2027',E.f.filter(f=>f[2]!=='f').map(f=>fieldHtml(f,d[f[0]])).join('')+'<div class="lab">Pagamenti (descrizione, data, importo)</div><div class="plist">'+(d.pagamenti||[]).map(rowP).join('')+'</div><button type="button" class="lnk2" id="padd">+ Aggiungi un pagamento</button><button type="button" class="lnk2" id="pdiv">Dividi il totale in parti uguali</button>','Salva',async(x)=>{
    const o=Object.assign({},d);E.f.filter(f=>f[2]!=='f').forEach(([k,,t])=>{let v=x.querySelector('#fx_'+k).value;if(t==='n')v=v===''?'':Number(String(v).replace(',','.'));o[k]=typeof v==='string'?v.trim():v;});
    if(!o.fornitore){x.querySelector('.smsg').textContent='Scrivi il fornitore.';return false;}
    o.pagamenti=[...x.querySelectorAll('.prow')].map(rw=>{const old=(d.pagamenti||[])[+rw.dataset.i]||{};return {n:rw.querySelector('.pn2').value.trim(),data:rw.querySelector('.pd').value,importo:rw.querySelector('.pi').value===''?'':Number(rw.querySelector('.pi').value),pagato:!!old.pagato};}).filter(p=>p.n||p.data||p.importo!=='');
    const q=r?CTX.sb.from('voci_dati').update({dati:o,aggiornato:new Date().toISOString()}).eq('id',r.id):CTX.sb.from('voci_dati').insert({voce:'v-for27',dati:o});const {error}=await q;if(error)throw new Error(error.message);await loadVD();renderFor27();});
  let n=(d.pagamenti||[]).length;const pl=dl.querySelector('.plist');
  pl.addEventListener('click',e=>{if(e.target.classList.contains('px'))e.target.closest('.prow').remove();});
  dl.querySelector('#padd').addEventListener('click',()=>{pl.appendChild(h(rowP({n:'',data:'',importo:''},n++)));});
  dl.querySelector('#pdiv').addEventListener('click',()=>{const t=Number(dl.querySelector('#fx_importo').value)||0;const rows=[...pl.querySelectorAll('.prow')];if(!rows.length||!t)return;const part=Math.floor(t/rows.length);rows.forEach((rw,i)=>{rw.querySelector('.pi').value=i===rows.length-1?t-part*(rows.length-1):part;});});}

/* --- Bilancio 2026: elimina e aggiungi voci (in modalità modifica) --- */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-bdel],[data-badd],[data-bres],[data-baded]');if(!t)return;e.preventDefault();e.stopPropagation();
  if(!CTX.canEdit('s-bil')){stEl.textContent='Puoi guardare il bilancio, ma non modificarlo.';return;}
  S.bilx=S.bilx||{del:{},add:[]};
  if(t.dataset.bdel){const k=t.dataset.bdel;ask('Eliminare questa voce dal bilancio 2026?','Elimina',async()=>{if(k.startsWith('n:'))S.bilx.add=S.bilx.add.filter(x=>x.id!==k.slice(2));else S.bilx.del[k]=true;changed();});}
  else if(t.dataset.bres){const a=t.dataset.bres;Object.keys(S.bilx.del).forEach(k=>{if(k.split('.')[0]===a)delete S.bilx.del[k];});changed();}
  else{const a=+(t.dataset.badd||0),x=t.dataset.baded?S.bilx.add.find(y=>y.id===t.dataset.baded):null;
    sheet(x?'Modifica la voce':'Nuova voce del bilancio 2026','<div class="ctl"><label for="bn">Nome della voce</label><input type="text" id="bn" value="'+esc(x?x.n:'')+'"></div><div class="ctl"><label for="bv">Importo (€)</label><input type="number" id="bv" step="any" inputmode="decimal" value="'+esc(x?x.v:'')+'"></div>','Salva',async(dl)=>{const n=dl.querySelector('#bn').value.trim(),v=Number(dl.querySelector('#bv').value)||0;if(!n){dl.querySelector('.smsg').textContent='Scrivi il nome.';return false;}
      if(x){x.n=n;x.v=v;}else S.bilx.add.push({id:'b'+Date.now().toString(36),a,n,v});changed();});}});
