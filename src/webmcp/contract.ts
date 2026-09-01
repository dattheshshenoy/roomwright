import type { ModelContextToolDescriptor, ModelContextToolResult } from "./modelContext";
import { useStore } from "../state/store";

export interface RunResult {
  ok: boolean;
  /** one-line summary for the agent activity log */
  summary: string;
  /** full payload returned to the agent (stringified) */
  payload?: unknown;
}

/** Wrap a tool's logic so every call is logged to the agent activity feed and
 *  the result is shaped for the WebMCP runtime. `run` is synchronous — the store
 *  mutations it calls are synchronous. */
export function defineTool<A extends Record<string, unknown>>(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  run: (args: A) => RunResult,
): ModelContextToolDescriptor {
  return {
    name,
    description,
    inputSchema,
    execute: async (rawArgs) => {
      const args = (rawArgs ?? {}) as A;
      let result: RunResult;
      try {
        result = run(args);
      } catch (err) {
        result = { ok: false, summary: `${name} failed: ${(err as Error).message}` };
      }

      useStore.getState().pushLog({
        tool: name,
        args,
        ok: result.ok,
        summary: result.summary,
      });

      const text =
        result.payload !== undefined
          ? `${result.summary}\n\n${JSON.stringify(result.payload, null, 2)}`
          : result.summary;

      return {
        content: [{ type: "text", text }],
        isError: !result.ok,
      } satisfies ModelContextToolResult;
    },
  };
}

export const M2 = (n: number) => Math.round(n * 100) / 100;
export const DEG = (rad: number) => Math.round((rad * 180) / Math.PI);
export const RAD = (deg: number) => (deg * Math.PI) / 180;
