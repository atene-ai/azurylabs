import * as gauge from "./gauge.mjs";
import * as governor from "./governor.mjs";
import * as press from "./press.mjs";
import * as rail from "./rail.mjs";
import * as ratchet from "./ratchet.mjs";
import * as recorder from "./recorder.mjs";

export const FIGURES = [press, gauge, governor, rail, recorder, ratchet];
