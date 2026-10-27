/* ================= Bruna27 · Home ed Eventi con lo stesso stile di Economia ================= */
const AREA_COL={eco:'#2F63F0',evt:'#C9952A',com:'#8A6CF0',sic:'#2A9D8F',adm:'#182C6B'};
const AREA_IC={eco:'€',evt:'EV',com:'CO',sic:'SI',adm:'AM'};
function areaInfo(s){let t='',k='',sub='';try{
  if(s.k==='eco'&&CTX.eco){const C=calc();k='Risultato previsto 2027';t=(C.ris>=0?'+':'−')+eur(Math.abs(C.ris));sub='Costi 2027: '+eur(C.costi);}
  else if(s.k==='evt'){const E=allEv();const on=E.filter(evOn);k='Eventi in programma';t=String(on.length);sub='dal 15 maggio al 15 agosto';}
  else if(s.k==='sic'){const P=typeof vperc==='function'?vperc():[];k='Percorsi';t=String(P.length);sub=P.filter(x=>x.dati.stato==='Convalidato'||x.dati.stato==='Pubblicato').length+' convalidati';}
  else if(s.k==='com'){const L=(VD['v-sp27']||[]);const c=L.filter(r=>['Confermato','Contratto firmato','Pagato'].includes(r.dati.stato));k='Sponsor 2027 confermati';t=String(c.length);sub=eur(c.reduce((a,r)=>a+(typeof totSp==='function'?totSp(r.dati):(+r.dati.importo||0)),0));}
  else{const ks=secVoci(s).map(v=>v[0]);const n=ks.reduce((a,x)=>a+((VD[x]||[]).length),0);k='Voci registrate';t=String(n);sub=secVoci(s).map(v=>v[1]).slice(0,3).join(' · ');}
  }catch(e){}return {t:t||'—',k,sub};}

