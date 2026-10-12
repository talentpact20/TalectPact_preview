// Entrada de Netlify (API moderno). La lógica está en lib/handlers/delete-account.js.
import mod from "./lib/handlers/delete-account.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
