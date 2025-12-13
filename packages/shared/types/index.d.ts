declare module '@aicomplyr/shared' {
  // Minimal shim to unblock downstream DTS builds.
  // Runtime code is in dist/, and strict typings can be restored later.

  export const DecisionStatus: any
  export const ActionType: any

  export const Tool: any
  export type Tool = any

  export const Actor: any
  export type Actor = any

  export const Context: any
  export type Context = any

  export const ToolUsageEvent: any
  export type ToolUsageEvent = any

  export const ConditionClause: any
  export type ConditionClause = any

  export type ConditionTree = any
  export const ConditionTree: any

  export const PolicyRule: any
  export type PolicyRule = any

  export const Verdict: any
  export type Verdict = any

  export const Suggestion: any
  export type Suggestion = any

  export const TelemetryAtom: any
  export type TelemetryAtom = any

  export function get(obj: any, path: string): any
}

