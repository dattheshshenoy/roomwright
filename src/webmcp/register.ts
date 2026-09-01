import { useEffect } from "react";
import type { ModelContext, ModelContextToolDescriptor } from "./modelContext";

/** Resolve whichever surface the current browser exposes. The canonical spec and
 *  ChatGPT's in-app browser use `document.modelContext`; earlier builds used
 *  `navigator.modelContext`, so probe document first and fall back. */
export function getModelContext(): ModelContext | null {
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  return null;
}

export const webmcpAvailable = () => getModelContext() !== null;

/** Register a set of tools for the lifetime of a component. Tools never outlive
 *  the view that owns them: WebMCP has no unregister call, so every tool is
 *  registered with one AbortSignal that we abort on cleanup. No-ops cleanly when
 *  WebMCP is absent. */
export function useWebMCPTools(tools: ModelContextToolDescriptor[]): void {
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __roomwright?: unknown }).__roomwright = { tools };
    }
    const ctx = getModelContext();
    if (!ctx) {
      console.info(
        "[webmcp] document.modelContext not found — Roomwright runs normally; " +
          "open in ChatGPT's in-app browser or Chrome with #enable-webmcp-testing to drive it with an agent.",
      );
      return;
    }

    const controller = new AbortController();
    for (const tool of tools) {
      try {
        Promise.resolve(ctx.registerTool(tool, { signal: controller.signal })).catch((err) =>
          console.error(`[webmcp] failed to register "${tool.name}"`, err),
        );
      } catch (err) {
        console.error(`[webmcp] failed to register "${tool.name}"`, err);
      }
    }

    return () => controller.abort();
    // Tool descriptors are module-static; register once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
