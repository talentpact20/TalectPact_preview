// Entrada de Netlify (API moderno). La lógica está en lib/handlers/anchor-batch.js.
// Función programada: cada noche publica la raíz de Merkle del lote del sello.
// ethers se importa aquí para que el empaquetador lo incluya en el zip.
import * as ethers from "ethers";
import tp from "./lib/tp.js";
import mod from "./lib/handlers/anchor-batch.js";
import { adaptar } from "./lib/adaptador.mjs";

tp.usarEthers(ethers);
export default adaptar(mod.handler);

// 00:05 UTC: el lote del día anterior.
export const config = { schedule: "5 0 * * *" };
