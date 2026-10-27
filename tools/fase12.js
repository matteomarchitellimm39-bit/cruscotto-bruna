/* ================= Bruna27 · le altre sezioni di Economia a carte (stesso schema del Bilancio 2026) ================= */
// Schema comune: a sinistra il riassunto, al centro carte colorate che scorrono, sotto il dettaglio della carta scelta.
// Per modificare tutto come prima resta la «vista completa» di ogni pagina.
const CSEL={},VISTA={},CSELK={};
const PAL12=['#2F63F0','#2A9D8F','#8A6CF0','#E2A23A','#5AA0F2','#182C6B','#D9534F','#3F8F4F','#94A3C0','#B5527E'];
const OK12='#3F8F4F',KO12='#D9534F',GOLD12='#E2A23A',BLU12='#2F63F0';
function sumRows(rows){return rows.map(([cls,ic,l,v,vc])=>'<div class="b26r"><span class="ar '+(cls||'')+'">'+ic+'</span><span>'+l+'</span><b class="'+(vc||'')+'">'+v+'</b></div>').join('');}
function cartePagina(el,cfg){el.innerHTML='';const id=cfg.id;const L=cfg.cards||[];let sel=CSEL[id]||0;if(CSELK[id]!=null){const ki=L.findIndex(x=>x.key===CSELK[id]);if(ki>=0)sel=ki;}if(sel>=L.length)sel=0;if(L[sel]&&L[sel].key!=null)CSELK[id]=L[sel].key;
  const w=h('<div class="b26 c12"><aside class="b26sum">'+sumRows(cfg.sum)+(cfg.note?'<div class="b26reg">'+cfg.note+'</div>':'')+'<div class="c12sbtn"></div><button type="button" class="bb soft sm pdfx">⤓ Scarica in PDF</button></aside>'+
    '<div class="b26main"><div class="sh"><span class="eyb">'+esc(cfg.ey||'Economia')+'</span><h2>'+esc(cfg.title)+'</h2><p>'+esc(cfg.sub||'')+'</p></div>'+
    '<div class="b26mini">'+(cfg.mini||[]).map(([l,v,c])=>'<div><span>'+l+'</span><b class="'+(c||'')+'">'+v+'</b></div>').join('')+'</div><div class="c12act"></div>'+
    (cfg.seg?'<div class="seg wrap b26seg c12seg">'+cfg.seg.list.map(([k,l])=>'<button type="button" data-v="'+esc(k)+'" aria-pressed="'+(k===cfg.seg.on)+'">'+esc(l)+'</button>').join('')+'</div>':'')+
    (L.length?'<div class="b26wrap"><button type="button" class="b26nav l" aria-label="Carte precedenti">‹</button><div class="b26cards" role="list">'+L.map((x,i)=>'<button type="button" role="listitem" class="b26cd'+(i===sel?' on':'')+'" data-i="'+i+'" style="--c:'+x.c+'" aria-pressed="'+(i===sel)+'"><span class="ic">'+esc(x.ic||iniz11(x.n))+'</span>'+(x.tg?'<span class="c12tg">'+esc(x.tg)+'</span>':'')+'<small>'+esc(x.k||'')+'</small><span class="nm">'+esc(x.n)+'</span><span class="am">'+x.t+'</span><span class="pc">'+esc(x.s||'')+'</span></button>').join('')+'</div><button type="button" class="b26nav r" aria-label="Carte successive">›</button></div>'
      :'<div class="card soon"><p>'+esc(cfg.vuoto||'Ancora niente da mostrare.')+'</p></div>')+
    '<div class="b26low"><div class="c12d"><p class="b26lab"></p><div class="b26box c12det"></div></div><div class="c12s"><p class="b26lab c12sl"></p><div class="b26box c12side"></div></div></div></div></div>');
  el.appendChild(w);
  if(cfg.actions){const a=w.querySelector('.c12act');cfg.actions.forEach(([l,fn,dark])=>{const b=h('<button type="button" class="bb '+(dark?'dark':'soft')+' sm">'+esc(l)+'</button>');b.addEventListener('click',fn);a.appendChild(b);});}
  if(cfg.sumBtn){const s=w.querySelector('.c12sbtn');cfg.sumBtn.forEach(([l,fn])=>{const b=h('<button type="button" class="lnk2">'+esc(l)+' ›</button>');b.addEventListener('click',fn);s.appendChild(b);});}
  const det=()=>{const x=L[sel];const d=w.querySelector('.c12d'),s=w.querySelector('.c12s');if(!x){d.hidden=true;s.hidden=true;return;}
    d.hidden=false;w.querySelector('.c12d .b26lab').textContent=x.lab||x.n;const box=w.querySelector('.c12det');box.innerHTML='';x.det(box);
    if(x.side){s.hidden=false;w.querySelector('.c12sl').textContent=x.sideLab||'';const sb=w.querySelector('.c12side');sb.innerHTML='';x.side(sb);}else s.hidden=true;};
  w.querySelectorAll('.b26cd').forEach(b=>b.addEventListener('click',()=>{sel=CSEL[id]=+b.dataset.i;CSELK[id]=L[sel]&&L[sel].key!=null?L[sel].key:null;w.querySelectorAll('.b26cd').forEach(z=>{const on=z===b;z.classList.toggle('on',on);z.setAttribute('aria-pressed',String(on));});det();try{b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});}catch(e){}}));
  if(cfg.seg)w.querySelectorAll('.c12seg [data-v]').forEach(b=>b.addEventListener('click',()=>{CSEL[id]=0;CSELK[id]=null;cfg.seg.set(b.dataset.v);R[id]();addBack(id);}));
  const cs=w.querySelector('.b26cards');if(cs){const nl=w.querySelector('.b26nav.l'),nr=w.querySelector('.b26nav.r');const upd=()=>{nl.hidden=cs.scrollLeft<8;nr.hidden=cs.scrollLeft+cs.clientWidth>=cs.scrollWidth-8;};
    nl.addEventListener('click',()=>cs.scrollBy({left:-cs.clientWidth*.8,behavior:'smooth'}));nr.addEventListener('click',()=>cs.scrollBy({left:cs.clientWidth*.8,behavior:'smooth'}));cs.addEventListener('scroll',upd,{passive:true});requestAnimationFrame(upd);
    const on=cs.querySelector('.b26cd.on');if(on&&sel>0)requestAnimationFrame(()=>{try{on.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}});}
  det();return w;}
