// Entrada de Netlify (API moderno). La lógica está en lib/handlers/applications.js.
import mod from "./lib/handlers/applications.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
