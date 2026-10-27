/* ================= Bruna27 · Bilancio 2026 semplice: riassunto, carte colorate per area, dettaglio con un tocco ================= */
// Costi 2026 e Ricavi 2026 ora stanno dentro la pagina del Bilancio 2026 (le pagine restano raggiungibili dai collegamenti)
ECO_G[0].p=[['s-bil','Bilancio 2026']];ECO_ID['s-bil']=ECO_G[0];ECO_ID['s-c26']=ECO_G[0];ECO_ID['s-r26']=ECO_G[0];
const B26G=[['Sponsor',['r1','r2','r3','r4','r5'],'#2F63F0'],['Donazioni',['r6'],'#2A9D8F'],['Regione',['r15','r16'],'#182C6B'],['Comune, Provincia e altri enti',['r9','r10','r11','r12','r13','r14'],'#5AA0F2'],['Lotteria',['r7'],'#E2A23A'],['Servizi',['r8'],'#8A6CF0'],['Altro',['r17','r18','r19'],'#94A3C0']];
let B26V='spese',B26S=0;
function b26Dati(){if(B26V==='spese')return D.bil.map(a=>({id:a.id,n:a.n,t:a.t,c:ac(a.id),v:a.voci.map(v=>[v.n,v.v]),f:fornByArea(a.id).slice().sort((x,y)=>y.v-x.v)})).sort((a,b)=>b.t-a.t);
  return B26G.map(([n,ids,c])=>{const rr=D.ric.filter(r=>ids.includes(r.id)&&r.v26);return {n,c,t:rr.reduce((s,r)=>s+r.v26,0),v:rr.sort((a,b)=>b.v26-a.v26).map(r=>[r.n.replace(/^Regione · progetto /,'Progetto ').replace(/ \(Dip\. Sviluppo Economico\)/,''),r.v26]),f:[]};}).filter(g=>g.t>0).sort((a,b)=>b.t-a.t);}
