# Piattaforma della Festa della Bruna

Piattaforma di lavoro dell'Associazione Maria SS. della Bruna: bilancio 2026, fornitori, fondo sociale, previsione 2027, carità, ricavi, ricadute sul territorio, calendario eventi, mappa di Matera e Centro Studi. Si entra con il login, e ogni persona vede e modifica solo le schede che le assegna l'amministratore.

## Come è fatta
- **Sito:** `index.html`, `accesso.js`, `config.js`, pubblicati con GitHub Pages.
- **Database, login e permessi:** Supabase. Le regole di sicurezza (Row Level Security) sono in `supabase/01-struttura.sql`: chi non ha il permesso non riceve i dati.
- **Dati di partenza:** `dati/iniziali.enc`, cifrati. Si importano una volta sola dal sito con la chiave di importazione.
- **Sorgente del cruscotto:** `tools/sorgente.html`. `python3 tools/costruisci.py` rigenera `index.html`.

## Messa in funzione (una volta sola)
1. **Supabase → SQL Editor → New query:** incolla tutto il contenuto di `supabase/01-struttura.sql` e premi **Run**.
2. **Supabase → Authentication → URL Configuration:**
   - *Site URL*: l'indirizzo del sito su GitHub Pages;
   - *Redirect URLs*: lo stesso indirizzo.
3. **GitHub → Settings → Pages:** *Source* = «Deploy from a branch», *Branch* = `main`, cartella `/ (root)`.
4. Apri il sito → **Primo accesso** → crea la password con l'email dell'amministratore → conferma l'email → **Entra**.
5. Al primo ingresso il sito chiede la **chiave di importazione** e carica i dati.

## Permessi
Scheda **11. Utenti e permessi** (solo amministratore):
- inviti una persona con la sua email;
- per ogni scheda scegli «Non vede», «Guarda» o «Modifica»;
- la persona apre il sito, sceglie **Primo accesso** e crea la sua password; chi non è invitato non può registrarsi;
- tutte le modifiche finiscono nel **Registro**.

Nota: le schede economiche usano gli stessi dati di base per i calcoli, quindi chi vede almeno una scheda economica riceve i dati economici di base; sullo schermo vede solo le schede permesse. Mappa e utenti sono separati.
