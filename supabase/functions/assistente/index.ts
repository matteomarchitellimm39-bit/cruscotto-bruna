// Bruna27 · assistente (intelligenza artificiale). La chiave resta qui sul server: il sito non la vede mai.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const risposta = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SISTEMA =
  "Sei l'assistente di Bruna27, la piattaforma di lavoro dell'Associazione Maria SS. della Bruna di Matera, " +
  "che organizza la Festa della Bruna del 2 luglio. Scrivi sempre in italiano semplice, con frasi brevi, adatte anche a persone anziane. " +
  "Niente elenchi lunghi, niente termini tecnici, niente parole inglesi, niente emoji. Non inventare fatti, cifre, nomi o date che non ti vengono dati.";
const SEZIONI =
  "Economia (bilancio 2026, previsione 2027, fatture, preventivi, fornitori), Eventi (calendario, percorsi, simulazione impatto), " +
  "Commerciale (sponsor, spazi in vendita), Sicurezza (mappa e presenze, percorsi da convalidare, planimetrie), " +
  "Amministrazione (protocollo, autorizzazioni, richieste di documenti), Richieste del Presidente, Riunioni, Il mio spazio.";
const LIMITE_GIORNO = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return risposta({ error: "accesso" }, 401);
  const { data: prof } = await admin.from("profili").select("id,nome").eq("id", u.user.id).maybeSingle();
  if (!prof) return risposta({ error: "accesso" }, 403);

  const chiave = Deno.env.get("ANTHROPIC_API_KEY");
  const body = await req.json().catch(() => ({}));
  if (body.tipo === "stato") return risposta({ attivo: !!chiave });
  if (!chiave) return risposta({ error: "chiave" });

  const oggi = new Date().toISOString().slice(0, 10);
  const { data: uso } = await admin.from("ai_uso").select("n").eq("user_id", prof.id).eq("giorno", oggi).maybeSingle();
  if ((uso?.n || 0) >= LIMITE_GIORNO) return risposta({ error: "limite" });
  await admin.from("ai_uso").upsert({ user_id: prof.id, giorno: oggi, n: (uso?.n || 0) + 1 });

  let domanda = "";
  let contenuto: unknown = null;
  let massimo = 500;
  if (body.tipo === "briefing") {
    domanda = "Scrivi il riassunto della giornata per " + (prof.nome || "il collaboratore") +
      " in due o tre frasi, partendo solo da questi fatti in JSON. Metti per prima la cosa più urgente. " +
      "Se non c'è nulla di urgente dillo con calma.\n\n" + JSON.stringify(body.fatti ?? {}).slice(0, 6000);
    massimo = 250;
  } else if (body.tipo === "riassunto") {
    domanda = "Riassumi questo documento in al massimo sei frasi brevi: di cosa parla, chi è coinvolto, cifre e date importanti, " +
      "cosa bisogna fare. Se il testo è illeggibile o vuoto, dillo.\n\nNome del file: " + String(body.nome || "").slice(0, 200) +
      "\n\nTesto:\n" + String(body.testo || "").slice(0, 15000);
    massimo = 600;
  } else if (body.tipo === "richiesta") {
    const { data: r } = await admin.from("richieste").select("*").eq("id", body.id).maybeSingle();
    if (!r) return risposta({ error: "richiesta" }, 404);
    domanda = "Il Presidente ha fatto questa richiesta ai collaboratori.\nTitolo: " + r.titolo + "\nDettagli: " + (r.testo || "nessuno") +
      (r.entro ? "\nDa consegnare entro: " + r.entro : "") + "\n\nLa piattaforma ha queste sezioni: " + SEZIONI +
      '\n\nScrivi un consiglio pratico in quattro parti, ognuna di una o due frasi, con questi titoli esatti su righe separate: ' +
      '"Cosa fare", "Cosa evitare", "Chi coinvolgere", "Primo passo". Indica dove trovare le cose nella piattaforma quando serve.';
  } else if (body.tipo === "fattura") {
    const img = String(body.img || "");
    if (!img || img.length > 4_000_000) return risposta({ error: "immagine" }, 400);
    contenuto = [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: img } },
      { type: "text", text: "Questa è la foto o la scansione di una fattura o di un preventivo. L'Associazione Maria SS. della Bruna può essere il cliente (allora è un Costo) o chi emette (allora è un Ricavo). " +
        "Rispondi SOLO con un oggetto JSON con queste chiavi: soggetto (l'altra parte, non l'Associazione), tipo (\"Costo\" o \"Ricavo\"), importo (numero, totale da pagare, con il punto per i decimali), " +
        "data (AAAA-MM-GG), numero, scadenza (AAAA-MM-GG), nota (in poche parole cosa riguarda). Metti null dove non riesci a leggere con sicurezza. Non inventare." },
    ];
    massimo = 300;
  } else {
    return risposta({ error: "tipo" }, 400);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chiave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("MODELLO") || "claude-haiku-5-5",
      max_tokens: massimo,
      system: SISTEMA,
      messages: [{ role: "user", content: contenuto ?? domanda }],
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) return risposta({ error: "ai", dettaglio: out?.error?.message || String(res.status) });
  const testo = (out.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n").trim();
  if (body.tipo === "richiesta") {
    await admin.from("richieste").update({ consigli: testo, consigli_quando: new Date().toISOString() }).eq("id", body.id);
  }
  return risposta({ testo });
});
