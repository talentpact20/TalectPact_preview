// Entrada de Netlify (API moderno). La lógica está en lib/handlers/unlock-free.js.
import mod from "./lib/handlers/unlock-free.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
