// Entrada de Netlify (API moderno). La lógica está en lib/handlers/list-jobs.js.
import mod from "./lib/handlers/list-jobs.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
