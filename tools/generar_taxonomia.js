#!/usr/bin/env node
/**
 * Genera assets/js/app/01b-taxonomia.js a partir de netlify/functions/lib/taxonomia.json,
 * que es la única fuente de verdad del vocabulario (áreas, sectores, nombres de skills).
 * Uso: node tools/generar_taxonomia.js   (o npm run taxonomia)
 * tests/taxonomia.test.js falla si el fichero del navegador no coincide.
 */
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const ORIGEN = path.join(RAIZ, "netlify/functions/lib/taxonomia.json");
const DESTINO = path.join(RAIZ, "assets/js/app/01b-taxonomia.js");

function generar() {
  const datos = JSON.parse(fs.readFileSync(ORIGEN, "utf8"));
  delete datos._nota;
  return `// TalentPact · 01b-taxonomia — GENERADO por tools/generar_taxonomia.js: no editar a mano.
// Fuente: netlify/functions/lib/taxonomia.json. Área funcional = el puesto; sector = la empresa.
// Script clásico: ámbito global compartido (ver assets/js/README.md).
var TP_TAXONOMIA=${JSON.stringify(datos)};
function tpArea(id){return TP_TAXONOMIA.areas.find(a=>a.id===id)||null;}
/** Área de una oferta: la suya o la deducida del sector antiguo (IT, Data, Sales…). */
function tpAreaDeOferta(j){if(j&&tpArea(j.area))return j.area;const l=j&&j.sector;return Object.prototype.hasOwnProperty.call(TP_TAXONOMIA.legadoAArea,l)?TP_TAXONOMIA.legadoAArea[l]:null;}
function tpAreaNombre(id,corto){const a=tpArea(id);return a?(corto?a.corto:a.nombre):'';}
function tpSectorNombre(id){const s=TP_TAXONOMIA.sectores.find(x=>x.id===id);return s?s.nombre:(id||'');}
/** Nombre visible de una skill (en español, mayúscula solo inicial). La clave guardada no cambia. */
function tpSkillNombre(s){return TP_TAXONOMIA.nombreSkill[s]||s;}
function tpAreaDeSkill(s){return TP_TAXONOMIA.areaDeSkill[s]||null;}
/** ¿Coincide la búsqueda con la skill, por su clave o por su nombre visible? */
function tpSkillCoincide(s,q){q=String(q||'').toLowerCase();return String(s).toLowerCase().includes(q)||tpSkillNombre(s).toLowerCase().includes(q);}
`;
}

if (require.main === module) {
  fs.writeFileSync(DESTINO, generar());
  console.log("Generado " + path.relative(RAIZ, DESTINO));
}
module.exports = { generar, DESTINO };
