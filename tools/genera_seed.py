"""(non più usato: i dati si importano dal sito con dati/iniziali.enc) Crea un file SQL dai dati del cruscotto (data.json) e dalle scelte già salvate."""
import json, sys, os
base = sys.argv[1]            # cartella con data.json, stato.json, presenze.json
out = sys.argv[2]
D = json.load(open(os.path.join(base, 'data.json'), encoding='utf-8'))
cen = D.pop('cen2', [])
D.pop('cen', None)
S = json.load(open(os.path.join(base, 'stato.json'), encoding='utf-8'))
P = json.load(open(os.path.join(base, 'presenze.json'), encoding='utf-8')).get('p', {})
AREA = {'vo':'s-pre','so':'s-pre','progetto':'s-pre','risp':'s-pre','rp':'s-pre','fondo':'s-fon','ro':'s-ric','crescita':'s-ric',
        'leve':'s-ric','target':'s-ric','leveInPrev':'s-ric','rc':'s-ter','carPct':'s-car','al':'s-car','ev':'s-ev','evc':'s-ev','cs':'s-cs'}
ch = {}
for k, v in S.items():
    if k in AREA: ch.setdefault(AREA[k], {})[k] = v
def q(o): return '$j$' + json.dumps(o, ensure_ascii=False) + '$j$::jsonb'
L = ['-- Dati di partenza del cruscotto. Da eseguire dopo 01-struttura.sql.',
     'insert into public.dati (pacchetto, contenuto) values (\'economia\', ' + q(D) + ') on conflict (pacchetto) do update set contenuto = excluded.contenuto, aggiornato = now();',
     'insert into public.dati (pacchetto, contenuto) values (\'censimento\', ' + q({'cen2': cen}) + ') on conflict (pacchetto) do update set contenuto = excluded.contenuto, aggiornato = now();']
for a, c in ch.items():
    L.append("insert into public.stato (area, contenuto) values ('%s', %s) on conflict (area) do nothing;" % (a, q(c)))
for i, d in P.items():
    L.append("insert into public.presenze (id, dati) values ('%s', %s) on conflict (id) do nothing;" % (i, q(d)))
open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('ok', len(L), 'righe')