/* --- Home --- */
renderHome=function(){const el=document.getElementById('p-home');el.innerHTML='';const me=CTX.user.id;
  const ora=new Date().getHours();const sal=ora<13?'Buongiorno':ora<18?'Buon pomeriggio':'Buonasera';
  const ap=RICH.filter(r=>r.stato!=='fatta');const aperte=RICH.filter(r=>r.stato==='aperta').length;const td=myTodo();const nn=NOTI.filter(x=>!x.letto&&!x.archiviata&&!mutata(x)).length;const gg=countdown();
  const S5=mySez();
  const w=h('<div class="b26 h13"><aside class="b26sum"><p class="h13ey">Oggi</p>'+sumRows([['gold','★','Alla Bruna',gg+' giorni'],['out','!','Richieste da prendere',String(aperte),aperte?'neg':''],['eq','✓','Da fare',String(td.length)],['in','●','Notifiche nuove',String(nn)]])+'<div class="b26reg"><b>2 luglio 2027</b> · Festa della Madonna della Bruna</div></aside>'+
    '<div class="b26main"><div class="hello"><span>'+new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})+'</span><h1>'+sal+', <b>'+esc((CTX.prof.nome||'').split(' ')[0]||'')+'</b></h1></div>'+
    '<div class="b26mini"><div><span>Alla Bruna</span><b>'+gg+' giorni</b></div><div><span>Richieste</span><b class="'+(aperte?'neg':'')+'">'+aperte+' da prendere</b></div><div><span>Da fare</span><b>'+td.length+'</b></div></div>'+
    (S5.length?'<p class="b26lab h13lab">Le tue aree</p><div class="b26wrap"><button type="button" class="b26nav l" aria-label="Aree precedenti">‹</button><div class="b26cards h13cards">'+S5.map((s,i)=>{const a=areaInfo(s);return '<button type="button" class="b26cd'+(i===0?' on':'')+'" data-go="sec-'+s.k+'" style="--c:'+(AREA_COL[s.k]||'#2F63F0')+'"><span class="ic">'+(AREA_IC[s.k]||esc(s.n.charAt(0)))+'</span><small>'+esc(a.k)+'</small><span class="nm">'+esc(s.n)+'</span><span class="am">'+esc(a.t)+'</span><span class="pc">'+esc(a.sub)+'</span></button>';}).join('')+'</div><button type="button" class="b26nav r" aria-label="Aree successive">›</button></div>':'<div class="card soon"><p>Non hai ancora sezioni assegnate.</p></div>')+
    '<div class="h13grid"><div class="h13l"></div><div class="h13r"></div></div></div></div>');
  el.appendChild(w);
  const L=w.querySelector('.h13l'),Rr=w.querySelector('.h13r');
  // colonna sinistra: bacheca e settimana
  L.appendChild(bachHome());
  L.appendChild(h('<section class="w h13w"><div class="wh"><b>Questa settimana</b><button type="button" class="lnk2" data-go="p-cal">Calendario</button></div>'+weekStrip()+'</section>'));
  // colonna destra: briefing, richieste, da fare
  Rr.appendChild(h('<section class="w h13w"><div class="wh"><span class="orb"></span><b>Il briefing di oggi</b></div><p class="brief">'+briefing()+'</p></section>'));
  const rq=h('<section class="w h13w"><div class="wh"><b>Richieste del Presidente</b><button type="button" class="lnk2" data-go="p-req">Tutte</button></div>'+(ap.length?ap.slice(0,3).map(r=>'<div class="rq"><div><b>'+esc(r.titolo)+'</b><span class="'+(r.stato==='aperta'?'neg':'')+'">'+(r.stato==='aperta'?'Nessuno l’ha presa':'Presa da '+esc(nome(r.preso_da))+' · entro il '+fmtD(r.entro))+'</span></div>'+(r.stato==='aperta'?'<button type="button" class="bb dark sm" data-take="'+r.id+'">La prendo io</button>':'')+'</div>').join(''):'<p class="muted">Nessuna richiesta aperta.</p>')+'</section>');
  rq.querySelectorAll('[data-take]').forEach(b=>b.addEventListener('click',()=>takeReq(b.dataset.take)));Rr.appendChild(rq);
  const tw=h('<section class="w h13w"><div class="wh"><b>Da fare</b><button type="button" class="lnk2" data-go="p-me">Il mio spazio</button></div>'+(td.length?td.slice(0,5).map(c=>'<label class="todo"><input type="checkbox" data-done="'+c.id+'"><span>'+esc(c.titolo)+(c.entro?' <em>entro il '+fmtD(c.entro)+'</em>':'')+'</span></label>').join(''):'<p class="muted">Niente da fare. Aggiungi un promemoria da Il mio spazio.</p>')+'</section>');
  tw.querySelectorAll('[data-done]').forEach(x=>x.addEventListener('change',()=>doneTask(x.dataset.done)));Rr.appendChild(tw);
  // altri riquadri: percorsi pubblicati, pagamenti, quelli scelti dall'utente
  const extra=h('<div class="wgrid h13x"></div>');const pw=pubWidget();if(pw)extra.appendChild(pw);
  if(respPag()===me||canV('v-pag')){const X=righeRate();const dc=X.filter(x=>statoRata(x.p)[0]==='In attesa di conferma').length,sc=X.filter(x=>['In scadenza','In ritardo'].includes(statoRata(x.p)[0]));
    if(dc||sc.length)extra.appendChild(h('<section class="w"><div class="wh"><b>Pagamenti ai fornitori</b><button type="button" class="lnk2" data-go="v-pag">Apri</button></div>'+(dc?'<p style="margin:0"><b>'+dc+' da confermare</b></p>':'')+(sc.length?'<p style="margin:0">'+sc.length+' in scadenza o in ritardo · '+eur(sc.reduce((a,x)=>a+(+x.p.importo||0),0))+'</p>':'')+'</section>'));}
  (PREF.w||[]).forEach(k=>{const x=extraW(k);if(x)extra.appendChild(x);});
  const add=h('<button type="button" class="w wadd"><span>+</span><b>Aggiungi un riquadro</b></button>');add.addEventListener('click',pickW);extra.appendChild(add);
  w.querySelector('.b26main').appendChild(extra);
  const cs=w.querySelector('.h13cards');if(cs){const nl=w.querySelector('.b26nav.l'),nr=w.querySelector('.b26nav.r');const upd=()=>{nl.hidden=cs.scrollLeft<8;nr.hidden=cs.scrollLeft+cs.clientWidth>=cs.scrollWidth-8;};
    nl.addEventListener('click',()=>cs.scrollBy({left:-cs.clientWidth*.8,behavior:'smooth'}));nr.addEventListener('click',()=>cs.scrollBy({left:cs.clientWidth*.8,behavior:'smooth'}));cs.addEventListener('scroll',upd,{passive:true});requestAnimationFrame(upd);}
  chatBadge();aiBriefing();};