// pezzi del dettaglio
const barre=(rows,c)=>rows.map(r=>'<div class="b26v" style="--c:'+(r.c||c)+'"><span>'+esc(r.l)+(r.e?'<em>'+esc(r.e)+'</em>':'')+'</span><b>'+r.v+'</b><i style="--w:'+Math.max(0,Math.min(100,r.w||0))+'%"></i></div>').join('');
const righe=rows=>rows.filter(Boolean).map(([l,v,s])=>'<div class="c12li"><span>'+esc(l)+(s?'<small>'+esc(s)+'</small>':'')+'</span><b>'+v+'</b></div>').join('');
const chips=a=>'<div class="chips c12ch">'+a.filter(Boolean).map(([t,c])=>'<span class="chip2 '+(c||'')+'">'+esc(t)+'</span>').join('')+'</div>';
function bottoni(box,list){const r=h('<div class="big-btns c12b"></div>');list.filter(Boolean).forEach(([l,fn,dark])=>{const b=h('<button type="button" class="bb '+(dark?'dark':'soft')+' sm">'+esc(l)+'</button>');b.addEventListener('click',fn);r.appendChild(b);});if(r.children.length)box.appendChild(r);}
// vista completa (come prima) e ritorno alla vista semplice
function conVista(id,nuova,vecchia){R[id]=function(){if(VISTA[id]==='completa'||(typeof editMode!=='undefined'&&editMode&&/^s-/.test(id))){vecchia();const el=document.getElementById(id);if(VISTA[id]==='completa'&&el&&!el.querySelector('.c12back')){const b=h('<button type="button" class="bb soft sm c12back">‹ Torna alla vista semplice</button>');b.addEventListener('click',()=>{VISTA[id]='';R[id]();addBack(id);window.scrollTo(0,0);});const sh=el.querySelector('.sh');if(sh)sh.after(b);else el.insertBefore(b,el.firstChild);}return;}nuova();};}
const completa=id=>()=>{VISTA[id]='completa';R[id]();addBack(id);window.scrollTo(0,0);};
const giorniA=d=>d?Math.round((new Date(d+'T12:00:00')-new Date(todayISO()+'T12:00:00'))/86400000):null;

