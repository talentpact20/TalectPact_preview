/**
 * contact — recoge los mensajes del formulario "Hablemos" (inversores/empresas).
 *
 * Sustituye a Netlify Forms, que capturaba el POST a "/" y no tiene equivalente
 * en Vercel. Ahora el formulario envía JSON aquí y el mensaje se guarda en
 * Supabase (tabla `contact_messages`, ver tfm/tech/supabase_schema_contact.sql).
 *
 * Body: { nombre, email, perfil?, mensaje?, botField? }
 */
const { jsonResponse, sb } = require("../_lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");

    // Honeypot: el campo va oculto por CSS, así que solo lo rellenan los bots.
    // Se responde 200 para no darles pistas, pero no se guarda nada.
    if (String(b.botField || "").trim()) return jsonResponse(200, { ok: true });

    const nombre = String(b.nombre || "").trim();
    const email = String(b.email || "").trim();
    if (!nombre || !email) {
      return jsonResponse(400, { error: "Nombre y email son obligatorios" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(400, { error: "El email no tiene un formato válido" });
    }

    await sb.insert("contact_messages", {
      name: nombre.slice(0, 200),
      email: email.slice(0, 200),
      profile_type: String(b.perfil || "").slice(0, 100) || null,
      message: String(b.mensaje || "").slice(0, 5000) || null
    });

    return jsonResponse(200, { ok: true });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo enviar el mensaje", details: err.message });
  }
};
