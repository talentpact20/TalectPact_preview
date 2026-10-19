// Entrada de Netlify (API moderno). La lógica está en lib/handlers/retos-intento.js.
import mod from "./lib/handlers/retos-intento.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
