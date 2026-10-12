// Entrada de Netlify (API moderno). La lógica está en lib/handlers/save-evaluation.js.
import mod from "./lib/handlers/save-evaluation.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
