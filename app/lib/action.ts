export const ActionErrorKind = {
  Validation: "validation",
  Conflict: "conflict",
  NotFound: "not_found",
} as const;

export type ActionErrorKind = (typeof ActionErrorKind)[keyof typeof ActionErrorKind];

export interface ActionOk<T> {
  ok: true;
  payload: T;
}

export type ActionErr<K extends ActionErrorKind, D = never> = [D] extends [never]
  ? { ok: false; kind: K }
  : { ok: false; kind: K; payload: D };

export type ActionResult<TOk, TErr> = ActionOk<TOk> | TErr;

export const INTENT_FIELD = "intent" as const;

export const UNKNOWN_INTENT = "unknown_intent" as const;
