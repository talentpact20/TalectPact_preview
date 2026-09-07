/**
 * build-schema — genera tfm/tech/supabase_bootstrap.sql
 *
 * El esquema vive repartido en cuatro archivos porque se fue construyendo por
 * capas (base -> auth -> empresas -> contacto), y ese historial es util para
 * entender por que esta cada cosa. Pero para levantar un proyecto de Supabase
 * desde cero lo comodo es un unico archivo que pegar: equivocarse en el ORDEN
 * de los cuatro es el fallo tipico, porque el de auth hace ALTER sobre tablas
 * que crea el primero.
 *
 * Se genera en vez de mantenerse a mano para que no se desincronice: la fuente
 * de verdad siguen siendo los cuatro archivos.
 *
 * Uso:  npm run schema:build
 */
const fs = require("fs");
const path = require("path");

const TECH = path.join(__dirname, "..");
const SALIDA = path.join(TECH, "supabase_bootstrap.sql");

// El orden importa: auth añade columnas a las tablas que crea el primero.
const PARTES = [
  ["supabase_schema.sql", "Base: perfiles, evaluaciones, credenciales y desbloqueos"],
  ["supabase_schema_auth.sql", "Cuentas: vincula los perfiles con Supabase Auth"],
  ["supabase_schema_companies.sql", "Empresas: fichas del portal de empresa"],
  ["supabase_schema_contact.sql", "Contacto: mensajes del formulario \"Hablemos\""]
];

const cabecera = `-- ============================================================================
-- TalentPact — Esquema completo para un proyecto de Supabase NUEVO
--
-- ARCHIVO GENERADO. No lo edites: cambia los archivos de origen y ejecuta
--   npm run schema:build
-- Fuente: ${PARTES.map((p) => p[0]).join(", ")}
--
-- Uso: crea el proyecto en Supabase (region UE), abre el SQL Editor, pega esto
-- entero y ejecuta. Es idempotente: volver a lanzarlo no rompe nada.
-- ============================================================================

`;

let salida = cabecera;
for (const [archivo, titulo] of PARTES) {
  const ruta = path.join(TECH, archivo);
  if (!fs.existsSync(ruta)) {
    console.error("  falta " + archivo + " — el esquema quedaria incompleto.");
    process.exit(1);
  }
  salida +=
    "\n-- ####################################################################\n" +
    "-- " + titulo + "\n" +
    "-- (origen: " + archivo + ")\n" +
    "-- ####################################################################\n\n" +
    fs.readFileSync(ruta, "utf8").trimEnd() + "\n";
}

fs.writeFileSync(SALIDA, salida, "utf8");
const tablas = (salida.match(/create table if not exists (\w+)/g) || []).map((m) => m.split(" ").pop());
console.log("");
console.log("  Generado: tfm/tech/supabase_bootstrap.sql");
console.log("  Tablas:   " + tablas.join(", "));
console.log("");
