"""Trasforma il cruscotto (tools/sorgente.html) nella piattaforma con login: scrive index.html."""
import os
R = os.path.dirname(os.path.abspath(__file__))
T = open(os.path.join(R, 'sorgente.html'), encoding='utf-8').read()
def rep(a, b, n=1):
    global T
    c = T.count(a)
    assert c == n, (c, a[:100])
    T = T.replace(a, b)

# --- avvio: i dati arrivano dal database, l'app parte dopo il login
rep('<script>\nconst D = __DATA__;\n</script>\n<script>\n(function(){\n"use strict";',
    '<script>\nwindow.APP=function(D,CTX){\n"use strict";')
i = T.index('/* ---------- salvataggio ---------- */'); j = T.index('</script>', i)
SAVE = open(os.path.join(R, 'salvataggio.js'), encoding='utf-8').read()
F1 = open(os.path.join(R, 'fase1.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase2.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase3.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase4.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase5.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase6.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase7.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase8.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase9.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase10.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase11.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase12.js'), encoding='utf-8').read() + '\n' + open(os.path.join(R, 'fase13.js'), encoding='utf-8').read()
assert SAVE.count('/* ---------- avvio ---------- */') == 1 and SAVE.count('\nshow(cur);\n') == 1
SAVE = SAVE.replace('/* ---------- avvio ---------- */', F1 + '\n/* ---------- avvio ---------- */').replace('\nshow(cur);\n', '\navviaF1();\n')
T = T[:i] + SAVE + '\n};\n' + T[j:]

# --- Fase 2: bilancio 2026 con voci eliminabili e aggiungibili
rep("ed:{},cs:{p:{}", "ed:{},bilx:{del:{},add:[]},cs:{p:{}")
rep("  D.bil.forEach(a=>{a.t=a.voci.reduce((s,v)=>s+(Number(v.v)||0),0);});",
    "  D.bil.forEach(a=>{a.voci=a.voci.filter(v=>!v._add);a.voci.forEach((v,i)=>{v.x=!!(S.bilx&&S.bilx.del&&S.bilx.del[a.id+'.'+i]);});});\n  ((S.bilx&&S.bilx.add)||[]).forEach(x=>{const A=D.bil.find(a=>a.id===x.a);if(A)A.voci.push({n:x.n,v:Number(x.v)||0,_add:x.id});});\n  D.bil.forEach(a=>{a.t=a.voci.reduce((s,v)=>s+(v.x?0:(Number(v.v)||0)),0);});")
rep("const voci=[];D.bil.forEach(a=>a.voci.forEach(", "const voci=[];D.bil.forEach(a=>a.voci.filter(v=>!v.x).forEach(")
rep("const vmax=Math.max(...a.voci.map(v=>v.v));", "const vmax=Math.max(1,...a.voci.filter(v=>!v.x).map(v=>v.v));")
rep("""a.voci.forEach((v,vi)=>{body+='<div class="row" data-ed="bilV:'+a.id+'.'+vi+'"><span class="n">'+esc(v.n)+'</span><span class="num">'+eur(v.v)+'</span><div class="d">'+bar(v.v,vmax)+'</div></div>';});""",
    """a.voci.forEach((v,vi)=>{if(v.x)return;body+='<div class="row"'+(v._add?'':' data-ed="bilV:'+a.id+'.'+vi+'"')+'><span class="n">'+esc(v.n)+(v._add?' <span class="badge">aggiunta</span>':'')+'</span><span class="num">'+eur(v.v)+'</span><div class="d">'+bar(v.v,vmax)+(CTX.canEdit('s-bil')?'<span class="bxw">'+(v._add?'<button type="button" data-baded="'+v._add+'">Modifica</button>':'')+'<button type="button" class="ko" data-bdel="'+(v._add?'n:'+v._add:a.id+'.'+vi)+'">Elimina</button></span>':'')+'</div></div>';});""")
rep("""body+='</div><div class="sub-h">Fornitori ('""", """body+='</div>';if(CTX.canEdit('s-bil'))body+='<div class="bxw"><button type="button" data-badd="'+a.id+'">+ Aggiungi una voce</button>'+(a.voci.some(v=>v.x)?'<button type="button" data-bres="'+a.id+'">Rimetti le voci eliminate</button>':'')+'</div>';body+='<div class="sub-h">Fornitori ('""")
rep("""pct(a.t/D.tot26*100)+' del totale · '+a.voci.length+' voci""", """pct(a.t/D.tot26*100)+' del totale · '+a.voci.filter(v=>!v.x).length+' voci""")

# --- schede visibili secondo i permessi, scheda amministratore
rep("['s-cs','Centro Studi','ricadute e simulatore','lab']];",
    "['s-cs','Centro Studi','ricadute e simulatore','lab']];\nTABS.forEach((t,i)=>t[4]=i+1);if(CTX.admin)TABS.push(['s-adm','Utenti e permessi','chi può vedere e modificare','users',11]);\nfor(let i=TABS.length-1;i>=0;i--){if(!CTX.canSee(TABS[i][0]))TABS.splice(i,1);}")