R['p-home']=renderHome;

/* --- Eventi: barra delle sezioni e pagina principale a carte --- */
const EVT_G=[['sec-evt','Panoramica','list'],['s-ev','Programma e schede','doc'],['p-cal','Calendario','cal'],['s-cs','Simulazione impatto','flask'],['v-perc','Percorsi','route']];
const EVT_ID={'sec-evt':1,'s-ev':1,'s-cs':1,'v-perc':1};
function evtBar(id){const vis=EVT_G.filter(([k])=>canOpen(k));return h('<div class="ecobar"><nav class="ecotop" aria-label="Sezioni di Eventi">'+vis.map(([k,t,ic])=>'<button type="button" data-go="'+k+'"'+(k===id?' aria-current="page"':'')+'>'+svg(IC2[ic]||IC2.doc)+'<span>'+esc(t)+'</span></button>').join('')+'</nav></div>');}
const _addBack13=addBack;addBack=function(id){_addBack13(id);if(!EVT_ID[id])return;const el=document.getElementById(id);if(!el)return;const old=el.querySelector(':scope > .ecobar');if(old)old.remove();const b=evtBar(id);const back=el.querySelector(':scope > .back');if(back)back.after(b);else el.insertBefore(b,el.firstChild);};
let EVF='prossimi';
const PCOL={I:'#C9952A',II:'#2F63F0'};
function apriFiche(e){openState['ev'+e.id]=true;go('s-ev');setTimeout(()=>{const x=document.getElementById('fiche'+e.id);if(x)x.scrollIntoView({block:'start'});},80);}
function renderEventi13(){const el=document.getElementById('sec-evt');const E=allEv();const on=E.filter(evOn);const oggi=todayISO();
  const cI=on.filter(e=>e.p==='I'),cII=on.filter(e=>e.p==='II');const costo=A=>A.reduce((a,e)=>a+evCost(e),0);
  const st=e=>(e.custom?e.st:evS(e.id).st);const conf=E.filter(e=>st(e)==='ok').length;
  const d0=e=>(evDays(e)||[])[0]||'9999';
  let L=E.filter(e=>!e.fuori);if(EVF==='I'||EVF==='II')L=L.filter(e=>e.p===EVF);else if(EVF==='prossimi')L=L.filter(e=>evOn(e)&&(evDays(e)||[]).some(d=>d>=oggi));
  L.sort((a,b)=>d0(a).localeCompare(d0(b)));
  const SE=VD['s-ev']||[];const can=CTX.canEdit('s-ev');
  const cards=L.slice(0,60).map(e=>{const days=evDays(e)||[];const dd=new Date(days[0]+'T12:00:00');const on1=evOn(e);
    const rec=SE.find(x=>x.dati.evid===String(e.id));const d=rec?rec.dati:{};
    return {n:e.n,t:dd.toLocaleDateString('it-IT',{day:'numeric',month:'long'}),c:on1?(PCOL[e.p]||'#2F63F0'):'#94A3C0',ic:e.p==='I'?'B':'PW',k:(e.p==='I'?'La Bruna':'Passion Week')+(days.length>1?' · '+days.length+' giorni':''),tg:!on1?'Escluso':st(e)==='ok'?'Confermato':'',
      s:[e.luogo||'',on1?km(evCost(e))+' €':''].filter(Boolean).join(' · '),lab:e.n,
      det:box=>{box.innerHTML=(e.desc?'<p style="margin:0 0 8px">'+esc(e.desc)+'</p>':'')+righe([['Date',esc(typeof dLab==='function'?dLab(days):days.join(', '))],e.ora?['Orario',esc(e.ora)]:null,['Luogo',esc(e.luogo||'—')],['Programma',e.p==='I'?'La Bruna':'Passion Week'],['Costo',on1?eur(evCost(e)):'escluso dalla previsione'],['Stato',st(e)==='ok'?'confermato':'da confermare']]);
        bottoni(box,[['Apri la scheda',()=>schedaEvento(e),true],['Scheda tecnica',()=>apriFiche(e)],can?['Cosa serve?',()=>cosaServe(e)]:null,canOpen('s-cs')?['Simula l’impatto',()=>go('s-cs')]:null]);},
      sideLab:'Percorso, persone e fornitori',side:box=>{const P=typeof vperc==='function'?vperc():[];const pc=d.percorso&&P.find(x=>x.id===d.percorso);
        box.innerHTML=righe([['Percorso',pc?esc(pc.dati.nome):'nessuno'],['Responsabile',d.resp?esc(nome(d.resp)):'—']])+((d.fornitori||[]).length?'<p class="b26lab" style="margin:10px 0 4px">Fornitori</p>'+d.fornitori.map(f=>'<div class="c12li"><span class="chip2">'+esc(f.stato||'')+'</span><span>'+esc(f.servizio)+'<small>'+esc(f.fornitore||'da trovare')+'</small></span><b>'+(f.importo?eur(+f.importo):'')+'</b></div>').join(''):'');
        if(pc&&canOpen('v-perc')){const b=h('<button type="button" class="lnk2">Apri il percorso ›</button>');b.addEventListener('click',()=>go('v-perc'));box.appendChild(b);}}};});
  cartePagina(el,{id:'sec-evt',ey:'Eventi 2027',title:'Eventi',sub:'Dal 15 maggio al 15 agosto 2027. Tocca una carta per i dettagli.',
    sum:[['gold','★','La Bruna · '+cI.length+' eventi',km(costo(cI))+' €'],['eq','◆','Passion Week · '+cII.length+' eventi',km(costo(cII))+' €'],['in','✓','Confermati',conf+' su '+E.length],['out','€','Costo totale',eur(costo(on))]],
    note:'Corpus Sacro: <b>29 giugno – 3 luglio</b>. Alla Bruna mancano <b>'+countdown()+' giorni</b>.',sumBtn:canOpen('p-cal')?[['Calendario completo',()=>go('p-cal')]]:null,
    mini:[['Eventi',String(on.length)],['Confermati',conf+'/'+E.length],['Costo',km(costo(on))+' €']],
    actions:[can?['+ Crea un evento',()=>go('v-crea'),true]:null,canOpen('s-ev')?['Programma e schede',()=>go('s-ev')]:null].filter(Boolean),
    seg:{on:EVF,list:[['prossimi','Prossimi'],['I','La Bruna'],['II','Passion Week'],['tutti','Tutti']],set:v=>EVF=v},vuoto:'Nessun evento in questa scelta.',cards});
  const old=el.querySelector(':scope > .ecobar');if(old)old.remove();el.insertBefore(evtBar('sec-evt'),el.firstChild);}
const _renderSec13=renderSec;renderSec=function(s){if(s.k==='evt')return renderEventi13();return _renderSec13(s);};
