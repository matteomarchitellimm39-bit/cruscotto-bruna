// Bruna27 · assistente (intelligenza artificiale).
// La chiave resta qui sul server: il sito non la vede mai.
// Servizi possibili, in quest'ordine:
//   GEMINI_API_KEY    → Google Gemini, piano gratuito (Google AI Studio, senza carta di credito)
//   GROQ_API_KEY      → Groq, piano gratuito (solo testo: non legge le foto)
//   ANTHROPIC_API_KEY → Claude, a pagamento
// Basta impostarne uno nei Secrets della funzione. MODELLO (facoltativo) sceglie il modello.
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
  "Niente elenchi lunghi, niente termini tecnici, niente parole inglesi, niente emoji, niente formattazione markdown. " +
  "Usa solo i dati che ti vengono dati: non inventare fatti, cifre, nomi, date, fonti o approvazioni. " +
  "Se un dato manca, dillo. Distingui i fatti dalle tue ipotesi e dai consigli. Le decisioni restano alle persone responsabili.";
const SEZIONI =
  "Economia (bilancio 2026, previsione 2027, fatture, preventivi, fornitori), Eventi (calendario, percorsi, simulazione impatto), " +
  "Commerciale (sponsor, spazi in vendita), Sicurezza (mappa e presenze, percorsi da convalidare, planimetrie), " +
  "Amministrazione (protocollo, autorizzazioni, richieste di documenti), Richieste del Presidente, Riunioni, Il mio spazio.";
const LIMITE_GIORNO = 60;

type Domanda = { testo: string; immagine?: string; massimo: number; json?: boolean };

function servizio() {
  if (Deno.env.get("GEMINI_API_KEY")) return "gemini";
  if (Deno.env.get("GROQ_API_KEY")) return "groq";
  if (Deno.env.get("ANTHROPIC_API_KEY")) return "anthropic";
  return "";
}