/* --- Bilancio 2027 --- */
ECO_G[1].p=[['v-p27','Previsione'],['v-cv','Schede delle voci']];
let B27V='costi';
const _p27=R['v-p27'];
conVista('v-p27',function(){const el=document.getElementById('v-p27');const C=calc();const cur27=sponsorTot()*S.carPct/100;
  const b26=id=>{const a=D.bil.find(x=>x.id===id);return a?a.t:0;};
  let cards;
  if(B27V==='costi')cards=C.aree.filter(x=>x.tot>0).sort((a,b)=>b.tot-a.tot).map(x=>{const v26=x.a.id<=7?b26(x.a.id):0;const on=x.a.voci.filter(voceOn);
    return {n:x.a.n,t:eur(x.tot),c:ac(x.a.id),k:'Costi 2027',tg:x.a.id>7?'Nuova':'',s:v26?'2026: '+eur(v26)+(x.tot<v26?' ↓':x.tot>v26?' ↑':''):'Nuova voce',lab:x.a.n+' · 2026 e 2027',
      det:box=>{const mx=Math.max(x.tot,v26,1);box.innerHTML=barre([{l:'2027 (previsione)',v:eur(x.tot),w:x.tot/mx*100}].concat(v26?[{l:'2026',v:eur(v26),w:v26/mx*100,c:'#9AA6C2'}]:[]),ac(x.a.id))+chips([[on.length+' voci su '+x.a.voci.length,'ok'],x.risp>0?['risparmio sui fornitori '+eur(x.risp)]:null]);
        bottoni(box,[canOpen('v-cv')?['Apri le schede delle voci',()=>go('v-cv'),true]:null,canOpen('s-pre')?['Cambia gli importi',()=>go('s-pre')]:null]);},
      sideLab:'Voci di quest’area',side:box=>{const vv=on.map(v=>[v.n,voceV(v)]).sort((a,b)=>b[1]-a[1]);const t=vv.reduce((s,y)=>s+y[1],0)||1;box.innerHTML=barre(vv.map(y=>({l:y[0],v:eur(y[1]),e:Math.round(y[1]/t*100)+'%',w:y[1]/t*100})),ac(x.a.id))||'<p class="muted">Nessuna voce accesa.</p>';}};});
  else cards=B26G.map(([n,ids,c])=>{const rr=D.ric.filter(r=>ids.includes(r.id));const t=rr.reduce((s,r)=>s+(ricOn(r)?ricV(r):0),0),t26=rr.reduce((s,r)=>s+r.v26,0);return {n,c,t,t26,rr};}).filter(g=>g.t>0||g.t26>0).sort((a,b)=>b.t-a.t).map(g=>({n:g.n,t:eur(g.t),c:g.c,k:'Ricavi 2027',s:'2026: '+eur(g.t26)+(g.t>g.t26?' ↑':g.t<g.t26?' ↓':''),lab:g.n+' · 2026 e 2027',
      det:box=>{const mx=Math.max(g.t,g.t26,1);box.innerHTML=barre([{l:'2027 (previsione)',v:eur(g.t),w:g.t/mx*100},{l:'2026',v:eur(g.t26),w:g.t26/mx*100,c:'#9AA6C2'}],g.c);bottoni(box,[canOpen('s-ric')?['Cambia i ricavi',()=>go('s-ric'),true]:null]);},
      sideLab:'Voci di ricavo',side:box=>{const vv=g.rr.filter(ricOn).map(r=>[r.n.replace(/^Regione · progetto /,'Progetto ').replace(/ \(Dip\. Sviluppo Economico\)/,''),ricV(r)]).filter(y=>y[1]>0).sort((a,b)=>b[1]-a[1]);const t=vv.reduce((s,y)=>s+y[1],0)||1;box.innerHTML=barre(vv.map(y=>({l:y[0],v:eur(y[1]),e:Math.round(y[1]/t*100)+'%',w:y[1]/t*100})),g.c)||'<p class="muted">Nessuna voce.</p>';}}));
  cartePagina(el,{id:'v-p27',ey:'Previsione',title:'Bilancio 2027',sub:'Quanto pensiamo di spendere e incassare nel 2027. Tocca una carta per i dettagli.',
    sum:[['in','↑','Ricavi previsti',eur(C.ricavi)],['out','↓','Costi previsti',eur(C.costi)],['eq','=','Risultato',(C.ris<0?'− ':'+ ')+eur(Math.abs(C.ris)),C.ris<0?'neg':'pos'],['gold','♥','Alla carità',eur(cur27)]],
    note:'Scelte attive: '+[S.progetto?'<b>Progetto Bruna Futura approvato</b>':'Progetto Bruna Futura non ancora approvato',S.risp?'<b>risparmi sui fornitori</b>':'nessun risparmio sui fornitori'].join(' e ')+'.',
    sumBtn:canOpen('s-pre')?[['Cambia le scelte',()=>go('s-pre')]]:null,
    mini:[['Ricavi',eur(C.ricavi)],['Costi',eur(C.costi)],['Risultato',(C.ris<0?'−':'+')+eur(Math.abs(C.ris)),C.ris<0?'neg':'pos']],
    seg:{on:B27V,list:[['costi','Costi'],['ricavi','Ricavi']],set:v=>B27V=v},cards});},_p27);

