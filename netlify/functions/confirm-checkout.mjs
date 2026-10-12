// Entrada de Netlify (API moderno). La lógica está en lib/handlers/confirm-checkout.js.
// stripe se importa aquí para que el empaquetador lo incluya en el zip
// (un require perezoso dentro de lib/ no lo ve) y se registra en lib/tp.js.
import Stripe from "stripe";
import tp from "./lib/tp.js";
import mod from "./lib/handlers/confirm-checkout.js";
import { adaptar } from "./lib/adaptador.mjs";

tp.usarStripe(Stripe);
export default adaptar(mod.handler);
