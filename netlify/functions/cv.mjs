// Entrada de Netlify (API moderno). La lógica está en lib/handlers/cv.js.
import mod from "./lib/handlers/cv.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