/* --- Costi e ricavi per voce --- */
const _voci12=R['v-voci'];
conVista('v-voci',function(){const id='v-voci',el=document.getElementById(id);const can=CTX.canEdit(id);const yr=elFilt[id]||'2026';
  const L1=(VD[id]||[]).filter(r=>(r.dati.anno||'2026')===yr).map(r=>{const d=r.dati;const co=(+d.costo||0)+(+d.indiretti||0),ri=+d.ricavo||0;return {r,d,co,ri,m:ri-co};}).sort((a,b)=>Math.abs(b.m)-Math.abs(a.m));
  const tc=L1.reduce((s,x)=>s+x.co,0),tr=L1.reduce((s,x)=>s+x.ri,0),tm=tr-tc;const sg=m=>(m<0?'− ':'+ ')+eur(Math.abs(m));
  const cards=L1.map(x=>({n:x.d.nome||'Attività',t:sg(x.m),c:x.m>=0?OK12:KO12,k:'Margine',tg:x.d.verifica==='Verificati con documenti'?'Verificato':'Stima',s:'costi '+eur(x.co)+' · ricavi '+eur(x.ri),lab:(x.d.nome||'Attività')+' · da dove vengono i soldi',
    det:box=>{const mx=Math.max(x.ri,+x.d.costo||0,+x.d.indiretti||0,1);box.innerHTML=barre([{l:'Ricavi diretti',v:eur(x.ri),w:x.ri/mx*100,c:OK12},{l:'Costi diretti',v:eur(+x.d.costo||0),w:(+x.d.costo||0)/mx*100,c:KO12},{l:'Costi indiretti attribuiti',v:eur(+x.d.indiretti||0),w:(+x.d.indiretti||0)/mx*100,c:GOLD12}])+chips([[x.d.verifica==='Verificati con documenti'?'Numeri verificati':'Numeri stimati',x.d.verifica==='Verificati con documenti'?'ok':''],['Margine '+sg(x.m),x.m>=0?'ok':'ko']]);
      bottoni(box,[can?['Modifica',()=>editRec(id,x.r),true]:null]);},
    sideLab:'Note e documenti',side:box=>{box.innerHTML=x.d.nota?'<p style="margin:0;white-space:pre-line">'+esc(x.d.nota)+'</p>':'<p class="muted" style="margin:0">Nessuna nota.</p>';if(x.d.doc&&x.d.doc.path)box.appendChild(fileBtn(x.d.doc,'Documento'));const sto=storicoRec(x.d);if(sto)box.appendChild(sto);}}));
  cartePagina(el,{id,ey:'Attività '+yr,title:'Costi e ricavi per voce',sub:'Per ogni attività: quanto costa, quanto rende e cosa resta.',
    sum:[['out','↓','Costi totali',eur(tc)],['in','↑','Ricavi totali',eur(tr)],['eq','=','Margine',sg(tm),tm<0?'neg':'pos']],
    note:L1.length?'<b>'+L1.filter(x=>x.m>=0).length+'</b> attività in attivo, <b>'+L1.filter(x=>x.m<0).length+'</b> in passivo.':'Aggiungi le attività per vedere quali rendono.',
    mini:[['Costi',eur(tc)],['Ricavi',eur(tr)],['Margine',sg(tm),tm<0?'neg':'pos']],
    seg:{on:yr,list:[['2026','2026'],['2027','2027']],set:v=>elFilt[id]=v},actions:can?[['+ Aggiungi un’attività',()=>editRec(id,null),true]]:null,
    vuoto:'Nessuna attività per il '+yr+'.',cards});},_voci12);

