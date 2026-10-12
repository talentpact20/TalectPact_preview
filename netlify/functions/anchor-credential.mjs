// Entrada de Netlify (API moderno). La lógica está en lib/handlers/anchor-credential.js.
// ethers se importa aquí para que el empaquetador lo incluya en el zip
// (un require perezoso dentro de lib/ no lo ve) y se registra en lib/tp.js.
import * as ethers from "ethers";
import tp from "./lib/tp.js";
import mod from "./lib/handlers/anchor-credential.js";
import { adaptar } from "./lib/adaptador.mjs";

tp.usarEthers(ethers);
export default adaptar(mod.handler);
