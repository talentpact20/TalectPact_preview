// Entrada de Netlify (API moderno). La lógica está en lib/handlers/status-list.js.
import mod from "./lib/handlers/status-list.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
