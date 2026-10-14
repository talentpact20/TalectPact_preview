// Entrada de Netlify (API moderno). La lógica está en lib/handlers/inbox.js.
import mod from "./lib/handlers/inbox.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
