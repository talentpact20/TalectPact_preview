// Entrada de Netlify (API moderno). La lógica está en lib/handlers/revoke-credential.js.
import mod from "./lib/handlers/revoke-credential.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
