"""Prepara dati/iniziali.enc: i dati di partenza cifrati (AES-GCM, chiave da passphrase con PBKDF2).
Uso: python3 cifra_dati.py <cartella con data.json stato.json presenze.json> <passphrase> <file di uscita>"""
import json, os, sys, base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
base, pw, out = sys.argv[1], sys.argv[2], sys.argv[3]
D = json.load(open(os.path.join(base, 'data.json'), encoding='utf-8'))
cen = D.pop('cen2', []); D.pop('cen', None)
S = json.load(open(os.path.join(base, 'stato.json'), encoding='utf-8'))
P = json.load(open(os.path.join(base, 'presenze.json'), encoding='utf-8')).get('p', {})
AREA = {'vo':'s-pre','so':'s-pre','progetto':'s-pre','risp':'s-pre','rp':'s-pre','fondo':'s-fon','ro':'s-ric','crescita':'s-ric',
        'leve':'s-ric','target':'s-ric','leveInPrev':'s-ric','rc':'s-ter','carPct':'s-car','al':'s-car','ev':'s-ev','evc':'s-ev','cs':'s-cs'}
ch = {}
for k, v in S.items():
    if k in AREA: ch.setdefault(AREA[k], {})[k] = v
payload = {'dati': [{'pacchetto': 'economia', 'contenuto': D}, {'pacchetto': 'censimento', 'contenuto': {'cen2': cen}}],
           'stato': [{'area': a, 'contenuto': c} for a, c in ch.items()],
           'presenze': [{'id': i, 'dati': d} for i, d in P.items()]}
salt, iv = os.urandom(16), os.urandom(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=250000).derive(pw.encode())
ct = AESGCM(key).encrypt(iv, json.dumps(payload, ensure_ascii=False).encode(), None)
b = lambda x: base64.b64encode(x).decode()
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({'v': 1, 'iter': 250000, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}, open(out, 'w'))
print('ok', len(ct))