/* --- Fatture --- */
let FATV='ricevute';const _fatt12=R['v-fatt'];
conVista('v-fatt',function(){const id='v-fatt',el=document.getElementById(id);const can=CTX.canEdit(id);const L=VD[id]||[];const sum=A=>A.reduce((a,r)=>a+(+r.dati.importo||0),0);
  const co=L.filter(r=>r.dati.tipo!=='Ricavo'),ri=L.filter(r=>r.dati.tipo==='Ricavo');const dap=co.filter(r=>r.dati.pagata!=='Sì'),dai=ri.filter(r=>r.dati.pagata!=='Sì');
  const fe=(VD['v-femit']||[]).filter(r=>['Da emettere','In lavorazione'].includes(r.dati.stato));
  const sett=dap.filter(r=>{const g=giorniA(r.dati.scadenza);return g!=null&&g>=0&&g<=7;}).length;
  const A=(FATV==='emesse'?ri:co).slice().sort((a,b)=>((a.dati.pagata==='Sì')-(b.dati.pagata==='Sì'))||String(a.dati.scadenza||'9999').localeCompare(String(b.dati.scadenza||'9999')));
  const cards=A.map(r=>{const d=r.dati;const g=giorniA(d.scadenza);const pag=d.pagata==='Sì';
    const k=pag?(FATV==='emesse'?'Incassata':'Pagata'):g==null?'Senza scadenza':g<0?'Scaduta da '+(-g)+(g===-1?' giorno':' giorni'):g===0?'Scade oggi':'Scade tra '+g+(g===1?' giorno':' giorni');
    const c=pag?'#2A9D8F':g!=null&&g<0?KO12:g!=null&&g<=7?GOLD12:BLU12;
    return {n:d.soggetto||'Senza nome',t:eur(+d.importo||0),c,k,s:(d.numero?'Fattura n. '+d.numero:'Fattura')+(d.voce&&d.voce!=='Da scegliere'?' · '+d.voce:''),lab:(d.soggetto||'')+(d.numero?' · fattura n. '+d.numero:''),
      det:box=>{box.innerHTML=righe([d.imponibile?['Imponibile',eur(+d.imponibile)]:null,d.iva?['IVA',eur(+d.iva)]:null,['Totale',eur(+d.importo||0)],d.data?['Data',fmtD(d.data)]:null,d.scadenza?['Scadenza',fmtD(d.scadenza)]:null,d.voce&&d.voce!=='Da scegliere'?['Voce del bilancio',esc(d.voce)]:null,['Stato',pag?(FATV==='emesse'?'incassata':'pagata'):(FATV==='emesse'?'da incassare':'da pagare')]]);
        if(d.file&&d.file.path)box.appendChild(fileBtn(d.file,'Apri la fattura'));
        bottoni(box,[can&&!pag?[FATV==='emesse'?'Segna come incassata':'Segna come pagata',async()=>{const o=Object.assign({},d,{pagata:'Sì'});o.storico=(d.storico||[]).concat([{quando:new Date().toISOString(),chi:CTX.user.id,cambi:[['Pagata?','No','Sì']]}]).slice(-30);await CTX.sb.from('voci_dati').update({dati:o,aggiornato:new Date().toISOString()}).eq('id',r.id);await loadVD();R[id]();addBack(id);},true]:null,can?['Modifica',()=>editRec(id,r)]:null]);
        const sto=storicoRec(d);if(sto)box.appendChild(sto);},
      sideLab:canOpen('v-femit')?'Fatture da emettere':'',side:canOpen('v-femit')?box=>{box.innerHTML=fe.length?fe.slice(0,5).map(x=>'<div class="c12li"><span class="chip2 '+(x.dati.stato==='Da emettere'?'wa':'')+'">'+esc(x.dati.stato)+'</span><span>'+esc(x.dati.cliente||'')+'<small>'+esc(x.dati.descrizione||'')+'</small></span><b>'+eur(+x.dati.importo||0)+'</b></div>').join(''):'<p class="muted" style="margin:0">Nessuna fattura da emettere.</p>';const b=h('<button type="button" class="lnk2">Apri Fatture da emettere ›</button>');b.addEventListener('click',()=>go('v-femit'));box.appendChild(b);}:null};});
  cartePagina(el,{id,ey:'Economia',title:'Fatture',sub:'Le fatture ricevute e quelle emesse, in ordine di scadenza.',
    sum:[['out','↓','Da pagare',eur(sum(dap))],['in','↑','Da incassare',eur(sum(dai))],['gold','!','Da emettere',fe.length+(fe.length===1?' richiesta':' richieste')]],
    note:sett?'<b>'+sett+(sett===1?' fattura scade':' fatture scadono')+'</b> nei prossimi 7 giorni.':'Nessuna fattura in scadenza nei prossimi 7 giorni.',
    mini:[['Da pagare',eur(sum(dap))],['Da incassare',eur(sum(dai))],['Da emettere',String(fe.length)]],
    seg:{on:FATV,list:[['ricevute','Ricevute · '+co.length],['emesse','Emesse · '+ri.length]],set:v=>FATV=v},
    actions:can?[['Carica una fattura',()=>caricaELeggi(id,'Carica una fattura'),true],['+ Scrivi a mano',()=>editRec(id,null)]]:null,
    vuoto:FATV==='emesse'?'Nessuna fattura emessa.':'Nessuna fattura ricevuta.',cards});},_fatt12);

