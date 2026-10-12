// Entrada de Netlify (API moderno). La lógica está en lib/handlers/admin-metrics.js.
import mod from "./lib/handlers/admin-metrics.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
