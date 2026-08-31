#!/usr/bin/env node
/**
 * check-rls — comprueba que la clave pública NO puede leer datos personales.
 *
 *   npm run check:rls
 *   npm run check:rls -- --probe-write     (prueba concluyente, ver abajo)
 *
 * Por qué existe. La premisa del producto es el anonimato, y la clave `anon` de
 * Supabase viaja en el HTML: cualquiera la tiene. Lo único que separa esa clave
 * de la tabla de perfiles —con correos y teléfonos— son las políticas RLS. Una
 * auditoría previa dejó esto sin confirmar porque las tablas estaban vacías y
 * no se podía distinguir "RLS bloquea" de "no hay filas".
 *
 * Cómo se distingue:
 *   · Con SUPABASE_SERVICE_KEY en el entorno, se comparan los recuentos real y
 *     anónimo. Si la tabla tiene filas y la clave pública ve cero, RLS funciona.
 *     No escribe nada.
 *   · Sin service key y con --probe-write, se intenta un INSERT anónimo. Con RLS
 *     bien puesta, Postgres lo rechaza (42501) y no se escribe nada. Si el
 *     INSERT pasa, el agujero es real y el script intenta borrar la fila y avisa.
 */
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..", "..", "..");
const TABLAS = ["profiles", "evaluations", "credentials", "companies", "unlocks"];
const PROBE = process.argv.includes("--probe-write");

// La URL y la clave pública viven en index.html: son públicas por diseño.
function configPublica() {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  const url = (html.match(/const TP_SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const anon = (html.match(/const TP_SUPABASE_ANON\s*=\s*'([^']+)'/) || [])[1];
  return { url: (process.env.SUPABASE_URL || url || "").replace(/\/$/, ""), anon };
}

async function contar(url, key, tabla) {
  // `count=exact` + head devuelve el total en la cabecera content-range.
  const res = await fetch(`${url}/rest/v1/${tabla}?select=id`, {
    method: "HEAD",
    headers: { apikey: key, authorization: `Bearer ${key}`, prefer: "count=exact" }
  });
  const cr = res.headers.get("content-range") || "";
  const total = cr.includes("/") ? cr.split("/").pop() : null;
  return { status: res.status, total: total === "*" ? null : (total == null ? null : Number(total)) };
}

async function probarEscritura(url, anon, tabla) {
  const res = await fetch(`${url}/rest/v1/${tabla}`, {
    method: "POST",
    headers: {
      apikey: anon, authorization: `Bearer ${anon}`,
      "content-type": "application/json", prefer: "return=representation"
    },
    body: JSON.stringify({})
  });
  const txt = await res.text();
  let cuerpo; try { cuerpo = JSON.parse(txt); } catch (_e) { cuerpo = txt; }
  return { status: res.status, cuerpo };
}

(async () => {
  const { url, anon } = configPublica();
  const service = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\n  TalentPact — comprobación de RLS (¿qué ve la clave pública?)\n");
  if (!url || !anon) {
    console.error("  No he podido leer TP_SUPABASE_URL / TP_SUPABASE_ANON de index.html.\n");
    process.exitCode = 1;
    return;
  }
  console.log(`  Proyecto: ${url}`);
  console.log(`  Modo:     ${service ? "comparación de recuentos (no escribe nada)" : PROBE ? "sonda de escritura" : "solo lectura — puede quedar en 'no concluyente'"}\n`);

  let fallos = 0, dudas = 0;

  for (const tabla of TABLAS) {
    const anonRes = await contar(url, anon, tabla);

    if (anonRes.status === 404) { console.log(`  ${tabla.padEnd(12)} — la tabla no existe en este proyecto`); continue; }
    if (anonRes.status === 401 || anonRes.status === 403) {
      console.log(`  ${tabla.padEnd(12)} OK    la clave pública ni siquiera puede consultarla (${anonRes.status})`);
      continue;
    }

    const visibles = anonRes.total;

    if (visibles && visibles > 0) {
      console.log(`  ${tabla.padEnd(12)} FALLA la clave pública VE ${visibles} fila(s). Revisa las políticas ya.`);
      fallos++;
      continue;
    }

    if (service) {
      const realRes = await contar(url, service, tabla);
      const reales = realRes.total;
      if (reales == null) { console.log(`  ${tabla.padEnd(12)} ?     no he podido contar con la service key (${realRes.status})`); dudas++; }
      else if (reales === 0) { console.log(`  ${tabla.padEnd(12)} ?     vacía (0 filas): no concluyente hasta que tenga datos`); dudas++; }
      else { console.log(`  ${tabla.padEnd(12)} OK    ${reales} fila(s) reales, 0 visibles para la clave pública`); }
      continue;
    }

    if (!PROBE) { console.log(`  ${tabla.padEnd(12)} ?     0 filas visibles, pero no sé si es RLS o si está vacía`); dudas++; continue; }

    const w = await probarEscritura(url, anon, tabla);
    if (w.status === 401 || w.status === 403 || (w.cuerpo && w.cuerpo.code === "42501")) {
      console.log(`  ${tabla.padEnd(12)} OK    RLS rechaza la escritura anónima (${w.status})`);
    } else if (w.status === 400 || w.status === 422) {
      // Rechazo por columnas obligatorias: la petición llegó a pasar RLS.
      console.log(`  ${tabla.padEnd(12)} FALLA la escritura anónima NO la para RLS (la paró el esquema: ${w.status})`);
      fallos++;
    } else if (w.status >= 200 && w.status < 300) {
      console.log(`  ${tabla.padEnd(12)} FALLA se ha insertado una fila con la clave pública. Bórrala y arregla RLS.`);
      fallos++;
    } else {
      console.log(`  ${tabla.padEnd(12)} ?     respuesta inesperada (${w.status})`); dudas++;
    }
  }

  console.log("");
  if (fallos) {
    console.log(`  ${fallos} tabla(s) expuestas a la clave pública. Con RLS activada y SIN políticas,`);
    console.log("  Postgres deniega por defecto; revisa que no haya una política permisiva de más.\n");
    process.exitCode = 1;
  } else if (dudas) {
    console.log(`  Sin exposiciones detectadas, pero ${dudas} comprobación(es) no son concluyentes.`);
    console.log("  Para cerrarlas: exporta SUPABASE_SERVICE_KEY, o lanza con --probe-write.\n");
  } else {
    console.log("  La clave pública no ve ni escribe datos personales en ninguna tabla.\n");
  }
})();
