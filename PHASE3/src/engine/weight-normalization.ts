import { PARAM_A, PARAM_B, PARAM_C } from "./eval-constants";

export interface StageParameters {
  connectionBase: number;
  connectionSecondary: number;
  connectionTertiary: number;
  patternOpen: number;
  patternBridge: number;
  doublePressure: number;
  indefensableAttack: number;
  fieldControl: number;
  posA: number;
  posB: number;
  activeScore: number;
}

export function getStageParameters(totalPieces: number): StageParameters {
  let p: number[];

  if (totalPieces >= 29) {
    p = PARAM_A;
  } else if (totalPieces >= 15) {
    p = PARAM_B;
  } else {
    p = PARAM_C;
  }

  return {
    connectionBase: p[1],
    connectionSecondary: p[2],
    connectionTertiary: p[3],
    patternOpen: p[10],
    patternBridge: p[6],
    doublePressure: p[8],
    indefensableAttack: p[9],
    fieldControl: p[12],
    posA: p[13],
    posB: p[14],
    activeScore: p[15],
  };
}
