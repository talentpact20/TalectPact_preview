#!/usr/bin/env node
/**
 * Genera assets/js/app/01b-taxonomia.js a partir de netlify/functions/lib/taxonomia.json,
 * que es la única fuente de verdad del vocabulario (áreas, sectores, competencias, nombres de skills).
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
/** Sector general (de los 12) al que pertenece un sector concreto, o null. */
function tpSectorGrupo(id){const g=TP_TAXONOMIA.sectores.find(s=>s.ampliados.some(x=>x.id===id));return g?g.id:null;}
function tpSectorNombre(id){for(const s of TP_TAXONOMIA.sectores){const x=s.ampliados.find(a=>a.id===id);if(x)return x.nombre;}return id||'';}
/** Nombre visible de una skill (en español, mayúscula solo inicial). La clave guardada no cambia. */
function tpSkillNombre(s){return TP_TAXONOMIA.nombreSkill[s]||s;}
function tpAreaDeSkill(s){return TP_TAXONOMIA.areaDeSkill[s]||null;}
function tpAreaConcretaDeSkill(s){return TP_TAXONOMIA.areaConcretaDeSkill[s]||null;}
/** ¿Coincide la búsqueda con la skill, por su clave o por su nombre visible? */
function tpSkillCoincide(s,q){q=String(q||'').toLowerCase();return String(s).toLowerCase().includes(q)||tpSkillNombre(s).toLowerCase().includes(q);}
/** Competencia del diccionario por id («04.1»), con su dimensión. */
function tpCompetencia(id){for(const d of TP_TAXONOMIA.dimensiones){const c=d.competencias.find(x=>x.id===id);if(c)return Object.assign({dimension:d.id},c);}return null;}
function tpCompetenciasDeSkill(s){return(TP_TAXONOMIA.competenciasDeSkill[s]||[]).map(tpCompetencia).filter(Boolean);}
/** Dimensión de una skill: la de su primera competencia, o la de la competencia con ese nombre. */
function tpDimensionDeSkill(s){const ids=TP_TAXONOMIA.competenciasDeSkill[s]||[];const n=String(s||'').trim().toLowerCase();return TP_TAXONOMIA.dimensiones.find(d=>ids.length?d.competencias.some(c=>c.id===ids[0]):d.competencias.some(c=>c.nombre.toLowerCase()===n))||null;}
/** Skills con reto que cubren alguna competencia del tipo de puesto, en el orden del paquete. */
function tpSkillsDePerfil(id){const p=TP_TAXONOMIA.perfilesPuesto.find(x=>x.id===id);if(!p)return[];const r=[];p.competencias.forEach(c=>Object.keys(TP_TAXONOMIA.competenciasDeSkill).forEach(s=>{if(TP_TAXONOMIA.competenciasDeSkill[s].includes(c)&&!r.includes(s))r.push(s);}));return r;}
`;
}

if (require.main === module) {
  fs.writeFileSync(DESTINO, generar());
  console.log("Generado " + path.relative(RAIZ, DESTINO));
}
module.exports = { generar, DESTINO };