rep("lab:'<path", "users:'<circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20a6.5 6.5 0 0 1 13 0\"/><path d=\"M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5\"/>',lab:'<path")
rep("<span class=\"ll\">'+(i+1)+'. '+t[1]+'</span>", "<span class=\"ll\">'+t[4]+'. '+t[1]+'</span>")
rep("'+(i+1)+'. '+esc(t[1])+'", "'+t[4]+'. '+esc(t[1])+'")
rep("TABS.forEach((t,i)=>IDX.push({k:'Scheda',n:(i+1)+'. '+t[1]", "TABS.forEach((t,i)=>IDX.push({k:'Scheda',n:t[4]+'. '+t[1]")
rep('"s-cs": "Studi"}', '"s-cs": "Studi", "s-adm": "Utenti"}')
rep("'s-cs':renderCS};", "'s-cs':renderCS,'s-adm':renderAdm};")
rep('  <section id="s-cs" role="tabpanel" hidden></section>', '  <section id="s-cs" role="tabpanel" hidden></section>\n  <section id="s-adm" role="tabpanel" hidden></section>')
rep("let cur='s-bil';", "let cur='p-home';")
rep("function renderTop(){", "function renderTop(){\n  if(!CTX.eco){document.querySelector('.welcome').hidden=true;document.getElementById('sticky').hidden=true;return;}")
# matite di modifica solo dove si può modificare
rep("document.querySelectorAll('[data-ed]').forEach(el=>{if(el.querySelector(", "document.querySelectorAll('[data-ed]').forEach(el=>{if(!CTX.canEdit(edArea(el.dataset.ed)))return;if(el.querySelector(")
rep("if(!canWrite&&!editMode){", "if(!CTX.anyEdit&&!editMode){")
# conteggi della mappa su Supabase
i = T.index('function writePres(id,obj){'); j = T.index('function renderMap(){')
T = T[:i] + r'''function writePres(id,obj){
  if(!CTX.canEdit('s-map')){stEl.textContent='Puoi guardare la mappa, ma non modificarla.';return;}
  PRES[id]=Object.assign({},PRES[id]||{},obj);renderMap();
  presQ=presQ.then(async()=>{const {error}=await CTX.sb.from('presenze').upsert({id,dati:PRES[id],aggiornato:new Date().toISOString(),aggiornato_da:CTX.user.id});if(error)stEl.textContent='Non sono riuscito a salvare il conteggio: '+error.message;});
}
''' + T[j:]
rep("let PRES={},mapSel='vv',presRef=null,presCan=true,presQ=Promise.resolve();", "let PRES={},mapSel='vv',presQ=Promise.resolve();")
# pulsante Esci e nome
# --- Bruna27: menu a 5 sezioni, barra in alto con campanella e avatar
i = T.index('<nav class="side glass" id="tabs"'); j = T.index('</nav>', i) + 6
T = T[:i] + ('<nav class="b27side" aria-label="Menu"><button type="button" class="b27logo" data-go="p-home" aria-label="Home"><img src="logo-bruna.png" alt=""><b>Bruna<span>27</span></b></button><div id="navlist"></div></nav>'
  '<nav id="botnav" aria-label="Sezioni"></nav><div hidden><div role="tablist" id="tablist"></div><button type="button" id="sbm"></button></div>') + T[j:]
i = T.index('  <div class="topbar">'); j = T.index('</div>\n', i) + 7
T = T[:i] + ('  <div class="topbar"><button type="button" class="b27logo m" data-go="p-home" aria-label="Home"><img src="logo-bruna.png" alt=""><b>Bruna<span>27</span></b></button>'
  '<span class="status" id="status">Carico…</span><div class="tbr"><button type="button" class="bb soft" id="edt" aria-pressed="false">✎ Modifica</button>'
  '<button type="button" class="round" id="sbs" aria-label="Cerca"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button>'
  '<button type="button" class="round" id="bell" aria-label="Notifiche"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg><span id="bellN" hidden></span></button>'
  '<button type="button" class="round av" id="avt" data-go="p-me" aria-label="Il mio spazio">·</button><button type="button" id="esci" hidden>Esci</button></div></div>\n') + T[j:]
rep("  PLACES.forEach(p=>IDX.push({k:'Luogo sulla mappa'","  extraIDX(IDX);\n  PLACES.forEach(p=>IDX.push({k:'Luogo sulla mappa'")
rep('<span class="eyb">Scheda \'+n+\'</span>', '<span class="eyb">\'+eyb(n)+\'</span>')
rep("const tab=TABS.find(t=>t[0]===cur);", "const tab=[cur,pageTitle(cur)];")
rep('<title>Cruscotto Festa della Bruna</title>', '<title>Bruna27</title>')
CSS1 = open(os.path.join(R, 'fase1.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase2.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase3.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase4.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase7.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase8.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase9.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase10.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase11.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase12.css'), encoding='utf-8').read() + open(os.path.join(R, 'fase13.css'), encoding='utf-8').read()
k = T.index('</style>'); T = T[:k] + CSS1 + T[k:]
# login: pagina completa
LOGIN = open(os.path.join(R, 'login.html'), encoding='utf-8').read()
rep('<div class="bgfx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>\n',
    '<div class="bgfx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>\n' + LOGIN + '\n<div id="app" hidden>\n')
rep('<div class="sticky" id="sticky" hidden><div class="in" id="stickyIn"></div></div>',
    '<div class="sticky" id="sticky" hidden><div class="in" id="stickyIn"></div></div>\n</div>')
HEAD = ('<!doctype html>\n<html lang="it" data-theme="light">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="robots" content="noindex,nofollow">\n<meta name="theme-color" content="#F6F6F8">\n'
        '<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="icona-180.png"><link rel="icon" href="icona-192.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Bruna27"><meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">\n')
T = T.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
k = T.index('<style>')
T = HEAD + T[:k] + T[k:T.index('</style>') + 8] + '\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.min.js"></script>\n<script src="config.js"></script>\n</head>\n<body>\n' + T[T.index('</style>') + 8:] + '\n<script src="accesso.js"></script>\n</body>\n</html>\n'
open(os.path.join(R, '..', 'index.html'), 'w', encoding='utf-8').write(T)
print('index.html scritto', len(T))
