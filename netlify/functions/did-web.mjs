// Entrada de Netlify (API moderno). La lógica está en lib/handlers/did-web.js.
import mod from "./lib/handlers/did-web.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
