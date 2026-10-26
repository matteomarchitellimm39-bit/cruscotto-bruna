// Bruna27 · gestione degli account (solo amministratori).
// Crea account con password temporanea, ne genera una nuova, disattiva e riattiva, mostra lo stato.
// Le password non vengono mai salvate in chiaro: la temporanea si mostra una volta sola all'amministratore.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const risposta = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// Password temporanea leggibile: tre gruppi di quattro caratteri senza lettere ambigue (es. Kp7m-Xq4r-Tz9w).
function temporanea() {
  const gruppi = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "abcdefghijkmnpqrstuvwxyz23456789"];
  const r = new Uint32Array(12);
  crypto.getRandomValues(r);
  const c = Array.from(r, (x, i) => gruppi[i % 4][x % gruppi[i % 4].length]);
  return c.slice(0, 4).join("") + "-" + c.slice(4, 8).join("") + "-" + c.slice(8).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return risposta({ error: "Accesso non valido" }, 401);
  const { data: me } = await admin.from("profili").select("id,email,admin,attivo,deve_cambiare").eq("id", u.user.id).maybeSingle();
  if (!me?.admin || me.attivo === false || me.deve_cambiare) return risposta({ error: "Solo gli amministratori possono gestire gli account" }, 403);
  const b = await req.json().catch(() => ({}));
  const annota = (cosa: string) => admin.from("registro").insert({ chi: me.id, email: me.email, area: "s-adm", cosa });

  if (b.azione === "elenco") {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return risposta({ error: error.message });
    return risposta({ utenti: data.users.map((x) => ({ id: x.id, email: x.email, ultimo_accesso: x.last_sign_in_at, bloccato_fino: (x as { banned_until?: string }).banned_until || null })) });
  }

  if (b.azione === "crea") {
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return risposta({ error: "Email non valida" });
    const permessi: Record<string, string> = {};
    for (const [k, v] of Object.entries(b.permessi || {})) if (v === "vedi" || v === "modifica") permessi[k] = v as string;
    if (b.presidente) permessi["_presidente"] = "si";
    const inv = await admin.from("inviti").upsert({ email, nome: String(b.nome || "").trim() || null, admin: !!b.admin, permessi, usato: false });
    if (inv.error) return risposta({ error: inv.error.message });
    const password = temporanea();
    const { data: nuovo, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return risposta({ error: /already/i.test(error.message) ? "Esiste già un account con questa email" : error.message });
    await admin.rpc("registra_temporanea", { uid: nuovo.user!.id });
    await annota("ha creato l'account di " + email);
    return risposta({ id: nuovo.user!.id, password });
  }

  const id = String(b.id || "");
  if (!id) return risposta({ error: "Manca la persona" });
  if (id === me.id && b.azione !== "reimposta") return risposta({ error: "Non puoi disattivare il tuo stesso account" });
  const { data: p } = await admin.from("profili").select("email").eq("id", id).maybeSingle();
  if (!p) return risposta({ error: "Persona non trovata" });

  if (b.azione === "reimposta") {
    const password = temporanea();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return risposta({ error: error.message });
    await admin.rpc("registra_temporanea", { uid: id });
    await annota("ha dato una nuova password temporanea a " + p.email);
    return risposta({ password });
  }
  if (b.azione === "disattiva" || b.azione === "riattiva") {
    const on = b.azione === "riattiva";
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: on ? "none" : "876000h" });
    if (error) return risposta({ error: error.message });
    await admin.from("profili").update({ attivo: on }).eq("id", id);
    await annota((on ? "ha riattivato " : "ha disattivato ") + p.email);
    return risposta({ ok: true });
  }
  return risposta({ error: "Azione sconosciuta" }, 400);
});
