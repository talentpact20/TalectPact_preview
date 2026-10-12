// Entrada de Netlify (API moderno). La lógica está en lib/handlers/get-company.js.
import mod from "./lib/handlers/get-company.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
