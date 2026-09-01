import { useEffect } from "react";
import type { ModelContext, ModelContextToolDescriptor } from "./modelContext";

/** Resolve whichever surface the current browser exposes. The WebMCP spec is
 *  still moving between navigator.* and document.*, so probe both. */
export function getModelContext(): ModelContext | null {
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  return null;
}

export const webmcpAvailable = () => getModelContext() !== null;

/** Register a set of tools for the lifetime of a component. Tools never outlive
 *  the view that owns them. No-ops cleanly when WebMCP is absent. */
export function useWebMCPTools(tools: ModelContextToolDescriptor[]): void {
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __roomwright?: unknown }).__roomwright = { tools };
    }
    const ctx = getModelContext();
    if (!ctx) {
      console.info(
        "[webmcp] navigator.modelContext not found — Roomwright runs normally; " +
          "open in ChatGPT's in-app browser or Chrome with #enable-webmcp-testing to drive it with an agent.",
      );
      return;
    }

    for (const tool of tools) {
      try {
        void ctx.registerTool(tool);
      } catch (err) {
        console.error(`[webmcp] failed to register "${tool.name}"`, err);
      }
    }

    return () => {
      if (!ctx.unregisterTool) return;
      for (const tool of tools) {
        try {
          void ctx.unregisterTool(tool.name);
        } catch {
          /* best effort */
        }
      }
    };
    // Tool descriptors are module-static; register once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