/* --- Carità --- */
const _car12=R['s-car'];
conVista('s-car',function(){const el=document.getElementById('s-car');const sf=document.getElementById('s-fon');if(sf)sf.hidden=true;const sp=sponsorTot(),curia=sp*S.carPct/100,F=fondoCalc(),tot=curia+F.fondo;
  const MV=canV('v-care')?(VD['v-care']||[]):[];const erog=MV.filter(r=>r.dati.tipo==='Erogazione').reduce((s,r)=>s+(+r.dati.importo||0),0);
  const al=a=>typeof S.al[a.id]==='number'?S.al[a.id]:a.p;
  const cards=D.alloc.map((a,i)=>{const p=al(a),e=F.fondo*p/100;const nm=a.n.split(':')[0];const q=a.u?Math.round(e/a.u):0;
    return {n:nm,t:eur(e),c:PAL12[i%PAL12.length],k:p+'% del fondo',s:q?'≈ '+q+' '+(a.ul||''):'',lab:nm+' · cosa si ottiene',
      det:box=>{box.innerHTML='<p style="margin:0 0 6px">'+esc(a.n)+'</p>'+barre([{l:'Parte del fondo',v:p+'%',w:p}],PAL12[i%PAL12.length])+chips([q?['≈ '+q+' '+(a.ul||''),'ok']:null,['Fondo dei fornitori: '+eur(F.fondo)]]);
        bottoni(box,[canOpen('v-care')&&CTX.canEdit('v-care')?['Registra un’erogazione',()=>editRec('v-care',null,{tipo:'Erogazione',beneficiario:nm}),true]:null,['Cambia le percentuali',completa('s-car')]]);},
      sideLab:canV('v-care')?'Ultime erogazioni':'',side:canV('v-care')?box=>{const E=MV.filter(r=>r.dati.tipo==='Erogazione').slice().sort((x,y)=>String(y.dati.data||'').localeCompare(String(x.dati.data||''))).slice(0,5);
        box.innerHTML=E.length?E.map(r=>'<div class="c12li"><span class="chip2 ok">Fatta</span><span>'+esc(r.dati.riservato==='Sì'&&!CTX.canEdit('v-care')?'Beneficiario riservato':(r.dati.beneficiario||''))+'<small>'+(r.dati.data?fmtD(r.dati.data):'')+'</small></span><b>'+eur(+r.dati.importo||0)+'</b></div>').join(''):'<p class="muted" style="margin:0">Nessuna erogazione registrata.</p>';
        const b=h('<button type="button" class="lnk2">Apri le erogazioni ›</button>');b.addEventListener('click',()=>go('v-care'));box.appendChild(b);}:null};});
  cartePagina(el,{id:'s-car',ey:'Carità 2027',title:'Carità',sub:'Da dove arrivano i soldi per la carità e come li usiamo.',
    sum:[['gold','♥','Alla Curia ('+S.carPct+'% sponsor)',eur(curia)],['eq','+','Fondo dei fornitori',eur(F.fondo)],['in','=','Totale per la carità',eur(tot),'pos']],
    note:'Nel 2026 erano <b>48.000 €</b>.'+(canV('v-care')?' Erogati finora: <b>'+eur(erog)+'</b> · saldo <b>'+eur(tot-erog)+'</b>.':''),
    sumBtn:[['Quota alla Curia e beni per la Caritas',completa('s-car')]],
    mini:[['Curia',eur(curia)],['Fondo',eur(F.fondo)],['Totale',eur(tot),'pos']],cards});},_car12);

/* --- PIL generato --- */
const _ter12=R['s-ter'];
conVista('s-ter',function(){const el=document.getElementById('s-ter');const C=calc();const qb=rcv('quota_bas'),qp=rcv('quota_pug');let vis=0,pern=0,prog=0;
  D.prev.forEach(a=>a.voci.forEach(v=>{if(voceOn(v)&&(v.gg||v.pern)){vis+=v.gg||0;pern+=v.pern||0;prog++;}}));
  const fg=rcv('festa_giornalieri'),fn=rcv('festa_pern')*rcv('festa_notti'),sg=rcv('spesa_giorno'),spn=rcv('spesa_pern');
  const A=C.costi*qb,B=fg*sg+fn*spn,Cp=vis*sg+pern*spn,dir=A+B+Cp,tot=dir*rcv('molt'),pil=tot*rcv('va'),ula=pil/rcv('va_ula');const nf=x=>Math.round(x).toLocaleString('it-IT');
  const pc=x=>dir?Math.round(x/dir*100)+'% della spesa':'';
  const cards=[{n:'Visitatori della Festa',t:eur(B),c:BLU12,k:pc(B),s:nf(fg)+' in giornata + '+nf(fn)+' notti',lab:'Visitatori della Festa · il calcolo',det:box=>{box.innerHTML=righe([['Visitatori in giornata',eur(fg*sg),nf(fg)+' × '+eur(sg)],['Notti in albergo',eur(fn*spn),nf(fn)+' × '+eur(spn)],['Totale',eur(B)]]);}},
    {n:'Visitatori dei programmi',t:eur(Cp),c:'#8A6CF0',k:pc(Cp),s:prog+' programmi · '+nf(vis)+' visitatori',lab:'Visitatori dei programmi · il calcolo',det:box=>{box.innerHTML=righe([['Visitatori',eur(vis*sg),nf(vis)+' × '+eur(sg)],['Notti in albergo',eur(pern*spn),nf(pern)+' × '+eur(spn)],['Totale',eur(Cp)]]);}},
    {n:'Spesa dell’Associazione',t:eur(A),c:'#2A9D8F',k:pc(A),s:Math.round(qb*1000)/10+'% ai fornitori lucani',lab:'Spesa dell’Associazione in Basilicata',det:box=>{box.innerHTML=righe([['Costi previsti 2027',eur(C.costi)],['Quota spesa in Basilicata',(Math.round(qb*1000)/10).toLocaleString('it-IT')+'%'],['Spesa in Basilicata',eur(A)],['E in più in Puglia',eur(C.costi*qp)]]);}},
    {n:'Fornitori dei fornitori e stipendi',t:eur(tot-dir),c:GOLD12,k:'Effetto moltiplicatore',s:'× '+String(rcv('molt')).replace('.',','),lab:'Dalla spesa al PIL',det:box=>{box.innerHTML=righe([['Spesa diretta',eur(dir)],['Moltiplicatore','× '+String(rcv('molt')).replace('.',',')],['Ricaduta totale',eur(tot)],['PIL (valore aggiunto)',eur(pil),Math.round(rcv('va')*100)+'% della ricaduta'],['Posti di lavoro per un anno',nf(ula)]]);}}];
  cards.forEach(x=>{x.sideLab='Ipotesi e fonti';x.side=box=>{box.innerHTML='<p class="muted" style="margin:0 0 8px">Stima prudente: moltiplicatore '+String(rcv('molt')).replace('.',',')+', PIL = '+Math.round(rcv('va')*100)+'% della ricaduta. Fonti: APT Basilicata, Isnart, Symbola.</p>';bottoni(box,[['Cambia le ipotesi',completa('s-ter'),true],['Imprese coinvolte e fonti',completa('s-ter')]]);};
    const d0=x.det;x.det=box=>{d0(box);bottoni(box,[['Vedi il calcolo completo',completa('s-ter')]]);};});
  cartePagina(el,{id:'s-ter',ey:'Ricadute 2027',title:'PIL generato',sub:'Quanto vale la Festa per Matera e la Basilicata.',
    sum:[['in','€','Spesa diretta in Basilicata',eur(dir)],['eq','×','Ricaduta totale',eur(tot)],['in','↑','PIL generato',eur(pil),'pos'],['gold','☺','Posti di lavoro per un anno',nf(ula)]],
    note:'Calcolato sulla previsione 2027. Le ipotesi si possono cambiare nella vista completa.',
    mini:[['Spesa diretta',(dir/1e6).toLocaleString('it-IT',{maximumFractionDigits:1})+' mln €'],['Ricaduta',(tot/1e6).toLocaleString('it-IT',{maximumFractionDigits:1})+' mln €'],['PIL',(pil/1e6).toLocaleString('it-IT',{maximumFractionDigits:1})+' mln €','pos']],cards});},_ter12);