async function chiedi(d: Domanda): Promise<{ testo?: string; errore?: string }> {
  const s = servizio();
  const modello = Deno.env.get("MODELLO") || "";
  if (s === "gemini") {
    const key = Deno.env.get("GEMINI_API_KEY")!;
    const parti: unknown[] = [];
    if (d.immagine) parti.push({ inline_data: { mime_type: "image/jpeg", data: d.immagine } });
    parti.push({ text: d.testo });
    const corpo = JSON.stringify({
      systemInstruction: { parts: [{ text: SISTEMA }] },
      contents: [{ role: "user", parts: parti }],
      generationConfig: { maxOutputTokens: Math.max(1024, d.massimo * 3), temperature: 0.3, ...(d.json ? { responseMimeType: "application/json" } : {}) },
    });
    // Se un modello non esiste più, prova il successivo.
    const modelli = [modello, "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.6-flash", "gemini-flash-latest"].filter(Boolean);
    let ultimo = "";
    for (const m of modelli) {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent", {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: corpo,
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) {
        const testo = (out.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("").trim();
        if (testo) return { testo };
        ultimo = "risposta vuota (" + (out.candidates?.[0]?.finishReason || "") + ")";
        continue;
      }
      ultimo = out?.error?.message || String(res.status);
      if (res.status === 429) return { errore: "limite_gratuito" };
      if (res.status !== 404 && res.status !== 400) break;
    }
    return { errore: ultimo };
  }
  if (s === "groq") {
    if (d.immagine) return { errore: "Il servizio Groq non legge le foto: scrivi i dati a mano." };
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + Deno.env.get("GROQ_API_KEY") },
      body: JSON.stringify({
        model: modello || "openai/gpt-oss-120b", temperature: 0.3, max_tokens: Math.max(1024, d.massimo * 3),
        messages: [{ role: "system", content: SISTEMA }, { role: "user", content: d.testo }],
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.status === 429) return { errore: "limite_gratuito" };
    if (!res.ok) return { errore: out?.error?.message || String(res.status) };
    return { testo: (out.choices?.[0]?.message?.content || "").trim() };
  }
  if (s === "anthropic") {
    const contenuto = d.immagine
      ? [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: d.immagine } }, { type: "text", text: d.testo }]
      : d.testo;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: modello || "claude-haiku-5-5", max_tokens: d.massimo, system: SISTEMA, messages: [{ role: "user", content: contenuto }] }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return { errore: out?.error?.message || String(res.status) };
    return { testo: (out.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n").trim() };
  }
  return { errore: "chiave" };
}

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

  const body = await req.json().catch(() => ({}));
  if (body.tipo === "stato") return risposta({ attivo: !!servizio(), servizio: servizio(), foto: servizio() !== "groq" && !!servizio() });
  if (!servizio()) return risposta({ error: "chiave" });

  const oggi = new Date().toISOString().slice(0, 10);
  const { data: uso } = await admin.from("ai_uso").select("n").eq("user_id", prof.id).eq("giorno", oggi).maybeSingle();
  if ((uso?.n || 0) >= LIMITE_GIORNO) return risposta({ error: "limite" });
  await admin.from("ai_uso").upsert({ user_id: prof.id, giorno: oggi, n: (uso?.n || 0) + 1 });

  let d: Domanda;
  if (body.tipo === "briefing") {
    d = { massimo: 250, testo: "Scrivi il riassunto della giornata per " + (prof.nome || "il collaboratore") +
      " in due o tre frasi, partendo solo da questi fatti in JSON. Metti per prima la cosa più urgente. " +
      "Se non c'è nulla di urgente dillo con calma.\n\n" + JSON.stringify(body.fatti ?? {}).slice(0, 6000) };
  } else if (body.tipo === "riassunto") {
    d = { massimo: 600, testo: "Riassumi questo documento in al massimo sei frasi brevi: di cosa parla, chi è coinvolto, cifre e date importanti, " +
      "scadenze, cosa bisogna fare. Alla fine indica in una frase le informazioni che sembrano mancare. Se il testo è illeggibile o vuoto, dillo.\n\nNome del file: " +
      String(body.nome || "").slice(0, 200) + "\n\nTesto:\n" + String(body.testo || "").slice(0, 15000) };
  } else if (body.tipo === "richiesta") {
    const { data: r } = await admin.from("richieste").select("*").eq("id", body.id).maybeSingle();
    if (!r) return risposta({ error: "richiesta" }, 404);
    d = { massimo: 500, testo: "Il Presidente ha fatto questa richiesta ai collaboratori.\nTitolo: " + r.titolo + "\nDettagli: " + (r.testo || "nessuno") +
      (r.entro ? "\nDa consegnare entro: " + r.entro : "") + "\n\nLa piattaforma ha queste sezioni: " + SEZIONI +
      '\n\nScrivi un consiglio pratico in quattro parti, ognuna di una o due frasi, con questi titoli esatti su righe separate: ' +
      '"Cosa fare", "Cosa evitare", "Chi coinvolgere", "Primo passo". Indica dove trovare le cose nella piattaforma quando serve.' };
  } else if (body.tipo === "fattura") {
    const img = String(body.img || "");
    if (!img || img.length > 4_000_000) return risposta({ error: "immagine" }, 400);
    d = { massimo: 300, json: true, immagine: img, testo:
      "Questa è la foto o la scansione di una fattura o di un preventivo. L'Associazione Maria SS. della Bruna può essere il cliente (allora è un Costo) o chi emette (allora è un Ricavo). " +
      "Rispondi SOLO con un oggetto JSON con queste chiavi: soggetto (l'altra parte, non l'Associazione), tipo (\"Costo\" o \"Ricavo\"), importo (numero, totale da pagare, con il punto per i decimali), " +
      "data (AAAA-MM-GG), numero, scadenza (AAAA-MM-GG), nota (in poche parole cosa riguarda). Metti null dove non riesci a leggere con sicurezza. Non inventare." };
  } else if (body.tipo === "preventivi") {
    d = { massimo: 500, testo: "Confronta questi preventivi per la stessa voce del bilancio. Per ognuno hai prezzo, qualità dichiarata, tempi, provenienza, garanzie e note. " +
      "Scrivi in cinque o sei frasi quale conviene e perché, guardando non solo il prezzo. Indica cosa manca per decidere bene (per esempio servizi esclusi, condizioni di pagamento). " +
      "Chiudi ricordando che la scelta spetta alle persone autorizzate.\n\n" + JSON.stringify(body.offerte ?? []).slice(0, 8000) };
  } else if (body.tipo === "percorso") {
    d = { massimo: 500, testo: "Ecco i dati di un percorso di processione a Matera (tappe con coordinate, soste, orario, partecipanti fragili, punti della Sicurezza). " +
      "Fai un controllo preliminare della completezza: segnala informazioni mancanti, incoerenze tra soste e orari, punti da verificare per accessibilità, uscite, soccorsi, bagni. " +
      "Non dichiarare mai il percorso sicuro o conforme: le verifiche tecniche spettano ai responsabili. Al massimo sei frasi.\n\n" + JSON.stringify(body.percorso ?? {}).slice(0, 8000) };
  } else if (body.tipo === "bozza") {
    d = { massimo: 600, testo: "Prepara una bozza breve e cortese in italiano per questo scopo, firmata «Associazione Maria SS. della Bruna». Non inventare cifre o impegni.\n\n" +
      String(body.scopo || "").slice(0, 3000) };
  } else {
    return risposta({ error: "tipo" }, 400);
  }

  const r = await chiedi(d);
  if (r.errore === "limite_gratuito") return risposta({ error: "limite_gratuito" });
  if (r.errore === "chiave") return risposta({ error: "chiave" });
  if (r.errore || !r.testo) return risposta({ error: "ai", dettaglio: r.errore || "risposta vuota" });
  if (body.tipo === "richiesta") {
    await admin.from("richieste").update({ consigli: r.testo, consigli_quando: new Date().toISOString() }).eq("id", body.id);
  }
  return risposta({ testo: r.testo, servizio: servizio() });
});
