/**
 * test-supabase — prueba de extremo a extremo de la capa de datos.
 *
 * Ejercita el MISMO código que usan las funciones serverless (lib/tp.js) contra
 * el Supabase real: crea un candidato de prueba, guarda evaluaciones, compone
 * su SkillPass CV y lo persiste. Al terminar borra todo lo que ha creado.
 *
 * No toca la blockchain: solo comprueba que la persistencia funciona.
 *
 * Uso:  npm run test:supabase
 */
const { loadDotEnv, env } = require("./lib-env");
loadDotEnv();

const tp = require("../../../netlify/functions/lib/tp");
const { sb, ensureProfileByUser, hashCv, CHAIN } = tp;

const TEST_SKILL = "__test__SQL";
let created = { profileId: null, userId: null };
const steps = [];

function step(name, detail) {
  steps.push({ ok: true, name, detail });
  console.log("  [ok]   " + name + (detail ? " — " + detail : ""));
}
function bad(name, detail) {
  steps.push({ ok: false, name, detail });
  console.log("  [FALLA] " + name + (detail ? " — " + detail : ""));
}

/** DELETE directo: lib/tp.js solo expone select/insert/update. */
async function remove(table, query) {
  const url = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_KEY");
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: { apikey: key, authorization: `Bearer ${key}` }
  });
  if (!res.ok) throw new Error(`DELETE ${table} -> ${res.status}: ${await res.text()}`);
}

async function run() {
  // 0. Configuracion
  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_KEY")) {
    console.log("\n  Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en el .env.");
    console.log("  Supabase -> Project Settings -> API -> service_role key.\n");
    process.exit(1);
  }
  console.log("\n  Prueba de la capa de datos contra " + env("SUPABASE_URL") + "\n");

  const userId = require("crypto").randomUUID();
  created.userId = userId;

  // 1. Alta de perfil (lo que hace save-profile en el registro)
  const profile = await ensureProfileByUser(userId, {
    email: "prueba+" + userId.slice(0, 8) + "@talentpact.test",
    full_name: "Candidato De Prueba",
    sector: "Tecnologia"
  });
  if (!profile || !profile.id) throw new Error("ensureProfileByUser no devolvio perfil");
  created.profileId = profile.id;
  step("perfil creado", profile.id);

  // El alias publico no debe filtrar datos personales.
  if (/prueba\+|@|Candidato De Prueba/.test(profile.display_name || "")) {
    bad("alias anonimo", "display_name expone datos personales: " + profile.display_name);
  } else {
    step("alias anonimo", profile.display_name);
  }
  if (profile.full_name !== "Candidato De Prueba") bad("datos de perfil guardados", "full_name = " + profile.full_name);
  else step("datos de perfil guardados", "full_name y sector persistidos");

  // 2. Idempotencia: segunda llamada = mismo perfil, no uno nuevo
  const again = await ensureProfileByUser(userId);
  if (again.id !== profile.id) bad("idempotencia", "se creo un perfil duplicado: " + again.id);
  else step("idempotencia", "la segunda llamada reutiliza el perfil");

  // 3. Evaluaciones (lo que hace save-evaluation tras la correccion IA)
  for (const [challengeId, score] of [["reto-test-1", 62], ["reto-test-2", 88]]) {
    await sb.insert("evaluations", {
      profile_id: profile.id,
      challenge_id: challengeId,
      skill: TEST_SKILL,
      score,
      criteria: [{ name: "Claridad", score, comment: "prueba automatica" }],
      reasoning: "Cadena de razonamiento de prueba (trazabilidad AI Act).",
      model_used: "claude-sonnet-4-6",
      tokens_in: 100,
      tokens_out: 50,
      cost_eur: 0.002
    });
  }
  step("evaluaciones guardadas", "2 intentos con metadatos de IA");

  // 4. Lectura de progreso (lo que hace get-progress)
  const evals = await sb.select(
    "evaluations",
    `profile_id=eq.${profile.id}&select=skill,score,challenge_id,created_at&order=created_at.asc`
  );
  if (!Array.isArray(evals) || evals.length !== 2) {
    bad("lectura de progreso", "se esperaban 2 evaluaciones, hay " + (evals || []).length);
  } else {
    const best = Math.max(...evals.map((e) => e.score));
    if (best !== 88) bad("mejor score por skill", "salio " + best + " en vez de 88");
    else step("lectura de progreso", "mejor score por skill = 88 (correcto)");
  }

  // 5. Emision de credencial (lo que hace issue-credential, sin anclar)
  const cvJson = {
    type: "TalentPactSkillPass",
    version: "1.0",
    subject: `did:talentpact:candidate:${profile.id}`,
    issuer: "did:talentpact:issuer",
    issuedAt: new Date().toISOString(),
    skills: [{ skill: TEST_SKILL, score: 88, challengeId: "reto-test-2", evaluatedAt: evals[1].created_at }],
    evaluator: { engine: "TalentPact AI Evaluator", method: "Dynamic Prompting + Chain of Thought" }
  };
  const cvHash = hashCv(cvJson);
  if (!/^0x[0-9a-f]{64}$/.test(cvHash)) bad("hash del CV", "formato inesperado: " + cvHash);
  else step("hash del CV calculado", cvHash.slice(0, 18) + "…");

  const cred = await sb.insert("credentials", {
    profile_id: profile.id,
    cv_json: cvJson,
    cv_hash: cvHash,
    chain: CHAIN.slug
  });
  const credRow = Array.isArray(cred) ? cred[0] : cred;
  step("credencial persistida", credRow.id);

  // 6. El indice unico sobre cv_hash debe impedir duplicados
  try {
    await sb.insert("credentials", { profile_id: profile.id, cv_json: cvJson, cv_hash: cvHash, chain: CHAIN.slug });
    bad("unicidad de cv_hash", "se admitio una credencial duplicada");
  } catch (_e) {
    step("unicidad de cv_hash", "el duplicado se rechaza (correcto)");
  }

  // 7. Reproducibilidad del hash: mismo CV -> mismo hash
  if (hashCv(JSON.parse(JSON.stringify(cvJson))) !== cvHash) bad("hash reproducible", "el mismo CV dio hashes distintos");
  else step("hash reproducible", "canonicalizacion estable");
}

async function cleanup() {
  if (!created.profileId) return;
  try {
    // El borrado del perfil arrastra evaluaciones y credenciales (on delete cascade).
    await remove("profiles", `id=eq.${created.profileId}`);
    const left = await sb.select("evaluations", `profile_id=eq.${created.profileId}&select=id`);
    if (Array.isArray(left) && left.length) bad("limpieza", "quedan " + left.length + " evaluaciones huerfanas");
    else step("limpieza", "perfil de prueba y datos asociados borrados (cascade)");
  } catch (e) {
    bad("limpieza", e.message + "  -> borra a mano el perfil " + created.profileId);
  }
}

(async () => {
  let fatal = null;
  try { await run(); } catch (e) { fatal = e; bad("ejecucion", e.message); }
  await cleanup();

  const fails = steps.filter((s) => !s.ok).length;
  console.log("");
  if (fatal || fails) {
    console.log(`  ${fails} comprobacion(es) fallida(s). Supabase NO esta correctamente conectado.\n`);
    if (fatal) console.log("  " + fatal.stack.split("\n").slice(0, 3).join("\n  ") + "\n");
    process.exit(1);
  }
  console.log(`  ${steps.length}/${steps.length} correctas. La capa de datos funciona de punta a punta.\n`);
})();