/* --- Fornitori 2026 --- */
const _for12=R['s-for'];
conVista('s-for',function(){const el=document.getElementById('s-for');const tot=D.forn.reduce((s,f)=>s+f.v,0),deb=D.forn.reduce((s,f)=>s+(f.deb||0),0);
  const bas=tot?D.forn.filter(f=>f.loc==='Basilicata').reduce((s,f)=>s+f.v,0)/tot*100:0,pug=tot?D.forn.filter(f=>f.loc==='Puglia').reduce((s,f)=>s+f.v,0)/tot*100:0;
  const F=D.forn.filter(f=>!fa||f.a===fa).slice().sort((a,b)=>b.v-a.v);const area=id=>{const a=D.bil.find(x=>x.id===id);return a?a.n:'';};const p1=x=>x.toLocaleString('it-IT',{maximumFractionDigits:1})+'%';
  const F27=VD['v-for27']||[];const nrm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9à-ù]+/g,' ').trim();
  const cards=F.slice(0,40).map(f=>({n:f.n,t:eur(f.v),c:ac(f.a),k:area(f.a),tg:f.ok?'':'Da verificare',s:f.deb?'da pagare '+eur(f.deb):(f.loc||''),lab:f.n+(f.att?' · '+f.att:''),
    det:box=>{box.innerHTML=righe([['Attività',esc(f.att||'—')],['Dove',esc(f.loc||'—')],['Area del bilancio',esc(area(f.a))],['Importo 2026',eur(f.v)],['Ancora da pagare',eur(f.deb||0)]]);
      bottoni(box,[canOpen('v-prev')&&CTX.canEdit('v-prev')?['Chiedi un preventivo',()=>editRec('v-prev',null,{fornitore:f.n,stato:'Da chiedere'}),true]:null,['Vista completa',completa('s-for')]]);},
    sideLab:'Nel 2027',side:box=>{const r=F27.find(x=>nrm(x.dati.fornitore)&&nrm(x.dati.fornitore).split(' ')[0]===nrm(f.n).split(' ')[0]);
      if(!r){box.innerHTML='<p class="muted" style="margin:0">Non è ancora tra i fornitori 2027.</p>';if(canOpen('v-for27')){const b=h('<button type="button" class="lnk2">Apri Fornitori 2027 ›</button>');b.addEventListener('click',()=>go('v-for27'));box.appendChild(b);}return;}
      const P=r.dati.pagamenti||[];box.innerHTML='<div class="c12li"><span>Concordato 2027</span><b>'+eur(+r.dati.importo||0)+'</b></div>'+(P.length?P.map(p=>{const st=statoRata(p);return '<div class="c12li"><span class="chip2 '+st[1]+'">'+st[0]+'</span><span>'+esc(p.n||'Rata')+'<small>'+(p.data?fmtD(p.data):'')+'</small></span><b>'+eur(+p.importo||0)+'</b></div>';}).join(''):'<p class="muted">Nessuna rata.</p>');
      const b=h('<button type="button" class="lnk2">Apri in Fornitori 2027 ›</button>');b.addEventListener('click',()=>go('v-for27'));box.appendChild(b);}}));
  cartePagina(el,{id:'s-for',ey:'Fornitori 2026',title:'Fornitori',sub:'Chi ha lavorato con noi, quanto è costato e cosa resta da pagare.',
    sum:[['eq','#','Fornitori 2026',String(D.forn.length)],['out','↓','Importo 2026',eur(tot)],['gold','!','Ancora da pagare',eur(deb),'neg'],['in','⌂','In Basilicata',p1(bas)]],
    note:'Puglia <b>'+p1(pug)+'</b> · fuori regione <b>'+p1(Math.max(0,100-bas-pug))+'</b>.',sumBtn:[['Cerca un fornitore',completa('s-for')]],
    mini:[['Fornitori',String(D.forn.length)],['Importo',eur(tot)],['Da pagare',eur(deb),'neg']],
    seg:{on:String(fa||0),list:[['0','Tutte']].concat(D.bil.map(a=>[String(a.id),(SHORT[a.id]||a.n).replace(/­/g,'')])),set:v=>{fa=+v;}},cards});},_for12);

