// Entrada de Netlify (API moderno). La lógica está en lib/handlers/get-talent-pool.js.
import mod from "./lib/handlers/get-talent-pool.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
