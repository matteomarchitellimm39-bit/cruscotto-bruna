// Bruna27 · manda sui telefoni le notifiche nuove. Viene chiamata dal database quando nasce una notifica.
// Chiunque la chiami fa solo partire le notifiche già in coda: non può scriverne di nuove.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

Deno.serve(async () => {
  const pub = Deno.env.get("VAPID_PUBLIC"), priv = Deno.env.get("VAPID_PRIVATE");
  if (!pub || !priv) return new Response("chiavi mancanti");
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:segreteria@example.org", pub, priv);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const da = new Date(Date.now() - 3600_000).toISOString();
  const { data: N } = await admin.from("notifiche").select("*").eq("inviata", false).gte("quando", da).limit(200);
  if (!N?.length) return new Response("niente da inviare");
  await admin.from("notifiche").update({ inviata: true }).in("id", N.map((n) => n.id));
  const chi = [...new Set(N.map((n) => n.per))];
  const { data: S } = await admin.from("push_iscrizioni").select("*").in("user_id", chi);
  const { data: PR } = await admin.from("preferenze").select("user_id,dati").in("user_id", chi);
  const muti: Record<string, string[]> = {};
  const nascosta: Record<string, boolean> = {};
  (PR || []).forEach((p) => { muti[p.user_id] = (p.dati && p.dati.muti) || []; nascosta[p.user_id] = !!(p.dati && p.dati.anteprima === "nascosta"); });
  // foto di chi ha generato la notifica (se non c'è, l'icona di Bruna27)
  const autori = [...new Set(N.map((n) => n.da).filter((x) => !!x))];
  const foto: Record<string, string> = {};
  if (autori.length) {
    const { data: PF } = await admin.from("profili").select("id,foto").in("id", autori);
    (PF || []).forEach((p) => { if (p.foto) foto[p.id] = p.foto; });
  }
  const categoria = (link: string) => { const l = link.split("#")[0]; return l === "v-psic" || l === "v-perc" ? "percorsi" : l; };
  let ok = 0;
  for (const n of N) {
    if ((muti[n.per] || []).includes(categoria(n.link || "p-home"))) continue;
    for (const s of (S || []).filter((x) => x.user_id === n.per)) {
      try {
        await webpush.sendNotification(s.dati, JSON.stringify({
          titolo: n.titolo || "Bruna27",
          testo: nascosta[n.per] ? ((n.link || "").startsWith("p-chat") ? "Nuovo messaggio" : "Apri Bruna27 per i dettagli.") : n.testo,
          link: n.link || "p-home", nid: n.id, urgente: n.priorita === "urgente", tag: n.link || "p-home",
          icon: (n.da && foto[n.da]) || null,
        }), { urgency: n.priorita === "urgente" ? "high" : "normal" });
        ok++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from("push_iscrizioni").delete().eq("id", s.id);
      }
    }
  }
  return new Response("inviate " + ok);
});
