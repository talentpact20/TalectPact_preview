// Entrada de Netlify (API moderno). La lógica está en lib/handlers/admin-solicitudes.js.
import mod from "./lib/handlers/admin-solicitudes.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
