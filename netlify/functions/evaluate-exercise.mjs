// Entrada de Netlify (API moderno). La lógica está en lib/handlers/evaluate-exercise.js.
import mod from "./lib/handlers/evaluate-exercise.js";
import { adaptar } from "./lib/adaptador.mjs";

export default adaptar(mod.handler);
