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
T = T[:i] + SAVE + '\n};\n' + T[j:]

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
rep("let cur='s-bil';", "let cur=TABS[0][0];")
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
rep('<button type="button" class="bb" id="edt" aria-pressed="false">✎ Modifica</button></div>',
    '<button type="button" class="bb" id="edt" aria-pressed="false">✎ Modifica</button><button type="button" class="bb soft" id="esci">Esci</button></div>')
# login: pagina completa
LOGIN = open(os.path.join(R, 'login.html'), encoding='utf-8').read()
rep('<div class="bgfx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>\n',
    '<div class="bgfx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>\n' + LOGIN + '\n<div id="app" hidden>\n')
rep('<div class="sticky" id="sticky" hidden><div class="in" id="stickyIn"></div></div>',
    '<div class="sticky" id="sticky" hidden><div class="in" id="stickyIn"></div></div>\n</div>')
HEAD = ('<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="robots" content="noindex,nofollow">\n')
T = T.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
k = T.index('<style>')
T = HEAD + T[:k] + T[k:T.index('</style>') + 8] + '\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.min.js"></script>\n<script src="config.js"></script>\n</head>\n<body>\n' + T[T.index('</style>') + 8:] + '\n<script src="accesso.js"></script>\n</body>\n</html>\n'
open(os.path.join(R, '..', 'index.html'), 'w', encoding='utf-8').write(T)
print('index.html scritto', len(T))
