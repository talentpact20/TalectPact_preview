// Entrada de Netlify (API moderno). La lógica está en lib/handlers/save-profile.js.
import mod from "./lib/handlers/save-profile.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