/* --- Preventivi --- */
const _prev12=R['v-prev'];
conVista('v-prev',function(){const id='v-prev',el=document.getElementById(id);const can=CTX.canEdit(id);const L=VD[id]||[];const byV={};L.forEach(r=>{const k=r.dati.voce||'Senza voce';(byV[k]=byV[k]||[]).push(r);});
  const n=s=>L.filter(r=>r.dati.stato===s).length;const accV=L.filter(r=>r.dati.stato==='Accettato').reduce((s,r)=>s+(+r.dati.importo||0),0);
  const cards=Object.keys(byV).map((v,i)=>{const G=byV[v];const P=punteggi(G);const acc=G.find(r=>r.dati.stato==='Accettato');const val=G.filter(r=>P[r.id]).sort((a,b)=>P[b.id].tot-P[a.id].tot);const best=val[0];const imps=val.map(r=>+r.dati.importo);
    return {n:v.replace(/^Evento /,''),t:acc?eur(+acc.dati.importo||0):imps.length?'da '+eur(Math.min(...imps)):'—',c:acc?OK12:val.length>=2?BLU12:val.length===1?GOLD12:'#94A3C0',k:G.length+(G.length===1?' preventivo':' preventivi'),tg:acc?'Scelto':'',
      s:acc?'scelto: '+(acc.dati.fornitore||''):best?'migliore: '+(best.dati.fornitore||''):'servono offerte',lab:v+' · confronto',
      det:box=>{box.innerHTML=val.length?barre(val.map(r=>({l:(r.dati.fornitore||'Senza nome')+(r.dati.regione?' · '+r.dati.regione:''),v:eur(+r.dati.importo||0),e:'punteggio '+P[r.id].tot,w:P[r.id].tot,c:r.dati.stato==='Accettato'?OK12:null})),BLU12):'<p class="muted" style="margin:0">Ancora nessuna offerta con l’importo.</p>';
        bottoni(box,[can&&!acc&&best?['Scegli '+(best.dati.fornitore||'il migliore'),()=>accetta(best,G),true]:null,can?['+ Aggiungi un preventivo',()=>editRec(id,null,{voce:v})]:null,['Vista completa',completa(id)]]);},
      sideLab:'Tutti i preventivi di questa voce',side:box=>{box.innerHTML=G.map(r=>'<div class="c12li"><span class="chip2 '+(r.dati.stato==='Accettato'?'ok':r.dati.stato==='Scartato'?'ko':r.dati.stato==='Da chiedere'?'wa':'')+'">'+esc(r.dati.stato||'')+'</span><span>'+esc(r.dati.fornitore||'Fornitore da trovare')+'<small>'+esc(r.dati.chi?'segue '+nome(r.dati.chi):'')+'</small></span><b>'+(+r.dati.importo?eur(+r.dati.importo):'')+'</b></div>').join('');}};})
    .sort((a,b)=>(a.tg?1:0)-(b.tg?1:0));
  cartePagina(el,{id,ey:'Economia',title:'Preventivi',sub:'Le offerte ricevute, confrontate per ogni voce: prezzo, qualità, tempi e vicinanza.',
    sum:[['gold','?','Da chiedere',String(n('Da chiedere'))],['eq','…','Chiesti, in attesa',String(n('Chiesto'))],['in','✓','Scelti',String(n('Accettato'))],['eq','€','Valore scelto',eur(accV)]],
    note:'Il confronto pesa <b>prezzo 50%</b>, qualità 30%, tempi 10%, vicinanza 10%. La scelta spetta sempre a voi.',
    mini:[['Da chiedere',String(n('Da chiedere'))],['In attesa',String(n('Chiesto'))],['Scelti',String(n('Accettato')),'pos']],
    actions:can?[['Carica un preventivo',()=>caricaELeggi(id,'Carica un preventivo'),true],['+ Scrivi a mano',()=>editRec(id,null)],['Chiedi a un collega',chiediPrev]]:null,
    vuoto:'Ancora nessun preventivo.',cards});},_prev12);