const iniz11=s=>{const w=String(s).replace(/[^A-Za-zÀ-ÿ' ]/g,' ').split(/\s+/).filter(x=>/^[A-ZÀ-Ý]/.test(x));return (w.length?w.slice(0,2).map(x=>x[0]).join(''):String(s).charAt(0)).toUpperCase();};
const _renderBil11=R['s-bil'];
R['s-bil']=function(){if(typeof editMode!=='undefined'&&editMode)return _renderBil11();
  const el=document.getElementById('s-bil');el.innerHTML='';const res=D.ric26-D.tot26,deb=D.forn.reduce((s,f)=>s+(f.deb||0),0);
  const L=b26Dati();if(B26S>=L.length)B26S=0;const tot=L.reduce((a,x)=>a+x.t,0);const pc=v=>(tot?v/tot*100:0).toLocaleString('it-IT',{maximumFractionDigits:1})+'%';
  const w=h('<div class="b26"><aside class="b26sum"><div class="b26r"><span class="ar in">↑</span><span>Entrate</span><b>'+eur(D.ric26)+'</b></div><div class="b26r"><span class="ar out">↓</span><span>Spese</span><b>'+eur(D.tot26)+'</b></div><div class="b26r"><span class="ar eq">=</span><span>Risultato</span><b class="'+(res<0?'neg':'pos')+'">'+(res<0?'− ':'+ ')+eur(Math.abs(res))+'</b></div>'+
      '<p class="b26reg">Con i <b>280.000 €</b> della Regione il risultato diventa <b class="pos">'+(res+280000<0?'− ':'+ ')+eur(Math.abs(res+280000))+'</b></p><p class="b26deb">Ancora da pagare ai fornitori: <b>'+eur(deb)+'</b></p><button type="button" class="bb soft sm pdfx">⤓ Scarica in PDF</button></aside>'+
    '<div class="b26main"><div class="sh"><span class="eyb">Economia</span><h2>Bilancio 2026</h2><p>Tocca una carta per vedere come sono divisi i soldi.</p></div>'+
      '<div class="b26mini"><div><span>Entrate</span><b>'+eur(D.ric26)+'</b></div><div><span>Spese</span><b>'+eur(D.tot26)+'</b></div><div><span>Risultato</span><b class="'+(res<0?'neg':'pos')+'">'+(res<0?'−':'+')+eur(Math.abs(res))+'</b></div></div>'+
      '<div class="seg b26seg"><button type="button" data-v="spese" aria-pressed="'+(B26V==='spese')+'">Spese</button><button type="button" data-v="entrate" aria-pressed="'+(B26V==='entrate')+'">Entrate</button></div>'+
      '<div class="b26wrap"><button type="button" class="b26nav l" aria-label="Carte precedenti">‹</button><div class="b26cards" role="list">'+L.map((x,i)=>'<button type="button" role="listitem" class="b26cd'+(i===B26S?' on':'')+'" data-i="'+i+'" style="--c:'+x.c+'" aria-pressed="'+(i===B26S)+'"><span class="ic">'+esc(iniz11(x.n))+'</span><small>'+(B26V==='spese'?'Spese':'Entrate')+'</small><span class="nm">'+esc(x.n)+'</span><span class="am">'+eur(x.t)+'</span><span class="pc">'+pc(x.t)+' del totale</span></button>').join('')+'</div><button type="button" class="b26nav r" aria-label="Carte successive">›</button></div>'+
      '<div class="b26low"><div><p class="b26lab"></p><div class="b26box b26voci"></div></div><div class="b26fw"><p class="b26lab">Fornitori principali</p><div class="b26box"><div class="b26ppl"></div></div></div></div></div></div>');
  el.appendChild(w);
  const det=()=>{const x=L[B26S];if(!x)return;w.querySelector('.b26lab').textContent='Come sono divisi i '+eur(x.t)+' · '+x.n;
    w.querySelector('.b26voci').innerHTML=x.v.map(y=>'<div class="b26v" style="--c:'+x.c+'"><span>'+esc(y[0])+'<em>'+(x.t?Math.round(y[1]/x.t*100):0)+'%</em></span><b>'+eur(y[1])+'</b><i style="--w:'+(x.t?y[1]/x.t*100:0)+'%"></i></div>').join('')||'<p class="muted">Nessuna voce.</p>';
    const fw=w.querySelector('.b26fw');fw.hidden=B26V!=='spese';
    if(B26V==='spese'){const P=w.querySelector('.b26ppl');P.innerHTML=x.f.length?x.f.slice(0,6).map(f=>'<div class="b26p" style="--c:'+x.c+'"><span class="av">'+esc(iniz11(f.n))+'</span><span class="pn">'+esc(f.n)+'</span><b>'+eur(f.v)+'</b></div>').join(''):'<p class="muted" style="grid-column:1/-1;margin:0">Nessun fornitore: sono somme versate direttamente.</p>';
      if(x.f.length&&canOpen('s-for')){const b=h('<button type="button" class="lnk2 b26more">'+(x.f.length>6?'Vedi tutti i '+x.f.length+' fornitori':'Apri in Fornitori 2026')+' ›</button>');b.addEventListener('click',()=>{try{fa=x.id;}catch(e){}go('s-for');});P.appendChild(b);}}};
  w.querySelectorAll('.b26cd').forEach(b=>b.addEventListener('click',()=>{B26S=+b.dataset.i;w.querySelectorAll('.b26cd').forEach(z=>{const on=z===b;z.classList.toggle('on',on);z.setAttribute('aria-pressed',String(on));});det();try{b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});}catch(e){}}));
  w.querySelectorAll('.b26seg [data-v]').forEach(b=>b.addEventListener('click',()=>{B26V=b.dataset.v;B26S=0;R['s-bil']();addBack('s-bil');}));
  const cs=w.querySelector('.b26cards');const nl=w.querySelector('.b26nav.l'),nr=w.querySelector('.b26nav.r');
  const navUpd=()=>{nl.hidden=cs.scrollLeft<8;nr.hidden=cs.scrollLeft+cs.clientWidth>=cs.scrollWidth-8;};
  nl.addEventListener('click',()=>cs.scrollBy({left:-cs.clientWidth*.8,behavior:'smooth'}));nr.addEventListener('click',()=>cs.scrollBy({left:cs.clientWidth*.8,behavior:'smooth'}));
  cs.addEventListener('scroll',navUpd,{passive:true});requestAnimationFrame(navUpd);det();};
// in modalità Modifica torna la vista con gli importi modificabili
if(typeof setEdit==='function'){const _setEdit11=setEdit;setEdit=function(on){_setEdit11(on);if(/^s-/.test(cur)&&ECO_ID[cur])rerender();};}
