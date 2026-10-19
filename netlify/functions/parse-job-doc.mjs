// Entrada de Netlify (API moderno). La lógica está en lib/handlers/parse-job-doc.js.
// El SDK de Anthropic se importa aquí para que el empaquetador lo incluya en el zip
// (un require perezoso dentro de lib/ no lo ve) y se registra en el handler.
import Anthropic from "@anthropic-ai/sdk";
import mod from "./lib/handlers/parse-job-doc.js";
import { adaptar } from "./lib/adaptador.mjs";

mod.usarAnthropic(Anthropic);
export default adaptar(mod.handler);
